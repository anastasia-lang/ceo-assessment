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

export default function CandidateDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const password = searchParams.get('password') || '';
  const [session, setSession] = useState<SessionData | null>(null);
  const [responses, setResponses] = useState<ResponseData[]>([]);
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
  }, [params.id, password]);

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
