'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface PlanItem {
  id: number;
  apiName: string;
  label: string | null;
  type: string;
  action: 'create' | 'update' | 'delete' | 'review';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  notes?: string;
  dependentCount?: number;
}

interface PlanChecklist {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

interface Plan {
  id: string;
  name: string;
  type: 'implementation' | 'simplification' | 'fix';
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  items: PlanItem[];
  checklist: PlanChecklist[];
  metadata: {
    targetOrg?: string;
    targetDate?: string;
    owner?: string;
    riskLevel?: 'low' | 'medium' | 'high';
  };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-500',
  };

  const typeColors = {
    implementation: 'bg-purple-100 text-purple-700',
    simplification: 'bg-orange-100 text-orange-700',
    fix: 'bg-blue-100 text-blue-700',
  };

  const typeIcons = {
    implementation: '🚀',
    simplification: '🧹',
    fix: '🔧',
  };

  const filteredPlans = filter === 'all'
    ? plans
    : plans.filter(p => p.type === filter);

  const getChecklistProgress = (plan: Plan) => {
    if (!plan.checklist || plan.checklist.length === 0) return 0;
    const completed = plan.checklist.filter(c => c.completed).length;
    return Math.round((completed / plan.checklist.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/" className="hover:text-acs-blue">Home</Link>
            <span>/</span>
            <span>Plans</span>
          </div>
          <h1 className="text-2xl font-bold text-acs-navy" style={{ fontFamily: 'Georgia, serif' }}>
            Change Plans
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan and track metadata changes for your Salesforce org
          </p>
        </div>
      </div>

      {/* Quick Actions - Plan Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="Implementation Plan"
          description="New deployment or migration project with full metadata tracking"
          icon="🚀"
          href="/plans/new?type=implementation"
          color="purple"
        />
        <QuickActionCard
          title="Data Simplification"
          description="Clean up unused fields, objects, and reduce org complexity"
          icon="🧹"
          href="/plans/new?type=simplification"
          color="orange"
        />
        <QuickActionCard
          title="Fix / Enhancement"
          description="Bug fix, small enhancement, or managed package addition"
          icon="🔧"
          href="/plans/new?type=fix"
          color="blue"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'implementation', 'simplification', 'fix'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-acs-blue text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {type === 'all' ? 'All Plans' :
             type === 'implementation' ? '🚀 Implementation' :
             type === 'simplification' ? '🧹 Simplification' : '🔧 Fix'}
          </button>
        ))}
      </div>

      {/* Plans List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Plans</h2>
          <span className="text-sm text-gray-500">{filteredPlans.length} plans</span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Loading plans...</p>
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredPlans.map((plan) => (
              <Link
                key={plan.id}
                href={`/plans/${plan.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{typeIcons[plan.type]}</span>
                      <h3 className="font-medium text-gray-900">{plan.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[plan.status]}`}>
                        {plan.status}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeColors[plan.type]}`}>
                        {plan.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 ml-8">{plan.description}</p>
                    <div className="flex items-center gap-4 mt-3 ml-8 text-xs text-gray-500">
                      <span>{plan.items?.length || 0} items</span>
                      <span>{plan.checklist?.length || 0} checklist items</span>
                      {plan.metadata?.targetDate && (
                        <span>Target: {plan.metadata.targetDate}</span>
                      )}
                      <span>Updated {new Date(plan.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {plan.metadata?.riskLevel && (
                      <span className={`px-2 py-1 text-xs rounded ${
                        plan.metadata.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                        plan.metadata.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {plan.metadata.riskLevel} risk
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-acs-blue rounded-full transition-all"
                          style={{ width: `${getChecklistProgress(plan)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{getChecklistProgress(plan)}%</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="text-lg font-medium">No plans yet</p>
            <p className="text-sm mt-1">Create a plan to start tracking metadata changes</p>
            <Link
              href="/plans/new?type=implementation"
              className="mt-4 inline-block text-acs-blue hover:underline"
            >
              Create your first plan
            </Link>
          </div>
        )}
      </div>

      {/* Workflow Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900">How Plans Work</h3>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <WorkflowStep number={1} title="Draft" description="Create and configure your plan" />
          <WorkflowStep number={2} title="Active" description="Execute changes with checklist guidance" />
          <WorkflowStep number={3} title="Completed" description="All checklist items verified" />
          <WorkflowStep number={4} title="Archived" description="Plan stored for reference" />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ title, description, icon, href, color }: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: 'purple' | 'orange' | 'blue';
}) {
  const borderColors = {
    purple: 'border-purple-500 hover:border-purple-600',
    orange: 'border-orange-500 hover:border-orange-600',
    blue: 'border-acs-blue hover:border-acs-navy',
  };

  return (
    <Link
      href={href}
      className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-all border-l-4 ${borderColors[color]}`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-acs-navy">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </Link>
  );
}

function WorkflowStep({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-8 h-8 bg-acs-blue text-white rounded-full flex items-center justify-center mx-auto text-sm font-medium">
        {number}
      </div>
      <h4 className="font-medium text-blue-900 mt-2">{title}</h4>
      <p className="text-xs text-blue-700 mt-1">{description}</p>
    </div>
  );
}
