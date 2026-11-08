import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let sql = `SELECT id, category, question_en, question_ur, answer_en, answer_ur, helpful_count, not_helpful_count, display_order, created_at
               FROM popolive.help_faqs
               WHERE is_published = true`;
    const params: any[] = [];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ` ORDER BY display_order ASC, created_at ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const faqs = await query(sql, params);
    return NextResponse.json({ success: true, faqs });
  } catch (err: any) {
    console.error('Error in GET /api/help/faqs:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}
