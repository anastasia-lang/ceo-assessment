import { NextRequest, NextResponse } from 'next/server';
import { evaluateCandidate, deleteEvaluation, getEvaluation } from '@/lib/evaluator';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, force } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Evaluation unavailable — no API key configured.' },
        { status: 503 }
      );
    }

    // If force, delete existing evaluation first
    if (force) {
      await deleteEvaluation(sessionId);
    }

    // Check for existing (idempotent)
    if (!force) {
      const existing = await getEvaluation(sessionId);
      if (existing) {
        return NextResponse.json({ evaluation: existing, cached: true });
      }
    }

    const evaluation = await evaluateCandidate(sessionId);
    return NextResponse.json({ evaluation, cached: false });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Evaluation failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
