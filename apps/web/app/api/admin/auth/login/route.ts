import { NextRequest, NextResponse } from 'next/server';
import { adminDeskService } from '@/lib/adminDeskService';
import { extractClientIp } from '@/lib/adminAuthMiddleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/auth/login
 * Admin Desk Login with Mandatory 2FA and IP Whitelist Check
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp = extractClientIp(req);
    const body = await req.json().catch(() => ({}));
    const { email, password, totpCode } = body;

    if (!email || !totpCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and 2FA TOTP code are required',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    const result = await adminDeskService.login(email, totpCode, clientIp, password);

    return NextResponse.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes('ACCESS_DENIED') || err.message?.includes('IP');
    const isAuthError = err.message?.includes('INVALID_');
    const status = isForbidden ? 403 : isAuthError ? 401 : 500;

    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Login failed',
      },
      { status }
    );
  }
}
