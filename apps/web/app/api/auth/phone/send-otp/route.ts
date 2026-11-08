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

    // Validate international format e.g. +923001234567
    if (!trimmedPhone || !/^\+[1-9]\d{6,14}$/.test(trimmedPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number including country code (e.g. +92 300 1234567).' },
        { status: 400 }
      );
    }

    const result = await createAndSendOtp(trimmedPhone);

    return NextResponse.json({
      success: true,
      message: result.message,
      cooldown: result.cooldown,
    });
  } catch (err: any) {
    console.error('Error in send-otp:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to send verification code. Please try again.' },
      { status: 400 }
    );
  }
}
