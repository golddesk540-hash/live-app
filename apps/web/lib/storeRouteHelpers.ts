import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { resolveWalletActor, WalletActorContext } from '@/lib/walletAuth';
import { detectTamperedStoreKeys } from '@/lib/store';

export function storeErrorJson(err: any, fallbackMessage: string) {
  const status = typeof err?.status === 'number' && err.status >= 400 ? err.status : 500;
  return NextResponse.json(
    {
      success: false,
      errorCode: err?.code || 'STORE_ERROR',
      code: err?.code || 'STORE_ERROR',
      error: err?.message || fallbackMessage,
    },
    { status }
  );
}

export function rejectIfStoreTampered(body: Record<string, any> | null | undefined): NextResponse | null {
  const tamperedKey = detectTamperedStoreKeys(body);
  if (!tamperedKey) return null;
  return NextResponse.json(
    {
      success: false,
      errorCode: 'STORE_TAMPERING_FORBIDDEN',
      code: 'STORE_TAMPERING_FORBIDDEN',
      error: `Forbidden client field "${tamperedKey}": Store prices, balances, levels, durations, and equipment states are server-authoritative.`,
    },
    { status: 403 }
  );
}

export async function requireStoreFinanceAdmin(
  req: NextRequest
): Promise<
  | { ok: true; actor: WalletActorContext }
  | { ok: false; response: NextResponse }
> {
  const actor = await resolveWalletActor(req);
  if (!actor.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, errorCode: 'UNAUTHORIZED', error: 'Authentication required.' },
        { status: 401 }
      ),
    };
  }
  if (!actor.isFinanceAdmin) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          errorCode: 'STORE_ADMIN_REQUIRED',
          error: 'Forbidden: Authorized finance_admin or super_admin role required.',
        },
        { status: 403 }
      ),
    };
  }
  return { ok: true, actor };
}

export async function resolveStoreUserScope(
  req: NextRequest,
  requestedUserId?: string | null,
  options: { allowAnonymousNull?: boolean } = {}
): Promise<
  | { ok: true; actor: WalletActorContext; targetUserId: string | null; isPreviewDemo: boolean }
  | { ok: false; response: NextResponse }
> {
  const actor = await resolveWalletActor(req);
  const url = new URL(req.url);
  const preview = url.searchParams.get('preview') === 'demo';
  const reqTarget = (requestedUserId || url.searchParams.get('userId') || '').trim();

  if (!actor.user) {
    if (preview) {
      if (reqTarget && reqTarget !== DEFAULT_DEMO_WALLET_USER_ID) {
        return {
          ok: false,
          response: NextResponse.json(
            {
              success: false,
              errorCode: 'FORBIDDEN_STORE_ACCESS',
              error: 'Preview mode only permits demo user access.',
            },
            { status: 403 }
          ),
        };
      }
      return { ok: true, actor, targetUserId: DEFAULT_DEMO_WALLET_USER_ID, isPreviewDemo: true };
    }
    if (options.allowAnonymousNull) {
      return { ok: true, actor, targetUserId: null, isPreviewDemo: false };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, errorCode: 'UNAUTHORIZED', error: 'Please sign in to access the Virtual Store.' },
        { status: 401 }
      ),
    };
  }

  const targetUserId = reqTarget || actor.user.id;
  if (
    targetUserId !== actor.user.id &&
    targetUserId !== actor.user.poppo_id &&
    !actor.isFinanceAdmin
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          errorCode: 'FORBIDDEN_STORE_ACCESS',
          error: 'Forbidden: Cannot access or mutate another user\'s store inventory or wallet.',
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, actor, targetUserId, isPreviewDemo: false };
}
