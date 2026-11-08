'use client';

import React from 'react';
import { PolicyLayout, PolicySection } from '@/components/policies/PolicyLayout';

export default function RefundsAndVirtualItemsPage() {
  const sections: PolicySection[] = [
    {
      id: 'virtual-coins',
      titleEn: '1. Virtual Coins Nature & Scope',
      titleUr: '۱. ورچوئل کوائنز کی نوعیت اور دائرہ کار',
      contentEn: (
        <>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-3">
            <strong>DRAFT FOR APPROVAL:</strong> All virtual economy terms represent operational guidelines subject to client financial approval and authorized payment gateway agreements.
          </div>
          <p>
            Virtual Coins are digital entertainment items acquired exclusively for social engagement, animated gifting, and participation within the Popo Live platform.
          </p>
          <p>
            Virtual Coins do not constitute real currency, legal tender, or investment instruments. They cannot be redeemed, exchanged, or converted into fiat currency by viewers. Virtual Coins represent a limited, non-exclusive, revocable license to utilize specific interactive features within Popo Live.
          </p>
        </>
      ),
      contentUr: (
        <>
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs mb-3">
            <strong>منظوری کے لیے ڈرافٹ:</strong> یہ تمام مالیاتی اصول پلیٹ فارم کے آپریشنل فریم ورک کی عکاسی کرتے ہیں اور باضابطہ منظوری کے تابع ہیں۔
          </div>
          <p>
            ورچوئل کوائنز صرف ایپ کے اندر سوشل گفٹنگ اور تفریحی فیچرز کے استعمال کے لیے حاصل کیے جاتے ہیں۔
          </p>
          <p>
            ورچوئل کوائنز کوئی حقیقی کرنسی یا سرمایہ کاری نہیں ہیں۔ ناظرین انہیں واپس نقدی میں تبدیل نہیں کر سکتے، بلکہ یہ ایپ کے اندر خصوصی فیچرز استعمال کرنے کا ڈیجیٹل لائسنس ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'virtual-gifts',
      titleEn: '2. Virtual Gifts & 70% Host Conversion',
      titleUr: '۲. ورچوئل تحائف اور ۷۰٪ ہوسٹ شیئر',
      contentEn: (
        <>
          <p>
            When a user sends a virtual gift to a broadcaster in a live broadcast or party room:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>The corresponding coin value is immediately deducted from the sender&rsquo;s coin balance and securely locked in the transaction ledger.</li>
            <li>Exactly seventy percent (70%) of the virtual gift coin value converts directly into redeemable Host Points credited to the verified broadcaster&rsquo;s earnings ledger.</li>
            <li>Once sent and rendered in a live stream, virtual gift transactions are final and cannot be reversed or recalled.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            جب کوئی صارف لائیو اسٹریم یا پارٹی روم میں براڈکاسٹر کو ورچوئل گفٹ بھیجتا ہے:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li>بھیجنے والے کے بیلنس سے کوائنز کی کٹوتی فوری مکمل ہوتی ہے اور لیجر میں محفوظ ہو جاتی ہے۔</li>
            <li>گفٹ کے کوائنز کا ۷۰٪ حصہ براہ راست ہوسٹ کے پوائنٹس میں تبدیل ہو کر اس کے والٹ میں جمع ہوتا ہے۔</li>
            <li>لائیو روم میں اینیمیشن ظاہر ہونے کے بعد گفٹ کا لین دین مکمل اور ناقابل واپسی ہوتا ہے۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'digital-purchases',
      titleEn: '3. Digital Purchases & Billing Channels',
      titleUr: '۳. ڈیجیٹل خریداریاں اور بلنگ چینلز',
      contentEn: (
        <>
          <p>
            All virtual coin top-ups must be initiated solely through official platform billing channels:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Google Play In-App Billing:</strong> Processed and governed by Google Play Store terms and regional currency settings.</li>
            <li><strong>Apple In-App Purchase (IAP):</strong> Processed under Apple App Store digital content guidelines and security requirements.</li>
            <li><strong>Authorized Resellers:</strong> Only verified coin distribution agents officially published in the Popo Live directory.</li>
          </ul>
          <p className="mt-2 text-xs text-gray-400">
            Never attempt to purchase coins from unauthorized third parties or unverified websites claiming discounted rates.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            ورچوئل کوائنز کی تمام خریداریاں صرف سرکاری ذرائع سے کی جانی چاہئیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>گوگل پلے اسٹور (Google Play):</strong> گوگل کے آفیشل ان ایپ بلنگ چینلز کے ذریعے۔</li>
            <li><strong>ایپل ایپ اسٹور (Apple IAP):</strong> ایپل کے محفوظ بلنگ پروٹوکولز کے ذریعے۔</li>
            <li><strong>مجاز کوائن سیلرز:</strong> صرف وہی ایجنٹس جو پوپو لائیو کی آفیشل لسٹ میں تصدیق شدہ ہوں۔</li>
          </ul>
          <p className="mt-2 text-xs text-gray-400">
            کسی بھی غیر مجاز ویب سائٹ یا نامعلوم افراد سے سستے کوائنز خریدنے کی کوشش نہ کریں۔
          </p>
        </>
      ),
    },
    {
      id: 'payment-records',
      titleEn: '4. Payment Records & Ledger Receipts',
      titleUr: '۴. ادائیگیوں کے ریکارڈز اور رسیدیں',
      contentEn: (
        <>
          <p>
            Popo Live maintains a centralized, immutable transaction ledger. Users can view complete purchase receipts, coin expenditures, and gift history directly within the mobile app:
          </p>
          <p>
            Navigate to <strong>Me</strong> &rarr; <strong>Wallet</strong> &rarr; <strong>Transaction History</strong> to inspect detailed timestamps, order reference numbers, and digital store receipt IDs.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            پوپو لائیو تمام لین دین کا مکمل اور محفوظ ریکارڈ برقرار رکھتا ہے۔ صارفین اپنے موبائل ایپ میں کسی بھی وقت رسیدیں دیکھ سکتے ہیں:
          </p>
          <p>
            ایپ میں <strong>Me</strong> &rarr; <strong>Wallet</strong> &rarr; <strong>Transaction History</strong> پر جا کر تمام آرڈر نمبرز اور وقت کے ریکارڈز ملاحظہ کیے جا سکتے ہیں۔
          </p>
        </>
      ),
    },
    {
      id: 'refund-request-process',
      titleEn: '5. Refund Request Process & Verification',
      titleUr: '۵. ریفنڈ کی درخواست اور جانچ کا طریقہ کار',
      contentEn: (
        <>
          <p>
            Because virtual coins are digital consumable goods delivered instantaneously, purchases are generally non-refundable once credited to your account.
          </p>
          <p>
            If you encounter an exceptional issue where payment was successfully deducted by your app store provider but coins failed to credit to your Popo Live wallet, submit an inquiry to our billing desk with:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Your numerical Popo Live User ID.</li>
            <li>Official store order receipt number (Google Play GPA number or Apple order ID).</li>
            <li>Transaction timestamp and exact purchased coin package.</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            چونکہ ورچوئل کوائنز ڈیجیٹل اشیاء ہیں جو فوری اکاؤنٹ میں شامل ہو جاتی ہیں، اس لیے ترسیل کے بعد عام طور پر ریفنڈ نہیں ہوتا۔
          </p>
          <p>
            اگر رقم کاٹ لی گئی ہو لیکن کوائنز اکاؤنٹ میں شامل نہ ہوئے ہوں، تو درج ذیل تفصیلات کے ساتھ انکوائری جمع کروائیں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li>آپ کی پوپو لائیو یوزر آئی ڈی۔</li>
            <li>آفیشل اسٹور آرڈر رسید نمبر (Google Play GPA یا Apple Order ID)۔</li>
            <li>ادائیگی کا وقت اور پیکج کی تفصیل۔</li>
          </ul>
        </>
      ),
    },
    {
      id: 'incorrect-transactions',
      titleEn: '6. Incorrect Transactions & Billing Inquiries',
      titleUr: '۶. غلط لین دین اور بلنگ انکوائریز',
      contentEn: (
        <>
          <p>
            In the event of duplicate billing or network timeouts during checkout, our automated ledger reconciles unmatched orders with store receipt tokens every 24 hours.
          </p>
          <p>
            If an unmatched order is verified by our system, coins will be automatically credited to your wallet balance. Users should contact support before initiating bank disputes.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            انٹرنیٹ کے تعطل یا ڈبل کٹوتی کی صورت میں ہمارا سسٹم ہر ۲۴ گھنٹے میں خودکار تصدیق کے ذریعے زیرِ التواء آرڈرز کو کلیئر کرتا ہے۔
          </p>
          <p>
            تصدیق مکمل ہونے پر کوائنز خودکار طور پر آپ کے والٹ میں شامل کر دیے جائیں گے۔ بینک سے رابطہ کرنے سے پہلے ہماری سپورٹ ٹیم سے رابطہ کریں۔
          </p>
        </>
      ),
    },
    {
      id: 'account-restrictions',
      titleEn: '7. Account Restrictions for Chargeback Abuse',
      titleUr: '۷. بلاجواز چارج بیک اور فراڈ پر پابندیاں',
      contentEn: (
        <>
          <p>
            Initiating unauthorized chargebacks, filing fraudulent dispute claims, or acquiring coins using stolen payment credentials is a severe violation of platform terms.
          </p>
          <p>
            Accounts associated with abusive chargebacks will have their coin wallets frozen, virtual items deducted, and may face permanent suspension and hardware device blacklisting.
          </p>
        </>
      ),
      contentUr: (
        <>
          <p>
            کوائنز استعمال کرنے کے بعد بلاجواز چارج بیک کروانا یا چوری شدہ کارڈز کا استعمال سنگین خلاف ورزی شمار ہوتا ہے۔
          </p>
          <p>
            ایسی سرگرمیوں میں ملوث اکاؤنٹس کے کوائنز ضبط کر لیے جائیں گے اور اکاؤنٹ کو ڈیوائس سمیت مستقل طور پر بلاک کر دیا جائے گا۔
          </p>
        </>
      ),
    },
    {
      id: 'support-contact',
      titleEn: '8. Support Contact & Billing Desk',
      titleUr: '۸. سپورٹ اور بلنگ ہیلپ ڈیسک',
      contentEn: (
        <>
          <p>
            For inquiries regarding digital transactions, coin balances, or billing verification, reach out to our dedicated support channels:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Billing & Inquiries:</strong> <code>support@popolive.com</code></li>
            <li><strong>General Inquiries:</strong> <a href="/contact" className="text-popo-pink hover:underline">popolive.com/contact</a></li>
            <li><strong>Operating Hours:</strong> Global Staging Support Desk (Online 24/7)</li>
          </ul>
        </>
      ),
      contentUr: (
        <>
          <p>
            کسی بھی مالیاتی یا کوائنز سے متعلق انکوائری کے لیے ہمارے بلنگ ڈیسک سے رابطہ کریں:
          </p>
          <ul className="list-disc pr-5 space-y-1 mt-2">
            <li><strong>بلنگ سپورٹ:</strong> <code>support@popolive.com</code></li>
            <li><strong>آن لائن پورٹل:</strong> <a href="/contact" className="text-popo-pink hover:underline">popolive.com/contact</a></li>
            <li><strong>اوقاتِ کار:</strong> گلوبل سپورٹ ڈیسک (۲۴/۷ دستیاب)</li>
          </ul>
        </>
      ),
    },
  ];

  return (
    <PolicyLayout
      titleEn="Refund and Virtual Items Policy"
      titleUr="ریفنڈ اور ورچوئل کوائنز پالیسی"
      descEn="Operational rules governing virtual coin purchases, gift transactions, 70% host conversion, and dispute inquiry processes."
      descUr="ورچوئل کوائنز کی خریداری، تحائف کے تبادلے، ہوسٹس کے ۷۰٪ ریونیو شیئر اور انکوائری کے ضوابط۔"
      lastUpdated="Draft — November 2026"
      sections={sections}
    />
  );
}
