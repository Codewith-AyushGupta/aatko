import Link from 'next/link';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Layout {
  id: number;
  api_name: string;
  label: string;
  file_path: string;
  objectName: string;
}

async function getLayouts(): Promise<Layout[]> {
  const db = await getDatabase();
  if (!db) return [];

  const result = db.exec(`
    SELECT id, api_name, label, file_path
    FROM nodes
    WHERE type = 'Layout'
    ORDER BY api_name
  `);

  if (!result[0]) return [];

  return result[0].values.map((row: any) => {
    const apiName = row[1];
    // Layout names are typically "ObjectName-LayoutName"
    const parts = apiName.split('-');
    const objectName = parts[0] || 'Unknown';

    return {
      id: row[0],
      api_name: apiName,
      label: row[2] || apiName,
      file_path: row[3],
      objectName,
    };
  });
}

export default async function LayoutsPage() {
  const layouts = await getLayouts();

  // Count unique objects
  const uniqueObjects = new Set(layouts.map(l => l.objectName));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Page Layouts</h1>
        <p className="text-gray-600 mt-1">
          {layouts.length} layouts across {uniqueObjects.size} objects
        </p>
      </div>

      {layouts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No layouts found. Run a sync to load metadata.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Layout Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Object
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Name
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {layouts.map((layout) => {
                const layoutName = layout.api_name.replace(`${layout.objectName}-`, '');
                return (
                  <tr key={layout.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{layoutName}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/objects/${layout.objectName}`}
                        className="text-acs-blue hover:underline"
                      >
                        {layout.objectName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {layout.api_name}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
