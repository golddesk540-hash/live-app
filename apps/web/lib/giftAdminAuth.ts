import { NextRequest, NextResponse } from 'next/server';
import { resolveWalletActor, WalletActorContext } from '@/lib/walletAuth';
import { isAuthorizedGiftAdmin } from '@/lib/giftCatalog';

export async function requireGiftAdmin(
  req: NextRequest
): Promise<{ ok: true; actor: WalletActorContext } | { ok: false; response: NextResponse }> {
  const actor = await resolveWalletActor(req);
  if (!actor.user || !isAuthorizedGiftAdmin(actor.actorRole)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Only authorized administrators may manage the Gift Catalog.',
          code: 'ADMIN_ACCESS_REQUIRED',
        },
        { status: 403 }
      ),
    };
  }
  return { ok: true, actor };
}
