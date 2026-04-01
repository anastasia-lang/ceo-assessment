'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface AutoSaveProps {
  sessionId: string;
  stage: number;
  data: Record<string, { responseText?: string; responseJson?: unknown }>;
  interval?: number;
}

export default function AutoSave({ sessionId, stage, data, interval = 30000 }: AutoSaveProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const entries = Object.entries(dataRef.current);
      for (const [key, val] of entries) {
        if (!val.responseText && !val.responseJson) continue;
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            stage,
            questionKey: key,
            responseText: val.responseText || null,
            responseJson: val.responseJson || null,
          }),
        });
      }
      setLastSaved(new Date());
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  }, [sessionId, stage]);

  useEffect(() => {
    const timer = setInterval(save, interval);
    return () => clearInterval(timer);
  }, [save, interval]);

  const secondsAgo = lastSaved
    ? Math.floor((Date.now() - lastSaved.getTime()) / 1000)
    : null;

  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-xs text-gray-400 flex items-center gap-1.5">
      {saving ? (
        <>
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          Saving...
        </>
      ) : lastSaved ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          Saved {secondsAgo !== null && secondsAgo < 60 ? `${secondsAgo}s ago` : lastSaved.toLocaleTimeString()}
        </>
      ) : (
        <>
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          Auto-save active
        </>
      )}
    </div>
  );
}
