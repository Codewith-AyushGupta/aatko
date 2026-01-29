import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface SecurityResult {
  profilesWithModifyAll: number;
  permissionSetsWithModifyAll: number;
  flowsRunAsSystem: number;
  apexWithoutSharing: number;
  publicObjects: number;
  fieldsWithoutFLS: number;
  totalProfiles: number;
  totalPermissionSets: number;
  totalFlows: number;
  totalApexClasses: number;
  totalObjects: number;
  details: {
    highPrivilegeProfiles: string[];
    highPrivilegePermSets: string[];
    systemFlows: string[];
    unsecureApex: string[];
  };
}

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const result: SecurityResult = {
      profilesWithModifyAll: 0,
      permissionSetsWithModifyAll: 0,
      flowsRunAsSystem: 0,
      apexWithoutSharing: 0,
      publicObjects: 0,
      fieldsWithoutFLS: 0,
      totalProfiles: 0,
      totalPermissionSets: 0,
      totalFlows: 0,
      totalApexClasses: 0,
      totalObjects: 0,
      details: {
        highPrivilegeProfiles: [],
        highPrivilegePermSets: [],
        systemFlows: [],
        unsecureApex: [],
      },
    };

    // Get totals
    const totalsResult = db.exec(`
      SELECT type, COUNT(*) as count FROM nodes
      WHERE type IN ('Profile', 'PermissionSet', 'Flow', 'ApexClass', 'Object')
      GROUP BY type
    `);

    (totalsResult[0]?.values || []).forEach((row: any) => {
      const type = row[0] as string;
      const count = row[1] as number;
      if (type === 'Profile') result.totalProfiles = count;
      if (type === 'PermissionSet') result.totalPermissionSets = count;
      if (type === 'Flow') result.totalFlows = count;
      if (type === 'ApexClass') result.totalApexClasses = count;
      if (type === 'Object') result.totalObjects = count;
    });

    // Check profiles for ModifyAll/ViewAll permissions
    const profilesResult = db.exec(`
      SELECT api_name, metadata_json FROM nodes WHERE type = 'Profile'
    `);

    (profilesResult[0]?.values || []).forEach((row: any) => {
      const apiName = row[0] as string;
      const metadataJson = row[1] as string | null;
      if (metadataJson) {
        try {
          const metadata = JSON.parse(metadataJson);
          // Check for admin-level permissions
          if (metadata.userPermissions) {
            const hasModifyAll = metadata.userPermissions.some((p: any) =>
              (p.name === 'ModifyAllData' || p.name === 'ViewAllData') && p.enabled
            );
            if (hasModifyAll) {
              result.profilesWithModifyAll++;
              result.details.highPrivilegeProfiles.push(apiName);
            }
          }
        } catch {
          // Invalid JSON
        }
      }
    });

    // Check permission sets for high privileges
    const permSetsResult = db.exec(`
      SELECT api_name, metadata_json FROM nodes WHERE type = 'PermissionSet'
    `);

    (permSetsResult[0]?.values || []).forEach((row: any) => {
      const apiName = row[0] as string;
      const metadataJson = row[1] as string | null;
      if (metadataJson) {
        try {
          const metadata = JSON.parse(metadataJson);
          if (metadata.userPermissions) {
            const hasModifyAll = metadata.userPermissions.some((p: any) =>
              (p.name === 'ModifyAllData' || p.name === 'ViewAllData') && p.enabled
            );
            if (hasModifyAll) {
              result.permissionSetsWithModifyAll++;
              result.details.highPrivilegePermSets.push(apiName);
            }
          }
        } catch {
          // Invalid JSON
        }
      }
    });

    // Check flows running as system context
    const flowsResult = db.exec(`
      SELECT api_name, metadata_json FROM nodes WHERE type = 'Flow'
    `);

    (flowsResult[0]?.values || []).forEach((row: any) => {
      const apiName = row[0] as string;
      const metadataJson = row[1] as string | null;
      if (metadataJson) {
        try {
          const metadata = JSON.parse(metadataJson);
          // Check for system mode or runInMode = SystemModeWithoutSharing
          if (metadata.runInMode === 'SystemModeWithoutSharing' ||
              metadata.runInMode === 'SystemModeWithSharing') {
            result.flowsRunAsSystem++;
            result.details.systemFlows.push(apiName);
          }
        } catch {
          // Invalid JSON
        }
      }
    });

    // Check Apex classes for "without sharing"
    const apexResult = db.exec(`
      SELECT api_name, metadata_json FROM nodes WHERE type = 'ApexClass'
    `);

    (apexResult[0]?.values || []).forEach((row: any) => {
      const apiName = row[0] as string;
      const metadataJson = row[1] as string | null;
      if (metadataJson) {
        try {
          const metadata = JSON.parse(metadataJson);
          // Check for without sharing keyword in class body or metadata
          if (metadata.body?.toLowerCase().includes('without sharing') ||
              metadata.sharingModel === 'WithoutSharing') {
            result.apexWithoutSharing++;
            result.details.unsecureApex.push(apiName);
          }
        } catch {
          // Invalid JSON
        }
      }
    });

    // Check for objects with public sharing model
    const objectsResult = db.exec(`
      SELECT api_name, metadata_json FROM nodes WHERE type = 'Object'
    `);

    (objectsResult[0]?.values || []).forEach((row: any) => {
      const metadataJson = row[1] as string | null;
      if (metadataJson) {
        try {
          const metadata = JSON.parse(metadataJson);
          if (metadata.sharingModel === 'ReadWrite' ||
              metadata.sharingModel === 'Read' ||
              metadata.externalSharingModel === 'ReadWrite') {
            result.publicObjects++;
          }
        } catch {
          // Invalid JSON
        }
      }
    });

    db.close();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Security check error:', error);
    return NextResponse.json({ error: 'Failed to run security check' }, { status: 500 });
  }
}
