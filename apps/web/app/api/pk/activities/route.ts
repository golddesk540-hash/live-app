import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PKActivitySlot, formatActivityCountdown } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = (searchParams.get('status') || 'active').toLowerCase();
    const typeParam = (searchParams.get('type') || 'all').toLowerCase();
    const userId = searchParams.get('userId') || '';

    let sql = `
      SELECT a.*
      FROM popolive.pk_activity_slots a
      WHERE a.is_visible = true
    `;
    const params: any[] = [];

    if (statusParam !== 'all') {
      params.push(statusParam);
      sql += ` AND a.status = $${params.length}`;
    }

    if (typeParam !== 'all') {
      params.push(typeParam);
      sql += ` AND a.activity_type = $${params.length}`;
    }

    sql += ` ORDER BY a.display_order ASC, a.starts_at ASC`;

    const rows = await query<any>(sql, params);
    const now = new Date();

    // Fetch user progress if userId provided
    let userProgressMap = new Map<string, any>();
    if (userId) {
      const progressRows = await query<any>(
        `SELECT * FROM popolive.pk_user_activity_progress WHERE user_id = $1`,
        [userId]
      );
      for (const p of progressRows) {
        userProgressMap.set(p.activity_id, p);
      }
    }

    const activities: PKActivitySlot[] = [];

    for (const r of rows) {
      const startsAt = new Date(r.starts_at);
      const endsAt = new Date(r.ends_at);

      let currentStatus = r.status;
      // Auto-update status based on server time
      if (currentStatus === 'scheduled' && now >= startsAt && now < endsAt) {
        currentStatus = 'active';
        await query(
          `UPDATE popolive.pk_activity_slots SET status = 'active', updated_at = NOW() WHERE id = $1`,
          [r.id]
        );
      } else if (currentStatus === 'active' && now >= endsAt) {
        currentStatus = 'completed';
        await query(
          `UPDATE popolive.pk_activity_slots SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [r.id]
        );
      }

      // Calculate remaining seconds
      let remainingSeconds = 0;
      if (currentStatus === 'scheduled') {
        remainingSeconds = Math.max(0, Math.floor((startsAt.getTime() - now.getTime()) / 1000));
      } else if (currentStatus === 'active') {
        remainingSeconds = Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000));
      }

      const userProg = userProgressMap.get(r.id);
      const currentBattles = userProg ? userProg.completed_battles : (r.current_battles || 0);
      const targetBattles = r.target_battles || 3;
      const progressPercentage = Math.min(100, Math.round((currentBattles / targetBattles) * 100));

      const linkedBattleIds = Array.isArray(r.linked_battle_ids)
        ? r.linked_battle_ids
        : typeof r.linked_battle_ids === 'string'
        ? JSON.parse(r.linked_battle_ids)
        : [];

      const participatingHostIds = Array.isArray(r.participating_host_ids)
        ? r.participating_host_ids
        : typeof r.participating_host_ids === 'string'
        ? JSON.parse(r.participating_host_ids)
        : [];

      activities.push({
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
        targetBattles,
        currentBattles,
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
        participatingHostIds,
        progressPercentage,
        isCompleted: currentBattles >= targetBattles || currentStatus === 'completed',
        isExpired: now >= endsAt,
      });
    }

    return NextResponse.json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (err: any) {
    console.error('API /api/pk/activities GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve PK activities' },
      { status: 500 }
    );
  }
}
