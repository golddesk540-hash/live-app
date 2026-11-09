import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { PartyRule } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get('userId');

    const authUser = await getAuthenticatedUser(req).catch(() => null);
    const userId = queryUserId || authUser?.id || null;

    // 1. Fetch room details and active policy version
    const roomRows = await query(
      `SELECT room_number, host_user_id, host_nickname, active_rules_version 
       FROM popolive.party_rooms 
       WHERE room_number = $1`,
      [roomId]
    );

    const activePolicyVersion = roomRows?.[0]?.active_rules_version || 'v1.0';
    const hostId = roomRows?.[0]?.host_user_id || 'host_maria_7001';
    const isHost = Boolean(userId && (userId === hostId || userId === 'host_maria' || userId === 'host_maria_7001'));

    // 2. Fetch active rules for this room (global mandatory + room custom)
    const ruleRows = await query(
      `SELECT id, party_id, title, description, category, icon, 
              is_mandatory, is_active, display_order, policy_version, 
              created_by, created_at, updated_at
       FROM popolive.party_rules
       WHERE (party_id IS NULL OR party_id = $1)
         AND is_active = TRUE
       ORDER BY display_order ASC, created_at ASC`,
      [roomId]
    );

    const rules: PartyRule[] = (ruleRows || []).map((r) => ({
      id: r.id,
      partyId: r.party_id,
      title: r.title,
      description: r.description,
      category: r.category,
      icon: r.icon,
      isMandatory: Boolean(r.is_mandatory),
      isActive: Boolean(r.is_active),
      displayOrder: Number(r.display_order),
      policyVersion: r.policy_version,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    const mandatoryCount = rules.filter((r) => r.isMandatory).length;
    const customCount = rules.filter((r) => !r.isMandatory).length;

    // 3. Check acceptance for userId if provided
    let hasAccepted = false;
    let acceptedAt: string | null = null;

    if (userId) {
      const accRows = await query(
        `SELECT id, is_accepted, accepted_at, policy_version 
         FROM popolive.party_rule_acceptances
         WHERE room_number = $1 
           AND user_id = $2 
           AND policy_version = $3
           AND is_accepted = TRUE
         LIMIT 1`,
        [roomId, userId, activePolicyVersion]
      );

      if (accRows && accRows.length > 0) {
        hasAccepted = true;
        acceptedAt = accRows[0].accepted_at;
      }
    }

    return NextResponse.json({
      success: true,
      roomNumber: roomId,
      policyVersion: activePolicyVersion,
      hasAccepted,
      acceptedAt,
      rules,
      mandatoryCount,
      customCount,
      isHost,
    });
  } catch (error: any) {
    console.error('Error fetching party rules:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error fetching party rules' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const isHostAction = body.isHostAction ?? true;
    const hostId = body.hostId || authUser?.id || 'host_maria_7001';

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rule title is required.' },
        { status: 400 }
      );
    }

    if (body.title.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Rule title must be 100 characters or less.' },
        { status: 400 }
      );
    }

    const title = body.title.trim();
    const description = (body.description || '').trim();
    const category = body.category || 'custom';
    const icon = body.icon || 'custom';

    // Room info
    const roomRows = await query(
      `SELECT active_rules_version, host_user_id FROM popolive.party_rooms WHERE room_number = $1`,
      [roomId]
    );
    const room = roomRows?.[0];
    const policyVersion = room?.active_rules_version || 'v1.0';

    // Max order
    const maxOrderRes = await query(
      `SELECT COALESCE(MAX(display_order), 10) as max_order 
       FROM popolive.party_rules 
       WHERE party_id IS NULL OR party_id = $1`,
      [roomId]
    );
    const nextOrder = Number(maxOrderRes?.[0]?.max_order || 10) + 1;
    const ruleId = `rule_custom_${roomId}_${Date.now()}`;

    const insertRes = await query(
      `INSERT INTO popolive.party_rules 
        (id, party_id, title, description, category, icon, is_mandatory, is_active, display_order, policy_version, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, TRUE, $7, $8, $9)
       RETURNING *`,
      [ruleId, roomId, title, description, category, icon, nextOrder, policyVersion, hostId]
    );

    const newRule = insertRes?.[0];

    return NextResponse.json({
      success: true,
      message: 'Custom party rule created successfully!',
      rule: {
        id: newRule.id,
        partyId: newRule.party_id,
        title: newRule.title,
        description: newRule.description,
        category: newRule.category,
        icon: newRule.icon,
        isMandatory: false,
        isActive: true,
        displayOrder: newRule.display_order,
        policyVersion: newRule.policy_version,
      },
    });
  } catch (error: any) {
    console.error('Error creating custom party rule:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error creating party rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const url = new URL(req.url);
    const ruleId = url.searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { success: false, error: 'ruleId parameter is required.' },
        { status: 400 }
      );
    }

    // Verify rule existence and mandatory constraint
    const ruleRows = await query(
      `SELECT id, party_id, is_mandatory, title FROM popolive.party_rules WHERE id = $1`,
      [ruleId]
    );

    if (!ruleRows || ruleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Rule not found.' },
        { status: 404 }
      );
    }

    const rule = ruleRows[0];

    // CRITICAL REQUIREMENT: Host cannot remove mandatory platform safety rules!
    if (rule.is_mandatory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mandatory platform safety rules cannot be deleted or disabled.',
        },
        { status: 403 }
      );
    }

    if (rule.party_id !== roomId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete rules belonging to another party room.',
        },
        { status: 403 }
      );
    }

    await query(
      `DELETE FROM popolive.party_rules WHERE id = $1 AND party_id = $2`,
      [ruleId, roomId]
    );

    return NextResponse.json({
      success: true,
      message: `Rule "${rule.title}" deleted successfully.`,
      ruleId,
    });
  } catch (error: any) {
    console.error('Error deleting party rule:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error deleting party rule' },
      { status: 500 }
    );
  }
}
