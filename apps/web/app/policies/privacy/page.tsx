'use client';

import React from 'react';
import { PoppoPolicyLayout } from '@/components/poppo/PoppoPolicyLayout';
import { useLanguage } from '@/lib/languageContext';

export default function PrivacyProtectionPolicyPage() {
  const { isUr } = useLanguage();

  return (
    <PoppoPolicyLayout
      title="Privacy Protection"
      titleUr="پرائیویسی پروٹیکشن (رازداری کا تحفظ)"
      updatedDate="2026-03-20"
    >
      {/* Article 1 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۱. عمومی تعارف اور رازداری کا دائرہ کار' : 'Article 1. Scope of Privacy Protection'}
        </h2>
        <p>
          {isUr
            ? 'پوپو لائیو (جسے آگے "ہم" یا "پلیٹ فارم" کہا گیا ہے) صارفین کے ذاتی ڈیٹا اور رازداری کے تحفظ کو اولین ترجیح دیتا ہے۔ یہ پرائیویسی پالیسی واضح کرتی ہے کہ جب آپ پوپو لائیو ایپلی کیشن، ویب ڈیسک ٹاپ، یا لائیو براڈکاسٹ سروسز استعمال کرتے ہیں تو ہم آپ کی معلومات کس طرح جمع، استعمال اور محفوظ کرتے ہیں۔'
            : 'Poppo Live ("we", "us", or "our") deeply respects and protects user privacy. This Privacy Protection document outlines how personal data is collected, stored, processed, and safeguarded across all our mobile applications, web platforms, and associated live streaming services.'}
        </p>
        <p>
          {isUr
            ? 'پلیٹ فارم کا استعمال شروع کر کے آپ اس بات سے اتفاق کرتے ہیں کہ آپ کا ڈیٹا اس پالیسی میں بیان کردہ شرائط اور بین الاقوامی ڈیٹا پروٹیکشن قوانین (بشمول GDPR اور CCPA) کے تحت استعمال کیا جائے گا۔'
            : 'By registering, browsing, or utilizing Poppo Live services, you acknowledge that you have carefully read, understood, and consented to the data collection and processing methods described herein.'}
        </p>
      </section>

      {/* Article 2 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۲. وہ معلومات جو ہم جمع کرتے ہیں' : 'Article 2. Information We Collect'}
        </h2>
        <p>
          {isUr
            ? 'ہم صرف وہی معلومات جمع کرتے ہیں جو آپ کو بہترین، تیز رفتار اور محفوظ سوشل انٹرٹینمنٹ فراہم کرنے کے لیے ضروری ہیں:'
            : 'To facilitate seamless real-time video streaming, interactive party rooms, and secure virtual currency top-ups, we collect the following categories of information:'}
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>
            <strong>{isUr ? 'اکاؤنٹ کی معلومات: ' : 'Account Information: '}</strong>
            {isUr
              ? 'صارف نام، عرفی نام (Nickname)، فون نمبر، ای میل ایڈریس، سالگرہ، اور پروفائل تصویر۔'
              : 'User nickname, registered phone number, email address, date of birth, gender, and avatar image.'}
          </li>
          <li>
            <strong>{isUr ? 'شناختی و بائیومیٹرک تصدیق (ہوسٹس کے لیے): ' : 'Broadcaster Biometric Age Verification: '}</strong>
            {isUr
              ? 'لائیو نشریات شروع کرنے سے قبل ۱۸ سال عمر کی تصدیق کے لیے چہرے کی بائیومیٹرک اسکیننگ اور سرکاری شناختی دستاویز۔'
              : 'Facial biometric scanning and government-issued national identity documentation required strictly to enforce 18+ broadcaster compliance.'}
          </li>
          <li>
            <strong>{isUr ? 'آلہ اور نیٹ ورک کی معلومات: ' : 'Device & Network Telemetry: '}</strong>
            {isUr
              ? 'آئی پی ایڈریس، ڈیوائس ماڈل، آپریٹنگ سسٹم کا ورژن، نیٹ ورک کی رفتار، اور منفرد ڈیوائس آئی ڈی (UUID) تاکہ جعلی اکاؤنٹس کو روکا جا سکے۔'
              : 'IP address, hardware model, operating system version, carrier information, and unique device identifiers utilized for fraud prevention.'}
          </li>
          <li>
            <strong>{isUr ? 'ٹرانزیکشن اور کوائنز کا ریکارڈ: ' : 'Transaction & Virtual Items Record: '}</strong>
            {isUr
              ? 'کوائن ریچارج کی تاریخ، گفٹ ٹرانسفر لاگز، اور حاصل شدہ پوائنٹس کا حسابی ریکارڈ۔ ہم آپ کے کریڈٹ کارڈ کا خفیہ نمبر محفوظ نہیں کرتے۔'
              : 'Coin top-up history, virtual gift consumption logs, and wallet point balances. We never store raw credit card numbers or banking passwords.'}
          </li>
        </ul>
      </section>

      {/* Article 3 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۳. معلومات کے استعمال کے مقاصد' : 'Article 3. How We Use Collected Data'}
        </h2>
        <p>
          {isUr
            ? 'جمع کردہ ڈیٹا درج ذیل قانونی اور آپریشنل مقاصد کے لیے استعمال ہوتا ہے:'
            : 'We use your personal data strictly for transparent operational and security purposes:'}
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>{isUr ? 'لائیو سٹریمنگ، پارٹی وائس رومز اور پی کے میچز کی فراہمی۔' : 'Operating, optimizing, and delivering ultra-low latency live broadcasts and party rooms.'}</li>
          <li>{isUr ? '۱۸ سال عمر کی جانچ اور چائلڈ پروٹیکشن کے سخت ضوابط کا نفاذ۔' : 'Enforcing the mandatory 18+ age verification gate and preventing underage platform access.'}</li>
          <li>{isUr ? 'کوائنز ریچارج اور انعامات کی شفاف ترسیل۔' : 'Processing coin recharge payments and ensuring fraud-free balance settlements.'}</li>
          <li>{isUr ? 'ناپسندیدہ، غیر اخلاقی یا کاپی رائٹ کی خلاف ورزی کرنے والے مواد کی خودکار فلٹریشن۔' : 'AI-powered content moderation to detect prohibited violence, vulgarity, or harassment.'}</li>
        </ul>
      </section>

      {/* Article 4 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۴. معلومات کا اشتراک اور تھرڈ پارٹی پالیسی' : 'Article 4. Information Sharing & Third Parties'}
        </h2>
        <p>
          {isUr
            ? 'پوپو لائیو آپ کا ذاتی ڈیٹا کسی تیسرے فریق کو اشتہارات یا تجارتی مقاصد کے لیے فروخت نہیں کرتا۔ معلومات کا محدود تبادلہ صرف درج ذیل حالات میں ممکن ہے:'
            : 'Poppo Live will never sell, monetize, or trade your personal identifying data to third-party advertisers. Information is only shared under strictly controlled circumstances:'}
        </p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>{isUr ? 'باضابطہ پیمنٹ گیٹ ویز (Google Play, Apple Pay, باضابطہ بینکس) برائے ریچارج۔' : 'Authorized financial payment processors for secure settlement.'}</li>
          <li>{isUr ? 'کلاؤڈ سٹریمنگ انفراسٹرکچر فراہم کنندگان تاکہ ویڈیو بغیر تعطل کے چل سکے۔' : 'Global Content Delivery Networks (CDNs) and cloud RTC servers.'}</li>
          <li>{isUr ? 'قانونی عدالت یا قانون نافذ کرنے والے اداروں کے باضابطہ احکامات کے تحت۔' : 'Compliance with mandatory court subpoenas and statutory law enforcement directives.'}</li>
        </ul>
      </section>

      {/* Article 5 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۵. نابالغوں کا تحفظ اور ۱۸ سال کی حد' : 'Article 5. Minor Protection & Strict 18+ Age Limit'}
        </h2>
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
          <p className="font-bold">
            {isUr ? 'پوپو لائیو صرف بالغ افراد (۱۸ سال یا زائد) کے لیے مختص ہے۔' : 'Strict 18+ Age Restriction Policy:'}
          </p>
          <p className="text-xs sm:text-sm">
            {isUr
              ? 'ہم ۱۸ سال سے کم عمر افراد کا ڈیٹا جان بوجھ کر جمع نہیں کرتے۔ اگر کسی بھی مرحلے پر معلوم ہو کہ کوئی صارف یا ہوسٹ نابالغ ہے تو اس کا اکاؤنٹ اور والٹ فوری طور پر مستقل بلاک کر دیا جاتا ہے۔'
              : 'We do not knowingly collect personal data from or permit platform usage by individuals under the age of 18. Any account discovered to belong to a minor is subjected to immediate permanent termination and device hardware ban.'}
          </p>
        </div>
      </section>

      {/* Article 6 */}
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۶. صارفین کے حقوق اور ڈیٹا کو حذف کرنا' : 'Article 6. Your Rights & Account Deletion'}
        </h2>
        <p>
          {isUr
            ? 'آپ کو اپنے ڈیٹا تک رسائی، اس میں ترمیم اور اکاؤنٹ مستقل طور پر حذف کرنے کا مکمل قانونی حق حاصل ہے۔ آپ ایپ کی سیٹنگز میں جا کر "Delete Account" پر کلک کر سکتے ہیں۔'
            : 'You possess the right to access, export, rectify, or permanently delete your personal account data at any time through the in-app settings under "Account Security > Delete Account".'}
        </p>
      </section>
    </PoppoPolicyLayout>
  );
}
