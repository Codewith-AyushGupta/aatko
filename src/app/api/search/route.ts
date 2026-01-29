import { NextRequest, NextResponse } from 'next/server';
import { searchNodes } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || undefined;

  if (!query.trim() && !type) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchNodes(query, 50, type);
  return NextResponse.json({ results });
}
