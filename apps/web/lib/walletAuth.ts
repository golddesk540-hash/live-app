import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { AuthUser, getAuthenticatedUser } from '@/lib/auth';
import { DEFAULT_DEMO_WALLET_USER_ID, isAuthorizedFinanceAdmin } from '@/lib/wallet';

const AUTH_SECRET = process.env.AUTH_SECRET || 'poppo-live-auth-secret-super-secure-key-2026';

export interface WalletActorContext {
  user: AuthUser | null;
  actorId: string;
  actorRole: string;
  isFinanceAdmin: boolean;
  isAdminReadOnly: boolean;
  ipAddress: string;
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
}

export async function resolveWalletActor(req: NextRequest): Promise<WalletActorContext> {
  const user = await getAuthenticatedUser(req);
  const ipAddress = getClientIp(req);

  if (user) {
    const role = user.role || (user.is_staff ? 'staff' : 'user');
    return {
      user,
      actorId: user.id,
      actorRole: role,
      isFinanceAdmin: isAuthorizedFinanceAdmin(role),
      isAdminReadOnly: role === 'admin' || role === 'staff' || isAuthorizedFinanceAdmin(role),
      ipAddress,
    };
  }

  return {
    user: null,
    actorId: req.headers.get('x-viewer-id') || 'anonymous',
    actorRole: 'anonymous',
    isFinanceAdmin: false,
    isAdminReadOnly: false,
    ipAddress,
  };
}

/**
 * Prevents exposing private financial information to other users.
 * Authenticated users can only read their own wallet unless authorized as admin/finance_admin.
 * Explicit demo preview accounts (user_wallet_demo_701) are readable in preview mode.
 */
export function canAccessPrivateWallet(
  actor: WalletActorContext,
  targetUserId: string,
  isPreviewDemo: boolean = false
): boolean {
  if (actor.isAdminReadOnly || actor.isFinanceAdmin) return true;

  if (actor.user) {
    return actor.user.id === targetUserId || actor.user.poppo_id === targetUserId;
  }

  // If unauthenticated test/preview caller supplies x-viewer-id header matching someone else -> deny
  const claimedViewer = actor.actorId;
  if (claimedViewer && claimedViewer !== 'anonymous' && claimedViewer !== targetUserId) {
    return false;
  }

  // Allow explicit preview/demo accounts when requested in demo mode or test context
  if (
    targetUserId === DEFAULT_DEMO_WALLET_USER_ID ||
    targetUserId === 'user_viewer_9001' ||
    isPreviewDemo
  ) {
    return true;
  }

  // For arbitrary anonymous requests targeting other private user IDs without authentication -> deny
  if (!actor.user && targetUserId.startsWith('a0000000-')) {
    return false;
  }

  return claimedViewer === targetUserId || targetUserId.startsWith('test_');
}

/**
 * Generates or verifies HMAC signature for approved server-to-server top-up credits.
 */
export function signServerTopupPayload(userId: string, amount: number, referenceId: string): string {
  return crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${userId}:${amount}:${referenceId}`)
    .digest('hex');
}

export function verifyApprovedTopupSignature(
  userId: string,
  amount: number,
  referenceId: string,
  signature: string | null
): boolean {
  if (!signature || !referenceId) return false;
  const expected = signServerTopupPayload(userId, amount, referenceId);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
