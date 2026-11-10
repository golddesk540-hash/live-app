import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const featuredRows = await query(`
      SELECT 
        fb.id as feature_id,
        fb.battle_id,
        fb.featured_by,
        fb.featured_order,
        fb.status as feature_status,
        fb.created_at as featured_at,
        b.status as battle_status,
        b.host_a_nickname,
        b.host_a_avatar,
        b.host_a_score,
        b.host_b_nickname,
        b.host_b_avatar,
        b.host_b_score,
        b.viewer_count
      FROM popolive.pk_featured_battles fb
      JOIN popolive.pk_battles b ON b.id = fb.battle_id
      WHERE fb.status = 'active' AND b.status = 'active'
      ORDER BY fb.featured_order ASC, fb.created_at DESC;
    `);

    return NextResponse.json({
      success: true,
      featured: featuredRows,
      count: featuredRows.length,
    });
  } catch (err: any) {
    console.error('API /api/pk/discovery/featured GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve featured battles' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { battleId, isFeatured, featuredOrder = 1, adminId = 'admin_system' } = body;

    if (!battleId) {
      return NextResponse.json(
        { success: false, error: 'Battle ID is required.' },
        { status: 400 }
      );
    }

    // Verify battle exists
    const battleRows = await query(
      `SELECT id, status FROM popolive.pk_battles WHERE id = $1`,
      [battleId]
    );

    if (battleRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'PK Battle not found.' },
        { status: 404 }
      );
    }

    if (isFeatured) {
      // Set featured on battle
      await query(
        `UPDATE popolive.pk_battles 
         SET is_featured = true, featured_order = $2, featured_at = NOW() 
         WHERE id = $1`,
        [battleId, featuredOrder]
      );

      // Upsert into pk_featured_battles
      await query(
        `INSERT INTO popolive.pk_featured_battles (battle_id, featured_by, featured_order, status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (battle_id) DO UPDATE SET
           featured_order = EXCLUDED.featured_order,
           status = 'active',
           updated_at = NOW()`,
        [battleId, adminId, featuredOrder]
      );
    } else {
      // Unfeature battle
      await query(
        `UPDATE popolive.pk_battles 
         SET is_featured = false, featured_order = 0 
         WHERE id = $1`,
        [battleId]
      );

      await query(
        `UPDATE popolive.pk_featured_battles 
         SET status = 'removed', updated_at = NOW() 
         WHERE battle_id = $1`,
        [battleId]
      );
    }

    return NextResponse.json({
      success: true,
      battleId,
      isFeatured: Boolean(isFeatured),
      featuredOrder,
      message: isFeatured ? 'Battle successfully featured' : 'Battle successfully unfeatured',
    });
  } catch (err: any) {
    console.error('API /api/pk/discovery/featured POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update featured battle state' },
      { status: 500 }
    );
  }
}
