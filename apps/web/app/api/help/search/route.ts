import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const category = (searchParams.get('category') || '').trim();

    if (!q && !category) {
      return NextResponse.json({
        success: true,
        query: '',
        faqs: [],
        articles: [],
        totalResults: 0,
      });
    }

    const searchPattern = `%${q}%`;

    // 1. Search FAQs
    let faqSql = `
      SELECT id, category, question_en, question_ur, answer_en, answer_ur, helpful_count, not_helpful_count
      FROM popolive.help_faqs
      WHERE is_published = true
    `;
    const faqParams: any[] = [];

    if (q) {
      faqParams.push(searchPattern);
      faqSql += ` AND (
        question_en ILIKE $${faqParams.length} OR 
        question_ur ILIKE $${faqParams.length} OR 
        answer_en ILIKE $${faqParams.length} OR 
        answer_ur ILIKE $${faqParams.length}
      )`;
    }

    if (category && category !== 'all') {
      faqParams.push(category);
      faqSql += ` AND category = $${faqParams.length}`;
    }

    faqSql += ` ORDER BY helpful_count DESC, display_order ASC LIMIT 30`;

    // 2. Search Articles
    let artSql = `
      SELECT id, slug, category, title_en, title_ur, content_en, content_ur, view_count
      FROM popolive.help_articles
      WHERE is_published = true
    `;
    const artParams: any[] = [];

    if (q) {
      artParams.push(searchPattern);
      artSql += ` AND (
        title_en ILIKE $${artParams.length} OR 
        title_ur ILIKE $${artParams.length} OR 
        content_en ILIKE $${artParams.length} OR 
        content_ur ILIKE $${artParams.length}
      )`;
    }

    if (category && category !== 'all') {
      artParams.push(category);
      artSql += ` AND category = $${artParams.length}`;
    }

    artSql += ` ORDER BY view_count DESC LIMIT 20`;

    const [faqs, articles] = await Promise.all([
      query(faqSql, faqParams),
      query(artSql, artParams),
    ]);

    return NextResponse.json({
      success: true,
      query: q,
      category: category || 'all',
      faqs,
      articles,
      totalResults: faqs.length + articles.length,
    });
  } catch (err: any) {
    console.error('Error in GET /api/help/search:', err);
    return NextResponse.json({ success: false, error: 'Failed to search help knowledge base' }, { status: 500 });
  }
}
