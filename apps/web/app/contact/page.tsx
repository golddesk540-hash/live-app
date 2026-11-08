'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/homepage/Navbar';
import { Footer } from '@/components/homepage/Footer';
import { AuthModal } from '@/components/homepage/AuthModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import {
  Mail,
  MessageSquare,
  Building2,
  ShieldAlert,
  Headphones,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Send,
  Loader2,
} from 'lucide-react';

export default function ContactPage() {
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const isUr = lang === 'ur';

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [inquiryType, setInquiryType] = useState('general');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const inquiryOptions = [
    { value: 'general', label: isUr ? 'عام سوالات و معلومات' : 'General Inquiries' },
    { value: 'creator', label: isUr ? 'ہوسٹ اور کری ایٹر سپورٹ' : 'Creator & Host Support' },
    { value: 'agency', label: isUr ? 'ایجنسی پارٹنرشپ' : 'Agency Partnerships' },
    { value: 'wallet', label: isUr ? 'کوائنز اور والٹ مسائل' : 'Coins & Wallet Issues' },
    { value: 'safety', label: isUr ? 'سیفٹی اور رپورٹ' : 'Safety & Abuse Reports' },
  ];

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = isUr ? 'نام درج کرنا لازمی ہے' : 'Full Name is required';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = isUr ? 'درست ای میل درج کریں' : 'Valid email address is required';
    }
    if (!subject.trim()) errs.subject = isUr ? 'موضوع درج کریں' : 'Subject is required';
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
      setMessage('');
    }, 1200);
  };

  const contactCards = [
    {
      icon: <Headphones className="w-5 h-5 text-popo-pink" />,
      title: isUr ? 'عام سوالات اور کسٹمر سپورٹ' : 'General & Support Inquiries',
      email: 'support@popolive.placeholder.app',
      desc: isUr ? 'اکاؤنٹ، ایپ اور بنیادی سوالات کے لیے ۲۴/۷ ٹیم حاضر ہے۔' : 'Assistance with account onboarding, profile, and app questions.',
    },
    {
      icon: <Building2 className="w-5 h-5 text-popo-cyan" />,
      title: isUr ? 'ایجنسی اور پارٹنرشپ' : 'Agency Partnerships',
      email: 'agency@popolive.placeholder.app',
      desc: isUr ? 'نئی ایجنسیاں شامل کرنے اور معاہدات کے لیے سرشار ڈیسک۔' : 'Dedicated desk for talent agencies, rosters, and manager inquiries.',
    },
    {
      icon: <Mail className="w-5 h-5 text-amber-400" />,
      title: isUr ? 'کاروباری اور میڈیا روابط' : 'Business & Media',
      email: 'business@popolive.placeholder.app',
      desc: isUr ? 'اسپانسرشپ، ٹورنامنٹ پارٹنرز اور مارکیٹنگ انکوائریز۔' : 'Brand sponsorships, tournament marketing, and enterprise collaborations.',
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
      title: isUr ? 'سیفٹی، ٹرسٹ اور رپورٹس' : 'Safety, Trust & Abuse Reports',
      email: 'safety@popolive.placeholder.app',
      desc: isUr ? 'چائلڈ پروٹیکشن اور نامناسب مواد کی فوری شکایت درج کریں۔' : 'Priority channel for child safety, policy violations, and harassment reports.',
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
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ur' : 'en'))}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex flex-col gap-16">
        {/* Placeholder Notice */}
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-popo-dark-850/80 border border-white/10 text-xs text-popo-text-secondary">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isUr
              ? 'وضاحت: نیچے درج ای میلز اور پتے فرضی پلیس ہولڈرز ہیں۔ براہ کرم اپنا پیغام فارم کے ذریعے بھیجیں۔'
              : 'Notice: Contact emails and addresses shown are placeholder demo details for UI/UX showcase purposes.'}
          </span>
        </div>

        {/* Hero Section */}
        <div className={`flex flex-col gap-3 max-w-3xl ${isUr ? 'text-right ml-auto' : 'text-left'}`}>
          <div className={`inline-flex items-center gap-2 ${isUr ? 'self-end' : 'self-start'}`}>
            <span className="text-xs font-bold uppercase tracking-widest text-popo-pink flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-popo-pink/10 border border-popo-pink/20">
              <MessageSquare className="w-3.5 h-3.5" />
              {isUr ? 'رابطہ کریں' : 'Get in Touch'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isUr ? 'ہم آپ کی مدد کے لیے حاضر ہیں' : 'We’d Love to Hear From You'}
          </h1>
          <p className="text-sm sm:text-base text-popo-text-secondary leading-relaxed">
            {isUr
              ? 'چاہے آپ کری ایٹر بننا چاہتے ہوں، ایجنسی پارٹنرشپ تلاش کر رہے ہوں یا آپ کا کوئی سوال ہو، ہماری ٹیم جواب دینے کے لیے تیار ہے۔'
              : 'Whether you are an aspiring live broadcaster, a talent agency seeking partnership, or a user with questions, our support team is ready.'}
          </p>
        </div>

        {/* Contact Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactCards.map((c, i) => (
            <div
              key={i}
              className={`p-6 rounded-3xl bg-popo-dark-850 border border-white/10 flex flex-col justify-between gap-4 ${
                isUr ? 'text-right' : 'text-left'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 w-fit ${isUr ? 'self-end' : 'self-start'}`}>
                  {c.icon}
                </div>
                <h3 className="text-sm font-bold text-white">{c.title}</h3>
                <p className="text-xs text-popo-text-secondary leading-relaxed">{c.desc}</p>
              </div>
              <div className="pt-3 border-t border-white/5">
                <span className="text-xs font-mono font-semibold text-popo-cyan truncate block">
                  {c.email}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Form Info & Hours */}
          <div className={`lg:col-span-5 flex flex-col gap-6 ${isUr ? 'text-right' : 'text-left'}`}>
            <h2 className="text-2xl font-bold text-white">
              {isUr ? 'براہِ راست میسج ارسال کریں' : 'Send Us a Direct Message'}
            </h2>
            <p className="text-xs sm:text-sm text-popo-text-secondary leading-relaxed">
              {isUr
                ? 'فارم پُر کریں اور ہماری سپورٹ یا پارٹنرشپ ٹیم عام طور پر ۲۴ گھنٹوں کے اندر جواب دیتی ہے۔'
                : 'Fill out the form below. Inquiries are routed directly to the appropriate regional management team.'}
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <div className={`flex items-center gap-3 text-xs text-popo-text-secondary ${isUr ? 'flex-row-reverse' : ''}`}>
                <Clock className="w-4 h-4 text-popo-cyan shrink-0" />
                <span>{isUr ? 'سپورٹ ٹائمنگ: ۲۴/۷ لائیو اسسٹنس' : 'Support Availability: 24/7 Global Desk'}</span>
              </div>
              <div className={`flex items-center gap-3 text-xs text-popo-text-secondary ${isUr ? 'flex-row-reverse' : ''}`}>
                <MapPin className="w-4 h-4 text-popo-pink shrink-0" />
                <span>{isUr ? 'عالمی آپریشنز: یو اے ای، پاکستان، سنگاپور' : 'Global Operations: UAE, Pakistan, Singapore Hubs'}</span>
              </div>
              <div className={`flex items-center gap-3 text-xs text-popo-text-secondary ${isUr ? 'flex-row-reverse' : ''}`}>
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isUr ? 'سیکیورٹی: تمام ڈیٹا انکرپٹڈ ہے' : 'Data Privacy: Messages handled under strict privacy standards'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 rounded-3xl bg-popo-dark-900 border border-white/10 p-6 sm:p-10 shadow-2xl relative">
            {isSubmitted ? (
              <div className="py-12 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {isUr ? 'آپ کا پیغام کامیابی سے موصول ہو گیا ہے!' : 'Thank You! Message Received'}
                </h3>
                <p className="text-xs sm:text-sm text-popo-text-secondary max-w-md leading-relaxed">
                  {isUr
                    ? 'ہماری کسٹمر سپورٹ یا پارٹنرشپ ٹیم جلد ہی آپ کی فراہم کردہ ای میل پر رابطہ کرے گی۔'
                    : 'Your inquiry has been logged in our demo queue. Our team will review and respond to your email within 24 business hours.'}
                </p>
                <Button variant="secondary" size="sm" onClick={() => setIsSubmitted(false)} className="mt-2">
                  {isUr ? 'ایک اور پیغام بھیجیں' : 'Send Another Message'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isUr ? 'پورا نام' : 'Full Name *'}
                    placeholder={isUr ? 'مثال: علی احمد' : 'e.g. John Doe'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    error={errors.fullName}
                  />
                  <Input
                    label={isUr ? 'ای میل ایڈریس' : 'Email Address *'}
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Dropdown
                    label={isUr ? 'انکوائری کی قسم' : 'Inquiry Type'}
                    options={inquiryOptions}
                    value={inquiryType}
                    onChange={setInquiryType}
                  />
                  <Input
                    label={isUr ? 'موضوع' : 'Subject *'}
                    placeholder={isUr ? 'پیغام کا عنوان' : 'Brief subject summary'}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    error={errors.subject}
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-popo-text-secondary">
                    {isUr ? 'پیغام *' : 'Message *'}
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isUr ? 'اپنا پیغام یہاں تفصیل سے درج کریں...' : 'How can we assist you? Describe your question or proposal...'}
                    className={`w-full bg-popo-dark-850 text-popo-text-primary placeholder:text-popo-text-muted text-sm rounded-xl p-4 transition-all duration-200 border border-white/10 outline-none focus:border-popo-pink focus:ring-2 focus:ring-popo-pink/20 resize-none ${
                      errors.message ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.message && (
                    <span className="text-xs font-medium text-popo-state-error">{errors.message}</span>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 shadow-glow-pink"
                    leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  >
                    {isSubmitting
                      ? isUr
                        ? 'بھیجا جا رہا ہے...'
                        : 'Submitting...'
                      : isUr
                      ? 'پیغام بھیجیں'
                      : 'Submit Message'}
                  </Button>
                </div>
              </form>
            )}
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
