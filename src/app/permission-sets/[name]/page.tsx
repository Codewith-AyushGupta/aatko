import Link from 'next/link';
import { getDatabase } from '@/lib/db';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ObjectPermission {
  object: string;
  allowCreate?: boolean;
  allowRead?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  viewAllRecords?: boolean;
  modifyAllRecords?: boolean;
}

interface FieldPermission {
  object: string;
  field: string;
  readable?: boolean;
  editable?: boolean;
}

interface PermissionSetDetail {
  id: number;
  api_name: string;
  label: string;
  file_path: string;
  metadata: {
    description?: string;
    license?: string;
    hasActivationRequired?: boolean;
    objectPermissions?: ObjectPermission[] | string[];
    fieldPermissions?: FieldPermission[] | Array<{ object: string; field: string }>;
    userPermissions?: string[];
    applicationVisibilities?: Array<{ application: string; visible?: boolean }>;
    classAccesses?: Array<{ apexClass: string; enabled?: boolean }>;
    pageAccesses?: Array<{ apexPage: string; enabled?: boolean }>;
    recordTypeVisibilities?: Array<{ recordType: string; visible?: boolean; default?: boolean }>;
    tabSettings?: Array<{ tab: string; visibility?: string }>;
  };
}

interface ObjectWithAccess {
  name: string;
  id?: number;
  label?: string;
  fieldCount: number;
}

async function getPermissionSet(name: string): Promise<PermissionSetDetail | null> {
  const db = await getDatabase();
  if (!db) return null;

  try {
    const result = db.exec(`
      SELECT id, api_name, label, file_path, metadata_json
      FROM nodes
      WHERE type = 'PermissionSet' AND api_name = '${name.replace(/'/g, "''")}'
    `);

    if (!result[0] || !result[0].values[0]) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      api_name: row[1] as string,
      label: (row[2] as string) || (row[1] as string),
      file_path: row[3] as string,
      metadata: row[4] ? JSON.parse(row[4] as string) : {},
    };
  } finally {
    db.close();
  }
}

async function getObjectDetails(objectNames: string[]): Promise<Map<string, ObjectWithAccess>> {
  if (objectNames.length === 0) return new Map();

  const db = await getDatabase();
  if (!db) return new Map();

  try {
    const nameList = objectNames.map(n => `'${n.replace(/'/g, "''")}'`).join(',');
    const result = db.exec(`
      SELECT n.id, n.api_name, n.label,
        (SELECT COUNT(*) FROM nodes f WHERE f.parent_id = n.id AND f.type = 'Field') as field_count
      FROM nodes n
      WHERE n.type = 'Object' AND n.api_name IN (${nameList})
    `);

    const map = new Map<string, ObjectWithAccess>();
    if (result[0]) {
      for (const row of result[0].values) {
        map.set(row[1] as string, {
          id: row[0] as number,
          name: row[1] as string,
          label: row[2] as string | undefined,
          fieldCount: row[3] as number,
        });
      }
    }
    return map;
  } finally {
    db.close();
  }
}

