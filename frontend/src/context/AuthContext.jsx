import { createContext, useContext, useState } from "react";

export const USERS = [
  { email: "user@demo.com", password: "user123", name: "Muskan (Student)", role: "user" },
  { email: "owner@demo.com", password: "owner123", name: "Dr. Sharma (Owner)", role: "owner" },
  { email: "admin@demo.com", password: "admin123", name: "Admin", role: "admin" },
];

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ss_user"));
    } catch {
      return null;
    }
  });

  const login = (email, password) => {
    const found = USERS.find((u) => u.email === email && u.password === password);
    if (!found) return false;
    setUser(found);
    try {
      localStorage.setItem("ss_user", JSON.stringify(found));
    } catch {}
    return true;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("ss_user");
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);