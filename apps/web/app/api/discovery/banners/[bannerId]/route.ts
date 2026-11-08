import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { bannerId: string } }
) {
  try {
    const { bannerId } = params;
    if (!bannerId) {
      return NextResponse.json({ success: false, error: 'Banner ID is required.' }, { status: 400 });
    }

    const rows = await query<any>(
      `SELECT 
        id, title, description, desktop_image_url, mobile_image_url,
        destination, cta_text, badge_text, display_order, start_date, end_date, active, created_at
       FROM popolive.discovery_banners
       WHERE id = $1
       LIMIT 1`,
      [bannerId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Banner not found.' }, { status: 404 });
    }

    const b = rows[0];
    const isCurrentlyActive = Boolean(
      b.active &&
      new Date(b.start_date) <= new Date() &&
      new Date(b.end_date) >= new Date()
    );

    return NextResponse.json({
      success: true,
      banner: {
        id: b.id,
        title: b.title,
        description: b.description || '',
        desktopImageUrl: b.desktop_image_url,
        mobileImageUrl: b.mobile_image_url || b.desktop_image_url,
        destination: b.destination || '/ranking',
        ctaText: b.cta_text || 'View Now >',
        badgeText: b.badge_text || 'HOT',
        displayOrder: b.display_order,
        startDate: b.start_date,
        endDate: b.end_date,
        active: b.active,
        isCurrentlyActive,
        createdAt: b.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error fetching banner details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banner', details: error.message },
      { status: 500 }
    );
  }
}
