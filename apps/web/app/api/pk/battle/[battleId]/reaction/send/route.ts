import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { APPROVED_PK_REACTIONS, PKReactionType, PKReactionTarget } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function POST(
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

    const body = await req.json().catch(() => ({}));
    const {
      reactionType,
      targetHostSide = 'both',
      userId = 'user_viewer_9001',
      userNickname = 'Ali',
      userAvatar = '/avatars/default.png',
    } = body;

    // 1. Verify reaction type is in approved catalog
    const catalogItem = APPROVED_PK_REACTIONS.find((r) => r.id === reactionType);
    if (!catalogItem) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid reaction type: ${reactionType}. Must be one of: ${APPROVED_PK_REACTIONS.map((r) => r.id).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 2. Verify target side
    const validSides: PKReactionTarget[] = ['host_a', 'host_b', 'both'];
    const side: PKReactionTarget = validSides.includes(targetHostSide) ? targetHostSide : 'both';

    // 3. Confirm Battle Exists and is Active (Completed battles reject new reactions)
    const battleRows = await query<any>(
      `SELECT id, status, expires_at FROM popolive.pk_battles WHERE id = $1`,
      [battleId]
    );

    if (battleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Battle not found' },
        { status: 404 }
      );
    }

    const battle = battleRows[0];
    if (battle.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: `Reactions can only be sent to active PK battles. Current battle status is: ${battle.status}`,
        },
        { status: 400 }
      );
    }

    // 4. Server-Side Spam Protection / Rate Limit Check (Max 10 reactions in last 2 seconds per user)
    const recentCountRows = await query<any>(
      `SELECT COUNT(*)::int as recent_count 
       FROM popolive.pk_reactions 
       WHERE user_id = $1 AND battle_id = $2 AND created_at > NOW() - INTERVAL '2 seconds'`,
      [userId, battleId]
    );

    const recentCount = recentCountRows[0]?.recent_count || 0;
    if (recentCount >= 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded: You are sending reactions too fast. Please slow down.',
        },
        { status: 429 }
      );
    }

    // 5. Insert Reaction record
    const insertRes = await query<any>(
      `INSERT INTO popolive.pk_reactions (
         battle_id, user_id, user_nickname, user_avatar, target_host_side, reaction_type, emoji
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [battleId, userId, userNickname, userAvatar, side, reactionType, catalogItem.emoji]
    );

    const reaction = insertRes[0];

    // 6. Atomically Upsert Counter
    await query(
      `INSERT INTO popolive.pk_reaction_counters (battle_id, reaction_type, target_host_side, count, updated_at)
       VALUES ($1, $2, $3, 1, NOW())
       ON CONFLICT (battle_id, reaction_type, target_host_side) DO UPDATE SET
         count = popolive.pk_reaction_counters.count + 1,
         updated_at = NOW();`,
      [battleId, reactionType, side]
    );

    // 7. Fetch updated totals from authoritative counters table
    const counterRows = await query<any>(
      `SELECT target_host_side, SUM(count)::int as subtotal
       FROM popolive.pk_reaction_counters
       WHERE battle_id = $1
       GROUP BY target_host_side`,
      [battleId]
    );

    let total = 0;
    let hostA = 0;
    let hostB = 0;

    for (const r of counterRows) {
      const c = parseInt(r.subtotal || '0', 10);
      total += c;
      if (r.target_host_side === 'host_a') hostA += c;
      else if (r.target_host_side === 'host_b') hostB += c;
      else {
        hostA += Math.floor(c / 2);
        hostB += Math.ceil(c / 2);
      }
    }

    return NextResponse.json({
      success: true,
      battleId,
      reaction: {
        id: reaction.id,
        reactionType: reaction.reaction_type,
        emoji: reaction.emoji,
        targetHostSide: reaction.target_host_side,
        userNickname: reaction.user_nickname,
        createdAt: reaction.created_at,
      },
      counters: {
        total,
        hostA,
        hostB,
      },
      isScoreChanged: false, // Free reaction explicitly never changes score
    });
  } catch (err: any) {
    console.error('API /api/pk/battle/[battleId]/reaction/send error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to send reaction' },
      { status: 500 }
    );
  }
}
