const colors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  Waitlisted: "bg-orange-100 text-orange-800",
  Active: "bg-blue-100 text-blue-800",
  Returned: "bg-gray-100 text-gray-800",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
}