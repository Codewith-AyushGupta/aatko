import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface LWC {
  id: number;
  api_name: string;
  label: string;
  file_path: string;
  metadata: {
    description?: string;
    isExposed?: boolean;
    targets?: string[];
    apiVersion?: string;
    masterLabel?: string;
  };
}

async function getLWCs(): Promise<LWC[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT id, api_name, label, file_path, metadata_json
      FROM nodes
      WHERE type = 'LWC'
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

export default async function LWCPage() {
  const lwcs = await getLWCs();

  // Separate exposed vs internal
  const exposed = lwcs.filter(l => l.metadata.isExposed);
  const internal = lwcs.filter(l => !l.metadata.isExposed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lightning Web Components</h1>
        <p className="text-gray-600 mt-1">
          {lwcs.length} components ({exposed.length} exposed, {internal.length} internal)
        </p>
      </div>

      {lwcs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No LWCs found. Run a sync to load metadata.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Component
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exposed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Version
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Targets
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lwcs.map((lwc) => (
                <tr key={lwc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 font-mono">{lwc.api_name}</div>
                    {lwc.metadata.masterLabel && lwc.metadata.masterLabel !== lwc.api_name && (
                      <div className="text-xs text-gray-500">{lwc.metadata.masterLabel}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lwc.metadata.isExposed ? (
                      <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {lwc.metadata.apiVersion || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {lwc.metadata.targets && lwc.metadata.targets.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lwc.metadata.targets.slice(0, 3).map((target, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {target.replace('lightning__', '')}
                          </span>
                        ))}
                        {lwc.metadata.targets.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{lwc.metadata.targets.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {lwc.metadata.description || '-'}
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
