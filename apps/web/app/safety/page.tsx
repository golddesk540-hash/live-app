'use client';

import React from 'react';
import { PolicyLayout, PolicySection } from '@/components/policies/PolicyLayout';

export default function SafetyPage() {
  const sections: PolicySection[] = [
    {
      id: 'commitment',
      titleEn: 'User Safety Commitment',
      titleUr: 'صارفین کی حفاظت کے لیے ہمارا عزم',
      contentEn: (
        <>
          <p>
            At Popo Live, user safety is not an afterthought—it is the bedrock of our platform design. We maintain rigorous technological safeguards, real-time AI live monitoring, and strict age verification to foster a secure, wholesome digital environment.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو پر ہر صارف کی حفاظت اولین ترجیح ہے۔ ہم جدید ٹیکنالوجی، مصنوعی ذہانت (AI) کی نگرانی اور سخت عمر کی شرائط کے ذریعے ایک محفوظ اور مثبت ماحول فراہم کرتے ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'age-gate',
      titleEn: 'Strict Minimum Age: 18+ & Child Protection',
      titleUr: '۱۸+ سخت عمر کی حد اور بچوں کا تحفظ',
      contentEn: (
        <>
          <p>
            <strong>Strict 18+ Barrier:</strong> Popo Live is engineered strictly for adults aged 18 and older. We enforce zero tolerance regarding child sexual abuse material (CSAM), grooming, or minor participation.
          </p>
          <p>
            Any broadcaster allowing minors on camera, or any user attempting to solicit minors, is immediately banned, permanently blacklisted at the hardware level, and reported to relevant national law enforcement agencies.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            <strong>صرف ۱۸ سال اور زائد:</strong> پوپو لائیو صرف بالغ افراد کے لیے ہے۔ نابالغوں کے استحصال پر صفر رواداری کی پالیسی ہے۔ کسی بھی خلاف ورزی پر فوری قانونی کارروائی اور مستقل بین عائد کیا جائے گا۔
          </p>
        </>
      ),
    },
    {
      id: 'safe-streaming',
      titleEn: 'Safe Live Streaming & Broadcaster Screening',
      titleUr: 'محفوظ لائیو اسٹریمنگ اور اسکریننگ',
      contentEn: (
        <>
          <p>
            To prevent spam broadcasts and maintain viewer safety:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Wealth Gate:</strong> Broadcasters must reach Wealth Level 5 before unlocking solo video broadcasting permissions.</li>
            <li><strong>Facial Verification:</strong> Automated liveness and facial KYC checks ensure streamers are genuine, adult identity holders.</li>
            <li><strong>Stream Watermark:</strong> Compliance watermarks and user ID timestamps are rendered on-screen to prevent unauthorized stream mirroring.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            لائیو اسٹریمنگ کی حفاظت کے لیے لیول ۵ کی شرط، چہرے کی تصدیق اور واٹر مارک کا نظام لاگو ہے تاکہ جعلی اکاؤنٹس اور نامناسب مواد کا راستہ روکا جا سکے۔
          </p>
        </>
      ),
    },
    {
      id: 'controls',
      titleEn: 'Personal Safety Controls: Block, Mute & Report',
      titleUr: 'ذاتی حفاظتی کنٹرولز: بلاک، میوٹ اور رپورٹ',
      contentEn: (
        <>
          <p>Every user is equipped with real-time defensive controls:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Block:</strong> Instantly sever all communication. Blocked users cannot view your streams, enter your party seats, or send messages.</li>
            <li><strong>Mute:</strong> Broadcasters and room owners can mute disruptive speakers for the duration of a session or permanently in their room.</li>
            <li><strong>Report:</strong> Rapid reporting with categorized complaint triggers, routing directly to human safety moderators.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہر صارف کے پاس کسی بھی پریشان کن شخص کو &apos;بلاک&apos; کرنے، پارٹی روم میں &apos;میوٹ&apos; کرنے اور ماڈریٹرز کو &apos;رپورٹ&apos; کرنے کی مکمل سہولت موجود ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'moderation',
      titleEn: '24/7 Live Moderation & Real-Time Kill-Switch',
      titleUr: '۲۴/۷ لائیو مانیٹرنگ اور فوری کِل سوئچ',
      contentEn: (
        <>
          <p>
            Popo Live runs a dual-layer moderation architecture:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>AI Automated Detection:</strong> Optical recognition analyzes broadcast frames for nudity, weapons, and violent imagery every few seconds.</li>
            <li><strong>Human Safety Operations:</strong> A global 24/7 team reviews flagged alerts and possesses an instantaneous stream kill-switch to shut down non-compliant rooms immediately.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہمارا جدید AI سسٹم ہر چند سیکنڈ میں لائیو اسکرینز کا تجزیہ کرتا ہے جبکہ ۲۴ گھنٹے موجود انسانی ماڈریٹرز کسی بھی نازیبا اسٹریم کو فوری طور پر بند کر سکتے ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'account-security',
      titleEn: 'Account Security & PIN Protection',
      titleUr: 'اکاؤنٹ سیکیورٹی اور پن کوڈ کا تحفظ',
      contentEn: (
        <>
          <p>
            Protect your coin balances and identity by enabling our in-app Security PIN. PIN verification is required before making coin gift transfers or modifying linked payout credentials.
          </p>
          <p>
            Never share your one-time passwords (OTP) or login tokens with anyone, including individuals claiming to be Popo Live staff.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            اپنے والٹ کو محفوظ رکھنے کے لیے سیکیورٹی پن لازمی آن کریں۔ اپنا او ٹی پی (OTP) کوڈ کبھی کسی کے ساتھ شیئر نہ کریں، چاہے وہ خود کو پاپو لائیو کا عملہ ہی کیوں نہ کہے۔
          </p>
        </>
      ),
    },
    {
      id: 'safety-support',
      titleEn: 'Emergency Safety Desk & Law Enforcement',
      titleUr: 'ہنگامی سیفٹی ڈیسک اور رابطہ',
      contentEn: (
        <>
          <p>
            If you witness immediate danger, child safety threats, or illegal acts, contact our priority safety desk immediately:
            <br />
            <strong className="text-white">Emergency Safety Email:</strong> safety@popolive.placeholder.app
            <br />
            <strong className="text-white">Response Commitment:</strong> Priority triage within 15 minutes.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            کسی بھی ہنگامی سیفٹی خطرے یا غیر قانونی عمل کی فوری اطلاع کے لیے رابطہ کریں:
            <br />
            <strong className="text-white">ای میل:</strong> safety@popolive.placeholder.app
          </p>
        </>
      ),
    },
  ];

  return (
    <PolicyLayout
      titleEn="Safety Policy (18+)"
      titleUr="سیفٹی اور پروٹیکشن پالیسی"
      descEn="Our Safety Policy outlines proactive child safety operations, real-time live monitoring, 18+ age verification, personal defensive controls, and account protection."
      descUr="یہ پالیسی پوپو لائیو پر صارفین کے تحفظ، ۱۸ سال کی عمر کے نفاذ، ۲۴/۷ لائیو مانیٹرنگ اور سیکیورٹی کنٹرولز کی وضاحت کرتی ہے۔"
      sections={sections}
    />
  );
}
