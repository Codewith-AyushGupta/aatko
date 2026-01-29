import Link from 'next/link';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Profile {
  id: number;
  api_name: string;
  label: string;
  file_path: string;
  metadata: {
    description?: string;
    userLicense?: string;
    custom?: boolean;
  };
}

async function getProfiles(): Promise<Profile[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT id, api_name, label, file_path, metadata_json
      FROM nodes
      WHERE type = 'Profile'
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

export default async function ProfilesPage() {
  const profiles = await getProfiles();

  // Separate standard vs custom
  const standard = profiles.filter(p => !p.metadata.custom && !p.api_name.includes('__'));
  const custom = profiles.filter(p => p.metadata.custom || (!p.api_name.includes('__') && p.api_name !== p.label));
  const managed = profiles.filter(p => p.api_name.includes('__'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profiles</h1>
        <p className="text-gray-600 mt-1">
          {profiles.length} profiles in your org
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No profiles found in the database. Profiles may need to be synced separately.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile
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
              {profiles.map((profile) => {
                const namespace = profile.api_name.includes('__')
                  ? profile.api_name.split('__')[0]
                  : null;

                return (
                  <tr key={profile.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/profiles/${encodeURIComponent(profile.api_name)}`} className="font-medium text-acs-blue hover:underline">
                        {profile.label}
                      </Link>
                      <div className="text-xs text-gray-400 font-mono">{profile.api_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {namespace ? (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                          {namespace}
                        </span>
                      ) : profile.metadata.custom ? (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          Custom
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {profile.metadata.userLicense || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {profile.metadata.description || '-'}
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
        <h3 className="font-medium text-blue-900">About Profiles</h3>
        <p className="text-sm text-blue-700 mt-1">
          Profiles define the baseline permissions for users, including object access, field-level security,
          and page layout assignments. Each user must be assigned exactly one profile.
        </p>
      </div>
    </div>
  );
}
