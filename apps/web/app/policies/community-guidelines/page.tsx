'use client';

import React from 'react';
import { PolicyLayout, PolicySection } from '@/components/policies/PolicyLayout';

export default function CommunityGuidelinesPage() {
  const sections: PolicySection[] = [
    {
      id: 'respect-other-users',
      titleEn: '1. Respect Other Users & Welcome Culture',
      titleUr: '۱. باہمی احترام اور خوشگوار ماحول',
      contentEn: (
        <>
          <p>
            Popo Live is built on the foundation of interactive entertainment, friendship, and positive cultural exchange. We expect all broadcasters, party lounge participants, and viewers to treat each other with dignity and mutual courtesy.
          </p>
          <p>
            Celebrate diversity and support creative talent. Degrading comments regarding ethnicity, nationality, religion, disability, or personal background are strictly prohibited across live chats, party rooms, and private messages.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو مثبت تفریح، دوستی اور باہمی تعاون کا پلیٹ فارم ہے۔ ہم توقع کرتے ہیں کہ تمام براڈکاسٹرز، پارٹی روم ممبرز اور دیکھنے والے ایک دوسرے کا احترام کریں گے۔
          </p>
          <p>
            ثقافتی اور لسانی تنوع کا احترام کریں۔ قومیت، مذہب، رنگ، نسل یا معذوری کی بنیاد پر توہین آمیز گفتگو سختی سے منع ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'no-harassment',
      titleEn: '2. No Harassment or Intimidation',
      titleUr: '۲. ہراسانی اور بدزبانی کی سخت ممانعت',
      contentEn: (
        <>
          <p>
            We enforce a zero-tolerance policy against all forms of harassment, sexual advances without consent, stalker behavior, and persistent unwanted private messaging.
          </p>
          <p>
            Broadcasters must not be subjected to hostile comments or coordinated raiding. Users engaging in targeted harassment will face immediate chat muting and account freezing.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم کسی بھی قسم کی ہراسانی، غیر اخلاقی پیش رفت یا مسلسل پریشان کرنے کے خلاف صفر برداشت کی پالیسی رکھتے ہیں۔
          </p>
          <p>
            براڈکاسٹرز یا صارفین کو ہراساں کرنا ممنوع ہے۔ ایسی حرکت کرنے والوں کے اکاؤنٹس فوری طور پر معطل کر دیے جائیں گے۔
          </p>
        </>
      ),
    },
    {
      id: 'no-bullying',
      titleEn: '3. No Bullying & Defamation',
      titleUr: '۳. بلینگ اور کردار کشی کی ممانعت',
      contentEn: (
        <>
          <p>
            Bullying, public shaming, blackmail, or coordinated defamation against any creator or member is strictly banned.
          </p>
          <p>
            Broadcasting personal private communications, non-consensual images, or distributing slanderous rumors is grounds for immediate permanent expulsion and hardware ban.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            کسی بھی صارف یا کری ایٹر کی تضحیک کرنا، کردار کشی کرنا، بلیک میل کرنا یا جھوٹے الزامات لگانا سخت منع ہے۔
          </p>
          <p>
            ذاتی پیغامات یا نجی تصاویر کو لائیو روم میں دکھانا فوری مستقل پابندی کا سبب بنے گا۔
          </p>
        </>
      ),
    },
    {
      id: 'no-threats',
      titleEn: '4. No Threats or Violent Extremism',
      titleUr: '۴. دھمکیاں اور پرتشدد انتہا پسندی ممنوع',
      contentEn: (
        <>
          <p>
            Any threat of physical violence, self-harm encouragement, display of weapons, or promotion of terrorism is prohibited without exception.
          </p>
          <p>
            Our safety infrastructure operates instantaneous emergency room termination when credible threats of violence are identified, and incidents are escalated to relevant law enforcement agencies.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            جسمانی نقصان پہنچانے کی دھمکی، خودکشی پر اکسانا، اسلحہ کی نمائش یا دہشت گردی کی حمایت مکمل طور پر ممنوع ہے۔
          </p>
          <p>
            سنگین دھمکیوں کی صورت میں لائیو اسٹریم کو فوری بند کر دیا جاتا ہے اور متعلقہ سیکیورٹی اداروں کو مطلع کیا جاتا ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'no-illegal-content',
      titleEn: '5. No Illegal Content & Regulated Goods',
      titleUr: '۵. غیر قانونی مواد اور منشیات کی ممانعت',
      contentEn: (
        <>
          <p>
            Popo Live must not be used to display, promote, sell, or facilitate illegal acts, narcotics, prescription drug abuse, firearms, stolen property, or human trafficking.
          </p>
          <p>
            Live streaming while consuming illegal drugs or operating a moving vehicle dangerously is strictly forbidden.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو پر منشیات، اسلحہ، چوری شدہ اشیاء یا کسی بھی غیر قانونی سرگرمی کی نمائش یا فروخت سخت منع ہے۔
          </p>
          <p>
            منشیات کے استعمال کے دوران لائیو آنا یا گاڑی چلاتے ہوئے خطرناک انداز میں اسٹریمنگ کرنا ممنوع ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'no-impersonation',
      titleEn: '6. No Impersonation or False Identity',
      titleUr: '۶. جعلی شناخت اور دھوکہ دہی کی ممانعت',
      contentEn: (
        <>
          <p>
            Do not impersonate Popo Live staff, moderators, public figures, celebrities, or other platform streamers.
          </p>
          <p>
            Using official logos, badges, or deceptive avatars to mislead users into believing you possess administrative authority will result in permanent ban and loss of all account privileges.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو کے عملے، ایڈمنز، مشہور شخصیات یا دوسرے اسٹریمرز کی نقل اتار کر جعلی شناخت بنانا ممنوع ہے۔
          </p>
          <p>
            آفیشل بیجز یا لوگوز کا غلط استعمال کر کے صارفین کو دھوکہ دینے والے اکاؤنٹس کو فوراً بند کر دیا جائے گا۔
          </p>
        </>
      ),
    },
    {
      id: 'no-spam',
      titleEn: '7. No Spam, Solicitation, or Bots',
      titleUr: '۷. اسپام، خودکار بوٹس اور اشتہارات ممنوع',
      contentEn: (
        <>
          <p>
            Do not flood live chat rooms or party lounges with repetitive text, automated copy-pasting, external website links, or unauthorized advertising.
          </p>
          <p>
            The use of emulator scripts, viewer-boosting bots, or automated comment spammers is detected and blocked by our real-time rate limiters.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            لائیو رومز یا چیٹ میں بار بار ایک ہی پیغام دہرانا، بیرونی لنکس شیئر کرنا یا غیر مجاز اشتہارات لگانا ممنوع ہے۔
          </p>
          <p>
            خودکار بوٹس، جعلی ویورز بڑھانے والے سسٹمز اور اسپام پیغامات کو ہمارا سیکیورٹی سسٹم خودکار طور پر بلاک کر دیتا ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'no-fraud',
      titleEn: '8. No Financial Fraud or Scams',
      titleUr: '۸. مالیاتی دھوکہ دہی اور فراڈ کی ممانعت',
      contentEn: (
        <>
          <p>
            Scams requesting user passwords, unauthorized coin top-up schemes, fake agency recruitment fees, and money transfers are strictly forbidden.
          </p>
          <p>
            Official coin purchases must solely be conducted through authorized in-app channels. Never share your security PIN or verification codes with anyone, including individuals claiming to be platform agents.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پاس ورڈ مانگنا، غیر مجاز سستے کوائنز کے دھوکے، جعلی ایجنسی فیس یا مالیاتی اسکینڈلز سخت ممنوع ہیں۔
          </p>
          <p>
            کوائنز کی خریداری صرف آفیشل ایپ اسٹور چینلز سے کریں۔ اپنا سیکیورٹی پن یا کوڈ کسی کے ساتھ شیئر نہ کریں۔
          </p>
        </>
      ),
    },
    {
      id: 'respect-intellectual-property',
      titleEn: '9. Respect Intellectual Property & Copyright',
      titleUr: '۹. کاپی رائٹ اور انٹلیکچوئل پراپرٹی کا احترام',
      contentEn: (
        <>
          <p>
            Broadcasters must respect copyrighted media. Streaming full-length copyrighted television shows, movies, live sporting events, or licensed concerts without explicit rights is prohibited.
          </p>
          <p>
            We process valid DMCA and copyright takedown notices promptly. Repeat copyright infringers will have their broadcasting capabilities permanently revoked.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            کاپی رائٹ شدہ مواد جیسے مکمل فلمیں، ٹی وی شوز، لائیو اسپورٹس میچز یا میوزک کنسرٹس بغیر اجازت لائیو دکھانا منع ہے۔
          </p>
          <p>
            کاپی رائٹ کی بار بار خلاف ورزی کرنے والے چینلز کی براڈکاسٹنگ ہمیشہ کے لیے بند کر دی جائے گی۔
          </p>
        </>
      ),
    },
    {
      id: 'follow-age-restrictions',
      titleEn: '10. Follow Age Restrictions (Strict 18+ Enforcement)',
      titleUr: '۱۰. عمر کی سخت پابندی (۱۸ سال اور زائد)',
      contentEn: (
        <>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs mb-3">
            ABSOLUTE ZERO TOLERANCE: Popo Live is an 18+ platform only.
          </div>
          <p>
            Minors are not permitted on camera, in party room seats, or as registered account holders. Hosts must never allow children or minors to appear in their broadcasts, even with parental presence.
          </p>
          <p>
            Broadcasters who feature minors on stream will face immediate live stream cutoff and permanent account closure under our Child Protection Directive.
          </p>
        </>
      ),
      contentUr: (
        <>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs mb-3">
            مکمل پابندی (۱۸ سال سے زائد): پوپو لائیو صرف بالغ افراد کے لیے ہے۔
          </div>
          <p>
            کسی بھی نابالغ کو کیمرے کے سامنے لانا یا پارٹی روم میں شامل کرنا سختی سے منع ہے، خواہ والدین ساتھ ہوں۔
          </p>
          <p>
            اسٹریم پر بچوں کو دکھانے کی صورت میں براڈکاسٹ کو فوری بند کر کے اکاؤنٹ مستقل طور پر بلاک کر دیا جائے گا۔
          </p>
        </>
      ),
    },
    {
      id: 'reporting-and-blocking',
      titleEn: '11. Reporting Violations & User Blocking Tools',
      titleUr: '۱۱. خلاف ورزیوں کی رپورٹنگ اور بلاک کرنے کے ٹولز',
      contentEn: (
        <>
          <p>
            Every user is equipped with real-time safety and self-moderation controls:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Report Stream or User:</strong> Tap the <em>Report</em> flag on any live room or user profile, select the violation category (Nudity, Harassment, Underage, Scam), and add details. Reports are evaluated 24/7 by human moderators.</li>
            <li><strong>Block User:</strong> Instantly block any user to hide your broadcasts, prevent private messaging, and remove them from your personal feeds.</li>
            <li><strong>Host Kick / Mute:</strong> Broadcasters and party room hosts can instantly mute disruptive guests or kick them out of the live lounge.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہر صارف کے پاس حفاظت کے لیے فوری ٹولز موجود ہیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>رپورٹ کریں:</strong> کسی بھی لائیو روم یا پروفائل پر <em>رپورٹ</em> کے نشان پر کلک کریں اور وجہ منتخب کریں۔ ہماری ماڈریشن ٹیم ۲۴/۷ کارروائی کرتی ہے۔</li>
            <li><strong>بلاک کریں:</strong> ناپسندیدہ صارف کو فوری بلاک کریں تاکہ وہ آپ کے لائیو سیشن یا پیغامات تک نہ پہنچ سکے۔</li>
            <li><strong>میوٹ یا کِک کریں:</strong> ہوسٹ کسی بھی بدتمیز مہمان کو فوری میوٹ یا روم سے باہر نکال سکتا ہے۔</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <PolicyLayout
      titleEn="Community Guidelines"
      titleUr="کمیونٹی گائیڈ لائنز"
      descEn="Platform standards enforcing respect, safety, anti-harassment, anti-bullying, zero child exploitation, and fair-play conduct."
      descUr="پلیٹ فارم کے اصول جو باہمی احترام، انسداد ہراسانی، چائلڈ سیفٹی اور منصفانہ اسٹریمنگ کو یقینی بناتے ہیں۔"
      lastUpdated="Draft — November 2026"
      sections={sections}
    />
  );
}
