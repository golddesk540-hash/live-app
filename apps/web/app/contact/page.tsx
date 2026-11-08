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
  MessageSquare,
  Clock,
  Headphones
} from 'lucide-react';

export default function ContactUsPage() {
  const { lang, toggleLang, isUr } = useLanguage();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    poppoId: '',
    category: 'business',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({ name: '', email: '', poppoId: '', category: 'business', subject: '', message: '' });
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
        <section className="pt-10 sm:pt-16 pb-12 bg-gradient-to-b from-purple-50/40 via-white to-white text-center">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <span className="text-[11px] font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              {isUr ? 'پوپو لائیو کسٹمر و کاروباری رابطہ' : 'Official Poppo Live Contact Desk'}
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-[44px] font-extrabold text-gray-950 mt-3 tracking-tight uppercase">
              {isUr ? 'ہم سے رابطہ کریں' : 'GET IN TOUCH WITH US'}
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
              {isUr
                ? 'چاہے آپ ایجنسی بنانا چاہتے ہوں، پلیٹ فارم کے حوالے سے سوال ہو، یا فوری کسٹمر سپورٹ درکار ہو، ہماری ٹیم 24 گھنٹے آپ کی خدمت کے لیے تیار ہے۔'
                : "Whether you're looking to collaborate, have a question, or need support, we're here to help you every step of the way."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#business-desk"
                className="px-6 py-2.5 rounded-full bg-[#5653FE] hover:bg-[#433ffd] text-white font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-105"
              >
                {isUr ? 'کاروباری تعاون' : 'Collaborate'}
              </a>
              <a
                href="#ticket-flow"
                className="px-6 py-2.5 rounded-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-105"
              >
                {isUr ? 'مدد حاصل کریں' : 'Get Help'}
              </a>
            </div>
          </div>
        </section>

        {/* 2. PANORAMIC CREATORS & GLOBAL COMMUNITY BANNER (03_about_and_contact_page.png) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] rounded-3xl overflow-hidden shadow-2xl border border-gray-150">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&auto=format&fit=crop&q=80"
              alt="Poppo Live Global Support Network"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Poppo Live Global Operations
              </span>
              <h2 className="text-2xl sm:text-4xl font-black mt-1">
                {isUr ? '24/7 کسٹمر سپورٹ اور ایجنسی کوآپریشن نیٹ ورک' : 'Global Creator Operations & Support Network'}
              </h2>
            </div>
          </div>
        </section>

        {/* 3. QUICK SUPPORT IN-APP TICKET SYSTEM (03_about_and_contact_page.png) */}
        <section id="ticket-flow" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50/40 to-white rounded-3xl border border-purple-100 p-8 sm:p-12 lg:p-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                {/* Left: 3 Steps */}
                <div className="lg:col-span-7 space-y-6">
                  <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-purple-200 shadow-xs">
                    {isUr ? 'فوری سپورٹ سینٹر' : 'Need Quick Support?'}
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-black text-gray-950 tracking-tight">
                    {isUr ? 'ان-ایپ ٹکٹ کے ذریعے تیز ترین حل' : 'Get Direct In-App Assistance'}
                  </h2>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {isUr
                      ? 'پوپو لائیو ایپ میں فوری کسٹمر سروس ٹکٹ جمع کرائیں اور ہماری تصدیق شدہ سپورٹ ٹیم سے چند منٹوں میں جواب حاصل کریں۔'
                      : 'For immediate assistance regarding live stream verification, coin top-ups, or security issues, submit a ticket directly within the Poppo Live mobile app.'}
                  </p>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#5653FE] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {isUr ? 'پوپو لائیو ایپ میں "Me" ٹیب کھولیں' : 'Open the Poppo App and go to "Me"'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {isUr ? 'اپنے اکاؤنٹ کے مرکزی ڈیش بورڈ پر جائیں۔' : 'Access your personal user center in the bottom navigation.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#5653FE] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {isUr ? '"Customer Service" یا "Feedback" منتخب کریں' : 'Select "Customer Service" / "Feedback"'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {isUr ? 'ہیلپ سینٹر کا آئیکون منتخب کریں۔' : 'Tap the official help icon to initiate your inquiry.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#5653FE] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {isUr ? 'اپنا سوال یا مسئلہ بھیجیں' : 'Describe your request and tap Submit'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {isUr ? 'ہماری ٹیم چند منٹوں میں جواب دیتی ہے۔' : 'Our automated ticketing queue routes your issue to specialists.'}
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
                      <span>{isUr ? 'ایپ حاصل کریں اور ٹکٹ بھیجیں' : 'Submit Ticket via App'}</span>
                    </Link>
                  </div>
                </div>

                {/* Right: Phone Mockup */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="w-[280px] sm:w-[310px] aspect-[9/18] rounded-[40px] bg-gray-950 p-3 shadow-2xl border border-gray-200">
                    <div className="w-full h-full rounded-[30px] overflow-hidden bg-white text-gray-900 p-4 flex flex-col justify-between text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <span className="text-xs font-bold text-gray-900">Help & Feedback</span>
                        <span className="text-[10px] text-emerald-500 font-bold">● Online 24/7</span>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-50 border-2 border-[#5653FE] text-center my-auto space-y-1">
                        <div className="w-9 h-9 rounded-full bg-[#5653FE] text-white flex items-center justify-center mx-auto text-sm">
                          💬
                        </div>
                        <div className="text-xs font-bold text-[#5653FE]">Direct Support Ticket</div>
                        <div className="text-[9px] text-gray-500">Average response time: &lt; 5 minutes</div>
                      </div>

                      <div className="space-y-2 text-[11px] text-gray-600">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <span className="font-semibold text-gray-900">FAQ: </span>
                          <span>How to become an official host?</span>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <span className="font-semibold text-gray-900">FAQ: </span>
                          <span>Coin top-up balance delay?</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* 4. BUSINESS COOPERATION & INQUIRIES DESK (03_about_and_contact_page.png) */}
        <section id="business-desk" className="py-20 bg-[#F8F9FA] border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                {isUr ? 'رابطہ چینلز' : "We'd Love To Hear From You"}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-gray-950 mt-3 tracking-tight">
                {isUr ? 'ہم آپ سے سننا پسند کریں گے' : "Official Contact Channels"}
              </h2>
              <p className="text-gray-600 mt-3 text-sm sm:text-base">
                {isUr
                  ? 'کاروباری اشتراک، ایجنسی پارٹنرشپ یا دیگر استفسارات کے لیے متعلقہ ڈیسک سے رابطہ کریں۔'
                  : 'Reach out directly to our verified corporate departments.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
              {/* Business Card */}
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm hover:border-[#5653FE]/40 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#5653FE] flex items-center justify-center mb-6">
                  <Briefcase className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-950 mb-2">
                  {isUr ? 'کاروباری اشتراک' : 'Business Cooperation'}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  {isUr
                    ? 'ایجنسی رجسٹریشن، سٹریمر ریکروٹمنٹ، برانڈ تعاون اور کمرشل معاہدات کے لیے رابطہ کریں۔'
                    : 'For talent agencies, creator recruitment, influencer contracts, brand advertising, and official sponsorships.'}
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

              {/* Inquiries Card */}
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm hover:border-[#5653FE]/40 hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                  <Mail className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-gray-950 mb-2">
                  {isUr ? 'دیگر استفسارات' : 'Other Inquiries'}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  {isUr
                    ? 'پلیٹ فارم فیڈ بیک، قانونی معاملات، ڈیٹا پروٹیکشن، کاپی رائٹ نوٹسز اور عام معلومات کے لیے رابطہ کریں۔'
                    : 'For general user support, bug reports, legal notices, and compliance inquiries.'}
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

            {/* Direct Form */}
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-gray-950 mb-2 text-center">
                {isUr ? 'آن لائن پیغام بھیجیں' : 'Send A Message Online'}
              </h3>
              <p className="text-xs text-gray-500 text-center mb-8">
                {isUr ? 'ہماری ٹیم 24 گھنٹوں کے اندر جواب دیتی ہے۔' : 'Our team responds to all formal submissions within 24 business hours.'}
              </p>

              {formSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-emerald-800">
                    {isUr ? 'پیغام کامیابی سے موصول ہو گیا!' : 'Message Received Successfully!'}
                  </h4>
                  <p className="text-xs text-emerald-700">
                    {isUr ? 'ہماری ٹیم جلد آپ سے رابطہ کرے گی۔' : 'Thank you. A support representative will get back to your email shortly.'}
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
                        {isUr ? 'پوپو لائیو یوزر آئی ڈی' : 'Poppo Live User ID'}
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
                        {isUr ? 'شعبہ' : 'Inquiry Category'} *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5653FE] focus:ring-2 focus:ring-[#5653FE]/20 outline-none text-sm bg-white"
                      >
                        <option value="business">Business / Agency Partnership</option>
                        <option value="recharge">Coin Top-Up Assistance</option>
                        <option value="compliance">Compliance & Child Protection</option>
                        <option value="other">General Support</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isUr ? 'پیغام' : 'Message'} *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please write your detailed inquiry here..."
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
