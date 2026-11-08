const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

const faqsData = [
  // 1. Account and Registration
  {
    category: 'account_registration',
    display_order: 1,
    question_en: 'How do I register a new Popo Live account?',
    question_ur: 'میں پوپو لائیو کا نیا اکاؤنٹ کیسے رجسٹر کر سکتا ہوں؟',
    answer_en: 'You can register for Popo Live using your mobile phone number, email address, or third-party social accounts (Google, Facebook, Apple). During first open, accept the 18+ Terms of Service, provide your phone or email, enter the verification OTP, and complete your basic profile.',
    answer_ur: 'آپ اپنا موبائل فون نمبر، ای میل ایڈریس، یا سوشل اکاؤنٹس (گوگل، فیس بک، ایپل) کا استعمال کرتے ہوئے پوپو لائیو میں رجسٹر ہو سکتے ہیں۔ پہلی بار کھولنے پر، 18+ سروس کی شرائط قبول کریں، فون یا ای میل درج کریں، موصولہ او ٹی پی کوڈ لگائیں اور بنیادی پروفائل مکمل کریں۔'
  },
  {
    category: 'account_registration',
    display_order: 2,
    question_en: 'Why is 18+ age verification required?',
    question_ur: '18 سال سے زائد عمر کی تصدیق کیوں لازمی ہے؟',
    answer_en: 'Popo Live is strictly dedicated to adult entertainment and social broadcasting. Users must be at least 18 years old to create an account, broadcast live video, recharge coins, or join audio-video party rooms pursuant to international child protection and safety regulations.',
    answer_ur: 'پوپو لائیو مکمل طور پر 18 سال یا اس سے زائد عمر کے بالغ صارفین کے لیے ہے۔ لائیو نشریات، کوائنز ریچارج، اور پارٹی رومز میں شرکت کے لیے بین الاقوامی تحفظ اطفال قوانین کے مطابق 18 سال کی عمر لازمی ہے۔'
  },

  // 2. Login and Security
  {
    category: 'login_security',
    display_order: 3,
    question_en: 'What should I do if I forget my account password?',
    question_ur: 'اگر میں اپنے اکاؤنٹ کا پاس ورڈ بھول جاؤں تو کیا کروں؟',
    answer_en: 'Navigate to the Login page and click "Forgot Password?". Enter your registered email address or phone number to receive a secure password reset link or SMS code. If you also have a Security PIN set up, keep it confidential as it cannot be shared.',
    answer_ur: 'لاگ ان پیج پر جائیں اور "پاس ورڈ بھول گئے؟" پر کلک کریں۔ اپنا رجسٹرڈ ای میل یا فون نمبر درج کریں تاکہ آپ کو پاس ورڈ ری سیٹ کا محفوظ لنک یا ایس ایم ایس کوڈ مل سکے۔'
  },
  {
    category: 'login_security',
    display_order: 4,
    question_en: 'How does the Security PIN protect my account?',
    question_ur: 'سیکیورٹی پن میرے اکاؤنٹ کی حفاظت کیسے کرتا ہے؟',
    answer_en: 'A 4-6 digit numeric Security PIN provides an essential second line of defense against unauthorized coin spending, withdrawals, and profile tampering. If entered incorrectly 5 times, it enters a 15-minute brute-force lockout.',
    answer_ur: '4 سے 6 ہندسوں کا عددی سیکیورٹی پن غیر مجاز کوائنز خرچ کرنے، رقم نکلوانے اور پروفائل میں تبدیلی سے بچاتا ہے۔ 5 بار غلط پن درج کرنے پر 15 منٹ کا عارضی لاک آؤٹ لگ جاتا ہے۔'
  },

  // 3. Profile and User ID
  {
    category: 'profile_userid',
    display_order: 5,
    question_en: 'Can I change my permanent Popo Live User ID?',
    question_ur: 'کیا میں اپنا مستقل پوپو لائیو یوزر آئی ڈی تبدیل کر سکتا ہوں؟',
    answer_en: 'No. Every Popo Live account is issued a permanent 7-10 digit numeric User ID generated automatically upon registration. This User ID never changes and is required for user search, coin recharge, customer support, and agency binding.',
    answer_ur: 'نہیں۔ ہر اکاؤنٹ کو رجسٹریشن کے وقت ایک مستقل عددی یوزر آئی ڈی دی جاتی ہے جو کبھی تبدیل نہیں ہو سکتی۔ یہ ریچارج، تلاش، سپورٹ اور ایجنسی کے لیے ضروری ہے۔'
  },
  {
    category: 'profile_userid',
    display_order: 6,
    question_en: 'How do I update my profile avatar and nickname?',
    question_ur: 'میں اپنے پروفائل کا اوتار اور عرفی نام (نک نیم) کیسے تبدیل کروں؟',
    answer_en: 'Go to "My Profile" (/profile) and click "Edit Profile". You can upload a new square avatar (PNG/JPG/WebP up to 5MB) and update your nickname, gender, and bio. Nicknames must be between 3 and 20 alphanumeric characters.',
    answer_ur: 'اپنے پروفائل (/profile) پر جائیں اور "ایڈٹ پروفائل" پر کلک کریں۔ آپ نیا اوتار اپ لوڈ کر سکتے ہیں اور اپنا نک نیم اور بائیو تبدیل کر سکتے ہیں۔'
  },

  // 4. Coins and Gifts
  {
    category: 'coins_gifts',
    display_order: 7,
    question_en: 'How do coins and animated gifts work?',
    question_ur: 'کوائنز اور تحائف کا نظام کیسے کام کرتا ہے؟',
    answer_en: 'Coins are Popo Live virtual currency used to send interactive gifts, fireworks, luxury entrance effects, and tips to your favorite hosts during live broadcasts and party rooms. Hosts convert received gifts into points that can be redeemed.',
    answer_ur: 'کوائنز پوپو لائیو کی ورچوئل کرنسی ہے جو لائیو براڈکاسٹ کے دوران میزبانوں کو تحائف اور ٹپس بھیجنے کے لیے استعمال ہوتی ہے۔ میزبان ان تحائف کو پوائنٹس میں تبدیل کر سکتے ہیں۔'
  },

  // 5. Payments and Recharge
  {
    category: 'payments_recharge',
    display_order: 8,
    question_en: 'How do I recharge coins to my account or a friend’s account?',
    question_ur: 'میں اپنے یا کسی دوست کے اکاؤنٹ میں کوائنز کیسے ریچارج کروں؟',
    answer_en: 'Visit the Coin Recharge page (/recharge). Enter any valid Popo Live numeric User ID, verify the avatar and nickname, select your coin package, choose your payment method (Credit/Debit Card, JazzCash, Easypaisa, Google Pay), and confirm payment.',
    answer_ur: 'کوائن ریچارج پیج (/recharge) پر جائیں۔ درست پوپو یوزر آئی ڈی درج کریں، کوائن پیکیج اور ادائیگی کا طریقہ (کارڈ، ایزی پیسہ، جاز کیش) منتخب کریں اور تصدیق کریں۔'
  },
  {
    category: 'payments_recharge',
    display_order: 9,
    question_en: 'What should I do if my payment succeeded but coins did not arrive?',
    question_ur: 'اگر ادائیگی کامیاب ہو جائے لیکن کوائنز موصول نہ ہوں تو کیا کروں؟',
    answer_en: 'In rare cases of bank network latency, delivery may take up to 10 minutes. If coins have not arrived after 15 minutes, submit a support ticket under "Payment and Recharge" with your transaction ID, Popo User ID, and payment receipt screenshot.',
    answer_ur: 'بینک نیٹ ورک کی تاخیر کی وجہ سے کوائنز کی ترسیل میں 10 منٹ تک لگ سکتے ہیں۔ اگر 15 منٹ بعد بھی نہ ملیں تو رسید کے اسکرین شاٹ اور ٹرانزیکشن آئی ڈی کے ساتھ سپورٹ ٹکٹ درج کریں۔'
  },

  // 6. Live Streaming
  {
    category: 'live_streaming',
    display_order: 10,
    question_en: 'What are the requirements to start broadcasting live?',
    question_ur: 'لائیو نشریات شروع کرنے کے لیے کیا شرائط ہیں؟',
    answer_en: 'To go live, hosts must be 18+ verified, have completed their basic profile with an approved real avatar, comply with Community Guidelines, and maintain a stable high-speed internet connection (minimum 5 Mbps upload).',
    answer_ur: 'لائیو جانے کے لیے ضروری ہے کہ آپ 18 سال سے زیادہ عمر کے تصدیق شدہ ہوں، پروفائل مکمل ہو، کمیونٹی گائیڈ لائنز کی پابندی کریں اور اچھا انٹرنیٹ کنکشن موجود ہو۔'
  },

  // 7. Party Rooms
  {
    category: 'party_rooms',
    display_order: 11,
    question_en: 'What is a Multi-Guest Party Room?',
    question_ur: 'ملٹی گیسٹ پارٹی روم کیا ہوتا ہے؟',
    answer_en: 'Party rooms allow 4 to 12 creators and guests to engage in voice and video group discussions, host interactive games (PK battles, lucky draws), and share collaborative streaming sessions.',
    answer_ur: 'پارٹی رومز میں 4 سے 12 تخلیق کار اور مہمان بیک وقت آڈیو یا ویڈیو گفتگو کر سکتے ہیں، پی کے مقابلے اور باہمی اسٹریمنگ منعقد کر سکتے ہیں۔'
  },

  // 8. Agency
  {
    category: 'agency',
    display_order: 12,
    question_en: 'How do I join or create a Popo Live Agency?',
    question_ur: 'میں پوپو لائیو ایجنسی کیسے جوائن یا بنا سکتا ہوں؟',
    answer_en: 'Creators can bind to an official Agency using the Agency ID provided by their talent manager. Agencies provide structured hosting training, weekly rewards, and promotional traffic support. To register a new agency, visit the Agency Portal (/agency).',
    answer_ur: 'تخلیق کار ایجنسی آئی ڈی کے ذریعے کسی باضابطہ ایجنسی سے منسلک ہو سکتے ہیں۔ ایجنسیاں تربیت، انعامات اور ٹریفک سپورٹ فراہم کرتی ہیں۔ نئی ایجنسی کے لیے ایجنسی پورٹل (/agency) وزٹ کریں۔'
  },

  // 9. Privacy and Safety
  {
    category: 'privacy_safety',
    display_order: 13,
    question_en: 'How do I block or report abusive users and harassment?',
    question_ur: 'میں نامناسب رویے یا ہراساں کرنے والے صارفین کو کیسے بلاک یا رپورٹ کروں؟',
    answer_en: 'Open the user’s Public Profile (/user/[userId]), click the More Options (•••) menu, and select "Block User" or "Report". Blocked users cannot follow you, view your private data, or send direct messages. All reports are investigated within 24 hours.',
    answer_ur: 'صارف کے پبلک پروفائل (/user/[userId]) پر جائیں، مزید آپشنز مینو پر کلک کریں اور "بلاک یوزر" یا "رپورٹ" منتخب کریں۔ بلاک شدہ افراد آپ کو میسج نہیں بھیج سکیں گے۔'
  }
];

