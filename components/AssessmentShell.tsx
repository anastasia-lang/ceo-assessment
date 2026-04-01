'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Timer from './Timer';
import StageNav from './StageNav';
import AutoSave from './AutoSave';
import SubmitModal from './SubmitModal';
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
