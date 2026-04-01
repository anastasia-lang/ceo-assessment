import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'assessment.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      candidate_name TEXT NOT NULL,
      candidate_email TEXT NOT NULL,
      started_at TEXT NOT NULL,
      current_stage INTEGER DEFAULT 1,
      stage1_started_at TEXT,
      stage1_submitted_at TEXT,
      stage2_started_at TEXT,
      stage2_submitted_at TEXT,
      stage3_started_at TEXT,
      stage3_submitted_at TEXT,
      completed_at TEXT,
      status TEXT DEFAULT 'in_progress'
    );

    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      stage INTEGER NOT NULL,
      question_key TEXT NOT NULL,
      response_text TEXT,
      response_json TEXT,
      file_path TEXT,
      saved_at TEXT NOT NULL,
      is_final_submission INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);

  return db;
}

export function createSession(id: string, name: string, email: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO sessions (id, candidate_name, candidate_email, started_at, stage1_started_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, email, now, now);
}

export function getSession(id: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Record<string, unknown> | undefined;
}

export function updateSession(id: string, updates: Record<string, unknown>): void {
  const db = getDb();
  const keys = Object.keys(updates);
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => updates[k]);
  db.prepare(`UPDATE sessions SET ${sets} WHERE id = ?`).run(...values, id);
}

export function saveResponse(
  sessionId: string,
  stage: number,
  questionKey: string,
  responseText: string | null,
  responseJson: string | null,
  filePath: string | null,
  isFinal: boolean
): void {
  const db = getDb();
  const now = new Date().toISOString();

  if (isFinal) {
    db.prepare(`
      UPDATE responses SET is_final_submission = 0
      WHERE session_id = ? AND stage = ? AND question_key = ? AND is_final_submission = 1
    `).run(sessionId, stage, questionKey);
  }

  const existing = db.prepare(`
    SELECT id FROM responses
    WHERE session_id = ? AND stage = ? AND question_key = ? AND is_final_submission = 0
  `).get(sessionId, stage, questionKey) as { id: number } | undefined;

  if (existing && !isFinal) {
    db.prepare(`
      UPDATE responses SET response_text = ?, response_json = ?, file_path = ?, saved_at = ?
      WHERE id = ?
    `).run(responseText, responseJson, filePath, now, existing.id);
  } else {
    db.prepare(`
      INSERT INTO responses (session_id, stage, question_key, response_text, response_json, file_path, saved_at, is_final_submission)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, stage, questionKey, responseText, responseJson, filePath, now, isFinal ? 1 : 0);
  }
}

export function getResponses(sessionId: string, stage?: number) {
  const db = getDb();
  if (stage !== undefined) {
    return db.prepare(
      'SELECT * FROM responses WHERE session_id = ? AND stage = ? ORDER BY saved_at DESC'
    ).all(sessionId, stage) as Record<string, unknown>[];
  }
  return db.prepare(
    'SELECT * FROM responses WHERE session_id = ? ORDER BY stage, saved_at DESC'
  ).all(sessionId) as Record<string, unknown>[];
}

export function getFinalResponses(sessionId: string) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM responses WHERE session_id = ? AND is_final_submission = 1 ORDER BY stage, question_key'
  ).all(sessionId) as Record<string, unknown>[];
}

export function getAllSessions() {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions ORDER BY started_at DESC').all() as Record<string, unknown>[];
}

export function getLatestResponses(sessionId: string) {
  const db = getDb();
  return db.prepare(`
    SELECT r1.* FROM responses r1
    INNER JOIN (
      SELECT session_id, stage, question_key, MAX(saved_at) as max_saved
      FROM responses
      WHERE session_id = ?
      GROUP BY session_id, stage, question_key
    ) r2 ON r1.session_id = r2.session_id
      AND r1.stage = r2.stage
      AND r1.question_key = r2.question_key
      AND r1.saved_at = r2.max_saved
    ORDER BY r1.stage, r1.question_key
  `).all(sessionId) as Record<string, unknown>[];
}
