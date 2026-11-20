import { NextRequest, NextResponse } from 'next/server';
import { partyMediaService } from '@/lib/partyMediaService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/party/media/webhook
 * Inbound webhook receiver for Party Media SFU events with HMAC-SHA256 signature verification.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader =
      req.headers.get('x-party-signature') ||
      req.headers.get('x-popo-signature') ||
      req.headers.get('x-signature');

    const isValid = partyMediaService.verifyWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing webhook signature.', code: 'INVALID_SIGNATURE' },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload.', code: 'INVALID_PAYLOAD' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      event: payload.event,
      action: 'PROCESSED',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Party webhook error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
