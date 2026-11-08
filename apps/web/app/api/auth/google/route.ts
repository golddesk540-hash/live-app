import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyTermsGateCompliance } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Check terms compliance first
  const termsCheck = verifyTermsGateCompliance(req);
  if (!termsCheck.compliant) {
    return NextResponse.redirect(new URL('/login?error=terms_required', req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/login?error=provider_unconfigured&provider=Google', req.url));
  }

  const state = crypto.randomBytes(16).toString('hex');
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  const res = NextResponse.redirect(googleAuthUrl.toString());
  res.cookies.set('oauth_state_google', state, { path: '/', httpOnly: true, maxAge: 600, sameSite: 'lax' });
  return res;
}
