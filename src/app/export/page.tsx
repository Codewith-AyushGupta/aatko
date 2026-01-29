'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MetadataStats {
  objects: number;
  fields: number;
  flows: number;
  apexClasses: number;
  apexTriggers: number;
  lwc: number;
  layouts: number;
  permissionSets: number;
}

const METADATA_TYPES = [
  { id: 'CustomObject', label: 'Objects', description: 'Custom and standard objects' },
  { id: 'CustomField', label: 'Fields', description: 'All custom fields' },
  { id: 'Flow', label: 'Flows', description: 'Screen flows, autolaunched flows, etc.' },
  { id: 'ApexClass', label: 'Apex Classes', description: 'All Apex classes' },
  { id: 'ApexTrigger', label: 'Apex Triggers', description: 'All Apex triggers' },
  { id: 'LWC', label: 'Lightning Web Components', description: 'LWC components' },
  { id: 'Layout', label: 'Page Layouts', description: 'Object page layouts' },
  { id: 'PermissionSet', label: 'Permission Sets', description: 'Permission sets and groups' },
];

const FORMAT_OPTIONS = [
  { id: 'csv', label: 'CSV', description: 'Best for Excel, Google Sheets, Lucidchart, draw.io' },
  { id: 'json', label: 'JSON', description: 'Best for developers, APIs, custom tools' },
];

const TOOL_INSTRUCTIONS = [
  {
    name: 'Lucidchart',
    steps: ['Download CSV', 'In Lucidchart: File → Import Data', 'Select your CSV file', 'Use AI to auto-arrange'],
  },
  {
    name: 'draw.io',
    steps: ['Download CSV', 'In draw.io: Arrange → Insert → CSV', 'Paste or upload your data'],
  },
  {
    name: 'Excel / Google Sheets',
    steps: ['Download CSV', 'Open directly in Excel or import to Sheets', 'Create pivot tables or charts'],
  },
  {
    name: 'Custom Integration',
    steps: ['Download JSON format', 'Parse the structured data', 'Build your own visualization'],
  },
];

export default function ExportPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [format, setFormat] = useState('csv');
  const [includeRelationships, setIncludeRelationships] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MetadataStats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats:', err));
  }, []);

  const toggleType = (typeId: string) => {
    if (typeId === 'all') {
      setSelectedTypes(['all']);
      return;
    }

    let newTypes = selectedTypes.filter(t => t !== 'all');

    if (newTypes.includes(typeId)) {
      newTypes = newTypes.filter(t => t !== typeId);
    } else {
      newTypes.push(typeId);
    }

    // If nothing selected, default to all
    if (newTypes.length === 0) {
      newTypes = ['all'];
    }

    setSelectedTypes(newTypes);
  };

  const selectAll = () => setSelectedTypes(['all']);

  const handleExport = async () => {
    setDownloading(true);
    setError(null);

    try {
      const types = selectedTypes.includes('all') ? 'all' : selectedTypes.join(',');
      const url = `/api/export?format=${format}&types=${types}&relationships=${includeRelationships}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errData.error || 'Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `salesforce-metadata-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Metadata</h1>
          <p className="text-gray-600 mt-1">
            Download your Salesforce metadata for use in Lucidchart, draw.io, Excel, or any other tool
          </p>
        </div>
        <Link
          href="/export/builder"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Export Builder (Select Items)
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* What to Export */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">What to Export</h2>

        <div className="space-y-3">
          {/* Select All option */}
          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedTypes.includes('all')}
              onChange={() => selectAll()}
              className="mt-1 h-4 w-4 text-sf-blue rounded"
            />
            <div className="flex-1">
              <div className="font-medium">Everything</div>
              <div className="text-sm text-gray-500">Export all metadata types</div>
            </div>
            {stats && (
              <div className="text-sm text-gray-400">
                {Object.values(stats).reduce((a, b) => a + b, 0).toLocaleString()} items
              </div>
            )}
          </label>

          <div className="border-t border-gray-200 my-4"></div>

          {/* Individual type options */}
          <div className="grid md:grid-cols-2 gap-3">
            {METADATA_TYPES.map(type => (
              <label
                key={type.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTypes.includes(type.id) || selectedTypes.includes('all')
                    ? 'border-sf-blue bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type.id) || selectedTypes.includes('all')}
                  onChange={() => toggleType(type.id)}
                  disabled={selectedTypes.includes('all')}
                  className="mt-1 h-4 w-4 text-sf-blue rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-gray-500">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Include Relationships */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeRelationships}
              onChange={(e) => setIncludeRelationships(e.target.checked)}
              className="h-4 w-4 text-sf-blue rounded"
            />
            <div>
              <div className="font-medium">Include Relationships</div>
              <div className="text-sm text-gray-500">Add connections between components (lookups, dependencies, etc.)</div>
            </div>
          </label>
        </div>
      </div>

      {/* Format Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Export Format</h2>

        <div className="grid md:grid-cols-2 gap-3">
          {FORMAT_OPTIONS.map(option => (
            <label
              key={option.id}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                format === option.id
                  ? 'border-sf-blue bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="format"
                value={option.id}
                checked={format === option.id}
                onChange={(e) => setFormat(e.target.value)}
                className="mt-1 h-4 w-4 text-sf-blue"
              />
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          disabled={downloading}
          className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
            downloading
              ? 'bg-gray-400 cursor-wait'
              : 'bg-sf-blue hover:bg-blue-700'
          }`}
        >
          {downloading ? 'Preparing Download...' : `Download ${format.toUpperCase()}`}
        </button>
      </div>

      {/* Tool-Specific Instructions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">How to Use Your Export</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {TOOL_INSTRUCTIONS.map(tool => (
            <div key={tool.name} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">{tool.name}</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                {tool.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gray-400">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900">Tips</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>• CSV works with most tools including Lucidchart, draw.io, Excel</li>
          <li>• JSON is better for programmatic access or custom tooling</li>
          <li>• Include relationships to see how components connect to each other</li>
          <li>• Use Lucidchart AI or draw.io's auto-layout to arrange shapes automatically</li>
        </ul>
      </div>
    </div>
  );
}
