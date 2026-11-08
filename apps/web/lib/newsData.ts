export interface Article {
  slug: string;
  title: string;
  titleUr?: string;
  category: 'Platform Updates' | 'Community News' | 'Creator Updates' | 'Events' | 'Announcements';
  categoryUr?: string;
  date: string;
  readTime: string;
  image: string;
  description: string;
  descriptionUr?: string;
  content: string[];
  contentUr?: string[];
  featured?: boolean;
}

export const newsCategories = [
  'All News',
  'Platform Updates',
  'Community News',
  'Creator Updates',
  'Events',
  'Announcements',
] as const;

export type NewsCategory = typeof newsCategories[number];

export const allNewsArticles: Article[] = [
  {
    slug: 'new-gift-series-now-live',
    title: 'New Gift Series Now Live! 🎁 Exclusive 3D Animations & Streamer Rewards',
    titleUr: 'نیا گفٹ سیریز اب لائیو ہے! 🎁 خصوصی تھری ڈی اینیمیشنز اور ہوسٹ انعامات',
    category: 'Platform Updates',
    categoryUr: 'پلیٹ فارم اپڈیٹس',
    date: 'Nov 7, 2026',
    readTime: '3 min read',
    featured: true,
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80',
    description:
      'Explore our all-new celestial gift collection featuring the Galaxy Rocket, Luxury Castle, and Dragon Flight. Every gift grants spectacular room-wide visual effects and a transparent 70% point share to broadcasters.',
    descriptionUr:
      'ہمارے نئے خلائی اور شاہی گفٹ کلیکشن کو دریافت کریں جس میں گلیکسی راکٹ، لگژری کیسل اور ڈریگن فلائٹ شامل ہیں۔ ہر گفٹ پر شاندار اینیمیشن اور ہوسٹ کو ستر فیصد پوائنٹس ملتے ہیں۔',
    content: [
      'We are thrilled to unveil our latest Luxury 3D Gift Series, designed to make every broadcast celebration unforgettable. Broadcasters and viewers across the globe can now experience cutting-edge particle animations directly in live streams and party rooms.',
      'Key Highlights of the New Series:',
      '• Galaxy Rocket & Dragon Flight: Room-wide screen takeovers with immersive sound effects.',
      '• Transparent 70% Creator Share: Every coin spent on gifts automatically converts into withdrawable host points at our guaranteed 70% rate.',
      '• Real-time Gifter Leaderboards: Top supporters unlock exclusive profile badges, gilded chat names, and VIP room entrance carriages.',
      'Log into the app today, check out the updated gift drawer, and support your favorite broadcasters!',
    ],
    contentUr: [
      'ہمیں نیا لگژری تھری ڈی گفٹ سیریز پیش کرتے ہوئے بے حد خوشی ہو رہی ہے جو ہر نشریات کو یادگار بناتا ہے۔ دنیا بھر کے ناظرین اب جدید اینیمیشنز سے لطف اندوز ہو سکتے ہیں۔',
      'اہم خصوصیات:',
      '• گلیکسی راکٹ اور ڈریگن فلائٹ: فل اسکرین اینیمیشنز اور جدید ساؤنڈ ایفیکٹس۔',
      '• شفاف ۷۰ فیصد کری ایٹر شیئر: ہر گفٹ کے سکے خودکار طور پر ہوسٹ کے قابل واپسی پوائنٹس میں تبدیل ہوتے ہیں۔',
      '• لائیو گفٹر لیڈر بورڈ: ٹاپ سپورٹرز کو خصوصی بیجز اور وی آئی پی انٹری ملتی ہے۔',
    ],
  },
  {
    slug: 'pk-battle-season-3-starts-soon',
    title: 'PK Battle Season 3 Starts Soon: The Ultimate 1v1 Arena Championship',
    titleUr: 'پی کے مقابلہ سیزن ۳ جلد شروع ہو رہا ہے: حتمی ۱ بمقابلہ ۱ چیمپئن شپ',
    category: 'Events',
    categoryUr: 'ایونٹس',
    date: 'Nov 5, 2026',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    description:
      'Registration is now open for the Popo Live PK Arena Championship Season 3. Two broadcasters battle head-to-head while fan communities push the live score bar to claim regional glory.',
    descriptionUr:
      'پوپو لائیو پی کے چیمپئن شپ سیزن ۳ کے لیے رجسٹریشن کھل چکی ہے۔ دو ہوسٹس آمنے سامنے مقابلہ کریں گے جبکہ فینز لائیو اسکور بار کو فتح کی جانب دھکیلیں گے۔',
    content: [
      'Prepare for intense rivalry as Popo Live announces PK Battle Season 3! Broadcasters with Wealth Level 5 and verified KYC status are invited to register for this month-long knockout tournament.',
      'Tournament Structure & Rules:',
      '• 5-Minute Head-to-Head Showdowns: Broadcasters showcase their talents while dynamic score bars reflect real-time gift points.',
      '• Regional Leaderboards: Country champions earn custom profile crowns, stream exposure on the Explore feed, and bonus point multipliers.',
      '• Supporter Rewards: Fans of victorious streamers receive limited-edition badge borders and coin cashbacks.',
      'Register through your Creator Center before the bracket locks on November 12th.',
    ],
  },
  {
    slug: 'platform-update-v1-new-features',
    title: 'Platform Update v1.0 New Features: High-Concurrency Low Latency RTC',
    titleUr: 'پلیٹ فارم اپڈیٹ v1.0 کی نئی خصوصیات: انتہائی تیز رفتار لائیو ویڈیو نیٹ ورک',
    category: 'Platform Updates',
    categoryUr: 'پلیٹ فارم اپڈیٹس',
    date: 'Nov 1, 2026',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    description:
      'Version 1.0 brings enhanced video rendering codecs, faster in-room chat message delivery, and reduced battery consumption across all mobile devices.',
    descriptionUr:
      'ورژن 1.0 میں جدید ویڈیو رینڈرنگ، فوری چیٹ میسج ڈلیوری، اور بیٹری کی بچت کے جدید ٹولز شامل کیے گئے ہیں۔',
    content: [
      'Our engineering team is proud to roll out Platform Update v1.0, focusing on core infrastructure improvements and live streaming performance.',
      'What is New in v1.0:',
      '• Sub-second Latency: Streaming video latency reduced to under 400ms globally.',
      '• Adaptive Bitrate: Smooth playback dynamically adjusts to weak network environments without stream interruption.',
      '• Low Battery Footprint: Up to 25% less battery consumption during extended live watching sessions.',
    ],
  },
  {
    slug: 'global-creator-summit-2026',
    title: 'Popo Live Global Creator Summit 2026: Honoring Top Broadcasters',
    titleUr: 'پوپو لائیو عالمی کری ایٹر سمٹ ۲۰۲۶: بہترین براڈکاسٹرز کے لیے خصوصی اعزازات',
    category: 'Creator Updates',
    categoryUr: 'کری ایٹر اپڈیٹس',
    date: 'Oct 28, 2026',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    description:
      'Over 500 leading creators and partner agencies gathered at our annual flagship summit to celebrate creative excellence and preview upcoming feature roadmaps.',
    descriptionUr:
      'سالانہ فلیگ شپ سمٹ میں ۵۰۰ سے زائد صفِ اول کے ہوسٹس اور ایجنسیوں نے شرکت کی جہاں نئے انعامات اور روڈ میپ کا اعلان کیا گیا۔',
    content: [
      'The Popo Live Global Creator Summit celebrated the passion and dedication of broadcasters who bring joy to millions every day.',
      'Key Announcements:',
      '• Daily Host Quest Multipliers: Streak bonuses for consistent broadcasters.',
      '• Dedicated Agency Analytics Portal: Providing talent managers with granular streaming hour reports and automated settlements.',
      '• New VIP Tiers: Exclusive perks for our most engaged community supporters.',
    ],
  },
  {
    slug: 'trust-safety-charter-child-protection',
    title: 'Trust & Safety Charter: Zero-Tolerance Child Safety & Live Moderation',
    titleUr: 'حفاظتی چارٹر: بچوں کے تحفظ کے لیے زیرو ٹالرنس اور ریئل ٹائم مانیٹرنگ',
    category: 'Announcements',
    categoryUr: 'اعلانات',
    date: 'Oct 22, 2026',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    description:
      'Popo Live reaffirms its strict 18+ platform policy, AI live stream moderation, and immediate hardware device bans for prohibited content violations.',
    descriptionUr:
      'پوپو لائیو ۱۸ سال سے کم عمر افراد کے لیے سخت پابندی اور محفوظ کمیونٹی کے قیام کے لیے اپنے عزم کا اعادہ کرتا ہے۔',
    content: [
      'User safety and trust are the foundation of everything we build at Popo Live. Today we published our comprehensive Safety Charter.',
      'Core Commitments:',
      '• Mandatory 18+ Age Gate: Broadcasters must complete facial age verification before streaming.',
      '• 24/7 Live Moderation Queue: Human safety specialists review flagged streams within seconds.',
      '• Immediate Kill-Switch: Instant stream termination and permanent hardware bans for severe violations.',
    ],
  },
  {
    slug: 'next-gen-9-seat-party-lounges',
    title: 'Introducing Next-Gen 9-Seat Party Room Themes and Studio Soundboard',
    titleUr: '۹ سیٹوں والے وائس پارٹی رومز: نئے تھیمز اور اسٹوڈیو ساؤنڈ بورڈ کا اجرا',
    category: 'Community News',
    categoryUr: 'کمیونٹی نیوز',
    date: 'Oct 15, 2026',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    description:
      'Party rooms now feature customizable 3D atmospheric skins, stereo microphone audio enhancements, and host seat moderation tools.',
    descriptionUr:
      'پارٹی رومز میں اب کسٹم تھری ڈی بیک گراؤنڈز، ہائی فائی آڈیو کوالٹی اور ہوسٹ کے لیے جدید مائیک کنٹرولز شامل ہیں۔',
    content: [
      'Party rooms are where users gather to sing, talk, and share stories. Our new update elevates this experience to a new level.',
      'Features include:',
      '• 1 Host + 8 Guest Seats: Clean grid layout with animated active speaker wave indicators.',
      '• Atmosphere Skins: Switch between Neon Nightclub, Cozy Cafe, and Cosmic Space themes.',
      '• Interactive Soundboard: Fun audio reactions including applause, party horns, and drum rolls.',
    ],
  },
];