const articlesData = [
  {
    slug: 'getting-started-guide',
    category: 'account_registration',
    title_en: 'Getting Started with Popo Live: The Complete Beginner’s Guide',
    title_ur: 'پوپو لائیو کے ساتھ آغاز: مکمل ابتدائی رہنما',
    content_en: 'Welcome to Popo Live! This comprehensive guide walks you through account creation, basic profile setup, navigating the live explore feed, understanding host levels and wealth badges, recharging coins, and engaging safely with global broadcasters.',
    content_ur: 'پوپو لائیو میں خوش آمدید! یہ جامع گائیڈ آپ کو اکاؤنٹ بنانے، پروفائل ترتیب دینے، لائیو نشریات تلاش کرنے، ہوسٹ لیولز اور ویلتھ بیجز کو سمجھنے اور کوائنز ریچارج کرنے کا طریقہ بتاتی ہے۔'
  },
  {
    slug: 'security-pin-and-account-protection',
    category: 'login_security',
    title_en: 'How to Set Up and Protect Your Account with a Security PIN',
    title_ur: 'سیکیورٹی پن ترتیب دینے اور اپنے اکاؤنٹ کی حفاظت کرنے کا طریقہ',
    content_en: 'Protecting your Popo Live digital assets is our highest priority. Learn how to activate a 4-6 digit numeric Security PIN, how brute-force protection works (5-attempt lockout), and how to recover your PIN via account password verification.',
    content_ur: 'اپنے پوپو لائیو اکاؤنٹ اور اثاثوں کی حفاظت کے لیے سیکیورٹی پن کو فعال کریں۔ 5 غلط کوششوں پر 15 منٹ کا لاک آؤٹ اور پاس ورڈ سے پن ری سیٹ کرنے کا طریقہ جانیں۔'
  },
  {
    slug: 'coin-recharge-and-wallet-troubleshooting',
    category: 'payments_recharge',
    title_en: 'Troubleshooting Payment Failures and Coin Recharge Issues',
    title_ur: 'ادائیگی کی خرابی اور کوائن ریچارج کے مسائل کا حل',
    content_en: 'Having trouble purchasing coins? Read our detailed guide on payment gateway verification, supported local and international payment cards, bank 3D-Secure approvals, and how to file a payment recovery ticket with customer support.',
    content_ur: 'کوائنز خریدنے میں دشواری کا سامنا ہے؟ پیمنٹ گیٹ وے، کریڈٹ کارڈز، ایزی پیسہ، جاز کیش کی تفصیلات اور گمشدہ ادائیگی کی بازیابی کا طریقہ جانیں۔'
  },
  {
    slug: 'broadcaster-streamer-rules-and-safety',
    category: 'live_streaming',
    title_en: 'Broadcaster Community Guidelines & Safe Streaming Standards',
    title_ur: 'براڈکاسٹر کمیونٹی گائیڈ لائنز اور محفوظ اسٹریمنگ کے اصول',
    content_en: 'All streamers must adhere to strict community standards prohibiting nudity, hate speech, dangerous stunts, copyright infringement, and underage participation. Learn how to maintain host compliance and avoid broadcasting suspensions.',
    content_ur: 'تمام براڈکاسٹرز کے لیے کمیونٹی قوانین کی پابندی لازم ہے جن میں نامناسب مواد، نفرت انگیز بیانات اور نابالغ افراد کی شمولیت پر سخت پابندی عائد ہے۔'
  }
];

