import { NextRequest, NextResponse } from 'next/server';

/**
 * Logout endpoint - revokes Salesforce tokens and clears session
 */
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('sf_session')?.value;

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  // Attempt to revoke the token at Salesforce
  if (sessionCookie) {
    try {
      const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());

      if (sessionData.accessToken && sessionData.instanceUrl) {
        // Revoke the access token
        await fetch(`${sessionData.instanceUrl}/services/oauth2/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `token=${sessionData.accessToken}`,
        });
      }
    } catch (error) {
      // Log but don't fail - still clear local session
      console.error('Token revocation error:', error);
    }
  }

  // Clear the session cookie
  response.cookies.delete('sf_session');

  return response;
}

export async function GET(request: NextRequest) {
  // Redirect GET requests to settings after logout
  const response = NextResponse.redirect(new URL('/settings?message=logged_out', request.url));
  response.cookies.delete('sf_session');
  return response;
}
