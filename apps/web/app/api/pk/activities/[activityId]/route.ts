import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PKActivitySlot, formatActivityCountdown } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { activityId: string } }
) {
  try {
    const activityId = params.activityId;
    if (!activityId) {
      return NextResponse.json(
        { success: false, error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    const rows = await query<any>(
      `SELECT * FROM popolive.pk_activity_slots WHERE id = $1`,
      [activityId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Activity not found' },
        { status: 404 }
      );
    }

    const r = rows[0];
    const now = new Date();
    const startsAt = new Date(r.starts_at);
    const endsAt = new Date(r.ends_at);

    let currentStatus = r.status;
    if (currentStatus === 'scheduled' && now >= startsAt && now < endsAt) {
      currentStatus = 'active';
    } else if (currentStatus === 'active' && now >= endsAt) {
      currentStatus = 'completed';
    }

    let remainingSeconds = 0;
    if (currentStatus === 'scheduled') {
      remainingSeconds = Math.max(0, Math.floor((startsAt.getTime() - now.getTime()) / 1000));
    } else if (currentStatus === 'active') {
      remainingSeconds = Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000));
    }

    const linkedBattleIds = Array.isArray(r.linked_battle_ids)
      ? r.linked_battle_ids
      : typeof r.linked_battle_ids === 'string'
      ? JSON.parse(r.linked_battle_ids)
      : [];

    // Fetch full linked battles if any
    let linkedBattles: any[] = [];
    if (linkedBattleIds.length > 0) {
      linkedBattles = await query<any>(
        `SELECT id, host_a_nickname, host_a_avatar, host_a_score, host_a_room,
                host_b_nickname, host_b_avatar, host_b_score, host_b_room,
                status, viewer_count, remaining_seconds
         FROM popolive.pk_battles
         WHERE id = ANY($1::uuid[])`,
        [linkedBattleIds]
      );
    }

    const activity: PKActivitySlot = {
      id: r.id,
      title: r.title,
      titleUr: r.title_ur || r.title,
      subtitle: r.subtitle,
      subtitleUr: r.subtitle_ur || r.subtitle,
      description: r.description,
      descriptionUr: r.description_ur || r.description,
      activityType: r.activity_type,
      bannerUrl: r.banner_url || null,
      thumbnailUrl: r.thumbnail_url || null,
      targetBattles: r.target_battles || 3,
      currentBattles: r.current_battles || 0,
      rewardPoints: r.reward_points || 50,
      rewardCoins: r.reward_coins || 100,
      status: currentStatus,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      remainingSeconds,
      formattedCountdown: formatActivityCountdown(remainingSeconds),
      displayOrder: r.display_order,
      isVisible: r.is_visible,
      linkedBattleIds,
      participatingHostIds: r.participating_host_ids || [],
      progressPercentage: Math.min(100, Math.round(((r.current_battles || 0) / (r.target_battles || 3)) * 100)),
      isCompleted: (r.current_battles || 0) >= (r.target_battles || 3) || currentStatus === 'completed',
      isExpired: now >= endsAt,
    };

    return NextResponse.json({
      success: true,
      activity,
      linkedBattles,
    });
  } catch (err: any) {
    console.error('API /api/pk/activities/[activityId] error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve activity details' },
      { status: 500 }
    );
  }
}
