import { NextRequest, NextResponse } from 'next/server';
import { getSession, getLatestResponses, getFinalResponses, getActiveTime } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const [finalResponses, latestResponses, activeTime] = await Promise.all([
    getFinalResponses(params.id),
    getLatestResponses(params.id),
    getActiveTime(params.id),
  ]);

  return NextResponse.json({ session, finalResponses, latestResponses, activeTime });
}
