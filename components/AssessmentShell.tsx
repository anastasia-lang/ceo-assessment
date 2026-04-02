'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Timer from './Timer';
import StageNav from './StageNav';
import AutoSave from './AutoSave';
import SubmitModal from './SubmitModal';
import { CompanyFactSheetContent } from './CompanyFactSheet';
import { stages } from '@/lib/content';

interface AssessmentShellProps {
  stage: number;
  children: React.ReactNode;
  responses: Record<string, { responseText?: string; responseJson?: unknown }>;
  onSubmit?: () => { questionKey: string; responseText?: string; responseJson?: unknown }[];
}

export default function AssessmentShell({ stage, children, responses, onSubmit }: AssessmentShellProps) {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showFactSheet, setShowFactSheet] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const stageConfig = stages.find(s => s.number === stage)!;
  const isLast = stage === stages.length;

  const doSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const stageResponses = onSubmit ? onSubmit() : Object.entries(responses).map(([key, val]) => ({
        questionKey: key,
        responseText: val.responseText,
        responseJson: val.responseJson,
      }));

      const res = await fetch('/api/submit-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, stage, responses: stageResponses }),
      });

      const data = await res.json();
      if (data.completed) {
        router.push(`/complete?sessionId=${sessionId}`);
      } else if (data.nextStage) {
        router.push(`/assessment/stage${data.nextStage}?sessionId=${sessionId}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
      setShowModal(false);
    }
  }, [sessionId, stage, responses, onSubmit, router]);

  const handleExpired = useCallback(() => {
    doSubmit();
  }, [doSubmit]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#1a1a2e] sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-black text-white tracking-tight">PAYVIO</h1>
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/80 text-sm font-medium">
              Stage {stage} of {stages.length}: {stageConfig.title}
            </span>
            <StageNav currentStage={stage} />
          </div>
          <Timer sessionId={sessionId} stage={stage} onExpired={handleExpired} />
        </div>
      </div>

      {/* Company Fact Sheet Toggle */}
      <button
        onClick={() => setShowFactSheet(!showFactSheet)}
        className="fixed top-16 right-4 z-50 bg-[#1a1a2e] text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg hover:bg-[#1a1a2e]/90 transition-colors border border-white/20 flex items-center gap-1.5"
      >
        <span>📊</span> Company Info
      </button>

      {/* Fact Sheet Slide-out Drawer */}
      {showFactSheet && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setShowFactSheet(false)} />
          <div className="fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-[#1a1a2e]">
              <h3 className="text-sm font-bold text-white">Payvio Company Fact Sheet</h3>
              <button
                onClick={() => setShowFactSheet(false)}
                className="text-white/60 hover:text-white text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <CompanyFactSheetContent />
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Bottom bar */}
      <div className="bg-white border-t sticky bottom-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <AutoSave sessionId={sessionId} stage={stage} data={responses} />
          <button
            onClick={() => setShowModal(true)}
            disabled={submitting}
            className="bg-[#e94560] text-white font-medium px-6 py-2.5 rounded-lg hover:bg-[#d63d56] transition-colors disabled:opacity-50 text-sm"
          >
            {submitting
              ? 'Submitting...'
              : isLast
              ? 'Submit Assessment'
              : 'Submit Stage & Continue'}
          </button>
        </div>
      </div>

      {showModal && (
        <SubmitModal
          stage={stage}
          isLast={isLast}
          onConfirm={doSubmit}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
