'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SearchResult {
  id: number;
  api_name: string;
  label: string | null;
  type: string;
}

interface DocumentationItem {
  id: number;
  apiName: string;
  label: string | null;
  type: string;
  description: string | null;
  filePath: string | null;
  metadata: Record<string, any>;
  children: {
    id: number;
    apiName: string;
    label: string | null;
    type: string;
    description: string | null;
  }[];
  relationships: {
    direction: 'incoming' | 'outgoing';
    edgeType: string;
    nodeId: number;
    apiName: string;
    label: string | null;
    nodeType: string;
  }[];
  analytics: {
    recordCount?: number;
    populationRate?: number;
  };
}

interface DocumentationResult {
  items: DocumentationItem[];
  generatedAt: string;
  summary: {
    totalItems: number;
    itemsByType: Record<string, number>;
    totalRelationships: number;
    totalChildren: number;
  };
}

const TYPE_ICONS: Record<string, string> = {
  Object: '📦',
  Field: '📋',
  Flow: '⚡',
  ApexClass: '💻',
  ApexTrigger: '🎯',
  LWC: '⚛️',
  Layout: '📐',
  FlexiPage: '📱',
  PermissionSet: '🔐',
  Profile: '👤',
  ValidationRule: '✅',
  RecordType: '📁',
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

export default function DocumentationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedItems, setSelectedItems] = useState<SearchResult[]>([]);
  const [documentation, setDocumentation] = useState<DocumentationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

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

  const addItem = (item: SearchResult) => {
    if (!selectedItems.find(i => i.id === item.id)) {
      setSelectedItems([...selectedItems, item]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeItem = (id: number) => {
    setSelectedItems(selectedItems.filter(i => i.id !== id));
  };

  const generateDocumentation = async () => {
    if (!selectedItems.length) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeIds: selectedItems.map(i => i.id) }),
      });
      const data = await res.json();
      setDocumentation(data);
      // Expand all items by default
      setExpandedItems(new Set(data.items.map((i: DocumentationItem) => i.id)));
    } catch (error) {
      console.error('Failed to generate documentation:', error);
    } finally {
      setGenerating(false);
    }
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const exportMarkdown = () => {
    if (!documentation) return;

    let md = `# Metadata Documentation\n\n`;
    md += `Generated: ${new Date(documentation.generatedAt).toLocaleString()}\n\n`;
    md += `## Summary\n\n`;
    md += `- **Total Items:** ${documentation.summary.totalItems}\n`;
    md += `- **Total Relationships:** ${documentation.summary.totalRelationships}\n`;
    md += `- **Total Children:** ${documentation.summary.totalChildren}\n\n`;

    md += `### Items by Type\n\n`;
    Object.entries(documentation.summary.itemsByType).forEach(([type, count]) => {
      md += `- ${type}: ${count}\n`;
    });
    md += `\n---\n\n`;

    documentation.items.forEach(item => {
      md += `## ${TYPE_ICONS[item.type] || '📄'} ${item.apiName}\n\n`;
      md += `**Type:** ${item.type}\n\n`;
      if (item.label) md += `**Label:** ${item.label}\n\n`;
      if (item.description) md += `**Description:** ${item.description}\n\n`;
      if (item.filePath) md += `**File Path:** \`${item.filePath}\`\n\n`;

      if (item.analytics.recordCount !== undefined) {
        md += `**Record Count:** ${item.analytics.recordCount.toLocaleString()}\n\n`;
      }
      if (item.analytics.populationRate !== undefined) {
        md += `**Population Rate:** ${(item.analytics.populationRate * 100).toFixed(1)}%\n\n`;
      }

      if (item.children.length > 0) {
        md += `### Children (${item.children.length})\n\n`;
        md += `| Type | API Name | Label | Description |\n`;
        md += `|------|----------|-------|-------------|\n`;
        item.children.forEach(child => {
          md += `| ${child.type} | ${child.apiName} | ${child.label || '-'} | ${child.description || '-'} |\n`;
        });
        md += `\n`;
      }

      if (item.relationships.length > 0) {
        md += `### Relationships (${item.relationships.length})\n\n`;
        const incoming = item.relationships.filter(r => r.direction === 'incoming');
        const outgoing = item.relationships.filter(r => r.direction === 'outgoing');

        if (incoming.length > 0) {
          md += `#### Referenced By (${incoming.length})\n\n`;
          incoming.forEach(rel => {
            md += `- ${TYPE_ICONS[rel.nodeType] || '📄'} **${rel.apiName}** (${rel.nodeType}) - ${rel.edgeType.replace(/_/g, ' ')}\n`;
          });
          md += `\n`;
        }

        if (outgoing.length > 0) {
          md += `#### References (${outgoing.length})\n\n`;
          outgoing.forEach(rel => {
            md += `- ${TYPE_ICONS[rel.nodeType] || '📄'} **${rel.apiName}** (${rel.nodeType}) - ${rel.edgeType.replace(/_/g, ' ')}\n`;
          });
          md += `\n`;
        }
      }

      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metadata-documentation-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportHTML = () => {
    if (!documentation) return;

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Metadata Documentation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #002855; border-bottom: 2px solid #004bac; padding-bottom: 10px; }
    h2 { color: #004bac; margin-top: 40px; }
    h3 { color: #333; }
    .summary { background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .item { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .item-header { display: flex; align-items: center; gap: 10px; }
    .type-badge { background: #e3f2fd; color: #1565c0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f5f7fa; font-weight: 600; }
    .relationship { padding: 8px; margin: 5px 0; background: #fafafa; border-radius: 4px; }
    .incoming { border-left: 3px solid #4caf50; }
    .outgoing { border-left: 3px solid #2196f3; }
    .meta { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Metadata Documentation</h1>
  <p class="meta">Generated: ${new Date(documentation.generatedAt).toLocaleString()}</p>

  <div class="summary">
    <h3>Summary</h3>
    <ul>
      <li><strong>Total Items:</strong> ${documentation.summary.totalItems}</li>
      <li><strong>Total Relationships:</strong> ${documentation.summary.totalRelationships}</li>
      <li><strong>Total Children:</strong> ${documentation.summary.totalChildren}</li>
    </ul>
    <h4>Items by Type</h4>
    <ul>
      ${Object.entries(documentation.summary.itemsByType).map(([type, count]) =>
        `<li>${type}: ${count}</li>`
      ).join('')}
    </ul>
  </div>
`;

    documentation.items.forEach(item => {
      html += `
  <div class="item">
    <div class="item-header">
      <span style="font-size: 24px">${TYPE_ICONS[item.type] || '📄'}</span>
      <h2 style="margin: 0">${item.apiName}</h2>
      <span class="type-badge">${item.type}</span>
    </div>
    ${item.label ? `<p><strong>Label:</strong> ${item.label}</p>` : ''}
    ${item.description ? `<p><strong>Description:</strong> ${item.description}</p>` : ''}
    ${item.filePath ? `<p><strong>File Path:</strong> <code>${item.filePath}</code></p>` : ''}
    ${item.analytics.recordCount !== undefined ? `<p><strong>Record Count:</strong> ${item.analytics.recordCount.toLocaleString()}</p>` : ''}
    ${item.analytics.populationRate !== undefined ? `<p><strong>Population Rate:</strong> ${(item.analytics.populationRate * 100).toFixed(1)}%</p>` : ''}
`;

      if (item.children.length > 0) {
        html += `
    <h3>Children (${item.children.length})</h3>
    <table>
      <thead>
        <tr><th>Type</th><th>API Name</th><th>Label</th><th>Description</th></tr>
      </thead>
      <tbody>
        ${item.children.map(child => `
        <tr>
          <td>${child.type}</td>
          <td>${child.apiName}</td>
          <td>${child.label || '-'}</td>
          <td>${child.description || '-'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
`;
      }

      if (item.relationships.length > 0) {
        const incoming = item.relationships.filter(r => r.direction === 'incoming');
        const outgoing = item.relationships.filter(r => r.direction === 'outgoing');

        html += `<h3>Relationships (${item.relationships.length})</h3>`;

        if (incoming.length > 0) {
          html += `<h4>Referenced By (${incoming.length})</h4>`;
          incoming.forEach(rel => {
            html += `<div class="relationship incoming">${TYPE_ICONS[rel.nodeType] || '📄'} <strong>${rel.apiName}</strong> (${rel.nodeType}) - ${rel.edgeType.replace(/_/g, ' ')}</div>`;
          });
        }

        if (outgoing.length > 0) {
          html += `<h4>References (${outgoing.length})</h4>`;
          outgoing.forEach(rel => {
            html += `<div class="relationship outgoing">${TYPE_ICONS[rel.nodeType] || '📄'} <strong>${rel.apiName}</strong> (${rel.nodeType}) - ${rel.edgeType.replace(/_/g, ' ')}</div>`;
          });
        }
      }

      html += `</div>`;
    });

    html += `</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metadata-documentation-${new Date().toISOString().split('T')[0]}.html`;
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
            <span>Documentation</span>
          </div>
          <h1 className="text-2xl font-bold text-acs-navy" style={{ fontFamily: 'Georgia, serif' }}>
            Generate Documentation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create comprehensive documentation for selected metadata components
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Selection Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Select Metadata to Document</h2>

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
              <div className="mt-3 max-h-60 overflow-y-auto border rounded-lg divide-y">
                {searchResults.map(result => (
                  <button
                    key={result.id}
                    onClick={() => addItem(result)}
                    disabled={selectedItems.some(i => i.id === result.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                      selectedItems.some(i => i.id === result.id) ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{TYPE_ICONS[result.type] || '📄'}</span>
                      <span className="font-medium text-sm">{result.api_name}</span>
                    </div>
                    {result.label && (
                      <div className="text-xs text-gray-500 ml-6">{result.label}</div>
                    )}
                    <div className="text-xs text-gray-400 ml-6">{result.type}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Items */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Selected ({selectedItems.length})</h2>
              {selectedItems.length > 0 && (
                <button
                  onClick={() => setSelectedItems([])}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <p className="text-sm text-gray-500">No items selected. Search and add metadata above.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-50 rounded px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{TYPE_ICONS[item.type] || '📄'}</span>
                      <span className="text-sm font-medium truncate">{item.api_name}</span>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-600 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateDocumentation}
              disabled={selectedItems.length === 0 || generating}
              className="w-full mt-4 px-4 py-2 bg-acs-blue text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-acs-navy transition-colors"
            >
              {generating ? 'Generating...' : 'Generate Documentation'}
            </button>
          </div>
        </div>

        {/* Right: Documentation Preview */}
        <div className="lg:col-span-2">
          {!documentation ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Ready to Generate
              </h2>
              <p className="text-gray-500">
                Select metadata items from the left panel and click "Generate Documentation"
                to create comprehensive documentation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Documentation Summary</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={exportMarkdown}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Export Markdown
                    </button>
                    <button
                      onClick={exportHTML}
                      className="px-3 py-1 text-sm bg-acs-blue text-white hover:bg-acs-navy rounded"
                    >
                      Export HTML
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {documentation.summary.totalItems}
                    </div>
                    <div className="text-xs text-gray-500">Items</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {documentation.summary.totalChildren}
                    </div>
                    <div className="text-xs text-gray-500">Children</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {documentation.summary.totalRelationships}
                    </div>
                    <div className="text-xs text-gray-500">Relationships</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(documentation.summary.itemsByType).map(([type, count]) => (
                    <span
                      key={type}
                      className="px-2 py-1 text-xs bg-gray-100 rounded-full"
                    >
                      {TYPE_ICONS[type] || '📄'} {type}: {count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Documentation Items */}
              {documentation.items.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Item Header */}
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{TYPE_ICONS[item.type] || '📄'}</span>
                      <div className="text-left">
                        <h3 className="font-semibold text-acs-navy">{item.apiName}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {item.type}
                          </span>
                          {item.label && <span>{item.label}</span>}
                        </div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedItems.has(item.id) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded Content */}
                  {expandedItems.has(item.id) && (
                    <div className="border-t px-4 py-4 space-y-4">
                      {/* Description */}
                      {item.description && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      )}

                      {/* Analytics */}
                      {(item.analytics.recordCount !== undefined || item.analytics.populationRate !== undefined) && (
                        <div className="flex gap-4">
                          {item.analytics.recordCount !== undefined && (
                            <div className="bg-gray-50 rounded px-3 py-2">
                              <div className="text-lg font-semibold">
                                {item.analytics.recordCount.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">Records</div>
                            </div>
                          )}
                          {item.analytics.populationRate !== undefined && (
                            <div className="bg-gray-50 rounded px-3 py-2">
                              <div className="text-lg font-semibold">
                                {(item.analytics.populationRate * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">Population Rate</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Children */}
                      {item.children.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Children ({item.children.length})
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="px-3 py-2 text-left font-medium">Type</th>
                                  <th className="px-3 py-2 text-left font-medium">API Name</th>
                                  <th className="px-3 py-2 text-left font-medium">Label</th>
                                  <th className="px-3 py-2 text-left font-medium">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {item.children.map(child => (
                                  <tr key={child.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2">
                                      {TYPE_ICONS[child.type] || '📄'} {child.type}
                                    </td>
                                    <td className="px-3 py-2 font-medium">{child.apiName}</td>
                                    <td className="px-3 py-2 text-gray-600">{child.label || '-'}</td>
                                    <td className="px-3 py-2 text-gray-500 text-xs">
                                      {child.description || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Relationships */}
                      {item.relationships.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Relationships ({item.relationships.length})
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Incoming */}
                            {item.relationships.filter(r => r.direction === 'incoming').length > 0 && (
                              <div>
                                <h5 className="text-xs font-medium text-green-700 mb-2 uppercase">
                                  Referenced By ({item.relationships.filter(r => r.direction === 'incoming').length})
                                </h5>
                                <div className="space-y-1">
                                  {item.relationships
                                    .filter(r => r.direction === 'incoming')
                                    .slice(0, 10)
                                    .map((rel, idx) => (
                                      <Link
                                        key={idx}
                                        href={`/analysis/impact?nodeId=${rel.nodeId}`}
                                        className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded hover:bg-green-100"
                                      >
                                        <span>{TYPE_ICONS[rel.nodeType] || '📄'}</span>
                                        <span className="font-medium">{rel.apiName}</span>
                                        <span className="text-xs text-gray-500">
                                          {rel.edgeType.replace(/_/g, ' ')}
                                        </span>
                                      </Link>
                                    ))}
                                  {item.relationships.filter(r => r.direction === 'incoming').length > 10 && (
                                    <div className="text-xs text-gray-500 p-2">
                                      +{item.relationships.filter(r => r.direction === 'incoming').length - 10} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Outgoing */}
                            {item.relationships.filter(r => r.direction === 'outgoing').length > 0 && (
                              <div>
                                <h5 className="text-xs font-medium text-blue-700 mb-2 uppercase">
                                  References ({item.relationships.filter(r => r.direction === 'outgoing').length})
                                </h5>
                                <div className="space-y-1">
                                  {item.relationships
                                    .filter(r => r.direction === 'outgoing')
                                    .slice(0, 10)
                                    .map((rel, idx) => (
                                      <Link
                                        key={idx}
                                        href={`/analysis/impact?nodeId=${rel.nodeId}`}
                                        className="flex items-center gap-2 text-sm p-2 bg-blue-50 rounded hover:bg-blue-100"
                                      >
                                        <span>{TYPE_ICONS[rel.nodeType] || '📄'}</span>
                                        <span className="font-medium">{rel.apiName}</span>
                                        <span className="text-xs text-gray-500">
                                          {rel.edgeType.replace(/_/g, ' ')}
                                        </span>
                                      </Link>
                                    ))}
                                  {item.relationships.filter(r => r.direction === 'outgoing').length > 10 && (
                                    <div className="text-xs text-gray-500 p-2">
                                      +{item.relationships.filter(r => r.direction === 'outgoing').length - 10} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* File Path */}
                      {item.filePath && (
                        <div className="text-xs text-gray-400">
                          <span className="font-medium">Source:</span> {item.filePath}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
