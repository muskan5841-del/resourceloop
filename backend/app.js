
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./database");
const { randomUUID } = require("crypto");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://resourceloop.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json());

/* ---------------- HEALTH ---------------- */

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "ResourceLoop API" });
});

/* ---------------- RESOURCES ---------------- */

app.get("/api/resources", (req, res) => {
  try {
    const resources = db
      .prepare("SELECT * FROM resources")
      .all();

    res.json(resources);
  } catch (error) {
    console.error("Get resources failed:", error.message);
    res.status(500).json({ error: "Failed to load resources" });
  }
});

app.post("/api/resources", (req, res) => {
  try {
    const resource = req.body;

    // Keep the existing database schema and required fields.
    const columns = db
      .prepare("PRAGMA table_info(resources)")
      .all()
      .map((column) => column.name);

    const insertable = Object.fromEntries(
      Object.entries(resource).filter(
        ([key, value]) => columns.includes(key) && value !== undefined
      )
    );

    if (!columns.includes("id")) {
      return res.status(500).json({
        error: "Resources table has no id column; check database schema.",
      });
    }

    if (!insertable.id) {
      insertable.id = randomUUID();
    }

    const keys = Object.keys(insertable);
    if (keys.length === 0) {
      return res.status(400).json({ error: "No valid resource fields provided" });
    }

    const sql = `INSERT INTO resources (${keys.map((key) => `"${key}"`).join(", ")})
      VALUES (${keys.map(() => "?").join(", ")})`;

    db.prepare(sql).run(...keys.map((key) => insertable[key]));

    res.status(201).json(
      db.prepare("SELECT * FROM resources WHERE id = ?").get(insertable.id)
    );
  } catch (error) {
    console.error("Create resource failed:", error.message);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

/* ---------------- BOOKINGS ---------------- */

app.get("/api/bookings", (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM bookings").all());
  } catch (error) {
    console.error("Get bookings failed:", error.message);
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

app.post("/api/bookings", (req, res) => {
  try {
    const booking = req.body;

    const columns = db
      .prepare("PRAGMA table_info(bookings)")
      .all()
      .map((column) => column.name);

    const insertable = Object.fromEntries(
      Object.entries(booking).filter(
        ([key, value]) => columns.includes(key) && value !== undefined
      )
    );

    if (!insertable.id && columns.includes("id")) {
      insertable.id = randomUUID();
    }

    const keys = Object.keys(insertable);
    if (!keys.length) {
      return res.status(400).json({ error: "No valid booking fields provided" });
    }

    const sql = `INSERT INTO bookings (${keys.map((key) => `"${key}"`).join(", ")})
      VALUES (${keys.map(() => "?").join(", ")})`;

    db.prepare(sql).run(...keys.map((key) => insertable[key]));

    res.status(201).json(
      columns.includes("id")
        ? db.prepare("SELECT * FROM bookings WHERE id = ?").get(insertable.id)
        : insertable
    );
  } catch (error) {
    console.error("Create booking failed:", error.message);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

app.patch("/api/bookings/:id/status", (req, res) => {
  try {
    const columns = db
      .prepare("PRAGMA table_info(bookings)")
      .all()
      .map((column) => column.name);

    if (!columns.includes("status")) {
      return res.status(400).json({ error: "Bookings table has no status column" });
    }

    const result = db
      .prepare("UPDATE bookings SET status = ? WHERE id = ?")
      .run(req.body.status, req.params.id);

    if (!result.changes) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(
      db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id)
    );
  } catch (error) {
    console.error("Update booking status failed:", error.message);
    res.status(500).json({ error: "Failed to update booking status" });
  }
});

app.post("/api/bookings/:id/check-in", (req, res) => {
  try {
    const columns = db
      .prepare("PRAGMA table_info(bookings)")
      .all()
      .map((column) => column.name);

    const timeColumn = columns.includes("check_in")
      ? "check_in"
      : columns.includes("check_in_time")
      ? "check_in_time"
      : null;

    if (!timeColumn) {
      return res.status(400).json({
        error: "Check-in column not found; check database schema.",
      });
    }

    const result = db
      .prepare(`UPDATE bookings SET "${timeColumn}" = ? WHERE id = ?`)
      .run(new Date().toISOString(), req.params.id);

    if (!result.changes) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(
      db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id)
    );
  } catch (error) {
    console.error("Check-in failed:", error.message);
    res.status(500).json({ error: "Failed to check in booking" });
  }
});

app.post("/api/bookings/:id/check-out", (req, res) => {
  try {
    const columns = db
      .prepare("PRAGMA table_info(bookings)")
      .all()
      .map((column) => column.name);

    const timeColumn = columns.includes("check_out")
      ? "check_out"
      : columns.includes("check_out_time")
      ? "check_out_time"
      : null;

    if (!timeColumn) {
      return res.status(400).json({
        error: "Check-out column not found; check database schema.",
      });
    }

    const result = db
      .prepare(`UPDATE bookings SET "${timeColumn}" = ? WHERE id = ?`)
      .run(new Date().toISOString(), req.params.id);

    if (!result.changes) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(
      db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id)
    );
  } catch (error) {
    console.error("Check-out failed:", error.message);
    res.status(500).json({ error: "Failed to check out booking" });
  }
});

app.get("/api/bookings/:id/history", (req, res) => {
  try {
    // Return the booking record; adapt if your project has a separate history table.
    const booking = db
      .prepare("SELECT * FROM bookings WHERE id = ?")
      .get(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json([booking]);
  } catch (error) {
    console.error("Get booking history failed:", error.message);
    res.status(500).json({ error: "Failed to load booking history" });
  }
});

/* ---------------- AI SERVICE PROXY ---------------- */

const AI_SERVICE_URL = (
  process.env.AI_SERVICE_URL || "https://resourceloop-1.onrender.com"
).replace(/\/+$/, "");

async function forwardAiRequest(req, res, endpoint) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("AI service request failed:", error.message);
    return res.status(502).json({
      error: "AI service unavailable. Please try again.",
    });
  }
}

app.post("/api/ai/match", (req, res) =>
  forwardAiRequest(req, res, "/api/ai/match")
);

app.post("/api/ai/verify-cert", (req, res) =>
  forwardAiRequest(req, res, "/api/ai/verify-cert")
);

app.post("/api/ai/inspect-condition", (req, res) =>
  forwardAiRequest(req, res, "/api/ai/inspect-condition")
);

/* ---------------- START SERVER ---------------- */

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`ResourceLoop API listening on port ${port}`);
});
