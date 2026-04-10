import { NextRequest, NextResponse } from 'next/server';
import { getAllSessions, getActiveTime } from '@/lib/db';

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await getAllSessions();

  // Calculate active time for each session
  const sessionsWithActiveTime = await Promise.all(
    sessions.map(async (s) => {
      const activeTime = await getActiveTime(s.id as string);
      return { ...s, activeTime };
    })
  );

  return NextResponse.json(sessionsWithActiveTime);
}
