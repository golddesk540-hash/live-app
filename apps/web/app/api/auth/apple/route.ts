import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyTermsGateCompliance } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const termsCheck = verifyTermsGateCompliance(req);
  if (!termsCheck.compliant) {
    return NextResponse.redirect(new URL('/login?error=terms_required', req.url));
  }

  const clientId = process.env.APPLE_CLIENT_ID;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback/apple`;

  if (!clientId || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID) {
    return NextResponse.redirect(new URL('/login?error=provider_unconfigured&provider=Apple', req.url));
  }

  const state = crypto.randomBytes(16).toString('hex');
  const appleAuthUrl = new URL('https://appleid.apple.com/auth/authorize');
  appleAuthUrl.searchParams.set('client_id', clientId);
  appleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  appleAuthUrl.searchParams.set('response_type', 'code id_token');
  appleAuthUrl.searchParams.set('state', state);
  appleAuthUrl.searchParams.set('scope', 'name email');
  appleAuthUrl.searchParams.set('response_mode', 'form_post');

  const res = NextResponse.redirect(appleAuthUrl.toString());
  res.cookies.set('oauth_state_apple', state, { path: '/', httpOnly: true, maxAge: 600, sameSite: 'lax' });
  return res;
}
