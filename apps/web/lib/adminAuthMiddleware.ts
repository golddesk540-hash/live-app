/**
 * POPO LIVE — ADMIN DESK AUTHENTICATION & SECURITY MIDDLEWARE (P8-P10)
 * 
 * Enforces:
 * 1. IP Whitelisting / VPN gateway check
 * 2. Admin JWT verification (Audience MUST be 'admin-desk')
 * 3. Granular RBAC permission check
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminToken,
  isIpWhitelisted,
  hasPermission,
  AdminJwtPayload,
} from './adminDeskService';

export interface AdminAuthResult {
  authorized: boolean;
  actor?: AdminJwtPayload;
  clientIp: string;
  response?: NextResponse;
}

export function extractClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export async function authorizeAdminRequest(
  req: NextRequest,
  requiredPermission?: string
): Promise<AdminAuthResult> {
  const clientIp = extractClientIp(req);

  // 1. IP Whitelist Enforcement
  if (!isIpWhitelisted(clientIp)) {
    return {
      authorized: false,
      clientIp,
      response: NextResponse.json(
        {
          success: false,
          error: 'ACCESS_DENIED: IP address is not whitelisted for Admin Desk',
          code: 'IP_NOT_WHITELISTED',
        },
        { status: 403 }
      ),
    };
  }

  // 2. Admin Authorization Header Check
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      clientIp,
      response: NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED: Admin Desk token required',
          code: 'MISSING_TOKEN',
        },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7).trim();
  const verification = verifyAdminToken(token);

  if (!verification.valid || !verification.payload) {
    const isExpired = verification.error?.includes('SESSION_EXPIRED');
    const isAudienceMismatch = verification.error?.includes('INVALID_AUDIENCE');
    const status = isExpired ? 401 : isAudienceMismatch ? 403 : 401;

    return {
      authorized: false,
      clientIp,
      response: NextResponse.json(
        {
          success: false,
          error: verification.error || 'INVALID_ADMIN_TOKEN',
          code: isExpired ? 'SESSION_EXPIRED' : isAudienceMismatch ? 'INVALID_AUDIENCE' : 'INVALID_TOKEN',
        },
        { status }
      ),
    };
  }

  // 3. RBAC Permission Check
  if (requiredPermission && !hasPermission(verification.payload.role, requiredPermission)) {
    return {
      authorized: false,
      clientIp,
      actor: verification.payload,
      response: NextResponse.json(
        {
          success: false,
          error: `FORBIDDEN: Role ${verification.payload.role} lacks '${requiredPermission}' permission`,
          code: 'INSUFFICIENT_PERMISSIONS',
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    actor: verification.payload,
    clientIp,
  };
}
