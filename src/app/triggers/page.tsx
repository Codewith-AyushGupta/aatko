import Link from 'next/link';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ApexTrigger {
  id: number;
  api_name: string;
  label: string;
  file_path: string;
  metadata: {
    apiVersion?: string;
    status?: string;
    entityDefinition?: string;
  };
}

async function getTriggers(): Promise<ApexTrigger[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT id, api_name, label, file_path, metadata_json
      FROM nodes
      WHERE type = 'ApexTrigger'
      ORDER BY api_name
    `);

    if (!result[0]) return [];

    return result[0].values.map((row: any) => ({
      id: row[0],
      api_name: row[1],
      label: row[2] || row[1],
      file_path: row[3],
      metadata: row[4] ? JSON.parse(row[4]) : {},
    }));
  } finally {
    db.close();
  }
}

export default async function TriggersPage() {
  const triggers = await getTriggers();

  // Count active triggers
  const activeTriggers = triggers.filter(t => t.metadata.status === 'Active' || !t.metadata.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Apex Triggers</h1>
        <p className="text-gray-600 mt-1">
          {triggers.length} triggers ({activeTriggers.length} active)
        </p>
      </div>

      {triggers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No triggers found. Run a sync to load metadata.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trigger Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Object
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
              {triggers.map((trigger) => (
                <tr key={trigger.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/apex/${trigger.api_name}`}
                      className="text-acs-blue hover:underline font-mono font-medium"
                    >
                      {trigger.api_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {trigger.metadata.entityDefinition ? (
                      <Link
                        href={`/objects/${trigger.metadata.entityDefinition}`}
                        className="text-acs-blue hover:underline"
                      >
                        {trigger.metadata.entityDefinition}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {trigger.metadata.apiVersion || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${
                      trigger.metadata.status === 'Active' || !trigger.metadata.status
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {trigger.metadata.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
