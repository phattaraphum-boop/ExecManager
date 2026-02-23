import Database from 'better-sqlite3';

let db: Database.Database;

export function getDb() {
  if (!db) {
    db = new Database('appointments.db');
    db.pragma('journal_mode = WAL');
    initDb();
  }
  return db;
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT,
      attendees TEXT,
      description TEXT,
      status TEXT DEFAULT 'Pending', -- Pending, Confirmed, Cancelled, Postponed
      secretary_note TEXT,
      executive_feedback TEXT,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
