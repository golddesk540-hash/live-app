import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live/categories
 * Retrieve active live room categories.
 */
export async function GET(req: NextRequest) {
  try {
    const rows = await query<any>(
      `SELECT id, name, description, icon_name, display_order
       FROM popolive.live_categories
       WHERE is_active = true
       ORDER BY display_order ASC`
    );

    return NextResponse.json({
      success: true,
      categories: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        iconName: r.icon_name,
        displayOrder: r.display_order,
      })),
    });
  } catch (err: any) {
    console.error('GET /api/live/categories error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve live categories.' },
      { status: 500 }
    );
  }
}
