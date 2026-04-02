'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { stages } from '@/lib/content';

interface ResponseData {
  stage: number;
  question_key: string;
  response_text: string | null;
  response_json: string | null;
  file_path: string | null;
  saved_at: string;
  is_final_submission: number;
}

interface SessionData {
  id: string;
  candidate_name: string;
  candidate_email: string;
  started_at: string;
  status: string;
  stage1_started_at: string | null;
  stage1_submitted_at: string | null;
  stage2_started_at: string | null;
  stage2_submitted_at: string | null;
  stage3_started_at: string | null;
  stage3_submitted_at: string | null;
}

interface ScoreDimension {
  score: number;
  rationale: string;
}

interface EvaluationData {
  scores: Record<string, ScoreDimension>;
  weighted_total: number;
  stage_narratives: { stage1: string; stage2: string; stage3: string };
  hiring_memo: {
    recommendation: string;
    summary: string;
    key_strengths: string[];
    key_concerns: string[];
    comparison_to_ideal: string;
    interview_followups: string[];
  };
}

function calcTime(start: string | null, end: string | null): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

const questionLabels: Record<string, string> = {
  priority_matrix: 'Priority Matrix',
  root_cause_1: 'Root Cause — Item 1',
  root_cause_2: 'Root Cause — Item 2',
  root_cause_3: 'Root Cause — Item 3',
  ceo_memo: 'CEO Escalation Memo',
  strategic_recommendation: 'Strategic Recommendation',
  financial_sketch: 'Financial Sketch',
  stakeholder_alignment: 'Stakeholder Alignment Plan',
  board_briefing: 'Board Briefing',
  ai_reflection: 'AI Reflection',
};

const dimensionLabels: Record<string, { label: string; group: string }> = {
  pattern_recognition: { label: 'Pattern Recognition', group: 'Stage 1' },
  prioritization: { label: 'Prioritization Quality', group: 'Stage 1' },
  ceo_communication: { label: 'CEO Communication', group: 'Stage 1' },
  strategic_thinking: { label: 'Strategic Thinking', group: 'Stage 2' },
  commercial_acumen: { label: 'Commercial Acumen', group: 'Stage 2' },
  stakeholder_navigation: { label: 'Stakeholder Navigation', group: 'Stage 2' },
  output_quality: { label: 'Output Quality', group: 'Stage 3' },
  ai_fluency: { label: 'AI Fluency', group: 'Stage 3' },
  communication_quality: { label: 'Communication Quality', group: 'Cross-Cutting' },
  speed_quality_balance: { label: 'Speed vs Quality Balance', group: 'Cross-Cutting' },
};

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-100 text-emerald-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function recColor(rec: string): string {
  if (rec === 'STRONG YES') return 'bg-emerald-500 text-white';
  if (rec === 'YES') return 'bg-green-500 text-white';
  if (rec === 'MAYBE') return 'bg-amber-500 text-white';
  if (rec === 'LEAN NO') return 'bg-orange-500 text-white';
  if (rec === 'NO') return 'bg-red-500 text-white';
  return 'bg-gray-500 text-white';
}

function barColor(score: number): string {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-green-400';
  if (score >= 4) return 'bg-amber-400';
  return 'bg-red-400';
}

