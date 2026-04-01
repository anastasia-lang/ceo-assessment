'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  sessionId: string;
  stage: number;
  questionKey: string;
  onUpload?: (fileName: string) => void;
}

const ALLOWED = ['.xlsx', '.csv', '.pdf', '.docx'];

export default function FileUpload({ sessionId, stage, questionKey, onUpload }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setError(`Allowed: ${ALLOWED.join(', ')}`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          stage,
          questionKey: questionKey + '_file',
          fileData: base64,
          fileName: file.name,
        }),
      });

      if (res.ok) {
        setFileName(file.name);
        onUpload?.(file.name);
      } else {
        setError('Upload failed');
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        onChange={handleFile}
        className="hidden"
      />
      {fileName ? (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{fileName}</span>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Replace file
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            {uploading ? 'Uploading...' : 'Optional: Upload a spreadsheet or document'}
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Choose File
          </button>
          <p className="text-xs text-gray-400">{ALLOWED.join(', ')}</p>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
