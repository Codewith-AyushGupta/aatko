'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CustomMetadataType {
  id: number;
  api_name: string;
  label: string;
  field_count: number;
  metadata: {
    description?: string;
    deploymentStatus?: string;
  };
  created_date?: string;
  created_by?: string;
  last_modified_date?: string;
  last_modified_by?: string;
}

// Format date for display
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CustomMetadataPage() {
  const [metadataTypes, setMetadataTypes] = useState<CustomMetadataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadMetadataTypes() {
      try {
        const res = await fetch('/api/objects');
        const data = await res.json();

        // Filter to only __mdt objects
        const mdtObjects = data.objects
          .filter((obj: any) => obj.api_name.endsWith('__mdt'))
          .map((obj: any) => ({
            id: obj.id,
            api_name: obj.api_name,
            label: obj.label || obj.api_name.replace(/__mdt$/, '').replace(/_/g, ' '),
            field_count: obj.field_count || 0,
            metadata: obj.metadata || {},
            created_date: obj.created_date,
            created_by: obj.created_by,
            last_modified_date: obj.last_modified_date,
            last_modified_by: obj.last_modified_by,
          }));

        setMetadataTypes(mdtObjects);
      } catch (error) {
        console.error('Failed to load custom metadata types:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMetadataTypes();
  }, []);

  // Filter based on search
  const filteredTypes = metadataTypes.filter(mdt => {
    const matchesSearch = !searchQuery ||
      mdt.api_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mdt.label?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Generate description for metadata type
  const generateDescription = (apiName: string, label: string): string => {
    const name = label || apiName.replace(/__mdt$/, '').replace(/_/g, ' ');
    return `Configuration settings for ${name.toLowerCase()}.`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Metadata Types</h1>
          <p className="text-gray-600">Loading metadata types...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Metadata Types</h1>
          <p className="text-gray-600">
            {metadataTypes.length} custom metadata types for org configuration
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">⚙️</span>
          <div>
            <h3 className="font-medium text-amber-800">What are Custom Metadata Types?</h3>
            <p className="text-sm text-amber-700 mt-1">
              Custom Metadata Types store application configuration that can be deployed across environments.
              Unlike custom objects, their records are metadata (not data) and are deployable via change sets or packages.
              They're ideal for storing settings, mappings, and configuration that should be consistent across environments.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search metadata types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-acs-blue focus:border-transparent"
          />
        </div>
        {searchQuery && (
          <span className="text-sm text-gray-500">
            Showing {filteredTypes.length} of {metadataTypes.length}
          </span>
        )}
      </div>

      {/* Metadata Types Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th style={{width: '18%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metadata Type
              </th>
              <th style={{width: '7%'}} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fields
              </th>
              <th style={{width: '10%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th style={{width: '13%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th style={{width: '10%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modified
              </th>
              <th style={{width: '13%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modified By
              </th>
              <th style={{width: '29%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purpose
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTypes.map((mdt) => {
              const description = mdt.metadata.description || generateDescription(mdt.api_name, mdt.label);

              return (
                <tr key={mdt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/objects/${mdt.api_name}`}
                      className="text-acs-blue hover:underline font-medium"
                    >
                      {mdt.label}
                    </Link>
                    <div className="text-xs text-gray-400 font-mono truncate">{mdt.api_name}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 tabular-nums">
                    {mdt.field_count || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(mdt.created_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate">
                    {mdt.created_by || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(mdt.last_modified_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate">
                    {mdt.last_modified_by || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate">
                    <span className={mdt.metadata.description ? '' : 'italic text-gray-400'} title={description}>
                      {description}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTypes.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {metadataTypes.length === 0
              ? 'No custom metadata types found. Run a sync to load metadata.'
              : 'No metadata types match your search.'}
          </div>
        )}
      </div>

      {/* Usage Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Common Uses for Custom Metadata Types</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Field Mappings</strong> - Map fields between systems or objects</li>
          <li>• <strong>API Settings</strong> - Store API keys, endpoints, and configuration</li>
          <li>• <strong>Feature Flags</strong> - Enable/disable features per environment</li>
          <li>• <strong>Trigger Controls</strong> - Enable/disable triggers without code changes</li>
          <li>• <strong>Value Mappings</strong> - Map picklist values between integrations</li>
        </ul>
      </div>
    </div>
  );
}
