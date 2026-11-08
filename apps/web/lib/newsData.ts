export interface Article {
  slug: string;
  title: string;
  titleUr?: string;
  category: 'Latest News' | 'Product News' | 'Latest Events' | 'Compliance Updates';
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
  'Latest News',
  'Product News',
  'Latest Events',
  'Compliance Updates',
] as const;

export type NewsCategory = typeof newsCategories[number];

export const allNewsArticles: Article[] = [
  {
    slug: 'world-cup-carnival-2026',
    title: 'World Cup Carnival 2026: Celebrate the Goals and Win Mega Rewards!',
    titleUr: 'ورلڈ کپ کارنیول ۲۰۲۶: لائیو سٹریم میں گولز کا جشن منائیں اور شاندار انعامات جیتیں!',
    category: 'Latest Events',
    categoryUr: 'تازہ ترین ایونٹس',
    date: 'Jun 10, 2026',
    readTime: '3 min read',
    featured: true,
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    description:
      'Join Poppo Live’s grand World Cup celebration! Unlock limited-edition football jerseys, national flag live room effects, and share in a 10,000,000 coin prize pool.',
    descriptionUr:
      'پوپو لائیو کے شاندار ورلڈ کپ جشن میں شریک ہوں۔ خصوصی فٹبال اینیمیشنز، ملکی پرچم کے گفٹس اور ایک کروڑ کوائنز کا پول حاصل کریں۔',
    content: [
      'The biggest sporting event on earth has arrived on Poppo Live! From June 10th through July 15th, experience the electric atmosphere of the World Cup Carnival across all party rooms and live broadcasts.',
      'Event Highlights:',
      '• National Flag Virtual Gifts: Send your country’s animated jersey or trophy to boost your team on the Global Fan Board.',
      '• Prediction Arena: Join live broadcasters during match intervals to forecast winners and win bonus coin bags.',
      '• Exclusive Host Badges: Top streamers representing qualifying nations will receive commemorative 2026 Golden Cup badges.',
    ],
    contentUr: [
      'دنیا کا سب سے بڑا فٹبال میلہ اب پوپو لائیو پر! ۱۰ جون سے ۱۵ جولائی تک لائیو سٹریمز میں ورلڈ کپ کارنیول کے سنسنی خیز لمحات کا حصہ بنیں۔',
      'اہم خصوصیات:',
      '• ملکی پرچم والے ورچوئل تحائف اور جرسیاں۔',
      '• لائیو پیشین گوئی اور مفت کوائن انعامات۔',
      '• بہترین ہوسٹس کے لیے خصوصی گولڈن ٹرافی بیجز۔',
    ],
  },
  {
    slug: 'compliance-guidelines-update-pakistan',
    title: 'Compliance Guidelines Update for Pakistan & South Asia Creators',
    titleUr: 'پاکستان اور جنوبی ایشیا کے تخلیق کاروں کے لیے قانونی و کمیونٹی ضوابط کی تجدید',
    category: 'Compliance Updates',
    categoryUr: 'قانونی اپڈیٹس',
    date: 'May 24, 2026',
    readTime: '4 min read',
    featured: true,
    image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    description:
      'Important policy announcements regarding cultural sensitivity, strict 18+ broadcaster verification, local payout gateways, and enhanced safety measures.',
    descriptionUr:
      'مقامی ثقافتی احترام، ۱۸ سال کی لازمی تصدیق، جاز کیش و ایزی پیسہ سے محفوظ ادائیگیوں اور سخت سیکیورٹی اقدامات کا اعلان۔',
    content: [
      'Poppo Live is committed to fostering a respectful, legally compliant, and empowering ecosystem for all creators across Pakistan and South Asia.',
      'Key Compliance Directives:',
      '• Mandatory Biometric & CNIC 18+ Verification: All prospective broadcasters must submit valid government-issued ID.',
      '• Cultural & Moral Code of Conduct: Strict prohibition of vulgarity, harassment, hate speech, or political extremism.',
      '• Direct Local Settlement: Smooth agency settlements integrated with verified banking and digital wallets.',
    ],
    contentUr: [
      'پوپو لائیو پاکستان اور جنوبی ایشیا میں تمام تخلیق کاروں کے لیے ایک محفوظ، قانونی اور معزز ماحول فراہم کرنے کے لیے پرعزم ہے۔',
      'اہم ہدایات:',
      '• شناختی کارڈ اور بائیومیٹرک ۱۸+ تصدیق لازمی ہے۔',
      '• اخلاقی قواعد کی پابندی اور بدزبانی کی سخت ممانعت۔',
      '• محفوظ مقامی بینکنگ اور والٹس کے ذریعے شفاف ادائیگیاں۔',
    ],
  },
  {
    slug: 'fan-club-3-upgrade',
    title: 'Poppo Live Fan Club 3.0: Exclusive Badges and Custom Sound Effects',
    titleUr: 'پوپو لائیو فین کلب ۳.۰: خصوصی بیجز، اینیمیٹڈ انٹری اور کسٹم ساؤنڈ ایفیکٹس',
    category: 'Product News',
    categoryUr: 'پروڈکٹ نیوز',
    date: 'May 15, 2026',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80',
    description:
      'Empower your fans with brand-new loyalty medals, customizable room entrance vehicles, and direct host private message privileges.',
    descriptionUr:
      'اپنے مداحوں کو وفاداری کے نئے میڈلز، شاہی انٹری گاڑیاں اور خصوصی پرائیویٹ میسجز کی سہولت دیں۔',
    content: [
      'Introducing Fan Club 3.0—the most comprehensive loyalty update yet. Viewers can now level up their fan affinity through daily room visits and gift interactions.',
      'What’s New in 3.0:',
      '• Dynamic Medal Frames: Badges evolve as you climb from Level 1 Fan to Diamond Guardian.',
      '• Custom Room Entrance Audio: Play your signature entrance tune when stepping into your idol’s live room.',
      '• Private Fan Chat Channels: Exclusive host-led group rooms for club members.',
    ],
    contentUr: [
      'پیش ہے فین کلب ۳.۰—روزانہ حاضری اور گفٹنگ کے ذریعے اپنے فیورٹ ہوسٹ کے ساتھ خصوصی تعلق قائم کریں۔',
      'خصوصیات:',
      '• ڈائنامک میڈلز اور ڈائمنڈ گارڈین بیجز۔',
      '• لائیو روم میں داخل ہوتے ہی شاندار ساؤنڈ ایفیکٹ۔',
      '• خصوصی فین گروپ چیٹ اور ڈائریکٹ پیغامات۔',
    ],
  },
  {
    slug: 'global-fan-power-ranking',
    title: 'Global Fan Power Ranking: Who Will Crown the Monthly Star?',
    titleUr: 'عالمی فین پاور رینکنگ: اس ماہ کا چیمپئن کون بنے گا؟',
    category: 'Latest Events',
    categoryUr: 'تازہ ترین ایونٹس',
    date: 'May 01, 2026',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    description:
      'The monthly power ladder is now active! Top 10 supporters and broadcasters will be featured on Poppo Live’s global billboard in Times Square.',
    descriptionUr:
      'ماہانہ پاور رینکنگ مقابلہ شروع ہو گیا! ٹاپ ۱۰ سپورٹرز اور براڈکاسٹرز کو عالمی بل بورڈ پر نمایاں کیا جائے گا۔',
    content: [
      'Every coin and heart contributed in May counts towards the Global Fan Power Leaderboard. Support your beloved host and write your name in Poppo Live history.',
      'Prizes and Privileges:',
      '• No. 1 Supporter: 30-Day Exclusive Emperor Car Entrance & 1-on-1 Agency VIP Concierge.',
      '• No. 1 Broadcaster: Global Homepage Banner Feature & Custom Virtual Gift Design.',
    ],
    contentUr: [
      'مئی کے مہینے میں دیا گیا ہر گفٹ آپ کو عالمی لیڈر بورڈ پر آگے لاتا ہے۔ اپنے فیورٹ ہوسٹ کو فتح دلوائیں۔',
      'انعامات:',
      '• نمبر ۱ سپورٹر: ۳۰ دن کے لیے شاہی ایمپرر کار انٹری۔',
      '• نمبر ۱ ہوسٹ: گلوبل ہوم پیج بینر اور ذاتی ورچوئل گفٹ ڈیزائن۔',
    ],
  },
  {
    slug: 'web-desktop-experience-launch',
    title: 'Poppo Live Web Desktop Experience Launched for High-Res Viewing',
    titleUr: 'پوپو لائیو ویب ڈیسک ٹاپ کا باقاعدہ اجرا: بڑی سکرین پر ہائی ڈیفینیشن لائیو سٹریمنگ',
    category: 'Product News',
    categoryUr: 'پروڈکٹ نیوز',
    date: 'Apr 18, 2026',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    description:
      'Enjoy seamless live broadcasting and coin recharge on your PC and Mac browser with zero downloads required.',
    descriptionUr:
      'اپنے کمپیوٹر اور میک براؤزر پر بغیر کسی ڈاؤن لوڈ کے فوری اور فل ایچ ڈی لائیو سٹریمز سے لطف اندوز ہوں۔',
    content: [
      'By popular community demand, Poppo Live Web Desktop is now officially open to all international users. Watch live streams, browse multi-country feeds, and top up coins directly from your computer.',
      'Web Desktop Advantages:',
      '• 1080p Full HD Broadcaster View: Crystal clear video quality on large monitors.',
      '• Quick Web Recharge: Multiple secure payment methods with instant coin crediting.',
      '• Low Hardware Requirement: Optimized for Chrome, Edge, Safari, and Firefox.',
    ],
    contentUr: [
      'صارفین کی پرزور فرمائش پر پوپو لائیو ویب ڈیسک ٹاپ کا باقاعدہ آغاز ہو گیا ہے۔ اب اپنے کمپیوٹر براؤزر پر فل ایچ ڈی میں لائیو دیکھیں۔',
      'اہم فوائد:',
      '• 1080p فل ایچ ڈی کوالٹی۔',
      '• براؤزر سے براہ راست کوائنز کی فوری خریداری۔',
      '• کروم، ایج، سفاری اور فائر فاکس پر انتہائی تیز رفتار تجربہ۔',
    ],
  },
  {
    slug: 'child-safety-18-verification-enhancement',
    title: 'Child Safety & 18+ Verification System Enhancement Report',
    titleUr: 'چائلڈ پروٹیکشن اور ۱۸ سال عمر کی تصدیق کے جدید نظام کی تفصیلی رپورٹ',
    category: 'Compliance Updates',
    categoryUr: 'قانونی اپڈیٹس',
    date: 'Apr 02, 2026',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
    description:
      'Detailed overview of Poppo Live’s upgraded biometric age estimation, human-in-the-loop review, and proactive minor protection safeguards.',
    descriptionUr:
      'پوپو لائیو کے خودکار بائیومیٹرک معائنے، ۲۴ گھنٹے لائیو مانیٹرنگ اور نابالغوں کے مکمل تحفظ کے اقدامات کی تفصیل۔',
    content: [
      'Safety is our utmost operating priority. In Q1 2026, Poppo Live invested significantly into our proactive minor protection architecture.',
      'Security Milestones Achieved:',
      '• 100% Biometric Verification: Streamers undergo facial age estimation before broadcast permissions are unlocked.',
      '• Proactive AI Scanner: Evaluates live audio and video streams every 1.5 seconds for prohibited content.',
      '• Immediate Hardware Blacklisting: Any account found violating child protection rules is permanently banned across device IDs.',
    ],
    contentUr: [
      'صارفین کا تحفظ ہماری اولین ترجیح ہے۔ پوپو لائیو نے ۲۰۲۶ میں بچوں کے مکمل تحفظ کے لیے انقلابی اقدامات کیے ہیں۔',
      'اہم کامیابیاں:',
      '• ۱۰۰ فیصد بائیومیٹرک فیشل ویریفکیشن۔',
      '• ہر ڈیڑھ سیکنڈ بعد اے آئی سکریننگ۔',
      '• کسی بھی خلاف ورزی پر فوری مستقل ہارڈویئر بلاک۔',
    ],
  },
];
