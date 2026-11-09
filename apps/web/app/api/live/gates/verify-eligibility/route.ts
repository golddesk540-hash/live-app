import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to verify Go-Live eligibility.' },
        { status: 401 }
      );
    }

    // Always query database as the single source of truth
    const rows = await query(
      `SELECT id, poppo_id, nickname,
              COALESCE(is_face_verified, false) as is_face_verified,
              live_cover_url,
              COALESCE(wealth_level, 1) as wealth_level,
              role, is_staff
       FROM popolive.users
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    const u = rows[0];
    const isFaceVerified = Boolean(u.is_face_verified);
    const hasCoverImage = Boolean(u.live_cover_url && u.live_cover_url.trim().length > 0);
    const wealthLevel = Number(u.wealth_level) || 1;
    const isWealthQualified = wealthLevel >= 5;

    const reasons: string[] = [];
    const missingGates: string[] = [];

    if (!isFaceVerified) {
      reasons.push('Face Check: Real face biometric verification must be completed.');
      missingGates.push('face_check');
    }

    if (!hasCoverImage) {
      reasons.push('Cover Image: A valid live broadcast cover image must be uploaded.');
      missingGates.push('cover_image');
    }

    if (!isWealthQualified) {
      reasons.push(`Wealth Level: Minimum Level 5 required to go live. Your current level is ${wealthLevel}.`);
      missingGates.push('wealth_level');
    }

    // If any gate failed, reject with HTTP 403
    if (reasons.length > 0) {
      return NextResponse.json(
        {
          success: false,
          eligible: false,
          reasons,
          missingGates,
          currentStatus: {
            isFaceVerified,
            hasCoverImage,
            wealthLevel,
            requiredWealthLevel: 5,
          },
        },
        { status: 403 }
      );
    }

    // All gates passed! Mark user as eligible in PostgreSQL
    await query(
      `UPDATE popolive.users
       SET go_live_eligible = true
       WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      eligible: true,
      user: {
        id: u.id,
        poppoId: u.poppo_id,
        nickname: u.nickname,
      },
      verifiedGates: {
        faceCheck: true,
        coverImage: true,
        wealthLevel: {
          current: wealthLevel,
          minimumRequired: 5,
        },
      },
      nextStep: '/live/setup/pre-live', // Hook ready for Module 4.2
      message: 'All Go-Live gates verified! You are eligible to start broadcast setup.',
    });
  } catch (err: any) {
    console.error('Error in POST /api/live/gates/verify-eligibility:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Development / Testing helper: Allows adjusting test user's wealth level in non-production environments
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { wealthLevel } = body;

    if (typeof wealthLevel !== 'number' || wealthLevel < 1 || wealthLevel > 100) {
      return NextResponse.json({ success: false, error: 'wealthLevel must be a number between 1 and 100' }, { status: 400 });
    }

    await query('UPDATE popolive.users SET wealth_level = $1 WHERE id = $2', [wealthLevel, user.id]);

    return NextResponse.json({
      success: true,
      wealthLevel,
      message: `User wealth level updated to ${wealthLevel} for testing purposes.`,
    });
  } catch (err: any) {
    console.error('Error in PUT /api/live/gates/verify-eligibility:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
