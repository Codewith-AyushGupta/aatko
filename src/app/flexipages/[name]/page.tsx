'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface FlexiPageData {
  id: number;
  api_name: string;
  label: string;
  file_path: string;
  metadata: {
    description?: string;
    type?: string;
    sobjectType?: string;
    template?: string;
  };
  relatedObject?: {
    id: number;
    api_name: string;
    label: string;
  };
}

export default function FlexiPageDetailPage() {
  const params = useParams();
  const [data, setData] = useState<FlexiPageData | null>(null);
  const [loading, setLoading] = useState(true);

  const pageName = params.name as string;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/flexipages/${encodeURIComponent(pageName)}`);
        if (res.ok) {
          const pageData = await res.json();
          setData(pageData);
        }
      } catch (err) {
        console.error('Failed to load flexipage data:', err);
      }
      setLoading(false);
    }
    loadData();
  }, [pageName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lightning Page not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/flexipages" className="hover:text-acs-blue">
          Lightning Pages
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">{data.label || data.api_name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">{data.label || data.api_name}</h1>
        <p className="text-sm text-gray-500 font-mono mt-1">{data.api_name}</p>

        {data.metadata.description && (
          <p className="mt-4 text-gray-600">{data.metadata.description}</p>
        )}

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs font-medium text-gray-500 uppercase">Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{data.metadata.type || 'Lightning Page'}</dd>
          </div>
          {data.metadata.sobjectType && (
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Related Object</dt>
              <dd className="mt-1 text-sm">
                {data.relatedObject ? (
                  <Link href={`/objects/${data.metadata.sobjectType}`} className="text-acs-blue hover:underline">
                    {data.relatedObject.label || data.metadata.sobjectType}
                  </Link>
                ) : (
                  <span className="text-gray-900">{data.metadata.sobjectType}</span>
                )}
              </dd>
            </div>
          )}
          {data.metadata.template && (
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Template</dt>
              <dd className="mt-1 text-sm text-gray-900">{data.metadata.template}</dd>
            </div>
          )}
          {data.file_path && (
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">File Path</dt>
              <dd className="mt-1 text-sm text-gray-500 font-mono truncate" title={data.file_path}>
                {data.file_path.split('/').pop()}
              </dd>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
