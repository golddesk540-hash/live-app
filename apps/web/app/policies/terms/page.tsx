'use client';

import React from 'react';
import { PoppoPolicyLayout } from '@/components/poppo/PoppoPolicyLayout';
import { useLanguage } from '@/lib/languageContext';

export default function TermsOfServicePolicyPage() {
  const { isUr } = useLanguage();

  return (
    <PoppoPolicyLayout
      title="Terms Of Service"
      titleUr="استعمال کی باضابطہ شرائط (Terms of Service)"
      updatedDate="2026-03-20"
    >
      {/* Section 1 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۱. معاہدے کی قبولیت اور اہلیت' : '1. Acceptance of Terms & User Eligibility'}
        </h2>
        <p>
          {isUr
            ? 'پوپو لائیو پلیٹ فارم (ویب سائٹ، موبائل ایپس اور تمام متعلقہ سروسز) پر اکاؤنٹ بنا کر یا اس کا استعمال کر کے، آپ تسلیم کرتے ہیں کہ آپ کم از کم ۱۸ سال کی عمر کے ہیں اور ان تمام شرائط و ضوابط کے پابند رہنے پر رضامند ہیں۔'
            : 'By creating an account, browsing, or utilizing Poppo Live, you explicitly affirm that you are at least 18 years of age, legally capable of entering into binding contracts, and agree to strictly adhere to these Terms of Service.'}
        </p>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
          <strong>{isUr ? 'اہم انتباہ: ' : 'IMPORTANT NOTICE: '}</strong>
          {isUr
            ? 'اگر آپ کی عمر ۱۸ سال سے کم ہے تو آپ کو پوپو لائیو استعمال کرنے یا کوئی بھی سروس دیکھنے کی قانونی اجازت نہیں ہے۔'
            : 'If you are under 18 years old, you are strictly prohibited from using, registering, or accessing any part of Poppo Live.'}
        </div>
      </section>

      {/* Section 2 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۲. اکاؤنٹ کی سیکیورٹی اور صارف کی ذمہ داریاں' : '2. Account Security & User Conduct'}
        </h2>
        <p>
          {isUr
            ? 'صارف اپنے اکاؤنٹ کے لاگ ان کریڈینشلز (پاس ورڈ یا تصدیقی کوڈ) کو خفیہ رکھنے کا خود ذمہ دار ہے۔ اکاؤنٹ کسی دوسرے شخص کو بیچنا، کرایہ پر دینا یا منتقل کرنا سختی سے ممنوع ہے۔'
            : 'You are solely responsible for maintaining the confidentiality of your login credentials. You may not sell, trade, lease, or transfer your Poppo Live account or virtual coin balance to any third party.'}
        </p>
      </section>

      {/* Section 3 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۳. ممنوعہ سرگرمیاں اور زیرو ٹالرنس پالیسی' : '3. Prohibited Activities & Zero-Tolerance Violations'}
        </h2>
        <p>
          {isUr
            ? 'پوپو لائیو پر درج ذیل تمام حرکات سختی سے ممنوع ہیں اور ان کے ارتکاب پر فوری مستقل پابندی عائد کی جائے گی:'
            : 'Users agree strictly never to engage in any of the following prohibited behaviors:'}
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>{isUr ? 'نابالغ افراد کی شرکت، ان کی تصویر کشی یا کسی بھی قسم کا استحصال۔' : 'Depicting, soliciting, or involving minors in any live stream or profile content.'}</li>
          <li>{isUr ? 'فحش، جنسی یا غیر اخلاقی مناظر نشر کرنا یا غیر مناسب لباس میں لائیو آنا۔' : 'Broadcasting sexually suggestive content, pornography, nudity, or obscene conduct.'}</li>
          <li>{isUr ? 'نفرت انگیز تقاریر، مذہبی منافرت، دھمکیاں یا ہراساں کرنا۔' : 'Promoting violence, cyberbullying, hate speech, religious extremism, or harassment.'}</li>
          <li>{isUr ? 'غیر قانونی جوئے بازی، دھوکہ دہی، یا غیر مجاز ادائیگی کے ہتھکنڈے۔' : 'Running unauthorized gambling schemes, pyramid programs, or fraudulent promotions.'}</li>
        </ul>
      </section>

      {/* Section 4 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۴. ورچوئل کوائنز اور گفٹس پالیسی' : '4. Virtual Coins & Gift Economy Rules'}
        </h2>
        <p>
          {isUr
            ? 'پوپو لائیو کوائنز ایک ڈیجیٹل سروس آئٹم ہیں جو صرف باضابطہ چینلز سے خریدے جا سکتے ہیں۔ کوائنز حقیقی نقد رقم نہیں ہیں اور ناقابل واپسی (Non-refundable) ہیں۔ ہوسٹس کو موصول ہونے والے گفٹس پلیٹ فارم کے رولز کے مطابق پوائنٹس میں تبدیل ہوتے ہیں۔'
            : 'Poppo Live coins and gifts are digital entertainment tokens with no cash value outside our ecosystem. Once top-ups are completed, coins are non-refundable and non-exchangeable except as specified in our User Recharge Agreement.'}
        </p>
      </section>

      {/* Section 5 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۵. اکاؤنٹ کی بندش اور پلیٹ فارم کے اختیارات' : '5. Account Termination & Suspension'}
        </h2>
        <p>
          {isUr
            ? 'پوپو لائیو کسی بھی ایسے اکاؤنٹ کو معطل یا مستقل بند کرنے کا حق محفوظ رکھتا ہے جو قواعد کی خلاف ورزی کرے، غیر قانونی سرگرمیوں میں ملوث ہو، یا کمیونٹی کی حفاظت کو نقصان پہنچائے۔'
            : 'Poppo Live reserves the exclusive right to immediately terminate, ban, or forfeit virtual assets associated with accounts that breach these Terms or compromise community integrity.'}
        </p>
      </section>
    </PoppoPolicyLayout>
  );
}
