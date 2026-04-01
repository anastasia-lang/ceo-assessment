import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession, saveResponse, getResponses } from '@/lib/db';
import { stages } from '@/lib/content';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, stage, responses: stageResponses } = await request.json();

    if (!sessionId || !stage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if ((session.current_stage as number) !== stage) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (stageResponses && Array.isArray(stageResponses)) {
      for (const resp of stageResponses) {
        saveResponse(
          sessionId,
          stage,
          resp.questionKey,
          resp.responseText || null,
          resp.responseJson ? JSON.stringify(resp.responseJson) : null,
          null,
          true
        );
      }
    } else {
      const existing = getResponses(sessionId, stage);
      const seen = new Set<string>();
      for (const resp of existing) {
        const key = resp.question_key as string;
        if (!seen.has(key)) {
          seen.add(key);
          saveResponse(
            sessionId,
            stage,
            key,
            resp.response_text as string | null,
            resp.response_json as string | null,
            resp.file_path as string | null,
            true
          );
        }
      }
    }

    const updates: Record<string, unknown> = {
      [`stage${stage}_submitted_at`]: now,
    };

    if (stage < stages.length) {
      updates.current_stage = stage + 1;
      updates[`stage${stage + 1}_started_at`] = now;
    } else {
      updates.completed_at = now;
      updates.status = 'completed';
    }

    updateSession(sessionId, updates);

    return NextResponse.json({
      success: true,
      nextStage: stage < stages.length ? stage + 1 : null,
      completed: stage >= stages.length,
    });
  } catch (error) {
    console.error('Submit stage error:', error);
    return NextResponse.json({ error: 'Failed to submit stage' }, { status: 500 });
  }
}
