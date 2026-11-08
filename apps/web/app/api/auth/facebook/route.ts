import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyTermsGateCompliance } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const termsCheck = verifyTermsGateCompliance(req);
  if (!termsCheck.compliant) {
    return NextResponse.redirect(new URL('/login?error=terms_required', req.url));
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback/facebook`;

  if (!appId || !process.env.FACEBOOK_APP_SECRET) {
    return NextResponse.redirect(new URL('/login?error=provider_unconfigured&provider=Facebook', req.url));
  }

  const state = crypto.randomBytes(16).toString('hex');
  const fbAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  fbAuthUrl.searchParams.set('client_id', appId);
  fbAuthUrl.searchParams.set('redirect_uri', redirectUri);
  fbAuthUrl.searchParams.set('state', state);
  fbAuthUrl.searchParams.set('scope', 'email,public_profile');

  const res = NextResponse.redirect(fbAuthUrl.toString());
  res.cookies.set('oauth_state_facebook', state, { path: '/', httpOnly: true, maxAge: 600, sameSite: 'lax' });
  return res;
}
