'use client';

import React from 'react';
import { PoppoPolicyLayout } from '@/components/poppo/PoppoPolicyLayout';
import { useLanguage } from '@/lib/languageContext';

export default function CookiePolicyPage() {
  const { isUr } = useLanguage();

  return (
    <PoppoPolicyLayout
      title="Cookie Policy"
      titleUr="کوکی پالیسی اور براؤزر اسٹوریج"
      updatedDate="2026-03-20"
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۱. کوکیز اور ویب اسٹوریج کی وضاحت' : '1. What Are Cookies & Web Storage'}
        </h2>
        <p>
          {isUr
            ? 'کوکیز چھوٹی متنی فائلیں ہوتی ہیں جو ویب ڈیسک ٹاپ کا استعمال کرتے ہوئے آپ کے کمپیوٹر براؤزر میں محفوظ ہوتی ہیں۔ یہ آپ کا لاگ ان سیشن برقرار رکھنے اور زبان کی ترجیحات محفوظ کرنے میں مدد دیتی ہیں۔'
            : 'Cookies and local storage tokens are small data files placed on your browser when accessing Poppo Live Web. They allow our systems to recognize your browser session and retain your selected language and interface settings.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۲. ضروری کوکیز کا استعمال' : '2. Essential Operational Cookies'}
        </h2>
        <p>
          {isUr
            ? 'ہم صرف ضروری کوکیز استعمال کرتے ہیں جو سیشن سیکیورٹی، سائبر فراڈ کی روک تھام اور درست زبان (اردو یا انگریزی) دکھانے کے لیے درکار ہیں۔'
            : 'We deploy strictly necessary cookies for authentication security, CSRF protection, and preserving user interface preferences such as language (English / Urdu) and stream volume.'}
        </p>
      </section>
    </PoppoPolicyLayout>
  );
}
