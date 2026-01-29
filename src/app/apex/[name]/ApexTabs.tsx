'use client';

import { useState } from 'react';
import Link from 'next/link';
import ApexVisualizer from '@/components/ApexVisualizer';

interface ApexTabsProps {
  apexCode: string;
  fileFound: boolean;
  decodedName: string;
  metadata: any;
  incomingEdges: any[];
  outgoingEdges: any[];
}

export default function ApexTabs({
  apexCode,
  fileFound,
  decodedName,
  metadata,
  incomingEdges,
  outgoingEdges,
}: ApexTabsProps) {
  const [activeTab, setActiveTab] = useState<'diagram' | 'details' | 'source'>('diagram');

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
            Class Diagram
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-sf-blue text-sf-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dependencies
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'source'
                ? 'border-sf-blue text-sf-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Source Code
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'diagram' ? (
        <div className="flex-1 overflow-hidden">
          {fileFound && apexCode ? (
            <ApexVisualizer apexCode={apexCode} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Source file not found</p>
                <p className="text-sm text-gray-400">
                  Looking for: {decodedName}.cls or {decodedName}.trigger
                </p>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'details' ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {/* References */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Objects Referenced */}
            {metadata.references?.objects?.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Objects Referenced</h2>
                <ul className="space-y-1">
                  {metadata.references.objects.map((obj: string, i: number) => (
                    <li key={i}>
                      <Link href={`/objects/${obj}`} className="text-sf-blue hover:underline">
                        {obj}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Classes Referenced */}
            {metadata.references?.classes?.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Classes Referenced</h2>
                <ul className="space-y-1">
                  {metadata.references.classes.map((cls: string, i: number) => (
                    <li key={i}>
                      <Link href={`/apex/${cls}`} className="text-sf-blue hover:underline font-mono">
                        {cls}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Dependencies */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Inbound */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Referenced By ({incomingEdges.length})</h2>
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
                <p className="text-gray-500 text-sm">No incoming references found</p>
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
                <p className="text-gray-500 text-sm">No outgoing references found</p>
              )}
            </section>
          </div>

          {/* Methods */}
          {metadata.methods?.length > 0 && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Methods ({metadata.methods.length})</h2>
              <div className="flex flex-wrap gap-2">
                {metadata.methods.map((method: string, i: number) => (
                  <span key={i} className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                    {method}()
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          {fileFound && apexCode ? (
            <div className="flex-1 overflow-auto">
              <pre className="p-4 text-sm bg-gray-900 text-gray-100 min-h-full">
                <code>{apexCode}</code>
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Source file not found</p>
                <p className="text-sm text-gray-400">
                  The source code file is not available in the force-app directory.
                </p>
              </div>
            </div>
          )}
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
