import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const facebookConfigured = Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
  const appleConfigured = Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID);
  const phoneSmsConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

  return NextResponse.json({
    emailPassword: true,
    phoneOtp: true,
    phoneSmsLive: phoneSmsConfigured, // If false, dev OTP simulation is active
    social: {
      google: {
        configured: googleConfigured,
        name: 'Google',
        requiredEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
        callbackUrl: '/api/auth/callback/google',
      },
      facebook: {
        configured: facebookConfigured,
        name: 'Facebook',
        requiredEnv: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
        callbackUrl: '/api/auth/callback/facebook',
      },
      apple: {
        configured: appleConfigured,
        name: 'Apple',
        requiredEnv: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'],
        callbackUrl: '/api/auth/callback/apple',
      },
    },
  });
}
