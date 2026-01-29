import { NextRequest, NextResponse } from 'next/server';

/**
 * Salesforce OAuth 2.0 Web Server Flow - Step 1: Authorization
 *
 * This endpoint redirects the user to Salesforce's authorization page.
 *
 * Required environment variables:
 * - SF_CLIENT_ID: Connected App Consumer Key
 * - SF_CALLBACK_URL: OAuth callback URL
 * - SF_LOGIN_URL: https://login.salesforce.com or https://test.salesforce.com
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.SF_CLIENT_ID;
  const callbackUrl = process.env.SF_CALLBACK_URL;
  const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

  // Check if OAuth is configured
  if (!clientId || !callbackUrl) {
    return NextResponse.json(
      {
        error: 'OAuth not configured',
        message: 'SF_CLIENT_ID and SF_CALLBACK_URL environment variables are required',
        setupInstructions: {
          step1: 'Create a Connected App in Salesforce Setup',
          step2: 'Set SF_CLIENT_ID, SF_CLIENT_SECRET, SF_CALLBACK_URL, and SF_LOGIN_URL in .env.local',
          step3: 'Restart the application',
        },
      },
      { status: 503 }
    );
  }

  // Check query params for org type
  const searchParams = request.nextUrl.searchParams;
  const isSandbox = searchParams.get('sandbox') === 'true';
  const effectiveLoginUrl = isSandbox ? 'https://test.salesforce.com' : loginUrl;

  // Generate state parameter for CSRF protection
  const state = crypto.randomUUID();

  // Store state in a cookie for validation on callback
  const response = NextResponse.redirect(
    `${effectiveLoginUrl}/services/oauth2/authorize?` +
      new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: callbackUrl,
        scope: 'api refresh_token',
        state: state,
        prompt: 'login consent', // Force re-authentication
      }).toString()
  );

  // Set state cookie (HttpOnly, Secure in production)
  response.cookies.set('sf_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  // Store sandbox preference for callback
  response.cookies.set('sf_is_sandbox', isSandbox ? 'true' : 'false', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
