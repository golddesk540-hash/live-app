import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PKReactionCounters } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { battleId: string } }
) {
  try {
    const battleId = params.battleId;
    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required' },
        { status: 400 }
      );
    }

    const rows = await query<any>(
      `SELECT reaction_type, target_host_side, count 
       FROM popolive.pk_reaction_counters 
       WHERE battle_id = $1`,
      [battleId]
    );

    let total = 0;
    let hostA = 0;
    let hostB = 0;
    const byType: Record<string, number> = {};

    for (const r of rows) {
      const c = parseInt(r.count || '0', 10);
      total += c;
      if (r.target_host_side === 'host_a') hostA += c;
      else if (r.target_host_side === 'host_b') hostB += c;
      else {
        // 'both' contributes evenly to both sides
        hostA += Math.floor(c / 2);
        hostB += Math.ceil(c / 2);
      }
      byType[r.reaction_type] = (byType[r.reaction_type] || 0) + c;
    }

    const counters: PKReactionCounters = {
      total,
      hostA,
      hostB,
      byType,
    };

    return NextResponse.json({
      success: true,
      battleId,
      counters,
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/reaction/counters error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve reaction counters' },
      { status: 500 }
    );
  }
}
