import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Dashboard {
  id: number;
  api_name: string;
  label: string;
  file_path: string;
  metadata: {
    description?: string;
    folderName?: string;
  };
}

async function getDashboards(): Promise<Dashboard[]> {
  const db = await getDatabase();
  if (!db) return [];

  const result = db.exec(`
    SELECT id, api_name, label, file_path, metadata_json
    FROM nodes
    WHERE type = 'Dashboard'
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
}

export default async function DashboardsPage() {
  const dashboards = await getDashboards();

  // Group by folder
  const byFolder: Record<string, Dashboard[]> = {};
  dashboards.forEach(d => {
    const folder = d.metadata.folderName || 'Unfiled';
    if (!byFolder[folder]) byFolder[folder] = [];
    byFolder[folder].push(d);
  });

  const sortedFolders = Object.keys(byFolder).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboards</h1>
        <p className="text-gray-600 mt-1">
          {dashboards.length} dashboards in your org
        </p>
      </div>

      {dashboards.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No dashboards found. Run a sync to load metadata.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedFolders.map(folder => (
            <div key={folder} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">{folder}</h2>
                <p className="text-sm text-gray-500">{byFolder[folder].length} dashboards</p>
              </div>
              <div className="divide-y divide-gray-100">
                {byFolder[folder].map(dashboard => (
                  <div key={dashboard.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{dashboard.label}</div>
                        <div className="text-sm text-gray-500 font-mono">{dashboard.api_name}</div>
                        {dashboard.metadata.description && (
                          <div className="text-sm text-gray-500 mt-1">{dashboard.metadata.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900">About Dashboards</h3>
        <p className="text-sm text-blue-700 mt-1">
          Dashboards display data from multiple reports in a single view. They can include charts, gauges, tables, and metrics.
        </p>
      </div>
    </div>
  );
}
