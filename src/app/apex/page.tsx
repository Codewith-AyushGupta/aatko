'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ApexClass {
  id: number;
  api_name: string;
  label: string;
  file_path: string;
  metadata: {
    apiVersion?: string;
    status?: string;
  };
}

export default function ApexClassesPage() {
  const [classes, setClasses] = useState<ApexClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Classes' | 'Tests'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/apex');
        const data = await res.json();
        setClasses(data.classes || []);
      } catch (error) {
        console.error('Failed to load apex classes:', error);
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  // Identify test classes by naming convention
  const isTestClass = (name: string) => name.toLowerCase().includes('test');

  // Filter classes
  const filteredClasses = classes.filter(cls => {
    const status = cls.metadata.status || 'Active';
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Active' && status === 'Active') ||
      (statusFilter === 'Inactive' && status !== 'Active');

    const matchesType = typeFilter === 'All' ||
      (typeFilter === 'Tests' && isTestClass(cls.api_name)) ||
      (typeFilter === 'Classes' && !isTestClass(cls.api_name));

    const matchesSearch = !searchQuery ||
      cls.api_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  // Counts
  const counts = {
    active: classes.filter(c => (c.metadata.status || 'Active') === 'Active').length,
    inactive: classes.filter(c => (c.metadata.status || 'Active') !== 'Active').length,
    tests: classes.filter(c => isTestClass(c.api_name)).length,
    classes: classes.filter(c => !isTestClass(c.api_name)).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apex Classes</h1>
          <p className="text-gray-600">Loading...</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Apex Classes</h1>
        <p className="text-gray-600 mt-1">
          {classes.length} classes ({counts.tests} test classes, {counts.classes} other classes)
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
                  ({status === 'All' ? classes.length :
                    status === 'Active' ? counts.active :
                    counts.inactive})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Type:</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(['All', 'Classes', 'Tests'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  typeFilter === type
                    ? 'bg-acs-blue text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${type !== 'All' ? 'border-l border-gray-300' : ''}`}
              >
                {type}
                <span className="ml-1 text-xs opacity-75">
                  ({type === 'All' ? classes.length :
                    type === 'Tests' ? counts.tests :
                    counts.classes})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-acs-blue focus:border-transparent"
          />
        </div>

        {/* Results count */}
        {(statusFilter !== 'All' || typeFilter !== 'All' || searchQuery) && (
          <span className="text-sm text-gray-500">
            Showing {filteredClasses.length} of {classes.length}
          </span>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No Apex classes found. Run a sync to load metadata.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Version
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No classes match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/apex/${cls.api_name}`}
                        className="text-acs-blue hover:underline font-mono font-medium"
                      >
                        {cls.api_name}
                      </Link>
                      {isTestClass(cls.api_name) && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                          Test
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {cls.metadata.apiVersion || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        (cls.metadata.status || 'Active') === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {cls.metadata.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
