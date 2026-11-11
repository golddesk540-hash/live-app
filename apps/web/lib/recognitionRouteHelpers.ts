import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_DEMO_WALLET_USER_ID } from '@/lib/wallet';
import { resolveWalletActor, WalletActorContext } from '@/lib/walletAuth';
import { detectTamperedRecognitionKeys } from '@/lib/recognition';

export function recognitionErrorJson(err: any, fallbackMessage: string) {
  const status = typeof err?.status === 'number' && err.status >= 400 ? err.status : 500;
  return NextResponse.json(
    {
      success: false,
      errorCode: err?.code || 'RECOGNITION_ERROR',
      error: err?.message || fallbackMessage,
    },
    { status }
  );
}

export async function requireRecognitionFinanceAdmin(
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
          errorCode: 'RECOGNITION_ADMIN_REQUIRED',
          error: 'Forbidden: Authorized finance_admin or super_admin role required.',
        },
        { status: 403 }
      ),
    };
  }
  return { ok: true, actor };
}

export async function resolveRecognitionUserScope(
  req: NextRequest,
  requestedUserId?: string | null
): Promise<
  | { ok: true; actor: WalletActorContext; targetUserId: string; isPreviewDemo: boolean }
  | { ok: false; response: NextResponse }
> {
  const actor = await resolveWalletActor(req);
  const url = new URL(req.url);
  const preview = url.searchParams.get('preview') === 'demo';
  const reqTarget = (requestedUserId || url.searchParams.get('userId') || '').trim();

  if (!actor.user) {
    if (preview) {
      const demoId = reqTarget && reqTarget === DEFAULT_DEMO_WALLET_USER_ID ? reqTarget : DEFAULT_DEMO_WALLET_USER_ID;
      if (reqTarget && reqTarget !== DEFAULT_DEMO_WALLET_USER_ID) {
        return {
          ok: false,
          response: NextResponse.json(
            {
              success: false,
              errorCode: 'FORBIDDEN_RECOGNITION_ACCESS',
              error: 'Preview mode only permits demo user access.',
            },
            { status: 403 }
          ),
        };
      }
      return { ok: true, actor, targetUserId: demoId, isPreviewDemo: true };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, errorCode: 'UNAUTHORIZED', error: 'Please sign in to access your recognition progress.' },
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
          errorCode: 'FORBIDDEN_RECOGNITION_ACCESS',
          error: 'You are not authorized to inspect another user private recognition ledger.',
        },
        { status: 403 }
      ),
    };
  }

  const resolvedId = targetUserId === actor.user.poppo_id ? actor.user.id : targetUserId;
  return { ok: true, actor, targetUserId: resolvedId, isPreviewDemo: false };
}

export function rejectTamperedRecognitionBody(body: Record<string, any> | null | undefined): NextResponse | null {
  const tamperedKey = detectTamperedRecognitionKeys(body);
  if (tamperedKey) {
    return NextResponse.json(
      {
        success: false,
        errorCode: 'RECOGNITION_MANUAL_ASSIGNMENT_FORBIDDEN',
        error: `Field '${tamperedKey}' cannot be supplied or modified from client requests.`,
      },
      { status: 403 }
    );
  }
  return null;
}
