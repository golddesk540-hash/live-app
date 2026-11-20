import { NextRequest, NextResponse } from 'next/server';
import { createAndSendOtp, verifyTermsGateCompliance } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const termsCheck = verifyTermsGateCompliance(req);
    if (!termsCheck.compliant) {
      return NextResponse.json(
        { error: termsCheck.error, code: 'TERMS_NOT_ACCEPTED' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { phone } = body;

    const trimmedPhone = (phone || '').replace(/[\s-]/g, '').trim();

    if (!trimmedPhone || !/^\+[1-9]\d{6,14}$/.test(trimmedPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number including country code (e.g. +92 300 1234567).' },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const result = await createAndSendOtp(trimmedPhone, clientIp);

    return NextResponse.json({
      success: true,
      message: result.message,
      cooldown: result.cooldown,
      ...(result.devOtp ? { devOtp: result.devOtp } : {}),
    });
  } catch (err: any) {
    const isRateLimit = err.message?.includes('wait') || err.message?.includes('Too many');
    const isProvider = err.code === 'SMS_PROVIDER_ERROR' || err.status === 502;
    const status = isRateLimit ? 429 : (isProvider ? 502 : 400);

    return NextResponse.json(
      { error: err.message || 'Failed to resend verification code. Please try again.' },
      { status }
    );
  }
}
