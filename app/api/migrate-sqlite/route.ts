import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const DB_PATH = path.join(process.cwd(), 'data', 'assessment.db');

  if (!fs.existsSync(DB_PATH)) {
    return NextResponse.json({ error: 'SQLite database not found at ' + DB_PATH }, { status: 404 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs({
      locateFile: (file: string) =>
        path.join(process.cwd(), 'node_modules/sql.js/dist', file),
    });

    const fileBuffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(fileBuffer);

    const supabase = getSupabase();

    // Read all sessions from SQLite
    const sessionsStmt = db.prepare('SELECT * FROM sessions');
    const sessions: Record<string, unknown>[] = [];
    while (sessionsStmt.step()) {
      sessions.push({ ...sessionsStmt.getAsObject() });
    }
    sessionsStmt.free();

    // Read all responses from SQLite
    const responsesStmt = db.prepare('SELECT * FROM responses');
    const responses: Record<string, unknown>[] = [];
    while (responsesStmt.step()) {
      responses.push({ ...responsesStmt.getAsObject() });
    }
    responsesStmt.free();

    // Read evaluations if table exists
    let evaluations: Record<string, unknown>[] = [];
    try {
      const evalStmt = db.prepare('SELECT * FROM evaluations');
      while (evalStmt.step()) {
        evaluations.push({ ...evalStmt.getAsObject() });
      }
      evalStmt.free();
    } catch {
      // evaluations table may not exist
    }

    db.close();

    const only = request.nextUrl.searchParams.get('only');

    // Insert sessions into Supabase (upsert = idempotent)
    let sessionsInserted = 0;
    if (!only || only === 'sessions') {
      for (const s of sessions) {
        const { error } = await supabase.from('sessions').upsert({
          id: s.id,
          candidate_name: s.candidate_name,
          candidate_email: s.candidate_email,
          status: s.status,
          started_at: s.started_at,
          stage1_started_at: s.stage1_started_at,
          stage1_submitted_at: s.stage1_submitted_at,
          stage2_started_at: s.stage2_started_at,
          stage2_submitted_at: s.stage2_submitted_at,
          stage3_started_at: s.stage3_started_at,
          stage3_submitted_at: s.stage3_submitted_at,
        }, { onConflict: 'id' });
        if (error) {
          return NextResponse.json({ error: `Session insert failed: ${error.message}`, session: s }, { status: 500 });
        }
        sessionsInserted++;
      }
    }

    // Insert responses into Supabase (skip if already migrated)
    let responsesInserted = 0;
    if (!only || only === 'responses') {
      // Check if responses already exist
      const { data: existing } = await supabase.from('responses').select('id').limit(1);
      if (existing && existing.length > 0) {
        responsesInserted = -1; // skip, already migrated
      } else {
        for (const r of responses) {
          const { error } = await supabase.from('responses').insert({
            session_id: r.session_id,
            stage: r.stage,
            question_key: r.question_key,
            response_text: r.response_text || null,
            response_json: r.response_json || null,
            file_path: r.file_path || null,
            saved_at: r.saved_at,
            is_final_submission: r.is_final_submission,
          });
          if (error) {
            return NextResponse.json({ error: `Response insert failed: ${error.message}`, response: r }, { status: 500 });
          }
          responsesInserted++;
        }
      }
    }

    // Insert evaluations into Supabase (upsert = idempotent)
    let evalsInserted = 0;
    if (!only || only === 'evaluations') {
    for (const e of evaluations) {
      // Build evaluation record with all available fields
      const evalRecord: Record<string, unknown> = {
        session_id: e.session_id,
        overall_score: e.overall_score,
        recommendation: e.recommendation,
        summary: e.summary,
        stage1_score: e.stage1_score,
        stage1_feedback: e.stage1_feedback,
        stage2_score: e.stage2_score,
        stage2_feedback: e.stage2_feedback,
        stage3_score: e.stage3_score,
        stage3_feedback: e.stage3_feedback,
        evaluated_at: e.evaluated_at,
        raw_evaluation: e.raw_evaluation,
        scores_json: e.scores_json || '{}',
        weighted_total: e.weighted_total,
        stage_narratives_json: e.stage_narratives_json || '{}',
        hiring_memo_json: e.hiring_memo_json || '{}',
        model_used: e.model_used,
      };
      const { error } = await supabase.from('evaluations').upsert(evalRecord, { onConflict: 'session_id' });
      if (error) {
        return NextResponse.json({ error: `Evaluation insert failed: ${error.message}`, evaluation: e }, { status: 500 });
      }
      evalsInserted++;
    }
    }

    return NextResponse.json({
      success: true,
      migrated: {
        sessions: sessionsInserted,
        responses: responsesInserted,
        evaluations: evalsInserted,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
