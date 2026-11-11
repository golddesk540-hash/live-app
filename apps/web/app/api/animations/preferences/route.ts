import { NextRequest, NextResponse } from 'next/server';
import {
  getUserAnimationPreferences,
  updateUserAnimationPreferences,
} from '@/lib/animations';
import { resolveGiftSenderAccess, resolveWalletActor } from '@/lib/walletAuth';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reqUserId = searchParams.get('userId');
    const isPreviewDemo = searchParams.get('preview') === 'demo';
    const actor = await resolveWalletActor(req);

    const targetId =
      actor.user?.id ||
      reqUserId ||
      (isPreviewDemo ? DEFAULT_DEMO_WALLET_USER_ID : '');

    if (!targetId) {
      return NextResponse.json(
        {
          success: true,
          preferences: await getUserAnimationPreferences('anonymous'),
        },
        { status: 200 }
      );
    }

    const preferences = await getUserAnimationPreferences(targetId);
    return NextResponse.json({ success: true, preferences });
  } catch (err: any) {
    console.error('GET /api/animations/preferences error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch animation preferences.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
    }

    const isPreviewDemo = searchParams.get('preview') === 'demo' || body.preview === 'demo';
    const access = await resolveGiftSenderAccess(req, body.userId, isPreviewDemo);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.message, code: access.errorCode },
        { status: access.statusCode }
      );
    }

    const preferences = await updateUserAnimationPreferences({
      userId: access.senderUserId,
      enableLargeAnimations: body.enableLargeAnimations,
      enableSoundEffects: body.enableSoundEffects,
      reduceAnimations: body.reduceAnimations,
      respectDeviceReducedMotion: body.respectDeviceReducedMotion,
    });

    return NextResponse.json({ success: true, preferences });
  } catch (err: any) {
    console.error('PUT /api/animations/preferences error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update animation preferences.' },
      { status: 500 }
    );
  }
}
