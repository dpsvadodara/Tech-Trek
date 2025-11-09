// backend/database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "event_database.db"); // your DB filename
console.log("Opening SQLite DB at:", dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error("Database connection failed:", err && err.message);
  } else {
    console.log("Connected to SQLite database.");
    // safer defaults
    db.serialize(() => {
      // Make DB more resilient: allow busy timeout so writes wait instead of failing immediately
      db.run("PRAGMA busy_timeout = 5000;"); // 5 seconds
      // Enable WAL for concurrent reads/writes (improves concurrency)
      db.run("PRAGMA journal_mode = WAL;");
    });
  }
});

// Create tables if they do not exist (adjust to your schema)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS schools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT,
      google_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL,
      team_name TEXT NOT NULL,
      event_name TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    );
  `);
});

module.exports = db;
