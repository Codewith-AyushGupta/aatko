'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface Item {
  id: number;
  apiName: string;
  label: string;
  type: string;
}

interface ExportData {
  items: Item[];
  relationships: any[];
  summary: {
    totalItems: number;
    byType: Record<string, number>;
  };
}

// Color scheme for different metadata types
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Object': { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  'CustomObject': { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  'Field': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  'CustomField': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  'Flow': { bg: '#ddd6fe', border: '#8b5cf6', text: '#5b21b6' },
  'ApexClass': { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  'ApexTrigger': { bg: '#ffe4e6', border: '#f43f5e', text: '#9f1239' },
  'LWC': { bg: '#ccfbf1', border: '#14b8a6', text: '#115e59' },
  'LightningComponentBundle': { bg: '#ccfbf1', border: '#14b8a6', text: '#115e59' },
  'Layout': { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  'PermissionSet': { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
  'Profile': { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
  'ValidationRule': { bg: '#fecaca', border: '#ef4444', text: '#991b1b' },
  'RecordType': { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  'Dashboard': { bg: '#e9d5ff', border: '#a855f7', text: '#7e22ce' },
  'Report': { bg: '#e9d5ff', border: '#a855f7', text: '#7e22ce' },
};

const getTypeColor = (type: string) => {
  return TYPE_COLORS[type] || { bg: '#f3f4f6', border: '#6b7280', text: '#374151' };
};

const METADATA_TYPES = [
  { id: 'CustomObject', label: 'Objects' },
  { id: 'CustomField', label: 'Fields' },
  { id: 'Flow', label: 'Flows' },
  { id: 'ApexClass', label: 'Apex Classes' },
  { id: 'ApexTrigger', label: 'Apex Triggers' },
  { id: 'LWC', label: 'LWCs' },
  { id: 'Layout', label: 'Layouts' },
  { id: 'PermissionSet', label: 'Permission Sets' },
  { id: 'Dashboard', label: 'Dashboards' },
  { id: 'Report', label: 'Reports' },
];

export default function ExportBuilderPage() {
  const [selectedType, setSelectedType] = useState('CustomObject');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandingDeps, setExpandingDeps] = useState(false);
  const [depDepth, setDepDepth] = useState(2);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Generate graph nodes and edges from export data
  useEffect(() => {
    const items = exportData?.items || selectedItems;
    const relationships = exportData?.relationships || [];

    if (items.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Group items by type for layout
    const byType: Record<string, Item[]> = {};
    items.forEach(item => {
      if (!byType[item.type]) byType[item.type] = [];
      byType[item.type].push(item);
    });

    // Create nodes with auto-layout
    const newNodes: Node[] = [];
    let yOffset = 0;
    const typeOrder = ['Object', 'CustomObject', 'Field', 'CustomField', 'Flow', 'ApexClass', 'ApexTrigger', 'LWC', 'PermissionSet', 'Layout', 'ValidationRule', 'RecordType', 'Dashboard', 'Report'];

    // Sort types for consistent layout
    const sortedTypes = Object.keys(byType).sort((a, b) => {
      const aIdx = typeOrder.indexOf(a);
      const bIdx = typeOrder.indexOf(b);
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });

    sortedTypes.forEach((type) => {
      const typeItems = byType[type];
      const colors = getTypeColor(type);
      const cols = Math.min(4, Math.ceil(Math.sqrt(typeItems.length)));

      typeItems.forEach((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        newNodes.push({
          id: String(item.id),
          type: 'default',
          position: {
            x: 50 + col * 220,
            y: yOffset + row * 80
          },
          data: {
            label: (
              <div className="text-center">
                <div className="font-medium text-xs truncate max-w-[180px]" title={item.label}>
                  {item.label}
                </div>
                <div className="text-[10px] opacity-75 truncate max-w-[180px]" title={item.apiName}>
                  {item.apiName}
                </div>
              </div>
            )
          },
          style: {
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '8px 12px',
            color: colors.text,
            fontSize: '12px',
            width: 200,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });

      const rows = Math.ceil(typeItems.length / cols);
      yOffset += rows * 80 + 60;
    });

    // Create edges from relationships
    const itemIdSet = new Set(items.map(i => String(i.id)));
    const newEdges: Edge[] = relationships
      .filter(rel => itemIdSet.has(String(rel.sourceId)) && itemIdSet.has(String(rel.targetId)))
      .map((rel, idx) => ({
        id: `e-${idx}`,
        source: String(rel.sourceId),
        target: String(rel.targetId),
        label: rel.edgeType?.replace(/_/g, ' ').toLowerCase(),
        labelStyle: { fontSize: 9, fill: '#6b7280' },
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#94a3b8',
        },
        animated: rel.edgeType?.includes('TRIGGER') || rel.edgeType?.includes('FLOW'),
      }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [exportData, selectedItems, setNodes, setEdges]);

  // Load items when type or search changes
  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type: selectedType });
        if (searchTerm) params.set('search', searchTerm);

        const res = await fetch(`/api/export/items?${params}`);
        const data = await res.json();
        setAvailableItems(data.items || []);
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(loadItems, 300);
    return () => clearTimeout(debounce);
  }, [selectedType, searchTerm]);

  const addItem = (item: Item) => {
    if (!selectedItems.find(i => i.id === item.id)) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const removeItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(i => i.id !== itemId));
  };

  const addAllVisible = () => {
    const newItems = availableItems.filter(
      item => !selectedItems.find(i => i.id === item.id)
    );
    setSelectedItems([...selectedItems, ...newItems]);
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setExportData(null);
  };

  const expandDependencies = async () => {
    if (selectedItems.length === 0) return;

    setExpandingDeps(true);
    try {
      const res = await fetch('/api/export/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: selectedItems.map(i => i.id),
          depth: depDepth,
        }),
      });
      const data = await res.json();
      setExportData(data);
    } catch (error) {
      console.error('Failed to expand dependencies:', error);
    } finally {
      setExpandingDeps(false);
    }
  };

  const downloadCSV = () => {
    if (!exportData) return;

    // Group items by type
    const byType: Record<string, Item[]> = {};
    exportData.items.forEach(item => {
      if (!byType[item.type]) byType[item.type] = [];
      byType[item.type].push(item);
    });

    let csv = '';

    // Add each type as a section
    Object.entries(byType).forEach(([type, items]) => {
      csv += `\n=== ${type} (${items.length}) ===\n`;
      csv += 'API Name,Label,Type\n';
      items.forEach(item => {
        csv += `"${item.apiName}","${item.label}","${item.type}"\n`;
      });
    });

    // Add relationships section
    if (exportData.relationships.length > 0) {
      csv += '\n=== RELATIONSHIPS ===\n';
      csv += 'Source,Target,Relationship Type\n';
      exportData.relationships.forEach(rel => {
        csv += `"${rel.sourceName || rel.sourceId}","${rel.targetName || rel.targetId}","${rel.edgeType}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salesforce-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!exportData) return;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salesforce-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPackageXml = () => {
    const items = exportData?.items || selectedItems;
    if (items.length === 0) return;

    // Map database types to Salesforce metadata API types
    const sfTypeMapping: Record<string, string> = {
      'Object': 'CustomObject',
      'Field': 'CustomField',
      'Flow': 'Flow',
      'ApexClass': 'ApexClass',
      'ApexTrigger': 'ApexTrigger',
      'LWC': 'LightningComponentBundle',
      'Layout': 'Layout',
      'FlexiPage': 'FlexiPage',
      'PermissionSet': 'PermissionSet',
      'Profile': 'Profile',
      'Dashboard': 'Dashboard',
      'Report': 'Report',
      'RecordType': 'RecordType',
      'ValidationRule': 'ValidationRule',
    };

    // Group items by SF metadata type
    const byType: Record<string, string[]> = {};
    items.forEach(item => {
      const sfType = sfTypeMapping[item.type] || item.type;
      if (!byType[sfType]) byType[sfType] = [];
      byType[sfType].push(item.apiName);
    });

    // Generate package.xml
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n';

    Object.entries(byType).sort((a, b) => a[0].localeCompare(b[0])).forEach(([type, members]) => {
      xml += '    <types>\n';
      members.sort().forEach(member => {
        xml += `        <members>${member}</members>\n`;
      });
      xml += `        <name>${type}</name>\n`;
      xml += '    </types>\n';
    });

    xml += '    <version>59.0</version>\n';
    xml += '</Package>\n';

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'package.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    const items = exportData?.items || selectedItems;
    if (items.length === 0) return;

    // Dynamically import xlsx library
    const XLSX = await import('xlsx');

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Group items by type
    const byType: Record<string, Item[]> = {};
    items.forEach(item => {
      if (!byType[item.type]) byType[item.type] = [];
      byType[item.type].push(item);
    });

    // Create a sheet for each type
    Object.entries(byType).sort((a, b) => a[0].localeCompare(b[0])).forEach(([type, typeItems]) => {
      const data = typeItems.map(item => ({
        'API Name': item.apiName,
        'Label': item.label,
        'Type': item.type,
      }));

      const ws = XLSX.utils.json_to_sheet(data);

      // Set column widths
      ws['!cols'] = [
        { wch: 40 }, // API Name
        { wch: 40 }, // Label
        { wch: 20 }, // Type
      ];

      // Truncate sheet name to 31 chars (Excel limit)
      const sheetName = type.length > 31 ? type.substring(0, 31) : type;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // Add relationships sheet if available
    if (exportData?.relationships && exportData.relationships.length > 0) {
      const relData = exportData.relationships.map(rel => ({
        'Source': rel.sourceName || rel.sourceId,
        'Target': rel.targetName || rel.targetId,
        'Relationship Type': rel.edgeType,
      }));

      const ws = XLSX.utils.json_to_sheet(relData);
      ws['!cols'] = [
        { wch: 40 },
        { wch: 40 },
        { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Relationships');
    }

    // Add summary sheet
    const summaryData = Object.entries(byType).map(([type, items]) => ({
      'Metadata Type': type,
      'Count': items.length,
    }));
    summaryData.push({ 'Metadata Type': 'TOTAL', 'Count': items.length });

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Move summary to front
    wb.SheetNames.unshift(wb.SheetNames.pop()!);

    // Download
    XLSX.writeFile(wb, `salesforce-export-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Group selected items by type for display
  const selectedByType = selectedItems.reduce((acc: Record<string, Item[]>, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Builder</h1>
          <p className="text-gray-600 mt-1">
            Select specific items and optionally include their dependencies
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-acs-blue text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 text-sm border-l border-gray-300 transition-colors ${
                viewMode === 'graph'
                  ? 'bg-acs-blue text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Graph View
            </button>
          </div>
          <Link
            href="/export"
            className="text-sm text-sf-blue hover:underline"
          >
            Simple Export
          </Link>
        </div>
      </div>

      {/* Graph View */}
      {viewMode === 'graph' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Dependency Graph</h2>
              <p className="text-sm text-gray-500">
                {nodes.length} items, {edges.length} relationships
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Type Legend */}
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, colors]) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 rounded"
                    style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                  >
                    {type.replace('Custom', '')}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {nodes.length === 0 ? (
            <div className="h-[500px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p>No items to display</p>
                <p className="text-sm mt-1">Switch to List View to select items, then click "Add All Dependencies"</p>
              </div>
            </div>
          ) : (
            <div className="h-[600px]">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                attributionPosition="bottom-right"
              >
                <Background color="#e5e7eb" gap={16} />
                <Controls showInteractive={false} />
                <MiniMap
                  nodeColor={(node) => {
                    const style = node.style as any;
                    return style?.border || '#6b7280';
                  }}
                  maskColor="rgba(0, 0, 0, 0.1)"
                />
              </ReactFlow>
            </div>
          )}
          {/* Export buttons for graph view */}
          {nodes.length > 0 && (
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Export this graph data:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={downloadCSV}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  CSV
                </button>
                <button
                  onClick={downloadJSON}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  JSON
                </button>
                <button
                  onClick={downloadPackageXml}
                  className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                >
                  package.xml
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Item Selection */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Select Items</h2>

            {/* Type Selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {METADATA_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedType === type.id
                      ? 'bg-sf-blue text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${METADATA_TYPES.find(t => t.id === selectedType)?.label || 'items'}...`}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sf-blue"
              />
              <button
                onClick={addAllVisible}
                disabled={availableItems.length === 0}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Add All
              </button>
            </div>

            {/* Available Items */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : availableItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No items found</div>
              ) : (
                <div className="divide-y">
                  {availableItems.map(item => {
                    const isSelected = selectedItems.some(i => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`px-3 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => !isSelected && addItem(item)}
                      >
                        <div>
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs text-gray-500 font-mono">{item.apiName}</div>
                        </div>
                        {isSelected ? (
                          <span className="text-xs text-green-600">Added</span>
                        ) : (
                          <button className="text-xs text-sf-blue hover:underline">
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected Items & Export */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">
                Selected ({selectedItems.length})
              </h2>
              {selectedItems.length > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No items selected</p>
                <p className="text-sm mt-1">Click items on the left to add them</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {Object.entries(selectedByType).map(([type, items]) => (
                  <div key={type}>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      {type} ({items.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {items.map(item => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {item.apiName}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dependency Expansion */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Include Dependencies</h2>

            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm">
                <span>Depth:</span>
                <select
                  value={depDepth}
                  onChange={(e) => setDepDepth(Number(e.target.value))}
                  className="border rounded px-2 py-1"
                >
                  <option value={1}>1 level</option>
                  <option value={2}>2 levels</option>
                  <option value={3}>3 levels</option>
                </select>
              </label>

              <button
                onClick={expandDependencies}
                disabled={selectedItems.length === 0 || expandingDeps}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {expandingDeps ? 'Expanding...' : 'Add All Dependencies'}
              </button>
            </div>

            {exportData && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="font-medium text-purple-900 mb-2">
                  Expanded to {exportData.summary.totalItems} items
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(exportData.summary.byType).map(([type, count]) => (
                    <span key={type} className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      {type}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export Buttons */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Export</h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadCSV}
                disabled={!exportData && selectedItems.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                CSV
              </button>
              <button
                onClick={downloadJSON}
                disabled={!exportData && selectedItems.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                JSON
              </button>
              <button
                onClick={downloadExcel}
                disabled={!exportData && selectedItems.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Excel (Tabbed)
              </button>
              <button
                onClick={downloadPackageXml}
                disabled={!exportData && selectedItems.length === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                package.xml
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              {exportData
                ? 'Export includes selected items + dependencies'
                : 'Click "Add All Dependencies" first for a complete export, or download selected items only'
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Excel creates tabbed sheets per metadata type. package.xml is for Salesforce deployments.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900">How to Use Export Builder</h3>
        <ol className="mt-2 text-sm text-blue-700 space-y-1">
          <li>1. Select a metadata type and search for specific items</li>
          <li>2. Click items to add them to your export list</li>
          <li>3. (Optional) Click "Add All Dependencies" to include related metadata</li>
          <li>4. Download as CSV (for spreadsheets, Lucidchart) or JSON (for developers)</li>
        </ol>
      </div>
    </div>
  );
}
