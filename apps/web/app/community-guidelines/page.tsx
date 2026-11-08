'use client';

import React from 'react';
import { PolicyLayout, PolicySection } from '@/components/policies/PolicyLayout';

export default function CommunityGuidelinesPage() {
  const sections: PolicySection[] = [
    {
      id: 'respect',
      titleEn: 'Respectful Communication & Platform Values',
      titleUr: 'باہمی احترام اور کمیونٹی کے اقدار',
      contentEn: (
        <>
          <p>
            Popo Live is built on joyful celebration, musical talent, and friendly cross-cultural connections. Every member of our community—whether a casual viewer, a broadcaster, or an agency director—is entitled to a welcoming, respectful environment.
          </p>
          <p>
            We expect every user to communicate with courtesy. Disagreements must never escalate into personal attacks, doxxing, or malicious behavior.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو مثبت تفریح، موسیقی اور باہمی دوستی کی بنیاد پر قائم ہے۔ ہر صارف، ہوسٹ اور ایجنسی پارٹنر باہمی عزت و احترام کا حقدار ہے۔
          </p>
          <p>
            کسی بھی قسم کے ذاتی حملے، تضحیک یا نامناسب رویے کی قطعاً اجازت نہیں ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'anti-harassment',
      titleEn: 'Anti-Harassment, Bullying & Defamation',
      titleUr: 'ہراسانی اور غنڈہ گردی کے خلاف پالیسی',
      contentEn: (
        <>
          <p>We enforce zero tolerance for harassment and bullying in all formats, including:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Targeted insults, sexual harassment, or unwanted sexual advances in comments or direct messages.</li>
            <li>Doxxing (revealing private phone numbers, home addresses, or real-life identities without consent).</li>
            <li>Coordinated smear campaigns aimed at damaging another creator’s reputation or stream engagement.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>کسی کو ہراساں کرنے، بلیک میل کرنے، یا ذاتی معلومات (جیسے فون نمبر یا پتہ) بلا اجازت شیئر کرنے پر فوری پابندی عائد ہوگی۔</p>
        </>
      ),
    },
    {
      id: 'prohibited-content',
      titleEn: 'Prohibited Content & Zero-Tolerance Violations',
      titleUr: 'ممنوعہ مواد اور سخت ترین ضوابط',
      contentEn: (
        <>
          <p>The following content categories trigger immediate broadcast termination and permanent account bans:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Child Endangerment:</strong> Any imagery, conversation, or conduct involving minors (under 18) triggers immediate law-enforcement referral.</li>
            <li><strong>Sexually Explicit Content:</strong> Nudity, pornography, or sexually suggestive performances.</li>
            <li><strong>Violence & Self-Harm:</strong> Depicting physical violence, weapons brandishing, animal cruelty, or self-harm encouragement.</li>
            <li><strong>Illegal Activities & Substances:</strong> Promoting illicit narcotics, weapons sales, or criminal conduct.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>مندرجہ ذیل مواد نشر کرنے پر اسٹریم فوری بند اور اکاؤنٹ ہمیشہ کے لیے بلاک کر دیا جائے گا:</p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li>نابالغوں (۱۸ سال سے کم) کی شرکت یا بچوں کو خطرے میں ڈالنے والا مواد۔</li>
            <li>عریانی، غیر اخلاقی لباس اور جنسی نوعیت کی گفتگو۔</li>
            <li>تشدد، اسلحہ کی نمائش یا خودکشی کی ترغیب۔</li>
            <li>منشیات، غیر قانونی سامان اور جوئے کا پرچار۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'hate-speech',
      titleEn: 'Hate Speech & Discrimination',
      titleUr: 'نفرت انگیز تقریر اور امتیازی سلوک کی ممانعت',
      contentEn: (
        <>
          <p>
            Popo Live welcomes users from over 100 nations. We strictly prohibit hate speech, slurs, dehumanizing rhetoric, or attacks directed against individuals or groups based on race, ethnicity, nationality, religion, disability, gender, or sexual orientation.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            نسل، مذہب، زبان، قومیت یا صنف کی بنیاد پر نفرت انگیز الفاظ یا تفریق پر مبنی بیانات سختی سے ممنوع ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'spam-fraud',
      titleEn: 'Spam, Scams & Financial Fraud Prevention',
      titleUr: 'سپیم، دھوکہ دہی اور فراڈ کی روک تھام',
      contentEn: (
        <>
          <p>To preserve virtual economy integrity, users and broadcasters must not:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Promote external phishing links, unauthorized coin recharges, or third-party top-up scams.</li>
            <li>Promise fraudulent financial returns, lottery prizes, or guaranteed cash for follows.</li>
            <li>Spam chat feeds with repeated repetitive messages or automated bot advertising.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            غیر مجاز ذرائع سے کوائنز فروخت کرنے، نقلی لاٹری کا لالچ دینے یا چیٹ میں بار بار سپیم میسجز بھیجنے کی اجازت نہیں ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'streaming-conduct',
      titleEn: 'Broadcaster Conduct & Wealth Level 5 Gate',
      titleUr: 'ہوسٹ کا طرزِ عمل اور لیول ۵ کی شرط',
      contentEn: (
        <>
          <p>
            Broadcasters must hold active Wealth Level 5, pass facial verification, and maintain high visual presentation standards. Broadcasters must remain actively engaged with audiences—sleeping on stream, unattended looping videos, or dark screens are strictly prohibited and will be timed out.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            اسٹریمرز کے لیے لیول ۵ اور چہرے کی تصدیق لازمی ہے۔ کیمرے کے سامنے سو جانا یا بلیک اسکرین چھوڑ دینا اصولوں کی خلاف ورزی ہے اور اسٹریم بند کر دی جائے گی۔
          </p>
        </>
      ),
    },
    {
      id: 'party-rules',
      titleEn: 'Nine-Seat Party Room Etiquette',
      titleUr: '۹ سیٹوں والے پارٹی روم کے آداب',
      contentEn: (
        <>
          <p>
            In group audio and video lounges, guests must speak with courtesy and yield microphones when requested by room hosts. Audio spam, ear-splitting background noise, loud soundboard looping, and vulgar music are prohibited. Room hosts bear co-responsibility for the conduct within their room.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پارٹی روم میں مائیک پر تشریف لاتے ہوئے شائستہ زبان استعمال کریں۔ شور، بدتمیزی یا نازیبا گانوں پر ہوسٹ کو مائیک میوٹ کرنے کا مکمل حق ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'pk-fairness',
      titleEn: 'PK Battle Fairness & Anti-Collusion',
      titleUr: 'پی کے بیٹلز کی شفافیت اور ملی بھگت کی ممانعت',
      contentEn: (
        <>
          <p>
            PK Battles thrive on genuine fan enthusiasm. Creators must not engage in artificial score pumping, credit card fraud rings, or illicit collusion with opponents. Violations during official tournament matches result in point forfeitures and tournament disqualification.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پی کے بیٹلز میں شفافیت لازمی ہے۔ جعلی آئی ڈیز سے اسکور بڑھانا یا ملی بھگت کرنا دھوکہ دہی تصور ہوگا اور پوائنٹس منسوخ کر دیے جائیں گے۔
          </p>
        </>
      ),
    },
    {
      id: 'reporting',
      titleEn: 'Reporting Violations & In-App Tools',
      titleUr: 'شکایات درج کروانے کا طریقہ اور ان ایپ ٹولز',
      contentEn: (
        <>
          <p>
            Every live room and user profile includes one-tap safety tools. You can report violations directly:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Tap the profile or live screen options and select <strong>Report</strong> with appropriate category flags.</li>
            <li>Use the <strong>Block</strong> function to prevent specific users from messaging or following you.</li>
            <li>Our 24/7 human moderation operations review reported streams in real time.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            کسی بھی نازیبا حرکت پر فوری طور پر اسکرین پر موجود &apos;رپورٹ&apos; کا بٹن دبائیں۔ آپ کسی بھی صارف کو &apos;بلاک&apos; کر کے اپنے اکاؤنٹ سے دور رکھ سکتے ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'enforcement',
      titleEn: 'Enforcement Actions & Escalation Ladder',
      titleUr: 'کارروائی کے درجات اور سزائیں',
      contentEn: (
        <>
          <p>Violations result in calibrated enforcement according to severity:</p>
          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li><strong>Official Warning:</strong> In-app pop-up notification and chat restriction.</li>
            <li><strong>Live Stream Interruption:</strong> Immediate shutdown of active live broadcast.</li>
            <li><strong>Account Suspension:</strong> Temporary suspension (24 hours, 7 days, or 30 days).</li>
            <li><strong>Permanent Blacklist:</strong> Universal device hardware ban, point forfeiture, and global block.</li>
          </ol>
        </>
      ),
      contentUr: (
        <>
          <p>اصولوں کی خلاف ورزی پر درج ذیل کارروائی عمل میں لائی جاتی ہے:</p>
          <ol className="list-decimal pr-5 space-y-1 mt-2">
            <li>پہلی تنبیہ اور چیٹ پر عارضی پابندی۔</li>
            <li>لائیو اسٹریم کی فوری بندش۔</li>
            <li>اکاؤنٹ کی عارضی معطلی (۲۴ گھنٹے سے ۳۰ دن)۔</li>
            <li>مستقل بلیک لسٹ اور ڈیوائس پر مستقل پابندی۔</li>
          </ol>
        </>
      ),
    },
  ];

  return (
    <PolicyLayout
      titleEn="Community Guidelines"
      titleUr="کمیونٹی گائیڈ لائنز"
      descEn="Our Community Guidelines define standards of mutual respect, broadcaster integrity, party room decorum, and zero-tolerance safety rules for all Popo Live users."
      descUr="یہ گائیڈ لائنز پوپو لائیو پر باہمی احترام، لائیو اسٹریمنگ کے ضوابط اور سیفٹی اصولوں کی وضاحت کرتی ہیں۔"
      sections={sections}
    />
  );
}
