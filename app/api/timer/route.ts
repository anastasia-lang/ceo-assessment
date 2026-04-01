import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/db';
import { stages } from '@/lib/content';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  const stageParam = request.nextUrl.searchParams.get('stage');

  if (!sessionId || !stageParam) {
    return NextResponse.json({ error: 'sessionId and stage required' }, { status: 400 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const stage = parseInt(stageParam);
  const stageConfig = stages.find(s => s.number === stage);
  if (!stageConfig) {
    return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
  }

  const startedAtKey = `stage${stage}_started_at`;
  const startedAt = session[startedAtKey] as string | null;

  if (!startedAt) {
    return NextResponse.json({ error: 'Stage not started' }, { status: 400 });
  }

  const startTime = new Date(startedAt).getTime();
  const allowedMs = stageConfig.timeMinutes * 60 * 1000;
  const now = Date.now();
  const elapsed = now - startTime;
  const remaining = Math.max(0, allowedMs - elapsed);
  const remainingSeconds = Math.ceil(remaining / 1000);

  return NextResponse.json({
    remainingSeconds,
    totalSeconds: stageConfig.timeMinutes * 60,
    expired: remainingSeconds <= 0,
    stage,
  });
}
