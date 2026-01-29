'use client';

import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ObjectData {
  object: any;
  fields: any[];
  recordTypes: any[];
  validationRules: any[];
  flows: any[];
  apex: any[];
  layouts: any[];
  flexiPages: any[];
  relatedObjects: any[];
}

// Helper to check if object is standard (no __ in name)
function isStandardObject(apiName: string): boolean {
  return !apiName.includes('__');
}

const TABS = [
  { id: 'fields', label: 'Fields' },
  { id: 'automations', label: 'Salesforce Automations' },
  { id: 'apex', label: 'Apex' },
  { id: 'validation', label: 'Validation Rules' },
  { id: 'layouts', label: 'Layouts' },
  { id: 'flexipages', label: 'Lightning Pages' },
  { id: 'recordtypes', label: 'Record Types' },
  { id: 'related', label: 'Related objects' },
];

export default function ObjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ObjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const activeTab = searchParams.get('tab') || 'fields';
  const objectName = params.name as string;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/objects/${encodeURIComponent(objectName)}`);
        if (res.ok) {
          const objectData = await res.json();
          setData(objectData);
        }
      } catch (err) {
        console.error('Failed to load object data:', err);
      }
      setLoading(false);
    }
    loadData();
  }, [objectName]);

  const setActiveTab = (tab: string) => {
    router.push(`/objects/${objectName}?tab=${tab}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
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

  const { object, fields, recordTypes, validationRules, flows, apex, layouts, flexiPages, relatedObjects } = data;
  const metadata = object.metadata_json ? JSON.parse(object.metadata_json) : {};

  // Filter based on search
  const filterItems = (items: any[], query: string) => {
    if (!query) return items;
    const lower = query.toLowerCase();
    return items.filter(item =>
      item.api_name?.toLowerCase().includes(lower) ||
      item.label?.toLowerCase().includes(lower) ||
      item.node_api_name?.toLowerCase().includes(lower)
    );
  };

  const getCounts = () => ({
    fields: fields.length,
    automations: flows.length,
    apex: apex.length,
    validation: validationRules.length,
    layouts: layouts.length,
    flexipages: flexiPages?.length || 0,
    recordtypes: recordTypes.length || 1, // Show 1 for Master if no custom record types
    related: relatedObjects.length,
  });

  const counts = getCounts();

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Link href="/objects" className="hover:text-sf-blue">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">{metadata.label || object.api_name}</span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0" aria-label="Tabs">
          {TABS.map((tab) => {
            const count = counts[tab.id as keyof typeof counts];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive
                    ? 'border-sf-blue text-sf-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-sf-blue text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-sf-blue focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Only show Retirement Checklist for custom objects */}
          {!isStandardObject(objectName) && (
            <Link
              href={`/objects/${objectName}/impact`}
              className="text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Retirement Checklist
            </Link>
          )}
          <Link
            href={`/graph?node=${object.id}`}
            className="text-sm text-gray-600 hover:text-sf-blue flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            View Graph
          </Link>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'fields' && (
          <FieldsTab fields={filterItems(fields, searchQuery)} />
        )}
        {activeTab === 'automations' && (
          <AutomationsTab flows={filterItems(flows, searchQuery)} />
        )}
        {activeTab === 'apex' && (
          <ApexTab apex={filterItems(apex, searchQuery)} />
        )}
        {activeTab === 'validation' && (
          <ValidationRulesTab rules={filterItems(validationRules, searchQuery)} />
        )}
        {activeTab === 'layouts' && (
          <LayoutsTab layouts={filterItems(layouts, searchQuery)} />
        )}
        {activeTab === 'flexipages' && (
          <FlexiPagesTab flexiPages={filterItems(flexiPages || [], searchQuery)} />
        )}
        {activeTab === 'recordtypes' && (
          <RecordTypesTab recordTypes={filterItems(recordTypes, searchQuery)} />
        )}
        {activeTab === 'related' && (
          <RelatedObjectsTab relatedObjects={filterItems(relatedObjects, searchQuery)} />
        )}
      </div>
    </div>
  );
}

