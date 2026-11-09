import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CANONICAL_PARTY_CATEGORIES } from '@/lib/party';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let categories = CANONICAL_PARTY_CATEGORIES;

    try {
      const rows = await query(
        `SELECT id, name, icon, display_order 
         FROM popolive.party_categories 
         WHERE is_active = true 
         ORDER BY display_order ASC`
      );
      if (rows && rows.length > 0) {
        categories = rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          icon: r.icon,
          displayOrder: r.display_order,
        }));
      }
    } catch (dbErr) {
      console.warn('DB categories fetch warning, using defaults:', dbErr);
    }

    return NextResponse.json({
      success: true,
      categories,
      total: categories.length,
    });
  } catch (error: any) {
    console.error('API /party/categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve party categories' },
      { status: 500 }
    );
  }
}
