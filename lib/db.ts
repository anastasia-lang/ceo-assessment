import path from 'path';
import fs from 'fs';
import type { Database, SqlJsStatic } from 'sql.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'assessment.db');

let dbInstance: Database | null = null;
let sqlJsInstance: SqlJsStatic | null = null;

async function getSqlJs(): Promise<SqlJsStatic> {
  if (sqlJsInstance) return sqlJsInstance;
  const initSqlJs = (await import('sql.js')).default;
  sqlJsInstance = await initSqlJs({
    locateFile: (file: string) =>
      path.join(process.cwd(), 'node_modules/sql.js/dist', file),
  });
  return sqlJsInstance;
}

function persist(db: Database): void {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function queryOne(db: Database, sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  const stmt = db.prepare(sql);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stmt.bind(params as any);
  let result: Record<string, unknown> | undefined;
  if (stmt.step()) {
    result = stmt.getAsObject() as Record<string, unknown>;
  }
  stmt.free();
  return result;
}

function queryAll(db: Database, sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stmt.bind(params as any);
  const results: Record<string, unknown>[] = [];
  while (stmt.step()) {
    results.push({ ...stmt.getAsObject() } as Record<string, unknown>);
  }
  stmt.free();
  return results;
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await getSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance.exec(`
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

  persist(dbInstance);
  return dbInstance;
}

export async function createSession(id: string, name: string, email: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO sessions (id, candidate_name, candidate_email, started_at, stage1_started_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, email, now, now]
  );
  persist(db);
}

export async function getSession(id: string): Promise<Record<string, unknown> | undefined> {
  const db = await getDb();
  return queryOne(db, 'SELECT * FROM sessions WHERE id = ?', [id]);
}

export async function updateSession(id: string, updates: Record<string, unknown>): Promise<void> {
  const db = await getDb();
  const keys = Object.keys(updates);
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const values = [...keys.map(k => updates[k]), id];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db.run(`UPDATE sessions SET ${sets} WHERE id = ?`, values as any);
  persist(db);
}

export async function saveResponse(
  sessionId: string,
  stage: number,
  questionKey: string,
  responseText: string | null,
  responseJson: string | null,
  filePath: string | null,
  isFinal: boolean
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  if (isFinal) {
    db.run(
      `UPDATE responses SET is_final_submission = 0
       WHERE session_id = ? AND stage = ? AND question_key = ? AND is_final_submission = 1`,
      [sessionId, stage, questionKey]
    );
  }

  const existing = queryOne(
    db,
    `SELECT id FROM responses
     WHERE session_id = ? AND stage = ? AND question_key = ? AND is_final_submission = 0`,
    [sessionId, stage, questionKey]
  );

  if (existing && !isFinal) {
    db.run(
      `UPDATE responses SET response_text = ?, response_json = ?, file_path = ?, saved_at = ?
       WHERE id = ?`,
      [responseText, responseJson, filePath, now, existing.id as number]
    );
  } else {
    db.run(
      `INSERT INTO responses (session_id, stage, question_key, response_text, response_json, file_path, saved_at, is_final_submission)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, stage, questionKey, responseText, responseJson, filePath, now, isFinal ? 1 : 0]
    );
  }

  persist(db);
}

export async function getResponses(sessionId: string, stage?: number): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  if (stage !== undefined) {
    return queryAll(
      db,
      'SELECT * FROM responses WHERE session_id = ? AND stage = ? ORDER BY saved_at DESC',
      [sessionId, stage]
    );
  }
  return queryAll(
    db,
    'SELECT * FROM responses WHERE session_id = ? ORDER BY stage, saved_at DESC',
    [sessionId]
  );
}

export async function getFinalResponses(sessionId: string): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  return queryAll(
    db,
    'SELECT * FROM responses WHERE session_id = ? AND is_final_submission = 1 ORDER BY stage, question_key',
    [sessionId]
  );
}

export async function getAllSessions(): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  return queryAll(db, 'SELECT * FROM sessions ORDER BY started_at DESC', []);
}

export async function getLatestResponses(sessionId: string): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  return queryAll(
    db,
    `SELECT r1.* FROM responses r1
     INNER JOIN (
       SELECT session_id, stage, question_key, MAX(saved_at) as max_saved
       FROM responses
       WHERE session_id = ?
       GROUP BY session_id, stage, question_key
     ) r2 ON r1.session_id = r2.session_id
       AND r1.stage = r2.stage
       AND r1.question_key = r2.question_key
       AND r1.saved_at = r2.max_saved
     ORDER BY r1.stage, r1.question_key`,
    [sessionId]
  );
}
