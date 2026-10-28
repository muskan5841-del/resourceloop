import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, USERS } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (login(email, password)) navigate("/");
    else setError("Wrong email or password.");
  };

  return (
    <div className="p-6 max-w-md mx-auto text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Sign in to ShareSpace</h1>
      <form onSubmit={submit} className="bg-white border rounded-lg p-5 space-y-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full bg-white"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full bg-white"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="bg-indigo-600 text-white px-4 py-2 rounded w-full">
          Sign in
        </button>
      </form>

      <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <p className="font-medium text-sm mb-2">Demo accounts (click to fill)</p>
        {USERS.map((u) => (
          <button
            key={u.email}
            type="button"
            onClick={() => {
              setEmail(u.email);
              setPassword(u.password);
            }}
            className="block w-full text-left text-sm border bg-white rounded px-3 py-2 mb-2"
          >
            <b>{u.role.toUpperCase()}</b> · {u.email} / {u.password}
          </button>
        ))}
      </div>
    </div>
  );
}