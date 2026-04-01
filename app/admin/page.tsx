'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Session {
  id: string;
  candidate_name: string;
  candidate_email: string;
  started_at: string;
  current_stage: number;
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
  return `${Math.floor(ms / 60000)}m`;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState('');

  const fetchSessions = useCallback(async (pw: string) => {
    const res = await fetch(`/api/admin/sessions?password=${encodeURIComponent(pw)}`);
    if (res.status === 401) {
      setError('Invalid password');
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setSessions(data);
    setAuthed(true);
    setError('');
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(password);
  };

  useEffect(() => {
    const stored = sessionStorage.getItem('adminPw');
    if (stored) {
      setPassword(stored);
      fetchSessions(stored);
    }
  }, [fetchSessions]);

  useEffect(() => {
    if (authed) {
      sessionStorage.setItem('adminPw', password);
    }
  }, [authed, password]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="max-w-sm w-full space-y-4">
          <h1 className="text-xl font-bold text-white text-center mb-6">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#e94560]/50"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#e94560] text-white font-medium py-3 rounded-lg hover:bg-[#d63d56] transition-colors"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1a1a2e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-black text-white tracking-tight">PAYVIO</h1>
          <span className="text-white/50 text-sm">Admin Dashboard</span>
        </div>
        <a
          href={`/api/admin/export?password=${encodeURIComponent(password)}`}
          className="bg-white/10 text-white text-sm px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
        >
          Export CSV
        </a>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Candidate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Started</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage 1</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage 2</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage 3</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">No submissions yet</td>
                </tr>
              )}
              {sessions.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/${s.id}?password=${encodeURIComponent(password)}`}
                      className="text-[#e94560] hover:underline font-medium"
                    >
                      {s.candidate_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.candidate_email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(s.started_at).toLocaleDateString()}{' '}
                    {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{calcTime(s.stage1_started_at, s.stage1_submitted_at)}</td>
                  <td className="px-4 py-3 text-gray-600">{calcTime(s.stage2_started_at, s.stage2_submitted_at)}</td>
                  <td className="px-4 py-3 text-gray-600">{calcTime(s.stage3_started_at, s.stage3_submitted_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      s.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {s.status === 'completed' ? 'Completed' : `Stage ${s.current_stage}`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
