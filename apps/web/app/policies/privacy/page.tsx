'use client';

import React from 'react';
import { PolicyLayout, PolicySection } from '@/components/policies/PolicyLayout';

export default function PrivacyPolicyPage() {
  const sections: PolicySection[] = [
    {
      id: 'introduction',
      titleEn: '1. Introduction',
      titleUr: '۱. تعارف',
      contentEn: (
        <>
          <p>
            Welcome to the Popo Live Privacy Policy. Popo Live (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting the privacy and personal data of our users worldwide. This Privacy Policy explains how personal information is collected, processed, stored, and protected when you use our mobile applications (Android and iOS), website, and interactive streaming services.
          </p>
          <p>
            By accessing or using Popo Live, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with our practices, please discontinue using our platform.
          </p>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <strong>DRAFT FOR LEGAL REVIEW:</strong> This privacy document reflects platform architecture specifications and is subject to formal legal counsel sign-off prior to commercial release.
          </div>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو پرائیویسی پالیسی میں خوش آمدید۔ پوپو لائیو اپنے تمام صارفین کے ذاتی ڈیٹا اور رازداری کے تحفظ کے لیے مکمل طور پر پرعزم ہے۔ یہ پالیسی واضح کرتی ہے کہ جب آپ ہماری موبائل ایپس، ویب سائٹ یا لائیو اسٹریمنگ سروسز استعمال کرتے ہیں تو آپ کا ڈیٹا کیسے محفوظ اور استعمال کیا جاتا ہے۔
          </p>
          <p>
            پوپو لائیو استعمال کر کے آپ اس پرائیویسی پالیسی کو تسلیم کرتے ہیں۔ اگر آپ ان شرائط سے متفق نہیں ہیں تو برائے مہربانی پلیٹ فارم کا استعمال بند کر دیں۔
          </p>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <strong>قانونی جائزہ کے لیے ڈرافٹ:</strong> یہ دستاویز پلیٹ فارم کے انتظامی فریم ورک کی عکاسی کرتی ہے اور حتمی منظوری کے لیے قانونی مشاورت کے زیرِ جائزہ ہے۔
          </div>
        </>
      ),
    },
    {
      id: 'information-we-collect',
      titleEn: '2. Information We Collect',
      titleUr: '۲. معلومات جو ہم جمع کرتے ہیں',
      contentEn: (
        <>
          <p>
            To deliver interactive live streaming, secure party audio lounges, and accurate virtual item bookkeeping, we collect information you provide directly, data generated during platform engagement, and technical telemetry from your device.
          </p>
          <p>
            We do not collect unnecessary sensitive personal data. Data collection is strictly proportionate to providing social entertainment, fraud prevention, and community safety.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            لائیو اسٹریمنگ، پارٹی رومز اور ورچوئل کوائنز کے محفوظ انتظام کے لیے ہم وہ معلومات حاصل کرتے ہیں جو آپ فراہم کرتے ہیں یا جو ایپ کے استعمال کے دوران تیار ہوتی ہے۔
          </p>
          <p>
            ہم غیر ضروری حساس ڈیٹا حاصل نہیں کرتے۔ ڈیٹا کا حصول صرف سروس کی فراہمی، دھوکہ دہی کے تدارک اور کمیونٹی کے تحفظ کے لیے محدود ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'account-information',
      titleEn: '3. Account Information',
      titleUr: '۳. اکاؤنٹ کی معلومات',
      contentEn: (
        <>
          <p>
            When registering an account on Popo Live, you provide specific authentication credentials depending on your sign-in method:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Phone Number Verification:</strong> Mobile phone number and SMS one-time passcode (OTP).</li>
            <li><strong>Email Authentication:</strong> Valid email address and encrypted password.</li>
            <li><strong>Third-Party Social Login:</strong> Basic identity token, unique authorization ID, and public identifier from Google, Apple, or Facebook.</li>
            <li><strong>Popo Live User ID:</strong> An immutable numerical User ID assigned automatically upon account creation.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو پر اکاؤنٹ بناتے وقت آپ لاگ ان کے طریقہ کار کے مطابق درج ذیل معلومات فراہم کرتے ہیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>فون نمبر کی تصدیق:</strong> موبائل نمبر اور تصدیقی کوڈ (OTP)۔</li>
            <li><strong>ای میل اکاؤنٹ:</strong> درست ای میل اور خفیہ پاس ورڈ۔</li>
            <li><strong>سوشل لاگ ان:</strong> گوگل، ایپل یا فیس بک سے حاصل شدہ بنیادی شناختی ٹوکن۔</li>
            <li><strong>پوپو لائیو یوزر آئی ڈی:</strong> سسٹم کی جانب سے تفویض کردہ مستقل عددی شناختی نمبر۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'profile-information',
      titleEn: '4. Profile Information',
      titleUr: '۴. پروفائل کی تفصیلات',
      contentEn: (
        <>
          <p>
            Users have the option to personalize their public streaming profile by providing:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Nickname:</strong> Display name shown in live rooms, comments, and rankings.</li>
            <li><strong>Avatar and Photos:</strong> Profile picture and dynamic Square social feed photos.</li>
            <li><strong>Gender and Birthday:</strong> Used strictly for age qualification and profile personalization.</li>
            <li><strong>Country / Region:</strong> Selected during onboarding to optimize content discovery and language recommendations.</li>
            <li><strong>Personal Bio:</strong> Custom text description sharing your interests or streaming schedule.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            صارفین اپنے عوامی پروفائل کو حسبِ ضرورت ترتیب دینے کے لیے درج ذیل معلومات شامل کر سکتے ہیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>عرفیت (نک نیم):</strong> لائیو رومز اور رینکنگ میں نظر آنے والا نام۔</li>
            <li><strong>اوتار اور تصاویر:</strong> پروفائل تصویر اور سوشل فیڈ پوسٹس۔</li>
            <li><strong>جنس اور تاریخِ پیدائش:</strong> عمر کی تصدیق اور مناسب ترتیبات کے لیے۔</li>
            <li><strong>ملک یا خطہ:</strong> مواد اور زبان کے انتخاب کو بہتر بنانے کے لیے۔</li>
            <li><strong>ذاتی تعارف:</strong> اپنی دلچسپیوں یا اسٹریمنگ شیڈول کا مختصر نوٹ۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'device-technical-information',
      titleEn: '5. Device and Technical Information',
      titleUr: '۵. ڈیوائس اور تکنیکی معلومات',
      contentEn: (
        <>
          <p>
            Whenever you interact with our apps or website, our systems log standard technical telemetry:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Device Identifiers:</strong> Operating system version, hardware model, unique device identifier (IDFV/Android ID), and language setting.</li>
            <li><strong>Network & Connection:</strong> IP address, mobile carrier, network type (Wi-Fi, 4G, 5G), and approximate connection latency.</li>
            <li><strong>Performance & Crash Logs:</strong> Diagnostic telemetry, frame-rate data, and error logs used to resolve software bugs.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            ایپ یا ویب سائٹ کے استعمال کے دوران تکنیکی ڈیٹا لاگ کیا جاتا ہے:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>ڈیوائس کی معلومات:</strong> آپریٹنگ سسٹم ورژن، ماڈل اور ڈیوائس شناختی کوڈ۔</li>
            <li><strong>نیٹ ورک کنکشن:</strong> آئی پی ایڈریس، موبائل نیٹ ورک کی قسم اور اسپیڈ۔</li>
            <li><strong>تکنیکی کریش لاگز:</strong> سافٹ ویئر کی غلطیوں کو درست کرنے کے لیے تشخیصی ڈیٹا۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'how-we-use-information',
      titleEn: '6. How We Use Information',
      titleUr: '۶. معلومات کا استعمال کس طرح کیا جاتا ہے',
      contentEn: (
        <>
          <p>
            We process collected information for legitimate operational purposes, including:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Providing and maintaining high-definition video broadcasting and 9-seat party audio rooms.</li>
            <li>Processing virtual coin purchases, gift delivery animations, and 70% host earnings credit.</li>
            <li>Enforcing trust, anti-harassment rules, and immediate detection of banned accounts.</li>
            <li>Delivering push notifications regarding live stream alerts, messages, and system announcements.</li>
            <li>Investigating fraudulent transactions, suspicious login patterns, and unauthorized account access.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم جمع کردہ معلومات کو درج ذیل جائز مقاصد کے لیے استعمال کرتے ہیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li>لائیو ویڈیو اسٹریمنگ اور ۹ سیٹ پارٹی رومز کی بلا تعطل فراہمی۔</li>
            <li>ورچوئل کوائنز، تحائف کے اینیمیشنز اور ہوسٹ کے ۷۰٪ کمیشن کا شفاف انتظام۔</li>
            <li>کمیونٹی سیفٹی اور ممنوعہ سرگرمیوں کی فوری روک تھام۔</li>
            <li>لائیو الرٹس، پیغامات اور اعلانات کے لیے نوٹیفیکیشن بھیجنا۔</li>
            <li>مشکوک لاگ ان اور دھوکہ دہی کے خلاف تحقیقات کرنا۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'information-sharing',
      titleEn: '7. Information Sharing',
      titleUr: '۷. معلومات کا اشتراک',
      contentEn: (
        <>
          <p>
            <strong>We do not sell personal data.</strong> Information is only shared under limited, secure circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Core Infrastructure Providers:</strong> Video/audio delivery networks (Agora RTC), media storage servers, and notification infrastructure under strict confidentiality agreements.</li>
            <li><strong>Payment Gateways:</strong> Official app store billing channels (Google Play Billing, Apple In-App Purchase) to record digital coin transactions.</li>
            <li><strong>Legal & Law Enforcement:</strong> Only when strictly mandated by valid legal court orders, warrants, or applicable law enforcement directives.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            <strong>ہم ذاتی ڈیٹا فروخت نہیں کرتے۔</strong> معلومات کا اشتراک صرف مخصوص اور محفوظ حالات میں ہوتا ہے:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>بنیادی انفراسٹرکچر فراہم کنندگان:</strong> ویڈیو اور آڈیو کلاؤڈ پرووائیڈرز (Agora) اور ڈیٹا اسٹوریج پارٹنرز۔</li>
            <li><strong>پیمنٹ گیٹ ویز:</strong> گوگل پلے اور ایپل ایپ اسٹور کے مجاز بلنگ چینلز۔</li>
            <li><strong>قانونی تقاضے:</strong> صرف اس وقت جب مجاز عدالت یا قانونی اداروں کے احکامات کے تحت لازمی ہو۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'data-storage-and-security',
      titleEn: '8. Data Storage and Security',
      titleUr: '۸. ڈیٹا اسٹوریج اور سیکیورٹی',
      contentEn: (
        <>
          <p>
            We implement industry-standard organizational and technical security measures to protect personal information:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Encryption in Transit:</strong> All communications between client applications and our API utilize TLS 1.3 / HTTPS encryption.</li>
            <li><strong>Encryption at Rest:</strong> Database records, authentication tokens, and user credentials are encrypted using modern cryptographic standards.</li>
            <li><strong>Access Controls:</strong> Strict Role-Based Access Control (RBAC) ensures only authorized operations personnel access production systems.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم صارفین کے ڈیٹا کے تحفظ کے لیے اعلیٰ ترین سیکیورٹی اقدامات نافذ کرتے ہیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>ٹرانزٹ انکرپشن:</strong> ایپ اور سرور کے درمیان تمام تر مواصلات TLS 1.3 / HTTPS سے محفوظ ہوتی ہیں۔</li>
            <li><strong>ڈیٹا انکرپشن:</strong> ڈیٹا بیس میں محفوظ کردہ معلومات اور پاس ورڈز مکمل انکرپٹڈ ہوتے ہیں۔</li>
            <li><strong>محدود رسائی:</strong> صرف مجاز تکنیکی عملہ ہی ضروری سسٹم تک محدود رسائی رکھتا ہے۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'data-retention',
      titleEn: '9. Data Retention',
      titleUr: '۹. ڈیٹا برقرار رکھنے کی مدت',
      contentEn: (
        <>
          <p>
            We retain personal information only for as long as your account remains active or as necessary to fulfill the operational purposes described in this policy.
          </p>
          <p>
            Financial ledger entries, coin transactions, and withdrawal records are retained in compliance with statutory financial accounting requirements. Upon valid account termination, identifiable profile data is deleted or permanently anonymized.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم آپ کا ڈیٹا صرف اس وقت تک برقرار رکھتے ہیں جب تک آپ کا اکاؤنٹ فعال رہتا ہے یا سروسز کی فراہمی کے لیے ضروری ہو۔
          </p>
          <p>
            مالیاتی ریکارڈز اور کوائنز کے لین دین کا ڈیٹا مالیاتی قوانین کے تحت مقررہ مدت کے لیے محفوظ رکھا جاتا ہے۔ اکاؤنٹ کے خاتمے پر ذاتی تفصیلات حذف یا گمنام کر دی جاتی ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'user-privacy-rights',
      titleEn: '10. User Privacy Rights',
      titleUr: '۱۰. صارف کے پرائیویسی حقوق',
      contentEn: (
        <>
          <p>
            Depending on your jurisdiction, you possess specific legal rights regarding your personal information:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Right to Access:</strong> Request a copy of the personal information Popo Live maintains about you.</li>
            <li><strong>Right to Rectification:</strong> Edit or correct inaccurate nickname, avatar, or profile data via in-app settings.</li>
            <li><strong>Right to Restriction:</strong> Request restriction of data processing in certain operational circumstances.</li>
            <li><strong>Right to Withdraw Consent:</strong> Revoke granted permissions such as microphone and camera access at any time via device settings.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            آپ کے قانونی دائرہ اختیار کے مطابق آپ کو درج ذیل حقوق حاصل ہیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>رسائی کا حق:</strong> اپنے محفوظ کردہ ذاتی ڈیٹا کی کاپی طلب کرنے کا حق۔</li>
            <li><strong>درستگی کا حق:</strong> اپنے پروفائل، نک نیم یا تصویر میں کسی بھی وقت ترمیم کرنے کا حق۔</li>
            <li><strong>اجازت کی واپسی:</strong> ڈیوائس کی سیٹنگز سے مائیکروفون یا کیمرہ کی اجازت واپس لینے کا اختیار۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'account-deletion',
      titleEn: '11. Account Deletion',
      titleUr: '۱۱. اکاؤنٹ حذف کرنے کا طریقہ کار',
      contentEn: (
        <>
          <p>
            Users maintain full autonomy over their accounts and may initiate self-service account deletion at any time:
          </p>
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>Navigate to the mobile app <strong>Me</strong> personal center &rarr; <strong>Settings</strong> &rarr; <strong>Account Security</strong>.</li>
            <li>Select <strong>Delete Account</strong> and verify with your registered PIN or SMS code.</li>
            <li>Upon confirmation, your public profile, followers, and social posts are immediately hidden and permanently deleted following a standard 7-day security cooling period.</li>
          </ol>
        </>
      ),
      contentUr: (
        <>
          <p>
            صارفین اپنے اکاؤنٹ کو کسی بھی وقت مکمل طور پر حذف کر سکتے ہیں:
          </p>
          <ol className="list-decimal pr-5 space-y-1 mt-2">
            <li>ایپ کے اندر <strong>Me</strong> (میری پروفائل) &rarr; <strong>Settings</strong> &rarr; <strong>Account Security</strong> پر جائیں۔</li>
            <li><strong>Delete Account</strong> کا انتخاب کریں اور اپنے پن یا ایس ایم ایس کوڈ سے تصدیق کریں۔</li>
            <li>تصدیق کے بعد آپ کا عوامی پروفائل فوری طور پر ہٹا دیا جائے گا اور ۷ دن کی سیکیورٹی مدت کے بعد مکمل ڈیلیٹ ہو جائے گا۔</li>
          </ol>
        </>
      ),
    },
    {
      id: 'childrens-privacy',
      titleEn: '12. Children\'s Privacy (Strict 18+ Platform)',
      titleUr: '۱۲. بچوں کی پرائیویسی (صرف ۱۸ سال اور زائد)',
      contentEn: (
        <>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs mb-3">
            STRICT 18+ REQUIREMENT: Popo Live is exclusively built for adults aged 18 and older.
          </div>
          <p>
            Minors under the age of 18 are strictly prohibited from registering an account, watching live broadcasts, participating in party rooms, or engaging in coin transactions.
          </p>
          <p>
            We do not knowingly collect personal data from anyone under 18. If we discover that a user is underage, their account will be permanently banned and all associated data purged from active databases immediately. If you suspect an underage user on the platform, contact our safety desk immediately at <code>safety@popolive.com</code>.
          </p>
        </>
      ),
      contentUr: (
        <>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs mb-3">
            سخت پابندی (۱۸ سال سے زائد): پوپو لائیو کا استعمال صرف ۱۸ سال یا زائد عمر کے افراد کے لیے مخصوص ہے۔
          </div>
          <p>
            ۱۸ سال سے کم عمر افراد کے لیے اکاؤنٹ بنانا، لائیو اسٹریمنگ دیکھنا، پارٹی رومز میں شامل ہونا یا کوائنز کا لین دین کرنا سخت ممنوع ہے۔
          </p>
          <p>
            ہم جان بوجھ کر نابالغوں کا ڈیٹا حاصل نہیں کرتے۔ اگر کوئی نابالغ صارف پایا گیا تو اس کا اکاؤنٹ فوری طور پر بلاک کر دیا جائے گا۔ اگر آپ کو کسی ایسے اکاؤنٹ کا علم ہو تو فوری طور پر <code>safety@popolive.com</code> پر اطلاع دیں۔
          </p>
        </>
      ),
    },
    {
      id: 'international-data-transfers',
      titleEn: '13. International Data Transfers',
      titleUr: '۱۳. بین الاقوامی ڈیٹا کی منتقلی',
      contentEn: (
        <>
          <p>
            Popo Live operates an international social streaming network. Your information may be processed and stored on cloud servers located outside your country of residence, including cloud regions in the Middle East, Europe, and Asia.
          </p>
          <p>
            When data is transferred across international borders, we ensure adequate security safeguards, encryption protocols, and standard contractual clauses are upheld to protect your privacy rights.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو ایک عالمی لائیو اسٹریمنگ نیٹ ورک ہے۔ سروسز کی فراہمی کے لیے آپ کا ڈیٹا آپ کے ملک سے باہر واقع محفوظ کلاؤڈ سرورز پر منتقل اور پراسیس کیا جا سکتا ہے۔
          </p>
          <p>
            بین الاقوامی منتقلی کے دوران ہم اس بات کو یقینی بناتے ہیں کہ ڈیٹا سیکیورٹی اور انکرپشن کے عالمی معیارات کی مکمل پاسداری کی جائے۔
          </p>
        </>
      ),
    },
    {
      id: 'policy-changes',
      titleEn: '14. Policy Changes',
      titleUr: '۱۴. پرائیویسی پالیسی میں تبدیلیاں',
      contentEn: (
        <>
          <p>
            We may periodically update this Privacy Policy to reflect platform enhancements, operational modifications, or updated legal regulations.
          </p>
          <p>
            When significant updates occur, we will notify users through in-app notices, banner announcements, or by posting the revised version with an updated revision date. Continued usage of Popo Live following notice of changes constitutes acceptance of the updated policy.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پلیٹ فارم کی بہتری اور قانونی تقاضوں کے مطابق ہم وقتاً فوقتاً اس پرائیویسی پالیسی میں ترامیم کر سکتے ہیں۔
          </p>
          <p>
            کسی بھی بڑی تبدیلی کی صورت میں ہم ایپ کے نوٹیفیکیشنز یا بینرز کے ذریعے صارفین کو آگاہ کریں گے۔ تبدیلیوں کے بعد ایپ کا مسلسل استعمال نئی شرائط کی قبولیت تصور ہوگا۔
          </p>
        </>
      ),
    },
    {
      id: 'contact-information',
      titleEn: '15. Contact Information',
      titleUr: '۱۵. رابطے کی معلومات',
      contentEn: (
        <>
          <p>
            If you have questions, feedback, or requests regarding this Privacy Policy or your personal information, contact our Data Protection and Compliance team:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Privacy Inquiries:</strong> <code>privacy@popolive.com</code></li>
            <li><strong>General Support:</strong> <code>support@popolive.com</code></li>
            <li><strong>Online Support Portal:</strong> <a href="/contact" className="text-popo-pink hover:underline">popolive.com/contact</a></li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            اگر آپ کے پاس اس پرائیویسی پالیسی یا اپنے ڈیٹا سے متعلق کوئی سوالات ہیں تو ہماری کمپلائنس ٹیم سے رابطہ کریں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>پرائیویسی سپورٹ:</strong> <code>privacy@popolive.com</code></li>
            <li><strong>عمومی سپورٹ:</strong> <code>support@popolive.com</code></li>
            <li><strong>آن لائن پورٹل:</strong> <a href="/contact" className="text-popo-pink hover:underline">popolive.com/contact</a></li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <PolicyLayout
      titleEn="Privacy Policy"
      titleUr="پرائیویسی پالیسی"
      descEn="Learn how Popo Live collects, uses, and safeguards your account credentials, profile details, and telemetry while streaming."
      descUr="جانیں کہ پوپو لائیو کس طرح آپ کے اکاؤنٹ، پروفائل کی معلومات اور اسٹریمنگ ڈیٹا کو محفوظ اور استعمال کرتا ہے۔"
      lastUpdated="Draft — November 2026"
      sections={sections}
    />
  );
}
