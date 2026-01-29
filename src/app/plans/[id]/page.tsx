'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'items'>('checklist');

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/plans?id=${planId}`);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (updates: Partial<Plan>) => {
    if (!plan) return;
    setSaving(true);
    try {
      const res = await fetch('/api/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id, ...updates }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPlan(updated);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!plan) return;
    const updatedChecklist = plan.checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setPlan({ ...plan, checklist: updatedChecklist });
    updatePlan({ checklist: updatedChecklist });
  };

  const updateItemStatus = (itemId: number, status: PlanItem['status']) => {
    if (!plan) return;
    const updatedItems = plan.items.map(item =>
      item.id === itemId ? { ...item, status } : item
    );
    setPlan({ ...plan, items: updatedItems });
    updatePlan({ items: updatedItems });
  };

  const deletePlan = async () => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await fetch(`/api/plans?id=${planId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/plans');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const exportPlan = () => {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Loading plan...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/plans" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Plan Not Found</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">This plan does not exist or has been deleted.</p>
          <Link href="/plans" className="text-acs-blue hover:underline mt-4 inline-block">
            Back to Plans
          </Link>
        </div>
      </div>
    );
  }

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

  const actionColors = {
    create: 'bg-green-100 text-green-700',
    update: 'bg-yellow-100 text-yellow-700',
    delete: 'bg-red-100 text-red-700',
    review: 'bg-gray-100 text-gray-700',
  };

  const itemStatusColors = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
  };

  // Group checklist by category
  const checklistByCategory = plan.checklist.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PlanChecklist[]>);

  const completedChecklist = plan.checklist.filter(c => c.completed).length;
  const checklistProgress = plan.checklist.length > 0
    ? Math.round((completedChecklist / plan.checklist.length) * 100)
    : 0;

  const completedItems = plan.items.filter(i => i.status === 'completed').length;
  const itemsProgress = plan.items.length > 0
    ? Math.round((completedItems / plan.items.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/plans" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{typeIcons[plan.type]}</span>
              <h1 className="text-2xl font-bold text-acs-navy" style={{ fontFamily: 'Georgia, serif' }}>
                {plan.name}
              </h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[plan.status]}`}>
                {plan.status}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${typeColors[plan.type]}`}>
                {plan.type}
              </span>
              {saving && (
                <span className="text-sm text-gray-400">Saving...</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {plan.status === 'draft' && (
            <button
              onClick={() => updatePlan({ status: 'active' })}
              className="bg-acs-blue text-white px-4 py-2 rounded-lg hover:bg-acs-navy transition-colors"
            >
              Start Plan
            </button>
          )}
          {plan.status === 'active' && checklistProgress === 100 && (
            <button
              onClick={() => updatePlan({ status: 'completed' })}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 uppercase">Owner</div>
          <div className="font-medium text-gray-900 mt-1">{plan.metadata.owner || '-'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 uppercase">Target Org</div>
          <div className="font-medium text-gray-900 mt-1">{plan.metadata.targetOrg || '-'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 uppercase">Target Date</div>
          <div className="font-medium text-gray-900 mt-1">{plan.metadata.targetDate || '-'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 uppercase">Risk Level</div>
          <div className={`font-medium mt-1 ${
            plan.metadata.riskLevel === 'high' ? 'text-red-600' :
            plan.metadata.riskLevel === 'medium' ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {plan.metadata.riskLevel || 'Low'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-xs text-gray-500 uppercase">Items</div>
          <div className="font-medium text-gray-900 mt-1">{plan.items.length}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Checklist Progress</h3>
              <span className="text-sm text-gray-500">{completedChecklist} / {plan.checklist.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-acs-blue h-3 rounded-full transition-all duration-300"
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">{checklistProgress}%</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Items Progress</h3>
              <span className="text-sm text-gray-500">{completedItems} / {plan.items.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${itemsProgress}%` }}
              />
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">{itemsProgress}%</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'checklist'
              ? 'text-acs-blue border-b-2 border-acs-blue'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Checklist ({plan.checklist.length})
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'items'
              ? 'text-acs-blue border-b-2 border-acs-blue'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Items ({plan.items.length})
        </button>
      </div>

      {/* Checklist Tab */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {Object.entries(checklistByCategory).map(([category, items]) => {
            const categoryCompleted = items.filter(i => i.completed).length;
            return (
              <div key={category} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{category}</h3>
                  <span className="text-sm text-gray-500">{categoryCompleted} / {items.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                        item.completed ? 'bg-green-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="w-5 h-5 text-acs-blue rounded"
                      />
                      <span className={`flex-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {item.text}
                      </span>
                      {item.completed && (
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-lg shadow">
          {plan.items.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {plan.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.label || item.apiName}</div>
                    <div className="text-xs text-gray-500">{item.apiName}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.type === 'Object' ? 'bg-blue-100 text-blue-700' :
                    item.type === 'Field' ? 'bg-green-100 text-green-700' :
                    item.type === 'Flow' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${actionColors[item.action]}`}>
                    {item.action}
                  </span>
                  <select
                    value={item.status}
                    onChange={(e) => updateItemStatus(item.id, e.target.value as PlanItem['status'])}
                    className={`text-xs px-2 py-1 rounded border ${itemStatusColors[item.status]}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  {item.dependentCount !== undefined && item.dependentCount > 0 && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                      {item.dependentCount} deps
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              No items in this plan yet.
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportPlan}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export JSON
          </button>
          {plan.status !== 'archived' && (
            <button
              onClick={() => updatePlan({ status: 'archived' })}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archive
            </button>
          )}
          <button
            onClick={deletePlan}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Plan
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="text-sm text-gray-500 flex gap-6">
        <span>Created: {new Date(plan.createdAt).toLocaleDateString()}</span>
        <span>Last updated: {new Date(plan.updatedAt).toLocaleDateString()}</span>
        <span>ID: {plan.id}</span>
      </div>
    </div>
  );
}
