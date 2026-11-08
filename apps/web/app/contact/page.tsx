'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { AuthModal } from '@/components/homepage/AuthModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import {
  Mail,
  Send,
  Headphones,
  Wrench,
  Briefcase,
  Users,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  Globe,
  Radio,
  Coins,
  Wallet,
  ShieldAlert,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Form State (6 Fields per Prompt 07)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [inquiryType, setInquiryType] = useState('general');
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const inquiryOptions = [
    { value: 'general', label: isUr ? 'عام سپورٹ' : 'General Support' },
    { value: 'tech', label: isUr ? 'تکنیکی سپورٹ' : 'Technical Support' },
    { value: 'account', label: isUr ? 'اکاؤنٹ کے مسائل' : 'Account Issues' },
    { value: 'agency', label: isUr ? 'ایجنسی انکوائری' : 'Agency Inquiry' },
    { value: 'business', label: isUr ? 'بزنس پارٹنرشپ' : 'Business Partnership' },
    { value: 'other', label: isUr ? 'دیگر معاملات' : 'Other' },
  ];

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = isUr ? 'پورا نام درج کرنا لازمی ہے' : 'Full Name is required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = isUr ? 'درست ای میل پتہ درج کریں' : 'Valid email address is required';
    }
    if (!subject.trim()) errs.subject = isUr ? 'موضوع درج کرنا لازمی ہے' : 'Subject is required';
    if (!message.trim() || message.trim().length < 10) {
      errs.message = isUr ? 'پیغام کم از کم ۱۰ حروف پر مشتمل ہونا چاہیے' : 'Message must be at least 10 characters long';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate frontend validation & response delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFullName('');
      setEmail('');
      setSubject('');
      setUserId('');
      setMessage('');
    }, 1000);
  };

  // 4 Information Cards (Prompt 07 Section 3)
  const contactCards = [
    {
      id: 'general',
      icon: <Headphones className="w-6 h-6 text-popo-pink" />,
      title: isUr ? 'عام سپورٹ' : 'General Support',
      desc: isUr ? 'عام سوالات، اکاؤنٹ اور ایپ گائیڈ کے لیے ہم سے رابطہ کریں۔' : 'Contact us for general questions and platform assistance.',
      channel: 'support@popolive.com',
      badge: 'Placeholder',
    },
    {
      id: 'tech',
      icon: <Wrench className="w-6 h-6 text-purple-400" />,
      title: isUr ? 'تکنیکی سپورٹ' : 'Technical Support',
      desc: isUr ? 'اسٹریمنگ میں رکاوٹ اور اکاؤنٹ لاگ ان مسائل کا فوری حل۔' : 'Get help with technical issues and account problems.',
      channel: 'tech@popolive.com',
      badge: 'Placeholder',
    },
    {
      id: 'business',
      icon: <Briefcase className="w-6 h-6 text-amber-400" />,
      title: isUr ? 'بزنس انکوائریز' : 'Business Inquiries',
      desc: isUr ? 'اسپانسرشپ، کمرشل پارٹنرشپ اور برانڈ تعاون کے لیے رابطہ۔' : 'Contact our team for business and partnership inquiries.',
      channel: 'business@popolive.com',
      badge: 'Placeholder',
    },
    {
      id: 'agency',
      icon: <Users className="w-6 h-6 text-popo-cyan" />,
      title: isUr ? 'ایجنسی سپورٹ' : 'Agency Support',
      desc: isUr ? 'ایجنسی رجسٹریشن اور ٹیلنٹ مینیجرز کی معاونت کا سرشار ڈیسک۔' : 'Get assistance with agency registration and creator management.',
      channel: 'agency@popolive.com',
      badge: 'Placeholder',
    },
  ];

  // Support Topics (Prompt 07 Section 5) - only linking to existing pages
  const supportTopics = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-popo-pink" />,
      title: isUr ? 'اکاؤنٹ اور لاگ ان' : 'Account and Login',
      desc: isUr ? 'اکاؤنٹ بنانے اور سیکیورٹی پن کے مسائل' : 'Sign up, login gates, and security settings.',
      link: '/login',
    },
    {
      icon: <Radio className="w-5 h-5 text-purple-400" />,
      title: isUr ? 'لائیو اسٹریمنگ مسائل' : 'Live Streaming Issues',
      desc: isUr ? 'براڈکاسٹ کوالٹی اور لیول ۵ ویلتھ گیٹ' : 'Broadcaster rules, audio quality, and wealth gates.',
      link: '/safety',
    },
    {
      icon: <Coins className="w-5 h-5 text-amber-400" />,
      title: isUr ? 'کوائنز اور تحائف' : 'Coins and Gifts',
      desc: isUr ? 'کوائن ریچارج اور ورچوئل تحائف کے ضوابط' : 'Coin balance, 3D animated gifts, and gifting rules.',
      link: '/terms',
    },
    {
      icon: <Wallet className="w-5 h-5 text-emerald-400" />,
      title: isUr ? 'والٹ اور ادائیگیاں' : 'Wallet and Payments',
      desc: isUr ? '۷۰ فیصد ہوسٹ پوائنٹ شیئر اور کیش آؤٹ' : 'Host points ledger, 70% share, and cashout policies.',
      link: '/terms',
    },
    {
      icon: <Users className="w-5 h-5 text-popo-cyan" />,
      title: isUr ? 'ایجنسی رجسٹریشن' : 'Agency Registration',
      desc: isUr ? 'پارٹنر ایجنسی بنیں اور ٹیم مینیج کریں' : 'Join as an authorized talent agency partner.',
      link: '/agency',
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
      title: isUr ? 'حفاظت اور رپورٹنگ' : 'Safety and Reporting',
      desc: isUr ? 'ہراسانی کی شکایت اور ۱۸+ اصول' : 'User block tools, abuse reporting, and guidelines.',
      link: '/community-guidelines',
    },
  ];

  // FAQ Items (Prompt 07 Section 6)
  const faqs = [
    {
      q: isUr ? 'میں پوپو لائیو سپورٹ سے کیسے رابطہ کر سکتا ہوں؟' : 'How can I contact Popo Live support?',
      a: isUr
        ? 'آپ اس پیج پر موجود رابطہ فارم کے ذریعے یا support@popolive.com پر براہ راست ای میل بھیج کر رابطہ کر سکتے ہیں۔ ہماری کسٹمر سپورٹ ٹیم ۲۴ گھنٹوں کے اندر جواب دیتی ہے۔'
        : 'You can contact Popo Live support using the contact form on this page or by emailing support@popolive.com. Our global desk responds within 24 business hours.',
    },
    {
      q: isUr ? 'میں کسی مسئلے یا نامناسب رویے کی شکایت کیسے درج کروں؟' : 'How can I report a problem or policy violation?',
      a: isUr
        ? 'لائیو روم کے دوران آپ صارف کی پروفائل پر جا کر "رپورٹ" کے بٹن پر کلک کر سکتے ہیں۔ سنگین معاملات کے لیے ہمارے سیفٹی فارم کا انتخاب کریں یا ہماری کمیونٹی گائیڈ لائنز کا جائزہ لیں۔'
        : 'In any active live room or party lounge, tap the user avatar and select "Report". For critical safety escalations, choose "Safety & Abuse Reports" on our contact form.',
    },
    {
      q: isUr ? 'میں اپنے اکاؤنٹ کی سیکیورٹی کے لیے مدد کیسے حاصل کروں؟' : 'How can I get help with my account?',
      a: isUr
        ? 'اکاؤنٹ کے تصدیقی مسائل کے لیے ہمارے رابطہ فارم میں اپنا رجسٹریشن ای میل اور یوزر آئی ڈی درج کریں تاکہ ہماری تکنیکی ٹیم آپ کی فوری تصدیق کر سکے۔'
        : 'For account recovery or password verification, submit an inquiry selecting "Account Issues" and include your User ID for expedited verification.',
    },
    {
      q: isUr ? 'میں ایجنسی پروگرام کے لیے کیسے درخواست دے سکتا ہوں؟' : 'How can I apply for an agency?',
      a: isUr
        ? 'ہماری آفیشل ایجنسی پیج (/agency) پر جائیں اور "Apply for Agency" فارم پُر کریں یا ہماری ایجنسی سپورٹ ٹیم سے agency@popolive.com پر رابطہ کریں۔'
        : 'Visit our dedicated Agency portal (/agency) and submit the partner application form, or email our talent desk directly at agency@popolive.com.',
    },
    {
      q: isUr ? 'میں پلیٹ فارم کے باضابطہ قوانین اور پالیسیاں کہاں دیکھ سکتا ہوں؟' : 'Where can I find platform policies?',
      a: isUr
        ? 'تمام پالیسیاں ہمارے فوٹر میں موجود لنکس کے ذریعے دستیاب ہیں جن میں استعمال کی شرائط (/terms)، پرائیویسی پالیسی (/privacy)، اور کمیونٹی گائیڈ لائنز (/community-guidelines) شامل ہیں۔'
        : 'All legal charters are available via the website footer, including Terms of Service (/terms), Privacy Policy (/privacy), Community Guidelines (/community-guidelines), Safety (/safety), and Cookies (/cookies).',
    },
  ];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#0B0E17] text-popo-text-primary overflow-x-hidden selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* 1. Header (Navbar with Contact active) */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col gap-16">
        {/* Demo Status Notice */}
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#131A2B]/80 border border-white/10 text-xs text-popo-text-secondary">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isUr
              ? 'وضاحت: تمام فون نمبرز، پتے اور ای میلز فرضی پلیس ہولڈرز ہیں۔ فارم فرنٹ اینڈ ویلیڈیشن موڈ میں فعال ہے۔'
              : 'Notice: Contact channels shown are labeled placeholders until official client credentials are provided. Form is active in frontend validation mode; messages will be routed to PostgreSQL upon Phase 2 API connection.'}
          </span>
        </div>

        {/* =====================================================================
            2. CONTACT HERO SECTION (06_contact_us.png)
        ===================================================================== */}
        <div className={`flex flex-col gap-4 max-w-3xl ${isUr ? 'text-right ml-auto' : 'text-left'}`}>
          <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-popo-pink/10 border border-popo-pink/20">
              <MessageSquare className="w-3.5 h-3.5" />
              {isUr ? 'رابطہ کریں' : 'Contact Popo Live'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isUr ? 'پوپو لائیو سے رابطہ کریں' : 'Contact Popo Live'}
          </h1>

          <p className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-300 to-amber-300">
            {isUr ? 'ہم آپ کی مدد کے لیے حاضر ہیں' : 'We Are Here to Help You.'}
          </p>

          <p className="text-sm sm:text-base text-popo-text-secondary leading-relaxed">
            {isUr
              ? 'کیا آپ کا کوئی سوال ہے، مدد درکار ہے یا پوپو لائیو کے ساتھ کام کرنا چاہتے ہیں؟ ہمیں میسج بھیجیں اور ہماری ٹیم خوشی سے آپ کی معاونت کرے گی۔'
              : 'Have a question, need support or want to work with Popo Live? Send us a message and our team will be happy to assist you.'}
          </p>
        </div>

        {/* =====================================================================
            3. CONTACT INFORMATION CARDS (4 Cards)
        ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactCards.map((card) => (
            <div
              key={card.id}
              className={cn(
                'p-6 rounded-3xl bg-[#131A2B]/80 border border-white/10 hover:border-popo-pink/40 transition-all duration-300 flex flex-col justify-between gap-4 group shadow-xl hover:-translate-y-1',
                isUr ? 'text-right' : 'text-left'
              )}
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-popo-pink/15 group-hover:border-popo-pink/30 transition-colors ${isUr ? 'ml-auto' : ''}`}>
                  {card.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-popo-pink transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-popo-text-secondary leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-popo-cyan truncate">
                  {card.channel}
                </span>
                <span className="text-[10px] text-popo-text-muted px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                  {card.badge}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* =====================================================================
            4. CONTACT FORM & DIRECT CHANNELS (06_contact_us.png)
        ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Direct Channels & Visual (06_contact_us.png) */}
          <div className={`lg:col-span-5 flex flex-col gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
            <h2 className="text-2xl font-bold text-white">
              {isUr ? 'براہِ راست روابط اور اوقات' : 'Direct Support Channels'}
            </h2>
            <p className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed">
              {isUr
                ? 'فارم پُر کریں یا نیچے دیے گئے آفیشل سپورٹ چینلز کے ذریعے فوری رابطہ کریں۔'
                : 'Fill out the form or reach out through our dedicated communication channels below.'}
            </p>

            {/* Direct Channels (Matching 06_contact_us.png) */}
            <div className="flex flex-col gap-3 p-6 rounded-3xl bg-[#131A2B]/60 border border-white/10">
              <div className={cn('flex items-center gap-3 text-sm text-white', isUr && 'flex-row-reverse')}>
                <div className="w-9 h-9 rounded-full bg-popo-pink/15 border border-popo-pink/30 flex items-center justify-center text-popo-pink shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-popo-text-muted">Official Email</span>
                  <span className="font-semibold text-white">support@popolive.com</span>
                </div>
              </div>

              <div className={cn('flex items-center gap-3 text-sm text-white', isUr && 'flex-row-reverse')}>
                <div className="w-9 h-9 rounded-full bg-popo-pink/15 border border-popo-pink/30 flex items-center justify-center text-popo-pink shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-popo-text-muted">Telegram Handle</span>
                  <span className="font-semibold text-white">@popolive</span>
                </div>
              </div>

              <div className={cn('flex items-center gap-3 text-sm text-white', isUr && 'flex-row-reverse')}>
                <div className="w-9 h-9 rounded-full bg-popo-pink/15 border border-popo-pink/30 flex items-center justify-center text-popo-pink shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-popo-text-muted">Global Operations</span>
                  <span className="font-semibold text-white">Global Support (Online 24/7)</span>
                </div>
              </div>

              {/* Bottom Reference Tag */}
              <div className="pt-2 text-center mt-2 border-t border-white/5">
                <span className="inline-block px-4 py-1 rounded-full bg-[#8E0B3E] text-white text-[10px] font-bold tracking-wider">
                  06. Contact Us
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 6-Field Working Form */}
          <div className="lg:col-span-7 rounded-3xl bg-[#131A2B]/90 border border-white/10 p-6 sm:p-10 shadow-2xl relative">
            {isSubmitted ? (
              <div className="py-12 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {isUr ? 'آپ کا پیغام موصول ہو گیا ہے!' : 'Message Received!'}
                </h3>
                <p className="text-xs sm:text-sm text-popo-text-secondary max-w-md leading-relaxed">
                  {isUr
                    ? 'شکریہ! آپ کا پیغام ہماری ڈیمو سپورٹ قطار میں درج کر لیا گیا ہے۔ ہماری ٹیم جلد جواب دے گی۔'
                    : 'Thank you! Your inquiry has been verified and queued for review. In live production, responses are delivered to your email within 24 hours.'}
                </p>
                <Button variant="secondary" size="sm" onClick={() => setIsSubmitted(false)} className="mt-2">
                  {isUr ? 'ایک اور پیغام بھیجیں' : 'Send Another Message'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* 1. Full Name & 2. Email Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isUr ? 'پورا نام *' : 'Full Name *'}
                    placeholder={isUr ? 'مثال: علی احمد' : 'e.g. John Doe'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={errors.fullName}
                  />
                  <Input
                    label={isUr ? 'ای میل ایڈریس *' : 'Email Address *'}
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                  />
                </div>

                {/* 3. Subject & 4. Inquiry Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isUr ? 'موضوع *' : 'Subject *'}
                    placeholder={isUr ? 'پیغام کا عنوان' : 'Brief subject summary'}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    error={errors.subject}
                  />
                  <Dropdown
                    label={isUr ? 'انکوائری کی قسم' : 'Inquiry Type'}
                    options={inquiryOptions}
                    value={inquiryType}
                    onChange={setInquiryType}
                  />
                </div>

                {/* 5. User ID (Optional) */}
                <div>
                  <Input
                    label={isUr ? 'یوزر آئی ڈی (اختیاری)' : 'User ID (Optional)'}
                    placeholder={isUr ? 'مثال: 948201' : 'e.g. 948201 (optional)'}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>

                {/* 6. Message Field */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-popo-text-secondary">
                    {isUr ? 'پیغام *' : 'Message *'}
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isUr ? 'اپنا پیغام یہاں تفصیل سے درج کریں...' : 'How can we assist you? Describe your question or proposal in detail...'}
                    className={`w-full bg-[#0B0E17] text-popo-text-primary placeholder:text-popo-text-muted text-sm rounded-xl p-4 transition-all duration-200 border border-white/10 outline-none focus:border-popo-pink focus:ring-2 focus:ring-popo-pink/20 resize-none ${
                      errors.message ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.message && (
                    <span className="text-xs font-medium text-popo-state-error">{errors.message}</span>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 shadow-glow-pink font-bold"
                    leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  >
                    {isSubmitting
                      ? isUr
                        ? 'بھیجا جا رہا ہے...'
                        : 'Submitting...'
                      : isUr
                      ? 'پیغام بھیجیں'
                      : 'Send Message'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* =====================================================================
            5. SUPPORT TOPICS SECTION (Prompt 07 Section 5)
        ===================================================================== */}
        <section className="py-6 border-t border-white/5">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-popo-cyan px-3.5 py-1.5 rounded-full bg-popo-cyan/10 border border-popo-cyan/20">
              {isUr ? 'ہم آپ کی مدد کیسے کر سکتے ہیں؟' : 'Support Topics'}
            </span>
            <h2 className={cn('text-2xl sm:text-3xl font-extrabold text-white mt-3', isUr && 'font-urdu')}>
              {isUr ? 'ہم آپ کی مدد کیسے کر سکتے ہیں؟' : 'How Can We Help You?'}
            </h2>
            <p className="text-xs sm:text-sm text-popo-text-secondary mt-2">
              {isUr ? 'براہ راست مدد اور معلومات کے لیے موضوع کا انتخاب کریں' : 'Select a topic below for quick access to guidelines, account tools, and rules.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportTopics.map((topic, i) => (
              <Link
                key={i}
                href={topic.link}
                className={cn(
                  'p-6 rounded-2xl bg-[#131A2B]/60 border border-white/10 hover:border-popo-pink/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group shadow-lg',
                  isUr ? 'text-right' : 'text-left'
                )}
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:bg-popo-pink/15 group-hover:border-popo-pink/30 transition-colors ${isUr ? 'ml-auto' : ''}`}>
                    {topic.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-popo-pink transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-popo-text-secondary leading-relaxed">
                    {topic.desc}
                  </p>
                </div>
                <div className={`pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs font-bold text-popo-cyan group-hover:text-popo-pink transition-colors ${isUr ? 'justify-end' : 'justify-start'}`}>
                  <span>{isUr ? 'مزید معلومات' : 'Explore'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =====================================================================
            6. FAQ ACCORDION SECTION (Prompt 07 Section 6)
        ===================================================================== */}
        <section className="py-6 border-t border-white/5">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              FAQ
            </span>
            <h2 className={cn('text-2xl sm:text-3xl font-extrabold text-white mt-3', isUr && 'font-urdu')}>
              {isUr ? 'اکثر پوچھے جانے والے سوالات' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-xs sm:text-sm text-popo-text-secondary mt-2">
              {isUr ? 'پوپو لائیو کے حوالے سے عام سوالات اور ان کے جوابات' : 'Quick answers to common questions about platform access, creator tools, and safety.'}
            </p>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#131A2B]/80 border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className={cn(
                      'w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-popo-pink transition-colors',
                      isUr && 'text-right flex-row-reverse'
                    )}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-popo-text-muted transition-transform duration-200 shrink-0',
                        isOpen && 'rotate-180 text-popo-pink'
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className={cn('px-5 pb-5 pt-1 text-xs sm:text-sm text-popo-text-secondary leading-relaxed border-t border-white/5', isUr && 'text-right')}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            7. BUSINESS INQUIRY SECTION (Prompt 07 Section 7)
        ===================================================================== */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-popo-pink/15 via-[#131A2B] to-popo-cyan/15 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
            <h2 className={cn('text-2xl sm:text-4xl font-black text-white', isUr && 'font-urdu')}>
              {isUr ? 'پوپو لائیو کے ساتھ کام کریں' : 'Work With Popo Live'}
            </h2>
            <p className="text-sm sm:text-base text-popo-text-secondary leading-relaxed max-w-xl">
              {isUr
                ? 'کیا آپ پوپو لائیو کے ساتھ کام کرنے میں دلچسپی رکھتے ہیں؟ کاروباری اور شراکت داری کی گفتگو کے لیے ہماری ٹیم سے رابطہ کریں۔'
                : 'Interested in working with Popo Live? Contact our team for business, sponsorship, and talent partnership discussions.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setInquiryType('business');
                  setSubject('Business Partnership Inquiry');
                  const formEl = document.querySelector('form');
                  formEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="shadow-glow-pink font-bold"
              >
                {isUr ? 'کاروباری انکوائری' : 'Business Inquiry'}
              </Button>
              <Link href="/agency">
                <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4 text-popo-pink" />}>
                  {isUr ? 'ایجنسی انکوائری' : 'Agency Inquiry'}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Footer (Reused existing footer) */}
      <Footer lang={lang} />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
