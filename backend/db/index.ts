import Database from 'better-sqlite3';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const db = new Database(env.DB_PATH);
db.pragma('journal_mode = WAL');

export const initDb = () => {
  logger.info('Initializing database schema...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'investigator', 'analyst')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      investigator_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('open', 'pending', 'closed')) DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(investigator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER,
      type TEXT NOT NULL,
      modality TEXT NOT NULL,
      filename TEXT,
      text_content TEXT,
      authenticity_score REAL,
      risk_level TEXT CHECK(risk_level IN ('Low', 'Medium', 'High')),
      result_json TEXT,
      feedback_rating INTEGER,
      feedback_is_correct BOOLEAN,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(case_id) REFERENCES cases(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  
  logger.info('Database initialized successfully.');
};

export default db;
