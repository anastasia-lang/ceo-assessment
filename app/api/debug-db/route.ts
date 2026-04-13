import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  const adminPassword = process.env.ADMIN_PASSWORD || 'payvio2024';

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  const sid = request.nextUrl.searchParams.get('sid');

  if (sid) {
    const { data: session } = await supabase.from('sessions').select('*').eq('id', sid);
    const { data: responses } = await supabase
      .from('responses')
      .select('stage, question_key, saved_at, is_final_submission, file_path')
      .eq('session_id', sid)
      .order('stage')
      .order('saved_at');

    const perStage: Record<number, { count: number; timestamps: string[]; keys: string[] }> = {};
    for (const r of responses || []) {
      const s = r.stage as number;
      if (!perStage[s]) perStage[s] = { count: 0, timestamps: [], keys: [] };
      perStage[s].count++;
      perStage[s].timestamps.push(r.saved_at as string);
      const key = r.question_key as string;
      if (!perStage[s].keys.includes(key)) perStage[s].keys.push(key);
    }

    return NextResponse.json({ session, perStage, totalResponses: (responses || []).length, responses });
  }

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, candidate_name, status')
    .order('started_at', { ascending: false });

  const summary = [];
  for (const s of sessions || []) {
    const { data: responses } = await supabase
      .from('responses')
      .select('stage, saved_at')
      .eq('session_id', s.id as string);

    const stageMap: Record<number, { cnt: number; first_save: string; last_save: string }> = {};
    for (const r of responses || []) {
      const stage = r.stage as number;
      const saved = r.saved_at as string;
      if (!stageMap[stage]) {
        stageMap[stage] = { cnt: 0, first_save: saved, last_save: saved };
      }
      stageMap[stage].cnt++;
      if (saved < stageMap[stage].first_save) stageMap[stage].first_save = saved;
      if (saved > stageMap[stage].last_save) stageMap[stage].last_save = saved;
    }

    summary.push({
      id: s.id,
      name: s.candidate_name,
      status: s.status,
      stages: Object.entries(stageMap).map(([stage, data]) => ({ stage: Number(stage), ...data })),
    });
  }

  return NextResponse.json({ sessions: summary });
}
