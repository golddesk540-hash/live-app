'use client';

import React from 'react';
import { PoppoPolicyLayout } from '@/components/poppo/PoppoPolicyLayout';
import { useLanguage } from '@/lib/languageContext';

export default function RechargeAgreementPolicyPage() {
  const { isUr } = useLanguage();

  return (
    <PoppoPolicyLayout
      title="User Recharge Agreement"
      titleUr="صارف کوائن ریچارج معاہدہ (User Recharge Agreement)"
      updatedDate="2026-03-20"
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۱. کوائنز کا تعارف اور باضابطہ ذرائع' : '1. Virtual Currency Scope & Official Channels'}
        </h2>
        <p>
          {isUr
            ? 'پوپو لائیو کوائنز ایک ورچوئل ڈیجیٹل کرنسی ہیں جو خصوصی طور پر پوپو لائیو ایپلی کیشن اور باضابطہ ویب سائٹ کے ریچارج پورٹل سے خریدی جا سکتی ہیں۔ غیر باضابطہ، غیر مجاز تیسرے فریق، یا پرائیویٹ ایجنٹس سے سستے کوائنز خریدنا سخت ممنوع ہے اور ایسے کوائنز فوری ضبط کر لیے جائیں گے۔'
            : 'Poppo Live Coins are dedicated virtual tokens purchasable strictly through authorized app store platforms and the official Poppo Live Web Recharge Portal. Purchasing coins from unverified third-party sellers, gray-market dealers, or private brokers is strictly prohibited.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۲. ادائیگی اور کوائنز کی فوری ترسیل' : '2. Payment Processing & Immediate Balance Credit'}
        </h2>
        <p>
          {isUr
            ? 'صحیح یوزر آئی ڈی (User ID) فراہم کرنے اور ادائیگی کی کامیاب توثیق کے بعد کوائنز چند سیکنڈز میں صارف کے اکاؤنٹ میں منتقل کر دیے جاتے ہیں۔ براہ کرم ریچارج کرنے سے پہلے اپنی یوزر آئی ڈی کی دوہری تصدیق کریں۔'
            : 'Upon successful authorization by your banking institution or digital wallet, coins are credited to your specified User ID automatically. Users must carefully verify their target Poppo Live ID prior to clicking purchase.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۳. ناقابل واپسی شرائط (Non-Refundable Policy)' : '3. Non-Refundable Nature of Virtual Coins'}
        </h2>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-1">
          <p className="font-bold">
            {isUr ? 'کوائنز کی خریداری کے بعد رقم ناقابل واپسی ہے:' : 'Strict Non-Refundable Condition:'}
          </p>
          <p>
            {isUr
              ? 'چونکہ کوائنز فوری طور پر استعمال کے لیے دستیاب ہو جاتے ہیں اور لائیو رومز میں گفٹس کی صورت میں بھیجے جا سکتے ہیں، اس لیے ریچارج کی گئی رقم واپس (Refund) نہیں کی جا سکتی، ماسوائے قانون کی لازمی دفعات کے۔'
              : 'Because coins are consumed in real-time digital interactions and gift dispatches, all completed purchases are final and non-refundable, except as explicitly mandated by applicable statutory consumer protection law.'}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۴. نابالغوں کی جانب سے غیر مجاز خریداری' : '4. Unauthorized Purchases by Minors'}
        </h2>
        <p>
          {isUr
            ? 'والدین اور سرپرستوں کو مطلع کیا جاتا ہے کہ وہ اپنے کریڈٹ کارڈز اور ادائیگی کے پاس ورڈز نابالغوں کی پہنچ سے دور رکھیں۔ پوپو لائیو کم عمر افراد کے ذریعے کی جانے والی غیر مجاز خریداریوں کے لیے ذمہ دار نہیں ہے۔'
            : 'Guardians must maintain rigorous control over payment methods. Underage minors are strictly barred from buying virtual items on Poppo Live.'}
        </p>
      </section>
    </PoppoPolicyLayout>
  );
}
