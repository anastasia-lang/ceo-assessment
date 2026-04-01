import { NextRequest, NextResponse } from 'next/server';
import { getSession, getLatestResponses, getFinalResponses } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = getSession(params.id);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const finalResponses = getFinalResponses(params.id);
  const latestResponses = getLatestResponses(params.id);

  return NextResponse.json({
    session,
    finalResponses,
    latestResponses,
  });
}
