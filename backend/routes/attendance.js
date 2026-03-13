import express from "express";
import Attendance from "../models/Attendance.js";
import { Session } from "../models/Session.js"; 
import User from "../models/User.js"; 

const router = express.Router();

router.post("/verify", async (req, res) => {
  const { passkey, studentId } = req.body;

  try {
    const activeSession = await Session.findOne({ passkey });
    if (!activeSession) {
      return res.status(400).json({ error: "Invalid or expired QR code" });
    }

    if(new Date() > activeSession.expiresAt) {
      return res.status(410).json({ error: "QR Code has expired!" });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const isCorrectSection = student.sections.includes(activeSession.section);
    if (!isCorrectSection) {
      return res.status(403).json({
        error: `Access denied: This QR is for section ${activeSession.section}.`
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyMarked = await Attendance.findOne({
      studentId,
      subject: activeSession.subject, 
      date: { $gte: today }
    });

    if (alreadyMarked) {
      return res.status(400).json({ error: "Attendance already recorded for this subject today" });
    }

    await Attendance.create({
      studentId,
      usn: student.usn,        
      studentName: student.name,
      teacherId: activeSession.teacherId,
      subject: activeSession.subject, 
      section: activeSession.section,
      status: "Present",
      date: new Date()
    });

    res.status(200).json({ message: "Attendance marked successfully!" });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
});

router.get("/list/:teacherId/:subject/:section", async (req, res) => {
  try {
    const { teacherId, subject, section } = req.params;

    const allStudents = await User.find({ sections: section });

    const todayStart = new Date().setHours(0, 0, 0, 0);
    const attendanceRecords = await Attendance.find({ 
      teacherId, 
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

    // --- SORTING LOGIC CHANGED HERE ---
    // Sort by USN alphabetically/numerically
    combinedData.sort((a, b) => a.USN.localeCompare(b.USN, undefined, {
      numeric: true,      // Handles 10 being after 2
      sensitivity: 'base' // Ignores case
    }));
    // ----------------------------------

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
