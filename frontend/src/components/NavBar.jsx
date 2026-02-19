import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import ProfilePic from "../assets/profile.svg";
import "../styles/NavBar.css";

const NavBar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const id = user.id;

  const [userName, setUserName] = useState("Loading...");
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_URL}:${import.meta.env.VITE_PORT}/api/profile/${id}`,
        );
        const data = await response.json();

        if (response.ok) {
          setUserName(data.name);
        } else {
          setUserName("User");
          console.error("Profile fetch error:", data.error);
        }
      } catch (error) {
        setUserName("User");
        console.error("Connection error fetching profile:", error);
      }
    };

    fetchUserProfile();
  }, [id]);

  function handleLogOut() {
    logout();
    alert("Logged Out successfully");
    navigate("/");
  }

  const toggleLogout = () => {
    setShowLogout(!showLogout);
  };

  return (
    <div className="NavBar">
      <div
        className="nav-logo"
        onClick={() => {
          navigate("/");
        }}
      >
        AttSys2-0
      </div>

      <img
        src={ProfilePic}
        onClick={toggleLogout}
        style={{ cursor: "pointer" }}
        alt="Profile"
      />

      {showLogout && (
        <div id="nav-menu">
          <p>Hi, {userName}</p>
          <button id="logout" onClick={handleLogOut}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default NavBar;
