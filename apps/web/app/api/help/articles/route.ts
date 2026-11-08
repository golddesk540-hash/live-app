import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const slug = searchParams.get('slug');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (slug) {
      const articles = await query(
        `SELECT id, slug, category, title_en, title_ur, content_en, content_ur, language, view_count, created_at, updated_at
         FROM popolive.help_articles
         WHERE slug = $1 AND is_published = true
         LIMIT 1`,
        [slug]
      );
      if (articles.length === 0) {
        return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
      }
      // Increment view count asynchronously
      query(`UPDATE popolive.help_articles SET view_count = view_count + 1 WHERE slug = $1`, [slug]).catch(() => {});
      return NextResponse.json({ success: true, article: articles[0] });
    }

    let sql = `SELECT id, slug, category, title_en, title_ur, content_en, content_ur, language, view_count, created_at, updated_at
               FROM popolive.help_articles
               WHERE is_published = true`;
    const params: any[] = [];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ` ORDER BY view_count DESC, created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const articles = await query(sql, params);
    return NextResponse.json({ success: true, articles });
  } catch (err: any) {
    console.error('Error in GET /api/help/articles:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch articles' }, { status: 500 });
  }
}
