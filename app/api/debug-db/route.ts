import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function queryAll(db: import('sql.js').Database, sql: string, params: import('sql.js').BindParams = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  if (Array.isArray(params) && params.length) stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) rows.push({ ...stmt.getAsObject() });
  stmt.free();
  return rows;
}

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const sid = request.nextUrl.searchParams.get('sid');

  if (sid) {
    // Detailed view for a specific session
    const session = queryAll(db, 'SELECT * FROM sessions WHERE id = ?', [sid]);
    const responses = queryAll(
      db,
      `SELECT stage, question_key, saved_at, is_final_submission,
              LENGTH(response_text) as text_len, file_path
       FROM responses WHERE session_id = ?
       ORDER BY stage, saved_at ASC`,
      [sid]
    );

    // Count per stage
    const perStage: Record<number, { count: number; timestamps: string[]; keys: string[] }> = {};
    for (const r of responses) {
      const s = r.stage as number;
      if (!perStage[s]) perStage[s] = { count: 0, timestamps: [], keys: [] };
      perStage[s].count++;
      perStage[s].timestamps.push(r.saved_at as string);
      const key = r.question_key as string;
      if (!perStage[s].keys.includes(key)) perStage[s].keys.push(key);
    }

    return NextResponse.json({ session, perStage, totalResponses: responses.length, responses });
  }

  // List all sessions with response counts per stage
  const sessions = queryAll(db, 'SELECT id, candidate_name, status FROM sessions ORDER BY started_at DESC');
  const summary = [];
  for (const s of sessions) {
    const counts = queryAll(
      db,
      `SELECT stage, COUNT(*) as cnt, MIN(saved_at) as first_save, MAX(saved_at) as last_save
       FROM responses WHERE session_id = ? GROUP BY stage`,
      [s.id as string]
    );
    summary.push({
      id: s.id,
      name: s.candidate_name,
      status: s.status,
      stages: counts,
    });
  }

  return NextResponse.json({ sessions: summary });
}
