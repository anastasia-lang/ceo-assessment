'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface SessionData {
  candidate_name: string;
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

function CompleteInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/session?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setSession(data);
      })
      .catch(() => {});
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Thank you{session ? `, ${session.candidate_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-white/60 text-lg">Your assessment has been submitted successfully.</p>
        </div>

        {session && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
            <h3 className="text-white/80 font-medium mb-4 text-sm">Time Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Stage 1', time: calcTime(session.stage1_started_at, session.stage1_submitted_at) },
                { label: 'Stage 2', time: calcTime(session.stage2_started_at, session.stage2_submitted_at) },
                { label: 'Stage 3', time: calcTime(session.stage3_started_at, session.stage3_submitted_at) },
              ].map(({ label, time }) => (
                <div key={label}>
                  <div className="text-xs text-white/40 mb-1">{label}</div>
                  <div className="text-white font-mono text-lg">{time}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-white/40 text-sm">
          We&apos;ll review your submission and be in touch.
        </p>

        <div className="mt-8">
          <h2 className="text-lg font-black text-white/20 tracking-tight">PAYVIO</h2>
        </div>
      </div>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center"><div className="text-white/50 text-sm">Loading...</div></div>}>
      <CompleteInner />
    </Suspense>
  );
}
