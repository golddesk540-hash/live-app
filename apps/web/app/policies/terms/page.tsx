'use client';

import React from 'react';
import { PolicyLayout, PolicySection } from '@/components/policies/PolicyLayout';

export default function TermsOfServicePage() {
  const sections: PolicySection[] = [
    {
      id: 'acceptance-of-terms',
      titleEn: '1. Acceptance of Terms',
      titleUr: '۱. شرائط کی قبولیت',
      contentEn: (
        <>
          <p>
            Welcome to Popo Live. By downloading, accessing, browsing, or using the Popo Live mobile applications (Android and iOS), website, and associated streaming services, you enter into a legally binding agreement governed by these Terms of Service.
          </p>
          <p>
            If you do not agree with any provision set forth herein, you must immediately cease accessing the platform and uninstall all related applications.
          </p>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <strong>DRAFT FOR LEGAL REVIEW:</strong> These terms are presented as a working platform operational draft subject to client approval and jurisdiction-specific legal review.
          </div>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو میں خوش آمدید۔ پوپو لائیو کی موبائل ایپس (اینڈرائڈ اور آئی او ایس)، ویب سائٹ یا لائیو اسٹریمنگ سروسز کا استعمال کر کے آپ ان شرائط و ضوابط کی مکمل پابندی کا اقرار کرتے ہیں۔
          </p>
          <p>
            اگر آپ ان شرائط میں سے کسی بھی شق سے متفق نہیں ہیں تو فوری طور پر سروسز کا استعمال ترک کر دیں اور تمام ایپلی کیشنز ان انسٹال کر دیں۔
          </p>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <strong>قانونی جائزہ کے لیے ڈرافٹ:</strong> یہ شرائط پلیٹ فارم کے آپریشنل فریم ورک کے طور پر پیش کی گئی ہیں اور قانونی مشاورت کے بعد حتمی ہوں گی۔
          </div>
        </>
      ),
    },
    {
      id: 'eligibility',
      titleEn: '2. Eligibility & Strict 18+ Age Requirement',
      titleUr: '۲. اہلیت اور ۱۸ سال کی سخت شرط',
      contentEn: (
        <>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs mb-3">
            STRICT 18+ REQUIREMENT: You must be at least 18 years of age to access Popo Live.
          </div>
          <p>
            Popo Live is exclusively built for adults aged eighteen (18) years or older. By registering an account, watching live streams, joining party audio rooms, or making purchases, you expressly warrant that you are at least 18 years old and legally competent.
          </p>
          <p>
            Minors (individuals under the age of 18) are strictly prohibited from using Popo Live. Any accounts identified as belonging to or operated by minors will be permanently terminated without notice, and any associated virtual coin balances will be forfeited.
          </p>
        </>
      ),
      contentUr: (
        <>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs mb-3">
            سخت پابندی (۱۸ سال سے زائد): پوپو لائیو استعمال کرنے کے لیے آپ کی عمر کم از کم ۱۸ سال ہونا لازمی ہے۔
          </div>
          <p>
            پوپو لائیو صرف بالغ افراد کے لیے بنایا گیا ہے۔ اکاؤنٹ بنا کر، لائیو براڈکاسٹ دیکھ کر یا ورچوئل کوائنز حاصل کر کے آپ اس بات کی تصدیق کرتے ہیں کہ آپ ۱۸ سال یا زائد عمر کے ہیں۔
          </p>
          <p>
            ۱۸ سال سے کم عمر افراد کا پلیٹ فارم استعمال کرنا سخت منع ہے۔ نابالغ پائے جانے والے اکاؤنٹس کو بغیر کسی پیشگی اطلاع کے مستقل طور پر بند کر دیا جائے گا۔
          </p>
        </>
      ),
    },
    {
      id: 'account-registration',
      titleEn: '3. Account Registration & Unique User ID',
      titleUr: '۳. اکاؤنٹ رجسٹریشن اور منفرد یوزر آئی ڈی',
      contentEn: (
        <>
          <p>
            To participate in interactive features, users must create an account using authorized third-party authentication (Google, Apple, Facebook), verified phone numbers, or email.
          </p>
          <p>
            Each account is automatically provisioned a unique, immutable numerical Popo Live User ID. You agree to provide accurate, current, and complete registration information. Creating multiple duplicate accounts to circumvent moderation or abuse platform promotions is strictly prohibited.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پلیٹ فارم کے انٹرایکٹو فیچرز استعمال کرنے کے لیے صارفین کو مجاز سوشل لاگ ان، موبائل نمبر یا ای میل کے ذریعے رجسٹر ہونا ضروری ہے۔
          </p>
          <p>
            ہر صارف کو ایک مستقل عددی یوزر آئی ڈی تفویض کی جاتی ہے۔ آپ درست اور حقیقی معلومات فراہم کرنے کے پابند ہیں۔ سیکیورٹی سزاؤں سے بچنے کے لیے جعلی یا ڈپلیکیٹ اکاؤنٹس بنانا ممنوع ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'user-responsibilities',
      titleEn: '4. User Responsibilities & Security',
      titleUr: '۴. صارف کی ذمہ داریاں اور سیکیورٹی',
      contentEn: (
        <>
          <p>
            You are exclusively responsible for safeguarding your login credentials, password, and security PIN. All actions taken through your account are deemed your sole responsibility.
          </p>
          <p>
            Sharing, selling, renting, or transferring your account credentials to third parties is strictly forbidden. If you suspect unauthorized access or security breaches, notify our safety desk immediately.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            اپنے لاگ ان پاس ورڈ اور سیکیورٹی پن کی حفاظت آپ کی ذاتی ذمہ داری ہے۔ آپ کے اکاؤنٹ سے انجام دی جانے والی تمام سرگرمیوں کے آپ خود ذمہ دار ہوں گے۔
          </p>
          <p>
            اپنا اکاؤنٹ فروخت کرنا، کرائے پر دینا یا کسی دوسرے شخص کو استعمال کے لیے فراہم کرنا سخت منع ہے۔ غیر مجاز رسائی کے شبہ میں فوری اطلاع دیں۔
          </p>
        </>
      ),
    },
    {
      id: 'live-streaming-rules',
      titleEn: '5. Live Streaming Rules & Host Eligibility',
      titleUr: '۵. لائیو اسٹریمنگ کے قواعد اور اہلیت',
      contentEn: (
        <>
          <p>
            Broadcasting live on Popo Live requires compliance with platform creator standards:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Broadcaster Wealth Gate:</strong> Streamers must achieve Wealth Level 5 and complete facial identity verification before broadcasting solo video rooms.</li>
            <li><strong>Professional Conduct:</strong> Broadcasters must maintain appropriate attire, respectful communication, and safe surroundings at all times.</li>
            <li><strong>No Static or Unattended Streams:</strong> Streaming pre-recorded videos, static images, or leaving broadcasts unattended is strictly prohibited.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو پر لائیو براڈکاسٹنگ کے لیے مقررہ معیارات کی پابندی لازمی ہے:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>براڈکاسٹر اہلیت:</strong> سولو ویڈیو اسٹریمنگ کے لیے ویلتھ لیول ۵ اور چہرے کی تصدیق لازمی ہے۔</li>
            <li><strong>مناسب رویہ:</strong> شائستہ لباس، مہذب گفتگو اور محفوظ ماحول کو ہر وقت برقرار رکھیں۔</li>
            <li><strong>غیر حاضر اسٹریمنگ ممنوع:</strong> پہلے سے ریکارڈ شدہ ویڈیوز چلانا یا کیمرے کو خالی چھوڑ دینا ممنوع ہے۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'party-room-rules',
      titleEn: '6. Party Room Rules (9-Seat Lounges)',
      titleUr: '۶. پارٹی رومز کے قواعد (۹ سیٹ لاؤنجز)',
      contentEn: (
        <>
          <p>
            Popo Live provides standardized 9-seat interactive party lounges (1 Host + 8 Guest Seats):
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Host Authority:</strong> The room host possesses moderation authority to manage audio seats, mute disruptive participants, or remove rule violators.</li>
            <li><strong>Seat Etiquette:</strong> Participants on audio seats must avoid mic spam, background noise, aggressive shouting, or offensive background music.</li>
            <li><strong>Zero Hate Speech:</strong> Group audio conversations must strictly respect community safety guidelines.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو کے ۹ سیٹ پارٹی رومز (۱ ہوسٹ + ۸ مہمان سیٹیں) کے لیے اصول:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>ہوسٹ کا اختیار:</strong> ہوسٹ کو سیٹیں کنٹرول کرنے، بدتمیزی کرنے والے کو میوٹ کرنے یا روم سے نکالنے کا مکمل اختیار ہے۔</li>
            <li><strong>گفتگو کے آداب:</strong> مائیک پر ضرورت سے زیادہ شور، چیخ و پکار یا غیر مناسب الفاظ سے گریز کریں۔</li>
            <li><strong>نفرت انگیز گفتگو ممنوع:</strong> تمام گروپ گفتگو میں اخلاقی اور حفاظتی حدود کا احترام لازمی ہے۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'virtual-gifts-and-coins',
      titleEn: '7. Virtual Gifts, Coins & 70% Host Conversion',
      titleUr: '۷. ورچوئل کوائنز، تحائف اور ۷۰٪ ہوسٹ شیئر',
      contentEn: (
        <>
          <p>
            Popo Live operates a dual-currency virtual entertainment economy:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Virtual Coins:</strong> Users may acquire virtual coins solely for in-app social gifting and virtual interactions. Coins represent a limited, non-exclusive, non-transferable revocable license and hold no monetary value outside Popo Live.</li>
            <li><strong>70% Host Revenue Share:</strong> Exactly seventy percent (70%) of virtual gift coin values convert directly into host points, which qualifying verified broadcasters may redeem according to creator business rules.</li>
            <li><strong>Strict Anti-Gambling Policy:</strong> Lucky gifts or mechanics returning coins to the sender are strictly locked-off and forbidden. Virtual coins may never be bet or wagered.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو کا ورچوئل گفٹنگ نظام شفاف اور منصفانہ بنیادوں پر کام کرتا ہے:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>ورچوئل کوائنز:</strong> کوائنز صرف ایپ کے اندر تحائف بھیجنے کے لیے استعمال ہوتے ہیں۔ ان کی ایپ سے باہر کوئی مالی حیثیت نہیں ہے۔</li>
            <li><strong>۷۰٪ ہوسٹ ریونیو شیئر:</strong> گفٹ کوائنز کی ۷۰٪ مالیت براہ راست ہوسٹ کے پوائنٹس میں جمع ہوتی ہے جسے اہل ہوسٹس کیش آؤٹ کر سکتے ہیں۔</li>
            <li><strong>جوئے پر سخت پابندی:</strong> کوائنز کی واپسی یا جوا کھلانے والے کسی بھی فیچر پر سختی سے پابندی ہے۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'user-content',
      titleEn: '8. User Content & Intellectual Property License',
      titleUr: '۸. صارف کا مواد اور انٹلیکچوئل پراپرٹی لائسنس',
      contentEn: (
        <>
          <p>
            You retain ownership of photos, bios, and live broadcast expressions you generate on Popo Live. However, by broadcasting or posting on our platform, you grant Popo Live a worldwide, non-exclusive, royalty-free license to transmit, reproduce, and display such content solely to operate and promote platform services.
          </p>
          <p>
            You warrant that your content does not infringe upon third-party trademarks, copyrights, or publicity rights.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            آپ اپنی تصاویر اور لائیو براڈکاسٹ کے مالک رہتے ہیں۔ تاہم پلیٹ فارم پر مواد شیئر کر کے آپ پوپو لائیو کو سروسز چلانے اور دکھانے کے لیے غیر خصوصی اور رائلٹی فری لائسنس دیتے ہیں۔
          </p>
          <p>
            آپ اس بات کی ضمانت دیتے ہیں کہ آپ کا مواد کسی دوسرے کی کاپی رائٹ یا ٹریڈ مارک کی خلاف ورزی نہیں کرتا۔
          </p>
        </>
      ),
    },
    {
      id: 'prohibited-activities',
      titleEn: '9. Prohibited Activities',
      titleUr: '۹. سختی سے ممنوعہ سرگرمیاں',
      contentEn: (
        <>
          <p>
            The following activities result in immediate enforcement and permanent bans:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Nudity, sexually suggestive broadcasting, or explicit sexual services.</li>
            <li>Child sexual abuse material (CSAM) or any exploitation of minors (zero tolerance).</li>
            <li>Hate speech, ethnic discrimination, violence, terrorism promotion, or harassment.</li>
            <li>Financial scams, fraudulent coin transfers, money laundering, or chargeback abuse.</li>
            <li>Reverse-engineering, automated bot scripts, or scraping platform video streams.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            درج ذیل سرگرمیوں پر فوری قانونی کارروائی اور مستقل پابندی عائد کی جائے گی:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li>عریانی، غیر اخلاقی لباس یا نامناسب حرکات کا مظاہرہ۔</li>
            <li>نابالغوں کا استحصال یا چائلڈ سیفٹی کی خلاف ورزی (صفر برداشت)۔</li>
            <li>نفرت انگیز تقریر، دہشت گردی کی حمایت، دھمکیاں یا تشدد پر اکسانا۔</li>
            <li>دھوکہ دہی، منی لانڈرنگ یا جعلی ادائیگیوں کا استعمال۔</li>
            <li>ایپ کے ڈیٹا کو ہیک کرنا، ریورس انجینئرنگ یا بوٹس چلانا۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'account-suspension',
      titleEn: '10. Account Suspension & Content Removal',
      titleUr: '۱۰. اکاؤنٹ معطلی اور مواد ہٹانا',
      contentEn: (
        <>
          <p>
            Popo Live reserves the right to immediately mute, remove content, or temporarily suspend accounts violating platform rules, community guidelines, or receiving validated safety reports.
          </p>
          <p>
            During temporary suspension, access to live broadcasting, party room hosting, and virtual item transfers may be restricted. Users may submit an appeal via our in-app Help and Feedback center.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو کو قواعد کی خلاف ورزی کرنے والے مواد کو فوری ہٹانے یا اکاؤنٹ کو عارضی معطل کرنے کا مکمل اختیار حاصل ہے۔
          </p>
          <p>
            معطلی کے دوران اسٹریمنگ اور کوائنز کے استعمال پر پابندی ہو سکتی ہے۔ صارف ایپ میں موجود ہیلپ سینٹر کے ذریعے اپیل دائر کر سکتا ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'account-termination',
      titleEn: '11. Permanent Account Termination',
      titleUr: '۱۱. مستقل اکاؤنٹ کی بندش',
      contentEn: (
        <>
          <p>
            Repeated, severe, or malicious violations of these Terms will result in permanent account termination and hardware device banning.
          </p>
          <p>
            Upon permanent termination for cause, all remaining virtual coin balances, earned points, and VIP privileges are forfeited without refund or liability.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            قواعد کی سنگین خلاف ورزیوں کی صورت میں اکاؤنٹ کو مستقل طور پر بند اور متعلقہ ڈیوائس کو ہمیشہ کے لیے بلاک کر دیا جائے گا۔
          </p>
          <p>
            مستقل پابندی کی صورت میں موجود تمام ورچوئل کوائنز اور پوائنٹس ضبط ہو جائیں گے جن کا کوئی ریفنڈ نہیں ملے گا۔
          </p>
        </>
      ),
    },
    {
      id: 'service-availability',
      titleEn: '12. Service Availability & Maintenance',
      titleUr: '۱۲. سروس کی دستیابی اور دیکھ بھال',
      contentEn: (
        <>
          <p>
            We strive to maintain high service availability; however, Popo Live is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis.
          </p>
          <p>
            We do not warrant that video streaming will be uninterrupted, error-free, or entirely free of latency. Scheduled maintenance or emergency security upgrades may temporarily affect service access.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم بہترین سروس فراہم کرنے کی کوشش کرتے ہیں، تاہم سروسز &ldquo;جیسا کہ دستیاب ہیں&rdquo; کی بنیاد پر فراہم کی جاتی ہیں۔
          </p>
          <p>
            ہم بلا تعطل اسٹریمنگ یا زیرو لَیگ کی کوئی قانونی ضمانت نہیں دیتے۔ ضروری دیکھ بھال کے دوران سروسز میں عارضی تعطل آ سکتا ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'intellectual-property',
      titleEn: '13. Intellectual Property Rights',
      titleUr: '۱۳. کاپی رائٹ اور انٹلیکچوئل پراپرٹی',
      contentEn: (
        <>
          <p>
            All platform logos, visual branding, graphics, user interface designs, sound effects, software code, and virtual item designs are the exclusive property of Popo Live or its licensors.
          </p>
          <p>
            You may not copy, modify, distribute, reproduce, or create derivative works from platform assets without prior written consent.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو کے تمام لوگوز، برانڈنگ، گرافکس، یوزر انٹرفیس، اینیمیشنز اور سافٹ ویئر کوڈ کمپنی کی خصوصی ملکیت ہیں۔
          </p>
          <p>
            ہماری تحریری اجازت کے بغیر کسی بھی برانڈ اثاثے، لوگو یا اینیمیشن کو نقل یا استعمال کرنا منع ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'limitation-of-liability',
      titleEn: '14. Limitation of Liability',
      titleUr: '۱۴. ذمہ داری کی حدود',
      contentEn: (
        <>
          <p>
            To the maximum extent permitted by applicable law, Popo Live and its officers, directors, and employees shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from your access to or inability to use the platform.
          </p>
          <p>
            Popo Live is not responsible for content broadcasted by third-party streamers or conduct between viewers in live chat rooms.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            قانون کے تحت قابلِ قبول حد تک پوپو لائیو یا اس کی انتظامیہ کسی بھی بالواسطہ، غیر متوقع یا تلافی کے نقصانات کی ذمہ دار نہیں ہو گی۔
          </p>
          <p>
            تیسرے فریق کے ہوسٹس کے لائیو مواد یا صارفین کی آپسی گفتگو کی ذمہ داری خود ان پر عائد ہوتی ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'changes-to-terms',
      titleEn: '15. Changes to Terms',
      titleUr: '۱۵. شرائط میں تبدیلیاں',
      contentEn: (
        <>
          <p>
            We may amend these Terms of Service from time to time. When modifications occur, we will publish the updated Terms on this page and revise the &ldquo;Last Updated&rdquo; status.
          </p>
          <p>
            Your continued use of Popo Live following the publication of revised terms constitutes your binding acceptance of such revisions.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم وقتاً فوقتاً ان شرائط و ضوابط میں ترمیم کر سکتے ہیں۔ تبدیلی کی صورت میں نیا مسودہ اس صفحے پر پوسٹ کر دیا جائے گا۔
          </p>
          <p>
            تبدیلیوں کے بعد پلیٹ فارم کا استعمال جاری رکھنا نئی شرائط کی قبولیت تصور ہوگا۔
          </p>
        </>
      ),
    },
    {
      id: 'contact-information',
      titleEn: '16. Contact Information',
      titleUr: '۱۶. رابطے کی معلومات',
      contentEn: (
        <>
          <p>
            For questions, legal notices, or compliance matters concerning these Terms of Service, contact our legal operations department:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Legal Notices:</strong> <code>legal@popolive.com</code></li>
            <li><strong>Support Desk:</strong> <code>support@popolive.com</code></li>
            <li><strong>Online Contact Form:</strong> <a href="/contact" className="text-popo-pink hover:underline">popolive.com/contact</a></li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            ان شرائط سے متعلق قانونی استفسارات یا رہنمائی کے لیے ہمارے لیگل ڈیپارٹمنٹ سے رابطہ کریں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>قانونی خط و کتابت:</strong> <code>legal@popolive.com</code></li>
            <li><strong>سپورٹ ڈیسک:</strong> <code>support@popolive.com</code></li>
            <li><strong>آن لائن پورٹل:</strong> <a href="/contact" className="text-popo-pink hover:underline">popolive.com/contact</a></li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <PolicyLayout
      titleEn="Terms of Service"
      titleUr="استعمال کی شرائط"
      descEn="The binding platform agreement outlining user eligibility (Strict 18+), live streaming rules, 9-seat party rooms, and virtual gift economy."
      descUr="لازمی پلیٹ فارم معاہدہ جس میں صارف کی اہلیت (۱۸ سال کی پابندی)، لائیو اسٹریمنگ اور ورچوئل کوائنز کے قواعد شامل ہیں۔"
      lastUpdated="Draft — November 2026"
      sections={sections}
    />
  );
}
