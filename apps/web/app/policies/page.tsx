'use client';

import React from 'react';
import Link from 'next/link';
import { PoppoHeader } from '@/components/poppo/PoppoHeader';
import { PoppoFooter } from '@/components/poppo/PoppoFooter';
import { useLanguage } from '@/lib/languageContext';
import {
  ShieldCheck,
  Scale,
  FileText,
  CreditCard,
  UserCheck,
  ArrowRight,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function PoliciesHubPage() {
  const { isUr } = useLanguage();

  const policies = [
    {
      title: 'Privacy Protection',
      titleUr: 'پرائیویسی پروٹیکشن',
      desc: 'How Poppo Live collects, safeguards, and respects user data in full compliance with global standards.',
      descUr: 'جانیں کہ پوپو لائیو کس طرح آپ کا ڈیٹا اور رازداری محفوظ رکھتا ہے۔',
      href: '/policies/privacy',
      icon: ShieldCheck,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Terms Of Service',
      titleUr: 'استعمال کی شرائط',
      desc: 'The binding platform rules, 18+ eligibility criteria, and prohibited conduct codes.',
      descUr: 'پلیٹ فارم کے قواعد، ۱۸ سال کی قانونی اہلیت اور ضوابط۔',
      href: '/policies/terms',
      icon: Scale,
      color: 'bg-purple-50 text-[#5653FE]',
    },
    {
      title: 'Live Agreement',
      titleUr: 'لائیو معاہدہ',
      desc: 'Broadcaster standards, room moderation guidelines, and virtual gift point conversions.',
      descUr: 'براڈکاسٹرز کے لیے اخلاقی اصول، پوائنٹس اور لائیو قوانین۔',
      href: '/policies/live-agreement',
      icon: FileText,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'User Recharge Agreement',
      titleUr: 'ریچارج معاہدہ',
      desc: 'Official virtual coin purchasing terms, immediate balance credit, and non-refundable provisions.',
      descUr: 'کوائنز خریدنے کے قواعد، ادائیگی اور ناقابل واپسی کی شرائط۔',
      href: '/policies/recharge-agreement',
      icon: CreditCard,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'No Child Endangerment Policy',
      titleUr: 'چائلڈ پروٹیکشن پالیسی',
      desc: 'Uncompromising zero-tolerance policy against underage usage, with proactive AI child safety filters.',
      descUr: 'نابالغوں کے داخلے کی مکمل ممانعت اور بچوں کے تحفظ کے سخت اقدامات۔',
      href: '/policies/child-protection',
      icon: UserCheck,
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-white text-gray-900 selection:bg-[#5653FE] selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      <PoppoHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
            {isUr ? 'سرکاری فریم ورک' : 'Legal & Trust Center'}
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-950 mt-4 tracking-tight">
            {isUr ? 'پوپو لائیو پالیسیاں اور قواعد' : 'Poppo Live Policies & Agreements'}
          </h1>
          <p className="mt-4 text-base text-gray-600 leading-relaxed">
            {isUr
              ? 'پلیٹ فارم کے استعمال، صارفین کے حقوق، رازداری اور بچوں کے تحفظ سے متعلق تمام باضابطہ قانونی دستاویزات۔'
              : 'Explore our binding user agreements, privacy commitments, broadcaster guidelines, and child protection standards.'}
          </p>
        </div>

        {/* Policy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {policies.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group bg-white rounded-3xl p-8 border border-gray-200 hover:border-[#5653FE]/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all flex flex-col justify-between"
            >
              <div>
                <div className={`w-14 h-14 rounded-2xl ${p.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <p.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#5653FE] transition-colors">
                  {isUr ? p.titleUr : p.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
                  {isUr ? p.descUr : p.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#5653FE]">
                <span>{isUr ? 'دستاویز پڑھیں' : 'View Document'}</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <PoppoFooter />
    </div>
  );
}
