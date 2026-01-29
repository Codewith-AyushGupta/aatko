'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useCallback, Suspense } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

function GraphViewContent() {
  const searchParams = useSearchParams();
  const nodeId = searchParams.get('node');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(nodeId);
  const [graphData, setGraphData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'reactflow' | 'mermaid'>('reactflow');

  const loadGraph = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/graph?node=${id}`);
      const data = await res.json();
      setGraphData(data);

      // Apply layout
      const layoutedNodes = applyLayout(data.nodes, data.edges);

      setNodes(layoutedNodes);
      setEdges(data.edges.map((e: any) => ({
        ...e,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2 },
      })));
    } catch (error) {
      console.error('Failed to load graph:', error);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (selectedNode) {
      loadGraph(selectedNode);
    }
  }, [selectedNode, loadGraph]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  // Generate Mermaid diagram code
  const getMermaidCode = () => {
    if (!graphData) return '';

    const lines = ['flowchart TB'];

    // Add node definitions
    graphData.nodes.forEach((node: any) => {
      const shape = getNodeShape(node.data.nodeType);
      lines.push(`    ${node.id}${shape.open}"${node.data.label}"${shape.close}`);
    });

    // Add edges
    graphData.edges.forEach((edge: any) => {
      const label = edge.label ? `|${edge.label}|` : '';
      lines.push(`    ${edge.source} -->${label} ${edge.target}`);
    });

    return lines.join('\n');
  };

  // Copy Mermaid code to clipboard
  const copyMermaidCode = async () => {
    const code = getMermaidCode();
    await navigator.clipboard.writeText(code);
    alert('Mermaid code copied! Paste it into Lucidchart, Mermaid Live, or any Mermaid-compatible tool.');
  };

  // Download as CSV for Lucidchart
  const downloadForLucidchart = async () => {
    if (!graphData) return;

    // Create CSV format for Lucidchart
    let csv = 'Id,Name,Type,Label\n';
    graphData.nodes.forEach((node: any) => {
      csv += `${node.id},"${node.data.label}","${node.data.nodeType}","${node.data.label}"\n`;
    });
    csv += '\nSource,Target,Relationship\n';
    graphData.edges.forEach((edge: any) => {
      csv += `"${edge.source}","${edge.target}","${edge.label || 'relates'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph-${selectedNode}-lucidchart.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Open Lucidchart with instructions
  const openInLucidchart = () => {
    downloadForLucidchart();
    window.open('https://www.lucidchart.com/documents/new', '_blank');
  };

  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Dependency Graph</h1>
          {loading && (
            <div className="animate-spin h-5 w-5 border-2 border-sf-blue border-t-transparent rounded-full" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {graphData && (
            <>
              <button
                onClick={copyMermaidCode}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy Mermaid code"
              >
                Copy Mermaid
              </button>
              <button
                onClick={downloadForLucidchart}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Download CSV for Lucidchart"
              >
                Download CSV
              </button>
              <button
                onClick={openInLucidchart}
                className="px-3 py-1.5 text-sm bg-orange-500 text-white hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-1"
              >
                <span>Open in Lucidchart</span>
                <span className="text-xs">↗</span>
              </button>
            </>
          )}
          <Link
            href="/export"
            className="px-3 py-1.5 text-sm bg-sf-blue text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            Full Export
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow h-full">
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Controls />
            <Background />
            <Panel position="top-left">
              <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg p-3 text-xs space-y-1">
                <div className="font-medium mb-2">Legend</div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#dbeafe', border: '2px solid #3b82f6' }}></div>
                  <span>Object</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#f3e8ff', border: '2px solid #a855f7' }}></div>
                  <span>Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#ffedd5', border: '2px solid #f97316' }}></div>
                  <span>Apex Class</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#fef3c7', border: '2px solid #f59e0b' }}></div>
                  <span>Trigger</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#dcfce7', border: '2px solid #22c55e' }}></div>
                  <span>LWC</span>
                </div>
              </div>
            </Panel>
            <Panel position="bottom-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
                Click any node to explore its dependencies. Use export buttons above for Lucidchart.
              </div>
            </Panel>
          </ReactFlow>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
            {loading ? (
              'Loading graph...'
            ) : (
              <>
                <div className="text-lg">Select a starting point</div>
                <p className="text-sm max-w-md text-center">
                  Navigate from an object, flow, or apex page and click "View in Graph" to visualize dependencies.
                  Or use the full export for comprehensive Lucidchart diagrams.
                </p>
                <Link
                  href="/export"
                  className="px-4 py-2 bg-sf-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Export All Data for Lucidchart
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mermaid Code Preview */}
      {graphData && viewMode === 'mermaid' && (
        <div className="mt-4 bg-gray-900 rounded-lg p-4">
          <pre className="text-green-400 text-sm overflow-auto max-h-64">
            {getMermaidCode()}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function GraphPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GraphViewContent />
    </Suspense>
  );
}

// Mermaid shapes for different node types
function getNodeShape(type: string): { open: string; close: string } {
  const shapes: Record<string, { open: string; close: string }> = {
    Object: { open: '[(', close: ')]' },       // Stadium shape
    CustomObject: { open: '[(', close: ')]' },
    Flow: { open: '{', close: '}' },           // Diamond
    ApexClass: { open: '[[', close: ']]' },    // Subroutine
    ApexTrigger: { open: '{{', close: '}}' },  // Hexagon
    LWC: { open: '((', close: '))' },          // Circle
    Layout: { open: '[/', close: '/]' },       // Parallelogram
    FlexiPage: { open: '(', close: ')' },      // Rounded rectangle
  };
  return shapes[type] || { open: '[', close: ']' };
}

// Simple force-directed layout
function applyLayout(nodes: any[], edges: any[]): Node[] {
  const nodeMap = new Map<string, { x: number; y: number; type: string }>();
  const typeOrder = ['CustomObject', 'Object', 'Flow', 'ApexClass', 'ApexTrigger', 'LWC', 'Layout', 'FlexiPage'];

  // Group nodes by type
  const byType: Record<string, any[]> = {};
  nodes.forEach(n => {
    const type = n.data.nodeType;
    byType[type] = byType[type] || [];
    byType[type].push(n);
  });

  // Position nodes in rows by type
  let y = 0;
  for (const type of typeOrder) {
    if (!byType[type]) continue;
    const row = byType[type];
    const startX = -(row.length - 1) * 150;

    row.forEach((node, i) => {
      nodeMap.set(node.id, {
        x: startX + i * 300,
        y,
        type,
      });
    });

    y += 200;
  }

  // Handle remaining types
  for (const [type, row] of Object.entries(byType)) {
    if (typeOrder.includes(type)) continue;
    const startX = -(row.length - 1) * 150;
    row.forEach((node, i) => {
      nodeMap.set(node.id, {
        x: startX + i * 300,
        y,
        type,
      });
    });
    y += 200;
  }

  return nodes.map(n => ({
    ...n,
    position: nodeMap.get(n.id) || { x: 0, y: 0 },
    style: getNodeStyle(n.data.nodeType),
  }));
}

function getNodeStyle(type: string): React.CSSProperties {
  const styles: Record<string, React.CSSProperties> = {
    Object: { background: '#dbeafe', border: '2px solid #3b82f6', padding: 10, borderRadius: 8 },
    CustomObject: { background: '#dbeafe', border: '2px solid #3b82f6', padding: 10, borderRadius: 8 },
    Flow: { background: '#f3e8ff', border: '2px solid #a855f7', padding: 10, borderRadius: 8 },
    ApexClass: { background: '#ffedd5', border: '2px solid #f97316', padding: 10, borderRadius: 8 },
    ApexTrigger: { background: '#fef3c7', border: '2px solid #f59e0b', padding: 10, borderRadius: 8 },
    LWC: { background: '#dcfce7', border: '2px solid #22c55e', padding: 10, borderRadius: 8 },
    Layout: { background: '#f1f5f9', border: '2px solid #64748b', padding: 10, borderRadius: 8 },
    FlexiPage: { background: '#e0e7ff', border: '2px solid #6366f1', padding: 10, borderRadius: 8 },
  };
  return styles[type] || { background: '#f3f4f6', border: '2px solid #9ca3af', padding: 10, borderRadius: 8 };
}
