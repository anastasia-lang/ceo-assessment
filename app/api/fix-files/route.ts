import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAllSessions, markFileResponsesFinal, getActiveTime } from '@/lib/db';
import path from 'path';
import fs from 'fs';

function persistDb(db: import('sql.js').Database): void {
  const DB_PATH = path.join(process.cwd(), 'data', 'assessment.db');
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function POST(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const log: string[] = [];

  // Step 1: Bulk-mark ALL _file responses as final where file_path exists
  db.run(
    `UPDATE responses SET is_final_submission = 1
     WHERE question_key LIKE '%_file'
       AND file_path IS NOT NULL
       AND is_final_submission = 0`
  );
  persistDb(db);

  // Count total file responses now marked final
  const countStmt = db.prepare(
    `SELECT COUNT(*) as cnt FROM responses
     WHERE question_key LIKE '%_file'
       AND file_path IS NOT NULL
       AND is_final_submission = 1`
  );
  countStmt.step();
  const fileCount = (countStmt.getAsObject() as { cnt: number }).cnt;
  countStmt.free();
  log.push(`Marked ${fileCount} file response(s) as final`);

  // Step 2: Sweep file responses per session
  const sessions = await getAllSessions();
  const completedSessions = sessions.filter(s => s.status === 'completed');

  for (const session of completedSessions) {
    const sid = session.id as string;
    await markFileResponsesFinal(sid);
    log.push(`Swept file responses for ${session.candidate_name} (${sid})`);
  }

  // Step 3: Restore stage 3 timestamps that were overwritten on April 10 ~18:10 UTC.
  // For each completed session, find the latest non-April-10 stage 3 response
  // as the real submission time.
  const timestampFixes: string[] = [];
  const BAD_DATE_PREFIX = '2026-04-10T18:1'; // The overwrite happened at ~18:10:31

  for (const session of completedSessions) {
    const sid = session.id as string;
    const name = session.candidate_name as string;
    const currentS3Sub = session.stage3_submitted_at as string | null;

    // Skip if stage 3 wasn't submitted or doesn't have the bad timestamp
    if (!currentS3Sub || !currentS3Sub.startsWith(BAD_DATE_PREFIX)) continue;

    // Find the latest stage 3 response saved_at that ISN'T from the April 10 overwrite
    const stmt = db.prepare(
      `SELECT MAX(saved_at) as real_submit FROM responses
       WHERE session_id = ? AND stage = 3
         AND saved_at < '2026-04-10T18:00:00'
         AND question_key NOT LIKE '%_file'`
    );
    stmt.bind([sid]);
    let realSubmit: string | null = null;
    if (stmt.step()) {
      realSubmit = (stmt.getAsObject() as { real_submit: string | null }).real_submit;
    }
    stmt.free();

    if (realSubmit) {
      db.run(
        `UPDATE sessions SET stage3_submitted_at = ?, completed_at = ? WHERE id = ?`,
        [realSubmit, realSubmit, sid]
      );
      timestampFixes.push(`${name}: stage3_submitted_at ${currentS3Sub} → ${realSubmit}`);
      log.push(`Fixed stage 3 timestamp for ${name}: ${currentS3Sub} → ${realSubmit}`);
    } else {
      log.push(`No pre-April-10 stage 3 responses found for ${name}, skipping timestamp fix`);
    }
  }

  if (timestampFixes.length > 0) {
    persistDb(db);
  }

  // Step 4: Calculate active times for completed candidates
  const activeTimes: Record<string, Record<number, number>> = {};
  for (const session of completedSessions) {
    const sid = session.id as string;
    const at = await getActiveTime(sid);
    activeTimes[session.candidate_name as string] = at;
    const s1 = Math.floor((at[1] || 0) / 60000);
    const s2 = Math.floor((at[2] || 0) / 60000);
    const s3 = Math.floor((at[3] || 0) / 60000);
    log.push(`Active time for ${session.candidate_name}: S1=${s1}m, S2=${s2}m, S3=${s3}m`);
  }

  // Step 5: Re-evaluate all completed candidates
  // Only re-evaluate candidates without an existing evaluation (safe: won't delete then fail)
  const reEvaluated: string[] = [];
  const errors: string[] = [];

  try {
    const { evaluateCandidate, getEvaluation } = await import('@/lib/evaluator');

    for (const session of completedSessions) {
      const sid = session.id as string;
      const name = session.candidate_name as string;
      try {
        // Check if evaluation already exists — if so, skip (don't delete+recreate)
        const existing = await getEvaluation(sid);
        if (existing) {
          reEvaluated.push(`${name} (${sid}) — existing score: ${existing.weighted_total.toFixed(1)}, rec: ${existing.hiring_memo.recommendation}`);
          log.push(`${name}: keeping existing evaluation (${existing.weighted_total.toFixed(1)})`);
          continue;
        }

        const result = await evaluateCandidate(sid);
        if (result) {
          reEvaluated.push(`${name} (${sid}) — score: ${result.weighted_total.toFixed(1)}, rec: ${result.hiring_memo.recommendation}`);
          log.push(`Evaluated ${name}: ${result.weighted_total.toFixed(1)} — ${result.hiring_memo.recommendation}`);
        } else {
          errors.push(`${name}: evaluateCandidate returned null (missing API key?)`);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        errors.push(`${name} (${sid}): ${errMsg}`);
        log.push(`ERROR evaluating ${name}: ${errMsg}`);
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to import evaluator: ${errMsg}`);
    log.push(`ERROR: Could not load evaluator module — ${errMsg}`);
  }

  return NextResponse.json({
    success: true,
    fileResponsesMarkedFinal: fileCount,
    timestampFixes,
    activeTimes,
    completedCandidates: completedSessions.length,
    reEvaluated,
    errors,
    log,
  });
}

// GET: show current state for debugging
export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized — pass ?password=...' }, { status: 401 });
  }

  const db = await getDb();

  // Show current state of file responses
  const stmt = db.prepare(
    `SELECT session_id, stage, question_key, file_path, is_final_submission, saved_at
     FROM responses
     WHERE question_key LIKE '%_file'
     ORDER BY session_id, stage`
  );
  const fileResponses: Record<string, unknown>[] = [];
  while (stmt.step()) {
    fileResponses.push({ ...stmt.getAsObject() });
  }
  stmt.free();

  // Show sessions with current stage 3 timestamps
  const sessions = await getAllSessions();
  const completedSessions = sessions
    .filter(s => s.status === 'completed')
    .map(s => ({
      name: s.candidate_name,
      id: s.id,
      stage3_started_at: s.stage3_started_at,
      stage3_submitted_at: s.stage3_submitted_at,
      completed_at: s.completed_at,
    }));

  // Calculate active times
  const activeTimes: Record<string, Record<number, number>> = {};
  for (const s of sessions.filter(s => s.status === 'completed')) {
    const at = await getActiveTime(s.id as string);
    activeTimes[s.candidate_name as string] = at;
  }

  return NextResponse.json({
    message: 'GET shows current state. POST to fix files, restore timestamps, and re-evaluate.',
    fileResponses,
    totalFileRecords: fileResponses.length,
    markedFinal: fileResponses.filter(r => r.is_final_submission === 1).length,
    notFinal: fileResponses.filter(r => r.is_final_submission === 0).length,
    completedSessions,
    activeTimes,
  });
}
