'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

interface ObjectOption {
  id: number;
  name: string;
  label: string;
  fieldCount: number;
}

function GenerateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'retirement-package';

  const [objects, setObjects] = useState<ObjectOption[]>([]);
  const [selectedObject, setSelectedObject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const typeInfo: Record<string, { title: string; icon: string; description: string }> = {
    'retirement-package': {
      title: 'Generate Retirement Package',
      icon: '📦',
      description: 'Create a comprehensive package with all dependencies and removal steps for an object',
    },
    'impact-report': {
      title: 'Generate Impact Report',
      icon: '📊',
      description: 'Generate a detailed dependency analysis report',
    },
    'field-analysis': {
      title: 'Generate Field Analysis',
      icon: '📈',
      description: 'Analyze field utilization and get recommendations',
    },
  };

  const info = typeInfo[type] || typeInfo['retirement-package'];

  useEffect(() => {
    async function fetchObjects() {
      setLoading(true);
      try {
        const res = await fetch('/api/objects');
        const data = await res.json();
        setObjects(data.objects || []);
      } catch (error) {
        console.error('Error fetching objects:', error);
      }
      setLoading(false);
    }
    fetchObjects();
  }, []);

  const filteredObjects = objects.filter(obj =>
    obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (obj.label && obj.label.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleGenerate = async () => {
    if (!selectedObject) {
      alert('Please select an object');
      return;
    }

    setGenerating(true);

    try {
      if (type === 'retirement-package' || type === 'impact-report') {
        // Navigate to the impact page for the object
        router.push(`/objects/${encodeURIComponent(selectedObject)}/impact`);
      } else if (type === 'field-analysis') {
        // Navigate to object detail with fields tab
        router.push(`/objects/${encodeURIComponent(selectedObject)}?tab=fields`);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate. Please try again.');
    }

    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/artifacts" className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{info.icon}</span>
            <h1 className="text-2xl font-bold">{info.title}</h1>
          </div>
          <p className="text-gray-600 mt-1">{info.description}</p>
        </div>
      </div>

      {/* Object Selection */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Select Object</h2>
          <div className="mt-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sf-blue"
              placeholder="Search objects..."
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading objects...</div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filteredObjects.map((obj) => (
              <label
                key={obj.name}
                className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                  selectedObject === obj.name ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="object"
                  value={obj.name}
                  checked={selectedObject === obj.name}
                  onChange={() => setSelectedObject(obj.name)}
                  className="w-4 h-4 text-sf-blue"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{obj.label || obj.name}</div>
                  <div className="text-sm text-gray-500">{obj.name}</div>
                </div>
                <span className="text-xs text-gray-500">{obj.fieldCount} fields</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  obj.name.endsWith('__c')
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {obj.name.endsWith('__c') ? 'Custom' : 'Standard'}
                </span>
              </label>
            ))}
            {filteredObjects.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No objects found matching your search
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/artifacts"
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </Link>
        <button
          onClick={handleGenerate}
          disabled={!selectedObject || generating}
          className="bg-sf-blue text-white px-6 py-2 rounded-lg hover:bg-sf-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <GenerateContent />
    </Suspense>
  );
}
