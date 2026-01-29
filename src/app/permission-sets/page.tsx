import Link from 'next/link';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface PermissionSet {
  id: number;
  api_name: string;
  label: string;
  file_path: string;
  metadata: {
    description?: string;
    license?: string;
    hasActivationRequired?: boolean;
  };
}

async function getPermissionSets(): Promise<PermissionSet[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT id, api_name, label, file_path, metadata_json
      FROM nodes
      WHERE type = 'PermissionSet'
      ORDER BY label, api_name
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

export default async function PermissionSetsPage() {
  const permSets = await getPermissionSets();

  // Separate by type (custom vs managed)
  const custom = permSets.filter(p => !p.api_name.includes('__'));
  const managed = permSets.filter(p => p.api_name.includes('__'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Permission Sets</h1>
        <p className="text-gray-600 mt-1">
          {permSets.length} permission sets ({custom.length} custom, {managed.length} from packages)
        </p>
      </div>

      {permSets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No permission sets found. Run a sync to load metadata.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permission Set
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permSets.map((ps) => {
                const namespace = ps.api_name.includes('__')
                  ? ps.api_name.split('__')[0]
                  : null;

                return (
                  <tr key={ps.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/permission-sets/${encodeURIComponent(ps.api_name)}`} className="font-medium text-acs-blue hover:underline">
                        {ps.label}
                      </Link>
                      <div className="text-xs text-gray-400 font-mono">{ps.api_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {namespace ? (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                          {namespace}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          Custom
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {ps.metadata.license || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {ps.metadata.description || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900">About Permission Sets</h3>
        <p className="text-sm text-blue-700 mt-1">
          Permission sets grant additional permissions to users beyond their profile.
          They can be assigned to users directly or through permission set groups.
        </p>
      </div>
    </div>
  );
}
