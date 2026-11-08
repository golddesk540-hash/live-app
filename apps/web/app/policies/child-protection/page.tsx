'use client';

import React from 'react';
import { PoppoPolicyLayout } from '@/components/poppo/PoppoPolicyLayout';
import { useLanguage } from '@/lib/languageContext';

export default function ChildProtectionPolicyPage() {
  const { isUr } = useLanguage();

  return (
    <PoppoPolicyLayout
      title="No Child Endangerment Policy"
      titleUr="چائلڈ پروٹیکشن اور تحفظ اطفال پالیسی (No Child Endangerment Policy)"
      updatedDate="2026-03-20"
    >
      <section className="space-y-3">
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-sm shrink-0">
            18+
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-950">
              {isUr ? 'بچوں کے استحصال کے خلاف زیرو ٹالرنس پالیسی' : 'Absolute Zero-Tolerance on Child Endangerment'}
            </h3>
            <p className="text-xs sm:text-sm mt-1 text-rose-800">
              {isUr
                ? 'پوپو لائیو نابالغوں (۱۸ سال سے کم عمر افراد) کے کسی بھی قسم کے استحصال، بدسلوکی، یا لائیو سٹریمنگ میں شمولیت کو سختی سے روکنے کا پابند ہے۔'
                : 'Poppo Live enforces an uncompromising zero-tolerance stance against any form of child sexual abuse material (CSAM), minor exploitation, underage streaming, or child endangerment.'}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۱. عمر کی سخت حد اور ممانعت' : '1. Minimum Age Requirement (Strict 18+)'}
        </h2>
        <p>
          {isUr
            ? 'پوپو لائیو صرف اور صرف ۱۸ سال یا اس سے زائد عمر کے بالغ افراد کے لیے تیار کیا گیا ہے۔ ۱۸ سال سے کم عمر افراد کا اکاؤنٹ بنانا، لائیو نشریات کرنا، پارٹی روم میں اسپیکر بننا، یا گفٹس بھیجنا سختی سے ممنوع ہے۔'
            : 'Poppo Live is exclusively designed and operated for adults aged 18 and older. Minors under 18 are legally forbidden from registering accounts, hosting video or audio broadcasts, participating as voice guests in party rooms, or performing recharge transactions.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۲. بائیومیٹرک اور AI سیکیورٹی اسکیننگ' : '2. Proactive AI Detection & Human Moderation'}
        </h2>
        <p>
          {isUr
            ? 'پلیٹ فارم جدید ترین بائیومیٹرک اسکیننگ اور نیورل نیٹ ورکس کا استعمال کرتا ہے جو ہر سیکنڈ میں لائیو فریمز کا معائنہ کرتے ہیں۔ اگر کسی بھی براڈکاسٹ میں نابالغ شخص یا مشتبہ حرکات کا پتہ چلے تو سسٹم سٹریمنگ فوری طور پر بند کر دیتا ہے۔'
            : 'Our proactive defense infrastructure incorporates multi-layered automated scanning technologies alongside 24/7 human safety specialists. Computer vision models continuously evaluate live streams for suspected minor presence or illicit content, executing instant stream disconnections.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۳. قانون نافذ کرنے والے اداروں سے باضابطہ تعاون' : '3. Immediate Law Enforcement Cooperation'}
        </h2>
        <p>
          {isUr
            ? 'بچوں کے تحفظ سے متعلق کسی بھی سنگین خلاف ورزی کی صورت میں، پوپو لائیو فوری طور پر انٹرپول (Interpol)، نیشنل سینٹر فار مسنگ اینڈ ایکسپلائیٹڈ چلڈرن (NCMEC)، اور متعلقہ مقامی پولیس کو تمام لاگز اور ڈیجیٹل ثبوت فراہم کرتا ہے۔'
            : 'Poppo Live cooperates proactively with the National Center for Missing & Exploited Children (NCMEC), Interpol, and domestic law enforcement authorities. Any identified illicit child material is preserved and reported immediately alongside digital identifiers.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۴. ہنگامی رپورٹنگ اور ہیلپ لائن' : '4. Dedicated Emergency Child Safety Hotline'}
        </h2>
        <p>
          {isUr
            ? 'اگر آپ کو پلیٹ فارم پر نابالغ صارف یا مشتبہ مواد نظر آئے تو فوری طور پر ان-ایپ رپورٹ بٹن دبائیں یا ہمارے خصوصی سیکیورٹی آفیسر کو ای میل کریں:'
            : 'If you encounter any suspected minor activity or safety violation, please use the in-app "Report Stream" feature or email our dedicated Safety Taskforce immediately:'}
        </p>
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm">
          <strong>Direct Emergency Email: </strong>
          <span className="text-[#5653FE] font-bold">safety@poppolive.com</span>
        </div>
      </section>
    </PoppoPolicyLayout>
  );
}
