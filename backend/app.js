
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./database');
const { randomUUID } = require('crypto');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

const now = () => new Date().toISOString();

function recordEvent(bookingId, action, actor = 'system') {
  db.prepare(`
    INSERT INTO audit_events (booking_id, action, actor, created_at)
    VALUES (?, ?, ?, ?)
  `).run(bookingId, action, actor, now());
}

function getResource(id) {
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
  if (resource) resource.available = Boolean(resource.available);
  return resource;
}

function getBooking(id) {
  const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  if (!row) return null;

  return {
    id: row.id,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    requesterName: row.requester_name,
    startTime: row.start_time,
    endTime: row.end_time,
    purpose: row.purpose,
    status: row.status,
    createdAt: row.created_at
  };
}

function overlaps(resourceId, startTime, endTime, excludeId = '') {
  return Boolean(db.prepare(`
    SELECT id FROM bookings
    WHERE resource_id = ?
      AND id != ?
      AND status IN ('pending', 'approved', 'checked_in')
      AND start_time < ?
      AND end_time > ?
    LIMIT 1
  `).get(resourceId, excludeId, endTime, startTime));
}

// Seed demo resources only when the resources table is empty.
const resourceCount = db.prepare('SELECT COUNT(*) AS count FROM resources').get().count;

if (resourceCount === 0) {
  const seed = db.prepare(`
    INSERT INTO resources
    (id, name, category, location, description, eligibility, available, image)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const demoResources = [
    ['res-1', 'DSLR Camera Kit', 'Camera', 'Media Lab', 'Camera, lens and carry case for student projects.', 'Student ID required', '📷'],
    ['res-2', 'Portable Projector', 'Electronics', 'AV Room', 'HD projector for presentations and events.', 'Faculty approval', '📽️'],
    ['res-3', 'Laptop Workstation', 'Computing', 'Innovation Lab', 'High-performance laptop for design and coding work.', 'Campus account required', '💻'],
    ['res-4', '3D Printer Slot', 'Maker Space', 'Makerspace', 'Book a supervised slot on the 3D printer.', 'Safety training required', '🖨️']
  ];

  const seedAll = db.transaction(() => {
    for (const resource of demoResources) seed.run(...resource);
  });

  seedAll();
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'ResourceLoop API' });
});

app.get('/api/resources', (_req, res) => {
  const resources = db.prepare('SELECT * FROM resources ORDER BY name').all()
    .map(resource => ({ ...resource, available: Boolean(resource.available) }));
  res.json(resources);
});

app.post('/api/resources', (req, res) => {
  const { name, category, location, description, eligibility, image } = req.body || {};

  if (![name, category, location].every(value =>
    typeof value === 'string' && value.trim()
  )) {
    return res.status(400).json({ error: 'name, category and location are required' });
  }

  const resource = {
    id: `res-${randomUUID()}`,
    name: name.trim(),
    category: category.trim(),
    location: location.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    eligibility: typeof eligibility === 'string' && eligibility.trim()
      ? eligibility.trim()
      : 'No special requirements',
    image: typeof image === 'string' ? image : '🧰',
    available: true
  };

  db.prepare(`
    INSERT INTO resources
    (id, name, category, location, description, eligibility, available, image)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    resource.id, resource.name, resource.category, resource.location,
    resource.description, resource.eligibility, resource.image
  );

  res.status(201).json(resource);
});

