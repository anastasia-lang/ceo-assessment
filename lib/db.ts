import { getSupabase } from './supabase';

export async function createSession(id: string, name: string, email: string): Promise<void> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase.from('sessions').insert({
    id,
    candidate_name: name,
    candidate_email: email,
    started_at: now,
    stage1_started_at: now,
  });
  if (error) throw error;
}

export async function getSession(id: string): Promise<Record<string, unknown> | undefined> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
  if (error && error.code === 'PGRST116') return undefined; // not found
  if (error) throw error;
  return data as Record<string, unknown>;
}

export async function updateSession(id: string, updates: Record<string, unknown>): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('sessions').update(updates).eq('id', id);
  if (error) throw error;
}

export async function saveResponse(
  sessionId: string,
  stage: number,
  questionKey: string,
  responseText: string | null,
  responseJson: string | null,
  filePath: string | null,
  isFinal: boolean
): Promise<void> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (isFinal) {
    // Un-mark previous finals for this question
    await supabase
      .from('responses')
      .update({ is_final_submission: 0 })
      .eq('session_id', sessionId)
      .eq('stage', stage)
      .eq('question_key', questionKey)
      .eq('is_final_submission', 1);
  }

  // Check for existing non-final draft
  const { data: existing } = await supabase
    .from('responses')
    .select('id')
    .eq('session_id', sessionId)
    .eq('stage', stage)
    .eq('question_key', questionKey)
    .eq('is_final_submission', 0)
    .limit(1)
    .single();

  if (existing && !isFinal) {
    // Update existing draft
    await supabase
      .from('responses')
      .update({
        response_text: responseText,
        response_json: responseJson,
        file_path: filePath,
        saved_at: now,
      })
      .eq('id', existing.id);
  } else {
    // Insert new response
    const { error } = await supabase.from('responses').insert({
      session_id: sessionId,
      stage,
      question_key: questionKey,
      response_text: responseText,
      response_json: responseJson,
      file_path: filePath,
      saved_at: now,
      is_final_submission: isFinal ? 1 : 0,
    });
    if (error) throw error;
  }
}

export async function markFileResponsesFinal(sessionId: string, _stage?: number): Promise<void> {
  const supabase = getSupabase();

  // Get all file responses for this session
  const { data: fileResponses } = await supabase
    .from('responses')
    .select('id, stage, question_key, saved_at')
    .eq('session_id', sessionId)
    .like('question_key', '%_file')
    .order('saved_at', { ascending: false });

  if (!fileResponses || fileResponses.length === 0) return;

  // Group by stage+question_key, keep only the latest (first due to DESC order)
  const latestByKey = new Map<string, number>();
  for (const r of fileResponses) {
    const key = `${r.stage}_${r.question_key}`;
    if (!latestByKey.has(key)) {
      latestByKey.set(key, r.id);
    }
  }

  // Mark the latest of each as final
  const ids = Array.from(latestByKey.values());
  if (ids.length > 0) {
    await supabase
      .from('responses')
      .update({ is_final_submission: 1 })
      .in('id', ids);
  }
}

export async function getResponses(sessionId: string, stage?: number): Promise<Record<string, unknown>[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('saved_at', { ascending: false });

  if (stage !== undefined) {
    query = query.eq('stage', stage);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Record<string, unknown>[];
}

export async function getFinalResponses(sessionId: string): Promise<Record<string, unknown>[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_final_submission', 1)
    .order('stage')
    .order('question_key');
  if (error) throw error;
  return (data || []) as Record<string, unknown>[];
}

export async function getAllSessions(): Promise<Record<string, unknown>[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Record<string, unknown>[];
}

export async function getLatestResponses(sessionId: string): Promise<Record<string, unknown>[]> {
  const supabase = getSupabase();

  // Get all responses, then deduplicate in JS keeping the latest per stage+question_key
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('saved_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  const seen = new Map<string, Record<string, unknown>>();
  for (const r of data) {
    const key = `${r.stage}_${r.question_key}`;
    if (!seen.has(key)) {
      seen.set(key, r as Record<string, unknown>);
    }
  }

  // Sort by stage, then question_key
  return Array.from(seen.values()).sort((a, b) => {
    const stageDiff = (a.stage as number) - (b.stage as number);
    if (stageDiff !== 0) return stageDiff;
    return (a.question_key as string).localeCompare(b.question_key as string);
  });
}

/**
 * Calculate working time per stage for a session.
 * Uses session-level timestamps (stageN_started_at → stageN_submitted_at).
 * Falls back to response timestamp range if session timestamps are missing.
 */
const MAX_STAGE_MS = 60 * 60 * 1000; // 60-minute cap

export async function getActiveTime(
  sessionId: string
): Promise<Record<number, number>> {
  const supabase = getSupabase();
  const result: Record<number, number> = {};

  const { data: session } = await supabase
    .from('sessions')
    .select('stage1_started_at, stage1_submitted_at, stage2_started_at, stage2_submitted_at, stage3_started_at, stage3_submitted_at')
    .eq('id', sessionId)
    .single();

  if (!session) return result;

  const s = session as Record<string, unknown>;
  for (let stage = 1; stage <= 3; stage++) {
    const startKey = `stage${stage}_started_at`;
    const endKey = `stage${stage}_submitted_at`;
    const start = s[startKey] as string | null;
    const end = s[endKey] as string | null;

    if (start && end) {
      const ms = new Date(end).getTime() - new Date(start).getTime();
      if (ms > 0 && ms <= MAX_STAGE_MS) {
        result[stage] = ms;
        continue;
      }
      if (ms > MAX_STAGE_MS) {
        result[stage] = MAX_STAGE_MS;
        continue;
      }
    }

    // Fallback: use response timestamps
    const { data: responses } = await supabase
      .from('responses')
      .select('saved_at')
      .eq('session_id', sessionId)
      .eq('stage', stage)
      .order('saved_at');

    if (responses && responses.length > 0) {
      const first = responses[0].saved_at as string;
      const last = responses[responses.length - 1].saved_at as string;
      const ms = new Date(last).getTime() - new Date(first).getTime();
      result[stage] = Math.min(Math.max(ms, 0), MAX_STAGE_MS);
    }
  }

  return result;
}

/** Get all evaluations as a map keyed by session_id */
export async function getAllEvaluations(): Promise<Record<string, Record<string, unknown>>> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('evaluations').select('*');
  if (error) throw error;
  const map: Record<string, Record<string, unknown>> = {};
  for (const row of data || []) {
    map[row.session_id as string] = row as Record<string, unknown>;
  }
  return map;
}
