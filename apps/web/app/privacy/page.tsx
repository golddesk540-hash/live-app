'use client';

import React from 'react';
import { PolicyLayout, PolicySection } from '@/components/policies/PolicyLayout';

export default function PrivacyPage() {
  const sections: PolicySection[] = [
    {
      id: 'introduction',
      titleEn: 'Introduction & Scope',
      titleUr: 'تعارف اور دائرہ کار',
      contentEn: (
        <>
          <p>
            Popo Live values your personal privacy. This Privacy Policy outlines how we collect, store, utilize, protect, and process personal information when you use our mobile applications (Android and iOS), website, and associated streaming services.
          </p>
          <p>
            By interacting with Popo Live, you acknowledge the data collection and processing practices described herein.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو آپ کی رازداری کا مکمل احترام کرتا ہے۔ یہ پرائیویسی پالیسی وضاحت کرتی ہے کہ جب آپ ہماری موبائل ایپلی کیشنز یا ویب سائٹ استعمال کرتے ہیں تو ہم آپ کی معلومات کس طرح جمع اور محفوظ کرتے ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'info-we-collect',
      titleEn: 'Information We Collect',
      titleUr: 'معلومات جو ہم جمع کرتے ہیں',
      contentEn: (
        <>
          <p>
            We collect information necessary to deliver high-concurrency live streaming, prevent abusive behavior, and ensure secure virtual coin and points accounting:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Account Information:</strong> Verified phone numbers, email addresses, unique User IDs, and authentication tokens via Google, Apple, or Facebook.</li>
            <li><strong>Profile Information:</strong> Public nicknames, profile avatar photos, country selection, gender, birthday (for strict 18+ age verification), and personal bio.</li>
            <li><strong>Broadcaster KYC Data:</strong> Facial verification capture and official government ID data required exclusively from streamers reaching Level 5 to unlock broadcasting and earnings cashouts.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم محفوظ سروسز فراہم کرنے کے لیے ضروری معلومات جمع کرتے ہیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>اکاؤنٹ معلومات:</strong> تصدیق شدہ فون نمبر، ای میل، یوزر آئی ڈی اور لاگ ان ٹوکنز۔</li>
            <li><strong>پروفائل تفصیلات:</strong> عوامی عرفیت (نک نیم)، اوتار تصویر، ملک، تاریخِ پیدائش (۱۸ سال کی تصدیق کے لیے)۔</li>
            <li><strong>ہوسٹ تصدیقی ڈیٹا:</strong> کیش آؤٹ اور اسٹریمنگ کے لیے چہرے کی تصدیق کا ڈیٹا۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'technical-info',
      titleEn: 'Device, Technical & Usage Information',
      titleUr: 'تکنیکی معلومات اور آلات کا ڈیٹا',
      contentEn: (
        <>
          <p>
            When you use Popo Live, our servers automatically record telemetry for security, anti-cheat, and Agora streaming bitrate optimization:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Technical Identifiers:</strong> Device model, operating system version, hardware identifiers (for ban enforcement), IP address, and network latency.</li>
            <li><strong>Usage Logs:</strong> Streaming watch durations, party room participation, gift sending history, followings, and in-room chat logs.</li>
            <li><strong>Location Privacy:</strong> Popo Live strictly keeps granular GPS / Near-me location tracking DISABLED by default to protect user privacy.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            بہترین سروس اور سیکیورٹی کے لیے خودکار لاگز جمع کیے جاتے ہیں: ڈیوائس ماڈل، او ایس ورژن، آئی پی ایڈریس اور اسٹریمنگ کے دورانیے کا ڈیٹا۔
          </p>
          <p>
            <strong>لوکیشن پرائیویسی:</strong> صارفین کی رازداری کے تحفظ کے لیے پوپو لائیو پر قریبی لوکیشن (GPS) کا فیچر بنیادی طور پر بند (OFF) ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'how-we-use',
      titleEn: 'How We Use Your Information',
      titleUr: 'معلومات کا استعمال کس طرح کیا جاتا ہے',
      contentEn: (
        <>
          <p>We process collected data to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Provide real-time low-latency video and voice streams via our Agora infrastructure.</li>
            <li>Maintain an accurate and tamper-proof financial ledger for virtual coins and 70% host earnings points.</li>
            <li>Enforce strict 18+ age verification, child safety protocols, and automated profanity filters.</li>
            <li>Facilitate customer service ticket responses and account recovery workflows.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم آپ کی معلومات کو بغیر تاخیر لائیو اسٹریمنگ کی فراہمی، ورچوئل سکے اور پوائنٹس کے درست حساب، ۱۸ سال کی عمر کے تحفظ اور شکایات کے ازالے کے لیے استعمال کرتے ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'sharing',
      titleEn: 'Information Sharing & Third-Party Processors',
      titleUr: 'معلومات کا تبادلہ اور تھرڈ پارٹی پارٹنرز',
      contentEn: (
        <>
          <p>
            Popo Live does not sell, rent, or trade your personal information. We share minimal necessary information only with vetted infrastructure partners:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Agora RTC/RTM:</strong> For real-time encrypted audio and video channel publishing.</li>
            <li><strong>Cloud Storage (S3-compatible):</strong> Encrypted storage for profile images and user media uploads.</li>
            <li><strong>Payment & App Store Gateways:</strong> Google Play and Apple In-App Purchase processors for coin recharges.</li>
            <li><strong>Legal & Law Enforcement:</strong> Strictly when compelled by valid court orders or emergency child safety protocols.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو آپ کا ڈیٹا کبھی فروخت نہیں کرتا۔ تکنیکی ضرورت کے تحت صرف معتبر پارٹنرز (جیسے اگورا لائیو انجن، انکرپٹڈ کلاؤڈ اسٹوریج اور ایپ اسٹورز) کے ساتھ ضروری ڈیٹا شیئر کیا جاتا ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'data-security',
      titleEn: 'Data Security & Storage Standards',
      titleUr: 'ڈیٹا کا تحفظ اور اسٹوریج کے معیارات',
      contentEn: (
        <>
          <p>
            We deploy multi-layered safeguards including TLS/SSL encryption for data in transit, AES-256 encryption for sensitive data at rest, role-based database access, and dedicated DDoS mitigation.
          </p>
          <p>
            Our unified backend architecture ensures that account safety records and blacklists are enforced globally across all endpoints simultaneously.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم جدید ترین انکرپشن اور محفوظ ڈیٹا بیس ٹیکنالوجی کے ذریعے آپ کی معلومات کو غیر مجاز رسائی سے محفوظ رکھتے ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'data-retention',
      titleEn: 'Data Retention & Lifecycle',
      titleUr: 'ڈیٹا برقرار رکھنے کی مدت',
      contentEn: (
        <>
          <p>
            We retain account data for as long as your account remains active. Financial transaction ledgers and coin audit receipts are retained as required by financial reporting regulations.
          </p>
          <p>
            Temporary live chat messages and stream telemetry are purged on rolling schedules once streams terminate.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            آپ کا اکاؤنٹ فعال رہنے تک ڈیٹا محفوظ رہتا ہے۔ مالیاتی ٹرانزیکشنز کا آڈٹ ریکارڈ قانونی ضوابط کے تحت رکھا جاتا ہے جبکہ عارضی چیٹ لاگز خودکار طور پر صاف ہو جاتے ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'privacy-rights',
      titleEn: 'User Privacy Rights & Account Deletion',
      titleUr: 'صارفین کے حقوق اور اکاؤنٹ ڈیلیشن',
      contentEn: (
        <>
          <p>
            Regardless of your geographic location, Popo Live affords you clear privacy rights:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Access & Correction:</strong> Edit your nickname, avatar, bio, and settings directly via the in-app Me center.</li>
            <li><strong>Account Deletion:</strong> Submit an account closure request directly in the settings panel. All personal profile identifiers are permanently erased within 30 days.</li>
            <li><strong>Do Not Track:</strong> We do not track users across external third-party websites.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            آپ کو اپنی معلومات تک رسائی، ترمیم اور اکاؤنٹ مستقل طور پر ڈیلیٹ کرنے کا مکمل حق حاصل ہے۔ اکاؤنٹ بند کرنے پر ذاتی ڈیٹا ۳۰ دنوں کے اندر مکمل طور پر صاف کر دیا جاتا ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'children-privacy',
      titleEn: 'Children’s Privacy (Strict Prohibition)',
      titleUr: 'بچوں کی پرائیویسی کا تحفظ (سخت ممانعت)',
      contentEn: (
        <>
          <p>
            Popo Live is strictly designed for adults (18+). We do not knowingly solicit or collect personal information from individuals under eighteen years of age.
          </p>
          <p>
            If we discover that a user under 18 has registered an account, we immediately terminate the account, purge their stored personal data, and permanently block the associated hardware device.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو صرف ۱۸ سال یا زائد عمر کے لیے ہے۔ ۱۸ سال سے کم عمر افراد کا ڈیٹا کبھی جمع نہیں کیا جاتا۔ نابالغ اکاؤنٹ سامنے آنے پر فوری ڈیلیٹ کر کے ڈیوائس بین کر دی جاتی ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'privacy-contact',
      titleEn: 'Privacy Officer Contact Information',
      titleUr: 'پرائیویسی آفیسر سے رابطہ',
      contentEn: (
        <>
          <p>
            For privacy inquiries, data access requests, or regulatory questions:
            <br />
            <strong className="text-white">Email:</strong> privacy@popolive.placeholder.app
            <br />
            <strong className="text-white">Attention:</strong> Data Protection & Compliance Officer
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پرائیویسی کے مسائل اور ڈیٹا حقوق کے لیے ہمارے آفیسر سے رابطہ کریں:
            <br />
            <strong className="text-white">ای میل:</strong> privacy@popolive.placeholder.app
          </p>
        </>
      ),
    },
  ];

  return (
    <PolicyLayout
      titleEn="Privacy Policy"
      titleUr="پرائیویسی پالیسی"
      descEn="This Privacy Policy describes how Popo Live collects, uses, protects, and discloses personal information across our live streaming apps, party rooms, and websites."
      descUr="یہ پرائیویسی پالیسی وضاحت کرتی ہے کہ پوپو لائیو آپ کی ذاتی معلومات کس طرح جمع، محفوظ اور استعمال کرتا ہے۔"
      sections={sections}
    />
  );
}
