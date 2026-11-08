'use client';

import React from 'react';
import { PolicyLayout, PolicySection } from '@/components/policies/PolicyLayout';

export default function CookiePolicyPage() {
  const sections: PolicySection[] = [
    {
      id: 'what-cookies-are',
      titleEn: '1. What Cookies Are',
      titleUr: '۱. کوکیز کیا ہوتی ہیں',
      contentEn: (
        <>
          <p>
            Cookies are small text files placed on your browser or device when you visit websites and web applications. They allow web services to recognize your browser, remember login sessions, and store individual preferences.
          </p>
          <p>
            Popo Live utilizes minimal, secure web storage technologies (including HTTP cookies and local storage tokens) strictly necessary to enable platform functionality.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            کوکیز چھوٹی متنی فائلیں ہوتی ہیں جو ویب سائٹ ملاحظہ کرنے پر آپ کے براؤزر میں محفوظ ہوتی ہیں۔ یہ ویب سائٹ کو آپ کا سیشن اور ترجیحات یاد رکھنے میں مدد دیتی ہیں۔
          </p>
          <p>
            پوپو لائیو صرف ضروری اور محفوظ اسٹوریج ٹیکنالوجیز استعمال کرتا ہے جو ویب ایپ کے درست کام کرنے کے لیے ناگزیر ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'why-cookies-used',
      titleEn: '2. Why Cookies May Be Used',
      titleUr: '۲. کوکیز کیوں استعمال کی جاتی ہیں',
      contentEn: (
        <>
          <p>
            We use web storage technologies for essential operational requirements:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Maintaining verified user login sessions without requiring repetitive password entry.</li>
            <li>Preventing Cross-Site Request Forgery (CSRF) and securing account authentication.</li>
            <li>Remembering your selected language (English or Urdu) and layout direction (LTR or RTL).</li>
            <li>Preserving live stream volume levels and player settings.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم کوکیز کو درج ذیل بنیادی ضروریات کے لیے استعمال کرتے ہیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li>ہر صفحے پر بار بار پاس ورڈ مانگے بغیر لاگ ان برقرار رکھنا۔</li>
            <li>اکاؤنٹ کو ہیکنگ اور CSRF سیکیورٹی حملوں سے محفوظ رکھنا۔</li>
            <li>آپ کی منتخب کردہ زبان (انگریزی یا اردو) اور لے آؤٹ کو یاد رکھنا۔</li>
            <li>ویڈیو پلیئر کا والیوم اور سیٹنگز برقرار رکھنا۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'essential-cookies',
      titleEn: '3. Essential Cookies',
      titleUr: '۳. لازمی اور ضروری کوکیز',
      contentEn: (
        <>
          <p>
            Essential cookies are strictly required for the core operation of our web platform. Without these cookies, services such as account login, security validation, and stream authorization cannot be provided.
          </p>
          <p>
            These cookies do not track your browsing habits across third-party websites and cannot be deactivated without disrupting web application functionality.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            لازمی کوکیز ویب سائٹ کے کام کرنے کے لیے ناگزیر ہیں۔ ان کے بغیر لاگ ان، سیکیورٹی اور اسٹریمنگ کی تصدیق ممکن نہیں ہو سکتی۔
          </p>
          <p>
            یہ کوکیز انٹرنیٹ پر آپ کی دیگر سرگرمیوں کو ٹریک نہیں کرتیں اور انہیں بند کرنے سے ویب سائٹ صحیح طور پر کام نہیں کرے گی۔
          </p>
        </>
      ),
    },
    {
      id: 'analytics-cookies',
      titleEn: '4. Analytics Cookies (Status: Inactive in Staging)',
      titleUr: '۴. اینالیٹکس کوکیز (حالت: غیر فعال)',
      contentEn: (
        <>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-3">
            <strong>TRANSPARENCY NOTICE:</strong> Third-party advertising and analytics tracking cookies are currently NOT active on the Popo Live website.
          </div>
          <p>
            If analytics or diagnostic measurement tools are integrated in future platform releases, this policy will be formally updated, and users will be presented with a clear opt-in / cookie preference consent dialog.
          </p>
        </>
      ),
      contentUr: (
        <>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-3">
            <strong>شفافیت کی وضاحت:</strong> پوپو لائیو کی ویب سائٹ پر فی الوقت کوئی اشتہاری یا بیرونی اینالیٹکس کوکیز فعال نہیں ہیں۔
          </div>
          <p>
            اگر مستقبل میں کارکردگی کے تجزیے کے لیے اینالیٹکس ٹولز شامل کیے گئے تو اس پالیسی کو اپ ڈیٹ کر کے صارفین سے باضابطہ اجازت طلب کی جائے گی۔
          </p>
        </>
      ),
    },
    {
      id: 'user-preferences',
      titleEn: '5. User Preferences & Functional Storage',
      titleUr: '۵. صارف کی ترجیحات اور فنکشنل اسٹوریج',
      contentEn: (
        <>
          <p>
            Preference storage allows our web applications to remember choices you make, including:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Language selection preference (<code>popo_lang: en | ur</code>).</li>
            <li>Dismissed announcement banners and promo alerts.</li>
            <li>Web player muted audio state.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            فنکشنل اسٹوریج کے ذریعے ویب ایپ آپ کی ترجیحات کو محفوظ رکھتی ہے:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li>منتخب کردہ زبان کی ترجیح (اردو یا انگریزی)۔</li>
            <li>بند کیے گئے اعلانات اور الرٹس۔</li>
            <li>ویڈیو پلیئر کا میوٹ اسٹیٹس۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'cookie-controls',
      titleEn: '6. Cookie Controls & Browser Management',
      titleUr: '۶. کوکیز کا کنٹرول اور براؤزر سیٹنگز',
      contentEn: (
        <>
          <p>
            You have the right to control how cookies are stored on your device through standard browser settings:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Google Chrome:</strong> Settings &rarr; Privacy and security &rarr; Cookies and other site data.</li>
            <li><strong>Apple Safari:</strong> Preferences &rarr; Privacy &rarr; Manage Website Data.</li>
            <li><strong>Mozilla Firefox:</strong> Options &rarr; Privacy & Security &rarr; Cookies and Site Data.</li>
          </ul>
          <p className="mt-2 text-xs text-gray-400">
            Note: Disabling all cookies may prevent you from staying logged in or watching video streams through our web application.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            آپ اپنے براؤزر کی سیٹنگز کے ذریعے کوکیز کو کنٹرول یا ڈیلیٹ کر سکتے ہیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>کروم (Chrome):</strong> Settings &rarr; Privacy and security &rarr; Cookies.</li>
            <li><strong>سفاری (Safari):</strong> Preferences &rarr; Privacy &rarr; Manage Website Data.</li>
            <li><strong>فائر فاکس (Firefox):</strong> Options &rarr; Privacy & Security.</li>
          </ul>
          <p className="mt-2 text-xs text-gray-400">
            نوٹ: تمام کوکیز بند کرنے سے آپ کا لاگ ان سیشن اور اسٹریمنگ متاثر ہو سکتی ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'policy-updates',
      titleEn: '7. Policy Updates & Inquiries',
      titleUr: '۷. پالیسی اپ ڈیٹس اور رابطہ',
      contentEn: (
        <>
          <p>
            We may revise this Cookie Policy as web technologies evolve or new functional features are deployed. Updates will be published on this page with an amended revision notice.
          </p>
          <p>
            For questions regarding our web storage practices, contact <code>support@popolive.com</code>.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم نئی خصوصیات کے اضافے کے ساتھ اس پالیسی کو اپ ڈیٹ کر سکتے ہیں۔ کسی بھی تبدیلی پر نیا ورژن یہاں پوسٹ کر دیا جائے گا۔
          </p>
          <p>
            کوکیز سے متعلق کسی بھی سوال کے لیے <code>support@popolive.com</code> پر رابطہ کریں۔
          </p>
        </>
      ),
    },
  ];

  return (
    <PolicyLayout
      titleEn="Cookie Policy"
      titleUr="کوکی پالیسی"
      descEn="Clear information on essential session tokens and preference cookies used to keep the web application secure and responsive."
      descUr="ضروری سیشن ٹوکنز اور ترجیحی کوکیز کے استعمال کی وضاحت جو ویب ایپ کو محفوظ اور فعال رکھتی ہیں۔"
      lastUpdated="Draft — November 2026"
      sections={sections}
    />
  );
}
