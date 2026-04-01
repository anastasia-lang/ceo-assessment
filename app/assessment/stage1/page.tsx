'use client';

import { Suspense, useState, useCallback } from 'react';
import AssessmentShell from '@/components/AssessmentShell';
import InboxItem from '@/components/InboxItem';
import PriorityMatrix from '@/components/PriorityMatrix';
import RichTextEditor from '@/components/RichTextEditor';
import { stage1Items, stage1Questions } from '@/lib/content';

function Stage1Inner() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const [matrix, setMatrix] = useState<Record<string, string[]>>({
    'urgent-important': [],
    'important-not-urgent': [],
    'delegate': [],
    'acknowledge': [],
  });

  const [rootCause1, setRootCause1] = useState('');
  const [rootCause2, setRootCause2] = useState('');
  const [rootCause3, setRootCause3] = useState('');
  const [ceoMemo, setCeoMemo] = useState('');

  const responses: Record<string, { responseText?: string; responseJson?: unknown }> = {
    priority_matrix: { responseJson: matrix },
    root_cause_1: { responseText: rootCause1 },
    root_cause_2: { responseText: rootCause2 },
    root_cause_3: { responseText: rootCause3 },
    ceo_memo: { responseText: ceoMemo },
  };

  const onSubmit = useCallback(() => {
    return [
      { questionKey: 'priority_matrix', responseJson: matrix },
      { questionKey: 'root_cause_1', responseText: rootCause1 },
      { questionKey: 'root_cause_2', responseText: rootCause2 },
      { questionKey: 'root_cause_3', responseText: rootCause3 },
      { questionKey: 'ceo_memo', responseText: ceoMemo },
    ];
  }, [matrix, rootCause1, rootCause2, rootCause3, ceoMemo]);

  const tabs = [
    { label: 'Priority Matrix', key: 'matrix' },
    { label: 'Root Cause Diagnosis', key: 'root_cause' },
    { label: 'CEO Memo', key: 'memo' },
  ];

  return (
    <AssessmentShell stage={1} responses={responses} onSubmit={onSubmit}>
      <div className="flex h-[calc(100vh-140px)]">
        {/* Left: Inbox */}
        <div className="w-1/2 border-r bg-gray-50 overflow-y-auto p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Your Inbox</h2>
          <p className="text-sm text-gray-500 mb-4">
            8 messages waiting. Read each one, then prioritize on the right.
          </p>
          <div className="space-y-3">
            {stage1Items.map(item => (
              <InboxItem
                key={item.id}
                item={item}
                isSelected={selectedItem === item.id}
                onClick={() => setSelectedItem(item.id === selectedItem ? null : item.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: Tabs */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex border-b bg-white">
            {tabs.map((tab, i) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(i)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === i
                    ? 'text-[#e94560] border-b-2 border-[#e94560]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-4">{stage1Questions[0].description}</p>
                <PriorityMatrix value={matrix} onChange={setMatrix} />
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-6">
                <p className="text-sm text-gray-600">{stage1Questions[1].description}</p>
                {[
                  { label: 'Critical Item 1', value: rootCause1, setter: setRootCause1 },
                  { label: 'Critical Item 2', value: rootCause2, setter: setRootCause2 },
                  { label: 'Critical Item 3', value: rootCause3, setter: setRootCause3 },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <textarea
                      value={value}
                      onChange={e => setter(e.target.value)}
                      placeholder="What's actually going on here? Root cause vs. surface symptom..."
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-800 min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 focus:border-[#e94560]"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 2 && (
              <div>
                <p className="text-sm text-gray-600 mb-4">{stage1Questions[2].description}</p>
                <RichTextEditor
                  value={ceoMemo}
                  onChange={setCeoMemo}
                  maxWords={250}
                  placeholder="To: Marco Ferretti (CEO)&#10;Subject: [Your subject]&#10;&#10;Write your memo here..."
                  minHeight="300px"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AssessmentShell>
  );
}

export default function Stage1Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><div className="text-gray-400 text-sm">Loading...</div></div>}>
      <Stage1Inner />
    </Suspense>
  );
}
