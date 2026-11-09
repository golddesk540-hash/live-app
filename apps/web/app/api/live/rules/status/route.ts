import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { CURRENT_POLICY_VERSION } from '@/lib/rules';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get('userId');
    const queryHostId = searchParams.get('hostId') || '8802194';
    const isDemo = searchParams.get('preview') === 'demo';
    const forceAck = searchParams.get('acknowledged') === '1';

    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const targetUserId = authUser?.id || queryUserId || null;
    const targetPoppoId = authUser?.poppo_id || queryHostId;

    let hasAccepted = false;
    let acknowledgedVersion: string | null = null;
    let acceptedAt: string | null = null;
    let requiresReacceptance = false;
    let acknowledgementCount = 0;

    // Check DB acknowledgements
    try {
      let ackRows: any[] = [];
      if (targetUserId) {
        ackRows = await query(
          `SELECT id, policy_version, accepted_at, is_accepted 
           FROM popolive.host_rule_acknowledgements 
           WHERE user_id = $1 
           ORDER BY accepted_at DESC`,
          [targetUserId]
        );
      } else if (targetPoppoId) {
        ackRows = await query(
          `SELECT id, policy_version, accepted_at, is_accepted 
           FROM popolive.host_rule_acknowledgements 
           WHERE host_poppo_id = $1 
           ORDER BY accepted_at DESC`,
          [targetPoppoId]
        );
      }

      if (ackRows && ackRows.length > 0) {
        acknowledgementCount = ackRows.length;
        const latest = ackRows[0];
        acknowledgedVersion = latest.policy_version;
        acceptedAt = latest.accepted_at;

        if (latest.policy_version === CURRENT_POLICY_VERSION && latest.is_accepted) {
          hasAccepted = true;
          requiresReacceptance = false;
        } else {
          hasAccepted = false;
          requiresReacceptance = true;
        }
      }
    } catch (dbErr) {
      console.warn('DB check warning in /rules/status:', dbErr);
    }

    if (forceAck) {
      hasAccepted = true;
      acknowledgedVersion = CURRENT_POLICY_VERSION;
      acceptedAt = new Date().toISOString();
      requiresReacceptance = false;
    }

    return NextResponse.json({
      success: true,
      currentPolicyVersion: CURRENT_POLICY_VERSION,
      hasAccepted,
      acknowledgedVersion,
      acceptedAt,
      requiresReacceptance,
      acknowledgementCount,
      host: {
        userId: targetUserId,
        poppoId: targetPoppoId,
      },
      isDemo,
    });
  } catch (error: any) {
    console.error('API /live/rules/status GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check host rules status' },
      { status: 500 }
    );
  }
}
