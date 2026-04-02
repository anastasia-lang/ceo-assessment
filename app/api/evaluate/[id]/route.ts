import { NextRequest, NextResponse } from 'next/server';
import { getEvaluation } from '@/lib/evaluator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const evaluation = await getEvaluation(params.id);

    if (!evaluation) {
      return NextResponse.json({ error: 'No evaluation found' }, { status: 404 });
    }

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Get evaluation error:', error);
    return NextResponse.json({ error: 'Failed to retrieve evaluation' }, { status: 500 });
  }
}
