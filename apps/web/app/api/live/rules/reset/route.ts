import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetPoppoId = body.hostId || '8802194';
    const targetUserId = body.userId || null;

    try {
      if (targetUserId) {
        await query(`DELETE FROM popolive.host_rule_acknowledgements WHERE user_id = $1`, [targetUserId]);
        await query(
          `UPDATE popolive.users 
           SET has_accepted_host_rules = FALSE, host_rules_version_accepted = NULL, host_rules_accepted_at = NULL 
           WHERE id = $1`,
          [targetUserId]
        );
      } else {
        await query(`DELETE FROM popolive.host_rule_acknowledgements WHERE host_poppo_id = $1`, [targetPoppoId]);
      }
    } catch (err) {
      console.warn('Reset ack DB warning:', err);
    }

    return NextResponse.json({
      success: true,
      message: `Acknowledgements reset for host ${targetPoppoId}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
