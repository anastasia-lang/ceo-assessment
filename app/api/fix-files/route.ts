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

  for (const session of completedSessions) {
    const sid = session.id as string;
    await markFileResponsesFinal(sid);
    log.push(`Swept file responses for ${session.candidate_name} (${sid})`);
  }

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
          continue;
        }
        const result = await evaluateCandidate(sid);
        if (result) {
          reEvaluated.push(`${name} (${sid}) — score: ${result.weighted_total.toFixed(1)}, rec: ${result.hiring_memo.recommendation}`);
        } else {
          errors.push(`${name}: evaluateCandidate returned null`);
        }
      } catch (err) {
        errors.push(`${name} (${sid}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } catch (err) {
    errors.push(`Failed to import evaluator: ${err instanceof Error ? err.message : String(err)}`);
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await getAllSessions();
  const completedSessions = sessions
    .filter(s => s.status === 'completed')
    .map(s => ({
      name: s.candidate_name,
      id: s.id,
      stage3_submitted_at: s.stage3_submitted_at,
      completed_at: s.completed_at,
    }));

  return NextResponse.json({
    message: 'GET shows current state. POST to fix files and re-evaluate.',
    completedSessions,
  });
}
