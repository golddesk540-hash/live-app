'use client';

import React from 'react';
import { PolicyLayout, PolicySection } from '@/components/policies/PolicyLayout';

export default function CookiesPage() {
  const sections: PolicySection[] = [
    {
      id: 'what-are-cookies',
      titleEn: 'What Are Cookies & Local Storage?',
      titleUr: 'کوکیز اور لوکل اسٹوریج کیا ہیں؟',
      contentEn: (
        <>
          <p>
            Cookies and browser local storage are small data files placed on your computer, tablet, or mobile device when you access websites and web applications. They allow websites to remember your credentials, active language preference, and interface settings across browsing sessions.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            کوکیز اور لوکل اسٹوریج چھوٹی معلوماتی فائلیں ہیں جو آپ کے براؤزر میں محفوظ ہوتی ہیں تاکہ وہ آپ کی ترجیحات، لاگ ان سیشن اور زبان کا انتخاب یاد رکھ سکیں۔
          </p>
        </>
      ),
    },
    {
      id: 'types-of-cookies',
      titleEn: 'Categories of Cookies We Use',
      titleUr: 'کوکیز کی اقسام جو ہم استعمال کرتے ہیں',
      contentEn: (
        <>
          <p>Popo Live uses strictly necessary and functional technologies:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>1. Essential & Security Cookies (Strictly Necessary):</strong>
              <br />
              Required for core platform functionality, maintaining secure login sessions, CSRF token verification, and enforcing account blacklists. These cannot be disabled.
            </li>
            <li>
              <strong>2. Functional Preference Cookies:</strong>
              <br />
              Remember your selected UI language (English vs Urdu), volume levels, and dark-theme display choices so your settings persist across page visits.
            </li>
            <li>
              <strong>3. Performance & Telemetry Cookies:</strong>
              <br />
              Monitor network latency, video stream buffer rates, and error crash dumps to diagnose server bottlenecks and optimize Agora RTC channel quality.
            </li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>ہم مندرجہ ذیل بنیادی کوکیز استعمال کرتے ہیں:</p>
          <ul className="list-disc pr-5 space-y-2 mt-2">
            <li><strong>ضروری کوکیز:</strong> سیشن برقرار رکھنے اور فراڈ سے بچاؤ کے لیے ناگزیر۔</li>
            <li><strong>فنکشنل کوکیز:</strong> آپ کی منتخب کردہ زبان (انگریزی یا اردو) اور ڈارک موڈ کو یاد رکھنے کے لیے۔</li>
            <li><strong>کارکردگی کوکیز:</strong> اسٹریمنگ کی رفتار اور آڈیو ویڈیو کے معیار کو بہتر بنانے کے لیے۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'how-we-use',
      titleEn: 'How Popo Live Uses Cookies',
      titleUr: 'پوپو لائیو کوکیز کا استعمال کیسے کرتا ہے',
      contentEn: (
        <>
          <p>We use cookies strictly to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Authenticate your User ID and prevent unauthorized session hijacking.</li>
            <li>Preserve your English or Urdu language toggles smoothly as you navigate between pages.</li>
            <li>Safeguard financial top-ups and coin ledger balance integrity.</li>
          </ul>
          <p className="mt-2 text-popo-pink font-semibold">
            Popo Live does NOT use invasive third-party cross-site advertising cookies to track your behavior across external websites.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم کوکیز کو صرف لاگ ان کے تحفظ، زبان کی یاددہانی اور محفوظ ٹرانزیکشنز کے لیے استعمال کرتے ہیں۔ پوپو لائیو آپ کو دوسری ویب سائٹس پر ٹریک کرنے والی اشتہاری کوکیز استعمال نہیں کرتا۔
          </p>
        </>
      ),
    },
    {
      id: 'managing-cookies',
      titleEn: 'Managing Cookie Preferences in Your Browser',
      titleUr: 'براؤزر میں کوکیز کا انتظام اور کنٹرول',
      contentEn: (
        <>
          <p>
            Most modern web browsers allow you to manage or block cookies through their settings:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>You can clear existing cookies and browsing cache at any time.</li>
            <li>You can configure your browser to block third-party cookies or notify you when a cookie is placed.</li>
            <li>Please note: Blocking essential cookies may disrupt login sessions and video stream authentication.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            آپ اپنے براؤزر کی سیٹنگز سے کسی بھی وقت کوکیز کو ڈیلیٹ یا بلاک کر سکتے ہیں۔ تاہم ضروری کوکیز بند کرنے سے لاگ ان سیشن متاثر ہو سکتا ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'third-party',
      titleEn: 'Third-Party Services & Integrations',
      titleUr: 'تھرڈ پارٹی سروسز اور انٹیگریشنز',
      contentEn: (
        <>
          <p>
            Certain streaming infrastructure providers (e.g. Agora SDK) may place operational session cookies strictly necessary to maintain real-time low-latency audio/video socket connections.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            اگورا (Agora) ویڈیو انجن ریئل ٹائم اسٹریمنگ کنکشن کو برقرار رکھنے کے لیے ضروری تکنیکی ٹوکنز استعمال کر سکتا ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'updates-contact',
      titleEn: 'Policy Updates & Contact Information',
      titleUr: 'پالیسی میں اپڈیٹس اور رابطہ',
      contentEn: (
        <>
          <p>
            We may revise this Cookie Policy occasionally to align with new platform features or technological changes.
          </p>
          <p>
            For questions regarding our use of cookies and local storage:
            <br />
            <strong className="text-white">Email:</strong> privacy@popolive.placeholder.app
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            کوکی پالیسی سے متعلق کسی بھی سوال کے لیے رابطہ کریں:
            <br />
            <strong className="text-white">ای میل:</strong> privacy@popolive.placeholder.app
          </p>
        </>
      ),
    },
  ];

  return (
    <PolicyLayout
      titleEn="Cookie Policy"
      titleUr="کوکی پالیسی"
      descEn="This Cookie Policy explains how Popo Live uses cookies and similar technologies to maintain your login session, remember language settings, and ensure stream stability."
      descUr="یہ کوکی پالیسی وضاحت کرتی ہے کہ پوپو لائیو آپ کے لاگ ان سیشن اور زبان کی سیٹنگز کو یاد رکھنے کے لیے کوکیز کا استعمال کیسے کرتا ہے۔"
      sections={sections}
    />
  );
}
