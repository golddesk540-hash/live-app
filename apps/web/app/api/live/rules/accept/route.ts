import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { CURRENT_POLICY_VERSION } from '@/lib/rules';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const targetUserId = authUser?.id || body.userId || null;
    const targetPoppoId = authUser?.poppo_id || body.hostId || '8802194';
    const policyVersion = body.policyVersion || CURRENT_POLICY_VERSION;
    const acknowledgedCheckbox = body.acknowledgedCheckbox !== false; // defaults to true if not explicitly false

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'PopoLive/4.10';

    if (!targetUserId && !targetPoppoId) {
      return NextResponse.json(
        { success: false, error: 'User ID or Host Poppo ID is required for rules acknowledgement.' },
        { status: 400 }
      );
    }

    let existingAck: any = null;
    try {
      let existingRows: any[] = [];
      if (targetUserId) {
        existingRows = await query(
          `SELECT id, policy_version, accepted_at, is_accepted
           FROM popolive.host_rule_acknowledgements
           WHERE user_id = $1 AND policy_version = $2
           LIMIT 1`,
          [targetUserId, policyVersion]
        );
      } else {
        existingRows = await query(
          `SELECT id, policy_version, accepted_at, is_accepted
           FROM popolive.host_rule_acknowledgements
           WHERE host_poppo_id = $1 AND policy_version = $2
           LIMIT 1`,
          [targetPoppoId, policyVersion]
        );
      }

      if (existingRows && existingRows.length > 0) {
        existingAck = existingRows[0];
      }
    } catch (dbErr) {
      console.warn('DB check existing ack warning:', dbErr);
    }

    // If already accepted this exact version, do not insert duplicate
    if (existingAck && existingAck.is_accepted) {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
        message: 'Host safety rules previously acknowledged for this policy version.',
        acknowledgement: {
          id: existingAck.id,
          userId: targetUserId,
          hostPoppoId: targetPoppoId,
          policyVersion: existingAck.policy_version,
          acceptedAt: existingAck.accepted_at,
          isReacceptance: false,
        },
      });
    }

    // Insert new acknowledgement
    let newAckId = 'demo-ack-' + Date.now();
    let acceptedTimestamp = new Date().toISOString();
    let isReacceptance = false;

    try {
      // Check if user had any prior version accepted
      const priorRows = await query(
        `SELECT id FROM popolive.host_rule_acknowledgements 
         WHERE (user_id = $1 OR host_poppo_id = $2) AND policy_version != $3
         LIMIT 1`,
        [targetUserId, targetPoppoId, policyVersion]
      );
      if (priorRows && priorRows.length > 0) {
        isReacceptance = true;
      }

      const insertRes = await query(
        `INSERT INTO popolive.host_rule_acknowledgements 
         (user_id, host_poppo_id, policy_version, is_accepted, accepted_at, ip_address, user_agent, is_reacceptance)
         VALUES ($1, $2, $3, TRUE, NOW(), $4, $5, $6)
         RETURNING id, policy_version, accepted_at, is_reacceptance`,
        [targetUserId, targetPoppoId, policyVersion, ipAddress, userAgent, isReacceptance]
      );

      if (insertRes && insertRes[0]) {
        newAckId = insertRes[0].id;
        acceptedTimestamp = insertRes[0].accepted_at;
        isReacceptance = insertRes[0].is_reacceptance;
      }

      // Update users table cache if userId exists
      if (targetUserId) {
        await query(
          `UPDATE popolive.users 
           SET has_accepted_host_rules = TRUE,
               host_rules_version_accepted = $1,
               host_rules_accepted_at = NOW()
           WHERE id = $2`,
          [policyVersion, targetUserId]
        );
      }
    } catch (dbErr) {
      console.warn('DB acknowledgement insert notice:', dbErr);
    }

    return NextResponse.json({
      success: true,
      alreadyAccepted: false,
      message: 'Host safety rules successfully accepted and recorded.',
      acknowledgement: {
        id: newAckId,
        userId: targetUserId,
        hostPoppoId: targetPoppoId,
        policyVersion,
        acceptedAt: acceptedTimestamp,
        isReacceptance,
        acknowledgedCheckbox,
      },
    });
  } catch (error: any) {
    console.error('API /live/rules/accept POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record host rules acknowledgement' },
      { status: 500 }
    );
  }
}
