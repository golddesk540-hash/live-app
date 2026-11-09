import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;
    const body = await req.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(req).catch(() => null);

    const userId = body.userId || authUser?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required to accept party rules.' },
        { status: 400 }
      );
    }

    // Determine room's active policy version
    const roomRows = await query(
      `SELECT active_rules_version FROM popolive.party_rooms WHERE room_number = $1`,
      [roomId]
    );
    const activeVersion = roomRows?.[0]?.active_rules_version || 'v1.0';
    const policyVersion = body.policyVersion || activeVersion;

    const ipAddress =
      body.ipAddress ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = body.userAgent || req.headers.get('user-agent') || 'PopoLive/1.0';

    const insertRes = await query(
      `INSERT INTO popolive.party_rule_acceptances
        (user_id, room_number, policy_version, is_accepted, accepted_at, ip_address, user_agent)
       VALUES ($1, $2, $3, TRUE, CURRENT_TIMESTAMP, $4, $5)
       ON CONFLICT (user_id, room_number, policy_version) DO UPDATE SET
         is_accepted = TRUE,
         accepted_at = CURRENT_TIMESTAMP,
         ip_address = EXCLUDED.ip_address,
         user_agent = EXCLUDED.user_agent
       RETURNING id, user_id, room_number, policy_version, is_accepted, accepted_at`,
      [userId, roomId, policyVersion, ipAddress, userAgent]
    );

    const record = insertRes?.[0];

    return NextResponse.json({
      success: true,
      message: 'Party rules accepted successfully!',
      roomNumber: roomId,
      userId: record?.user_id || userId,
      policyVersion: record?.policy_version || policyVersion,
      acceptedAt: record?.accepted_at || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error accepting party rules:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error accepting party rules' },
      { status: 500 }
    );
  }
}
