'use client';

import React from 'react';
import { PoppoPolicyLayout } from '@/components/poppo/PoppoPolicyLayout';
import { useLanguage } from '@/lib/languageContext';

export default function LiveAgreementPolicyPage() {
  const { isUr } = useLanguage();

  return (
    <PoppoPolicyLayout
      title="Live Agreement"
      titleUr="لائیو براڈکاسٹ معاہدہ (Live Agreement)"
      updatedDate="2026-03-20"
    >
      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۱. لائیو براڈکاسٹر کے لیے اہلیت اور تصدیق' : '1. Broadcaster Qualification & Verification'}
        </h2>
        <p>
          {isUr
            ? 'پوپو لائیو پر براڈکاسٹنگ کی اجازت صرف ان افراد کو دی جاتی ہے جن کی عمر کم از کم ۱۸ سال ہو اور جنہوں نے باضابطہ ویڈیو فیشل اسکیننگ اور شناختی کارڈ کی تصدیق کا عمل کامیابی سے مکمل کیا ہو۔'
            : 'Live broadcasting privileges on Poppo Live are strictly reserved for individuals who are at least 18 years old and have successfully passed our mandatory facial biometric and government identification verification process.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۲. لائیو سٹریمنگ کا اخلاقی ضابطہ' : '2. Broadcasting Standards & Decorum'}
        </h2>
        <p>
          {isUr
            ? 'تمام براڈکاسٹرز پر لازم ہے کہ وہ لائیو سٹریمنگ کے دوران اعلیٰ اخلاقی معیار برقرار رکھیں:'
            : 'Broadcasters are required to maintain high standards of social decorum during all live and party room sessions:'}
        </p>
        <ul className="list-disc list-inside space-y-2 pl-2">
          <li>{isUr ? 'لباس باوقار اور باحیا ہونا چاہیے۔ لائیو روم میں نامناسب یا غیر اخلاقی نمائش پر فوری بین لگایا جائے گا۔' : 'Dress code must remain modest and dignified. Any transparent, provocative, or explicit attire is grounds for immediate stream cutoff.'}</li>
          <li>{isUr ? 'کیمرے کے سامنے سگریٹ نوشی، شراب نوشی، یا منشیات کا استعمال سختی سے منع ہے۔' : 'Smoking, alcohol consumption, and substance usage on camera are strictly forbidden.'}</li>
          <li>{isUr ? 'پی کے مقابلوں میں کسی قسم کی تحقیر آمیز یا تکلیف دہ سزا دینے کی ممانعت ہے۔' : 'PK battle penalties must remain humorous and non-harmful. Dangerous or humiliating stunts are prohibited.'}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۳. پوائنٹس شیئر اور انعامی حساب کتاب' : '3. Virtual Items Conversion & Host Payouts'}
        </h2>
        <p>
          {isUr
            ? 'ناظرین کی طرف سے بھیجے گئے تمام تحائف ہوسٹ کے پوائنٹ بیلنس میں منتقل ہوتے ہیں۔ باضابطہ ایجنسی ہوسٹس کے لیے کمائی کا تناسب شفاف اور خودکار نظام کے تحت ریکارڈ کیا جاتا ہے۔'
            : 'Virtual gifts received from viewers are credited to the host wallet in the form of redeemable points. Settlements are calculated transparently with clear ledger logs available in the Host Center.'}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-gray-950">
          {isUr ? '۴. خلاف ورزی کی سزائیں' : '4. Penalties for Contract Breach'}
        </h2>
        <p>
          {isUr
            ? 'قواعد کی خلاف ورزی کی صورت میں انتباہ، لائیو روم کی عارضی معطلی، پوائنٹس کی ضبطگی، یا ڈیوائس پر مستقل پابندی عائد کی جا سکتی ہے۔'
            : 'Breaches of this Agreement result in graduated enforcement actions ranging from formal warnings, live stream interrupts, wallet freezes, to permanent device blacklisting.'}
        </p>
      </section>
    </PoppoPolicyLayout>
  );
}
