'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ImpactData {
  object: any;
  fields: any[];
  directDependents: any[];
  transitiveDependents: any[];
  retirementSteps: RetirementStep[];
  riskLevel: string;
  totalImpact: number;
}

interface RetirementStep {
  order: number;
  category: string;
  type: string;
  name: string;
  action: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  link?: string;
}

export default function ObjectImpactPage() {
  const params = useParams();
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const objectName = params.name as string;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (data) {
      const allCategories = new Set(data.retirementSteps.map(s => s.category));
      setExpandedCategories(allCategories);
    }
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const toggleCheck = (itemKey: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemKey)) {
        next.delete(itemKey);
      } else {
        next.add(itemKey);
      }
      return next;
    });
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/objects/${encodeURIComponent(objectName)}/impact`);
        if (res.ok) {
          const impactData = await res.json();
          setData(impactData);
        }
      } catch (err) {
        console.error('Failed to load impact data:', err);
      }
      setLoading(false);
    }
    loadData();
  }, [objectName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Analyzing impact...</div>
      </div>
    );
  }

  if (!data || !data.object) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Object not found</div>
      </div>
    );
  }

  const { object, fields, retirementSteps, riskLevel, totalImpact } = data;
  const metadata = object.metadata_json ? JSON.parse(object.metadata_json) : {};

  const riskColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  const categoryIcons: Record<string, string> = {
    'Apex': '{ }',
    'Flows': '⚡',
    'Layouts': '📋',
    'Fields': '📝',
    'Validation Rules': '✓',
    'Reports': '📊',
    'Permissions': '🔒',
  };

  // Group steps by category
  const stepsByCategory = retirementSteps.reduce((acc, step) => {
    if (!acc[step.category]) acc[step.category] = [];
    acc[step.category].push(step);
    return acc;
  }, {} as Record<string, RetirementStep[]>);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/objects" className="hover:text-sf-blue">Objects</Link>
            <span>/</span>
            <Link href={`/objects/${objectName}`} className="hover:text-sf-blue">
              {metadata.label || object.api_name}
            </Link>
            <span>/</span>
            <span className="text-gray-900">Retirement Checklist</span>
          </div>
          <h1 className="text-2xl font-bold">
            Retirement Impact Analysis: {metadata.label || object.api_name}
          </h1>
        </div>
        <Link
          href={`/objects/${objectName}`}
          className="text-sm text-gray-600 hover:text-sf-blue"
        >
          ← Back to Object
        </Link>
      </div>

      {/* Risk Summary Card */}
      <div className={`rounded-lg border-2 p-6 ${riskColors[riskLevel as keyof typeof riskColors] || riskColors.medium}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Overall Retirement Risk: {riskLevel.toUpperCase()}</h2>
            <p className="mt-1 text-sm opacity-90">
              {totalImpact} total items will be impacted if this object is removed
            </p>
          </div>
          <div className="text-4xl font-bold opacity-75">
            {totalImpact}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Fields"
          count={fields.length}
          description="Custom fields to remove"
        />
        <StatCard
          label="Automations"
          count={retirementSteps.filter(s => s.category === 'Flows').length}
          description="Flows referencing this object"
        />
        <StatCard
          label="Apex"
          count={retirementSteps.filter(s => s.category === 'Apex').length}
          description="Apex classes to update"
        />
        <StatCard
          label="Other"
          count={retirementSteps.filter(s => !['Fields', 'Flows', 'Apex'].includes(s.category)).length}
          description="Layouts, reports, etc."
        />
      </div>

      {/* Retirement Checklist */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Retirement Checklist</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete these steps in order to safely retire this object
              <span className="ml-2 text-sf-blue">
                ({checkedItems.size}/{retirementSteps.length} completed)
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-gray-600 hover:text-sf-blue px-2 py-1 rounded hover:bg-gray-100"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs text-gray-600 hover:text-sf-blue px-2 py-1 rounded hover:bg-gray-100"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {Object.entries(stepsByCategory).map(([category, steps]) => {
            const isExpanded = expandedCategories.has(category);
            const completedInCategory = steps.filter(s => checkedItems.has(`${category}-${s.name}`)).length;

            return (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xl">{categoryIcons[category] || '📦'}</span>
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {completedInCategory}/{steps.length}
                    </span>
                  </div>
                  {completedInCategory === steps.length && steps.length > 0 && (
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Complete
                    </span>
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-4 space-y-3 ml-7">
                    {steps.map((step, i) => {
                      const itemKey = `${category}-${step.name}`;
                      const isChecked = checkedItems.has(itemKey);

                      return (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                            isChecked ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheck(itemKey)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-sf-blue focus:ring-sf-blue"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isChecked ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {step.name}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                step.risk === 'critical' ? 'bg-red-100 text-red-700' :
                                step.risk === 'high' ? 'bg-orange-100 text-orange-700' :
                                step.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {step.risk}
                              </span>
                              <span className="text-xs text-gray-500">{step.type}</span>
                            </div>
                            <p className={`text-sm mt-1 ${isChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                              {step.action}
                            </p>
                            {step.description && (
                              <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                            )}
                            {step.link && (
                              <Link
                                href={step.link}
                                className="text-xs text-sf-blue hover:underline mt-1 inline-block"
                              >
                                View details →
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-medium text-amber-800">Before Retiring</h4>
            <ul className="mt-2 text-sm text-amber-700 space-y-1">
              <li>• Verify all data has been migrated or archived if needed</li>
              <li>• Confirm with stakeholders that this object is no longer needed</li>
              <li>• Test in a sandbox before making changes in production</li>
              <li>• Document the retirement for compliance purposes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Print Checklist
        </button>
        <button
          className="px-4 py-2 text-sm text-white bg-sf-blue rounded-lg hover:bg-sf-navy"
        >
          Export to Excel
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, count, description }: { label: string; count: number; description: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-2xl font-bold text-gray-900">{count}</div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-xs text-gray-500 mt-1">{description}</div>
    </div>
  );
}
