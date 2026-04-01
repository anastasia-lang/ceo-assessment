'use client';

interface InboxItemProps {
  item: {
    id: string;
    type: 'slack' | 'email';
    channel: string;
    sender: string;
    senderRole: string;
    timestamp: string;
    content: string;
    priority: string;
  };
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const priorityColors: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-blue-400',
};

const avatarColors = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-indigo-500',
];

export default function InboxItem({ item, isSelected, onClick, compact }: InboxItemProps) {
  const initial = item.sender.charAt(0);
  const colorIdx =
    item.sender.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % avatarColors.length;

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-white rounded border text-sm">
        <div
          className={`w-6 h-6 rounded-full ${avatarColors[colorIdx]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
        >
          {initial}
        </div>
        <span className="font-medium text-gray-800 truncate">{item.sender}</span>
        <span className="text-gray-400 text-xs truncate">{item.content.substring(0, 60)}...</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`border-l-4 ${priorityColors[item.priority] || 'border-l-gray-300'} bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-[#e94560] shadow-md' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-full ${avatarColors[colorIdx]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{item.sender}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {item.senderRole}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                item.type === 'slack'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {item.type === 'slack' ? item.channel : 'Email'}
            </span>
            <span className="text-xs text-gray-400">{item.timestamp}</span>
          </div>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">{item.content}</p>
        </div>
      </div>
    </div>
  );
}
