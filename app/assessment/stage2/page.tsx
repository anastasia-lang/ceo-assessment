'use client';

import { Suspense, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import AssessmentShell from '@/components/AssessmentShell';
import DataTable from '@/components/DataTable';
import SlackMessage from '@/components/SlackMessage';
import RichTextEditor from '@/components/RichTextEditor';
import FileUpload from '@/components/FileUpload';
import { uaeMarketData, stakeholderThread, stage2Questions } from '@/lib/content';

function Stage2Inner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const [leftTab, setLeftTab] = useState(0);
  const [rightTab, setRightTab] = useState(0);

  const [recommendation, setRecommendation] = useState('');
  const [financialSketch, setFinancialSketch] = useState('');
  const [alignmentPlan, setAlignmentPlan] = useState('');

  const responses: Record<string, { responseText?: string; responseJson?: unknown }> = {
    strategic_recommendation: { responseText: recommendation },
    financial_sketch: { responseText: financialSketch },
    stakeholder_alignment: { responseText: alignmentPlan },
  };

  const onSubmit = useCallback(() => [
    { questionKey: 'strategic_recommendation', responseText: recommendation },
    { questionKey: 'financial_sketch', responseText: financialSketch },
    { questionKey: 'stakeholder_alignment', responseText: alignmentPlan },
  ], [recommendation, financialSketch, alignmentPlan]);

  const leftTabs = ['Market Data', 'Competitors', 'Stakeholders', 'Costs'];
  const rightTabs = stage2Questions.map(q => q.title);

  return (
    <AssessmentShell stage={2} responses={responses} onSubmit={onSubmit}>
      <div className="flex h-[calc(100vh-140px)]">
        {/* Left: Reference Data */}
        <div className="w-1/2 border-r flex flex-col overflow-hidden">
          <div className="flex border-b bg-white overflow-x-auto">
            {leftTabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setLeftTab(i)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  leftTab === i
                    ? 'text-[#e94560] border-b-2 border-[#e94560]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Market Data */}
            {leftTab === 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700">STRATEGIC BRIEF: UAE Market Entry Assessment</h3>
                <p className="text-sm text-gray-600">
                  Marco has asked the CEO Office to evaluate whether Payvio should enter the UAE market.
                  A potential anchor client (a large e-commerce platform operating in the Gulf) has expressed
                  interest in Payvio&apos;s orchestration layer. The board wants a recommendation by end of month.
                </p>
                <DataTable
                  title={uaeMarketData.marketSize.title}
                  headers={['Metric', 'Value']}
                  headerKeys={['metric', 'value']}
                  rows={uaeMarketData.marketSize.rows}
                />
              </div>
            )}

            {/* Competitors */}
            {leftTab === 1 && (
              <div className="space-y-4">
                {uaeMarketData.competitors.map(comp => (
                  <div key={comp.name} className="bg-white rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{comp.name}</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{comp.hq}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">UAE Presence: </span>
                        <span className="text-gray-600">{comp.uaePresence}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Strengths: </span>
                        <span className="text-gray-600">{comp.strengths}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Weaknesses: </span>
                        <span className="text-gray-600">{comp.weaknesses}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Est. UAE Revenue: </span>
                        <span className="text-[#e94560] font-medium">{comp.estimatedUAERevenue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stakeholder Thread */}
            {leftTab === 2 && (
              <div>
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <span className="text-sm font-bold text-gray-800">#strategy — UAE Market Entry</span>
                  </div>
                  <div className="divide-y">
                    {stakeholderThread.map((msg, i) => (
                      <SlackMessage
                        key={i}
                        sender={msg.sender}
                        role={msg.role}
                        message={msg.message}
                        sentiment={msg.sentiment}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cost Estimates */}
            {leftTab === 3 && (
              <DataTable
                title={uaeMarketData.costEstimates.title}
                headers={['Item', 'Cost']}
                headerKeys={['item', 'cost']}
                rows={uaeMarketData.costEstimates.rows}
              />
            )}
          </div>
        </div>

        {/* Right: Response Tabs */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex border-b bg-white overflow-x-auto">
            {rightTabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setRightTab(i)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  rightTab === i
                    ? 'text-[#e94560] border-b-2 border-[#e94560]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-4">{stage2Questions[0].description}</p>
                <RichTextEditor
                  value={recommendation}
                  onChange={setRecommendation}
                  targetWords={500}
                  minHeight="400px"
                  placeholder="Should Payvio enter the UAE market? Present your recommendation..."
                />
              </div>
            )}

            {rightTab === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{stage2Questions[1].description}</p>
                <RichTextEditor
                  value={financialSketch}
                  onChange={setFinancialSketch}
                  targetWords={300}
                  minHeight="300px"
                  placeholder="Revenue model, assumptions, path to breakeven..."
                />
                <FileUpload
                  sessionId={sessionId}
                  stage={2}
                  questionKey="financial_sketch"
                />
              </div>
            )}

            {rightTab === 2 && (
              <div>
                <p className="text-sm text-gray-600 mb-4">{stage2Questions[2].description}</p>
                <RichTextEditor
                  value={alignmentPlan}
                  onChange={setAlignmentPlan}
                  targetWords={300}
                  minHeight="300px"
                  placeholder="How do you get Sales, Product, Partnerships, and Finance aligned?"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AssessmentShell>
  );
}

export default function Stage2Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center"><div className="text-gray-400 text-sm">Loading...</div></div>}>
      <Stage2Inner />
    </Suspense>
  );
}
