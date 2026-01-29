'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

interface MetadataItem {
  id: number;
  apiName: string;
  label: string | null;
  type: string;
  dependentCount?: number;
}

interface PlanItem {
  id: number;
  apiName: string;
  label: string | null;
  type: string;
  action: 'keep' | 'create' | 'update' | 'delete' | 'review' | 'migrate' | 'consolidate' | 'rebuild';
  status: 'pending';
  notes?: string;
  targetApiName?: string; // For consolidate/migrate: the target object
  dependentCount?: number;
}

interface OrgInfo {
  alias: string;
  username: string;
  instanceUrl: string;
  connectedStatus: string;
  isSandbox?: boolean;
  orgType?: string;
}

function NewPlanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planType = searchParams.get('type') as 'implementation' | 'simplification' | 'fix' | null;

  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [targetOrg, setTargetOrg] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [owner, setOwner] = useState('');
  const [riskLevel, setRiskLevel] = useState<'any' | 'low' | 'medium' | 'high'>('low');
  const [selectedItems, setSelectedItems] = useState<PlanItem[]>([]);
  const [availableItems, setAvailableItems] = useState<MetadataItem[]>([]);
  const [connectedOrgs, setConnectedOrgs] = useState<OrgInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Set default values based on plan type
  useEffect(() => {
    if (planType === 'implementation') {
      setPlanName('Implementation Plan');
      setPlanDescription('New deployment or migration project with full metadata tracking');
      setRiskLevel('medium');
    } else if (planType === 'simplification') {
      setPlanName('Data Simplification Plan');
      setPlanDescription('Consolidate objects, migrate data, rebuild automations, and reduce org complexity');
      setRiskLevel('medium');
    } else if (planType === 'fix') {
      setPlanName('Fix / Enhancement Plan');
      setPlanDescription('Bug fix, small enhancement, or managed package addition');
      setRiskLevel('low');
    }
  }, [planType]);

  // Fetch connected orgs
  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch('/api/settings/orgs');
        if (res.ok) {
          const data = await res.json();
          const orgs = data.orgs || [];
          setConnectedOrgs(orgs);
          // Auto-select first connected org
          if (orgs.length > 0 && !targetOrg) {
            setTargetOrg(orgs[0].alias);
          }
        }
      } catch (error) {
        console.error('Error fetching orgs:', error);
      }
    }
    fetchOrgs();
  }, []);

  // Fetch available metadata items
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const items: MetadataItem[] = [];

        if (planType === 'implementation') {
          // For implementation, show all metadata types
          const [objRes, flowRes, apexRes] = await Promise.all([
            fetch('/api/objects'),
            fetch('/api/flows'),
            fetch('/api/apex'),
          ]);
          const [objData, flowData, apexData] = await Promise.all([
            objRes.json(),
            flowRes.json(),
            apexRes.json(),
          ]);

          (objData.objects || []).forEach((obj: any) => {
            items.push({
              id: obj.id,
              apiName: obj.name || obj.api_name,
              label: obj.label,
              type: 'Object',
              dependentCount: obj.field_count || obj.fieldCount || 0,
            });
          });

          (flowData.flows || []).forEach((flow: any) => {
            items.push({
              id: flow.id,
              apiName: flow.api_name || flow.name,
              label: flow.label,
              type: 'Flow',
            });
          });

          (apexData.classes || []).forEach((cls: any) => {
            items.push({
              id: cls.id,
              apiName: cls.api_name || cls.name,
              label: cls.label || cls.api_name || cls.name,
              type: 'ApexClass',
            });
          });
        } else if (planType === 'simplification') {
          // For simplification, show objects, flows, apex for consolidation/migration/rebuild
          // Plus retirement candidates
          const [objRes, flowRes, apexRes, retirementRes] = await Promise.all([
            fetch('/api/objects'),
            fetch('/api/flows'),
            fetch('/api/apex'),
            fetch('/api/retirement?minRisk=low'),
          ]);
          const [objData, flowData, apexData, retirementData] = await Promise.all([
            objRes.json(),
            flowRes.json(),
            apexRes.json(),
            retirementRes.json(),
          ]);

          // Add objects for consolidation/migration
          (objData.objects || []).forEach((obj: any) => {
            items.push({
              id: obj.id,
              apiName: obj.name || obj.api_name,
              label: obj.label,
              type: 'Object',
              dependentCount: obj.field_count || obj.fieldCount || 0,
            });
          });

          // Add flows for rebuilding
          (flowData.flows || []).forEach((flow: any) => {
            items.push({
              id: flow.id,
              apiName: flow.api_name || flow.name,
              label: flow.label || flow.api_name || flow.name,
              type: 'Flow',
            });
          });

          // Add apex for refactoring
          (apexData.classes || []).forEach((cls: any) => {
            items.push({
              id: cls.id,
              apiName: cls.api_name || cls.name,
              label: cls.label || cls.api_name || cls.name,
              type: 'ApexClass',
            });
          });

          // Mark retirement candidates for easy identification
          const retirementIds = new Set((retirementData.candidates || []).map((c: any) => c.id));
          items.forEach(item => {
            if (retirementIds.has(item.id)) {
              (item as any).retirementCandidate = true;
            }
          });
        } else if (planType === 'fix') {
          // For fix, show flows and apex classes primarily
          const [flowRes, apexRes, triggerRes] = await Promise.all([
            fetch('/api/flows'),
            fetch('/api/apex'),
            fetch('/api/triggers'),
          ]);
          const [flowData, apexData, triggerData] = await Promise.all([
            flowRes.json(),
            apexRes.json(),
            triggerRes.json(),
          ]);

          (flowData.flows || []).forEach((flow: any) => {
            items.push({
              id: flow.id,
              apiName: flow.api_name || flow.name,
              label: flow.label || flow.api_name || flow.name,
              type: 'Flow',
            });
          });

          (apexData.classes || []).forEach((cls: any) => {
            items.push({
              id: cls.id,
              apiName: cls.api_name || cls.name,
              label: cls.label || cls.api_name || cls.name,
              type: 'ApexClass',
            });
          });

          (triggerData.triggers || []).forEach((trigger: any) => {
            items.push({
              id: trigger.id,
              apiName: trigger.api_name || trigger.name,
              label: trigger.label || trigger.api_name || trigger.name,
              type: 'ApexTrigger',
            });
          });
        }

        setAvailableItems(items);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    }
    if (planType) {
      fetchData();
    }
  }, [planType]);

  const getTypeConfig = () => {
    switch (planType) {
      case 'implementation':
        return {
          icon: '🚀',
          title: 'Implementation Plan',
          subtitle: 'Track metadata components for deployment or migration',
          color: 'purple',
          defaultAction: 'create' as const,
        };
      case 'simplification':
        return {
          icon: '🧹',
          title: 'Data Simplification Plan',
          subtitle: 'Consolidate objects, migrate data, rebuild automations, reduce complexity',
          color: 'orange',
          defaultAction: 'review' as const,
        };
      case 'fix':
        return {
          icon: '🔧',
          title: 'Fix / Enhancement Plan',
          subtitle: 'Track changes for bug fixes or small enhancements',
          color: 'blue',
          defaultAction: 'update' as const,
        };
      default:
        return {
          icon: '📋',
          title: 'New Plan',
          subtitle: 'Create a new change plan',
          color: 'gray',
          defaultAction: 'review' as const,
        };
    }
  };

  const config = getTypeConfig();

  const toggleItem = (item: MetadataItem) => {
    const exists = selectedItems.find(s => s.id === item.id);
    if (exists) {
      setSelectedItems(prev => prev.filter(s => s.id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, {
        id: item.id,
        apiName: item.apiName,
        label: item.label,
        type: item.type,
        action: config.defaultAction,
        status: 'pending',
        dependentCount: item.dependentCount,
      }]);
    }
  };

  const updateItemAction = (itemId: number, action: PlanItem['action']) => {
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, action } : item
    ));
  };

  const updateItemNotes = (itemId: number, notes: string) => {
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, notes } : item
    ));
  };

  const updateItemTarget = (itemId: number, targetApiName: string) => {
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, targetApiName } : item
    ));
  };

  const handleCreatePlan = async () => {
    if (!planName || !planType) return;

    setCreating(true);
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planName,
          type: planType,
          description: planDescription,
          items: selectedItems,
          metadata: {
            targetOrg: targetOrg || undefined,
            targetDate: targetDate || undefined,
            owner: owner || undefined,
            riskLevel,
          },
        }),
      });

      if (res.ok) {
        const plan = await res.json();
        router.push(`/plans/${plan.id}`);
      } else {
        alert('Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Failed to create plan');
    } finally {
      setCreating(false);
    }
  };

  // Get unique types for filter
  const itemTypes = Array.from(new Set(availableItems.map(i => i.type)));

  const filteredItems = availableItems.filter(item => {
    const matchesSearch = item.apiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.label && item.label.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (!planType) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/plans" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Select Plan Type</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanTypeCard
            title="Implementation Plan"
            description="New deployment or migration project"
            icon="🚀"
            href="/plans/new?type=implementation"
            color="purple"
          />
          <PlanTypeCard
            title="Data Simplification"
            description="Clean up unused metadata"
            icon="🧹"
            href="/plans/new?type=simplification"
            color="orange"
          />
          <PlanTypeCard
            title="Fix / Enhancement"
            description="Bug fix or small enhancement"
            icon="🔧"
            href="/plans/new?type=fix"
            color="blue"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/plans" className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <h1 className="text-2xl font-bold text-acs-navy" style={{ fontFamily: 'Georgia, serif' }}>
              {config.title}
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">{config.subtitle}</p>
        </div>
      </div>

      {/* Plan Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Plan Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acs-blue"
              placeholder="Enter plan name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acs-blue"
              placeholder="Plan owner name..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={planDescription}
              onChange={(e) => setPlanDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acs-blue"
              rows={2}
              placeholder="Describe the purpose of this plan..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Org</label>
            <select
              value={targetOrg}
              onChange={(e) => setTargetOrg(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acs-blue"
            >
              {connectedOrgs.length === 0 ? (
                <option value="">No orgs connected</option>
              ) : (
                connectedOrgs.map((org) => (
                  <option key={org.alias} value={org.alias}>
                    {org.alias} ({org.username}) {org.isSandbox ? '- Sandbox' : ''}
                  </option>
                ))
              )}
            </select>
            {connectedOrgs.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                <Link href="/settings" className="text-acs-blue hover:underline">Connect an org</Link> in Settings to select a target.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acs-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as 'any' | 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acs-blue"
            >
              <option value="any">Any / TBD</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Selected Items</h2>
              <span className="text-sm text-gray-500">{selectedItems.length} items</span>
            </div>
            {/* Action Summary */}
            <div className="flex flex-wrap gap-2">
              {selectedItems.filter(i => i.action === 'keep').length > 0 && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                  Keep: {selectedItems.filter(i => i.action === 'keep').length}
                </span>
              )}
              {selectedItems.filter(i => i.action === 'consolidate').length > 0 && (
                <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                  Consolidate: {selectedItems.filter(i => i.action === 'consolidate').length}
                </span>
              )}
              {selectedItems.filter(i => i.action === 'migrate').length > 0 && (
                <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full">
                  Migrate: {selectedItems.filter(i => i.action === 'migrate').length}
                </span>
              )}
              {selectedItems.filter(i => i.action === 'rebuild').length > 0 && (
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  Rebuild: {selectedItems.filter(i => i.action === 'rebuild').length}
                </span>
              )}
              {selectedItems.filter(i => i.action === 'delete').length > 0 && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  Delete/Retire: {selectedItems.filter(i => i.action === 'delete').length}
                </span>
              )}
              {selectedItems.filter(i => i.action === 'update').length > 0 && (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                  Update: {selectedItems.filter(i => i.action === 'update').length}
                </span>
              )}
              {selectedItems.filter(i => i.action === 'create').length > 0 && (
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  Create: {selectedItems.filter(i => i.action === 'create').length}
                </span>
              )}
              {selectedItems.filter(i => i.action === 'review').length > 0 && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  Review: {selectedItems.filter(i => i.action === 'review').length}
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {selectedItems.map((item) => {
              const actionColors: Record<string, string> = {
                keep: 'bg-gray-50 border-l-4 border-l-gray-400',
                consolidate: 'bg-indigo-50 border-l-4 border-l-indigo-400',
                migrate: 'bg-cyan-50 border-l-4 border-l-cyan-400',
                rebuild: 'bg-purple-50 border-l-4 border-l-purple-400',
                delete: 'bg-red-50 border-l-4 border-l-red-400',
                update: 'bg-yellow-50 border-l-4 border-l-yellow-400',
                create: 'bg-green-50 border-l-4 border-l-green-400',
                review: 'bg-blue-50 border-l-4 border-l-blue-400',
              };
              // Get potential targets for consolidate/migrate (other objects that are being kept)
              const potentialTargets = selectedItems.filter(
                i => i.id !== item.id && i.type === 'Object' && (i.action === 'keep' || i.action === 'update')
              );
              const needsTarget = item.action === 'consolidate' || item.action === 'migrate';

              return (
                <div key={item.id} className={`p-4 ${actionColors[item.action] || ''}`}>
                  {/* Row 1: Basic info and action */}
                  <div className="flex items-center gap-4 mb-2">
                    <button
                      onClick={() => toggleItem(item)}
                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.label || item.apiName}</div>
                      <div className="text-xs text-gray-500 truncate">{item.apiName}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                      item.type === 'Object' ? 'bg-blue-100 text-blue-700' :
                      item.type === 'Field' ? 'bg-green-100 text-green-700' :
                      item.type === 'Flow' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.type}
                    </span>
                    {item.dependentCount !== undefined && item.dependentCount > 0 && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded flex-shrink-0">
                        {item.dependentCount} fields
                      </span>
                    )}
                    <select
                      value={item.action}
                      onChange={(e) => updateItemAction(item.id, e.target.value as PlanItem['action'])}
                      className="text-sm px-2 py-1 border rounded font-medium flex-shrink-0"
                    >
                      <option value="keep">Keep (No Change)</option>
                      <option value="consolidate">Consolidate Into...</option>
                      <option value="migrate">Migrate Data To...</option>
                      <option value="rebuild">Rebuild</option>
                      <option value="delete">Delete/Retire</option>
                      <option value="update">Update</option>
                      <option value="create">Create</option>
                      <option value="review">Review</option>
                    </select>
                  </div>

                  {/* Row 2: Target selection for consolidate/migrate */}
                  {needsTarget && (
                    <div className="ml-9 mb-2 flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {item.action === 'consolidate' ? 'Consolidate into:' : 'Migrate data to:'}
                      </span>
                      <select
                        value={item.targetApiName || ''}
                        onChange={(e) => updateItemTarget(item.id, e.target.value)}
                        className="text-sm px-2 py-1 border rounded flex-1 max-w-xs"
                      >
                        <option value="">-- Select target object --</option>
                        {potentialTargets.map(t => (
                          <option key={t.id} value={t.apiName}>
                            {t.label || t.apiName}
                          </option>
                        ))}
                        <option value="_new">+ Create new object</option>
                        <option value="_external">External system</option>
                      </select>
                      {!item.targetApiName && (
                        <span className="text-xs text-red-500">Required</span>
                      )}
                    </div>
                  )}

                  {/* Row 3: Notes */}
                  <div className="ml-9">
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => updateItemNotes(item.id, e.target.value)}
                      placeholder={
                        item.action === 'keep' ? 'Why keep this? (optional)' :
                        item.action === 'delete' ? 'Reason for retirement...' :
                        item.action === 'consolidate' ? 'What fields/data to merge...' :
                        item.action === 'migrate' ? 'Migration details...' :
                        item.action === 'rebuild' ? 'What needs to change...' :
                        'Add notes...'
                      }
                      className="w-full text-sm px-2 py-1 border rounded bg-white/50 placeholder-gray-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dependencies & Impact Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-900 mb-2">Dependencies & Impact Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-800">
                {selectedItems.reduce((sum, i) => sum + (i.dependentCount || 0), 0)}
              </div>
              <div className="text-xs text-amber-700">Total Dependencies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {selectedItems.filter(i => i.action === 'keep').length}
              </div>
              <div className="text-xs text-gray-600">Keep (No Change)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-700">
                {selectedItems.filter(i => i.action === 'consolidate').length}
              </div>
              <div className="text-xs text-indigo-600">Consolidate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-700">
                {selectedItems.filter(i => i.action === 'delete').length}
              </div>
              <div className="text-xs text-red-600">Delete/Retire</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">
                {selectedItems.filter(i => i.action === 'rebuild').length}
              </div>
              <div className="text-xs text-purple-600">Rebuild</div>
            </div>
          </div>
          <p className="text-sm text-amber-700">
            The plan will include impact analysis for each component showing affected flows, triggers, reports,
            and recommendations for mitigating risks during execution.
          </p>
          {selectedItems.some(i => (i.dependentCount || 0) > 0) && (
            <div className="mt-2 p-2 bg-amber-100 rounded">
              <p className="text-xs text-amber-800 font-medium">
                Items with dependencies will require additional steps to update or remove dependent components.
                The generated plan will include specific mitigation steps for each dependency.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Available Items */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              {planType === 'simplification' ? 'Metadata for Simplification' : 'Available Metadata'}
            </h2>
            <span className="text-sm text-gray-500">{filteredItems.length} items</span>
          </div>
          {planType === 'simplification' && (
            <p className="text-sm text-gray-500 mb-3">
              Select objects to consolidate, flows to rebuild, or components to retire.
            </p>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acs-blue"
              placeholder="Search..."
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-acs-blue"
            >
              <option value="all">All Types</option>
              {itemTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Loading metadata...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {filteredItems.map((item) => {
              const isSelected = selectedItems.some(s => s.id === item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItem(item)}
                    className="w-4 h-4 text-acs-blue rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.label || item.apiName}</div>
                    <div className="text-xs text-gray-500">{item.apiName}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.type === 'Object' ? 'bg-blue-100 text-blue-700' :
                    item.type === 'Field' ? 'bg-green-100 text-green-700' :
                    item.type === 'Flow' ? 'bg-purple-100 text-purple-700' :
                    item.type === 'ApexClass' ? 'bg-orange-100 text-orange-700' :
                    item.type === 'ApexTrigger' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.type}
                  </span>
                  {item.dependentCount !== undefined && item.dependentCount > 0 && (
                    <span className="text-xs text-gray-500">
                      {item.dependentCount} {item.type === 'Object' ? 'fields' : 'deps'}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {availableItems.length === 0 ? (
              <>
                <p>No metadata found.</p>
                <p className="text-sm mt-2">
                  Run a <Link href="/settings" className="text-acs-blue hover:underline">metadata sync</Link> to load data from your Salesforce org.
                </p>
              </>
            ) : (
              <p>No items found matching your search criteria.</p>
            )}
          </div>
        )}
      </div>

      {/* Checklist Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Auto-Generated Checklist</h3>
        <p className="text-sm text-blue-700">
          Based on your plan type ({planType}), a checklist will be automatically generated with{' '}
          {planType === 'implementation' ? '15 items covering pre-deployment, deployment, and post-deployment' :
           planType === 'simplification' ? '18 items covering impact analysis, data migration, object consolidation, automation rebuild, validation, and documentation' :
           '12 items covering investigation, development, testing, and deployment'}.
        </p>
        {planType === 'simplification' && (
          <ul className="text-sm text-blue-600 mt-2 list-disc list-inside">
            <li>Impact analysis for each component</li>
            <li>Data migration planning and execution</li>
            <li>Automation rebuild (flows, triggers, validation rules)</li>
            <li>Permission and security adjustments</li>
            <li>Testing and validation</li>
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href="/plans" className="px-4 py-2 text-gray-600 hover:text-gray-800">
          Cancel
        </Link>
        <button
          onClick={handleCreatePlan}
          disabled={!planName || creating}
          className="bg-acs-blue text-white px-6 py-2 rounded-lg hover:bg-acs-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {creating ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Creating...
            </>
          ) : (
            <>Create Plan</>
          )}
        </button>
      </div>
    </div>
  );
}

function PlanTypeCard({ title, description, icon, href, color }: {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}) {
  const borderColors: Record<string, string> = {
    purple: 'border-purple-500 hover:border-purple-600',
    orange: 'border-orange-500 hover:border-orange-600',
    blue: 'border-acs-blue hover:border-acs-navy',
  };

  return (
    <Link
      href={href}
      className={`bg-white rounded-lg shadow p-8 hover:shadow-lg transition-all border-l-4 ${borderColors[color]}`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-semibold text-xl text-acs-navy">{title}</h3>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </Link>
  );
}

export default function NewPlanPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-acs-blue border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <NewPlanContent />
    </Suspense>
  );
}
