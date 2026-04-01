'use client';

import { useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxWords?: number;
  targetWords?: number;
  minHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  maxWords,
  targetWords,
  minHeight = '200px',
}: RichTextEditorProps) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const isOverLimit = maxWords ? wordCount > maxWords : false;

  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Type your response here...'}
        className={`w-full border rounded-lg p-4 text-sm text-gray-800 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 focus:border-[#e94560] ${
          isOverLimit ? 'border-red-400' : 'border-gray-300'
        }`}
        style={{ minHeight }}
      />
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>
          {targetWords && (
            <span>Target: ~{targetWords} words</span>
          )}
        </div>
        <div className={isOverLimit ? 'text-red-500 font-medium' : ''}>
          {wordCount} words{maxWords ? ` / ${maxWords} max` : ''}
        </div>
      </div>
    </div>
  );
}
