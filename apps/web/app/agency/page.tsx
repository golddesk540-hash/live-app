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
  Briefcase,
  Users,
  Sparkles,
  LayoutDashboard,
  LineChart,
  Coins,
  Headphones,
  CheckCircle2,
  ChevronDown,
  Building2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle,
  FileCheck,
  ClipboardList,
  UserCheck,
  HelpCircle,
  AlertCircle,
  Award,
  Globe2,
  Smartphone,
  ChevronRight,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export default function AgencyPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 10-Field Form State
  const [agencyName, setAgencyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [city, setCity] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [expectedHosts, setExpectedHosts] = useState('11-30');
  const [experience, setExperience] = useState('1-2yr');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // FAQ Accordion State (0 opens first by default)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const countryOptions = [
    { value: 'Pakistan', label: '🇵🇰 Pakistan' },
    { value: 'UAE', label: '🇦🇪 United Arab Emirates' },
    { value: 'Saudi Arabia', label: '🇸🇦 Saudi Arabia' },
    { value: 'Turkey', label: '🇹🇷 Turkey' },
    { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
    { value: 'United States', label: '🇺🇸 United States' },
    { value: 'Bangladesh', label: '🇧🇩 Bangladesh' },
    { value: 'Indonesia', label: '🇮🇩 Indonesia' },
    { value: 'India', label: '🇮🇳 India' },
    { value: 'Other', label: '🌐 Other Region' },
  ];

  const hostCountOptions = [
    { value: '1-10', label: isUr ? '۱ تا ۱۰ ہوسٹس' : '1 - 10 Broadcasters' },
    { value: '11-30', label: isUr ? '۱۱ تا ۳۰ ہوسٹس' : '11 - 30 Broadcasters' },
    { value: '31-50', label: isUr ? '۳۱ تا ۵۰ ہوسٹس' : '31 - 50 Broadcasters' },
    { value: '50+', label: isUr ? '۵۰ سے زائد تجربہ کار ہوسٹس' : '50+ Professional Broadcasters' },
  ];

  const experienceOptions = [
    {
      value: 'none',
      label: isUr ? 'کوئی سابقہ تجربہ نہیں (نئی شروعات)' : 'No Prior Experience (Starting Fresh)',
    },
    {
      value: '1-2yr',
      label: isUr ? '۱ تا ۲ سال کا ایجنسی تجربہ' : '1 - 2 Years Live Agency Experience',
    },
    {
      value: '3-5yr',
      label: isUr ? '۳ تا ۵ سال کا کری ایٹر مینجمنٹ تجربہ' : '3 - 5 Years Managing Live Creators',
    },
    {
      value: '5yr+',
      label: isUr ? '۵ سال سے زائد ملٹی پلیٹ فارم نیٹ ورک' : '5+ Years Established Talent Network',
    },
  ];

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!agencyName.trim()) {
      errs.agencyName = isUr ? 'ایجنسی کا نام درج کریں' : 'Agency name is required';
    }
    if (!ownerName.trim()) {
      errs.ownerName = isUr ? 'مالک کا پورا نام درج کریں' : 'Owner full name is required';
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = isUr ? 'درست کاروباری ای میل درج کریں' : 'Valid business email is required';
    }
    if (!phone.trim() || phone.trim().length < 7) {
      errs.phone = isUr ? 'درست فون نمبر درج کریں' : 'Valid phone number is required';
    }
    if (!city.trim()) {
      errs.city = isUr ? 'شہر کا نام درج کریں' : 'City is required';
    }
    if (!whatsapp.trim() || whatsapp.trim().length < 7) {
      errs.whatsapp = isUr ? 'درست واٹس ایپ نمبر درج کریں' : 'WhatsApp number is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setAgencyName('');
      setOwnerName('');
      setEmail('');
      setPhone('');
      setCity('');
      setWhatsapp('');
      setAdditionalInfo('');
    }, 1200);
  };

  const scrollToApply = () => {
    const el = document.getElementById('application-form');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToWhyJoin = () => {
    const el = document.getElementById('why-join');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // Section 3: Why Join Popo Live Agency? (6 feature cards)
  const whyJoinFeatures = [
    {
      title: isUr ? 'کری ایٹر مینجمنٹ' : 'Creator Management',
      desc: isUr
        ? 'اپنے رجسٹرڈ کری ایٹرز کا انتظام اور مکمل معاونت کریں۔'
        : 'Manage and support your registered creators.',
      icon: Users,
      badgeColor: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
    },
    {
      title: isUr ? 'ہوسٹ ڈیولپمنٹ' : 'Host Development',
      desc: isUr
        ? 'ہوسٹس کو ان کی لائیو اسٹریمنگ سرگرمیوں کو بہتر بنانے میں مدد فراہم کریں۔'
        : 'Help hosts improve their streaming activities.',
      icon: Sparkles,
      badgeColor: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
    },
    {
      title: isUr ? 'ایجنسی ڈیش بورڈ' : 'Agency Dashboard',
      desc: isUr
        ? 'ایجنسی کی تمام معلومات اور کری ایٹرز کی لائیو سرگرمیاں دیکھیں۔'
        : 'View agency information and creator activity.',
      icon: LayoutDashboard,
      badgeColor: 'from-purple-500/20 to-fuchsia-500/20 text-purple-400 border-purple-500/30',
    },
    {
      title: isUr ? 'پرفارمنس ٹریکنگ' : 'Performance Tracking',
      desc: isUr
        ? 'کری ایٹر ٹاسکس اور کارکردگی کے تمام ریکارڈز کو ٹریک کریں۔'
        : 'Track creator tasks and performance records.',
      icon: LineChart,
      badgeColor: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
    },
    {
      title: isUr ? 'ایجنسی ارننگز' : 'Agency Earnings',
      desc: isUr
        ? 'اہل ایجنسی کی کمائی اور باضابطہ کمیشن ریکارڈز کا مشاہدہ کریں۔'
        : 'View eligible agency earnings and commission records.',
      icon: Coins,
      badgeColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      title: isUr ? 'ڈیڈیکیٹڈ سپورٹ' : 'Dedicated Support',
      desc: isUr
        ? 'ایجنسی سے متعلق تمام سوالات کے لیے بروقت معاونت حاصل کریں۔'
        : 'Get assistance with agency-related questions.',
      icon: Headphones,
      badgeColor: 'from-cyan-500/20 to-sky-500/20 text-cyan-400 border-cyan-500/30',
    },
  ];

  // Section 4: How Agency Program Works (4 steps)
  const workflowSteps = [
    {
      step: '01',
      title: isUr ? 'اپلائی کریں' : 'Apply',
      desc: isUr
        ? 'ایجنسی کی رجسٹریشن کے لیے آن لائن درخواست جمع کروائیں۔'
        : 'Submit an agency application.',
      icon: FileCheck,
    },
    {
      step: '02',
      title: isUr ? 'تصدیق' : 'Verification',
      desc: isUr
        ? 'ٹیم درخواست اور فراہم کردہ مطلوبہ معلومات کا جائزہ لیتی ہے۔'
        : 'The team reviews the application and required information.',
      icon: ShieldCheck,
    },
    {
      step: '03',
      title: isUr ? 'منظوری' : 'Approval',
      desc: isUr
        ? 'منظور شدہ درخواست گزاروں کو باضابطہ ایجنسی رسائی حاصل ہو جاتی ہے۔'
        : 'Approved applicants receive agency access.',
      icon: BadgeCheck,
    },
    {
      step: '04',
      title: isUr ? 'کری ایٹرز کا انتظام' : 'Manage Creators',
      desc: isUr
        ? 'اہل کری ایٹرز کو شامل کریں اور ان کی روزانہ کی سرگرمیوں کی نگرانی کریں۔'
        : 'Manage eligible creators and monitor their activity.',
      icon: UserCheck,
    },
  ];

  // Section 5: Agency Benefits (6 core planned platform benefits)
  const agencyBenefits = [
    {
      title: isUr ? 'کری ایٹر مینجمنٹ ٹولز' : 'Creator Management Tools',
      desc: isUr
        ? 'اپنے خصوصی ایجنسی کوڈ کے ذریعے ہوسٹس کو اپنے روسٹر میں شامل کریں اور مانیٹر کریں۔'
        : 'Centralized roster management with unique agency invite codes and onboarding controls.',
      icon: Users,
    },
    {
      title: isUr ? 'ہوسٹ ایکٹیویٹی ریکارڈز' : 'Host Activity Records',
      desc: isUr
        ? 'براڈکاسٹنگ کے لائیو گھنٹے، لاگ ان ہسٹری اور اسٹریمنگ سیشنز کا بروقت ریکارڈ دیکھیں۔'
        : 'Real-time logs of broadcast hours, streaming schedules, and room session history.',
      icon: ClipboardList,
    },
    {
      title: isUr ? 'پرفارمنس رپورٹس' : 'Performance Reports',
      desc: isUr
        ? 'ڈیلی اسٹریمنگ ٹاسکس، اسٹریکس اور پی کے بیٹل کی انالیٹکس کا تجزیہ کریں۔'
        : 'Detailed analytics on daily streaming missions, target streaks, and PK battle results.',
      icon: LineChart,
    },
    {
      title: isUr ? 'ایجنسی انفارمیشن' : 'Agency Information',
      desc: isUr
        ? 'تصدیق شدہ ایجنسی پروفائل، یونیک ایجنسی آئی ڈی اور آفیشل پارٹنر بیج۔'
        : 'Verified agency profile, unique numerical Agency ID, and official partner credentials.',
      icon: Building2,
    },
    {
      title: isUr ? 'ارننگز ریکارڈز' : 'Earnings Records',
      desc: isUr
        ? 'شفاف لیجر کے ذریعے ایجنسی کے مجاز کمیشن اور شیئرز کی جامع تفصیلات۔'
        : 'Transparent ledger reports detailing eligible agency commission and payout summaries.',
      icon: Coins,
    },
    {
      title: isUr ? 'سپورٹ ایکسیس' : 'Support Access',
      desc: isUr
        ? 'ایجنسی پارٹنرز کے لیے خصوصی ترجیحی ہیلپ ڈیسک اور رابطہ چینلز۔'
        : 'Direct access to Popo Live agency liaison desk and priority partner support channels.',
      icon: Headphones,
    },
  ];

  // Section 7: Agency Requirements (General Information Topics)
  const requirementsList = [
    {
      title: isUr ? 'درست رجسٹریشن معلومات' : 'Accurate Registration Information',
      desc: isUr
        ? 'ایجنسی رجسٹریشن کے دوران درست کاروباری تفصیلات اور مالک کی حقیقی شناخت فراہم کرنا لازمی ہے۔'
        : 'Agencies must provide authentic business credentials and legitimate ownership identity during onboarding.',
    },
    {
      title: isUr ? 'درست رابطے کی تفصیلات' : 'Valid Contact Details',
      desc: isUr
        ? 'پارٹنر شپ کوآرڈینیشن کے لیے فعال ای میل ایڈریس، موبائل نمبر اور واٹس ایپ فراہم کریں۔'
        : 'Maintain an active business email, accessible phone line, and verified WhatsApp channel for official liaison.',
    },
    {
      title: isUr ? 'کری ایٹر سپورٹ کی ذمہ داریاں' : 'Creator Support Responsibilities',
      desc: isUr
        ? 'اپنے رجسٹرڈ ہوسٹس کی باقاعدہ رہنمائی، رہنمائی اور اسٹریمنگ سیشنز میں مدد کرنا ایجنسی کی ذمہ داری ہے۔'
        : 'Agencies are responsible for actively mentoring, guiding, and supporting signed creators during their broadcasting.',
    },
    {
      title: isUr ? 'کمیونٹی گائیڈ لائنز کی پابندی' : 'Community Guideline Compliance',
      desc: isUr
        ? 'پلیٹ فارم کی تمام تر سیکیورٹی پالیسیوں اور چائلڈ سیفٹی اصولوں پر سختی سے عمل درآمد یقینی بنائیں۔'
        : 'Strict adherence to Popo Live community guidelines, trust policies, and absolute zero-tolerance safety rules.',
    },
    {
      title: isUr ? 'پلیٹ فارم قوانین کا احترام' : 'Respect for Platform Rules',
      desc: isUr
        ? 'تمام براڈکاسٹنگ قوائد و ضوابط، منصفانہ مسابقت اور سروس کی شرائط کا مکمل احترام کریں۔'
        : 'Comply fully with platform streaming regulations, terms of service, and fair-play operational ethics.',
    },
    {
      title: isUr ? 'دیانتدارانہ ایجنسی رپورٹنگ' : 'Honest Agency Activity Reporting',
      desc: isUr
        ? 'ہوسٹ ایکٹیویٹی، براڈکاسٹ گھنٹوں اور کارکردگی کے تمام ریکارڈز کو دیانتداری سے برقرار رکھیں۔'
        : 'Maintain truthful activity tracking and reporting without artificial inflation, fraud, or collusion.',
    },
  ];

  // Section 8: Frequently Asked Questions (6 exact items)
  const faqs = [
    {
      q: isUr ? 'پوپو لائیو ایجنسی کیا ہے؟' : 'What is a Popo Live agency?',
      a: isUr
        ? 'پوپو لائیو ایجنسی ایک باضابطہ پارٹنر ادارہ ہے جو لائیو اسٹریمرز اور باصلاحیت کری ایٹرز کو پلیٹ فارم پر لاتا ہے، ان کی رہنمائی کرتا ہے اور ان کی سرگرمیوں کو منظم کرتا ہے۔'
        : 'A Popo Live agency is an authorized partner organization that recruits, mentors, and manages live streaming creators and broadcasters on the Popo Live platform.',
    },
    {
      q: isUr ? 'میں ایجنسی کے لیے کیسے درخواست دے سکتا ہوں؟' : 'How can I apply for an agency?',
      a: isUr
        ? 'آپ اس صفحے پر موجود آن لائن ایجنسی فارم پُر کر کے درخواست دے سکتے ہیں جس میں ایجنسی کا نام، مالک کی معلومات، ملک اور متوقع ہوسٹس کی تعداد درج کرنی ہوگی۔'
        : 'You can apply by completing the online application form above with your agency details, owner contact information, country, and expected host roster.',
    },
    {
      q: isUr ? 'ایجنسی کی منظوری کا طریقہ کار کیا ہے؟' : 'How does agency approval work?',
      a: isUr
        ? 'درخواست جمع ہونے کے بعد ہماری آن بورڈنگ ٹیم فراہم کردہ معلومات اور تعمیل کی شرائط کا جائزہ لیتی ہے اور اہل درخواست گزاروں کو باضابطہ ایجنسی رسائی فراہم کرتی ہے۔'
        : 'Once submitted, our onboarding team verifies your information, credentials, and compliance readiness before provisioning official agency access.',
    },
    {
      q: isUr ? 'کیا میں متعدد کری ایٹرز کا انتظام کر سکتا ہوں؟' : 'Can I manage multiple creators?',
      a: isUr
        ? 'جی ہاں! منظور شدہ ایجنسیوں کو ایک سرشار ایجنسی ڈیش بورڈ دیا جاتا ہے جس کے ذریعے وہ متعدد ہوسٹس کو اپنے پینل میں شامل اور مانیٹر کر سکتی ہیں۔'
        : 'Yes. Approved agencies receive a dedicated Agency Dashboard enabling them to recruit, organize, and monitor multiple signed creators simultaneously.',
    },
    {
      q: isUr ? 'میں ایجنسی سپورٹ سے کیسے رابطہ کر سکتا ہوں؟' : 'How can I contact agency support?',
      a: isUr
        ? 'آپ ہماری ایجنسی سپورٹ ٹیم سے براہ راست agency@popolive.com پر رابطہ کر سکتے ہیں یا ہمارے Contact Us پیج کے ذریعے میسج بھیج سکتے ہیں۔'
        : 'Agency partners can reach our specialized agency support desk directly at agency@popolive.com or submit an inquiry through our Contact Us page.',
    },
    {
      q: isUr ? 'مجھے ایجنسی کے قواعد و ضوابط کہاں مل سکتے ہیں؟' : 'Where can I find agency rules?',
      a: isUr
        ? 'پلیٹ فارم کے تمام رہنما اصول، سیفٹی گائیڈ لائنز اور قواعد ہمارے Community Guidelines اور Terms of Service پیجز پر دستیاب ہیں۔'
        : 'Platform operational standards, safety rules, and conduct regulations are published in our Community Guidelines and Terms of Service pages.',
    },
  ];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#0B0E17] text-white selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* 1. Website Header */}
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex flex-col gap-24 overflow-x-hidden">
        {/* 2. Agency Hero Section */}
        <section className="relative pt-6 pb-8">
          {/* Ambient Lighting Gradients */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-popo-pink/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-popo-purple/20 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Content */}
            <div className={`lg:col-span-7 flex flex-col gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
              <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
                <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-2 px-4 py-1.5 rounded-full bg-popo-pink/10 border border-popo-pink/25 shadow-sm">
                  <Briefcase className="w-3.5 h-3.5" />
                  {isUr ? 'پوپو لائیو ایجنسی پارٹنر پروگرام' : 'Popo Live Agency Partner Program'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                {isUr ? (
                  <>
                    پوپو لائیو ایجنسی پارٹنر بنیں{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-indigo-400">
                      اور کری ایٹرز کو فروغ دیں
                    </span>
                  </>
                ) : (
                  <>
                    Become a{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-pink via-purple-400 to-indigo-400">
                      Popo Live Agency Partner
                    </span>
                  </>
                )}
              </h1>

              <div className="flex flex-col gap-2">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-200">
                  {isUr
                    ? 'اپنی ٹیم بنائیں۔ کری ایٹرز کی مدد کریں۔ ساتھ آگے بڑھیں۔'
                    : 'Build Your Team. Support Creators. Grow Together.'}
                </h2>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl">
                  {isUr
                    ? 'پوپو لائیو ایجنسی پروگرام میں شامل ہوں اور کری ایٹرز کو لائیو اسٹریمنگ، سماجی تعامل اور کمیونٹی سرگرمیوں کے ذریعے اپنی موجودگی قائم کرنے میں مدد فراہم کریں۔'
                    : 'Join the Popo Live agency program and help creators build their presence through live streaming, social interaction and community activities.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div
                className={`flex flex-wrap items-center gap-4 pt-4 ${
                  isUr ? 'justify-end' : 'justify-start'
                }`}
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={scrollToApply}
                  className="shadow-lg shadow-popo-pink/25 font-bold"
                  leftIcon={<Briefcase className="w-5 h-5" />}
                >
                  {isUr ? 'ابھی اپلائی کریں' : 'Apply Now'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={scrollToWhyJoin}
                  className="font-medium bg-white/5 border-white/10 hover:bg-white/10"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isUr ? 'مزید جانیں' : 'Learn More'}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-gray-400 border-t border-white/10">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {isUr ? 'تصدیق شدہ پارٹنر پروگرام' : 'Verified Partner Program'}
                </span>
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-popo-pink" />
                  {isUr ? 'سرشار ایجنسی ڈیش بورڈ' : 'Dedicated Agency Dashboard'}
                </span>
                <span className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-cyan-400" />
                  {isUr ? 'براہ راست پارٹنر سپورٹ' : 'Direct Partner Support'}
                </span>
              </div>
            </div>

            {/* Right Original Agency Artwork / Dashboard Box */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#171722] to-[#12121A] border border-white/15 p-6 shadow-2xl shadow-purple-950/40 relative overflow-hidden flex flex-col gap-5 text-left">
                {/* Decorative glow inside card */}
                <div className="absolute top-0 right-0 w-44 h-44 bg-popo-pink/15 rounded-full blur-2xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-popo-pink to-popo-purple flex items-center justify-center text-white font-black text-lg shadow-md">
                      PA
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        Premier Agency Network
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                      </h4>
                      <span className="text-[11px] text-gray-400">
                        Official Partner &bull; Active Tier
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-popo-pink bg-popo-pink/10 px-2.5 py-1 rounded-full border border-popo-pink/20">
                    ID: 804192
                  </span>
                </div>

                {/* Dashboard Metrics Mockup */}
                <div className="grid grid-cols-3 gap-2.5 relative z-10">
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                      Creators
                    </span>
                    <span className="text-lg font-black text-white mt-1 block">38</span>
                    <span className="text-[9px] text-emerald-400 font-medium">● 14 Live</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                      Stream Hours
                    </span>
                    <span className="text-lg font-black text-popo-pink mt-1 block">162h</span>
                    <span className="text-[9px] text-gray-400 font-medium">This Week</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                      PK Battles
                    </span>
                    <span className="text-lg font-black text-purple-400 mt-1 block">84</span>
                    <span className="text-[9px] text-purple-300 font-medium">Won 72%</span>
                  </div>
                </div>

                {/* Live Activity Row */}
                <div className="p-3 rounded-2xl bg-[#0B0E17]/80 border border-white/5 flex items-center justify-between text-xs text-gray-300 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-medium">Real-Time Host Telemetry</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-400">Active</span>
                </div>

                {/* Creator Roster Sample Snippet */}
                <div className="flex flex-col gap-2 relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Sample Signed Talent
                  </span>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold">
                          A
                        </div>
                        <span className="font-medium text-white">Ayesha_Live</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Broadcasting (Party Room)
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold">
                          Z
                        </div>
                        <span className="font-medium text-white">Zain_Music</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium bg-white/5 px-2 py-0.5 rounded-full">
                        Offline (Scheduled 8 PM)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Why Join Popo Live Agency? (6 Feature Cards) */}
        <section id="why-join" className="flex flex-col gap-10">
          <div className={`text-center max-w-3xl mx-auto flex flex-col gap-3`}>
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink">
              {isUr ? 'ایجنسی فوائد اور خصوصیات' : 'Agency Advantages'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'پوپو لائیو ایجنسی کیوں جوائن کریں؟' : 'Why Join Popo Live Agency?'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {isUr
                ? 'پوپو لائیو کا سرشار ایجنسی ماحولیاتی نظام آپ کو اپنے لائیو اسٹریمرز کو منظم کرنے، ان کی کارکردگی بڑھانے اور ایک باوقار پارٹنر کے طور پر ترقی کرنے کا موقع فراہم کرتا ہے۔'
                : 'Popo Live provides agency partners with modern tools to manage broadcasters, elevate streaming performance, and grow an authentic creator network.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyJoinFeatures.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className={`p-7 rounded-3xl bg-[#171722] border border-white/10 hover:border-popo-pink/40 hover:bg-[#1C1C2A] transition-all duration-300 flex flex-col gap-4 relative group ${
                    isUr ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.badgeColor} border flex items-center justify-center shrink-0 ${
                      isUr ? 'self-end' : 'self-start'
                    }`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-popo-pink transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Ethical Disclaimer Notice */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center text-xs text-gray-400 max-w-2xl mx-auto">
            {isUr
              ? 'اہم وضاحت: پوپو لائیو کسی بھی مقررہ یا گارنٹی شدہ آمدنی کا دعویٰ نہیں کرتا۔ تمام ادائیگیاں اور کمیشنز ہوسٹس کی باضابطہ کارکردگی اور پلیٹ فارم کے تصدیق شدہ قواعد کے تابع ہیں۔'
              : 'Important Notice: Popo Live does not promise fixed or guaranteed income. All earnings, shares, and commissions are subject to creator streaming performance and verified platform rules.'}
          </div>
        </section>

        {/* 4. How Agency Program Works (4 Steps Timeline) */}
        <section id="how-it-works" className="flex flex-col gap-10">
          <div className={`text-center max-w-3xl mx-auto flex flex-col gap-3`}>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              {isUr ? 'مرحلہ وار طریقہ کار' : 'Application Process'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'ایجنسی پروگرام کیسے کام کرتا ہے' : 'How Agency Program Works'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {isUr
                ? 'درخواست سے لے کر باضابطہ منظوری اور کری ایٹرز کے انتظام تک کا شفاف اور آسان عمل۔'
                : 'A structured, transparent onboarding path from initial application to active creator management.'}
            </p>
          </div>

          {/* Timeline Layout: Horizontal on Desktop, Vertical on Mobile */}
          <div className="relative">
            {/* Desktop Connecting Line */}
            <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-popo-pink/20 via-purple-500/40 to-indigo-500/20 -translate-y-8 z-0 pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {workflowSteps.map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={idx}
                    className={`p-6 sm:p-7 rounded-3xl bg-[#171722] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-4 relative overflow-hidden ${
                      isUr ? 'text-right' : 'text-left'
                    }`}
                  >
                    {/* Big Decorative Step Number */}
                    <span className="text-5xl font-black text-white/5 absolute top-3 right-4 select-none pointer-events-none">
                      {step.step}
                    </span>

                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-popo-pink/10 border border-popo-pink/25 flex items-center justify-center text-popo-pink">
                        <StepIcon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold text-popo-pink bg-popo-pink/10 px-2.5 py-1 rounded-full border border-popo-pink/20">
                        Step {step.step}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-2">
                      <h3 className="text-lg font-bold text-white">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Agency Benefits (Planned Platform Product Capabilities) */}
        <section className="flex flex-col gap-10">
          <div className={`text-center max-w-3xl mx-auto flex flex-col gap-3`}>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              {isUr ? 'پروڈکٹ کے اندر فوائد' : 'Product Capabilities'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'ایجنسی کے خصوصی فوائد' : 'Agency Benefits'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {isUr
                ? 'پوپو لائیو پلیٹ فارم کے تحت ایجنسی پارٹنرز کو دیے جانے والے باضابطہ ٹولز اور فیچرز۔'
                : 'Explore the dedicated tools, management screens, and reporting consoles built for approved agency partners.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencyBenefits.map((benefit, idx) => {
              const BenIcon = benefit.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-3xl bg-[#131A2B]/60 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col gap-3.5 ${
                    isUr ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 ${
                      isUr ? 'self-end' : 'self-start'
                    }`}
                  >
                    <BenIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">{benefit.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. Agency Application Form (10 Fields) */}
        <section
          id="application-form"
          className="rounded-3xl bg-gradient-to-b from-[#171722] to-[#12121A] border border-white/15 p-6 sm:p-10 lg:p-12 shadow-2xl relative"
        >
          {/* Form Header */}
          <div className="flex flex-col gap-3 max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" />
              {isUr ? 'آن لائن درخواست فارم' : 'Application Portal'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'ایجنسی پارٹنرشپ فارم' : 'Agency Application Form'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {isUr
                ? 'پوپو لائیو ایجنسی پارٹنرشپ کے لیے نیچے دیا گیا فارم مکمل کریں۔ ہماری ٹیم تمام تفصیلات کا جائزہ لے کر رابطہ کرے گی۔'
                : 'Fill out the form below to register your agency. Our partner liaison team evaluates submissions daily.'}
            </p>

            {/* Staging Demo Mode Alert Banner */}
            <div className="mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                {isUr
                  ? 'ڈیمو موڈ: فارم کی تصدیق فعال ہے۔ فیز ۲ بیک اینڈ اے پی آئی اور ڈیٹا بیس منسلک ہونے پر درخواستیں خودکار محفوظ ہوں گی۔'
                  : 'Staging Demo: Frontend field validation is active. Records will route directly to the PostgreSQL database once the Phase 2 NestJS API pipeline is initialized.'}
              </span>
            </div>
          </div>

          {isSubmitted ? (
            /* Success State */
            <div className="py-16 flex flex-col items-center text-center gap-5 max-w-md mx-auto animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold text-popo-pink uppercase tracking-widest">
                  Reference: AGY-{Math.floor(10000 + Math.random() * 90000)}
                </span>
                <h3 className="text-2xl font-black text-white">
                  {isUr ? 'ایجنسی کی درخواست موصول ہو گئی!' : 'Agency Application Received!'}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {isUr
                    ? 'آپ کی معلومات ہمارے سسٹم میں موصول ہو چکی ہیں۔ ہماری ایجنسی سپورٹ ٹیم ۲۴ سے ۴۸ گھنٹوں میں ای میل یا واٹس ایپ پر رابطہ کرے گی۔'
                    : 'Thank you for applying. Our Agency Onboarding Directorate will review your application details and contact you via Email/WhatsApp within 24–48 hours.'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsSubmitted(false)}
                className="mt-2"
              >
                {isUr ? 'ایک اور درخواست جمع کروائیں' : 'Submit Another Application'}
              </Button>
            </div>
          ) : (
            /* Form Fields */
            <form onSubmit={handleApply} className="flex flex-col gap-6">
              {/* Row 1: Agency Name & Owner Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label={isUr ? 'ایجنسی کا نام *' : '1. Agency Name *'}
                  placeholder={isUr ? 'مثال: فالکن میڈیا ایجنسی' : 'e.g. Apex Talent Agency'}
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  error={errors.agencyName}
                />
                <Input
                  label={isUr ? 'مالک کا پورا نام *' : '2. Owner Full Name *'}
                  placeholder={isUr ? 'مثال: احمد علی' : 'e.g. Johnathan Smith'}
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  error={errors.ownerName}
                />
              </div>

              {/* Row 2: Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label={isUr ? 'ای میل ایڈریس *' : '3. Email Address *'}
                  type="email"
                  placeholder="agency@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                />
                <Input
                  label={isUr ? 'فون نمبر *' : '4. Phone Number *'}
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={errors.phone}
                />
              </div>

              {/* Row 3: Country & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Dropdown
                  label={isUr ? 'ملک / خطہ *' : '5. Country *'}
                  options={countryOptions}
                  value={country}
                  onChange={setCountry}
                />
                <Input
                  label={isUr ? 'شہر *' : '6. City *'}
                  placeholder={isUr ? 'مثال: لاہور، کراچی، دبئی' : 'e.g. Lahore, Dubai, London'}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  error={errors.city}
                />
              </div>

              {/* Row 4: WhatsApp Number & Expected Hosts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label={isUr ? 'واٹس ایپ نمبر *' : '7. WhatsApp Number *'}
                  placeholder="+92 300 1234567"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  error={errors.whatsapp}
                />
                <Dropdown
                  label={isUr ? 'متوقع ہوسٹس کی تعداد *' : '8. Expected Number of Hosts *'}
                  options={hostCountOptions}
                  value={expectedHosts}
                  onChange={setExpectedHosts}
                />
              </div>

              {/* Row 5: Previous Agency Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Dropdown
                  label={isUr ? 'سابقہ ایجنسی تجربہ *' : '9. Previous Agency Experience *'}
                  options={experienceOptions}
                  value={experience}
                  onChange={setExperience}
                />
                <div className="text-xs text-gray-400 flex flex-col justify-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="font-semibold text-gray-300">
                    {isUr ? 'نوٹ برائے درخواست گزار' : 'Notice for Applicants'}
                  </span>
                  <span>
                    {isUr
                      ? 'تمام درخواستوں کی جانچ پڑتال انسانی عملے کے ذریعے کی جاتی ہے۔'
                      : 'All applicant details are verified manually by partner onboarding managers.'}
                  </span>
                </div>
              </div>

              {/* Row 6: Additional Information */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-popo-text-secondary">
                  {isUr
                    ? 'اضافی معلومات یا تعارف (اختیاری)'
                    : '10. Additional Information (Optional)'}
                </label>
                <textarea
                  rows={4}
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder={
                    isUr
                      ? 'اپنی ایجنسی، ہوسٹس کے تجربے یا سوالات کے بارے میں مزید بتائیں...'
                      : 'Provide details about your recruitment channels, host management experience, or special questions...'
                  }
                  className="w-full bg-popo-dark-850 text-white placeholder:text-gray-500 text-sm rounded-xl p-4 transition-all duration-200 border border-white/10 outline-none focus:border-popo-pink focus:ring-2 focus:ring-popo-pink/20 resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-gray-500">
                  {isUr
                    ? 'درخواست جمع کروا کر آپ پلیٹ فارم کے شرائط و ضوابط سے اتفاق کرتے ہیں۔'
                    : 'By submitting, you agree to Popo Live partner review policies and terms.'}
                </span>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-10 shadow-lg shadow-popo-pink/20 font-bold"
                  leftIcon={
                    isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )
                  }
                >
                  {isSubmitting
                    ? isUr
                      ? 'درخواست جمع ہو رہی ہے...'
                      : 'Submitting Application...'
                    : isUr
                    ? 'درخواست جمع کروائیں'
                    : 'Submit Application'}
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* 7. Agency Rules and Requirements (Agency Requirements) */}
        <section id="agency-rules" className="flex flex-col gap-10">
          <div className={`text-center max-w-3xl mx-auto flex flex-col gap-3`}>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              {isUr ? 'پالیسی اور رہنمائی' : 'Platform Standards'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'ایجنسی کے تقاضے اور ضوابط' : 'Agency Requirements'}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              {isUr
                ? 'تمام پارٹنر ایجنسیوں کے لیے پلیٹ فارم کے معیار اور کمیونٹی کے تحفظ کو برقرار رکھنے کے لیے عمومی رہنما اصول۔'
                : 'General operational guidelines and compliance responsibilities expected of all Popo Live agency partners.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requirementsList.map((req, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-3xl bg-[#171722] border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col gap-3 ${
                  isUr ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 font-bold text-xs ${
                    isUr ? 'self-end' : 'self-start'
                  }`}
                >
                  0{idx + 1}
                </div>
                <h3 className="text-base font-bold text-white">{req.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{req.desc}</p>
              </div>
            ))}
          </div>

          {/* Standard Information Framework Disclaimer */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-gray-400 max-w-3xl mx-auto">
            <HelpCircle className="w-5 h-5 text-gray-400 shrink-0" />
            <span>
              {isUr
                ? 'تجویز کردہ معلوماتی فریم ورک: مذکورہ بالا شرائط آپریشنل رہنمائی کا خاکہ پیش کرتی ہیں۔ باضابطہ کمیشن شیڈول اور ہوسٹ کے کوالیفکیشن درجات فیز ۹ (کری ایٹر بزنس) میں لیجر انضمام کے ساتھ جاری کیے جائیں گے۔'
                : 'Proposed Information Framework: The standards above represent operational platform benchmarks. Official commission schedules, performance tier criteria, and host quota requirements will be finalized during Phase 9 (Creator Business) with full ledger integration.'}
            </span>
          </div>
        </section>

        {/* 8. Frequently Asked Questions (Expandable FAQ - 6 Questions) */}
        <section id="faq" className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
          <div className="text-center flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {isUr ? 'عام سوالات' : 'Help & Answers'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {isUr ? 'اکثر پوچھے جانے والے سوالات' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-sm text-gray-400">
              {isUr
                ? 'ایجنسی پارٹنرشپ، رجسٹریشن کے مراحل اور ہوسٹ مینجمنٹ کے متعلق اہم ترین جوابات۔'
                : 'Everything you need to know about the Popo Live agency onboarding process and broadcaster management.'}
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#171722] border border-white/10 overflow-hidden transition-colors hover:border-white/20"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className={`w-full p-5 sm:p-6 flex items-center justify-between text-left gap-4 transition-colors ${
                      isOpen ? 'bg-white/5' : ''
                    } ${isUr ? 'flex-row-reverse text-right' : ''}`}
                  >
                    <span className="text-sm sm:text-base font-bold text-white flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-popo-pink/15 text-popo-pink text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-popo-pink' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      className={`px-6 pb-6 pt-2 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/5 animate-in fade-in-50 duration-150 ${
                        isUr ? 'text-right' : 'text-left'
                      }`}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 9. Agency Call to Action (CTA) */}
        <section className="relative rounded-3xl bg-gradient-to-r from-purple-900/60 via-[#171722] to-pink-900/50 border border-white/15 p-8 sm:p-12 lg:p-16 overflow-hidden text-center flex flex-col items-center gap-6 shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-popo-pink/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-3 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink px-4 py-1.5 rounded-full bg-popo-pink/10 border border-popo-pink/20">
              {isUr ? 'آج ہی سفر کا آغاز کریں' : 'Join the Global Network'}
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white">
              {isUr
                ? 'پوپو لائیو کے ساتھ اپنا ایجنسی سفر شروع کریں'
                : 'Start Your Agency Journey with Popo Live'}
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {isUr
                ? 'ایجنسی پارٹنر بننے کے لیے درخواست دیں اور کری ایٹرز کو اپنی لائیو اسٹریمنگ کمیونٹیز کو بڑھانے میں مدد فراہم کریں۔'
                : 'Apply to become an agency partner and help creators grow their live streaming communities.'}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={scrollToApply}
              className="shadow-xl shadow-popo-pink/30 font-bold px-8"
              leftIcon={<Briefcase className="w-5 h-5" />}
            >
              {isUr ? 'ابھی اپلائی کریں' : 'Apply Now'}
            </Button>
            <Link href="/contact">
              <Button
                variant="secondary"
                size="lg"
                className="font-medium bg-white/10 hover:bg-white/15 border-white/15 px-8"
                leftIcon={<Headphones className="w-5 h-5" />}
              >
                {isUr ? 'سپورٹ سے رابطہ کریں' : 'Contact Support'}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* 10. Website Footer */}
      <Footer lang={lang} />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