app.get('/api/bookings', (_req, res) => {
  const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC')
    .all().map(row => getBooking(row.id));
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const { resourceId, requesterName, startTime, endTime, purpose } = req.body || {};

  if (![resourceId, requesterName, startTime, endTime, purpose].every(value =>
    typeof value === 'string' && value.trim()
  )) {
    return res.status(400).json({
      error: 'resourceId, requesterName, startTime, endTime and purpose are required'
    });
  }

  const resource = getResource(resourceId);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return res.status(400).json({ error: 'End time must be after start time' });
  }

  if (overlaps(resourceId, start.toISOString(), end.toISOString())) {
    return res.status(409).json({
      error: 'This resource already has a pending, approved or checked-in booking during that time.'
    });
  }

  const booking = {
    id: `book-${randomUUID()}`,
    resourceId,
    resourceName: resource.name,
    requesterName: requesterName.trim(),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    purpose: purpose.trim(),
    status: 'pending',
    createdAt: now()
  };

  const createBooking = db.transaction(() => {
    db.prepare(`
      INSERT INTO bookings
      (id, resource_id, resource_name, requester_name, start_time, end_time, purpose, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      booking.id, booking.resourceId, booking.resourceName, booking.requesterName,
      booking.startTime, booking.endTime, booking.purpose, booking.status, booking.createdAt
    );

    recordEvent(booking.id, 'Booking requested', booking.requesterName);
  });

  createBooking();
  res.status(201).json(booking);
});

app.patch('/api/bookings/:id/status', (req, res) => {
  const { status, actor } = req.body || {};

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }

  const booking = getBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  if (booking.status !== 'pending') {
    return res.status(409).json({ error: 'Only pending bookings can be reviewed' });
  }

  const resource = getResource(booking.resourceId);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  if (status === 'approved' && overlaps(
    booking.resourceId, booking.startTime, booking.endTime, booking.id
  )) {
    return res.status(409).json({
      error: 'An overlapping booking is already pending, approved or checked in.'
    });
  }

  const update = db.transaction(() => {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?')
      .run(status, booking.id);
    recordEvent(booking.id, `Booking ${status}`, actor || 'demo-owner');
  });

  update();
  res.json(getBooking(booking.id));
});

app.post('/api/bookings/:id/check-in', (req, res) => {
  const { condition, actor } = req.body || {};
  const booking = getBooking(req.params.id);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status !== 'approved') {
    return res.status(409).json({ error: 'Only approved bookings can check in' });
  }
  if (typeof condition !== 'string' || !condition.trim()) {
    return res.status(400).json({ error: 'Initial condition is required' });
  }

  const update = db.transaction(() => {
    db.prepare('INSERT INTO condition_reports (booking_id, stage, condition_notes, created_at) VALUES (?, ?, ?, ?)')
      .run(booking.id, 'check_in', condition.trim(), now());
    db.prepare("UPDATE bookings SET status = 'checked_in' WHERE id = ?").run(booking.id);
    recordEvent(booking.id, 'Checked in; initial condition recorded', actor || booking.requesterName);
  });

  update();
  res.json(getBooking(booking.id));
});

app.post('/api/bookings/:id/check-out', (req, res) => {
  const { condition, actor } = req.body || {};
  const booking = getBooking(req.params.id);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status !== 'checked_in') {
    return res.status(409).json({ error: 'Booking must be checked in before check-out' });
  }
  if (typeof condition !== 'string' || !condition.trim()) {
    return res.status(400).json({ error: 'Final condition is required' });
  }

  const update = db.transaction(() => {
    db.prepare('INSERT INTO condition_reports (booking_id, stage, condition_notes, created_at) VALUES (?, ?, ?, ?)')
      .run(booking.id, 'check_out', condition.trim(), now());
    db.prepare("UPDATE bookings SET status = 'completed' WHERE id = ?").run(booking.id);
    recordEvent(booking.id, 'Checked out; final condition recorded', actor || booking.requesterName);
  });

  update();
  res.json(getBooking(booking.id));
});

app.get('/api/bookings/:id/history', (req, res) => {
  const booking = getBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const events = db.prepare(`
    SELECT action, actor, created_at AS createdAt
    FROM audit_events
    WHERE booking_id = ?
    ORDER BY id
  `).all(booking.id);

  const reports = db.prepare(`
    SELECT stage, condition_notes AS condition, created_at AS createdAt
    FROM condition_reports
    WHERE booking_id = ?
    ORDER BY id
  `).all(booking.id);

  res.json({ booking, events, conditionReports: reports });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`ResourceLoop API listening on port ${port}`));
