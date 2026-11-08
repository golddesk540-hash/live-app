import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generatePoppoId, createSession, setAuthSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider.toLowerCase();
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_auth_code', req.url));
  }

  // Verify CSRF state
  const stateCookie = req.cookies.get(`oauth_state_${provider}`)?.value;
  if (!stateCookie || stateCookie !== state) {
    return NextResponse.redirect(new URL('/login?error=invalid_oauth_state', req.url));
  }

  try {
    let providerUserId = '';
    let providerEmail: string | null = null;
    let providerName = '';
    let providerAvatar = '/avatars/default.png';

    if (provider === 'google') {
      const redirectUri = `${appUrl}/api/auth/callback/google`;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error_description || 'Failed to exchange Google OAuth code');
      }

      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await userRes.json();

      providerUserId = profile.sub;
      providerEmail = profile.email;
      providerName = profile.name || profile.given_name || 'Poppo Star';
      providerAvatar = profile.picture || providerAvatar;
    } else if (provider === 'facebook') {
      const redirectUri = `${appUrl}/api/auth/callback/facebook`;
      const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
      tokenUrl.searchParams.set('client_id', process.env.FACEBOOK_APP_ID || '');
      tokenUrl.searchParams.set('client_secret', process.env.FACEBOOK_APP_SECRET || '');
      tokenUrl.searchParams.set('redirect_uri', redirectUri);
      tokenUrl.searchParams.set('code', code);

      const tokenRes = await fetch(tokenUrl.toString());
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        throw new Error(tokenData.error?.message || 'Failed to exchange Facebook OAuth code');
      }

      const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`);
      const profile = await userRes.json();

      providerUserId = profile.id;
      providerEmail = profile.email || null;
      providerName = profile.name || 'Poppo Star';
      providerAvatar = profile.picture?.data?.url || providerAvatar;
    } else if (provider === 'apple') {
      // Apple OAuth handler placeholder
      providerUserId = `apple_${code.substring(0, 16)}`;
      providerName = 'Apple User';
    } else {
      return NextResponse.redirect(new URL('/login?error=unsupported_provider', req.url));
    }

    if (!providerUserId) {
      throw new Error('Failed to retrieve provider user identity');
    }

    // Check existing auth provider link
    const providerRows = await query(
      `SELECT user_id FROM popolive.auth_providers WHERE provider = $1 AND provider_user_id = $2 LIMIT 1`,
      [provider, providerUserId]
    );

    let userId: string;

    if (providerRows.length > 0) {
      userId = providerRows[0].user_id;
    } else {
      // Check if user with same email exists
      let existingUser: any = null;
      if (providerEmail) {
        const emailRows = await query(
          'SELECT id FROM popolive.users WHERE LOWER(email) = $1 LIMIT 1',
          [providerEmail.toLowerCase()]
        );
        if (emailRows.length > 0) {
          existingUser = emailRows[0];
        }
      }

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user
        const poppoId = await generatePoppoId();
        const userInsert = await query(
          `INSERT INTO popolive.users (
            poppo_id, email, nickname, avatar_url, is_adult_verified, status
          ) VALUES ($1, $2, $3, $4, true, 'active')
          RETURNING id`,
          [poppoId, providerEmail ? providerEmail.toLowerCase() : null, providerName, providerAvatar]
        );
        userId = userInsert[0].id;
      }

      // Link provider
      await query(
        `INSERT INTO popolive.auth_providers (user_id, provider, provider_user_id, provider_email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (provider, provider_user_id) DO NOTHING`,
        [userId, provider, providerUserId, providerEmail]
      );
    }

    // Create session
    const { sessionToken, expiresAt } = await createSession(userId, req, true);

    const res = NextResponse.redirect(new URL('/?auth=success', req.url));
    setAuthSessionCookie(res, sessionToken, expiresAt);

    // Clear state cookie
    res.cookies.set(`oauth_state_${provider}`, '', { path: '/', httpOnly: true, maxAge: 0 });

    return res;
  } catch (err: any) {
    console.error(`Error in OAuth callback for ${provider}:`, err);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message || 'OAuth verification failed')}`, req.url));
  }
}
