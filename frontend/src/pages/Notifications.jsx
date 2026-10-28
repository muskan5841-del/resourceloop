import { useApp } from "../context/AppContext";

export default function Notifications() {
  const { notifications, markAllRead } = useApp();

  return (
    <div className="p-6 max-w-3xl mx-auto text-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button onClick={markAllRead} className="text-sm text-indigo-600">
          Mark all as read
        </button>
      </div>
      {notifications.length === 0 && (
        <p className="text-gray-600">No notifications.</p>
      )}
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`border rounded-lg p-3 mb-2 ${
            n.read ? "bg-white" : "bg-indigo-50 border-indigo-200"
          }`}
        >
          <p className="text-sm">{n.message}</p>
          <p className="text-xs text-gray-500 mt-1">{n.time}</p>
        </div>
      ))}
    </div>
  );
}