'use client';

import { companyFactSheet } from '@/lib/content';

export function CompanyFactSheetContent() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company Overview</h4>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(companyFactSheet.overview).map(([key, value]) => (
            <div key={key} className="flex text-sm">
              <span className="font-medium text-gray-700 w-24 flex-shrink-0 capitalize">{key}:</span>
              <span className="text-gray-600">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Financials */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Financial Snapshot (Trailing 12 Months)</h4>
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {companyFactSheet.financials.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-3 py-1.5 font-medium text-gray-700 w-48">{row.metric}</td>
                  <td className="px-3 py-1.5 text-gray-600">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Metrics */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Business Metrics</h4>
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {companyFactSheet.businessMetrics.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-3 py-1.5 font-medium text-gray-700 w-48">{row.metric}</td>
                  <td className="px-3 py-1.5 text-gray-600">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product</h4>
        <div className="space-y-1.5 text-sm">
          <div><span className="font-medium text-gray-700">Core: </span><span className="text-gray-600">{companyFactSheet.product.core}</span></div>
          <div><span className="font-medium text-gray-700">Key Features: </span><span className="text-gray-600">{companyFactSheet.product.keyFeatures}</span></div>
          <div><span className="font-medium text-gray-700">Tech Stack: </span><span className="text-gray-600">{companyFactSheet.product.techStack}</span></div>
        </div>
      </div>

      {/* Competitive */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Competitive Position</h4>
        <div className="space-y-1.5 text-sm">
          <div><span className="font-medium text-gray-700">Primary Competitors: </span><span className="text-gray-600">{companyFactSheet.competitive.primaryCompetitors}</span></div>
          <div><span className="font-medium text-gray-700">Key Differentiator: </span><span className="text-gray-600">{companyFactSheet.competitive.keyDifferentiator}</span></div>
          <div><span className="font-medium text-gray-700">Win Rate: </span><span className="text-gray-600">{companyFactSheet.competitive.winRate}</span></div>
          <div><span className="font-medium text-gray-700">Main Loss Reasons: </span><span className="text-gray-600">{companyFactSheet.competitive.mainLossReasons}</span></div>
        </div>
      </div>
    </div>
  );
}

// Landing page version — displayed inline as a card with dark theme
export function CompanyFactSheetCard() {
  return (
    <div className="space-y-5">
      {/* Overview */}
      <div>
        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Company Overview</h4>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(companyFactSheet.overview).map(([key, value]) => (
            <div key={key} className="flex text-sm">
              <span className="font-medium text-white/70 w-24 flex-shrink-0 capitalize">{key}:</span>
              <span className="text-white/60">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Financials */}
      <div>
        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Financial Snapshot (Trailing 12 Months)</h4>
        <div className="rounded-lg overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <tbody>
              {companyFactSheet.financials.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.02]'}>
                  <td className="px-3 py-1.5 font-medium text-white/70 w-48">{row.metric}</td>
                  <td className="px-3 py-1.5 text-white/60">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Metrics */}
      <div>
        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Business Metrics</h4>
        <div className="rounded-lg overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <tbody>
              {companyFactSheet.businessMetrics.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.02]'}>
                  <td className="px-3 py-1.5 font-medium text-white/70 w-48">{row.metric}</td>
                  <td className="px-3 py-1.5 text-white/60">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product */}
      <div>
        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Product</h4>
        <div className="space-y-1.5 text-sm">
          <div><span className="font-medium text-white/70">Core: </span><span className="text-white/60">{companyFactSheet.product.core}</span></div>
          <div><span className="font-medium text-white/70">Key Features: </span><span className="text-white/60">{companyFactSheet.product.keyFeatures}</span></div>
          <div><span className="font-medium text-white/70">Tech Stack: </span><span className="text-white/60">{companyFactSheet.product.techStack}</span></div>
        </div>
      </div>

      {/* Competitive */}
      <div>
        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Competitive Position</h4>
        <div className="space-y-1.5 text-sm">
          <div><span className="font-medium text-white/70">Primary Competitors: </span><span className="text-white/60">{companyFactSheet.competitive.primaryCompetitors}</span></div>
          <div><span className="font-medium text-white/70">Key Differentiator: </span><span className="text-white/60">{companyFactSheet.competitive.keyDifferentiator}</span></div>
          <div><span className="font-medium text-white/70">Win Rate: </span><span className="text-white/60">{companyFactSheet.competitive.winRate}</span></div>
          <div><span className="font-medium text-white/70">Main Loss Reasons: </span><span className="text-white/60">{companyFactSheet.competitive.mainLossReasons}</span></div>
        </div>
      </div>
    </div>
  );
}

// Collapsible drawer for assessment stages
export default function CompanyFactSheetDrawer() {
  return null; // Rendered from AssessmentShell
}
