'use client';

import { useState } from 'react';
import Link from 'next/link';
import FlowVisualizer from '@/components/FlowVisualizer';

interface FlowTabsProps {
  flowXml: string;
  flowExists: boolean;
  decodedName: string;
  touchpoints: any;
  incomingEdges: any[];
  outgoingEdges: any[];
}

export default function FlowTabs({
  flowXml,
  flowExists,
  decodedName,
  touchpoints,
  incomingEdges,
  outgoingEdges,
}: FlowTabsProps) {
  const [activeTab, setActiveTab] = useState<'diagram' | 'details'>('diagram');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="bg-white border-b px-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('diagram')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'diagram'
                ? 'border-sf-blue text-sf-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Flow Diagram
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-sf-blue text-sf-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Details & Dependencies
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'diagram' ? (
        <div className="flex-1 overflow-hidden">
          {flowExists ? (
            <FlowVisualizer flowXml={flowXml} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Flow file not found</p>
                <p className="text-sm text-gray-400">
                  Looking for: {decodedName}.flow-meta.xml
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {/* Touchpoints Summary */}
          {(touchpoints.objects?.length > 0 || touchpoints.operations?.length > 0) && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Touchpoints</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {touchpoints.objects?.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Objects Referenced</h3>
                    <ul className="space-y-1">
                      {touchpoints.objects.map((obj: string, i: number) => (
                        <li key={i}>
                          <Link href={`/objects/${obj}`} className="text-sf-blue hover:underline">
                            {obj}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {touchpoints.operations?.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Operations</h3>
                    <ul className="space-y-1">
                      {touchpoints.operations.map((op: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600">{op}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {touchpoints.apexCalls?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Apex Invocations</h3>
                  <ul className="space-y-1">
                    {touchpoints.apexCalls.map((apex: string, i: number) => (
                      <li key={i}>
                        <Link href={`/apex/${apex}`} className="text-sf-blue hover:underline">
                          {apex}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {touchpoints.subflows?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Subflows</h3>
                  <ul className="space-y-1">
                    {touchpoints.subflows.map((subflow: string, i: number) => (
                      <li key={i}>
                        <Link href={`/flows/${subflow}`} className="text-sf-blue hover:underline">
                          {subflow}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Dependencies */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Inbound */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Called By ({incomingEdges.length})</h2>
              {incomingEdges.length > 0 ? (
                <ul className="space-y-2">
                  {incomingEdges.map((edge, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {edge.node_type}
                      </span>
                      <Link
                        href={getNodeLink(edge.node_type, edge.node_api_name)}
                        className="text-sf-blue hover:underline"
                      >
                        {edge.node_api_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No incoming dependencies found</p>
              )}
            </section>

            {/* Outbound */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">References ({outgoingEdges.length})</h2>
              {outgoingEdges.length > 0 ? (
                <ul className="space-y-2">
                  {outgoingEdges.map((edge, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {edge.node_type}
                      </span>
                      <Link
                        href={getNodeLink(edge.node_type, edge.node_api_name)}
                        className="text-sf-blue hover:underline"
                      >
                        {edge.node_api_name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No outgoing dependencies found</p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function getNodeLink(type: string, apiName: string): string {
  const routes: Record<string, string> = {
    Object: '/objects',
    Flow: '/flows',
    ApexClass: '/apex',
    ApexTrigger: '/apex',
    LWC: '/lwc',
  };
  return `${routes[type] || '/objects'}/${apiName}`;
}
