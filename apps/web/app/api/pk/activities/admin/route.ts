import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const activities = await query<any>(`
      SELECT * FROM popolive.pk_activity_slots
      ORDER BY display_order ASC, created_at DESC;
    `);

    const auditLogs = await query<any>(`
      SELECT al.*, a.title as activity_title
      FROM popolive.pk_activity_audit_logs al
      JOIN popolive.pk_activity_slots a ON a.id = al.activity_id
      ORDER BY al.created_at DESC
      LIMIT 20;
    `);

    return NextResponse.json({
      success: true,
      count: activities.length,
      activities,
      auditLogs,
    });
  } catch (err: any) {
    console.error('API /api/pk/activities/admin GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve admin activity management data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      action = 'update_status', // 'create', 'update_status', 'link_battle', 'update_details'
      activityId,
      adminId = 'admin_system',
      title,
      titleUr,
      subtitle,
      subtitleUr,
      description,
      descriptionUr,
      activityType = 'daily',
      status,
      targetBattles,
      rewardPoints,
      rewardCoins,
      linkedBattleId,
      displayOrder,
      startsAt,
      endsAt,
    } = body;

    if (action === 'create') {
      if (!title || !subtitle || !description) {
        return NextResponse.json(
          { success: false, error: 'Title, subtitle, and description are required' },
          { status: 400 }
        );
      }

      const res = await query<any>(
        `INSERT INTO popolive.pk_activity_slots (
           title, title_ur, subtitle, subtitle_ur, description, description_ur,
           activity_type, target_battles, reward_points, reward_coins, status,
           starts_at, ends_at, display_order, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, COALESCE($12, NOW()), COALESCE($13, NOW() + INTERVAL '24 hours'), COALESCE($14, 1), $15)
         RETURNING *;`,
        [
          title,
          titleUr || title,
          subtitle,
          subtitleUr || subtitle,
          description,
          descriptionUr || description,
          activityType,
          targetBattles || 3,
          rewardPoints || 50,
          rewardCoins || 100,
          status || 'active',
          startsAt,
          endsAt,
          displayOrder,
          adminId,
        ]
      );

      const created = res[0];
      await query(
        `INSERT INTO popolive.pk_activity_audit_logs (activity_id, action, admin_id, new_status, details)
         VALUES ($1, 'created', $2, $3, $4)`,
        [created.id, adminId, created.status, JSON.stringify({ title, activityType })]
      );

      return NextResponse.json({
        success: true,
        activity: created,
        message: 'Activity created successfully',
      });
    }

    if (!activityId) {
      return NextResponse.json(
        { success: false, error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    const prevRows = await query<any>(
      `SELECT * FROM popolive.pk_activity_slots WHERE id = $1`,
      [activityId]
    );

    if (prevRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Activity not found' },
        { status: 404 }
      );
    }

    const prev = prevRows[0];

    if (action === 'update_status' && status) {
      await query(
        `UPDATE popolive.pk_activity_slots 
         SET status = $1, updated_at = NOW() 
         WHERE id = $2`,
        [status, activityId]
      );

      await query(
        `INSERT INTO popolive.pk_activity_audit_logs (activity_id, action, admin_id, previous_status, new_status)
         VALUES ($1, 'status_changed', $2, $3, $4)`,
        [activityId, adminId, prev.status, status]
      );

      return NextResponse.json({
        success: true,
        activityId,
        previousStatus: prev.status,
        newStatus: status,
        message: `Activity status updated to ${status}`,
      });
    }

    if (action === 'link_battle' && linkedBattleId) {
      const battleCheck = await query<any>(
        `SELECT id FROM popolive.pk_battles WHERE id = $1`,
        [linkedBattleId]
      );
      if (battleCheck.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Target PK Battle does not exist' },
          { status: 404 }
        );
      }

      await query(
        `UPDATE popolive.pk_activity_slots
         SET linked_battle_ids = CASE 
           WHEN linked_battle_ids @> to_jsonb($1::text) THEN linked_battle_ids
           ELSE linked_battle_ids || to_jsonb($1::text)
         END,
         updated_at = NOW()
         WHERE id = $2`,
        [linkedBattleId, activityId]
      );

      await query(
        `INSERT INTO popolive.pk_activity_audit_logs (activity_id, action, admin_id, details)
         VALUES ($1, 'battle_linked', $2, $3)`,
        [activityId, adminId, JSON.stringify({ linkedBattleId })]
      );

      return NextResponse.json({
        success: true,
        activityId,
        linkedBattleId,
        message: 'PK battle successfully linked to activity',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid admin action' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('API /api/pk/activities/admin POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process admin activity management' },
      { status: 500 }
    );
  }
}
