import { NextRequest, NextResponse } from 'next/server';
import { getAllSessions, getFinalResponses, getLatestResponses, getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await getAllSessions();
  const db = await getDb();

  // Load all evaluations
  const evalMap: Record<string, Record<string, unknown>> = {};
  const evalStmt = db.prepare('SELECT * FROM evaluations');
  while (evalStmt.step()) {
    const row = evalStmt.getAsObject() as Record<string, unknown>;
    evalMap[row.session_id as string] = row;
  }
  evalStmt.free();

  const dimensionKeys = [
    'pattern_recognition', 'prioritization', 'ceo_communication',
    'strategic_thinking', 'commercial_acumen', 'stakeholder_navigation',
    'output_quality', 'ai_fluency', 'communication_quality', 'speed_quality_balance',
  ];

  const rows: string[] = [];

  rows.push([
    'Candidate Name', 'Email', 'Started At', 'Status',
    'Stage 1 Time', 'Stage 2 Time', 'Stage 3 Time',
    'Weighted Total', 'Recommendation',
    ...dimensionKeys.map(k => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
    'Summary',
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

    const ev = evalMap[sid];
    let scores: Record<string, { score: number }> = {};
    let weightedTotal = '';
    let recommendation = '';
    let summary = '';

    if (ev) {
      try {
        scores = JSON.parse(ev.scores_json as string);
        weightedTotal = String(ev.weighted_total);
        const memo = JSON.parse(ev.hiring_memo_json as string);
        recommendation = memo.recommendation || '';
        summary = memo.summary || '';
      } catch {}
    }

    const evalCols = [
      weightedTotal,
      recommendation,
      ...dimensionKeys.map(k => scores[k]?.score != null ? String(scores[k].score) : ''),
      summary,
    ];

    if (responses.length === 0) {
      rows.push([
        session.candidate_name, session.candidate_email, session.started_at, session.status,
        calcTime(session.stage1_started_at, session.stage1_submitted_at),
        calcTime(session.stage2_started_at, session.stage2_submitted_at),
        calcTime(session.stage3_started_at, session.stage3_submitted_at),
        ...evalCols,
        '', '', '', '',
      ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
    } else {
      for (const resp of responses) {
        rows.push([
          session.candidate_name, session.candidate_email, session.started_at, session.status,
          calcTime(session.stage1_started_at, session.stage1_submitted_at),
          calcTime(session.stage2_started_at, session.stage2_submitted_at),
          calcTime(session.stage3_started_at, session.stage3_submitted_at),
          ...evalCols,
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
