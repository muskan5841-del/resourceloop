import { createContext, useContext, useState } from "react";
import { resources, bookings as initialBookings } from "../data/mockData";

const AppContext = createContext();

const now = () => new Date().toLocaleString();
export const MAX_OPEN = 3;
const OPEN_STATUSES = ["Pending", "Approved", "Active"];

export function AppProvider({ children }) {
  const [bookings, setBookings] = useState(
    initialBookings.map((b) => ({
      ...b,
      history: [{ action: "Request submitted", by: "You", time: now() }],
    }))
  );
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Welcome to ShareSpace", time: now(), read: false },
  ]);

  const notify = (message) =>
    setNotifications((prev) => [
      { id: Date.now() + Math.random(), message, time: now(), read: false },
      ...prev,
    ]);

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const openCount = bookings.filter((b) => OPEN_STATUSES.includes(b.status)).length;

  const nameOf = (id) => resources.find((r) => r.id === id)?.name || "resource";

  const patch = (id, changes, entries) =>
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, ...changes, history: [...b.history, ...entries] } : b
      )
    );

  const addBooking = ({ resourceId, date, purpose, eligibility }) => {
    const resource = resources.find((r) => r.id === resourceId);
    const allMet = Object.values(eligibility).every(Boolean);

    let status = "Pending";
    let reason = "";
    let autoNote = null;

    if (!resource.available) {
      status = "Waitlisted";
      reason = "This resource is currently in use. You have been added to the waiting list.";
      autoNote = "Placed on waiting list (resource in use)";
    } else if (openCount >= MAX_OPEN) {
      status = "Waitlisted";
      reason = `Fair-usage limit: you already have ${MAX_OPEN} open bookings. Complete one to free a slot.`;
      autoNote = "Placed on waiting list (fair-usage limit reached)";
    } else if (!allMet) {
      reason = "Some eligibility requirements are not confirmed. The owner will verify them.";
    }

    const newBooking = {
      id: Date.now(),
      resourceId,
      date,
      purpose,
      status,
      reason,
      history: [
        { action: "Request submitted", by: "You", time: now() },
        ...(autoNote ? [{ action: autoNote, by: "System", time: now() }] : []),
      ],
    };
    setBookings((prev) => [newBooking, ...prev]);
    notify(`${resource.name}: request ${status.toLowerCase()}`);
    return newBooking;
  };

  const updateBookingStatus = (id, status, reason, by = "Owner") => {
    const b = bookings.find((x) => x.id === id);
    patch(id, { status, reason }, [{ action: `${status}: ${reason}`, by, time: now() }]);
    notify(`${nameOf(b.resourceId)}: your request was ${status.toLowerCase()}. Reason: ${reason}`);
  };

  const checkIn = (id, condition, notes) => {
    const b = bookings.find((x) => x.id === id);
    patch(
      id,
      { status: "Active", checkInCondition: condition, checkInNotes: notes },
      [{ action: `Checked in. Condition: ${condition}. ${notes}`, by: "You", time: now() }]
    );
    notify(`${nameOf(b.resourceId)}: checked in (${condition}). Return it on time.`);
  };

  const returnResource = (id, condition, notes, damaged) => {
    const b = bookings.find((x) => x.id === id);
    patch(
      id,
      { status: "Returned", returnCondition: condition, returnNotes: notes, damageReported: damaged },
      [
        { action: `Returned. Condition: ${condition}. ${notes}`, by: "You", time: now() },
        ...(damaged ? [{ action: "Damage flagged for owner review", by: "System", time: now() }] : []),
      ]
    );
    notify(
      damaged
        ? `${nameOf(b.resourceId)}: returned with damage. Owner will review.`
        : `${nameOf(b.resourceId)}: returned successfully.`
    );
  };

  const reportIncident = (id, type, description) => {
    const b = bookings.find((x) => x.id === id);
    setBookings((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              incidents: [...(x.incidents || []), { type, description }],
              history: [
                ...x.history,
                { action: `Incident reported (${type}): ${description}`, by: "You", time: now() },
              ],
            }
          : x
      )
    );
    notify(`${nameOf(b.resourceId)}: ${type} incident recorded.`);
  };

  return (
    <AppContext.Provider
      value={{
        resources,
        bookings,
        notifications,
        markAllRead,
        openCount,
        addBooking,
        updateBookingStatus,
        checkIn,
        returnResource,
        reportIncident,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);