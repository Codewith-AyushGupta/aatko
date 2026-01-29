import { NextRequest, NextResponse } from 'next/server';

/**
 * Get current OAuth session information
 *
 * Returns the current user's session if authenticated,
 * or indicates that OAuth is not configured/user is not logged in.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.SF_CLIENT_ID;
  const oauthConfigured = !!clientId;

  // Check for OAuth session
  const sessionCookie = request.cookies.get('sf_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({
      authenticated: false,
      oauthConfigured,
      message: oauthConfigured
        ? 'Not logged in. Use /api/auth/login to authenticate.'
        : 'OAuth not configured. Using Salesforce CLI for authentication.',
    });
  }

  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());

    // Check if session is expired
    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
      // Attempt token refresh
      const refreshResult = await refreshToken(sessionData.refreshToken, sessionData.instanceUrl);

      if (!refreshResult) {
        // Clear expired session
        const response = NextResponse.json({
          authenticated: false,
          oauthConfigured: true,
          message: 'Session expired. Please log in again.',
        });
        response.cookies.delete('sf_session');
        return response;
      }

      // Update session with new access token
      sessionData.accessToken = refreshResult.access_token;
      sessionData.expiresAt = Date.now() + 2 * 60 * 60 * 1000;

      const response = NextResponse.json({
        authenticated: true,
        oauthConfigured: true,
        user: {
          username: sessionData.username,
          displayName: sessionData.displayName,
          orgId: sessionData.orgId,
          instanceUrl: sessionData.instanceUrl,
          isSandbox: sessionData.isSandbox,
        },
      });

      response.cookies.set('sf_session', Buffer.from(JSON.stringify(sessionData)).toString('base64'), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    return NextResponse.json({
      authenticated: true,
      oauthConfigured: true,
      user: {
        username: sessionData.username,
        displayName: sessionData.displayName,
        orgId: sessionData.orgId,
        instanceUrl: sessionData.instanceUrl,
        isSandbox: sessionData.isSandbox,
      },
    });
  } catch (error) {
    console.error('Session parse error:', error);
    const response = NextResponse.json({
      authenticated: false,
      oauthConfigured,
      message: 'Invalid session. Please log in again.',
    });
    response.cookies.delete('sf_session');
    return response;
  }
}

async function refreshToken(refreshToken: string, instanceUrl: string): Promise<{ access_token: string } | null> {
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${instanceUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      console.error('Token refresh failed');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}
