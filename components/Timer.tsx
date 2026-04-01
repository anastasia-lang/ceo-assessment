'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TimerProps {
  sessionId: string;
  stage: number;
  onExpired: () => void;
}

export default function Timer({ sessionId, stage, onExpired }: TimerProps) {
  const [seconds, setSeconds] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const expiredRef = useRef(false);
  const lastSyncRef = useRef<number>(Date.now());
  const serverSecondsRef = useRef<number | null>(null);

  const fetchTime = useCallback(async () => {
    try {
      const res = await fetch(`/api/timer?sessionId=${sessionId}&stage=${stage}`);
      if (!res.ok) return;
      const data = await res.json();
      serverSecondsRef.current = data.remainingSeconds;
      lastSyncRef.current = Date.now();
      setSeconds(data.remainingSeconds);
      setTotalSeconds(data.totalSeconds);

      if (data.expired && !expiredRef.current) {
        expiredRef.current = true;
        onExpired();
      }
    } catch {
      // Silently fail, use local countdown
    }
  }, [sessionId, stage, onExpired]);

  useEffect(() => {
    expiredRef.current = false;
    fetchTime();
    const syncInterval = setInterval(fetchTime, 10000);
    return () => clearInterval(syncInterval);
  }, [fetchTime]);

  useEffect(() => {
    const tick = setInterval(() => {
      setSeconds(prev => {
        if (prev === null) return null;
        const newVal = prev - 1;
        if (newVal <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          setTimeout(() => onExpired(), 0);
          return 0;
        }
        return Math.max(0, newVal);
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [onExpired]);

  if (seconds === null) {
    return <div className="text-white/50 text-sm font-mono">Loading...</div>;
  }

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds <= 300; // 5 minutes
  const isCritical = seconds <= 60; // 1 minute

  return (
    <div
      className={`font-mono text-lg font-bold px-4 py-2 rounded-lg transition-colors ${
        isCritical
          ? 'bg-red-600 text-white animate-pulse'
          : isWarning
          ? 'bg-red-500/20 text-red-400'
          : 'bg-white/10 text-white'
      }`}
    >
      {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}
