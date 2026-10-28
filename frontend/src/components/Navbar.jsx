import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { notifications } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <nav className="bg-indigo-600 text-white px-4 py-3 flex flex-wrap gap-x-5 gap-y-2 items-center">
      <span className="font-bold text-lg">ShareSpace</span>
      {user && (
        <>
          <Link to="/">Resources</Link>
          <Link to="/bookings">My Bookings</Link>
          {(user.role === "owner" || user.role === "admin") && (
            <Link to="/owner">Owner Dashboard</Link>
          )}
          {user.role === "admin" && <Link to="/audit">Audit Log</Link>}
          <Link to="/notifications" className="flex items-center gap-1">
            🔔
            {unread > 0 && (
              <span className="bg-red-500 text-xs rounded-full px-2 py-0.5">{unread}</span>
            )}
          </Link>
          <span className="ml-auto text-sm">
            {user.name} <span className="opacity-75">({user.role})</span>
          </span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="bg-white text-indigo-700 px-3 py-1 rounded text-sm"
          >
            Logout
          </button>
        </>
      )}
    </nav>
  );
}