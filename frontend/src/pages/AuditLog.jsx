import { useApp } from "../context/AppContext";

export default function AuditLog() {
  const { bookings, resources } = useApp();

  const rows = bookings
    .flatMap((b) =>
      b.history.map((h) => ({
        ...h,
        booking: b.id,
        resource: resources.find((r) => r.id === b.resourceId)?.name,
      }))
    )
    .reverse();

  return (
    <div className="p-6 max-w-4xl mx-auto text-gray-900">
      <h1 className="text-2xl font-bold mb-4">Audit Log</h1>
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Time</th>
              <th className="p-2">Resource</th>
              <th className="p-2">Action</th>
              <th className="p-2">By</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 whitespace-nowrap">{r.time}</td>
                <td className="p-2">{r.resource}</td>
                <td className="p-2">{r.action}</td>
                <td className="p-2">{r.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}