'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PoppoHeader } from '@/components/poppo/PoppoHeader';
import { PoppoFooter } from '@/components/poppo/PoppoFooter';
import { useLanguage } from '@/lib/languageContext';
import {
  Mail,
  Send,
  HelpCircle,
  Briefcase,
  Users,
  Compass,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  ArrowRight,
  HeartHandshake
} from 'lucide-react';

export default function AboutAndContactPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    poppoId: '',
    category: 'business',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({ name: '', email: '', poppoId: '', category: 'business', message: '' });
    }, 4000);
  };

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-white text-gray-900 selection:bg-[#5653FE] selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      <PoppoHeader />

      <main className="overflow-hidden">
        {/* 1. HERO SECTION (03_about_and_contact_page.png) */}
        <section className="pt-16 sm:pt-24 pb-16 bg-gradient-to-b from-purple-50/40 via-white to-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              {isUr ? 'ہمارے بارے میں اور رابطہ' : 'About Poppo & Connect With Us'}
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-950 mt-4 tracking-tight uppercase">
              {isUr ? 'ہم سے رابطہ کریں' : 'GET IN TOUCH WITH US'}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {isUr
                ? 'چاہے آپ ایجنسی پارٹنرشپ قائم کرنا چاہتے ہوں، سوال پوچھنا ہو، یا تکنیکی مدد درکار ہو، ہماری ٹیم ہر موڑ پر آپ کی رہنمائی کے لیے حاضر ہے۔'
                : "Whether you're looking to collaborate, have a question, or need support, we're here to help you every step of the way."}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#business-inquiries"
                className="px-7 py-3 rounded-full bg-[#5653FE] hover:bg-[#433ffd] text-white font-bold text-sm shadow-md transition-all hover:scale-105"
              >
                {isUr ? 'تعاون / اشتراک' : 'Collaborate'}
              </a>
              <a
                href="#quick-support"
                className="px-7 py-3 rounded-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold text-sm shadow-xs transition-all hover:scale-105"
              >
                {isUr ? 'مدد حاصل کریں' : 'Get Help'}
              </a>
            </div>
          </div>
        </section>

        {/* 2. PANORAMIC COMMUNITY BANNER PHOTO (03_about_and_contact_page.png) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] rounded-3xl overflow-hidden shadow-2xl border border-gray-150">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&auto=format&fit=crop&q=80"
              alt="Poppo Live Global Community"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Poppo Live Global Team & Creator Network
              </span>
              <h2 className="text-2xl sm:text-4xl font-black mt-1">
                {isUr ? 'دنیا کو ویڈیو اور دوستی سے جوڑنا' : 'Empowering Millions of Creators Worldwide'}
              </h2>
            </div>
          </div>
        </section>

        {/* 3. "EXPLORE THE FUTURE OF VIDEO SOCIAL" (ABOUT WATERMARK + MISSION & VISION) */}
        <section className="py-20 bg-[#F8F9FA] relative overflow-hidden border-y border-gray-200">
          {/* Large Faint Watermark Text "ABOUT" */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[140px] sm:text-[220px] font-black text-gray-200/50 tracking-widest uppercase z-0"
          >
            ABOUT
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                {isUr ? 'ہماری کہانی' : 'Where Our Story Begins'}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3 tracking-tight">
                {isUr ? 'ویڈیو سوشل کا مستقبل دریافت کریں' : 'Explore The Future Of Video Social'}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-gray-600 leading-relaxed">
                {isUr
                  ? 'پوپو لائیو ایک جدید اور جامع لائیو براڈکاسٹنگ پلیٹ فارم ہے جس کا مقصد اجنبیوں کو دوست بنانا اور دنیا بھر کے لوگوں کے درمیان خوشیوں کا تبادلہ ہے۔'
                  : 'Poppo Live is redefining how people interact online by combining high-definition live streaming, multi-mic voice lounges, gamified PK competitions, and genuine creator economies.'}
              </p>
            </div>

            {/* Mission & Vision 2-Column Cards (Matching Screenshot) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Mission Card */}
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5653FE] flex items-center justify-center mb-6">
                  <Compass className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-950 mb-3">
                  {isUr ? 'ہمارا مشن (Our Mission)' : 'Our Mission'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {isUr
                    ? 'دنیا کے ہر کونے سے لوگوں کو بااختیار بنانا کہ وہ ریئل ٹائم ویڈیو اور آواز کے ذریعے اپنی شناخت، فن اور صلاحیتوں کا اظہار کر سکیں اور بغیر کسی جغرافیائی یا لسانی رکاوٹ کے پائیدار دوستیاں قائم کر سکیں۔'
                    : 'To connect people from every corner of the world through the power of real-time video, authentic interactions, and celebratory moments—fostering warmth, kindness, and unforgettable digital experiences.'}
                </p>
              </div>

              {/* Vision Card */}
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-950 mb-3">
                  {isUr ? 'ہمارا وژن (Our Vision)' : 'Our Vision'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {isUr
                    ? 'دنیا کا سب سے محفوظ، متحرک اور معاشی طور پر بااختیار سوشل سٹیج تعمیر کرنا، جہاں ہر باصلاحیت ہوسٹ اور ایجنسی اپنی تخلیقی محنت سے ایک کامیاب اور پائیدار عالمی کیریئر حاصل کر سکے۔'
                    : 'To build the world’s most inclusive, creative, and rewarding digital stage where anyone can turn their passion into a thriving global career while upholding strict 18+ safety and child protection compliance.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. "NEED QUICK SUPPORT?" SECTION (IN-APP TICKET FLOW + ME SCREEN MOCKUP) */}
        <section id="quick-support" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white rounded-3xl border border-purple-100 p-8 sm:p-12 lg:p-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left Column: 3 Steps and Ticket Button */}
                <div className="lg:col-span-7 space-y-6">
                  <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-purple-200 shadow-xs">
                    {isUr ? 'فوری سپورٹ سینٹر' : 'In-App Support Ticket System'}
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight">
                    {isUr ? 'کیا آپ کو فوری مدد چاہیے؟' : 'Need Quick Support?'}
                  </h2>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {isUr
                      ? 'پوپو لائیو ایپ میں فوری کسٹمر سروس ٹکٹ جمع کرائیں اور ہماری تصدیق شدہ سپورٹ ٹیم سے چند منٹوں میں جواب حاصل کریں۔'
                      : 'The fastest way to resolve account, coin recharge, or live streaming questions is directly through our in-app Customer Service Ticket system.'}
                  </p>

                  {/* 3 Step Flow (Matching Screenshot) */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#5653FE] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {isUr ? 'پوپو لائیو ایپ کھولیں اور "Me" پر جائیں' : 'Open Poppo Live App & Tap "Me"'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {isUr ? 'اپنے پروفائل کے مرکزی صفحے پر جائیں۔' : 'Navigate to your personal profile dashboard.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#5653FE] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {isUr ? '"Customer Service" یا "Feedback" منتخب کریں' : 'Tap "Customer Service" / "Feedback"'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {isUr ? 'سیٹنگز مینو میں موجود باضابطہ ہیلپ پورٹل پر کلک کریں۔' : 'Select Customer Service icon located on the profile interface.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#5653FE] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {isUr ? 'اپنا مسئلہ درج کریں اور ٹکٹ جمع کروائیں' : 'Submit Ticket & Receive Rapid Resolution'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {isUr ? 'ہمارے نمائندے 24/7 رہنمائی فراہم کرنے کے لیے موجود ہیں۔' : 'Our customer support specialists will review your ticket within minutes.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/download"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5653FE] hover:bg-[#433ffd] text-white font-bold text-sm shadow-md transition-all hover:scale-105"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{isUr ? 'ایپ میں ٹکٹ جمع کرائیں' : 'Submit Ticket via App'}</span>
                    </Link>
                  </div>
                </div>

                {/* Right Column: Me Profile Screen Mockup */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-[280px] sm:w-[310px] aspect-[9/18] rounded-[40px] bg-gray-950 p-3 shadow-2xl border border-gray-200">
                    <div className="w-full h-full rounded-[30px] overflow-hidden bg-white text-gray-900 p-4 flex flex-col justify-between text-left">
                      {/* Top Bar */}
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-900">Me (Profile)</span>
                        <span className="text-[10px] text-gray-400">ID: 8892104</span>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-3 my-2">
                        <div className="w-12 h-12 rounded-full bg-purple-100 border-2 border-[#5653FE] overflow-hidden">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">Sara Live ✨</div>
                          <div className="text-[10px] text-yellow-500 font-semibold">★ Level 24 VIP</div>
                        </div>
                      </div>

                      {/* Highlighted Ticket Box */}
                      <div className="p-3 rounded-xl bg-purple-50 border-2 border-[#5653FE] text-center my-auto space-y-1">
                        <div className="w-8 h-8 rounded-full bg-[#5653FE] text-white flex items-center justify-center mx-auto text-xs">
                          💬
                        </div>
                        <div className="text-xs font-bold text-[#5653FE]">Customer Service</div>
                        <div className="text-[9px] text-gray-500">Tap here to submit support ticket</div>
                      </div>

                      {/* Quick Links */}
                      <div className="space-y-1.5 text-[11px] text-gray-600">
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span>My Coins</span>
                          <span className="font-bold text-amber-500">4,500</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span>Agency Center</span>
                          <span className="text-gray-400">›</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Settings & Privacy</span>
                          <span className="text-gray-400">›</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 5. "WE'D LOVE TO HEAR FROM YOU" SECTION (BUSINESS COOPERATION & OTHER INQUIRIES) */}
        <section id="business-inquiries" className="py-20 bg-[#F8F9FA] border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                {isUr ? 'رابطہ چینلز' : 'Official Channels'}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3 tracking-tight">
                {isUr ? 'ہم آپ سے سننا پسند کریں گے' : "We'd Love To Hear From You"}
              </h2>
              <p className="text-gray-600 mt-3 text-sm sm:text-base">
                {isUr
                  ? 'کاروباری اشتراک، ایجنسی پارٹنرشپ یا دیگر استفسارات کے لیے متعلقہ ڈیسک سے رابطہ کریں۔'
                  : 'Reach out to our business cooperation, agency partnerships, or general inquiry teams.'}
              </p>
            </div>

            {/* 2 Contact Cards (Matching Screenshot) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
              
              {/* Card 1: Business Cooperation */}
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm hover:border-[#5653FE]/40 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5653FE] flex items-center justify-center mb-6">
                  <Briefcase className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-950 mb-2">
                  {isUr ? 'کاروباری اشتراک (Business Cooperation)' : 'Business Cooperation'}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  {isUr
                    ? 'ایجنسی مالکان، ایم سی این گروپس، برانڈ سپانسرشپس، اور باضابطہ ٹیلنٹ مینجمنٹ کے لیے براہ راست ہماری بی ٹو بی ٹیم سے رابطہ کریں۔'
                    : 'For talent agencies, creator recruitment, influencer marketing campaigns, and official B2B strategic alliances.'}
                </p>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-150 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Official Email</div>
                    <div className="text-sm font-bold text-[#5653FE]">business@poppolive.com</div>
                  </div>
                  <a
                    href="mailto:business@poppolive.com"
                    className="px-4 py-1.5 rounded-full bg-[#5653FE] text-white text-xs font-bold hover:bg-[#433ffd]"
                  >
                    Send Email
                  </a>
                </div>
              </div>

              {/* Card 2: Other Inquiries */}
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm hover:border-[#5653FE]/40 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <Mail className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-950 mb-2">
                  {isUr ? 'دیگر استفسارات (Other Inquiries)' : 'Other Inquiries'}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  {isUr
                    ? 'پلیٹ فارم فیڈ بیک، قانونی معاملات، ڈیٹا پروٹیکشن، کاپی رائٹ نوٹسز اور عام معلومات کے لیے رابطہ کریں۔'
                    : 'For feedback, legal affairs, copyright infringement notices, compliance inquiries, and general platform questions.'}
                </p>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-150 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Official Email</div>
                    <div className="text-sm font-bold text-gray-900">support@poppolive.com</div>
                  </div>
                  <a
                    href="mailto:support@poppolive.com"
                    className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-xs font-bold hover:bg-gray-800"
                  >
                    Send Email
                  </a>
                </div>
              </div>

            </div>

            {/* Direct Web Contact Form */}
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-950 mb-2 text-center">
                {isUr ? 'آن لائن پیغام بھیجیں' : 'Send An Online Message'}
              </h3>
              <p className="text-xs text-gray-500 text-center mb-8">
                {isUr ? 'ہماری ٹیم 24 گھنٹوں کے اندر جواب دیتی ہے۔' : 'Our executive support desk usually replies within 24 business hours.'}
              </p>

              {formSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-emerald-800">
                    {isUr ? 'پیغام کامیابی سے موصول ہو گیا!' : 'Message Received Successfully!'}
                  </h4>
                  <p className="text-xs text-emerald-700">
                    {isUr ? 'ہمارا نمائندہ جلد آپ سے ای میل کے ذریعے رابطہ کرے گا۔' : 'Thank you for reaching out. We will get back to your email shortly.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {isUr ? 'پورا نام' : 'Full Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5653FE] focus:ring-2 focus:ring-[#5653FE]/20 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {isUr ? 'ای میل ایڈریس' : 'Email Address'} *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5653FE] focus:ring-2 focus:ring-[#5653FE]/20 outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {isUr ? 'پوپو لائیو یوزر آئی ڈی (اختیاری)' : 'Poppo Live User ID (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={formData.poppoId}
                        onChange={(e) => setFormData({ ...formData, poppoId: e.target.value })}
                        placeholder="e.g. 8892104"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5653FE] focus:ring-2 focus:ring-[#5653FE]/20 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {isUr ? 'استفسار کی قسم' : 'Inquiry Category'} *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5653FE] focus:ring-2 focus:ring-[#5653FE]/20 outline-none text-sm bg-white"
                      >
                        <option value="business">Business / Agency Cooperation</option>
                        <option value="recharge">Coin Top-Up / Payment Assistance</option>
                        <option value="account">Account Security & Verification</option>
                        <option value="compliance">Legal & Child Protection Compliance</option>
                        <option value="other">General Feedback</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isUr ? 'آپ کا پیغام' : 'Your Message'} *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please describe your proposal or inquiry in detail..."
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5653FE] focus:ring-2 focus:ring-[#5653FE]/20 outline-none text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-[#5653FE] hover:bg-[#433ffd] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isUr ? 'پیغام روانہ کریں' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <PoppoFooter />
    </div>
  );
}
