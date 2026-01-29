'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SearchResult {
  id: number;
  api_name: string;
  label: string | null;
  type: string;
}

interface ImpactNode {
  id: number;
  apiName: string;
  label: string | null;
  type: string;
  edgeType: string;
  depth: number;
}

interface ImpactResult {
  item: {
    id: number;
    apiName: string;
    label: string | null;
    type: string;
  };
  dependents: ImpactNode[];
  dependencies: ImpactNode[];
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: {
    totalDependents: number;
    totalDependencies: number;
    dependentsByType: Record<string, number>;
    dependenciesByType: Record<string, number>;
    criticalDependents: string[];
  };
}

const TYPE_ICONS: Record<string, string> = {
  Object: '📦',
  Field: '🏷️',
  Flow: '⚡',
  ApexClass: '💻',
  ApexTrigger: '🎯',
  LWC: '⚛️',
  Layout: '📐',
  FlexiPage: '📱',
  PermissionSet: '🔐',
  Profile: '👤',
  ValidationRule: '✅',
  RecordType: '📋',
};

const RISK_COLORS = {
  low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
};

const METADATA_TYPES = [
  { id: '', label: 'All Types' },
  { id: 'Object', label: 'Objects' },
  { id: 'Field', label: 'Fields' },
  { id: 'Flow', label: 'Flows' },
  { id: 'ApexClass', label: 'Apex Classes' },
  { id: 'ApexTrigger', label: 'Triggers' },
  { id: 'LWC', label: 'LWCs' },
  { id: 'Layout', label: 'Layouts' },
  { id: 'FlexiPage', label: 'Lightning Pages' },
  { id: 'PermissionSet', label: 'Permission Sets' },
  { id: 'Profile', label: 'Profiles' },
  { id: 'ValidationRule', label: 'Validation Rules' },
  { id: 'RecordType', label: 'Record Types' },
];

