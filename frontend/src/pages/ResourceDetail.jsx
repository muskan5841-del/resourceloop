import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp, MAX_OPEN } from "../context/AppContext";

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { resources, addBooking, openCount } = useApp();
  const r = resources.find((x) => x.id === Number(id));

  const [date, setDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [checks, setChecks] = useState({});

  if (!r) return <p className="p-6">Resource not found.</p>;

  const submit = (e) => {
    e.preventDefault();
    const eligibility = {};
    r.requirements.forEach((req) => (eligibility[req] = !!checks[req]));
    addBooking({ resourceId: r.id, date, purpose, eligibility });
    navigate("/bookings");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto text-gray-900">
      <h1 className="text-2xl font-bold">{r.name}</h1>
      <p className="text-gray-600 mb-4">
        {r.location} · Owner: {r.owner}
      </p>

      <div className="bg-indigo-50 border border-indigo-200 rounded p-3 mb-4 text-sm">
        Fair-usage: you have <b>{openCount}</b> of <b>{MAX_OPEN}</b> open bookings.
        {openCount >= MAX_OPEN && " New requests will be waitlisted."}
      </div>

      <h2 className="font-semibold mt-4">Usage rules</h2>
      <p className="mb-6">{r.rules}</p>

      <form onSubmit={submit} className="bg-white border rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-lg">
          {r.available ? "Request booking" : "Join waiting list"}
        </h2>

        <div>
          <p className="font-medium mb-1">Eligibility checklist</p>
          {r.requirements.map((req) => (
            <label key={req} className="flex items-center gap-2 text-sm mb-1">
              <input
                type="checkbox"
                checked={!!checks[req]}
                onChange={(e) => setChecks({ ...checks, [req]: e.target.checked })}
              />
              I confirm: {req}
            </label>
          ))}
          <p className="text-xs text-gray-500 mt-1">
            The owner will verify these before approving.
          </p>
        </div>

        <div>
          <label className="block font-medium mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 bg-white"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Purpose of use</label>
          <textarea
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full bg-white"
            rows={3}
            placeholder="Why do you need this resource?"
          />
        </div>

        <button className="bg-indigo-600 text-white px-4 py-2 rounded">
          {r.available ? "Submit request" : "Join waiting list"}
        </button>
      </form>
    </div>
  );
}