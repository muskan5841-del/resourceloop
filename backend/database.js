
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'resourceloop.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT DEFAULT '',
    eligibility TEXT DEFAULT 'No special requirements',
    available INTEGER NOT NULL DEFAULT 1,
    image TEXT DEFAULT '🧰'
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL,
    resource_name TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK(status IN ('pending', 'approved', 'rejected', 'checked_in', 'completed')),
    created_at TEXT NOT NULL,
    FOREIGN KEY (resource_id) REFERENCES resources(id)
  );

  CREATE TABLE IF NOT EXISTS condition_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT NOT NULL,
    stage TEXT NOT NULL CHECK(stage IN ('check_in', 'check_out')),
    condition_notes TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  );

  CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor TEXT DEFAULT 'system',
    created_at TEXT NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  );
`);

module.exports = db;
