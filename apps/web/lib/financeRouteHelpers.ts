import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { canAccessPrivateWallet, resolveWalletActor, WalletActorContext } from '@/lib/walletAuth';
import { FinanceReceiptError } from '@/lib/receipts';
import { FinanceExportError } from '@/lib/financeExport';

export function financeErrorJson(err: any, fallbackMessage: string) {
  if (err instanceof FinanceReceiptError || err instanceof FinanceExportError) {
    return NextResponse.json(
      { success: false, errorCode: err.code, code: err.code, error: err.message },
      { status: err.status }
    );
  }
  const status = typeof err?.status === 'number' && err.status >= 400 ? err.status : 500;
  return NextResponse.json(
    {
      success: false,
      errorCode: err?.code || 'FINANCE_ERROR',
      code: err?.code || 'FINANCE_ERROR',
      error: err?.message || fallbackMessage,
    },
    { status }
  );
}

export async function resolveFinanceUserScope(req: NextRequest): Promise<
  | { ok: true; actor: WalletActorContext; targetUserId: string; isPreviewDemo: boolean }
  | { ok: false; response: NextResponse }
> {
  const actor = await resolveWalletActor(req);
  const url = new URL(req.url);
  const isPreviewDemo = url.searchParams.get('preview') === 'demo';
  const requestedUserId = (url.searchParams.get('userId') || '').trim();

  if (!actor.user) {
    if (isPreviewDemo) {
      if (requestedUserId && requestedUserId !== DEFAULT_DEMO_WALLET_USER_ID) {
        return {
          ok: false,
          response: NextResponse.json(
            {
              success: false,
              errorCode: 'FORBIDDEN_FINANCE_ACCESS',
              error: 'Preview mode only grants read access to the approved demo account.',
            },
            { status: 403 }
          ),
        };
      }
      return { ok: true, actor, targetUserId: DEFAULT_DEMO_WALLET_USER_ID, isPreviewDemo: true };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, errorCode: 'UNAUTHORIZED', error: 'Authentication required to access financial records.' },
        { status: 401 }
      ),
    };
  }

  const targetUserId = requestedUserId || actor.user.id;
  if (!canAccessPrivateWallet(actor, targetUserId, isPreviewDemo)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          errorCode: 'FORBIDDEN_FINANCE_ACCESS',
          error: 'Forbidden: You cannot access another user private financial history or receipts.',
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, actor, targetUserId, isPreviewDemo };
}

export async function requireAuthorizedFinanceAdmin(req: NextRequest): Promise<
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
          errorCode: 'FINANCE_ADMIN_REQUIRED',
          error: 'Forbidden: Only authorized finance_admin or super_admin roles may view reports or export finance records.',
        },
        { status: 403 }
      ),
    };
  }
  return { ok: true, actor };
}
