import { NextRequest, NextResponse } from 'next/server';

/**
 * Salesforce OAuth 2.0 Web Server Flow - Step 2: Token Exchange
 *
 * This endpoint handles the OAuth callback from Salesforce,
 * exchanges the authorization code for access tokens,
 * and establishes a session.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  const callbackUrl = process.env.SF_CALLBACK_URL;
  const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

  // Validate OAuth configuration
  if (!clientId || !clientSecret || !callbackUrl) {
    return NextResponse.redirect(
      new URL('/settings?error=oauth_not_configured', request.url)
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || '')}`, request.url)
    );
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?error=missing_code', request.url)
    );
  }

  // Validate state (CSRF protection)
  const storedState = request.cookies.get('sf_oauth_state')?.value;
  if (!state || state !== storedState) {
    console.error('OAuth state mismatch:', { received: state, expected: storedState });
    return NextResponse.redirect(
      new URL('/settings?error=invalid_state', request.url)
    );
  }

  // Check if sandbox
  const isSandbox = request.cookies.get('sf_is_sandbox')?.value === 'true';
  const effectiveLoginUrl = isSandbox ? 'https://test.salesforce.com' : loginUrl;

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`${effectiveLoginUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL(`/settings?error=token_exchange_failed&message=${encodeURIComponent(errorData.error_description || '')}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, instance_url, id } = tokenData;

    // Get user info from Salesforce
    const userInfoResponse = await fetch(id, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info');
      return NextResponse.redirect(
        new URL('/settings?error=user_info_failed', request.url)
      );
    }

    const userInfo = await userInfoResponse.json();

    // Create session response
    const response = NextResponse.redirect(
      new URL('/settings?success=connected', request.url)
    );

    // Store session data in encrypted cookie
    // In production, use a proper session store (Redis, database) and only store session ID in cookie
    const sessionData = {
      accessToken: access_token,
      refreshToken: refresh_token,
      instanceUrl: instance_url,
      userId: userInfo.user_id,
      username: userInfo.username,
      displayName: userInfo.display_name,
      orgId: userInfo.organization_id,
      isSandbox: isSandbox,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
    };

    // For security, in production this should be encrypted and/or stored server-side
    // This is a simplified implementation for demonstration
    response.cookies.set('sf_session', Buffer.from(JSON.stringify(sessionData)).toString('base64'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days (refresh token lifetime)
      path: '/',
    });

    // Clear OAuth state cookies
    response.cookies.delete('sf_oauth_state');
    response.cookies.delete('sf_is_sandbox');

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/settings?error=callback_error&message=${encodeURIComponent(String(error))}`, request.url)
    );
  }
}
