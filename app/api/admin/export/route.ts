import { NextRequest, NextResponse } from 'next/server';
import { getAllSessions, getFinalResponses, getLatestResponses } from '@/lib/db';

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await getAllSessions();
  const rows: string[] = [];

  rows.push([
    'Candidate Name', 'Email', 'Started At', 'Status',
    'Stage 1 Time', 'Stage 2 Time', 'Stage 3 Time',
    'Stage', 'Question Key', 'Response Text', 'Response JSON',
  ].map(h => `"${h}"`).join(','));

  const calcTime = (start: unknown, end: unknown) => {
    if (!start || !end) return '';
    const ms = new Date(end as string).getTime() - new Date(start as string).getTime();
    return `${Math.floor(ms / 60000)}m`;
  };

  for (const session of sessions) {
    const sid = session.id as string;
    let responses = await getFinalResponses(sid);
    if (responses.length === 0) responses = await getLatestResponses(sid);

    if (responses.length === 0) {
      rows.push([
        session.candidate_name, session.candidate_email, session.started_at, session.status,
        calcTime(session.stage1_started_at, session.stage1_submitted_at),
        calcTime(session.stage2_started_at, session.stage2_submitted_at),
        calcTime(session.stage3_started_at, session.stage3_submitted_at),
        '', '', '', '',
      ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
    } else {
      for (const resp of responses) {
        rows.push([
          session.candidate_name, session.candidate_email, session.started_at, session.status,
          calcTime(session.stage1_started_at, session.stage1_submitted_at),
          calcTime(session.stage2_started_at, session.stage2_submitted_at),
          calcTime(session.stage3_started_at, session.stage3_submitted_at),
          resp.stage, resp.question_key, resp.response_text || '', resp.response_json || '',
        ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
      }
    }
  }

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="assessment-export.csv"',
    },
  });
}
