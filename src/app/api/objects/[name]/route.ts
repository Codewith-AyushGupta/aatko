import { NextRequest, NextResponse } from 'next/server';
import { getNodeByName, getChildNodes, getIncomingEdges, getOutgoingEdges } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    // Separate child types
    const fields = children.filter(c => c.type === 'Field');
    const recordTypes = children.filter(c => c.type === 'RecordType');
    const validationRules = children.filter(c => c.type === 'ValidationRule');

    // Group incoming edges by type
    const flows = incomingEdges.filter(e => e.node_type === 'Flow');
    const apex = incomingEdges.filter(e =>
      e.node_type === 'ApexClass' || e.node_type === 'ApexTrigger'
    );
    const layouts = incomingEdges.filter(e => e.node_type === 'Layout');
    const flexiPages = incomingEdges.filter(e => e.node_type === 'FlexiPage');

    // Related objects (lookups pointing TO this object and FROM this object)
    const relatedObjects = [
      ...outgoingEdges.filter(e =>
        ['LOOKUP_TO', 'MASTERDETAIL_TO', 'HIERARCHY_TO'].includes(e.edge_type)
      ).map(e => ({
        ...e,
        direction: 'outgoing',
        target_api_name: e.node_api_name
      })),
      ...incomingEdges.filter(e =>
        ['LOOKUP_TO', 'MASTERDETAIL_TO', 'HIERARCHY_TO'].includes(e.edge_type)
      ).map(e => ({
        ...e,
        direction: 'incoming',
        target_api_name: e.node_api_name
      }))
    ];

    return NextResponse.json({
      object,
      fields,
      recordTypes,
      validationRules,
      flows,
      apex,
      layouts,
      flexiPages,
      relatedObjects,
    });
  } catch (error) {
    console.error('Error fetching object:', error);
    return NextResponse.json(
      { error: 'Failed to fetch object data' },
      { status: 500 }
    );
  }
}
