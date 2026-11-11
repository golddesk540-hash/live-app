import { NextRequest, NextResponse } from 'next/server';
import { triggerSandboxProviderAction } from '@/lib/topup';
import { resolveWalletActor } from '@/lib/walletAuth';

export const dynamic = 'force-dynamic';

// Authorized Sandbox Provider Simulator (strictly restricted to providerKey === 'sandbox_verified').
// Internally signs a cryptographic HMAC webhook payload and dispatches through handleTopupWebhook.
export async function POST(req: NextRequest) {
  try {
    const actor = await resolveWalletActor(req);
    const isPreviewDemo = req.nextUrl.searchParams.get('preview') === 'demo';
    const body = await req.json().catch(() => ({}));

    const orderId = String(body.orderId || '').trim();
    const outcome = String(body.outcome || 'succeeded').trim() as
      | 'succeeded'
      | 'failed'
      | 'pending'
      | 'cancelled';

    if (!orderId || !['succeeded', 'failed', 'pending', 'cancelled'].includes(outcome)) {
      return NextResponse.json(
        { success: false, error: 'Valid orderId and sandbox outcome required.' },
        { status: 400 }
      );
    }

    const res = await triggerSandboxProviderAction({
      orderId,
      actor,
      isPreviewDemo,
      outcome,
      failureReason: body.failureReason ? String(body.failureReason) : undefined,
    });

    return NextResponse.json(res, { status: res.statusCode });
  } catch (err: any) {
    console.error('POST /api/topup/sandbox/complete error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Sandbox provider action failed.' },
      { status: 500 }
    );
  }
}
