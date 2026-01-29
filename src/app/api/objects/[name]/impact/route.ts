import { NextRequest, NextResponse } from 'next/server';
import { getNodeByName, getChildNodes, getIncomingEdges, getOutgoingEdges } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RetirementStep {
  order: number;
  category: string;
  type: string;
  name: string;
  action: string;
  description: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  link?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const objectName = decodeURIComponent(params.name);
    const object = await getNodeByName(objectName, 'Object');

    if (!object) {
      return NextResponse.json({ error: 'Object not found' }, { status: 404 });
    }

    const children = await getChildNodes(object.id);
    const incomingEdges = await getIncomingEdges(object.id);
    const outgoingEdges = await getOutgoingEdges(object.id);

    const fields = children.filter(c => c.type === 'Field');
    const recordTypes = children.filter(c => c.type === 'RecordType');
    const validationRules = children.filter(c => c.type === 'ValidationRule');

    const flows = incomingEdges.filter(e => e.node_type === 'Flow');
    const apexClasses = incomingEdges.filter(e => e.node_type === 'ApexClass');
    const apexTriggers = incomingEdges.filter(e => e.node_type === 'ApexTrigger');
    const layouts = incomingEdges.filter(e => e.node_type === 'Layout');
    const flexipages = incomingEdges.filter(e => e.node_type === 'FlexiPage');
    const reports = incomingEdges.filter(e => e.node_type === 'Report');
    const dashboards = incomingEdges.filter(e => e.node_type === 'Dashboard');
    const permSets = incomingEdges.filter(e => e.node_type === 'PermissionSet' || e.node_type === 'Profile');

    // Build retirement steps
    const steps: RetirementStep[] = [];
    let stepOrder = 1;

    // Step 1: Deactivate Triggers (highest priority - they fire on DML)
    for (const trigger of apexTriggers) {
      steps.push({
        order: stepOrder++,
        category: 'Apex',
        type: 'Trigger',
        name: trigger.node_api_name,
        action: 'Deactivate or delete this trigger',
        description: 'Triggers execute automatically on record changes. Must be deactivated first.',
        risk: 'critical',
        link: `/apex/${trigger.node_api_name}`,
      });
    }

    // Step 2: Deactivate Flows
    for (const flow of flows) {
      steps.push({
        order: stepOrder++,
        category: 'Flows',
        type: 'Flow',
        name: flow.node_api_name,
        action: 'Deactivate this flow',
        description: 'Flow references this object. Deactivate to prevent runtime errors.',
        risk: 'high',
        link: `/flows/${flow.node_api_name}`,
      });
    }

    // Step 3: Update Apex Classes
    for (const apex of apexClasses) {
      const isTest = apex.node_api_name.toLowerCase().includes('test');
      steps.push({
        order: stepOrder++,
        category: 'Apex',
        type: isTest ? 'Test Class' : 'Class',
        name: apex.node_api_name,
        action: `Update or remove references to ${objectName}`,
        description: isTest
          ? 'Test class - may fail after object removal. Update or delete.'
          : 'Apex class references this object. Remove or update the code.',
        risk: isTest ? 'medium' : 'high',
        link: `/apex/${apex.node_api_name}`,
      });
    }

    // Step 4: Update Validation Rules
    for (const rule of validationRules) {
      steps.push({
        order: stepOrder++,
        category: 'Validation Rules',
        type: 'Validation Rule',
        name: rule.api_name,
        action: 'Delete this validation rule',
        description: 'Validation rule on this object - will be deleted with object.',
        risk: 'low',
      });
    }

    // Step 5: Remove Layouts
    for (const layout of layouts) {
      steps.push({
        order: stepOrder++,
        category: 'Layouts',
        type: 'Layout',
        name: layout.node_api_name,
        action: 'Layout will be removed with object',
        description: 'Page layout for this object.',
        risk: 'low',
      });
    }

    // Step 6: Update Lightning Pages
    for (const page of flexipages) {
      steps.push({
        order: stepOrder++,
        category: 'Layouts',
        type: 'Lightning Page',
        name: page.node_api_name,
        action: 'Update or remove this Lightning page',
        description: 'FlexiPage references this object. May need to be updated.',
        risk: 'medium',
      });
    }

    // Step 7: Update Reports
    for (const report of reports) {
      steps.push({
        order: stepOrder++,
        category: 'Reports',
        type: 'Report',
        name: report.node_api_name,
        action: 'Delete or update this report',
        description: 'Report uses this object as a data source.',
        risk: 'medium',
      });
    }

    // Step 8: Update Dashboards
    for (const dashboard of dashboards) {
      steps.push({
        order: stepOrder++,
        category: 'Reports',
        type: 'Dashboard',
        name: dashboard.node_api_name,
        action: 'Update dashboard components',
        description: 'Dashboard may have components using this object.',
        risk: 'medium',
      });
    }

    // Step 9: Update Permission Sets
    for (const perm of permSets) {
      steps.push({
        order: stepOrder++,
        category: 'Permissions',
        type: perm.node_type,
        name: perm.node_api_name,
        action: 'Permissions will auto-remove with object',
        description: 'Object permissions - will be removed automatically.',
        risk: 'low',
      });
    }

    // Step 10: Record Types (informational)
    for (const rt of recordTypes) {
      steps.push({
        order: stepOrder++,
        category: 'Record Types',
        type: 'Record Type',
        name: rt.api_name,
        action: 'Record type will be deleted with object',
        description: 'Record type configuration for this object.',
        risk: 'low',
      });
    }

    // Calculate risk level
    const hasApexTriggers = apexTriggers.length > 0;
    const hasApexClasses = apexClasses.length > 0;
    const hasFlows = flows.length > 0;
    const totalDependents = incomingEdges.length;

    let riskLevel = 'low';
    if (hasApexTriggers || totalDependents > 20) {
      riskLevel = 'critical';
    } else if (hasApexClasses && hasFlows) {
      riskLevel = 'high';
    } else if (hasApexClasses || hasFlows || totalDependents > 5) {
      riskLevel = 'medium';
    }

    return NextResponse.json({
      object,
      fields,
      directDependents: incomingEdges,
      transitiveDependents: [], // Would need deeper graph traversal
      retirementSteps: steps,
      riskLevel,
      totalImpact: steps.length + fields.length,
    });
  } catch (error) {
    console.error('Error analyzing impact:', error);
    return NextResponse.json(
      { error: 'Failed to analyze impact' },
      { status: 500 }
    );
  }
}
