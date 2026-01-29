'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface RetirementCandidate {
  id: number;
  apiName: string;
  label: string | null;
  type: string;
  parentName?: string;
  reason: string[];
  riskLevel: 'safe' | 'low' | 'medium' | 'high';
  dependentCount: number;
  recordCount?: number;
  populationRate?: number;
}

interface RetirementAnalysis {
  candidates: RetirementCandidate[];
  summary: {
    total: number;
    byType: Record<string, number>;
    byRisk: Record<string, number>;
    safeToRemove: number;
  };
}

const TYPE_ICONS: Record<string, string> = {
  Object: '📦',
  Field: '📋',
  Flow: '⚡',
  ApexClass: '💻',
  ApexTrigger: '🎯',
  ValidationRule: '✅',
  LWC: '⚛️',
};

const RISK_COLORS = {
  safe: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
  low: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
};

const METADATA_TYPES = [
  { id: '', label: 'All Types' },
  { id: 'Field', label: 'Fields' },
  { id: 'Object', label: 'Objects' },
  { id: 'Flow', label: 'Flows' },
  { id: 'ApexClass', label: 'Apex Classes' },
  { id: 'ValidationRule', label: 'Validation Rules' },
];

export default function RetirementPage() {
  const [analysis, setAnalysis] = useState<RetirementAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [maxPopulation, setMaxPopulation] = useState(0.1);
  const [includeWithDependents, setIncludeWithDependents] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<number>>(new Set());
  const [riskFilter, setRiskFilter] = useState<string>('');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        maxPopulationRate: maxPopulation.toString(),
        includeWithDependents: includeWithDependents.toString(),
      });
      if (typeFilter) params.set('type', typeFilter);

      const res = await fetch(`/api/retirement?${params}`);
      const data = await res.json();
      setAnalysis(data);
      setSelectedCandidates(new Set());
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [typeFilter, maxPopulation, includeWithDependents]);

  const toggleCandidate = (id: number) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const selectAllSafe = () => {
    if (!analysis) return;
    const safeIds = analysis.candidates
      .filter(c => c.riskLevel === 'safe')
      .map(c => c.id);
    setSelectedCandidates(new Set(safeIds));
  };

  const selectAll = () => {
    if (!analysis) return;
    setSelectedCandidates(new Set(analysis.candidates.map(c => c.id)));
  };

  const clearSelection = () => {
    setSelectedCandidates(new Set());
  };

  const filteredCandidates = analysis?.candidates.filter(c => {
    if (riskFilter && c.riskLevel !== riskFilter) return false;
    return true;
  }) || [];

  const exportPlan = () => {
    if (!analysis) return;

    const selected = analysis.candidates.filter(c => selectedCandidates.has(c.id));

    let md = `# Retirement Plan\n\n`;
    md += `Generated: ${new Date().toLocaleString()}\n\n`;
    md += `## Summary\n\n`;
    md += `- **Total Candidates:** ${selected.length}\n`;
    md += `- **Safe to Remove:** ${selected.filter(c => c.riskLevel === 'safe').length}\n`;
    md += `- **Requires Review:** ${selected.filter(c => c.riskLevel !== 'safe').length}\n\n`;

    md += `## Pre-Retirement Checklist\n\n`;
    md += `- [ ] Review each candidate with business stakeholders\n`;
    md += `- [ ] Verify no active integrations use these components\n`;
    md += `- [ ] Check for any scheduled jobs or reports using this metadata\n`;
    md += `- [ ] Create backup of metadata before removal\n`;
    md += `- [ ] Document retirement in change log\n`;
    md += `- [ ] Schedule retirement during low-usage period\n\n`;

    // Group by type
    const byType: Record<string, typeof selected> = {};
    selected.forEach(c => {
      if (!byType[c.type]) byType[c.type] = [];
      byType[c.type].push(c);
    });

    Object.entries(byType).forEach(([type, items]) => {
      md += `## ${TYPE_ICONS[type] || '📄'} ${type}s (${items.length})\n\n`;

      items.forEach(item => {
        md += `### ${item.apiName}\n\n`;
        if (item.label) md += `**Label:** ${item.label}\n\n`;
        if (item.parentName) md += `**Parent Object:** ${item.parentName}\n\n`;
        md += `**Risk Level:** ${item.riskLevel.toUpperCase()}\n\n`;
        md += `**Reasons for Retirement:**\n`;
        item.reason.forEach(r => {
          md += `- ${r}\n`;
        });
        md += `\n`;

        if (item.populationRate !== undefined) {
          md += `**Population Rate:** ${(item.populationRate * 100).toFixed(1)}%\n\n`;
        }
        if (item.dependentCount > 0) {
          md += `**Dependencies:** ${item.dependentCount} (review before removal)\n\n`;
        }

        md += `**Retirement Steps:**\n`;
        md += `- [ ] Confirm no active use\n`;
        if (item.dependentCount > 0) {
          md += `- [ ] Update/remove ${item.dependentCount} dependent component(s)\n`;
        }
        md += `- [ ] Remove from page layouts (if applicable)\n`;
        md += `- [ ] Delete ${item.type.toLowerCase()}\n`;
        md += `- [ ] Verify system functionality\n\n`;
        md += `---\n\n`;
      });
    });

    md += `## Post-Retirement Checklist\n\n`;
    md += `- [ ] Verify all removals completed successfully\n`;
    md += `- [ ] Run health check to confirm system stability\n`;
    md += `- [ ] Update documentation\n`;
    md += `- [ ] Notify affected users/teams\n`;
    md += `- [ ] Monitor for any issues over next 48 hours\n`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retirement-plan-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/" className="hover:text-acs-blue">Home</Link>
            <span>/</span>
            <span>Retirement Assessment</span>
          </div>
          <h1 className="text-2xl font-bold text-acs-navy" style={{ fontFamily: 'Georgia, serif' }}>
            Retirement Assessment
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Identify metadata candidates for cleanup and generate retirement plans
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-3">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              {METADATA_TYPES.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Population Rate: {(maxPopulation * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={maxPopulation}
              onChange={(e) => setMaxPopulation(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Risks</option>
              <option value="safe">Safe Only</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeWithDependents}
                onChange={(e) => setIncludeWithDependents(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Include items with dependents</span>
            </label>
          </div>
        </div>
      </div>

      {/* Summary */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{analysis.summary.total}</div>
            <div className="text-xs text-gray-500">Total Candidates</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 text-center border border-green-200">
            <div className="text-2xl font-bold text-green-700">{analysis.summary.byRisk.safe || 0}</div>
            <div className="text-xs text-green-600">Safe to Remove</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{analysis.summary.byRisk.low || 0}</div>
            <div className="text-xs text-blue-600">Low Risk</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 text-center border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{analysis.summary.byRisk.medium || 0}</div>
            <div className="text-xs text-yellow-600">Medium Risk</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 text-center border border-red-200">
            <div className="text-2xl font-bold text-red-700">{analysis.summary.byRisk.high || 0}</div>
            <div className="text-xs text-red-600">High Risk</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={selectAllSafe}
            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Select Safe ({analysis?.summary.byRisk.safe || 0})
          </button>
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear
          </button>
          <span className="text-sm text-gray-500 ml-2">
            {selectedCandidates.size} selected
          </span>
        </div>
        <button
          onClick={exportPlan}
          disabled={selectedCandidates.size === 0}
          className="px-4 py-2 bg-acs-blue text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-acs-navy transition-colors"
        >
          Export Retirement Plan
        </button>
      </div>

      {/* Candidates List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Analyzing metadata...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Retirement Candidates</h2>
          <p className="text-gray-500">
            No metadata matches your current filters. Try adjusting the population rate threshold.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0}
                    onChange={() => {
                      if (selectedCandidates.size === filteredCandidates.length) {
                        clearSelection();
                      } else {
                        setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reasons</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Population</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCandidates.map(candidate => (
                <tr
                  key={candidate.id}
                  className={`hover:bg-gray-50 ${selectedCandidates.has(candidate.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.has(candidate.id)}
                      onChange={() => toggleCandidate(candidate.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-lg">{TYPE_ICONS[candidate.type] || '📄'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{candidate.apiName}</div>
                    {candidate.label && (
                      <div className="text-xs text-gray-500">{candidate.label}</div>
                    )}
                    {candidate.parentName && (
                      <div className="text-xs text-gray-400">on {candidate.parentName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {candidate.reason.map((r, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {candidate.populationRate !== undefined ? (
                      <span className={candidate.populationRate === 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {(candidate.populationRate * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${RISK_COLORS[candidate.riskLevel].bg} ${RISK_COLORS[candidate.riskLevel].text}`}>
                      {candidate.riskLevel.toUpperCase()}
                      {candidate.dependentCount > 0 && ` (${candidate.dependentCount})`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/analysis/impact?nodeId=${candidate.id}`}
                      className="text-sm text-acs-blue hover:underline"
                    >
                      Impact
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Understanding Risk Levels</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong className="text-green-700">Safe:</strong> No dependencies - can be removed without affecting other components</li>
          <li>• <strong className="text-blue-700">Low:</strong> 1-2 dependencies - minimal impact, easy to update</li>
          <li>• <strong className="text-yellow-700">Medium:</strong> 3-5 dependencies - requires careful review</li>
          <li>• <strong className="text-red-700">High:</strong> 6+ dependencies - significant impact, thorough review needed</li>
        </ul>
      </div>
    </div>
  );
}
