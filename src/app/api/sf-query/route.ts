import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type');

  if (!query && !type) {
    return NextResponse.json({ error: 'Query or type parameter required' }, { status: 400 });
  }

  try {
    let soql = query;

    // Pre-built queries for common types
    if (type && !query) {
      switch (type) {
        case 'fields':
          const objectName = searchParams.get('object') || 'Account';
          soql = `SELECT QualifiedApiName, DataType, Label, Description, IsCustom FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = '${objectName}' ORDER BY QualifiedApiName`;
          break;
        case 'flows':
          // FlowDefinitionView has limited fields - use FlowVersionView for more details
          soql = `SELECT Id, DurableId, ApiName, Label, Description, ProcessType, TriggerType, Status, VersionNumber FROM FlowDefinitionView ORDER BY Label`;
          break;
        case 'flowsWithAudit':
          // Query Flow table for audit info (needs Tooling API)
          soql = `SELECT Id, MasterLabel, ApiVersion, Description, ProcessType, Status, CreatedDate, CreatedById, LastModifiedDate, LastModifiedById FROM Flow ORDER BY MasterLabel`;
          break;
        case 'apexClasses':
          soql = `SELECT Id, Name, ApiVersion, Status, CreatedDate, CreatedBy.Name, LastModifiedDate, LastModifiedBy.Name FROM ApexClass ORDER BY Name`;
          break;
        case 'apexTriggers':
          soql = `SELECT Id, Name, TableEnumOrId, ApiVersion, Status, CreatedDate, CreatedBy.Name, LastModifiedDate, LastModifiedBy.Name FROM ApexTrigger ORDER BY Name`;
          break;
        case 'objects':
          soql = `SELECT DurableId, QualifiedApiName, Label, Description, IsCustom, KeyPrefix, DeploymentStatus FROM EntityDefinition WHERE IsCustomizable = true ORDER BY Label LIMIT 300`;
          break;
        case 'profiles':
          soql = `SELECT Id, Name, Description, CreatedDate, CreatedBy.Name, LastModifiedDate, LastModifiedBy.Name FROM Profile ORDER BY Name`;
          break;
        case 'permissionSets':
          soql = `SELECT Id, Name, Label, Description, IsCustom, CreatedDate, CreatedBy.Name, LastModifiedDate, LastModifiedBy.Name FROM PermissionSet WHERE IsOwnedByProfile = false ORDER BY Label`;
          break;
        case 'lwc':
          // LightningComponentBundle for LWC metadata with audit info
          soql = `SELECT Id, DeveloperName, MasterLabel, Description, ApiVersion, CreatedDate, CreatedById, LastModifiedDate, LastModifiedById FROM LightningComponentBundle ORDER BY DeveloperName`;
          break;
        default:
          return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
      }
    }

    // Use Tooling API for certain queries
    const useToolingApi = type === 'flowsWithAudit' || type === 'lwc';
    const apiFlag = useToolingApi ? '-t' : '';

    // Use PowerShell on Windows for proper path handling
    const isWindows = process.platform === 'win32';
    const escapedSoql = soql?.replace(/'/g, "''") || '';
    const cmd = isWindows
      ? `powershell -Command "sf data query -q '${escapedSoql}' ${apiFlag} -o aa-sandbox --json"`
      : `sf data query -q '${escapedSoql}' ${apiFlag} -o aa-sandbox --json`;

    const result = execSync(cmd, {
      encoding: 'utf-8',
      timeout: 120000,
      shell: isWindows ? undefined : '/bin/bash',
    });

    // Extract JSON from result (skip any warning lines)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON response from Salesforce CLI');
    }
    const data = JSON.parse(jsonMatch[0]);

    if (data.status === 0 && data.result) {
      return NextResponse.json({
        records: data.result.records || [],
        totalSize: data.result.totalSize || 0,
      });
    }

    return NextResponse.json({ records: [], totalSize: 0 });
  } catch (error: any) {
    console.error('SF Query failed:', error.message);
    // Try to extract error details - execSync puts output in stdout property on error
    let errorOutput = error.stdout || error.stderr || error.message || 'Unknown error';

    // Try to parse JSON error from CLI output
    try {
      const jsonMatch = errorOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const errorData = JSON.parse(jsonMatch[0]);
        if (errorData.message) {
          errorOutput = errorData.message;
        }
      }
    } catch (e) {
      // Keep original error output
    }

    return NextResponse.json({
      error: 'Query failed',
      message: String(errorOutput).substring(0, 500),
      records: [],
      totalSize: 0
    }, { status: 500 });
  }
}
