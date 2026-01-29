'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FieldUsage {
  id: number;
  fieldName: string;
  fieldLabel: string | null;
  objectName: string;
  objectLabel: string | null;
  populationRate: number | null;
  recordCount: number | null;
  dependentCount: number;
  isRequired: boolean;
  fieldType: string | null;
}

interface FieldUsageAnalysis {
  fields: FieldUsage[];
  summary: {
    totalFields: number;
    fieldsWithData: number;
    emptyFields: number;
    lowUsageFields: number;
    averagePopulation: number;
    byObject: Record<string, { total: number; empty: number; lowUsage: number }>;
  };
}

const FIELD_TYPE_ICONS: Record<string, string> = {
  Text: '📝',
  Number: '🔢',
  Currency: '💰',
  Percent: '📊',
  Date: '📅',
  DateTime: '🕐',
  Checkbox: '☑️',
  Picklist: '📋',
  MultiselectPicklist: '📋',
  Lookup: '🔗',
  MasterDetail: '🔗',
  Email: '📧',
  Phone: '📞',
  Url: '🌐',
  TextArea: '📄',
  LongTextArea: '📄',
  Html: '🌐',
};

export default function FieldUsagePage() {
  const [analysis, setAnalysis] = useState<FieldUsageAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [objectFilter, setObjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('population');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [usageFilter, setUsageFilter] = useState<'all' | 'empty' | 'low' | 'good'>('all');
  const [objects, setObjects] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
      });
      if (objectFilter) params.set('object', objectFilter);

      const res = await fetch(`/api/tools/field-usage?${params}`);
      const data = await res.json();
      setAnalysis(data);

      // Extract unique objects for filter
      const uniqueObjects = Array.from(new Set(data.fields.map((f: FieldUsage) => f.objectName))).sort() as string[];
      setObjects(uniqueObjects);
    } catch (error) {
      console.error('Failed to fetch field usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [objectFilter, sortBy, sortOrder]);

  const filteredFields = analysis?.fields.filter(f => {
    if (usageFilter === 'empty') return f.populationRate === 0;
    if (usageFilter === 'low') return f.populationRate !== null && f.populationRate > 0 && f.populationRate < 0.1;
    if (usageFilter === 'good') return f.populationRate !== null && f.populationRate >= 0.1;
    return true;
  }) || [];

  const getPopulationColor = (rate: number | null) => {
    if (rate === null) return 'text-gray-400';
    if (rate === 0) return 'text-red-600 font-semibold';
    if (rate < 0.05) return 'text-orange-600';
    if (rate < 0.1) return 'text-yellow-600';
    if (rate < 0.5) return 'text-blue-600';
    return 'text-green-600';
  };

  const getPopulationBar = (rate: number | null) => {
    if (rate === null) return null;
    const width = Math.min(rate * 100, 100);
    let color = 'bg-green-500';
    if (rate === 0) color = 'bg-red-500';
    else if (rate < 0.05) color = 'bg-orange-500';
    else if (rate < 0.1) color = 'bg-yellow-500';
    else if (rate < 0.5) color = 'bg-blue-500';

    return (
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    );
  };

  const exportCSV = () => {
    if (!analysis) return;

    const headers = ['Object', 'Field API Name', 'Field Label', 'Type', 'Population Rate', 'Record Count', 'Dependencies', 'Required'];
    const rows = filteredFields.map(f => [
      f.objectName,
      f.fieldName,
      f.fieldLabel || '',
      f.fieldType || '',
      f.populationRate !== null ? (f.populationRate * 100).toFixed(1) + '%' : '',
      f.recordCount?.toString() || '',
      f.dependentCount.toString(),
      f.isRequired ? 'Yes' : 'No',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field-usage-${new Date().toISOString().split('T')[0]}.csv`;
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
            <span>Tools</span>
            <span>/</span>
            <span>Field Usage</span>
          </div>
          <h1 className="text-2xl font-bold text-acs-navy" style={{ fontFamily: 'Georgia, serif' }}>
            Field Usage Analyzer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Analyze field population rates across objects to identify unused or underutilized fields
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!analysis}
          className="px-4 py-2 bg-acs-blue text-white rounded-lg font-medium disabled:opacity-50 hover:bg-acs-navy transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{analysis.summary.totalFields}</div>
            <div className="text-xs text-gray-500">Total Custom Fields</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 text-center border border-green-200">
            <div className="text-2xl font-bold text-green-700">{analysis.summary.fieldsWithData}</div>
            <div className="text-xs text-green-600">With Data</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 text-center border border-red-200">
            <div className="text-2xl font-bold text-red-700">{analysis.summary.emptyFields}</div>
            <div className="text-xs text-red-600">Empty (0%)</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 text-center border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{analysis.summary.lowUsageFields}</div>
            <div className="text-xs text-yellow-600">Low Usage (&lt;10%)</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 text-center border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">
              {(analysis.summary.averagePopulation * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600">Avg Population</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Object</label>
            <select
              value={objectFilter}
              onChange={(e) => setObjectFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Objects</option>
              {objects.map(obj => (
                <option key={obj} value={obj}>{obj}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usage Filter</label>
            <select
              value={usageFilter}
              onChange={(e) => setUsageFilter(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Fields</option>
              <option value="empty">Empty Only (0%)</option>
              <option value="low">Low Usage (&lt;10%)</option>
              <option value="good">Good Usage (&gt;10%)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="population">Population Rate</option>
              <option value="name">Field Name</option>
              <option value="object">Object Name</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fields Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Analyzing field usage...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Object</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Population</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dependencies</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFields.map(field => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/objects/${encodeURIComponent(field.objectName)}`} className="text-acs-blue hover:underline">
                        {field.objectName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {field.isRequired && (
                          <span className="text-red-500 text-xs" title="Required">*</span>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{field.fieldName}</div>
                          {field.fieldLabel && (
                            <div className="text-xs text-gray-500">{field.fieldLabel}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {field.fieldType && (
                        <span className="flex items-center gap-1">
                          <span>{FIELD_TYPE_ICONS[field.fieldType] || '📋'}</span>
                          {field.fieldType}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getPopulationBar(field.populationRate)}
                        <span className={`text-sm ${getPopulationColor(field.populationRate)}`}>
                          {field.populationRate !== null
                            ? `${(field.populationRate * 100).toFixed(1)}%`
                            : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {field.dependentCount > 0 ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {field.dependentCount} refs
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/analysis/impact?nodeId=${field.id}`}
                          className="text-sm text-acs-blue hover:underline"
                        >
                          Impact
                        </Link>
                        {field.populationRate === 0 && field.dependentCount === 0 && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                            Safe to remove
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredFields.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No fields match your current filters.
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Population Rate Guide</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-gray-700">0% - Empty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500" />
            <span className="text-gray-700">1-5% - Very Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span className="text-gray-700">5-10% - Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-gray-700">10-50% - Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-gray-700">50%+ - Good</span>
          </div>
        </div>
      </div>
    </div>
  );
}