function FieldsTab({ fields }: { fields: any[] }) {
  if (fields.length === 0) {
    return <EmptyState message="No fields found" />;
  }

  const getFieldTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      'Text': 'bg-blue-100 text-blue-700',
      'LongTextArea': 'bg-blue-100 text-blue-700',
      'Number': 'bg-purple-100 text-purple-700',
      'Currency': 'bg-green-100 text-green-700',
      'Percent': 'bg-purple-100 text-purple-700',
      'Date': 'bg-orange-100 text-orange-700',
      'DateTime': 'bg-orange-100 text-orange-700',
      'Checkbox': 'bg-gray-100 text-gray-700',
      'Picklist': 'bg-yellow-100 text-yellow-700',
      'MultiselectPicklist': 'bg-yellow-100 text-yellow-700',
      'Lookup': 'bg-indigo-100 text-indigo-700',
      'MasterDetail': 'bg-red-100 text-red-700',
      'Formula': 'bg-cyan-100 text-cyan-700',
      'Email': 'bg-blue-100 text-blue-700',
      'Phone': 'bg-blue-100 text-blue-700',
      'Url': 'bg-blue-100 text-blue-700',
    };
    return typeColors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Utilization</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {fields.map((field) => {
            const meta = field.metadata_json ? (typeof field.metadata_json === 'string' ? JSON.parse(field.metadata_json) : field.metadata_json) : {};
            const isRetireCandidate = field.population_rate != null && field.population_rate < 5;
            // For formula fields, show the return type + Formula (e.g., "Currency Formula")
            const baseType = meta.type || '-';
            const fieldType = meta.formula ? `${baseType} Formula` : baseType;

            // Build details string
            const details: string[] = [];
            if (meta.required) details.push('Required');
            if (meta.unique) details.push('Unique');
            if (meta.externalId) details.push('External ID');
            // Show format for date/time fields
            if (baseType === 'Date') {
              details.push('Date Only');
            } else if (baseType === 'DateTime') {
              details.push('Date & Time');
            } else if (baseType === 'Checkbox') {
              details.push('True/False');
            } else if (baseType === 'Email') {
              details.push('name@example.com');
            } else if (baseType === 'Url') {
              details.push('https://...');
            } else if (baseType === 'Phone') {
              details.push('Phone Number');
            }
            if (meta.length) {
              if (['Text', 'LongTextArea', 'TextArea', 'Html', 'RichTextArea'].includes(baseType)) {
                details.push(`${meta.length} chars`);
              } else {
                details.push(`Length: ${meta.length}`);
              }
            }
            // Show precision and scale for number/percent/currency fields
            if (meta.precision && meta.scale !== undefined) {
              details.push(`${meta.precision},${meta.scale} digits`);
            } else if (meta.scale !== undefined) {
              details.push(`${meta.scale} decimals`);
            }
            if (meta.referenceTo) details.push(`→ ${meta.referenceTo}`);
            // Show formula content for formula fields (without "Formula:" prefix since type shows it)
            if (meta.formula && typeof meta.formula === 'string') {
              details.push(meta.formula);
            }
            // Show visible lines for text areas
            if (meta.visibleLines) {
              details.push(`${meta.visibleLines} lines`);
            }
            // Show rollup summary details
            if (meta.summarizedField || meta.summaryForeignKey || meta.summaryOperation) {
              const rollupParts = [];
              if (meta.summaryOperation) rollupParts.push(meta.summaryOperation);
              if (meta.summarizedField) rollupParts.push(`of ${meta.summarizedField}`);
              if (meta.summaryForeignKey) rollupParts.push(`via ${meta.summaryForeignKey}`);
              if (meta.summaryFilterItems) rollupParts.push('(filtered)');
              details.push(`Rollup: ${rollupParts.join(' ')}`);
            }
            // Show picklist values as comma-separated
            if (meta.picklist && Array.isArray(meta.picklist)) {
              const values = meta.picklist
                .map((v: any) => v.fullName || v.label || v)
                .join(', ');
              details.push(`Values: ${values}`);
            }

            return (
              <tr key={field.id} className={isRetireCandidate ? 'bg-red-50' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{field.label || meta.label || '-'}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-600">{field.api_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getFieldTypeColor(fieldType)}`}>
                    {fieldType}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {details.length > 0 ? details.join(' • ') : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  {field.population_rate != null ? (
                    <UtilizationBadge rate={field.population_rate} />
                  ) : (
                    <span className="text-xs text-gray-400">No data</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AutomationsTab({ flows }: { flows: any[] }) {
  if (flows.length === 0) {
    return <EmptyState message="No automations found" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {flows.map((flow, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <Link href={`/flows/${flow.node_api_name}`} className="text-sm font-medium text-sf-blue hover:underline">
                  {flow.node_label || flow.node_api_name}
                </Link>
              </td>
              <td className="px-6 py-4 font-mono text-sm text-gray-600">{flow.node_api_name}</td>
              <td className="px-6 py-4 text-sm text-gray-500">Flow</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Active</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{formatDate(flow.sf_last_modified_date)}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{flow.sf_last_modified_by_name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApexTab({ apex }: { apex: any[] }) {
  if (apex.length === 0) {
    return <EmptyState message="No Apex found" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {apex.map((a, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <Link href={`/apex/${a.node_api_name}`} className="text-sm font-medium text-sf-blue hover:underline">
                  {a.node_api_name}
                </Link>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {a.node_type === 'ApexTrigger' ? 'Trigger' : 'Class'}
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Active</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{formatDate(a.sf_last_modified_date)}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{a.sf_last_modified_by_name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ValidationRulesTab({ rules }: { rules: any[] }) {
  if (rules.length === 0) {
    return <EmptyState message="No validation rules found" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified By</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rules.map((rule) => {
            const meta = rule.metadata_json ? (typeof rule.metadata_json === 'string' ? JSON.parse(rule.metadata_json) : rule.metadata_json) : {};
            return (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{rule.api_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    meta.active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {meta.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(rule.sf_last_modified_date)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{rule.sf_last_modified_by_name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{meta.description || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LayoutsTab({ layouts }: { layouts: any[] }) {
  if (layouts.length === 0) {
    return <EmptyState message="No layouts found" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {layouts.map((layout, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{layout.node_api_name || layout.api_name}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{layout.node_type || 'Layout'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlexiPagesTab({ flexiPages }: { flexiPages: any[] }) {
  if (flexiPages.length === 0) {
    return <EmptyState message="No Lightning pages found" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {flexiPages.map((page, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <Link href={`/flexipages/${page.node_api_name}`} className="text-sm font-medium text-sf-blue hover:underline">
                  {page.node_label || page.node_api_name}
                </Link>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">Lightning Page</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${month}/${day}/${year} ${hour12}:${minutes} ${ampm}`;
}

function RecordTypesTab({ recordTypes }: { recordTypes: any[] }) {
  // If no record types, show Master as default
  const displayRecordTypes = recordTypes.length === 0
    ? [{ id: 'master', api_name: 'Master', label: 'Master', metadata_json: '{"active": true}', isDefault: true }]
    : recordTypes;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {displayRecordTypes.map((rt) => {
            const meta = rt.metadata_json ? (typeof rt.metadata_json === 'string' ? JSON.parse(rt.metadata_json) : rt.metadata_json) : {};
            return (
              <tr key={rt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{rt.label || rt.api_name}</td>
                <td className="px-6 py-4 font-mono text-sm text-gray-600">{rt.api_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    meta.active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {meta.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(rt.sf_created_date)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{rt.sf_created_by_name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDate(rt.sf_last_modified_date)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{rt.sf_last_modified_by_name || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RelatedObjectsTab({ relatedObjects }: { relatedObjects: any[] }) {
  if (relatedObjects.length === 0) {
    return <EmptyState message="No related objects found" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Related object</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {relatedObjects.map((rel, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{rel.node_label || rel.node_api_name}</td>
              <td className="px-6 py-4 font-mono text-sm text-gray-600">{rel.node_api_name}</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {rel.edge_type === 'LOOKUP_TO' ? 'Lookup' :
                 rel.edge_type === 'MASTERDETAIL_TO' ? 'Master-Detail' :
                 rel.edge_type?.replace('_TO', '').replace('_', ' ') || 'Field'}
              </td>
              <td className="px-6 py-4">
                <Link href={`/objects/${rel.target_api_name || rel.node_api_name}`} className="text-sf-blue hover:underline">
                  {rel.target_api_name || rel.node_api_name}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UtilizationBadge({ rate }: { rate: number }) {
  let bgColor = 'bg-green-100 text-green-800';
  if (rate === 0) bgColor = 'bg-red-100 text-red-800';
  else if (rate < 5) bgColor = 'bg-orange-100 text-orange-800';
  else if (rate < 25) bgColor = 'bg-yellow-100 text-yellow-800';

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${bgColor}`}>
      {rate.toFixed(1)}%
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <p>{message}</p>
    </div>
  );
}
