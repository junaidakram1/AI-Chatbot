import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import ChatList from "../../components/ChatList/ChatList";
import "./DashboardLayout.css";
import SettingsIcon from "@mui/icons-material/Settings";

const DashboardLayout = () => {
  const { userId, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !userId) {
      navigate("/sign-in");
    }
  }, [isLoaded, userId, navigate]);

  if (!isLoaded) return "Loading...";

  return (
    <div className="dashboardLayout">
      <button className="hamburgerBtn" onClick={() => setMenuOpen(!menuOpen)}>
        <SettingsIcon />
      </button>

      <div className={`menu ${menuOpen ? "open" : ""}`}>
        <ChatList />
      </div>

      <div className="content" onClick={() => menuOpen && setMenuOpen(false)}>
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
