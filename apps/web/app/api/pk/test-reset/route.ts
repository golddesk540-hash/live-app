import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Reset test hosts so test runs can be repeated safely
    await query(`
      UPDATE popolive.users 
      SET in_pk_battle = false, current_pk_battle_id = NULL 
      WHERE poppo_id IN ('88201', '88202', '88203');

      UPDATE popolive.live_rooms 
      SET in_pk_battle = false, is_pk = false, current_pk_id = NULL 
      WHERE room_number IN ('7001', '7002', '7003', '7004');

      UPDATE popolive.pk_invitations 
      SET status = 'cancelled', updated_at = NOW() 
      WHERE status = 'pending';

      DELETE FROM popolive.pk_matchmaking_queue;
    `);

    return NextResponse.json({ success: true, message: 'Test PK state reset successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
