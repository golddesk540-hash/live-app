import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const all = searchParams.get('all') === 'true';

    let sql = `
      SELECT 
        id,
        title,
        description,
        desktop_image_url,
        mobile_image_url,
        destination,
        cta_text,
        badge_text,
        display_order,
        start_date,
        end_date,
        active,
        created_at
      FROM popolive.discovery_banners
    `;

    // Normal users only see active banners within current date window
    if (!all) {
      sql += `
        WHERE active = true 
          AND start_date <= CURRENT_TIMESTAMP 
          AND end_date >= CURRENT_TIMESTAMP
      `;
    }

    sql += `
      ORDER BY display_order ASC, created_at DESC
      LIMIT $1
    `;

    const rows = await query<any>(sql, [limit]);

    const banners = rows.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description || '',
      desktopImageUrl: b.desktop_image_url || '/images/banner-default.jpg',
      mobileImageUrl: b.mobile_image_url || b.desktop_image_url || '/images/banner-default.jpg',
      destination: b.destination || '/ranking',
      ctaText: b.cta_text || 'View Now >',
      badgeText: b.badge_text || 'HOT',
      displayOrder: b.display_order,
      startDate: b.start_date,
      endDate: b.end_date,
      isActive: b.active,
    }));

    return NextResponse.json({
      success: true,
      total: banners.length,
      banners,
    });
  } catch (error: any) {
    console.error('Error fetching discovery banners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discovery banners', details: error.message },
      { status: 500 }
    );
  }
}
