'use client';

import React from 'react';
import { PolicyLayout, PolicySection } from '@/components/policies/PolicyLayout';

export default function TermsPage() {
  const sections: PolicySection[] = [
    {
      id: 'acceptance',
      titleEn: 'Acceptance of Terms',
      titleUr: 'شرائط کی قبولیت',
      contentEn: (
        <>
          <p>
            Welcome to Popo Live. By downloading, accessing, browsing, or using the Popo Live mobile applications (Android and iOS), website, or associated live broadcasting services, you enter into a binding agreement governed by these Terms of Service.
          </p>
          <p>
            If you do not agree with any provision set forth herein, you must immediately cease accessing the platform and uninstall all related applications.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو میں خوش آمدید۔ پوپو لائیو کی موبائل ایپلی کیشنز (اینڈرائڈ اور آئی او ایس)، ویب سائٹ یا لائیو اسٹریمنگ سروسز کا استعمال کر کے آپ ان شرائط و ضوابط کی مکمل پابندی کا اقرار کرتے ہیں۔
          </p>
          <p>
            اگر آپ ان شرائط میں سے کسی بھی شق سے متفق نہیں ہیں، تو آپ کو فوری طور پر سروسز کا استعمال بند کر دینا چاہیے۔
          </p>
        </>
      ),
    },
    {
      id: 'eligibility',
      titleEn: 'Eligibility Requirements & Minimum Age (Strict 18+)',
      titleUr: 'اہلیت کے تقاضے اور کم از کم عمر (۱۸ سال)',
      contentEn: (
        <>
          <p>
            <strong>Strict 18+ Platform:</strong> Popo Live is strictly intended for individuals who are at least eighteen (18) years of age. By creating an account or viewing broadcasts, you explicitly warrant that you are at least 18 years old and legally competent.
          </p>
          <p>
            Minors (individuals under the age of 18) are strictly prohibited from creating accounts, broadcasting video/voice, sending or receiving gifts, or entering party lounges. Any accounts identified as belonging to minors will be permanently terminated without notice.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            <strong>صرف ۱۸ سال اور زائد عمر کے لیے:</strong> پوپو لائیو کا استعمال صرف ان افراد کے لیے ہے جن کی عمر کم از کم ۱۸ سال ہو۔ اکاؤنٹ بنا کر آپ اس بات کی تصدیق کرتے ہیں کہ آپ قانونی طور پر ۱۸ سال کے ہیں۔
          </p>
          <p>
            ۱۸ سال سے کم عمر افراد کے لیے اکاؤنٹ بنانا، لائیو اسٹریمنگ کرنا یا ورچوئل تحائف کا لین دین کرنا سختی سے منع ہے۔ نابالغ پائے جانے والے اکاؤنٹس کو فوری طور پر مستقل بلاک کر دیا جائے گا۔
          </p>
        </>
      ),
    },
    {
      id: 'user-accounts',
      titleEn: 'User Accounts & Security',
      titleUr: 'صارف کے اکاؤنٹس اور سیکیورٹی',
      contentEn: (
        <>
          <p>
            To unlock platform engagement, you may register using verified social sign-in (Google, Apple, Facebook), phone number verification, or email. You are assigned a unique, immutable Popo Live User ID.
          </p>
          <p>
            You are exclusively responsible for maintaining the confidentiality of your credentials, security PIN, and account activity. Sharing, renting, selling, or transferring accounts is strictly forbidden.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پلیٹ فارم کی مکمل سہولیات کے لیے آپ گوگل، ایپل، فیس بک یا موبائل نمبر کے ذریعے رجسٹر ہو سکتے ہیں۔ ہر صارف کو ایک منفرد پوپو لائیو آئی ڈی تفویض کی جاتی ہے۔
          </p>
          <p>
            اپنے اکاؤنٹ کے پاس ورڈ اور سیکیورٹی پن کی رازداری برقرار رکھنا آپ کی ذاتی ذمہ داری ہے۔ اکاؤنٹ فروخت کرنا یا کسی دوسرے کو استعمال کے لیے دینا سخت ممنوع ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'user-responsibilities',
      titleEn: 'User Responsibilities & Conduct',
      titleUr: 'صارفین کی ذمہ داریاں اور طرزِ عمل',
      contentEn: (
        <>
          <p>
            All users must interact respectfully. You agree not to engage in defamation, harassment, hate speech, bullying, extortion, non-consensual sharing of personal data, or impersonation of staff or other creators.
          </p>
          <p>
            Using automated bots, unauthorized scraping tools, payment fraud scripts, or exploiting glitches will result in immediate hardware ban across all devices.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            تمام صارفین باہمی احترام کے پابند ہیں۔ نفرت انگیز گفتگو، ہراساں کرنا، غیر اخلاقی مواد شیئر کرنا، یا کسی دوسرے صارف کی شناخت کا جھوٹا دعویٰ کرنا سخت ممنوع ہے۔
          </p>
          <p>
            بوٹس کا استعمال، ادائیگی میں دھوکہ دہی یا پلیٹ فارم میں خرابیوں کا ناجائز فائدہ اٹھانے پر صارف کی ڈیوائس پر مستقل پابندی لگا دی جائے گی۔
          </p>
        </>
      ),
    },
    {
      id: 'streaming-rules',
      titleEn: 'Live Streaming Rules & Broadcaster Eligibility',
      titleUr: 'لائیو اسٹریمنگ کے اصول اور اہلیت',
      contentEn: (
        <>
          <p>
            <strong>Go-Live Wealth Gate:</strong> To maintain broadcast quality and prevent spam, users must attain Wealth Level 5 and pass facial KYC identity verification before unlocking solo video broadcasting capabilities.
          </p>
          <p>
            Streams containing nudity, sexually suggestive conduct, gambling activities, violence, weapons, hate propaganda, or dangerous acts are strictly prohibited and will be terminated instantly by our live moderation kill-switch.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            <strong>لیول ۵ ویلتھ گیٹ:</strong> معیاری نشریات اور سپیم کی روک تھام کے لیے ہوسٹس کو ویڈیو اسٹریمنگ شروع کرنے سے قبل لیول ۵ ویلتھ اور چہرے کی تصدیق مکمل کرنا لازمی ہے۔
          </p>
          <p>
            عریانی، غیر اخلاقی حرکات، جوا، تشدد یا اسلحہ کی نمائش پر مبنی اسٹریمنگ سخت ممنوع ہے اور ماڈریٹر کی جانب سے اسے فوری طور پر بند کر دیا جائے گا۔
          </p>
        </>
      ),
    },
    {
      id: 'party-rooms',
      titleEn: 'Party Room Operations (9-Seat Standard)',
      titleUr: '۹ سیٹوں والے پارٹی روم کے ضوابط',
      contentEn: (
        <>
          <p>
            Party rooms are configured for up to 9 active audio/video participants (1 Room Owner Host + 8 Guest Seats). Room owners hold moderation authority to mute disruptive guests, reassign seats, or lock rooms.
          </p>
          <p>
            Room owners must actively moderate conversations within their rooms to ensure compliance with Popo Live Community Standards.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پارٹی رومز ۹ فعال سیٹوں (۱ ہوسٹ + ۸ مہمان سیٹیں) کے لیے مخصوص ہیں۔ روم کے مالک کو مائیک میوٹ کرنے، سیٹ لاک کرنے یا غیر مہذب صارفین کو نکالنے کا اختیار حاصل ہے۔
          </p>
          <p>
            روم اونر کی ذمہ داری ہے کہ وہ اپنے پارٹی لاؤنج میں مہذب گفتگو اور کمیونٹی اصولوں کی پاسداری کو یقینی بنائے۔
          </p>
        </>
      ),
    },
    {
      id: 'gifts-coins',
      titleEn: 'Virtual Gifts, Coins & 70% Host Points Ledger',
      titleUr: 'ورچوئل سکے، تحائف اور ۷۰٪ ہوسٹ پوائنٹس اصول',
      contentEn: (
        <>
          <p>
            <strong>Virtual Currency Rules:</strong> Coins purchased via authorized app stores or registered sellers constitute a limited, non-refundable license to acquire virtual gifts for entertainment.
          </p>
          <p>
            <strong>Official 70% Conversion Rule:</strong> Exactly seventy percent (70%) of the coin value of gifts received in a stream converts into withdrawable Host Points. Points are redeemable subject to KYC identity checks and withdrawal schedules.
          </p>
          <p>
            Gambling-style lucky gifts that return random coins are strictly disabled on this platform.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            <strong>ورچوئل کرنسی کے اصول:</strong> آفیشل اسٹورز سے خریدے گئے کوائنز تفریحی تحائف بھیجنے کے لیے استعمال ہوتے ہیں اور ان کی واپسی ممکن نہیں ہوتی۔
          </p>
          <p>
            <strong>۷۰ فیصد ہوسٹ پوائنٹس کا اصول:</strong> لائیو اسٹریمنگ میں موصول ہونے والے گفٹ کوائنز کا ٹھیک ۷۰ فیصد حصہ براہ راست ہوسٹ پوائنٹس میں تبدیل ہو جاتا ہے، جسے شناختی تصدیق کے بعد نکلوایا جا سکتا ہے۔
          </p>
          <p>
            جوئے کی نوعیت کے بے ترتیب لکی گفٹس اس پلیٹ فارم پر مکمل طور پر بند ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'creator-responsibilities',
      titleEn: 'Host and Agency Responsibilities',
      titleUr: 'ہوسٹ اور ایجنسی کی ذمہ داریاں',
      contentEn: (
        <>
          <p>
            Broadcasters and Talent Agencies operate as independent contractors and not platform employees. Broadcasters are responsible for fulfilling streaming missions honestly without artificial view inflation or collusion during PK battles.
          </p>
          <p>
            Agencies must recruit talent ethically. Second-level referral/MLM commission structures are strictly inactive on Popo Live.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہوسٹس اور ایجنسیاں آزاد شراکت دار کے طور پر کام کرتے ہیں۔ پی کے بیٹلز یا اسٹریمنگ گھنٹوں میں نقلی ویوز یا ملی بھگت کی سختی سے ممانعت ہے۔
          </p>
          <p>
            ایجنسیاں اخلاقی اصولوں کے تحت ہوسٹس سائن کریں گی۔ کثیر سطحی (MLM) کمیشن کا نظام پوپو لائیو پر مکمل بند ہے۔
          </p>
        </>
      ),
    },
    {
      id: 'suspension',
      titleEn: 'Account Suspension and Termination',
      titleUr: 'اکاؤنٹ معطلی اور منسوخی',
      contentEn: (
        <>
          <p>
            Popo Live reserves the right to freeze, suspend, or permanently terminate accounts, confiscate fraudulent balances, and issue hardware bans in response to severe terms violations, child safety breaches, or illegal activity.
          </p>
          <p>
            Users may voluntarily request account closure and personal data deletion via the settings panel at any time.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو شرائط کی سنگین خلاف ورزی، چائلڈ پروٹیکشن اصولوں کی پامالی یا دھوکہ دہی کی صورت میں اکاؤنٹ معطل کرنے اور ڈیوائس پر مستقل پابندی لگانے کا مکمل حق رکھتا ہے۔
          </p>
          <p>
            صارفین سیٹنگز مینو کے ذریعے کسی بھی وقت اپنا اکاؤنٹ بند کرنے اور ڈیٹا ڈیلیٹ کرنے کی درخواست کر سکتے ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'limitation',
      titleEn: 'Limitation of Liability & Disclaimers',
      titleUr: 'ذمہ داری کی حدود اور ڈس کلیمر',
      contentEn: (
        <>
          <p>
            Popo Live provides its live streaming and community platform on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We disclaim all warranties, express or implied, including fitness for a particular purpose or continuous uninterrupted service.
          </p>
          <p>
            In no event shall Popo Live, its operators, or affiliates be liable for indirect, incidental, or consequential damages resulting from user conduct or network interruptions.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو اپنی سروسز موجودہ حالت میں فراہم کرتا ہے۔ نیٹ ورک کی خرابی یا انٹرنیٹ کی بندش سے ہونے والے کسی بالواسطہ نقصان کا پلیٹ فارم ذمہ دار نہیں ہوگا۔
          </p>
        </>
      ),
    },
    {
      id: 'changes',
      titleEn: 'Changes to Terms',
      titleUr: 'شرائط میں تبدیلیاں',
      contentEn: (
        <>
          <p>
            We may update these Terms of Service periodically to reflect platform developments, regulatory changes, or feature updates. Continued use of Popo Live following updates constitutes agreement to the amended terms.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ہم وقتاً فوقتاً ان شرائط میں ترمیم کر سکتے ہیں۔ تبدیلیوں کے بعد سروسز کا مسلسل استعمال نئی شرائط کی قبولیت تصور کیا جائے گا۔
          </p>
        </>
      ),
    },
    {
      id: 'contact',
      titleEn: 'Legal Inquiries & Contact Information',
      titleUr: 'قانونی معلومات اور رابطہ',
      contentEn: (
        <>
          <p>
            For questions regarding these Terms of Service, reach out to our legal compliance office at:
            <br />
            <strong className="text-white">Email:</strong> legal@popolive.placeholder.app
            <br />
            <strong className="text-white">Compliance Desk:</strong> Popo Live Global Trust Directorate
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ان شرائط کے بارے میں کسی بھی قانونی سوال کے لیے ہمارے کمپلائنس ڈیسک سے رابطہ کریں:
            <br />
            <strong className="text-white">ای میل:</strong> legal@popolive.placeholder.app
          </p>
        </>
      ),
    },
  ];

  return (
    <PolicyLayout
      titleEn="Terms of Service"
      titleUr="استعمال کی شرائط"
      descEn="These Terms of Service govern your access to and use of the Popo Live platform, mobile apps, live broadcasting rooms, virtual gifting economy, and community features."
      descUr="یہ شرائط و ضوابط پوپو لائیو پلیٹ فارم، موبائل ایپلی کیشنز، لائیو اسٹریمنگ رومز اور ورچوئل گفٹنگ کے استعمال کو منظم کرتی ہیں۔"
      sections={sections}
    />
  );
}
