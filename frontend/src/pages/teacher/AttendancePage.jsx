import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import Table from "../../components/Table";
import DownloadPDF from "../../assets/download.svg";
import "../../styles/teacher/AttendancePage.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AttendancePage = () => {
  const { user } = useAuth();
  const { subject: subjectName, sectionName } = useParams();

  const [qr, setQr] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const timerIdRef = useRef(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (user?.role === "teacher" && user?.id && sectionName && subjectName) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_URL}:5000/api/attendance/list/${user.id}/${subjectName}/${sectionName}`
          );
          if (response.ok) {
            const data = await response.json();
            setAttendanceList(data);
          }
        } catch (err) {
          console.error("Failed to fetch attendance:", err);
        }
      }
    };

    const interval = setInterval(fetchAttendance, 5000);
    fetchAttendance();
    return () => clearInterval(interval);
  }, [user, sectionName, subjectName]);

  const generateQR = () => {
    if (timerIdRef.current) clearInterval(timerIdRef.current);

    const baseUrl = `${import.meta.env.VITE_URL}:5001/qr`;
    const params = `teacherId=${user.id}&subject=${subjectName}&section=${sectionName}&time=${Date.now()}`;

    setQr(`${baseUrl}?${params}`);
    setTimeLeft(10);

    timerIdRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIdRef.current);
          setQr(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopSession = () => {
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    setQr(null);
    setTimeLeft(0);
  };

  useEffect(() => {
    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    };
  }, []);

  const downloadPDF = () => {
    if (!attendanceList || attendanceList.length === 0) return;
    const doc = new jsPDF("p", "pt", "a4");
    doc.text(`${subjectName} - Section ${sectionName}`, 40, 30);
    autoTable(doc, {
      body: attendanceList,
      startY: 50,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save(`${subjectName}_${sectionName}_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="AttendancePage">
      {user?.role === "teacher" && (
        <div className="scanner-holder">
          <h1>{subjectName}</h1>
          <h3>Section {sectionName}</h3>

          <div className="qr-container">
            {qr ? (
              <img src={qr} className="qr-generator" alt="QR Code" />
            ) : (
              <div className="qr-placeholder"></div>
            )}
          </div>

          <div className="button-holder">
            <button
              className="generate-btn"
              onClick={generateQR}
              disabled={timeLeft > 0}
            >
              {timeLeft > 0 ? "Active" : "Generate QR"}
            </button>
            <button className="stop-btn" onClick={stopSession}>
              Stop Session
            </button>
          </div>
        </div>
      )}

      <div className="student-timer">
        <div className="timer">
          {timeLeft > 0 ? `QR Expires in: ${timeLeft}s` : "Session Inactive"}
        </div>
        <Table data={attendanceList} />
        <button
          className="pdf-btn"
          onClick={downloadPDF}
          disabled={attendanceList.length === 0}
        >
          <img src={DownloadPDF} alt="Download" /> PDF
        </button>
      </div>
    </div>
  );
};

export default AttendancePage;
