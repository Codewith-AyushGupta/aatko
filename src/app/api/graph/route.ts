import { NextRequest, NextResponse } from 'next/server';
import { getGraphData } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const nodeId = searchParams.get('node');
  const depth = parseInt(searchParams.get('depth') || '2', 10);

  if (!nodeId) {
    return NextResponse.json({ nodes: [], edges: [] });
  }

  const data = await getGraphData(parseInt(nodeId, 10), depth);
  return NextResponse.json(data);
}
