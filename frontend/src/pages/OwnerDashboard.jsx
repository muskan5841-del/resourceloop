import { useState } from "react";
import { useApp } from "../context/AppContext";
import StatusBadge from "../components/StatusBadge";

export default function OwnerDashboard() {
  const { bookings, resources, updateBookingStatus } = useApp();
  const [reasons, setReasons] = useState({});

  const open = bookings.filter((b) => b.status === "Pending" || b.status === "Waitlisted");

  const decide = (id, status) => {
    const reason = (reasons[id] || "").trim();
    if (!reason) {
      alert("Please enter a reason. Users must be told why.");
      return;
    }
    updateBookingStatus(id, status, reason);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Owner Dashboard</h1>
      {open.length === 0 && <p className="text-gray-600">No requests waiting for review.</p>}
      {open.map((b) => {
        const r = resources.find((x) => x.id === b.resourceId);
        return (
          <div key={b.id} className="bg-white border rounded-lg p-4 mb-3">
            <div className="flex justify-between">
              <h2 className="font-semibold">{r.name}</h2>
              <StatusBadge status={b.status} />
            </div>
            <p className="text-sm text-gray-600">Date: {b.date}</p>
            {b.purpose && <p className="text-sm mt-1">Purpose: {b.purpose}</p>}
            <input
              className="border border-gray-300 rounded px-3 py-2 w-full mt-3 bg-white"
              placeholder="Reason for your decision (required)"
              value={reasons[b.id] || ""}
              onChange={(e) => setReasons({ ...reasons, [b.id]: e.target.value })}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => decide(b.id, "Approved")} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
              <button onClick={() => decide(b.id, "Rejected")} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
              <button onClick={() => decide(b.id, "Waitlisted")} className="bg-orange-500 text-white px-3 py-1 rounded">Waitlist</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}