import { NextRequest, NextResponse } from 'next/server';
import { mediaService } from '@/lib/mediaService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/stream/webhook
 * Inbound webhook receiver for Media Provider events (stream.started, stream.ended, stream.failed).
 * Enforces HMAC-SHA256 signature verification.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader =
      req.headers.get('x-popo-signature') ||
      req.headers.get('x-provider-signature') ||
      req.headers.get('x-signature');

    // 1. Verify Webhook Signature
    const isValid = mediaService.verifyWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing webhook signature.', code: 'INVALID_SIGNATURE' },
        { status: 401 }
      );
    }

    // 2. Parse event payload
    let eventPayload: any;
    try {
      eventPayload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Malformed JSON payload.', code: 'INVALID_PAYLOAD' },
        { status: 400 }
      );
    }

    // 3. Process stream lifecycle transition
    const handleResult = await mediaService.handleWebhook(eventPayload);

    return NextResponse.json({
      success: true,
      action: handleResult.action,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Stream webhook error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
