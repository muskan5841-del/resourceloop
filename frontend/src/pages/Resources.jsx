import { useState } from "react";
import { Link } from "react-router-dom";
import { resources } from "../data/mockData";

export default function Resources() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  const filtered = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (type === "All" || r.type === type)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-left text-gray-900">
        Find a Resource
      </h1>

      <div className="flex gap-3 mb-6">
        <input
          className="border border-gray-300 bg-white text-gray-900 rounded px-3 py-2 flex-1"
          placeholder="Search equipment or spaces..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border border-gray-300 bg-white text-gray-900 rounded px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option>All</option>
          <option>Equipment</option>
          <option>Space</option>
        </select>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <Link
            key={r.id}
            to={`/resources/${r.id}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition block text-left"
          >
            <h2 className="font-semibold text-gray-900">{r.name}</h2>
            <p className="text-sm text-gray-600">{r.location}</p>
            <p className="text-xs mt-2 text-gray-700">
              {r.available ? "✅ Available" : "⏳ Waitlist only"}
            </p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-600">No resources match your search.</p>
        )}
      </div>
    </div>
  );
}