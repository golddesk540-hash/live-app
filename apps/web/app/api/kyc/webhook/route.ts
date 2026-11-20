import { NextRequest, NextResponse } from 'next/server';
import { webKycPayoutService } from '@/lib/kycPayoutService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const signature =
      req.headers.get('persona-signature') ||
      req.headers.get('x-kyc-signature') ||
      req.headers.get('x-signature');

    const body = await req.json().catch(() => ({}));
    const { eventId, userId, verificationId, eventType, legalName, documentCountry, rejectionReason } = body;

    if (!eventId || !userId || !verificationId || !eventType) {
      return NextResponse.json(
        { success: false, error: 'eventId, userId, verificationId, and eventType are required.' },
        { status: 400 }
      );
    }

    const result = await webKycPayoutService.handleKycWebhook({
      eventId,
      userId,
      verificationId,
      eventType,
      legalName,
      documentCountry,
      rejectionReason,
      signature: signature || body.signature,
      timestamp: new Date().toISOString(),
    });

    if (!result.handled) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to process KYC webhook.' },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      deduplicated: result.deduplicated || false,
      kycRecord: result.kycRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'KYC webhook processing failed.' },
      { status: 500 }
    );
  }
}
