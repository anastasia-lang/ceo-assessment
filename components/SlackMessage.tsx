'use client';

interface SlackMessageProps {
  sender: string;
  role: string;
  message: string;
  sentiment?: string;
  channel?: string;
  timestamp?: string;
}

const sentimentBadge: Record<string, { label: string; className: string }> = {
  strongly_for: { label: 'Strongly For', className: 'bg-green-100 text-green-700' },
  cautious: { label: 'Cautious', className: 'bg-yellow-100 text-yellow-700' },
  supportive_but_realistic: { label: 'Supportive but Realistic', className: 'bg-blue-100 text-blue-700' },
  conditional: { label: 'Conditional', className: 'bg-orange-100 text-orange-700' },
};

export default function SlackMessage({ sender, role, message, sentiment, channel, timestamp }: SlackMessageProps) {
  const initial = sender.charAt(0);
  const colorIdx = sender.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 8;
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-amber-500', 'bg-indigo-500',
  ];

  return (
    <div className="flex gap-3 py-3">
      <div
        className={`w-9 h-9 rounded-lg ${colors[colorIdx]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900 text-sm">{sender}</span>
          <span className="text-xs text-gray-500">{role}</span>
          {sentiment && sentimentBadge[sentiment] && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${sentimentBadge[sentiment].className}`}>
              {sentimentBadge[sentiment].label}
            </span>
          )}
          {channel && <span className="text-xs text-gray-400">{channel}</span>}
          {timestamp && <span className="text-xs text-gray-400">{timestamp}</span>}
        </div>
        <p className="mt-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
}
