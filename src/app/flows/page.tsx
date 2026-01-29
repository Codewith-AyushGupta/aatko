'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Flow {
  id: number;
  api_name: string;
  label: string;
  metadata: {
    description?: string;
    processType?: string;
    triggerType?: string;
    status?: string;
    apiVersion?: string;
  };
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadFlows() {
      try {
        const res = await fetch('/api/flows');
        const data = await res.json();
        setFlows(data.flows || []);
      } catch (error) {
        console.error('Failed to load flows:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFlows();
  }, []);

  // Filter flows
  const filteredFlows = flows.filter(flow => {
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Active' && flow.metadata.status === 'Active') ||
      (statusFilter === 'Inactive' && flow.metadata.status !== 'Active');

    const matchesSearch = !searchQuery ||
      flow.api_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.label?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Count by status
  const counts = {
    active: flows.filter(f => f.metadata.status === 'Active').length,
    inactive: flows.filter(f => f.metadata.status !== 'Active').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flows</h1>
          <p className="text-gray-600">Loading flows...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Flows</h1>
        <p className="text-gray-600">
          {flows.length} flows ({counts.active} active, {counts.inactive} inactive)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(['All', 'Active', 'Inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  statusFilter === status
                    ? 'bg-acs-blue text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${status !== 'All' ? 'border-l border-gray-300' : ''}`}
              >
                {status}
                <span className="ml-1 text-xs opacity-75">
                  ({status === 'All' ? flows.length :
                    status === 'Active' ? counts.active :
                    counts.inactive})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search flows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-acs-blue focus:border-transparent"
          />
        </div>

        {/* Results count */}
        {(statusFilter !== 'All' || searchQuery) && (
          <span className="text-sm text-gray-500">
            Showing {filteredFlows.length} of {flows.length}
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                API Version
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFlows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {flows.length === 0
                    ? 'No flows found. Run a sync to load metadata.'
                    : 'No flows match your filter criteria.'}
                </td>
              </tr>
            ) : (
              filteredFlows.map((flow) => (
                <tr key={flow.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/flows/${flow.api_name}`}
                      className="text-acs-blue hover:underline font-medium"
                    >
                      {flow.label || flow.api_name}
                    </Link>
                    <div className="text-xs text-gray-400 font-mono">{flow.api_name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {flow.metadata.processType || '-'}
                    {flow.metadata.triggerType && (
                      <div className="text-xs text-gray-400">{flow.metadata.triggerType}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      flow.metadata.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {flow.metadata.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {flow.metadata.apiVersion || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {flow.metadata.description || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
