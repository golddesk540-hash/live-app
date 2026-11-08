'use client';

import React from 'react';
import { PoppoPolicyLayout } from '@/components/poppo/PoppoPolicyLayout';
import { useLanguage } from '@/lib/languageContext';

export default function CommunityGuidelinesPolicyPage() {
  const { isUr } = useLanguage();

  return (
    <PoppoPolicyLayout
      title="Community Guidelines"
      titleUr="کمیونٹی گائیڈ لائنز اور اخلاقی ضوابط"
      updatedDate="2026-03-20"
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۱. باہمی احترام اور مثبت ماحول' : '1. Respect and Mutual Courtesy'}
        </h2>
        <p>
          {isUr
            ? 'پوپو لائیو مثبت تفریح، دوستی اور ثقافتی ہم آہنگی کا عالمی پلیٹ فارم ہے۔ ہم توقع کرتے ہیں کہ تمام براڈکاسٹرز، پارٹی روم ممبرز اور ناظرین ایک دوسرے کا احترام کریں گے۔ رنگ، نسل، مذہب، قومیت یا جنس کی بنیاد پر تعصب سختی سے منع ہے۔'
            : 'Poppo Live is built upon friendship, joy, and respectful creative expression. Broadcasters, party lounge guests, and viewers must treat one another with dignity. Discrimination or hatred based on race, ethnicity, religion, or gender is strictly prohibited.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۲. ہراسانی اور بدزبانی کے خلاف زیرو ٹالرنس' : '2. Zero Tolerance for Harassment and Abuse'}
        </h2>
        <p>
          {isUr
            ? 'کسی بھی صارف یا ہوسٹ کو دھمکیاں دینا، بلیک میل کرنا، نازیبا زبان استعمال کرنا یا نجی پیغامات میں مسلسل تنگ کرنا فوری طور پر اکاؤنٹ بین کا باعث بنے گا۔'
            : 'Targeted attacks, cyberbullying, stalking, blackmail, or abusive harassment in public comments or private messages will trigger immediate chat bans and account termination.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۳. فحاشی اور غیر اخلاقی لباس کی ممانعت' : '3. Modesty & No Explicit Content'}
        </h2>
        <p>
          {isUr
            ? 'لائیو نشریات کے دوران باحیا لباس پہننا لازمی ہے۔ کسی بھی قسم کی عریانی، فحش اشارے، یا جنسی حرکات دکھانے پر لائیو سٹریم فوری طور پر منقطع کر دی جائے گی۔'
            : 'Broadcasters must maintain proper decorum. Nudity, sexually explicit conduct, provocative exposure, and erotic performances are unequivocally banned across all streams.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۴. نابالغوں کی مکمل ممانعت (۱۸+ پالیسی)' : '4. Absolute Protection of Minors (Strict 18+)'}
        </h2>
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm">
          {isUr
            ? '۱۸ سال سے کم عمر افراد کا لائیو آنا یا سکرین پر نظر آنا ممنوع ہے۔ اگر کوئی ہوسٹ نابالغ کو لائیو پر لائے گا تو اس کا اکاؤنٹ فوری مستقل بلاک کیا جائے گا۔'
            : 'Minors under 18 years are strictly prohibited from appearing in any live broadcast. Broadcasters who feature minors on stream will face immediate permanent account termination.'}
        </div>
      </section>
    </PoppoPolicyLayout>
  );
}
