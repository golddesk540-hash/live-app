import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { activityId, userId = '00000000-0000-0000-0000-000000088201', incrementBy = 1 } = body;

    if (!activityId) {
      return NextResponse.json(
        { success: false, error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    // Check activity exists & is active
    const actRows = await query<any>(
      `SELECT * FROM popolive.pk_activity_slots WHERE id = $1`,
      [activityId]
    );

    if (actRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Activity not found' },
        { status: 404 }
      );
    }

    const activity = actRows[0];
    const targetBattles = activity.target_battles || 3;

    // Upsert user progress
    const progressRes = await query<any>(
      `INSERT INTO popolive.pk_user_activity_progress (user_id, activity_id, completed_battles, target_battles, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, activity_id) DO UPDATE SET
         completed_battles = LEAST(popolive.pk_user_activity_progress.target_battles, popolive.pk_user_activity_progress.completed_battles + $3),
         updated_at = NOW()
       RETURNING *;`,
      [userId, activityId, incrementBy, targetBattles]
    );

    const progress = progressRes[0];
    const isCompleted = progress.completed_battles >= targetBattles;

    return NextResponse.json({
      success: true,
      activityId,
      userId,
      completedBattles: progress.completed_battles,
      targetBattles,
      progressPercentage: Math.min(100, Math.round((progress.completed_battles / targetBattles) * 100)),
      isCompleted,
      rewardPoints: activity.reward_points || 50,
      rewardCoins: activity.reward_coins || 100,
      message: isCompleted ? 'Activity completed! Rewards unlocked.' : 'Progress updated successfully.',
    });
  } catch (err: any) {
    console.error('API /api/pk/activities/progress error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update activity progress' },
      { status: 500 }
    );
  }
}
