import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/live/host/eligibility
 * Check whether the authenticated user meets the requirements to host a live broadcast:
 * - Must be authenticated
 * - Must be active (not suspended/banned)
 * - Must be at least 18 years old (Locked Rule 1)
 * - Must possess Wealth Level >= 5 (Locked Rule 3)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to check broadcast eligibility.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userRows = await query<any>(
      `SELECT id, poppo_id, nickname, birthdate, is_adult_verified, wealth_level, host_level, status
       FROM popolive.users
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ success: false, error: 'User record not found.' }, { status: 404 });
    }

    const host = userRows[0];

    // Status check
    if (host.status !== 'active') {
      return NextResponse.json({
        success: false,
        eligible: false,
        error: `Account is ${host.status}. Broadcasting privileges revoked.`,
        code: 'ACCOUNT_NOT_ACTIVE',
      }, { status: 403 });
    }

    // Age 18+ check (Locked Rule 1)
    let isAdult = Boolean(host.is_adult_verified);
    if (!isAdult && host.birthdate) {
      const birth = new Date(host.birthdate);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      isAdult = age >= 18;
    }

    if (!isAdult) {
      return NextResponse.json({
        success: false,
        eligible: false,
        error: 'Minimum age of 18 is required to broadcast on Popo Live.',
        code: 'AGE_VERIFICATION_FAILED',
        minimumAge: 18,
      }, { status: 403 });
    }

    // Wealth Level 5 check (Locked Rule 3)
    const wealthLevel = Number(host.wealth_level) || 1;
    const requiredWealthLevel = 5;

    if (wealthLevel < requiredWealthLevel) {
      return NextResponse.json({
        success: false,
        eligible: false,
        error: `Wealth Level ${requiredWealthLevel} is required to go live. Your current wealth level is Level ${wealthLevel}.`,
        code: 'WEALTH_LEVEL_INSUFFICIENT',
        currentWealthLevel: wealthLevel,
        requiredWealthLevel,
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      eligible: true,
      message: 'You meet all criteria to broadcast on Popo Live.',
      host: {
        id: host.id,
        poppoId: host.poppo_id,
        nickname: host.nickname,
        wealthLevel,
        isAdultVerified: true,
      },
    });
  } catch (err: any) {
    console.error('POST /api/live/host/eligibility error:', err);
    return NextResponse.json({ success: false, error: 'Failed to verify broadcast eligibility.' }, { status: 500 });
  }
}
