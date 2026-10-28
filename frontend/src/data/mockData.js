export const resources = [
  {
    id: 1,
    name: "Prusa 3D Printer",
    type: "Equipment",
    location: "Mechanical Lab, Block B",
    owner: "Dr. Sharma",
    requirements: ["3D Printing Safety Training", "Student ID"],
    rules: "Max 4 hours per booking. Supervisor must be present.",
    available: true,
  },
  {
    id: 2,
    name: "Seminar Hall A",
    type: "Space",
    location: "Main Building, Floor 2",
    owner: "Admin Office",
    requirements: ["Faculty approval"],
    rules: "Clean up after use. No food inside.",
    available: true,
  },
  {
    id: 3,
    name: "DSLR Camera Kit",
    type: "Equipment",
    location: "Media Lab",
    owner: "Media Club",
    requirements: ["Club membership"],
    rules: "Return within 24 hours. Security deposit required.",
    available: false,
  },
];

export const bookings = [
  { id: 101, resourceId: 1, status: "Pending", date: "2026-11-02" },
  { id: 102, resourceId: 2, status: "Approved", date: "2026-11-05" },
  {
    id: 103,
    resourceId: 3,
    status: "Waitlisted",
    date: "2026-11-06",
    reason: "Resource already booked for this slot. You are #2 in the queue.",
  },
];