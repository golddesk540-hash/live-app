import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req).catch(() => null);

    // Support demo parameter ?preview=demo or ?demo=true for unauthenticated UI inspection
    const isDemo = req.nextUrl.searchParams.get('preview') === 'demo' || req.nextUrl.searchParams.get('demo') === 'true';

    if (!user) {
      if (isDemo) {
        return NextResponse.json({
          success: true,
          isGuest: true,
          isDemo: true,
          user: {
            id: 'demo-user-id',
            poppoId: '8899001',
            nickname: 'Demo Broadcaster',
            wealthLevel: 1,
          },
          gates: {
            faceCheck: {
              status: 'not_started',
              verified: false,
              verifiedAt: null,
              provider: 'kyc_face_service',
            },
            coverImage: {
              uploaded: false,
              coverUrl: null,
            },
            wealthLevel: {
              current: 1,
              required: 5,
              passed: false,
            },
          },
          isEligible: false,
          missingRequirements: ['face_check', 'cover_image', 'wealth_level'],
        });
      }

      return NextResponse.json(
        { success: false, error: 'Authentication required to check Go-Live eligibility.' },
        { status: 401 }
      );
    }

    // Query fresh state directly from PostgreSQL
    const rows = await query(
      `SELECT id, poppo_id, nickname, COALESCE(wealth_level, 1) as wealth_level,
              COALESCE(is_face_verified, false) as is_face_verified,
              face_verified_at, live_cover_url,
              COALESCE(go_live_eligible, false) as go_live_eligible
       FROM popolive.users
       WHERE id = $1
       LIMIT 1`,
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User record not found.' }, { status: 404 });
    }

    const u = rows[0];
    const wealthLevel = Number(u.wealth_level) || 1;
    const isFaceVerified = Boolean(u.is_face_verified);
    const hasCoverImage = Boolean(u.live_cover_url && u.live_cover_url.trim().length > 0);
    const wealthPassed = wealthLevel >= 5;

    const missingRequirements: string[] = [];
    if (!isFaceVerified) missingRequirements.push('face_check');
    if (!hasCoverImage) missingRequirements.push('cover_image');
    if (!wealthPassed) missingRequirements.push('wealth_level');

    const isEligible = isFaceVerified && hasCoverImage && wealthPassed;

    return NextResponse.json({
      success: true,
      isGuest: false,
      user: {
        id: u.id,
        poppoId: u.poppo_id,
        nickname: u.nickname,
        wealthLevel,
      },
      gates: {
        faceCheck: {
          status: isFaceVerified ? 'verified' : 'not_started',
          verified: isFaceVerified,
          verifiedAt: u.face_verified_at ? u.face_verified_at.toISOString() : null,
          provider: 'kyc_face_service',
        },
        coverImage: {
          uploaded: hasCoverImage,
          coverUrl: u.live_cover_url || null,
        },
        wealthLevel: {
          current: wealthLevel,
          required: 5,
          passed: wealthPassed,
        },
      },
      isEligible,
      missingRequirements,
    });
  } catch (err: any) {
    console.error('Error in GET /api/live/gates/status:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