export default function ImpactAnalysisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [impact, setImpact] = useState<ImpactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [depth, setDepth] = useState(2);
  const [activeTab, setActiveTab] = useState<'dependents' | 'dependencies'>('dependents');

  // Search for metadata
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        let url = `/api/search?q=${encodeURIComponent(searchTerm)}&limit=30`;
        if (typeFilter) {
          url += `&type=${encodeURIComponent(typeFilter)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, typeFilter]);

  // Analyze impact when item is selected
  const analyzeImpact = async (item: SearchResult) => {
    setSelectedItem(item);
    setAnalyzing(true);
    setImpact(null);

    try {
      const res = await fetch(`/api/analysis/impact?nodeId=${item.id}&depth=${depth}`);
      const data = await res.json();
      setImpact(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Re-analyze when depth changes
  useEffect(() => {
    if (selectedItem) {
      analyzeImpact(selectedItem);
    }
  }, [depth]);

  const downloadReport = () => {
    if (!impact) return;

    let report = `IMPACT ANALYSIS REPORT\n`;
    report += `${'='.repeat(50)}\n\n`;
    report += `Item: ${impact.item.apiName}\n`;
    report += `Type: ${impact.item.type}\n`;
    report += `Label: ${impact.item.label || 'N/A'}\n\n`;

    report += `RISK ASSESSMENT\n`;
    report += `${'-'.repeat(30)}\n`;
    report += `Risk Score: ${impact.riskScore}/100\n`;
    report += `Risk Level: ${impact.riskLevel.toUpperCase()}\n\n`;

    report += `SUMMARY\n`;
    report += `${'-'.repeat(30)}\n`;
    report += `Total Dependents: ${impact.summary.totalDependents}\n`;
    report += `Total Dependencies: ${impact.summary.totalDependencies}\n\n`;

    if (impact.summary.criticalDependents.length > 0) {
      report += `CRITICAL DEPENDENTS (would break if changed)\n`;
      report += `${'-'.repeat(30)}\n`;
      impact.summary.criticalDependents.forEach(d => {
        report += `  - ${d}\n`;
      });
      report += '\n';
    }

    report += `DEPENDENTS BY TYPE\n`;
    report += `${'-'.repeat(30)}\n`;
    Object.entries(impact.summary.dependentsByType).forEach(([type, count]) => {
      report += `  ${type}: ${count}\n`;
    });
    report += '\n';

    report += `DEPENDENCIES BY TYPE\n`;
    report += `${'-'.repeat(30)}\n`;
    Object.entries(impact.summary.dependenciesByType).forEach(([type, count]) => {
      report += `  ${type}: ${count}\n`;
    });
    report += '\n';

    report += `DETAILED DEPENDENTS\n`;
    report += `${'-'.repeat(30)}\n`;
    impact.dependents.forEach(d => {
      report += `  [Depth ${d.depth}] ${d.type}: ${d.apiName} (${d.edgeType})\n`;
    });
    report += '\n';

    report += `DETAILED DEPENDENCIES\n`;
    report += `${'-'.repeat(30)}\n`;
    impact.dependencies.forEach(d => {
      report += `  [Depth ${d.depth}] ${d.type}: ${d.apiName} (${d.edgeType})\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impact-analysis-${impact.item.apiName}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Impact Analysis</h1>
          <p className="text-gray-600 mt-1">
            Analyze what would be affected if metadata is changed or removed
          </p>
        </div>
        <Link href="/" className="text-sm text-acs-blue hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Search & Select */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Select Metadata to Analyze</h2>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg mb-2 text-sm"
            >
              {METADATA_TYPES.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>

            {/* Search Input */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${typeFilter ? METADATA_TYPES.find(t => t.id === typeFilter)?.label.toLowerCase() : 'all metadata'}...`}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-acs-blue"
            />

            {/* Search Results */}
            {loading && (
              <div className="mt-3 text-center text-gray-500 text-sm">Searching...</div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-3 border rounded-lg max-h-64 overflow-y-auto divide-y">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => analyzeImpact(result)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                      selectedItem?.id === result.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span>{TYPE_ICONS[result.type] || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{result.api_name}</div>
                      <div className="text-xs text-gray-500">{result.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Depth Selector */}
            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-1">Analysis Depth</label>
              <select
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={1}>1 level (direct only)</option>
                <option value={2}>2 levels</option>
                <option value={3}>3 levels (thorough)</option>
              </select>
            </div>
          </div>

          {/* Selected Item */}
          {selectedItem && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Analyzing</h3>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{TYPE_ICONS[selectedItem.type] || '📄'}</span>
                <div>
                  <div className="font-semibold">{selectedItem.api_name}</div>
                  <div className="text-sm text-gray-500">{selectedItem.type}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {analyzing && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-600">Analyzing impact...</p>
            </div>
          )}

          {!analyzing && !impact && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p>Search and select metadata to analyze its impact</p>
            </div>
          )}

          {impact && !analyzing && (
            <>
              {/* Risk Summary */}
              <div className={`rounded-lg shadow p-4 border-l-4 ${RISK_COLORS[impact.riskLevel].bg} ${RISK_COLORS[impact.riskLevel].border}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-semibold ${RISK_COLORS[impact.riskLevel].text}`}>
                      {impact.riskLevel.toUpperCase()} RISK
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Score: {impact.riskScore}/100 | {impact.summary.totalDependents} dependents | {impact.summary.totalDependencies} dependencies
                    </p>
                  </div>
                  <button
                    onClick={downloadReport}
                    className="px-3 py-1.5 bg-white border rounded-lg text-sm hover:bg-gray-50"
                  >
                    Export Report
                  </button>
                </div>

                {impact.summary.criticalDependents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-red-700">Critical Dependents:</p>
                    <ul className="mt-1 text-sm text-red-600">
                      {impact.summary.criticalDependents.slice(0, 5).map((d, i) => (
                        <li key={i}>• {d}</li>
                      ))}
                      {impact.summary.criticalDependents.length > 5 && (
                        <li>... and {impact.summary.criticalDependents.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Dependents by Type</h3>
                  <div className="space-y-1">
                    {Object.entries(impact.summary.dependentsByType)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span>{TYPE_ICONS[type] || '📄'} {type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    {Object.keys(impact.summary.dependentsByType).length === 0 && (
                      <p className="text-sm text-gray-500">No dependents found</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Dependencies by Type</h3>
                  <div className="space-y-1">
                    {Object.entries(impact.summary.dependenciesByType)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span>{TYPE_ICONS[type] || '📄'} {type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    {Object.keys(impact.summary.dependenciesByType).length === 0 && (
                      <p className="text-sm text-gray-500">No dependencies found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Lists */}
              <div className="bg-white rounded-lg shadow">
                <div className="border-b flex">
                  <button
                    onClick={() => setActiveTab('dependents')}
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      activeTab === 'dependents'
                        ? 'border-b-2 border-acs-blue text-acs-blue'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Dependents ({impact.dependents.length})
                    <span className="ml-1 text-xs text-gray-400">would break</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('dependencies')}
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      activeTab === 'dependencies'
                        ? 'border-b-2 border-acs-blue text-acs-blue'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Dependencies ({impact.dependencies.length})
                    <span className="ml-1 text-xs text-gray-400">required by</span>
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {activeTab === 'dependents' && (
                    <div className="divide-y">
                      {impact.dependents.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No dependents found. This item can likely be safely modified.
                        </div>
                      ) : (
                        impact.dependents.map((node, i) => (
                          <div key={i} className="px-4 py-2 hover:bg-gray-50 flex items-center gap-3">
                            <span className="text-lg">{TYPE_ICONS[node.type] || '📄'}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{node.apiName}</div>
                              <div className="text-xs text-gray-500">
                                {node.type} • {node.edgeType.replace(/_/g, ' ')}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              node.depth === 1 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              Depth {node.depth}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'dependencies' && (
                    <div className="divide-y">
                      {impact.dependencies.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No dependencies found. This item is self-contained.
                        </div>
                      ) : (
                        impact.dependencies.map((node, i) => (
                          <div key={i} className="px-4 py-2 hover:bg-gray-50 flex items-center gap-3">
                            <span className="text-lg">{TYPE_ICONS[node.type] || '📄'}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{node.apiName}</div>
                              <div className="text-xs text-gray-500">
                                {node.type} • {node.edgeType.replace(/_/g, ' ')}
                              </div>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              Depth {node.depth}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