function CrudBadge({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded ${
      enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
    }`}>
      {label}
    </span>
  );
}

export default async function PermissionSetDetailPage({
  params,
}: {
  params: { name: string };
}) {
  const name = decodeURIComponent(params.name);
  const permSet = await getPermissionSet(name);

  if (!permSet) {
    notFound();
  }

  // Normalize objectPermissions (could be old format or new format)
  const objectPermissions: ObjectPermission[] = (permSet.metadata.objectPermissions || []).map((op: any) => {
    if (typeof op === 'string') {
      return { object: op };
    }
    return op;
  });

  // Normalize fieldPermissions
  const fieldPermissions: FieldPermission[] = (permSet.metadata.fieldPermissions || []).map((fp: any) => ({
    object: fp.object,
    field: fp.field,
    readable: fp.readable,
    editable: fp.editable,
  }));

  const userPermissions = permSet.metadata.userPermissions || [];
  const applicationVisibilities = permSet.metadata.applicationVisibilities || [];
  const classAccesses = (permSet.metadata.classAccesses || []).filter((ca: any) => ca.enabled);
  const pageAccesses = (permSet.metadata.pageAccesses || []).filter((pa: any) => pa.enabled);
  const recordTypeVisibilities = permSet.metadata.recordTypeVisibilities || [];
  const tabSettings = permSet.metadata.tabSettings || [];

  // Get object details
  const allObjects = Array.from(new Set([...objectPermissions.map(op => op.object), ...fieldPermissions.map(f => f.object)]));
  const objectDetails = await getObjectDetails(allObjects);

  // Group field permissions by object
  const fieldsByObject = fieldPermissions.reduce((acc, fp) => {
    if (!acc[fp.object]) acc[fp.object] = [];
    acc[fp.object].push(fp);
    return acc;
  }, {} as Record<string, FieldPermission[]>);

  const namespace = permSet.api_name.includes('__')
    ? permSet.api_name.split('__')[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/" className="hover:text-acs-blue">Home</Link>
          <span>/</span>
          <Link href="/permission-sets" className="hover:text-acs-blue">Permission Sets</Link>
          <span>/</span>
          <span>{permSet.label}</span>
        </div>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-acs-navy" style={{ fontFamily: 'Georgia, serif' }}>
            {permSet.label}
          </h1>
          {namespace ? (
            <span className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full">
              {namespace}
            </span>
          ) : (
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
              Custom
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 font-mono mt-1">{permSet.api_name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xl font-bold text-acs-navy">{objectPermissions.length}</div>
          <div className="text-xs text-gray-500">Objects</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xl font-bold text-acs-navy">{fieldPermissions.length}</div>
          <div className="text-xs text-gray-500">Fields</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xl font-bold text-acs-navy">{userPermissions.length}</div>
          <div className="text-xs text-gray-500">System Perms</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xl font-bold text-acs-navy">{applicationVisibilities.filter(a => a.visible).length}</div>
          <div className="text-xs text-gray-500">Apps</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xl font-bold text-acs-navy">{classAccesses.length}</div>
          <div className="text-xs text-gray-500">Apex Classes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xl font-bold text-acs-navy">{pageAccesses.length}</div>
          <div className="text-xs text-gray-500">VF Pages</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xs text-gray-500">License</div>
          <div className="font-medium text-gray-900 mt-1 text-sm truncate">{permSet.metadata.license || 'None'}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-3">
          <div className="text-xs text-gray-500">Activation</div>
          <div className="font-medium text-gray-900 mt-1 text-sm">{permSet.metadata.hasActivationRequired ? 'Required' : 'No'}</div>
        </div>
      </div>

      {/* Description */}
      {permSet.metadata.description && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-600">{permSet.metadata.description}</p>
        </div>
      )}

      {/* User Assignments Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-900">User Assignments</h3>
        <p className="text-sm text-amber-700 mt-1">
          To see which users have this permission set assigned, run this SOQL:
        </p>
        <code className="block mt-2 p-2 bg-amber-100 rounded text-xs font-mono text-amber-800 overflow-x-auto">
          SELECT AssigneeId, Assignee.Name FROM PermissionSetAssignment WHERE PermissionSet.Name = '{permSet.api_name}'
        </code>
      </div>

      {/* System Permissions */}
      {userPermissions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">System Permissions ({userPermissions.length})</h2>
            <p className="text-sm text-gray-500 mt-1">Administrative and system-level permissions enabled</p>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {userPermissions.map((perm) => (
                <span key={perm} className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full">
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Application Access */}
      {applicationVisibilities.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">App Access ({applicationVisibilities.filter(a => a.visible).length} visible)</h2>
            <p className="text-sm text-gray-500 mt-1">Application visibility settings</p>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {applicationVisibilities.map((app) => (
                <span
                  key={app.application}
                  className={`px-3 py-1 text-sm rounded-full ${
                    app.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {app.application}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apex Class Access */}
      {classAccesses.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Apex Class Access ({classAccesses.length})</h2>
            <p className="text-sm text-gray-500 mt-1">Apex classes accessible to users with this permission set</p>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {classAccesses.map((ca) => (
                <Link
                  key={ca.apexClass}
                  href={`/apex/${encodeURIComponent(ca.apexClass)}`}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
                >
                  {ca.apexClass}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Visualforce Page Access */}
      {pageAccesses.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Visualforce Page Access ({pageAccesses.length})</h2>
            <p className="text-sm text-gray-500 mt-1">Visualforce pages accessible to users with this permission set</p>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {pageAccesses.map((pa) => (
                <span key={pa.apexPage} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
                  {pa.apexPage}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Settings */}
      {tabSettings.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Tab Settings ({tabSettings.length})</h2>
            <p className="text-sm text-gray-500 mt-1">Tab visibility settings</p>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {tabSettings.map((ts) => {
                const visClass = ts.visibility === 'Visible'
                  ? 'bg-green-100 text-green-700'
                  : ts.visibility === 'Available'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-500';
                return (
                  <span key={ts.tab} className={`px-3 py-1 text-sm rounded-full ${visClass}`}>
                    {ts.tab} ({ts.visibility || 'Hidden'})
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Record Type Visibilities */}
      {recordTypeVisibilities.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Record Type Visibilities ({recordTypeVisibilities.length})</h2>
            <p className="text-sm text-gray-500 mt-1">Record types visible to users</p>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {recordTypeVisibilities.map((rt) => (
                <span
                  key={rt.recordType}
                  className={`px-3 py-1 text-sm rounded-full ${
                    rt.visible
                      ? rt.default
                        ? 'bg-green-100 text-green-700 ring-2 ring-green-300'
                        : 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {rt.recordType}{rt.default && ' (Default)'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Object Permissions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Object Permissions ({objectPermissions.length})</h2>
          <p className="text-sm text-gray-500 mt-1">CRUD access granted to objects</p>
        </div>
        {objectPermissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Object</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Create</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Read</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Edit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Delete</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">View All</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Modify All</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fields</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {objectPermissions.map((op) => {
                  const details = objectDetails.get(op.object);
                  const objFields = fieldsByObject[op.object] || [];
                  return (
                    <tr key={op.object} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {details?.id ? (
                          <Link href={`/objects/${encodeURIComponent(op.object)}`} className="text-acs-blue hover:underline">
                            {details.label || op.object}
                          </Link>
                        ) : (
                          <span className="text-gray-900">{op.object}</span>
                        )}
                        <div className="text-xs text-gray-400 font-mono">{op.object}</div>
                      </td>
                      <td className="px-4 py-3 text-center"><CrudBadge label="C" enabled={op.allowCreate} /></td>
                      <td className="px-4 py-3 text-center"><CrudBadge label="R" enabled={op.allowRead} /></td>
                      <td className="px-4 py-3 text-center"><CrudBadge label="U" enabled={op.allowEdit} /></td>
                      <td className="px-4 py-3 text-center"><CrudBadge label="D" enabled={op.allowDelete} /></td>
                      <td className="px-4 py-3 text-center"><CrudBadge label="VA" enabled={op.viewAllRecords} /></td>
                      <td className="px-4 py-3 text-center"><CrudBadge label="MA" enabled={op.modifyAllRecords} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {objFields.length > 0 ? `${objFields.length} fields` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No explicit object permissions defined.
          </div>
        )}
      </div>

      {/* Field Permissions by Object */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Field Permissions ({fieldPermissions.length})</h2>
          <p className="text-sm text-gray-500 mt-1">Field-level security settings</p>
        </div>
        {Object.keys(fieldsByObject).length > 0 ? (
          <div className="divide-y divide-gray-200">
            {Object.entries(fieldsByObject).map(([objName, fields]) => {
              const details = objectDetails.get(objName);
              return (
                <div key={objName} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">📦</span>
                    {details?.id ? (
                      <Link href={`/objects/${encodeURIComponent(objName)}`} className="font-medium text-acs-blue hover:underline">
                        {details.label || objName}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">{objName}</span>
                    )}
                    <span className="text-sm text-gray-500">({fields.length} fields)</span>
                  </div>
                  <div className="ml-7 overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-xs text-gray-500 uppercase">
                          <th className="text-left py-1 pr-4">Field</th>
                          <th className="text-center py-1 px-2">Read</th>
                          <th className="text-center py-1 px-2">Edit</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {fields.map((fp) => (
                          <tr key={fp.field}>
                            <td className="py-1 pr-4 font-mono text-gray-700">{fp.field}</td>
                            <td className="py-1 px-2 text-center"><CrudBadge label="R" enabled={fp.readable} /></td>
                            <td className="py-1 px-2 text-center"><CrudBadge label="E" enabled={fp.editable} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No explicit field permissions defined.
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="text-sm text-gray-500">
        <span>Source file: </span>
        <span className="font-mono">{permSet.file_path}</span>
      </div>
    </div>
  );
}
