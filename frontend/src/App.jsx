import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Resources from "./pages/Resources";
import ResourceDetail from "./pages/ResourceDetail";
import MyBookings from "./pages/MyBookings";
import OwnerDashboard from "./pages/OwnerDashboard";
import Notifications from "./pages/Notifications";
import AuditLog from "./pages/AuditLog";

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <p className="p-6 text-red-600">
        Access denied: your role ({user.role}) cannot open this page.
      </p>
    );
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Guard><Resources /></Guard>} />
            <Route path="/resources/:id" element={<Guard><ResourceDetail /></Guard>} />
            <Route path="/bookings" element={<Guard><MyBookings /></Guard>} />
            <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
            <Route path="/owner" element={<Guard roles={["owner", "admin"]}><OwnerDashboard /></Guard>} />
            <Route path="/audit" element={<Guard roles={["admin"]}><AuditLog /></Guard>} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}