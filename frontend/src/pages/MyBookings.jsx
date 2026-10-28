import { useState } from "react";
import { useApp } from "../context/AppContext";
import StatusBadge from "../components/StatusBadge";

export default function MyBookings() {
  const { bookings, resources, checkIn, returnResource, reportIncident } = useApp();
  const [form, setForm] = useState(null); // { id, mode }
  const [condition, setCondition] = useState("Good");
  const [notes, setNotes] = useState("");
  const [incidentType, setIncidentType] = useState("Damage");

  const open = (id, mode) => {
    setForm({ id, mode });
    setCondition("Good");
    setNotes("");
    setIncidentType("Damage");
  };

  const submit = (e) => {
    e.preventDefault();
    if (form.mode === "checkin") checkIn(form.id, condition, notes);
    if (form.mode === "return")
      returnResource(form.id, condition, notes, condition === "Damaged");
    if (form.mode === "incident") reportIncident(form.id, incidentType, notes);
    setForm(null);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto text-gray-900">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
      {bookings.map((b) => {
        const r = resources.find((x) => x.id === b.resourceId);
        return (
          <div key={b.id} className="bg-white border rounded-lg p-4 mb-3">
            <div className="flex justify-between">
              <h2 className="font-semibold">{r.name}</h2>
              <StatusBadge status={b.status} />
            </div>
            <p className="text-sm text-gray-600">{b.date}</p>
            {b.reason && <p className="text-sm mt-2 text-orange-700">Why: {b.reason}</p>}

            <div className="flex gap-2 mt-3">
              {b.status === "Approved" && (
                <button onClick={() => open(b.id, "checkin")} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                  Check in
                </button>
              )}
              {b.status === "Active" && (
                <button onClick={() => open(b.id, "return")} className="bg-gray-800 text-white px-3 py-1 rounded text-sm">
                  Return
                </button>
              )}
              {(b.status === "Active" || b.status === "Returned") && (
                <button onClick={() => open(b.id, "incident")} className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                  Report issue
                </button>
              )}
            </div>

            {form && form.id === b.id && (
              <form onSubmit={submit} className="mt-3 border-t pt-3 space-y-3">
                <p className="font-medium text-sm">
                  {form.mode === "checkin" && "Check-in: record initial condition"}
                  {form.mode === "return" && "Return: record final condition"}
                  {form.mode === "incident" && "Report an incident"}
                </p>

                {form.mode === "incident" ? (
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 bg-white"
                  >
                    <option>Damage</option>
                    <option>Delay</option>
                    <option>Dispute</option>
                    <option>Other</option>
                  </select>
                ) : (
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 bg-white"
                  >
                    <option>Good</option>
                    <option>Minor wear</option>
                    <option>Damaged</option>
                  </select>
                )}

                <textarea
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Describe the condition / issue"
                  className="border border-gray-300 rounded px-3 py-2 w-full bg-white"
                />

                {form.mode !== "incident" && (
                  <input type="file" accept="image/*" className="text-sm" />
                )}

                <div className="flex gap-2">
                  <button className="bg-indigo-600 text-white px-3 py-1 rounded text-sm">Save</button>
                  <button type="button" onClick={() => setForm(null)} className="border px-3 py-1 rounded text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {b.damageReported && (
              <p className="text-sm mt-2 text-red-700">⚠ Damage flagged for owner review</p>
            )}

            <details className="mt-3">
              <summary className="text-sm text-indigo-600 cursor-pointer">View history</summary>
              <ul className="mt-2 border-l-2 border-indigo-200 pl-3 space-y-1">
                {b.history.map((h, i) => (
                  <li key={i} className="text-xs text-gray-700">
                    <span className="font-medium">{h.action}</span> · {h.by} · {h.time}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        );
      })}
    </div>
  );
}