'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TestResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'warn' | 'running' | 'pending';
  message: string;
  count?: number;
  details?: string[];
}

interface MetadataCounts {
  [key: string]: number;
}

interface DataCompleteness {
  overall: {
    score: number;
    status: 'good' | 'warning' | 'critical';
    message: string;
  };
  metrics: Array<{
    name: string;
    total: number;
    complete: number;
    percentage: number;
    status: 'good' | 'warning' | 'critical';
  }>;
  recommendations: string[];
}

export default function HealthCheckPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [metadataCounts, setMetadataCounts] = useState<MetadataCounts>({});
  const [completeness, setCompleteness] = useState<DataCompleteness | null>(null);

  // Load data completeness on mount
  useEffect(() => {
    async function loadCompleteness() {
      try {
        const res = await fetch('/api/health-check');
        const data = await res.json();
        setCompleteness(data);
      } catch (error) {
        console.error('Failed to load completeness:', error);
      }
    }
    loadCompleteness();
  }, []);

  const updateResult = (name: string, update: Partial<TestResult>) => {
    setResults(prev => prev.map(r => r.name === name ? { ...r, ...update } : r));
  };

  const runTests = async () => {
    setRunning(true);

    // Initialize all tests
    const initialTests: TestResult[] = [
      // Metadata completeness tests
      { name: 'Objects exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'Fields exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'Flows exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'Apex Classes exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'Apex Triggers exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'LWCs exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'Layouts exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'Lightning Pages exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'Permission Sets exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'Profiles exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'Record Types exist', category: 'Metadata', status: 'pending', message: '' },
      { name: 'Validation Rules exist', category: 'Metadata', status: 'pending', message: '' },
      // Security tests
      { name: 'High-privilege Profiles', category: 'Security', status: 'pending', message: '' },
      { name: 'High-privilege Permission Sets', category: 'Security', status: 'pending', message: '' },
      { name: 'Flows running as System', category: 'Security', status: 'pending', message: '' },
      { name: 'Apex without sharing', category: 'Security', status: 'pending', message: '' },
      { name: 'Public sharing objects', category: 'Security', status: 'pending', message: '' },
      // Analytics tests
      { name: 'Record counts populated', category: 'Analytics', status: 'pending', message: '' },
      // Route tests
      { name: 'Objects API', category: 'Routes', status: 'pending', message: '' },
      { name: 'Flows API', category: 'Routes', status: 'pending', message: '' },
      { name: 'Apex API', category: 'Routes', status: 'pending', message: '' },
      { name: 'Search API', category: 'Routes', status: 'pending', message: '' },
      // Relationship tests
      { name: 'Edges exist', category: 'Relationships', status: 'pending', message: '' },
      { name: 'Object-Field relationships', category: 'Relationships', status: 'pending', message: '' },
    ];

    setResults(initialTests);

    // Run metadata tests
    try {
      const statsRes = await fetch('/api/stats');
      const stats = await statsRes.json();

      setMetadataCounts(stats);

      // Update metadata tests
      const metadataTests = [
        { name: 'Objects exist', field: 'objects', min: 1 },
        { name: 'Fields exist', field: 'fields', min: 1 },
        { name: 'Flows exist', field: 'flows', min: 0 },
        { name: 'Apex Classes exist', field: 'apexClasses', min: 0 },
        { name: 'Apex Triggers exist', field: 'apexTriggers', min: 0 },
        { name: 'LWCs exist', field: 'lwc', min: 0 },
        { name: 'Layouts exist', field: 'layouts', min: 0 },
        { name: 'Lightning Pages exist', field: 'flexiPages', min: 0 },
        { name: 'Permission Sets exist', field: 'permissionSets', min: 0 },
        { name: 'Profiles exist', field: 'profiles', min: 0 },
        { name: 'Record Types exist', field: 'recordTypes', min: 0 },
        { name: 'Validation Rules exist', field: 'validationRules', min: 0 },
      ];

      for (const test of metadataTests) {
        const count = stats[test.field] || 0;
        updateResult(test.name, {
          status: count >= test.min ? (count > 0 ? 'pass' : 'warn') : 'fail',
          message: `${count} found`,
          count,
        });
      }

      // Check record counts
      const objectsRes = await fetch('/api/objects');
      const objectsData = await objectsRes.json();
      const objectsWithCounts = objectsData.objects?.filter((o: any) => o.record_count != null && o.record_count > 0).length || 0;
      updateResult('Record counts populated', {
        status: objectsWithCounts > 0 ? 'pass' : 'warn',
        message: `${objectsWithCounts} of ${objectsData.objects?.length || 0} objects have record counts`,
        count: objectsWithCounts,
      });

    } catch (error: any) {
      console.error('Stats error:', error);
    }

    // Run route tests
    const routeTests = [
      { name: 'Objects API', url: '/api/objects' },
      { name: 'Flows API', url: '/api/flows' },
      { name: 'Apex API', url: '/api/apex' },
      { name: 'Search API', url: '/api/search?q=account' },
    ];

    for (const test of routeTests) {
      try {
        updateResult(test.name, { status: 'running', message: 'Testing...' });
        const res = await fetch(test.url);
        if (res.ok) {
          updateResult(test.name, { status: 'pass', message: `HTTP ${res.status}` });
        } else {
          updateResult(test.name, { status: 'fail', message: `HTTP ${res.status}` });
        }
      } catch (error: any) {
        updateResult(test.name, { status: 'fail', message: error.message });
      }
    }

    // Run relationship tests
    try {
      const res = await fetch('/api/health/relationships');
      const data = await res.json();

      updateResult('Edges exist', {
        status: data.totalEdges > 0 ? 'pass' : 'warn',
        message: `${data.totalEdges} edges found`,
        count: data.totalEdges,
      });

      updateResult('Object-Field relationships', {
        status: data.fieldsWithParent > 0 ? 'pass' : 'warn',
        message: `${data.fieldsWithParent} fields linked to objects`,
        count: data.fieldsWithParent,
      });
    } catch (error: any) {
      updateResult('Edges exist', { status: 'fail', message: error.message });
      updateResult('Object-Field relationships', { status: 'fail', message: error.message });
    }

    // Run security tests
    try {
      const res = await fetch('/api/health/security');
      const security = await res.json();

      // High-privilege profiles (warn if any exist, as they should be reviewed)
      updateResult('High-privilege Profiles', {
        status: security.profilesWithModifyAll === 0 ? 'pass' : 'warn',
        message: security.profilesWithModifyAll === 0
          ? 'No profiles with ModifyAll/ViewAll'
          : `${security.profilesWithModifyAll} profiles with elevated access`,
        count: security.profilesWithModifyAll,
        details: security.details?.highPrivilegeProfiles,
      });

      // High-privilege permission sets
      updateResult('High-privilege Permission Sets', {
        status: security.permissionSetsWithModifyAll === 0 ? 'pass' : 'warn',
        message: security.permissionSetsWithModifyAll === 0
          ? 'No permission sets with ModifyAll/ViewAll'
          : `${security.permissionSetsWithModifyAll} permission sets with elevated access`,
        count: security.permissionSetsWithModifyAll,
        details: security.details?.highPrivilegePermSets,
      });

      // Flows running as system
      updateResult('Flows running as System', {
        status: security.flowsRunAsSystem === 0 ? 'pass' : 'warn',
        message: security.flowsRunAsSystem === 0
          ? 'No flows running in system context'
          : `${security.flowsRunAsSystem} flows run as system (review recommended)`,
        count: security.flowsRunAsSystem,
        details: security.details?.systemFlows,
      });

      // Apex without sharing
      updateResult('Apex without sharing', {
        status: security.apexWithoutSharing === 0 ? 'pass' : 'warn',
        message: security.apexWithoutSharing === 0
          ? 'No Apex classes using "without sharing"'
          : `${security.apexWithoutSharing} classes without sharing (review recommended)`,
        count: security.apexWithoutSharing,
        details: security.details?.unsecureApex,
      });

      // Public sharing objects
      updateResult('Public sharing objects', {
        status: security.publicObjects === 0 ? 'pass' : 'warn',
        message: security.publicObjects === 0
          ? 'No objects with public sharing'
          : `${security.publicObjects} objects have public read/write access`,
        count: security.publicObjects,
      });
    } catch (error: any) {
      console.error('Security check error:', error);
      updateResult('High-privilege Profiles', { status: 'fail', message: error.message });
      updateResult('High-privilege Permission Sets', { status: 'fail', message: error.message });
      updateResult('Flows running as System', { status: 'fail', message: error.message });
      updateResult('Apex without sharing', { status: 'fail', message: error.message });
      updateResult('Public sharing objects', { status: 'fail', message: error.message });
    }

    setRunning(false);
  };

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warnCount = results.filter(r => r.status === 'warn').length;

  const categories = Array.from(new Set(results.map(r => r.category)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Check</h1>
          <p className="text-gray-600">Verify metadata completeness and system health</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/technical-debt"
            className="px-4 py-2 rounded-lg border border-acs-blue text-acs-blue hover:bg-blue-50 transition-colors"
          >
            Technical Debt Analysis
          </Link>
          <button
            onClick={runTests}
            disabled={running}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              running ? 'bg-gray-400 cursor-not-allowed' : 'bg-acs-blue hover:bg-blue-700'
            }`}
          >
            {running ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Running Tests...
              </span>
            ) : (
              'Run Tests'
            )}
          </button>
        </div>
      </div>

      {/* Data Completeness Score */}
      {completeness && (
        <div className={`rounded-lg p-6 ${
          completeness.overall.status === 'good' ? 'bg-green-50 border border-green-200' :
          completeness.overall.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Data Completeness</h2>
              <p className={`text-sm ${
                completeness.overall.status === 'good' ? 'text-green-700' :
                completeness.overall.status === 'warning' ? 'text-yellow-700' :
                'text-red-700'
              }`}>
                {completeness.overall.message}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${
                completeness.overall.status === 'good' ? 'text-green-600' :
                completeness.overall.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {completeness.overall.score}%
              </div>
              <div className="text-sm text-gray-500">Overall Score</div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {completeness.metrics.map((metric) => (
              <div key={metric.name} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{metric.name}</span>
                  <span className={`text-xs font-medium ${
                    metric.status === 'good' ? 'text-green-600' :
                    metric.status === 'warning' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {metric.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metric.status === 'good' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {metric.complete.toLocaleString()} / {metric.total.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {completeness.recommendations.length > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {completeness.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-700">{passCount}</div>
              <div className="text-sm text-green-600">Passed</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-700">{warnCount}</div>
              <div className="text-sm text-yellow-600">Warnings</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-700">{failCount}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>

          {/* Results by category */}
          {categories.map(category => (
            <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b font-medium text-gray-700">
                {category}
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200">
                  {results.filter(r => r.category === category).map(result => (
                    <tr key={result.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 w-8">
                        {result.status === 'pass' && (
                          <span className="text-green-500">✓</span>
                        )}
                        {result.status === 'fail' && (
                          <span className="text-red-500">✗</span>
                        )}
                        {result.status === 'warn' && (
                          <span className="text-yellow-500">⚠</span>
                        )}
                        {result.status === 'running' && (
                          <span className="animate-spin inline-block h-4 w-4 border-2 border-acs-blue border-t-transparent rounded-full" />
                        )}
                        {result.status === 'pending' && (
                          <span className="text-gray-300">○</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {result.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {result.message}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500 tabular-nums">
                        {result.count !== undefined && result.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}

      {results.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Click "Run Tests" to check system health and metadata completeness.
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">What This Tests</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Metadata:</strong> Verifies all expected metadata types are indexed</li>
          <li>• <strong>Security:</strong> Reviews profiles, permission sets, and sharing settings for elevated access</li>
          <li>• <strong>Analytics:</strong> Checks that record counts are populated</li>
          <li>• <strong>Routes:</strong> Tests that all API endpoints respond correctly</li>
          <li>• <strong>Relationships:</strong> Validates edges and parent-child links exist</li>
        </ul>
      </div>
    </div>
  );
}
