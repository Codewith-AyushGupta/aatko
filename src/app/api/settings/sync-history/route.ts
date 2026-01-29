import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const historyPath = path.resolve(
      process.cwd(), '..', '..', 'packages', 'indexer', 'data', 'sync-history.json'
    );

    if (!fs.existsSync(historyPath)) {
      return NextResponse.json({ history: [] });
    }

    const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Failed to read sync history:', error);
    return NextResponse.json({ history: [] });
  }
}