async function run() {
  console.log('Connecting to PostgreSQL database...');
  const client = await pool.connect();
  try {
    console.log('Applying Migration 007...');
    const sql = fs.readFileSync(path.join(__dirname, '007_help_tickets_feedback.sql'), 'utf-8');
    await client.query(sql);
    console.log('[SUCCESS] Tables created/verified in schema popolive.');

    // Seed FAQs
    console.log('Seeding FAQs...');
    for (const faq of faqsData) {
      await client.query(
        `INSERT INTO popolive.help_faqs 
         (category, question_en, question_ur, answer_en, answer_ur, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [faq.category, faq.question_en, faq.question_ur, faq.answer_en, faq.answer_ur, faq.display_order]
      );
    }
    console.log(`[SUCCESS] Seeded ${faqsData.length} FAQs.`);

    // Seed Help Articles
    console.log('Seeding Help Articles...');
    for (const art of articlesData) {
      await client.query(
        `INSERT INTO popolive.help_articles 
         (slug, category, title_en, title_ur, content_en, content_ur)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slug) DO UPDATE
         SET title_en = EXCLUDED.title_en, title_ur = EXCLUDED.title_ur, content_en = EXCLUDED.content_en, content_ur = EXCLUDED.content_ur`,
        [art.slug, art.category, art.title_en, art.title_ur, art.content_en, art.content_ur]
      );
    }
    console.log(`[SUCCESS] Seeded ${articlesData.length} Help Articles.`);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
