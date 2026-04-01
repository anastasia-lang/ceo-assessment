'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AssessmentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    fetch(`/api/session?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          router.push('/');
          return;
        }
        const stage = data.current_stage || 1;
        if (data.status === 'completed') {
          router.push(`/complete?sessionId=${sessionId}`);
        } else {
          router.push(`/assessment/stage${stage}?sessionId=${sessionId}`);
        }
      })
      .catch(() => router.push('/'));
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center">
      <div className="text-white/50 text-sm">Loading assessment...</div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center"><div className="text-white/50 text-sm">Loading...</div></div>}>
      <AssessmentInner />
    </Suspense>
  );
}
