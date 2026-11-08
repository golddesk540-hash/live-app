import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { faqId: string } }
) {
  try {
    const { faqId } = params;
    if (!faqId) {
      return NextResponse.json({ error: 'FAQ ID is required' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { isHelpful } = body;
    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json({ error: 'isHelpful must be a boolean (true/false)' }, { status: 400 });
    }

    const user = await getAuthenticatedUser(req).catch(() => null);
    const forwarded = req.headers.get('x-forwarded-for') || '';
    const rawIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(rawIp + (user?.id || '')).digest('hex').substring(0, 32);

    // Check if user already rated this FAQ
    const existing = await query(
      `SELECT id, is_helpful FROM popolive.faq_ratings WHERE faq_id = $1 AND ip_hash = $2 LIMIT 1`,
      [faqId, ipHash]
    );

    if (existing.length > 0) {
      const priorVote = existing[0].is_helpful;
      if (priorVote === isHelpful) {
        const current = await query(
          `SELECT helpful_count, not_helpful_count FROM popolive.help_faqs WHERE id = $1`,
          [faqId]
        );
        return NextResponse.json({
          success: true,
          message: 'Your rating has already been recorded.',
          alreadyVoted: true,
          helpfulCount: current[0]?.helpful_count || 0,
          notHelpfulCount: current[0]?.not_helpful_count || 0,
        });
      }

      // Switch vote
      await query(
        `UPDATE popolive.faq_ratings SET is_helpful = $1, created_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [isHelpful, existing[0].id]
      );

      if (isHelpful) {
        await query(
          `UPDATE popolive.help_faqs SET helpful_count = helpful_count + 1, not_helpful_count = GREATEST(not_helpful_count - 1, 0) WHERE id = $1`,
          [faqId]
        );
      } else {
        await query(
          `UPDATE popolive.help_faqs SET not_helpful_count = not_helpful_count + 1, helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = $1`,
          [faqId]
        );
      }
    } else {
      // First time vote
      await query(
        `INSERT INTO popolive.faq_ratings (faq_id, user_id, ip_hash, is_helpful)
         VALUES ($1, $2, $3, $4)`,
        [faqId, user?.id || null, ipHash, isHelpful]
      );

      if (isHelpful) {
        await query(
          `UPDATE popolive.help_faqs SET helpful_count = helpful_count + 1 WHERE id = $1`,
          [faqId]
        );
      } else {
        await query(
          `UPDATE popolive.help_faqs SET not_helpful_count = not_helpful_count + 1 WHERE id = $1`,
          [faqId]
        );
      }
    }

    const updated = await query(
      `SELECT helpful_count, not_helpful_count FROM popolive.help_faqs WHERE id = $1`,
      [faqId]
    );

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
      helpfulCount: updated[0]?.helpful_count || 0,
      notHelpfulCount: updated[0]?.not_helpful_count || 0,
    });
  } catch (err: any) {
    console.error('Error in POST /api/help/faqs/[faqId]/rating:', err);
    return NextResponse.json({ success: false, error: 'Failed to record rating' }, { status: 500 });
  }
}
