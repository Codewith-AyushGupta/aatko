'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Artifact {
  id: string;
  name: string;
  type: 'retirement-package' | 'impact-report' | 'change-log' | 'documentation' | 'export';
  format: 'xlsx' | 'pdf' | 'md' | 'json';
  createdAt: string;
  createdBy: string;
  size: string;
  relatedTo?: string;
  planId?: string;
}

const mockArtifacts: Artifact[] = [
  {
    id: '1',
    name: 'Commission__c Retirement Package',
    type: 'retirement-package',
    format: 'xlsx',
    createdAt: '2026-01-27 10:30 AM',
    createdBy: 'System',
    size: '24 KB',
    relatedTo: 'Commission__c',
  },
  {
    id: '2',
    name: 'Impact Analysis - AA_Sales_Team_Member__c',
    type: 'impact-report',
    format: 'pdf',
    createdAt: '2026-01-27 09:15 AM',
    createdBy: 'System',
    size: '156 KB',
    relatedTo: 'AA_Sales_Team_Member__c',
  },
  {
    id: '3',
    name: 'Q1 Field Cleanup - Change Log',
    type: 'change-log',
    format: 'md',
    createdAt: '2026-01-26 04:00 PM',
    createdBy: 'Jason',
    size: '8 KB',
    planId: '1',
  },
];

const typeIcons: Record<string, string> = {
  'retirement-package': '📦',
  'impact-report': '📊',
  'change-log': '📝',
  'documentation': '📄',
  'export': '📤',
};

const typeLabels: Record<string, string> = {
  'retirement-package': 'Retirement Package',
  'impact-report': 'Impact Report',
  'change-log': 'Change Log',
  'documentation': 'Documentation',
  'export': 'Data Export',
};

const formatColors: Record<string, string> = {
  xlsx: 'bg-green-100 text-green-700',
  pdf: 'bg-red-100 text-red-700',
  md: 'bg-gray-100 text-gray-700',
  json: 'bg-blue-100 text-blue-700',
};

