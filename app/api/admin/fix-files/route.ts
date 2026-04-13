import { NextRequest, NextResponse } from 'next/server';
import { getAllSessions, markFileResponsesFinal, getActiveTime } from '@/lib/db';

export async function POST(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log: string[] = [];
  const sessions = await getAllSessions();
  const completedSessions = sessions.filter(s => s.status === 'completed');

  // Step 1: Sweep file responses per session
  for (const session of completedSessions) {
    const sid = session.id as string;
    await markFileResponsesFinal(sid);
    log.push(`Swept file responses for ${session.candidate_name} (${sid})`);
  }

  // Step 2: Calculate active times
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

  // Step 3: Re-evaluate candidates without evaluations
  const reEvaluated: string[] = [];
  const errors: string[] = [];

  try {
    const { evaluateCandidate, getEvaluation } = await import('@/lib/evaluator');

    for (const session of completedSessions) {
      const sid = session.id as string;
      const name = session.candidate_name as string;
      try {
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
    activeTimes,
    completedCandidates: completedSessions.length,
    reEvaluated,
    errors,
    log,
  });
}

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized — pass ?password=...' }, { status: 401 });
  }

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

  const activeTimes: Record<string, Record<number, number>> = {};
  for (const s of sessions.filter(s => s.status === 'completed')) {
    const at = await getActiveTime(s.id as string);
    activeTimes[s.candidate_name as string] = at;
  }

  return NextResponse.json({
    message: 'GET shows current state. POST to fix files and re-evaluate.',
    completedSessions,
    activeTimes,
  });
}
