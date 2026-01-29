import { NextRequest, NextResponse } from 'next/server';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = execSync('sf org list --json', {
      encoding: 'utf-8',
      timeout: 30000,
    });

    const data = JSON.parse(result);

    if (data.status === 0 && data.result) {
      // Deduplicate orgs by username
      const seen = new Set<string>();
      const allOrgs = [
        ...(data.result.nonScratchOrgs || []),
        ...(data.result.sandboxes || []),
        ...(data.result.other || []),
      ].filter((org: any) => {
        if (seen.has(org.username)) return false;
        seen.add(org.username);
        return true;
      });

      // Check actual connection status for each org
      const orgs = await Promise.all(
        allOrgs.map(async (org: any) => {
          let connectedStatus = 'Unknown';
          let isSandbox = false;

          // Determine if sandbox based on instance URL
          if (org.instanceUrl) {
            isSandbox = org.instanceUrl.includes('.sandbox.') ||
                        org.instanceUrl.includes('test.salesforce.com') ||
                        org.instanceUrl.includes('.cs');
          }

          // Try to verify the connection is actually valid
          try {
            const displayResult = await execAsync(
              `sf org display -o ${org.alias || org.username} --json`,
              { timeout: 10000 }
            );
            const displayData = JSON.parse(displayResult.stdout);
            if (displayData.status === 0 && displayData.result?.accessToken) {
              connectedStatus = 'Connected';
            } else {
              connectedStatus = 'Expired';
            }
          } catch (e: any) {
            // If display fails, check the error message
            if (e.message?.includes('expired') || e.message?.includes('invalid')) {
              connectedStatus = 'Expired';
            } else if (org.connectedStatus) {
              connectedStatus = org.connectedStatus;
            } else {
              connectedStatus = 'Unknown';
            }
          }

          return {
            alias: org.alias || org.username,
            username: org.username,
            instanceUrl: org.instanceUrl,
            connectedStatus,
            isSandbox,
            orgType: isSandbox ? 'Sandbox' : 'Production',
          };
        })
      );

      return NextResponse.json({ orgs });
    }

    return NextResponse.json({ orgs: [] });
  } catch (error) {
    console.error('Failed to list orgs:', error);
    return NextResponse.json({ orgs: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { alias, isSandbox } = await request.json();

    if (!alias) {
      return NextResponse.json(
        { success: false, error: 'Missing alias parameter' },
        { status: 400 }
      );
    }

    const instanceUrl = isSandbox
      ? 'https://test.salesforce.com'
      : 'https://login.salesforce.com';

    // Generate the login command for the user
    // Note: We can't directly open a browser from the API, so we return the command
    const loginCommand = `sf org login web --alias ${alias} --instance-url ${instanceUrl}`;

    return NextResponse.json({
      success: true,
      loginCommand,
      message: `Run this command in your terminal to connect: ${loginCommand}`,
      instanceUrl,
    });
  } catch (error: any) {
    console.error('Failed to generate login command:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate login command' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { alias } = await request.json();

    if (!alias) {
      return NextResponse.json(
        { success: false, error: 'Missing alias parameter' },
        { status: 400 }
      );
    }

    // Logout the org
    execSync(`sf org logout -o ${alias} --no-prompt`, {
      encoding: 'utf-8',
      timeout: 30000,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to remove org:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove org' },
      { status: 500 }
    );
  }
}
