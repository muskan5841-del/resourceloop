const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

let resources = [
  { id: 'res-1', name: 'DSLR Camera Kit', category: 'Camera', location: 'Media Lab', description: 'Camera, lens and carry case for student projects.', available: true, eligibility: 'Student ID required', image: '📷' },
  { id: 'res-2', name: 'Portable Projector', category: 'Electronics', location: 'AV Room', description: 'HD projector for presentations and events.', available: true, eligibility: 'Faculty approval', image: '📽️' },
  { id: 'res-3', name: 'Laptop Workstation', category: 'Computing', location: 'Innovation Lab', description: 'High-performance laptop for design and coding work.', available: true, eligibility: 'Campus account required', image: '💻' },
  { id: 'res-4', name: '3D Printer Slot', category: 'Maker Space', location: 'Makerspace', description: 'Book a supervised slot on the 3D printer.', available: true, eligibility: 'Safety training required', image: '🖨️' }
];
let bookings = [];
let nextBookingNumber = 1;

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'ResourceLoop API' }));
app.get('/api/resources', (_req, res) => res.json(resources));
app.post('/api/resources', (req, res) => {
  const { name, category, location, description, eligibility } = req.body || {};
  if (!name || !category || !location) return res.status(400).json({ error: 'name, category and location are required' });
  const resource = { id: `res-${Date.now()}`, name, category, location, description: description || '', eligibility: eligibility || 'No special requirements', available: true, image: '🧰' };
  resources.unshift(resource);
  res.status(201).json(resource);
});
app.get('/api/bookings', (_req, res) => res.json(bookings));
app.post('/api/bookings', (req, res) => {
  const { resourceId, requesterName, startTime, endTime, purpose } = req.body || {};
  const resource = resources.find((item) => item.id === resourceId);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });
  if (!requesterName || !startTime || !endTime || !purpose) return res.status(400).json({ error: 'Please complete all booking fields' });
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return res.status(400).json({ error: 'End time must be after start time' });
  const conflict = bookings.some((b) => b.resourceId === resourceId && ['pending', 'approved'].includes(b.status) && start < new Date(b.endTime) && end > new Date(b.startTime));
  if (conflict) return res.status(409).json({ error: 'This resource already has a pending or approved booking during that time.' });
  const booking = { id: `book-${nextBookingNumber++}`, resourceId, resourceName: resource.name, requesterName, startTime, endTime, purpose, status: 'pending', createdAt: new Date().toISOString(), history: [{ action: 'Booking requested', at: new Date().toISOString() }] };
  bookings.unshift(booking);
  res.status(201).json(booking);
});
app.patch('/api/bookings/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
  const booking = bookings.find((item) => item.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status !== 'pending') return res.status(409).json({ error: 'Only pending bookings can be reviewed' });
  if (status === 'approved') {
    const conflict = bookings.some((b) => b.id !== booking.id && b.resourceId === booking.resourceId && b.status === 'approved' && new Date(booking.startTime) < new Date(b.endTime) && new Date(booking.endTime) > new Date(b.startTime));
    if (conflict) return res.status(409).json({ error: 'An overlapping booking has already been approved.' });
  }
  booking.status = status;
  booking.history.push({ action: `Booking ${status}`, at: new Date().toISOString() });
  res.json(booking);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`ResourceLoop API listening on port ${port}`));
