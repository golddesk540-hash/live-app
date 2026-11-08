'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { AuthModal } from '@/components/homepage/AuthModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import {
  Briefcase,
  Users,
  TrendingUp,
  Award,
  CheckCircle2,
  ChevronDown,
  Building,
  ShieldCheck,
  Zap,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle,
} from 'lucide-react';

import { useLanguage } from '@/lib/languageContext';

export default function AgencyPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Form State
  const [agencyName, setAgencyName] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [experience, setExperience] = useState('10-50');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const experienceOptions = [
    { value: '1-10', label: isUr ? '۱ تا ۱۰ ہوسٹس' : '1 - 10 Broadcasters' },
    { value: '10-50', label: isUr ? '۱۰ تا ۵۰ ہوسٹس' : '10 - 50 Broadcasters' },
    { value: '50+', label: isUr ? '۵۰ سے زائد تجربہ کار ہوسٹس' : '50+ Professional Broadcasters' },
    { value: 'new', label: isUr ? 'نئی ایجنسی (ابھی آغاز کیا ہے)' : 'New Agency (Starting Fresh)' },
  ];

  const countryOptions = [
    { value: 'Pakistan', label: '🇵🇰 Pakistan' },
    { value: 'UAE', label: '🇦🇪 United Arab Emirates' },
    { value: 'Saudi Arabia', label: '🇸🇦 Saudi Arabia' },
    { value: 'Turkey', label: '🇹🇷 Turkey' },
    { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
    { value: 'United States', label: '🇺🇸 United States' },
    { value: 'Other', label: '🌐 Other Region' },
  ];

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!agencyName.trim()) errs.agencyName = isUr ? 'ایجنسی کا نام درج کریں' : 'Agency Name is required';
    if (!applicantName.trim()) errs.applicantName = isUr ? 'درخواست گزار کا نام درج کریں' : 'Applicant Name is required';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = isUr ? 'درست کاروباری ای میل درج کریں' : 'Valid business email is required';
    }
    if (!phone.trim()) errs.phone = isUr ? 'واٹس ایپ یا موبائل نمبر درج کریں' : 'Phone / WhatsApp is required';
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
      setApplicantName('');
      setEmail('');
      setPhone('');
      setMessage('');
    }, 1200);
  };

  const workflowSteps = [
    {
      step: '01',
      title: isUr ? 'ایجنسی رجسٹریشن' : 'Agency Registration & Verification',
      desc: isUr
        ? 'آن لائن فارم پُر کریں اور اپنے کاروباری کاغذات یا قومی شناختی ثبوت جمع کروائیں۔'
        : 'Submit your agency credentials and business registration for partner verification.',
    },
    {
      step: '02',
      title: isUr ? 'ہوسٹ ریکروٹمنٹ' : 'Host Recruitment & Roster Setup',
      desc: isUr
        ? 'اپنے خصوصی انویٹیشن کوڈ کے ذریعے ہوسٹس کو اپنے پینل میں شامل کریں اور ان کی ٹریننگ شروع کریں۔'
        : 'Invite and onboard creators using your unique agency code directly into your master dashboard.',
    },
    {
      step: '03',
      title: isUr ? 'لائیو اسٹریمنگ ٹاسکس' : 'Daily Streaming Mission Tracking',
      desc: isUr
        ? 'اپنے ہوسٹس کے روزانہ اسٹریمنگ گھنٹوں، اسٹریکس اور ویلتھ لیول ۵ کی پیشرفت کی نگرانی کریں۔'
        : 'Monitor active broadcasting hours, target streaks, and live PK battle engagements in real time.',
    },
    {
      step: '04',
      title: isUr ? 'کمیشن اور ادائیگیاں' : 'Transparent Commission Payouts',
      desc: isUr
        ? 'ہوسٹس کو ۷۰٪ گفٹ شیئر ملتا ہے جبکہ ایجنسی براہ راست مخصوص کمیشن اپنے والٹ میں وصول کرتی ہے۔'
        : 'Receive designated agency commission shares with weekly automated settlement to bank/wallets.',
    },
  ];

  const faqs = [
    {
      q: isUr ? 'ہوسٹس کی کمائی کا نظام کیسے کام کرتا ہے؟' : 'How does the host earnings split work?',
      a: isUr
        ? 'پوپو لائیو کے شفاف نظام کے مطابق گفٹس کے کوائنز کا ۷۰٪ حصہ براہ راست ہوسٹ کے پوائنٹس میں جمع ہوتا ہے، جسے وہ رقم کی صورت میں نکلوا سکتے ہیں۔ ایجنسی کو پلیٹ فارم کی جانب سے اضافی ریونیو شیئر کمیشن دیا جاتا ہے۔'
        : 'Under Popo Live standards, 70% of all virtual gift coins convert directly into host points. In addition, registered partner agencies earn a dedicated percentage commission based on the aggregate performance of their signed roster.',
    },
    {
      q: isUr ? 'ایجنسی بنانے کے لیے کم از کم کیا شرائط ہیں؟' : 'What are the minimum requirements to become an agency?',
      a: isUr
        ? 'ایجنسی کے لیے کم از کم ۵ باصلاحیت ہوسٹس لانے کا عزم، ۱۸ سال یا زائد عمر کا تصدیق شدہ شناخت نامہ، اور کمیونٹی گائیڈ لائنز کی پابندی لازمی ہے۔'
        : 'Agencies must commit to recruiting and mentoring at least 5 active broadcasters, verify authorized legal representation (18+), and strictly enforce Popo Live trust and child-safety guidelines.',
    },
    {
      q: isUr ? 'کیا ہم بین الاقوامی ہوسٹس کو سائن کر سکتے ہیں؟' : 'Can our agency sign international broadcasters?',
      a: isUr
        ? 'جی ہاں! پوپو لائیو ایک عالمی پلیٹ فارم ہے۔ آپ پاکستان، یو اے ای، سعودی عرب، برطانیہ اور دیگر ممالک سے ہوسٹس سائن کر سکتے ہیں۔'
        : 'Yes. Popo Live operates a unified multi-region backend. Agencies can recruit and manage talent across Pakistan, the Middle East, Central Asia, and worldwide.',
    },
    {
      q: isUr ? 'ایجنسی کی ادائیگیاں کب اور کیسے کی جاتی ہیں؟' : 'How and when are agency commission payouts issued?',
      a: isUr
        ? 'ایجنسی کمیشن کا حساب ہر ہفتے مکمل کیا جاتا ہے اور بینک ٹرانسفر یا مجاز پیمنٹ والٹس کے ذریعے براہ راست ادا کیا جاتا ہے۔'
        : 'Settlement reports are audited weekly. Approved commission balances can be disbursed directly to local bank accounts, international wire, or verified payment partners with full financial receipts.',
    },
  ];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-popo-dark-950 text-popo-text-primary overflow-x-hidden selection:bg-popo-pink selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      <Navbar
        lang={lang}
        onToggleLang={toggleLang}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-20">
        {/* Agency Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className={`lg:col-span-7 flex flex-col gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
            <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-popo-cyan flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-popo-cyan/10 border border-popo-cyan/20">
                <Briefcase className="w-3.5 h-3.5" />
                {isUr ? 'پوپو لائیو ایجنسی پارٹنرشپ' : 'Popo Live Agency Partnership'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              {isUr ? (
                <>
                  اپنی ٹیلنٹ ایجنسی کو{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-cyan via-purple-400 to-popo-pink">
                    پوپو لائیو پر وسعت دیں
                  </span>
                </>
              ) : (
                <>
                  Scale Your Talent Agency with{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-popo-cyan via-purple-400 to-popo-pink">
                    Popo Live Ecosystem
                  </span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-popo-text-secondary leading-relaxed max-w-2xl">
              {isUr
                ? 'باصلاحیت براڈکاسٹرز بھرتی کریں، ان کی اسٹریمنگ کارکردگی کی نگرانی کریں، اور سرشار ایجنسی ڈیش بورڈ کے ذریعے باقاعدہ کمیشن حاصل کریں۔'
                : 'Recruit top broadcasters, manage dynamic host rosters, track real-time streaming analytics, and unlock high-tier agency commission shares on a unified platform.'}
            </p>

            <div className={`flex flex-wrap items-center gap-4 pt-2 ${isUr ? 'justify-end' : 'justify-start'}`}>
              <Button
                variant="cyan"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('apply-form');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                leftIcon={<Briefcase className="w-5 h-5" />}
              >
                {isUr ? 'ابھی ایجنسی کے لیے اپلائی کریں' : 'Become a Popo Live Agency'}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            {/* Visual Agency Dashboard Badge Box */}
            <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-popo-dark-850 to-popo-dark-900 border border-white/10 p-6 shadow-2xl flex flex-col gap-5 text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-popo-cyan/20 border border-popo-cyan/30 flex items-center justify-center text-popo-cyan font-bold">
                    AG
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Falcon Agency Global</h4>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Verified Partner Tier 1
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  ID: 409218
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-xs text-popo-text-muted uppercase block">Active Hosts</span>
                  <span className="text-lg font-black text-white mt-1 block">42</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-xs text-popo-text-muted uppercase block">Hours Today</span>
                  <span className="text-lg font-black text-popo-cyan mt-1 block">184h</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <span className="text-xs text-popo-text-muted uppercase block">Weekly Pts</span>
                  <span className="text-lg font-black text-amber-400 mt-1 block">1.8M</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-popo-dark-950/80 border border-white/5 flex items-center justify-between text-xs text-popo-text-secondary">
                <span>Direct Split: Transparent Ledger</span>
                <span className="font-bold text-emerald-400">Weekly Payouts</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Workflow Steps */}
        <div className="flex flex-col gap-10">
          <div className={`max-w-2xl ${isUr ? 'text-right ml-auto' : 'text-left'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink">
              {isUr ? 'ورک فلو کے مراحل' : 'Agency Workflow'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
              {isUr ? 'ایجنسی کس طرح کام کرتی ہے' : 'How Agencies Operate on Popo Live'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((ws, i) => (
              <div
                key={i}
                className={`p-6 rounded-3xl bg-popo-dark-850 border border-white/10 flex flex-col justify-between gap-4 relative overflow-hidden ${
                  isUr ? 'text-right' : 'text-left'
                }`}
              >
                <span className="text-4xl font-black text-white/10 absolute top-4 right-4 select-none">
                  {ws.step}
                </span>
                <div className="flex flex-col gap-2 relative z-10">
                  <span className="text-xs font-mono font-bold text-popo-cyan">{ws.step}. Step</span>
                  <h3 className="text-base font-bold text-white">{ws.title}</h3>
                  <p className="text-xs text-popo-text-secondary leading-relaxed">{ws.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agency Application Form Section */}
        <div id="apply-form" className="rounded-3xl bg-popo-dark-900 border border-white/10 p-8 sm:p-12 shadow-2xl relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className={`lg:col-span-5 flex flex-col gap-4 ${isUr ? 'text-right' : 'text-left'}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-popo-cyan">
                {isUr ? 'آن لائن درخواست' : 'Apply for Agency Partnership'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {isUr ? 'آج ہی اپنی ایجنسی رجسٹر کروائیں' : 'Register Your Agency Today'}
              </h2>
              <p className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed">
                {isUr
                  ? 'اپنے کری ایٹرز کو ایک مستند اور محفوظ پلیٹ فارم مہیا کریں۔ درخواست موصول ہونے کے بعد ہماری ایجنسی ٹیم ۲۴ گھنٹوں میں جائزہ مکمل کرتی ہے۔'
                  : 'Join verified talent networks across 30+ countries. Our agency onboarding specialists review and approve qualifying applicant profiles daily.'}
              </p>

              <div className="flex flex-col gap-2 pt-4">
                <div className={`flex items-center gap-2 text-xs text-popo-text-secondary ${isUr ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isUr ? 'کوئی پوشیدہ فیس یا رجسٹریشن چارجز نہیں' : 'No upfront registration fees'}</span>
                </div>
                <div className={`flex items-center gap-2 text-xs text-popo-text-secondary ${isUr ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isUr ? 'سرشار اکاؤنٹ مینیجر اور ٹریننگ مٹیریل' : 'Dedicated Partner Manager support'}</span>
                </div>
                <div className={`flex items-center gap-2 text-xs text-popo-text-secondary ${isUr ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isUr ? '۱۰۰٪ خودکار ہفتہ وار کمیشن پے آؤٹ' : 'Direct weekly commission disbursement'}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              {isSubmitted ? (
                <div className="py-12 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-popo-cyan/20 text-popo-cyan border border-popo-cyan/40 flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {isUr ? 'ایجنسی درخواست موصول ہو گئی!' : 'Agency Application Submitted!'}
                  </h3>
                  <p className="text-xs sm:text-sm text-popo-text-secondary max-w-md leading-relaxed">
                    {isUr
                      ? 'ہماری گلوبل ایجنسی پارٹنرشپ ڈائریکٹوریٹ آپ کی معلومات کا جائزہ لے کر آپ سے براہِ راست رابطہ کرے گی۔'
                      : 'Our Global Agency Partnership Directorate has received your submission. An agency manager will contact you on WhatsApp / Email within 24 hours.'}
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => setIsSubmitted(false)} className="mt-2">
                    {isUr ? 'ایک اور درخواست جمع کروائیں' : 'Submit Another Application'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={isUr ? 'ایجنسی کا نام *' : 'Agency / Company Name *'}
                      placeholder={isUr ? 'مثال: فالکن ٹیلنٹ' : 'e.g. Star Talent Agency'}
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      error={errors.agencyName}
                    />
                    <Input
                      label={isUr ? 'درخواست گزار کا پورا نام *' : 'Applicant / Director Name *'}
                      placeholder={isUr ? 'مثال: حمزہ خان' : 'e.g. Alex Miller'}
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      error={errors.applicantName}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={isUr ? 'کاروباری ای میل *' : 'Business Email *'}
                      type="email"
                      placeholder="agency@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={errors.email}
                    />
                    <Input
                      label={isUr ? 'فون / واٹس ایپ نمبر *' : 'Phone / WhatsApp Number *'}
                      placeholder="+92 300 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={errors.phone}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Dropdown
                      label={isUr ? 'ملک / خطہ' : 'Country / Region'}
                      options={countryOptions}
                      value={country}
                      onChange={setCountry}
                    />
                    <Dropdown
                      label={isUr ? 'ہوسٹس کا موجودہ تجربہ' : 'Broadcaster Roster Size'}
                      options={experienceOptions}
                      value={experience}
                      onChange={setExperience}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-semibold uppercase tracking-wider text-popo-text-secondary">
                      {isUr ? 'ایجنسی کا تعارف یا نوٹ' : 'Agency Pitch / Background (Optional)'}
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={isUr ? 'اپنی ایجنسی اور ہوسٹس کے بارے میں کچھ بتائیں...' : 'Tell us about your management experience, host recruitment channels, etc.'}
                      className="w-full bg-popo-dark-850 text-popo-text-primary placeholder:text-popo-text-muted text-sm rounded-xl p-4 transition-all duration-200 border border-white/10 outline-none focus:border-popo-cyan focus:ring-2 focus:ring-popo-cyan/20 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="cyan"
                      size="md"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-8"
                      leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    >
                      {isSubmitting
                        ? isUr
                          ? 'درخواست جمع ہو رہی ہے...'
                          : 'Submitting Application...'
                        : isUr
                        ? 'درخواست جمع کروائیں'
                        : 'Submit Agency Application'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions Accordion */}
        <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              {isUr ? 'عام سوالات' : 'Agency FAQ'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              {isUr ? 'اکثر پوچھے جانے والے سوالات' : 'Frequently Asked Questions'}
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-popo-dark-850 border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className={`w-full p-5 flex items-center justify-between text-left gap-4 ${
                      isUr ? 'flex-row-reverse text-right' : ''
                    }`}
                  >
                    <span className="text-sm sm:text-base font-bold text-white">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-popo-text-muted shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-popo-cyan' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className={`px-5 pb-5 pt-1 text-xs sm:text-sm text-popo-text-secondary leading-relaxed border-t border-white/5 ${
                      isUr ? 'text-right' : 'text-left'
                    }`}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer lang={lang} />

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
