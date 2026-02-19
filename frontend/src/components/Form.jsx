import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Form.css";

const Form = ({ formType, type }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = formType === "Log In" ? "/login" : "/register";

    try {
      console.log(import.meta.env.VITE_URL);
      const response = await fetch(`${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}/api${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: type }),
      });

      const data = await response.json();

      if (response.ok) {
        if (formType === "Log In") {
          login({
            token: data.token,
            role: data.user.role,
            isOnboarded: data.user.isOnboarded,
            id: data.user.id,
          });

          alert("Login Successful!");

          if (!data.user.isOnboarded) {
            navigate(`/onboard/${data.user.role}`);
          } else {
            navigate(`/dash/${type}/${data.user.id}`);
          }
        } else {
          localStorage.setItem("onboardingUserId", data.id);
          alert("Account created! Let's set up your profile.");
          navigate(`/onboard/${type}`);
        }
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Cannot connect to server. Is it running?");
    }
  };

  return (
    <>
      <div className="form-blur" id="blur-one"></div>
      <div className="form-blur" id="blur-two"></div>
      <div className="Form blue-background">
        <Link className="logo" to="/">
          ATTSYS2-0
        </Link>
        <form className="form" onSubmit={handleSubmit}>
          <h1>{formType}</h1>
          <div className="input-holder">
            <input
              placeholder="Mail ID"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="button-holder">
            <button
              type="reset"
              onClick={() => {
                setEmail("");
                setPassword("");
              }}
            >
              Clear
            </button>
            <button type="submit">{formType}</button>
          </div>
          {formType == "Log In" ? (
            <p>
              Don't have an account? Click{" "}
              <Link
                to={type == "teacher" ? "/signup/teacher" : "/signup/student"}
              >
                here
              </Link>{" "}
              to signup
            </p>
          ) : (
            <p>
              Already have an account? Click{" "}
              <Link
                to={type == "teacher" ? "/login/teacher" : "/login/student"}
              >
                here
              </Link>{" "}
              to login
            </p>
          )}
        </form>
      </div>
    </>
  );
};

export default Form;
