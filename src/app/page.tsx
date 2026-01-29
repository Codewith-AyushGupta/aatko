import Link from 'next/link';
import { getStats } from '@/lib/db';
import { AsyncStatCard } from '@/components/AsyncStatCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-acs-navy" style={{ fontFamily: 'Georgia, serif' }}>
          Metadata Intelligence
        </h1>
        <p className="text-sm text-gray-500">
          Explore and manage Salesforce metadata dependencies
        </p>
      </div>

      {/* Stats Grid - 2 even rows of 5 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Row 1: Core Metadata + Automation start */}
        <StatCard label="Objects" value={stats.objects} href="/objects" />
        <StatCard label="Permission Sets" value={stats.permissionSets} href="/permission-sets" />
        <StatCard label="Profiles" value={stats.profiles} href="/profiles" />
        <AsyncStatCard label="Packages" href="/packages" apiEndpoint="/api/packages" countKey="packages" />
        <StatCard label="Flows" value={stats.flows} href="/flows" color="purple" />

        {/* Row 2: Automation + Apex */}
        <StatCard label="Process Builders" value={0} href="/process-builders" color="purple" />
        <StatCard label="Workflow Rules" value={0} href="/workflows" color="purple" />
        <StatCard label="Triggers" value={stats.apexTriggers} href="/triggers" color="orange" />
        <StatCard label="Apex Classes" value={stats.apexClasses} href="/apex" color="orange" />
        <StatCard label="LWCs" value={stats.lwc} href="/lwc" color="orange" />
      </div>

      {/* Workflows Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Start a Workflow</h2>

        {/* Planning Group */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>📋</span> Planning
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <WorkflowCard
              title="Implementation Plan"
              description="New deployment or migration project with full metadata tracking"
              icon="🚀"
              href="/plans/new?type=implementation"
              status="available"
            />
            <WorkflowCard
              title="Data Simplification"
              description="Clean up unused fields, objects, and reduce org complexity"
              icon="🧹"
              href="/plans/new?type=simplification"
              status="available"
            />
            <WorkflowCard
              title="Fix / Enhancement"
              description="Bug fix, small enhancement, or managed package addition"
              icon="🔧"
              href="/plans/new?type=fix"
              status="available"
            />
            <WorkflowCard
              title="Retirement Assessment"
              description="Identify candidates for cleanup and retirement"
              icon="🗑️"
              href="/retirement"
              status="available"
            />
          </div>
        </div>

        {/* Analysis Group */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>🔬</span> Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <WorkflowCard
              title="Impact Analysis"
              description="Analyze the impact of changing or retiring metadata"
              icon="🔍"
              href="/analysis/impact"
              status="available"
            />
            <WorkflowCard
              title="Dependency Graph"
              description="Visualize relationships between metadata components"
              icon="🔗"
              href="/graph"
              status="available"
            />
            <WorkflowCard
              title="Health Check"
              description="Verify metadata completeness, security, and system health"
              icon="🩺"
              href="/health"
              status="available"
            />
          </div>
        </div>

        {/* Tools Group */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>🛠️</span> Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <WorkflowCard
              title="Export Package"
              description="Export selected metadata as package.xml or spreadsheet"
              icon="📤"
              href="/export/builder"
              status="available"
            />
            <WorkflowCard
              title="Documentation"
              description="Generate documentation for selected metadata"
              icon="📝"
              href="/docs/generate"
              status="available"
            />
            <WorkflowCard
              title="Field Usage Analyzer"
              description="Analyze field population rates to identify unused fields"
              icon="📊"
              href="/tools/field-usage"
              status="available"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href, color = 'blue' }: {
  label: string;
  value: number;
  href?: string;
  color?: 'blue' | 'purple' | 'orange';
}) {
  const borderColors = {
    blue: 'border-l-acs-blue',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500',
  };

  const content = (
    <div className={`bg-white rounded shadow p-3 hover:shadow-md transition-shadow ${borderColors[color]}`} style={{ borderLeftWidth: '3px' }}>
      <div className="text-xl font-bold text-acs-navy">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 truncate">{label}</div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

function WorkflowCard({ title, description, icon, href, status }: {
  title: string;
  description: string;
  icon: string;
  href: string;
  status: 'available' | 'coming-soon';
}) {
  const isAvailable = status === 'available';

  const content = (
    <div className={`bg-white rounded-lg shadow p-5 border-l-4 h-full min-h-[120px] ${
      isAvailable ? 'border-l-acs-blue hover:shadow-lg cursor-pointer' : 'border-l-gray-300 opacity-75'
    } transition-shadow`}>
      <div className="flex items-start gap-4 h-full">
        <div className="text-3xl flex-shrink-0">{icon}</div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-acs-navy">{title}</h3>
            {!isAvailable && (
              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full uppercase whitespace-nowrap">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
        </div>
      </div>
    </div>
  );

  if (isAvailable) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }
  return <div className="h-full">{content}</div>;
}
