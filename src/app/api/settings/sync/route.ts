import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, org } = body;

    if (!type || !org) {
      return NextResponse.json(
        { success: false, errors: ['Missing type or org parameter'] },
        { status: 400 }
      );
    }

    const projectRoot = path.resolve(process.cwd(), '..', '..');
    const indexerDir = path.join(projectRoot, 'packages', 'indexer');

    let command = '';
    switch (type) {
      case 'full':
        command = `npx tsx src/cli/sync.ts full -o ${org}`;
        break;
      case 'utilization':
        command = `npx tsx src/cli/sync.ts utilization -o ${org}`;
        break;
      case 'record-counts':
        command = `npx tsx src/cli/sync.ts record-counts -o ${org}`;
        break;
      default:
        return NextResponse.json(
          { success: false, errors: ['Invalid sync type'] },
          { status: 400 }
        );
    }

    console.log(`Running sync: ${command}`);

    try {
      const result = execSync(command, {
        cwd: indexerDir,
        encoding: 'utf-8',
        timeout: 600000, // 10 minutes
        maxBuffer: 50 * 1024 * 1024,
      });

      // Parse result for metrics
      const nodesMatch = result.match(/Nodes(?: updated)?:?\s*(\d+)/i);
      const edgesMatch = result.match(/Edges(?: updated)?:?\s*(\d+)/i);

      return NextResponse.json({
        success: true,
        nodesUpdated: nodesMatch ? parseInt(nodesMatch[1]) : 0,
        edgesUpdated: edgesMatch ? parseInt(edgesMatch[1]) : 0,
        output: result,
      });
    } catch (execError: any) {
      console.error('Sync command failed:', execError);
      return NextResponse.json({
        success: false,
        errors: [execError.message || 'Sync command failed'],
        output: execError.stdout || execError.stderr,
      });
    }
  } catch (error) {
    console.error('Sync request failed:', error);
    return NextResponse.json(
      { success: false, errors: ['Internal server error'] },
      { status: 500 }
    );
  }
}
