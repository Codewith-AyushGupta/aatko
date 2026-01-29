import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ProcessBuildersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Process Builders</h1>
        <p className="text-gray-600 mt-1">
          Legacy automation tool (deprecated)
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-900">Process Builder is Deprecated</h3>
            <p className="text-sm text-yellow-700 mt-2">
              Salesforce has deprecated Process Builder in favor of Flow Builder.
              All Process Builder automations should be migrated to Flows.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              Process Builder metadata is stored as Flows with <code className="bg-yellow-100 px-1 rounded">processType: Workflow</code>.
              View them in the Flows section.
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

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900">Migration Resources</h3>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>
            <a
              href="https://help.salesforce.com/s/articleView?id=sf.flow_convert_from_process.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Convert Process Builder to Flow
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
