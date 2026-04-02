'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { companyContext, stages } from '@/lib/content';
import { CompanyFactSheetCard } from '@/components/CompanyFactSheet';

export default function LandingPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please fill in both fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      if (!res.ok) throw new Error('Failed to start');
      const { sessionId } = await res.json();
      localStorage.setItem('sessionId', sessionId);
      router.push(`/assessment/stage1?sessionId=${sessionId}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalTime = stages.reduce((acc, s) => acc + s.timeMinutes, 0);

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">
            PAYVIO
          </h1>
          <div className="w-12 h-1 bg-[#e94560] mx-auto mb-8 rounded-full" />
          <h2 className="text-2xl font-bold text-white mb-2">CEO Office Assessment</h2>
          <p className="text-white/60 text-lg">A simulated day in the CEO Office at Payvio</p>
        </div>

        <div className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-8 mb-8">
          <div className="mb-8">
            <h3 className="text-white font-semibold mb-3">About the Company</h3>
            <p className="text-white/70 text-sm leading-relaxed">{companyContext.description}</p>
          </div>

          <div className="mb-8">
            <h3 className="text-white font-semibold mb-3">About the Role</h3>
            <p className="text-white/70 text-sm leading-relaxed">{companyContext.roleDescription}</p>
          </div>

          <div className="mb-8">
            <h3 className="text-white font-semibold mb-3">What to Expect</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4">{companyContext.assessmentDescription}</p>
            <div className="grid grid-cols-3 gap-3">
              {stages.map(s => (
                <div key={s.number} className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-xs text-white/50 mb-1">Stage {s.number}</div>
                  <div className="text-white font-semibold text-sm">{s.title}</div>
                  <div className="text-[#e94560] text-xs mt-1">{s.timeMinutes} min</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-3 text-sm text-white/50">
              Total time: {totalTime} minutes ({Math.floor(totalTime / 60)}h {totalTime % 60}m)
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-white font-semibold mb-1">Company Context</h3>
            <p className="text-white/50 text-xs mb-4">Review this before starting — you&apos;ll need it during the assessment.</p>
            <div className="bg-white/5 rounded-lg border border-white/10 p-4">
              <CompanyFactSheetCard />
            </div>
          </div>

          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 focus:border-[#e94560]"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 focus:border-[#e94560]"
                placeholder="your@email.com"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e94560] text-white font-semibold py-3 rounded-lg hover:bg-[#d63d56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting...' : 'Begin Assessment'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs leading-relaxed">
          Once you start, the timer begins. You&apos;ll have {totalTime} minutes total across {stages.length} stages.
          Make sure you have uninterrupted time.
        </p>
      </div>
    </div>
  );
}
