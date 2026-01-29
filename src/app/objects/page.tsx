'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SObject {
  id: number;
  api_name: string;
  label: string;
  field_count: number;
  record_count: number | null;
  population_rate: number | null;
  metadata: {
    description?: string;
    deploymentStatus?: string;
    sharingModel?: string;
  };
  objectType: 'Custom' | 'Standard' | 'Managed';
  created_date?: string;
  created_by?: string;
  last_modified_date?: string;
  last_modified_by?: string;
}

// Format date for display
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// Classify object type based on API name
// - Managed packages have namespace prefix: namespace__ObjectName__c (has __ twice)
// - Custom objects end with __c but have no namespace: ObjectName__c or AA_ObjectName__c
// - Standard objects have no __
function classifyObjectType(apiName: string): 'Custom' | 'Standard' | 'Managed' {
  // Count occurrences of double underscore
  const matches = apiName.match(/__/g);
  const doubleUnderscoreCount = matches ? matches.length : 0;

  // Managed packages have at least 2 double underscores (namespace__Object__c)
  if (doubleUnderscoreCount >= 2) {
    return 'Managed';
  }

  // Custom objects end with __c (single double underscore for suffix)
  if (apiName.endsWith('__c')) {
    return 'Custom';
  }

  // Everything else is standard
  return 'Standard';
}

// Generate a description based on the object name
function generateDescription(apiName: string, label: string): string {
  // Extract meaningful name from API name
  let name = apiName
    .replace(/__c$/, '')  // Remove custom suffix
    .replace(/^[A-Z]+__/, '')  // Remove managed package namespace prefix
    .replace(/([A-Z])/g, ' $1')  // Add space before capitals
    .replace(/_/g, ' ')  // Replace underscores with spaces
    .trim();

  // Use label if available and different from API name
  if (label && label !== apiName) {
    name = label;
  }

  const objType = classifyObjectType(apiName);

  if (objType === 'Standard') {
    return `Standard Salesforce object for managing ${name.toLowerCase()} data.`;
  } else if (objType === 'Managed') {
    const namespace = apiName.split('__')[0];
    return `Managed package object from ${namespace} for ${name.toLowerCase()} functionality.`;
  } else {
    return `Custom object for storing and managing ${name.toLowerCase()} records.`;
  }
}

export default function ObjectsPage() {
  const [objects, setObjects] = useState<SObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'All' | 'Custom' | 'Standard' | 'Managed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchingCounts, setFetchingCounts] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadObjects() {
      try {
        const res = await fetch('/api/objects');
        const data = await res.json();

        // Process objects with proper type classification
        // Exclude Custom Metadata Types (__mdt) - they have their own page
        const processed = data.objects
          .filter((obj: any) => !obj.api_name.endsWith('__mdt'))
          .map((obj: any) => ({
            ...obj,
            objectType: classifyObjectType(obj.api_name),
          }));

        setObjects(processed);
      } catch (error) {
        console.error('Failed to load objects:', error);
      } finally {
        setLoading(false);
      }
    }
    loadObjects();
  }, []);

  // Filter objects based on type and search
  const filteredObjects = objects.filter(obj => {
    const matchesType = filterType === 'All' || obj.objectType === filterType;
    const matchesSearch = !searchQuery ||
      obj.api_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      obj.label?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Count by type
  const counts = {
    custom: objects.filter(o => o.objectType === 'Custom').length,
    standard: objects.filter(o => o.objectType === 'Standard').length,
    managed: objects.filter(o => o.objectType === 'Managed').length,
  };

  // Count objects with record counts
  const objectsWithCounts = objects.filter(o => o.record_count != null && o.record_count > 0).length;

  const handleFetchRecordCounts = async () => {
    setFetchingCounts(true);
    setFetchStatus('Fetching record counts from Salesforce...');

    try {
      const res = await fetch('/api/fetch-record-counts', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setFetchStatus(`Updated ${data.updated} objects. Refreshing...`);
        // Reload objects to get new counts
        const objRes = await fetch('/api/objects');
        const objData = await objRes.json();
        const processed = objData.objects.map((obj: any) => ({
          ...obj,
          objectType: classifyObjectType(obj.api_name),
        }));
        setObjects(processed);
        setFetchStatus(`Done! Updated record counts for ${data.updated} objects.`);
      } else {
        setFetchStatus(`Error: ${data.error}`);
      }
    } catch (error: any) {
      setFetchStatus(`Error: ${error.message}`);
    } finally {
      setFetchingCounts(false);
      // Clear status after 5 seconds
      setTimeout(() => setFetchStatus(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Objects</h1>
          <p className="text-gray-600">Loading objects...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Objects</h1>
          <p className="text-gray-600">
            {objects.length} objects ({counts.custom} custom, {counts.standard} standard, {counts.managed} managed)
            {objectsWithCounts > 0 && (
              <span className="ml-2 text-gray-400">| {objectsWithCounts} with record counts</span>
            )}
          </p>
        </div>
        <button
          onClick={handleFetchRecordCounts}
          disabled={fetchingCounts}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            fetchingCounts
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-acs-blue text-white hover:bg-blue-700'
          }`}
        >
          {fetchingCounts ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Fetching...
            </span>
          ) : (
            'Fetch Record Counts'
          )}
        </button>
      </div>

      {/* Status message */}
      {fetchStatus && (
        <div className={`px-4 py-2 rounded-lg text-sm ${
          fetchStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {fetchStatus}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter by type:</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(['All', 'Custom', 'Standard', 'Managed'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  filterType === type
                    ? 'bg-acs-blue text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${type !== 'All' ? 'border-l border-gray-300' : ''}`}
              >
                {type}
                <span className="ml-1 text-xs opacity-75">
                  ({type === 'All' ? objects.length :
                    type === 'Custom' ? counts.custom :
                    type === 'Standard' ? counts.standard :
                    counts.managed})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search objects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-acs-blue focus:border-transparent"
          />
        </div>

        {/* Results count */}
        {(filterType !== 'All' || searchQuery) && (
          <span className="text-sm text-gray-500">
            Showing {filteredObjects.length} of {objects.length}
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th style={{width: '20%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Object
              </th>
              <th style={{width: '8%'}} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th style={{width: '7%'}} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fields
              </th>
              <th style={{width: '9%'}} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Records
              </th>
              <th style={{width: '11%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th style={{width: '15%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th style={{width: '11%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modified
              </th>
              <th style={{width: '19%'}} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modified By
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredObjects.map((obj) => {
              return (
                <tr key={obj.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/objects/${obj.api_name}`}
                      className="text-acs-blue hover:underline font-medium"
                    >
                      {obj.label || obj.api_name}
                    </Link>
                    <div className="text-xs text-gray-400 font-mono truncate">{obj.api_name}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                      obj.objectType === 'Custom' ? 'bg-blue-100 text-blue-700' :
                      obj.objectType === 'Managed' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {obj.objectType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 tabular-nums">
                    {obj.field_count || 0}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 tabular-nums">
                    {obj.record_count != null ? obj.record_count.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(obj.created_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate">
                    {obj.created_by || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(obj.last_modified_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate">
                    {obj.last_modified_by || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredObjects.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {objects.length === 0
              ? 'No objects found. Run a sync to load metadata.'
              : 'No objects match your filter criteria.'}
          </div>
        )}
      </div>
    </div>
  );
}
