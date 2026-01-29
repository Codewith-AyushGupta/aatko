import Link from 'next/link';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface FlexiPage {
  id: number;
  api_name: string;
  label: string;
  file_path: string;
  metadata: {
    description?: string;
    type?: string;
    sobjectType?: string;
  };
}

async function getFlexiPages(): Promise<FlexiPage[]> {
  const db = await getDatabase();
  if (!db) return [];

  const result = db.exec(`
    SELECT id, api_name, label, file_path, metadata_json
    FROM nodes
    WHERE type = 'FlexiPage'
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

export default async function FlexiPagesPage() {
  const flexipages = await getFlexiPages();

  // Count by type
  const recordPages = flexipages.filter(fp => fp.metadata.type === 'RecordPage');
  const appPages = flexipages.filter(fp => fp.metadata.type === 'AppPage');
  const homePages = flexipages.filter(fp => fp.metadata.type === 'HomePage');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lightning Pages</h1>
        <p className="text-gray-600 mt-1">
          {flexipages.length} pages ({recordPages.length} record, {appPages.length} app, {homePages.length} home)
        </p>
      </div>

      {flexipages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No Lightning pages found. Run a sync to load metadata.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Object
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flexipages.map((fp) => (
                <tr key={fp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{fp.label}</div>
                    <div className="text-xs text-gray-400 font-mono">{fp.api_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    {fp.metadata.type && (
                      <span className={`px-2 py-1 text-xs rounded ${
                        fp.metadata.type === 'RecordPage' ? 'bg-blue-100 text-blue-700' :
                        fp.metadata.type === 'AppPage' ? 'bg-purple-100 text-purple-700' :
                        fp.metadata.type === 'HomePage' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {fp.metadata.type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {fp.metadata.sobjectType ? (
                      <Link
                        href={`/objects/${fp.metadata.sobjectType}`}
                        className="text-acs-blue hover:underline"
                      >
                        {fp.metadata.sobjectType}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                    {fp.metadata.description || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900">About Lightning Pages</h3>
        <p className="text-sm text-blue-700 mt-1">
          Lightning pages (FlexiPages) are custom page layouts built with the Lightning App Builder.
          They can be used for record pages, app pages, home pages, and utility bars.
        </p>
      </div>
    </div>
  );
}
