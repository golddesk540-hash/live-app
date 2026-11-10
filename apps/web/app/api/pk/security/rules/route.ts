import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CANONICAL_FAIR_PLAY_RULES, PKFairPlayRule } from '@/lib/pk';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const rows = await query<any>(
      `SELECT id, title, title_ur, summary, summary_ur, description, display_order, icon_name, is_active
       FROM popolive.pk_fair_play_rules
       WHERE is_active = true
       ORDER BY display_order ASC`
    );

    let rules: PKFairPlayRule[] = [];
    if (rows && rows.length > 0) {
      rules = rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        titleUr: r.title_ur,
        summary: r.summary,
        summaryUr: r.summary_ur,
        description: r.description,
        displayOrder: r.display_order,
        iconName: r.icon_name,
        isActive: r.is_active,
      }));
    } else {
      rules = CANONICAL_FAIR_PLAY_RULES;
    }

    return NextResponse.json({
      success: true,
      title: 'Fair Play',
      titleUr: 'فیئر پلے',
      subtitle: 'PK Battle Fair Play and Anti-Cheat System',
      subtitleUr: 'پی کے مقابلہ میں دیانت داری اور اینٹی چیٹ سسٹم',
      rules,
      count: rules.length,
      securityShieldActive: true,
      watermark: '6.9 Fair Play Basics',
      watermarkUr: '6.9 فیئر پلے اصول',
    });
  } catch (err: any) {
    console.error('API /api/pk/security/rules error:', err);
    return NextResponse.json({
      success: true,
      title: 'Fair Play',
      titleUr: 'فیئر پلے',
      rules: CANONICAL_FAIR_PLAY_RULES,
      count: CANONICAL_FAIR_PLAY_RULES.length,
      securityShieldActive: true,
      watermark: '6.9 Fair Play Basics',
    });
  }
}
