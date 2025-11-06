const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// create or open database file
const dbPath = path.resolve(__dirname, "event_database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS schools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL,
      team_name TEXT NOT NULL,
      event_name TEXT NOT NULL,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    )
  `);
});

module.exports = db;