import "../styles/OnBoarding.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import toast from "react-hot-toast";

const OnBoarding = ({ type }) => {
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [usn, setUsn] = useState("");
  const [subjectCount, setSubjectCount] = useState(null);
  const [courseLoads, setCourseLoads] = useState([
    { subject: "", sections: "" },
  ]);

  const [studentSection, setStudentSection] = useState("");

  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const handleSubjectCountChange = (e) => {
    const newCount = Math.max(1, parseInt(e.target.value) || 1);
    setSubjectCount(newCount);

    setCourseLoads((prev) => {
      if (newCount > prev.length) {
        const extraRows = Array(newCount - prev.length).fill({
          subject: "",
          sections: "",
        });
        return [...prev, ...extraRows];
      } else {
        return prev.slice(0, newCount);
      }
    });
  };

  const handleCourseChange = (index, field, value) => {
    const updatedLoads = [...courseLoads];
    updatedLoads[index][field] = value;
    setCourseLoads(updatedLoads);
  };

  async function handleSubmit(e) {
    e.preventDefault();

    const idToUpdate = user?.id || localStorage.getItem("onboardingUserId");
    const token = user?.token;

    if (!idToUpdate) {
      toast.error("Session error. Please try signing up again.");
      return;
    }

    const payload = {
      name,
      branch,
      ...(type === "student"
        ? { usn, sections: [studentSection] }
        : {
          courses: courseLoads.map((c) => ({
            subject: c.subject,
            sections: c.sections.trim().split(/\s+/),
          })),
        }),
    };

    try {
      const API_BASE_URL = import.meta.env.VITE_PORT
        ? `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}`
        : import.meta.env.VITE_URL;
      const response = await fetch(
        `${API_BASE_URL}/api/onboarding/${idToUpdate}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem("onboardingUserId");
        if (user) {
          localStorage.setItem("isOnboarded", "true");
          setUser({ ...user, isOnboarded: true });
          navigate(user.role === "student" ? "/qrscanner" : "/dash");
        } else {
          toast.success("Profile Setup Complete! Please Login.");
          navigate(`/login/${type}`);
        }
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (err) {
      console.error("Connection error:", err);
    }
  }

  return (
    <div className="Form">
      <Link className="logo" to="/">
        ATTSYS2-0
      </Link>
      <div className="greetings">
        <h1>Welcome on Board</h1>
        <p>To get started, Please fill in your personal information.</p>
      </div>

      <form className="form personal-info" onSubmit={handleSubmit}>
        <h1>Personal Info</h1>
        <div className="input-holder input-holder-info">
          <input
            placeholder="Full Name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="form-select"
            required
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <option value="CSE">Computer Science</option>
            <option value="ECE">Electronics & Communication</option>
            <option value="ME">Mechanical Engineering</option>
            <option value="CE">Civil Engineering</option>
            <option value="ISE">Information Science</option>
          </select>

          {type === "student" ? (
            <>
              <input
                placeholder="USN"
                type="text"
                required
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
              />
              <input
                placeholder="Section"
                type="text"
                required
                value={studentSection}
                onChange={(e) =>
                  setStudentSection(e.target.value.replace(/\s+/g, ""))
                }
              />
            </>
          ) : (
            <>
              <input
                type="number"
                min="1"
                max="10"
                placeholder="How many subjects are you handling (e.g. 2)"
                value={subjectCount}
                onChange={handleSubjectCountChange}
              />

              <div className="dynamic-inputs">
                {courseLoads.map((course, index) => (
                  <div key={index} className="course-row">
                    <input
                      placeholder={`Subject ${index + 1}`}
                      required
                      value={course.subject}
                      onChange={(e) =>
                        handleCourseChange(index, "subject", e.target.value)
                      }
                      key={index + "1"}
                    />
                    <input
                      placeholder="Sections (e.g. A B C)"
                      required
                      value={course.sections}
                      onChange={(e) =>
                        handleCourseChange(index, "sections", e.target.value)
                      }
                      key={index + "2"}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="form-controls">
          <button type="button" onClick={() => window.location.reload()}>
            Clear
          </button>
          <button type="submit">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default OnBoarding;
