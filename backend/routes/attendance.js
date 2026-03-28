import express from "express";
import Attendance from "../models/Attendance.js";
import { Session } from "../models/Session.js"; 
import User from "../models/User.js"; 

const router = express.Router();

router.post("/verify", async (req, res) => {
  const { passkey, studentId, branch, subject, section } = req.body;

  try {
    const activeSession = await Session.findOne({ 
      passkey, 
      branch, 
      subject, 
      section 
    });

    if (!activeSession) {
      return res.status(400).json({ error: "Invalid QR code or context mismatch" });
    }

    if (new Date() > activeSession.expiresAt) {
      return res.status(410).json({ error: "QR Code has expired!" });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const isCorrectBranch = student.branch === branch;
    const isCorrectSection = student.sections.includes(section);

    if (!isCorrectBranch || !isCorrectSection) {
      return res.status(403).json({
        error: `Access denied: You belong to ${student.branch}-${student.sections.join(', ')}, but this QR is for ${branch}-${section}.`
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const alreadyMarked = await Attendance.findOne({
      studentId,
      subject, 
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (alreadyMarked) {
      return res.status(400).json({ error: "Attendance already recorded for this subject today" });
    }

    await Attendance.create({
      studentId,
      usn: student.usn,        
      studentName: student.name,
      teacherId: activeSession.teacherId,
      subject, 
      section,
      branch,
      status: "Present",
      date: new Date()
    });

    res.status(200).json({ message: "Attendance marked successfully!" });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ error: "Server error during verification" });
  }
});

router.get("/list/:teacherId/:branch/:subject/:section", async (req, res) => {
  try {
    const { teacherId, branch, subject, section } = req.params;

    const allStudents = await User.find({ sections: section, branch });

    const todayStart = new Date().setHours(0, 0, 0, 0);
    const attendanceRecords = await Attendance.find({ 
      teacherId, 
      branch,
      subject, 
      section, 
      date: { $gte: new Date(todayStart) } 
    });

    const presentUSNs = new Set(attendanceRecords.map(rec => rec.usn));

    let combinedData = allStudents.map((student) => {
      const isPresent = presentUSNs.has(student.usn);
      return {
        Name: student.name || "N/A",
        USN: student.usn || "N/A",
        Status: isPresent ? "Present" : "Absent"
      };
    });

    combinedData.sort((a, b) => a.USN.localeCompare(b.USN, undefined, {
      numeric: true,
      sensitivity: 'base'
    }));

    const finalFormattedData = combinedData.map((item, index) => ({
      Sno: (index + 1).toString().padStart(2, '0'),
      ...item
    }));

    res.status(200).json(finalFormattedData);
  } catch (err) {
    console.error("Fetch List Error:", err);
    res.status(500).json({ error: "Failed to fetch list" });
  }
});

export default router;
