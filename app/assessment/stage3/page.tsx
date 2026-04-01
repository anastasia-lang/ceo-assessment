'use client';

import { Suspense, useState, useCallback } from 'react';
import AssessmentShell from '@/components/AssessmentShell';
import SlackMessage from '@/components/SlackMessage';
import RichTextEditor from '@/components/RichTextEditor';
import { stage3Brief, stage3Competitors, stage3Differentiators, stage3Questions } from '@/lib/content';

function Stage3Inner() {
  const [boardBriefing, setBoardBriefing] = useState('');
  const [aiReflection, setAiReflection] = useState('');
  const [expandedComp, setExpandedComp] = useState<string | null>(null);

  const responses: Record<string, { responseText?: string; responseJson?: unknown }> = {
    board_briefing: { responseText: boardBriefing },
    ai_reflection: { responseText: aiReflection },
  };

  const onSubmit = useCallback(() => [
    { questionKey: 'board_briefing', responseText: boardBriefing },
    { questionKey: 'ai_reflection', responseText: aiReflection },
  ], [boardBriefing, aiReflection]);

  return (
    <AssessmentShell stage={3} responses={responses} onSubmit={onSubmit}>
      <div className="max-w-5xl mx-auto p-6 space-y-6 h-[calc(100vh-140px)] overflow-y-auto">
        {/* AI usage note */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-800">AI Tools Encouraged</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              You&apos;re encouraged to use AI tools (Claude, ChatGPT, Perplexity, etc.) in another tab.
              The timer continues while you work.
            </p>
          </div>
        </div>

        {/* Task brief as Slack DM */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm font-bold text-gray-800">Direct Message — Marco Ferretti</span>
          </div>
          <SlackMessage
            sender={stage3Brief.sender}
            role={stage3Brief.senderRole}
            message={stage3Brief.content}
            channel={stage3Brief.channel}
          />
        </div>

        {/* Competitor context */}
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-gray-800">Competitor Context</h3>
          </div>
          <div className="divide-y">
            {stage3Competitors.map(comp => (
              <div key={comp.name} className="px-4 py-3">
                <button
                  onClick={() => setExpandedComp(expandedComp === comp.name ? null : comp.name)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 text-sm">{comp.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{comp.hq}</span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedComp === comp.name ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedComp === comp.name && (
                  <p className="text-sm text-gray-600 mt-2">{comp.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payvio differentiators */}
        <div className="bg-[#1a1a2e]/5 rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Payvio&apos;s Key Differentiators</h3>
          <ul className="space-y-1">
            {stage3Differentiators.map((d, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-[#e94560] mt-0.5">•</span>
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Board briefing editor */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">{stage3Questions[0].title}</h3>
          <p className="text-sm text-gray-600 mb-3">{stage3Questions[0].description}</p>
          <RichTextEditor
            value={boardBriefing}
            onChange={setBoardBriefing}
            minHeight="500px"
            placeholder="Write your board-ready competitive positioning briefing here..."
          />
        </div>

        {/* AI Reflection */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">{stage3Questions[1].title}</h3>
          <p className="text-sm text-gray-600 mb-3">{stage3Questions[1].description}</p>
          <RichTextEditor
            value={aiReflection}
            onChange={setAiReflection}
            maxWords={200}
            minHeight="150px"
            placeholder="How did you use AI tools? What did you draft yourself vs. delegate?"
          />
        </div>
      </div>
    </AssessmentShell>
  );
}

export default function Stage3Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><div className="text-gray-400 text-sm">Loading...</div></div>}>
      <Stage3Inner />
    </Suspense>
  );
}