export default function CandidateDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const password = searchParams.get('password') || '';
  const [session, setSession] = useState<SessionData | null>(null);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/${params.id}?password=${encodeURIComponent(password)}`)
      .then(res => {
        if (res.status === 401) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        setSession(data.session);
        const finals = data.finalResponses as ResponseData[];
        const latest = data.latestResponses as ResponseData[];
        setResponses(finals.length > 0 ? finals : latest);
      })
      .catch(err => setError(err.message));

    // Fetch evaluation
    fetch(`/api/evaluate/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.evaluation) setEvaluation(d.evaluation);
      })
      .catch(() => {});
  }, [params.id, password]);

  const handleReEvaluate = async () => {
    setEvalLoading(true);
    setEvalError('');
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: params.id, force: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEvalError(data.error || 'Evaluation failed');
      } else {
        setEvaluation(data.evaluation);
      }
    } catch {
      setEvalError('Failed to connect to evaluation service');
    } finally {
      setEvalLoading(false);
    }
  };

  const handleTriggerEval = async () => {
    setEvalLoading(true);
    setEvalError('');
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: params.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEvalError(data.error || 'Evaluation failed');
      } else {
        setEvaluation(data.evaluation);
      }
    } catch {
      setEvalError('Failed to connect to evaluation service');
    } finally {
      setEvalLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const groupedByStage = stages.map(s => ({
    ...s,
    responses: responses.filter(r => r.stage === s.number),
  }));

  const dimensionGroups = ['Stage 1', 'Stage 2', 'Stage 3', 'Cross-Cutting'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1a1a2e] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-black text-white tracking-tight">PAYVIO</h1>
            <Link
              href={`/admin?password=${encodeURIComponent(password)}`}
              className="text-white/50 text-sm hover:text-white/80"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{session.candidate_name}</h2>
              <p className="text-sm text-gray-500">{session.candidate_email}</p>
            </div>
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
              session.status === 'completed'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {session.status === 'completed' ? 'Completed' : 'In Progress'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div>
              <span className="text-xs text-gray-500">Started</span>
              <p className="text-sm font-medium text-gray-800">
                {new Date(session.started_at).toLocaleString()}
              </p>
            </div>
            {stages.map(s => {
              const startKey = `stage${s.number}_started_at` as keyof SessionData;
              const endKey = `stage${s.number}_submitted_at` as keyof SessionData;
              return (
                <div key={s.number}>
                  <span className="text-xs text-gray-500">Stage {s.number}</span>
                  <p className="text-sm font-medium text-gray-800">
                    {calcTime(session[startKey] as string | null, session[endKey] as string | null)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Evaluation Section */}
        {session.status === 'completed' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">AI Evaluation</h3>
              <div className="flex items-center gap-2">
                {evalError && <span className="text-xs text-red-500">{evalError}</span>}
                {evaluation ? (
                  <button
                    onClick={handleReEvaluate}
                    disabled={evalLoading}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    {evalLoading ? 'Evaluating...' : 'Re-evaluate'}
                  </button>
                ) : (
                  <button
                    onClick={handleTriggerEval}
                    disabled={evalLoading}
                    className="text-sm bg-[#e94560] text-white px-3 py-1.5 rounded-lg hover:bg-[#d63d56] transition-colors disabled:opacity-50"
                  >
                    {evalLoading ? 'Evaluating...' : 'Run AI Evaluation'}
                  </button>
                )}
              </div>
            </div>

            {evalLoading && !evaluation && (
              <div className="bg-white rounded-lg border p-8 text-center">
                <p className="text-gray-500 mb-2">Running AI evaluation...</p>
                <p className="text-xs text-gray-400">This typically takes 10-20 seconds.</p>
              </div>
            )}

            {evaluation && (
              <>
                {/* Score Overview */}
                <div className="bg-white rounded-lg border p-6 mb-4">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className={`text-4xl font-black ${scoreColor(evaluation.weighted_total)}`}>
                        {evaluation.weighted_total.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">out of 100</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-sm font-bold px-3 py-1 rounded-full ${recColor(evaluation.hiring_memo.recommendation)}`}>
                          {evaluation.hiring_memo.recommendation}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{evaluation.hiring_memo.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Dimension Scorecard */}
                <div className="bg-white rounded-lg border p-6 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Dimension Scorecard</h4>
                  {dimensionGroups.map(group => {
                    const dims = Object.entries(dimensionLabels).filter(([, v]) => v.group === group);
                    return (
                      <div key={group} className="mb-4 last:mb-0">
                        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{group}</h5>
                        <div className="space-y-2">
                          {dims.map(([key, meta]) => {
                            const dim = evaluation.scores[key];
                            if (!dim) return null;
                            return (
                              <div key={key} className="flex items-start gap-3">
                                <div className="w-40 shrink-0 text-sm text-gray-700 pt-0.5">{meta.label}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                                      <div
                                        className={`h-2.5 rounded-full ${barColor(dim.score)}`}
                                        style={{ width: `${dim.score * 10}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-bold text-gray-800 w-6 text-right">{dim.score}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">{dim.rationale}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stage Narratives */}
                <div className="grid grid-cols-1 gap-4 mb-4">
                  {(['stage1', 'stage2', 'stage3'] as const).map((key, i) => (
                    <div key={key} className="bg-white rounded-lg border p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Stage {i + 1}: {stages[i].title}
                      </h4>
                      <p className="text-sm text-gray-700">{evaluation.stage_narratives[key]}</p>
                    </div>
                  ))}
                </div>

                {/* Hiring Memo */}
                <div className="bg-white rounded-lg border p-6 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Hiring Memo</h4>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-2">Key Strengths</h5>
                      <ul className="space-y-1">
                        {evaluation.hiring_memo.key_strengths?.map((s, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">+</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-medium text-red-700 uppercase tracking-wide mb-2">Key Concerns</h5>
                      <ul className="space-y-1">
                        {evaluation.hiring_memo.key_concerns?.map((c, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">-</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Comparison to Ideal Profile</h5>
                    <p className="text-sm text-gray-700">{evaluation.hiring_memo.comparison_to_ideal}</p>
                  </div>

                  <div>
                    <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Suggested Interview Follow-ups</h5>
                    <ol className="space-y-1 list-decimal list-inside">
                      {evaluation.hiring_memo.interview_followups?.map((q, i) => (
                        <li key={i} className="text-sm text-gray-700">{q}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </>
            )}

            {!evaluation && !evalLoading && (
              <div className="bg-white rounded-lg border p-6 text-center">
                <p className="text-gray-400 text-sm">
                  No evaluation yet. Click &quot;Run AI Evaluation&quot; to generate one.
                </p>
                {!process.env.NEXT_PUBLIC_HAS_API_KEY && (
                  <p className="text-xs text-gray-400 mt-1">
                    Note: Evaluation requires ANTHROPIC_API_KEY to be configured on the server.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Responses */}
        {groupedByStage.map(stage => (
          <div key={stage.number} className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Stage {stage.number}: {stage.title}
            </h3>
            {stage.responses.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No responses recorded</p>
            ) : (
              <div className="space-y-4">
                {stage.responses.map((resp, i) => (
                  <div key={i} className="bg-white rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-800">
                        {questionLabels[resp.question_key] || resp.question_key}
                      </h4>
                      <span className="text-xs text-gray-400">
                        {new Date(resp.saved_at).toLocaleString()}
                      </span>
                    </div>
                    {resp.response_text && (
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto">
                        {resp.response_text}
                      </div>
                    )}
                    {resp.response_json && (
                      <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-96">
                        {JSON.stringify(JSON.parse(resp.response_json), null, 2)}
                      </pre>
                    )}
                    {resp.file_path && (
                      <div className="mt-2 flex items-center gap-2">
                        <a
                          href={`/api/admin/download?file=${encodeURIComponent(resp.file_path)}&password=${encodeURIComponent(password)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download: {resp.file_path.split('/').pop()}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
