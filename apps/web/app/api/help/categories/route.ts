import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CATEGORIES_CONFIG = [
  {
    id: 'account_registration',
    slug: 'account-registration',
    title_en: 'Account & Registration',
    title_ur: 'اکاؤنٹ اور رجسٹریشن',
    icon: 'UserPlus',
    description_en: 'Sign up, 18+ age verification, and account creation',
    description_ur: 'سائن اپ، 18+ عمر کی تصدیق اور نیا اکاؤنٹ بنانا',
  },
  {
    id: 'login_security',
    slug: 'login-security',
    title_en: 'Login & Security',
    title_ur: 'لاگ ان اور سیکیورٹی',
    icon: 'Shield',
    description_en: 'Password resets, 2FA, Security PIN, and active sessions',
    description_ur: 'پاس ورڈ کی بازیابی، سیکیورٹی پن اور ایکٹو سیشنز',
  },
  {
    id: 'profile_userid',
    slug: 'profile-user-id',
    title_en: 'Profile & User ID',
    title_ur: 'پروفائل اور یوزر آئی ڈی',
    icon: 'User',
    description_en: 'Permanent numeric User ID, nicknames, and avatar updates',
    description_ur: 'مستقل عددی یوزر آئی ڈی، عرفی نام اور اوتار',
  },
  {
    id: 'coins_gifts',
    slug: 'coins-gifts',
    title_en: 'Coins & Gifts',
    title_ur: 'سکے اور تحائف',
    icon: 'Gift',
    description_en: 'Virtual currency, sending gifts, point conversion, and tips',
    description_ur: 'ورچوئل سکے، تحائف بھیجنا اور پوائنٹس تبدیل کرنا',
  },
  {
    id: 'payments_recharge',
    slug: 'payments-recharge',
    title_en: 'Payments & Recharge',
    title_ur: 'ادائیگی اور ریچارج',
    icon: 'CreditCard',
    description_en: 'Bank cards, wallets, missing coin recovery, and receipts',
    description_ur: 'بینک کارڈز، ای والٹس، اور گمشدہ ادائیگی کی بازیابی',
  },
  {
    id: 'live_streaming',
    slug: 'live-streaming',
    title_en: 'Live Streaming',
    title_ur: 'لائیو اسٹریمنگ',
    icon: 'Radio',
    description_en: 'Broadcasting guidelines, host levels, video quality, and PK battles',
    description_ur: 'براڈکاسٹنگ گائیڈ لائنز، ہوسٹ لیولز اور پی کے مقابلے',
  },
  {
    id: 'party_rooms',
    slug: 'party-rooms',
    title_en: 'Party Rooms',
    title_ur: 'پارٹی رومز',
    icon: 'Users',
    description_en: 'Multi-guest voice rooms, seat reservation, and host tools',
    description_ur: 'ملٹی گیسٹ وائس رومز، نشستیں اور میزبان کے اختیارات',
  },
  {
    id: 'agency',
    slug: 'agency',
    title_en: 'Agency Support',
    title_ur: 'ایجنسی سپورٹ',
    icon: 'Briefcase',
    description_en: 'Joining an agency, talent manager codes, and host settlement',
    description_ur: 'ایجنسی میں شمولیت، ٹیلنٹ مینیجر اور ادائیگی کا طریقہ کار',
  },
  {
    id: 'privacy_safety',
    slug: 'privacy-safety',
    title_en: 'Privacy & Safety',
    title_ur: 'پرائیویسی اور حفاظت',
    icon: 'Lock',
    description_en: 'Blocking users, reporting harassment, and child protection',
    description_ur: 'صارفین کو بلاک کرنا، رپورٹ کرنا اور بچوں کا تحفظ',
  },
];

export async function GET() {
  try {
    // Count FAQs per category
    const counts = await query<{ category: string; count: string }>(
      `SELECT category, COUNT(*)::text as count FROM popolive.help_faqs WHERE is_published = true GROUP BY category`
    );
    const countMap: Record<string, number> = {};
    counts.forEach((r) => {
      countMap[r.category] = parseInt(r.count, 10);
    });

    const categories = CATEGORIES_CONFIG.map((cat) => ({
      ...cat,
      faqCount: countMap[cat.id] || 0,
    }));

    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    console.error('Error in GET /api/help/categories:', err);
    return NextResponse.json({ success: false, error: 'Failed to load categories' }, { status: 500 });
  }
}
