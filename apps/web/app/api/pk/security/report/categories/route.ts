import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const categories = [
    {
      id: 'fake_traffic',
      name: 'Fake Traffic / Bots',
      nameUr: 'جعلی ٹریفک / بوٹس',
      description: 'Simulated viewers, automated bots, or artificially inflated numbers.',
    },
    {
      id: 'gift_abuse',
      name: 'Gift / Coin Abuse',
      nameUr: 'تحائف یا سکوں کا غلط استعمال',
      description: 'Self-gifting, chargeback fraud, or circular tipping rings.',
    },
    {
      id: 'multi_account',
      name: 'Multi-Account Operation',
      nameUr: 'ملٹی اکاؤنٹ پی کے',
      description: 'Single individual controlling both competing hosts or device farming.',
    },
    {
      id: 'score_manipulation',
      name: 'Score Manipulation',
      nameUr: 'اسکور میں ہیرا پھیری',
      description: 'Suspicious score jumps, script injection, or unauthorized score boosts.',
    },
    {
      id: 'cheating',
      name: 'Cheating & Exploit',
      nameUr: 'دھوکہ دہی اور خرابیوں کا استحصال',
      description: 'Exploiting software vulnerabilities or tampering with streaming feeds.',
    },
    {
      id: 'invitation_abuse',
      name: 'Invitation Flooding',
      nameUr: 'دعوت ناموں کی بھرمار',
      description: 'Harassing hosts with continuous unapproved battle invites.',
    },
    {
      id: 'spam',
      name: 'Chat / Reaction Spam',
      nameUr: 'چیٹ یا ری ایکشن سپیم',
      description: 'Automated macros or repetitive unwanted messages.',
    },
    {
      id: 'suspicious_behavior',
      name: 'Suspicious Behavior',
      nameUr: 'مشکوک طرز عمل',
      description: 'Unusual coordinated patterns or unsporting conduct.',
    },
    {
      id: 'other',
      name: 'Other Violation',
      nameUr: 'دیگر خلاف ورزی',
      description: 'Other violations against platform community safety rules.',
    },
  ];

  return NextResponse.json({
    success: true,
    categories,
    count: categories.length,
  });
}
