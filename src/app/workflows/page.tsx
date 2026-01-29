import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function WorkflowRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workflow Rules</h1>
        <p className="text-gray-600 mt-1">
          Legacy automation tool (deprecated)
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-900">Workflow Rules are Deprecated</h3>
            <p className="text-sm text-yellow-700 mt-2">
              Salesforce has deprecated Workflow Rules in favor of Flow Builder.
              All Workflow Rules should be migrated to Record-Triggered Flows.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Workflow Rules are not available via the Metadata API in the same way as Flows.
              They need to be viewed in Salesforce Setup and migrated manually.
            </p>
            <Link
              href="/flows"
              className="inline-block mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
            >
              View All Flows
            </Link>
          </div>
        </div>
      </div>

      {/* Migration Steps */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Migration Steps</h3>
        <ol className="text-sm text-gray-700 space-y-3">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-acs-blue text-white rounded-full flex items-center justify-center text-xs">1</span>
            <span>Go to Setup &gt; Workflow Rules to see your existing rules</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-acs-blue text-white rounded-full flex items-center justify-center text-xs">2</span>
            <span>Document the criteria and actions for each rule</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-acs-blue text-white rounded-full flex items-center justify-center text-xs">3</span>
            <span>Create equivalent Record-Triggered Flows in Flow Builder</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-acs-blue text-white rounded-full flex items-center justify-center text-xs">4</span>
            <span>Test thoroughly in a sandbox before deactivating the Workflow Rules</span>
          </li>
        </ol>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900">Migration Resources</h3>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>
            <a
              href="https://help.salesforce.com/s/articleView?id=sf.workflow_converting_to_flow.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Convert Workflow Rules to Flow
            </a>
          </li>
          <li>
            <a
              href="https://architect.salesforce.com/design/decision-guides/trigger-automation"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Automation Decision Guide
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