export default function ArtifactsPage() {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState<Artifact[]>(mockArtifacts);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredArtifacts = filterType === 'all'
    ? artifacts
    : artifacts.filter(a => a.type === filterType);

  const handleDownload = (artifact: Artifact) => {
    // Generate content based on artifact type
    let content = '';
    let mimeType = 'text/plain';
    let filename = artifact.name;

    if (artifact.format === 'json') {
      content = JSON.stringify({
        name: artifact.name,
        type: artifact.type,
        createdAt: artifact.createdAt,
        createdBy: artifact.createdBy,
        relatedTo: artifact.relatedTo,
        // Mock data content
        data: {
          message: 'This is a sample export',
          generatedAt: new Date().toISOString(),
        }
      }, null, 2);
      mimeType = 'application/json';
      filename = `${artifact.name.replace(/\s+/g, '_')}.json`;
    } else if (artifact.format === 'md') {
      content = `# ${artifact.name}\n\n`;
      content += `**Type:** ${typeLabels[artifact.type]}\n`;
      content += `**Created:** ${artifact.createdAt}\n`;
      content += `**Created By:** ${artifact.createdBy}\n\n`;
      if (artifact.relatedTo) {
        content += `**Related To:** ${artifact.relatedTo}\n\n`;
      }
      content += `## Summary\n\nThis is a generated artifact for ${artifact.name}.\n`;
      mimeType = 'text/markdown';
      filename = `${artifact.name.replace(/\s+/g, '_')}.md`;
    } else if (artifact.format === 'xlsx') {
      // For XLSX, we'll generate a CSV as a fallback
      content = 'Name,Type,Created At,Created By,Related To\n';
      content += `"${artifact.name}","${artifact.type}","${artifact.createdAt}","${artifact.createdBy}","${artifact.relatedTo || ''}"\n`;
      mimeType = 'text/csv';
      filename = `${artifact.name.replace(/\s+/g, '_')}.csv`;
      alert('Note: Downloading as CSV. Full XLSX export requires server-side generation.');
    } else if (artifact.format === 'pdf') {
      // For PDF, show a message that it requires server-side generation
      alert('PDF generation requires server-side processing. This feature will be available soon.');
      return;
    }

    // Create and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = (artifactId: string) => {
    if (confirm('Are you sure you want to delete this artifact?')) {
      setArtifacts(prev => prev.filter(a => a.id !== artifactId));
    }
  };

  const handleFullExport = async () => {
    try {
      // Fetch all objects data
      const response = await fetch('/api/export/full');
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const data = await response.json();

      // Create download
      const content = JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sf-metadata-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Add to artifacts list
      const newArtifact: Artifact = {
        id: String(Date.now()),
        name: `Full Metadata Export - ${new Date().toLocaleDateString()}`,
        type: 'export',
        format: 'json',
        createdAt: new Date().toLocaleString(),
        createdBy: 'System',
        size: `${Math.round(content.length / 1024)} KB`,
      };
      setArtifacts(prev => [newArtifact, ...prev]);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export metadata. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Artifacts</h1>
          <p className="text-gray-600 mt-1">
            Generated documents, reports, and exports
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
          </button>
          <button className="bg-sf-blue text-white px-4 py-2 rounded-lg hover:bg-sf-navy transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate New
          </button>
        </div>
      </div>

      {/* Quick Generate Options */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GenerateCard
          title="Retirement Package"
          description="XLSX with all dependencies and steps"
          icon="📦"
          action="Generate for an object"
          onClick={() => router.push('/artifacts/generate?type=retirement-package')}
        />
        <GenerateCard
          title="Impact Report"
          description="Full dependency analysis PDF"
          icon="📊"
          action="Generate for any metadata"
          onClick={() => router.push('/artifacts/generate?type=impact-report')}
        />
        <GenerateCard
          title="Field Analysis"
          description="Utilization and recommendations"
          icon="📈"
          action="Export field data"
          onClick={() => router.push('/artifacts/generate?type=field-analysis')}
        />
        <GenerateCard
          title="Full Export"
          description="Complete metadata database"
          icon="💾"
          action="Export as JSON"
          onClick={() => handleFullExport()}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <FilterTab label="All" value="all" current={filterType} onClick={setFilterType} count={artifacts.length} />
        <FilterTab label="Retirement Packages" value="retirement-package" current={filterType} onClick={setFilterType} count={artifacts.filter(a => a.type === 'retirement-package').length} />
        <FilterTab label="Impact Reports" value="impact-report" current={filterType} onClick={setFilterType} count={artifacts.filter(a => a.type === 'impact-report').length} />
        <FilterTab label="Change Logs" value="change-log" current={filterType} onClick={setFilterType} count={artifacts.filter(a => a.type === 'change-log').length} />
      </div>

      {/* Artifacts List */}
      <div className="bg-white rounded-lg shadow">
        {filteredArtifacts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredArtifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{typeIcons[artifact.type]}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{artifact.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{typeLabels[artifact.type]}</span>
                      <span>•</span>
                      <span>{artifact.createdAt}</span>
                      <span>•</span>
                      <span>{artifact.size}</span>
                      {artifact.relatedTo && (
                        <>
                          <span>•</span>
                          <Link href={`/objects/${artifact.relatedTo}`} className="text-sf-blue hover:underline">
                            {artifact.relatedTo}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${formatColors[artifact.format]}`}>
                    {artifact.format.toUpperCase()}
                  </span>
                  <button
                    onClick={() => handleDownload(artifact)}
                    className="p-2 text-gray-400 hover:text-sf-blue transition-colors"
                    title="Download"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(artifact.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No artifacts found</p>
            <p className="text-sm mt-1">Generate reports or export data to create artifacts</p>
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{artifacts.length}</span> artifacts using{' '}
          <span className="font-medium">188 KB</span> of storage
        </div>
        <button className="text-sm text-gray-500 hover:text-gray-700">
          Manage storage →
        </button>
      </div>
    </div>
  );
}

function GenerateCard({ title, description, icon, action, onClick }: { title: string; description: string; icon: string; action: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-sf-blue text-left w-full"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );
}

function FilterTab({ label, value, current, onClick, count }: { label: string; value: string; current: string; onClick: (v: string) => void; count: number }) {
  const isActive = value === current;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-sf-blue text-white'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
          isActive ? 'bg-white/20' : 'bg-gray-200'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}
