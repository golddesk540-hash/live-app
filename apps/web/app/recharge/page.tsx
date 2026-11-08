'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PoppoLogo } from '@/components/poppo/PoppoLogo';
import { useLanguage } from '@/lib/languageContext';
import {
  Coins,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Globe,
  ChevronDown,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Wallet,
  Sparkles,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';

interface CoinPackage {
  id: string;
  coins: number;
  bonus?: number;
  usdPrice: number;
  popular?: boolean;
}

const coinPackages: CoinPackage[] = [
  { id: '1', coins: 7000, usdPrice: 0.99 },
  { id: '2', coins: 35000, bonus: 1500, usdPrice: 4.99 },
  { id: '3', coins: 70000, bonus: 5000, usdPrice: 9.99, popular: true },
  { id: '4', coins: 140000, bonus: 12000, usdPrice: 19.99 },
  { id: '5', coins: 350000, bonus: 35000, usdPrice: 49.99 },
  { id: '6', coins: 700000, bonus: 85000, usdPrice: 99.99 },
  { id: '7', coins: 1400000, bonus: 200000, usdPrice: 199.99 },
  { id: '8', coins: 3500000, bonus: 550000, usdPrice: 499.99 },
];

const countries = [
  { id: 'PK', name: 'Pakistan', currency: 'PKR', symbol: 'Rs', rate: 280, methods: ['JazzCash', 'EasyPaisa', 'Bank Transfer', 'Credit Card'] },
  { id: 'PH', name: 'Philippines', currency: 'PHP', symbol: '₱', rate: 58, methods: ['GCash', 'Maya', 'ShopeePay', 'Bank Card'] },
  { id: 'IN', name: 'India', currency: 'INR', symbol: '₹', rate: 85, methods: ['UPI / GooglePay', 'PayTM', 'PhonePe', 'Credit Card'] },
  { id: 'NP', name: 'Nepal', currency: 'NPR', symbol: 'Rs', rate: 135, methods: ['eSewa', 'Khalti', 'Bank Connect'] },
  { id: 'BD', name: 'Bangladesh', currency: 'BDT', symbol: '৳', rate: 120, methods: ['bKash', 'Nagad', 'Rocket'] },
  { id: 'US', name: 'United States', currency: 'USD', symbol: '$', rate: 1, methods: ['Apple Pay', 'Google Pay', 'Credit Card', 'PayPal'] },
  { id: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'AED', rate: 3.67, methods: ['Apple Pay', 'Credit Card'] },
  { id: 'SA', name: 'Saudi Arabia', currency: 'SAR', symbol: 'SAR', rate: 3.75, methods: ['Mada', 'Apple Pay', 'Credit Card'] },
];

export default function PoppoCoinRechargePage() {
  const { lang, toggleLang, isUr } = useLanguage();

  // State
  const [userIdInput, setUserIdInput] = useState('9082341');
  const [verifiedUser, setVerifiedUser] = useState<{
    id: string;
    nickname: string;
    avatar: string;
    level: string;
  } | null>({
    id: '9082341',
    nickname: 'Ayla Rose ✨',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    level: 'Lv.28 VIP',
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage>(coinPackages[2]);
  const [selectedMethod, setSelectedMethod] = useState(countries[0].methods[0]);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Handle Verify User ID
  const handleVerify = () => {
    if (!userIdInput.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedUser({
        id: userIdInput,
        nickname: `Poppo_Star_${userIdInput.slice(-4)}`,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
        level: 'Lv.15 Broadcaster',
      });
    }, 600);
  };

  // Convert Price
  const localPrice = (selectedPackage.usdPrice * selectedCountry.rate).toFixed(
    selectedCountry.rate === 1 ? 2 : 0
  );

  // Handle Checkout Simulation
  const handlePurchase = () => {
    if (!agreeTerms || !verifiedUser) return;
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setPurchaseSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1D] text-white font-sans selection:bg-[#5653FE] selection:text-white flex flex-col justify-between">
      
      {/* 1. DARK THEMED RECHARGE HEADER (Matching 10_coin_recharge_user_id_page.png) */}
      <header className="border-b border-gray-800/80 bg-[#0E1528] py-4 px-4 sm:px-8 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <PoppoLogo />
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              Official Recharge Portal
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/70 hover:bg-gray-700 border border-gray-700 text-gray-300 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#5653FE]" />
              <span>{isUr ? 'اردو' : 'English'}</span>
            </button>

            <Link
              href="/"
              className="px-4 py-1.5 rounded-full bg-gray-800/70 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* 2. RECHARGE CONTAINER (Matching 10_coin_recharge_user_id_page.png) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-5 sm:space-y-8">
        
        {/* Step 1: User ID Verification Section */}
        <section className="bg-[#121A30] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-gray-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#5653FE] text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isUr ? 'پوپو لائیو یوزر آئی ڈی درج کریں' : 'Enter the user ID'}
              </h2>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Where to find User ID?"
              >
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-purple-400" />
              </button>
            </div>
            
            {verifiedUser && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Account Verified</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="Enter 7-9 digit User ID (e.g. 9082341)"
                className="w-full bg-[#0A0F1D] border border-gray-700 focus:border-[#5653FE] focus:ring-2 focus:ring-[#5653FE]/30 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-8 py-3 rounded-2xl bg-[#5653FE] hover:bg-[#433ffd] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Confirm</span>
              )}
            </button>
          </div>

          {/* Verified User Details Card */}
          {verifiedUser && (
            <div className="p-3.5 rounded-2xl bg-[#0E1528] border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={verifiedUser.avatar}
                  alt={verifiedUser.nickname}
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#5653FE]"
                />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{verifiedUser.nickname}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black">
                      {verifiedUser.level}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">ID: {verifiedUser.id}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-emerald-400 font-medium">Ready for top up ✓</span>
              </div>
            </div>
          )}
        </section>

        {/* Step 2: Country / Region & Payment Channel */}
        <section className="bg-[#121A30] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-gray-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#5653FE] text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {isUr ? 'ملک اور ادائیگی کا طریقہ منتخب کریں' : 'Select Country & Payment Method'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Country Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Country / Region
              </label>
              <div className="relative">
                <select
                  value={selectedCountry.id}
                  onChange={(e) => {
                    const country = countries.find((c) => c.id === e.target.value) || countries[0];
                    setSelectedCountry(country);
                    setSelectedMethod(country.methods[0]);
                  }}
                  className="w-full appearance-none bg-[#0A0F1D] border border-gray-700 focus:border-[#5653FE] rounded-2xl px-4 py-3 text-sm text-white outline-none cursor-pointer"
                >
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.currency})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Payment Method
              </label>
              <div className="relative">
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="w-full appearance-none bg-[#0A0F1D] border border-gray-700 focus:border-[#5653FE] rounded-2xl px-4 py-3 text-sm text-white outline-none cursor-pointer"
                >
                  {selectedCountry.methods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Step 3: Coin Packages Grid (Matching 10_coin_recharge_user_id_page.png) */}
        <section className="bg-[#121A30] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-gray-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#5653FE] text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isUr ? 'کوائن پیکج منتخب کریں' : 'Select Coin Amount'}
              </h2>
            </div>
            <span className="text-[11px] sm:text-xs text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official 0% Extra Fee</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {coinPackages.map((pkg) => {
              const isSelected = selectedPackage.id === pkg.id;
              const convertedPrice = (pkg.usdPrice * selectedCountry.rate).toFixed(
                selectedCountry.rate === 1 ? 2 : 0
              );

              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-3.5 sm:p-5 rounded-xl sm:rounded-2xl cursor-pointer border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#5653FE]/20 to-[#121A30] border-[#5653FE] ring-2 ring-[#5653FE]/50 shadow-lg shadow-purple-500/20'
                      : 'bg-[#0A0F1D] border-gray-800 hover:border-gray-700 hover:bg-[#0E1528]'
                  }`}
                >
                  {/* Popular or Bonus Badge */}
                  {pkg.popular && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider">
                      Hot
                    </span>
                  )}
                  {pkg.bonus && !pkg.popular && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">
                      +{pkg.bonus.toLocaleString()} Extra
                    </span>
                  )}

                  <div className="space-y-1">
                    {/* Coin Icon and Base Coins */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-[11px] shadow-xs">
                        💰
                      </div>
                      <span className="text-lg sm:text-xl font-black text-white">
                        {pkg.coins.toLocaleString()}
                      </span>
                    </div>

                    {/* Bonus Text */}
                    {pkg.bonus ? (
                      <div className="text-[11px] text-emerald-400 font-semibold">
                        + {pkg.bonus.toLocaleString()} Bonus
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-500">Standard Pack</div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mt-4 pt-3 border-t border-gray-800 flex items-baseline justify-between">
                    <span className="text-sm sm:text-base font-bold text-white">
                      {selectedCountry.symbol} {convertedPrice}
                    </span>
                    <span className="text-[10px] text-gray-500">${pkg.usdPrice}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 4: Checkout Summary & Agreement Bar (Matching 10_coin_recharge_user_id_page.png) */}
        <section className="bg-[#121A30] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-gray-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
            <div>
              <div className="text-xs text-gray-400">Total Purchase:</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 flex items-baseline gap-2">
                <span>
                  {selectedCountry.symbol} {localPrice}
                </span>
                <span className="text-xs text-gray-400 font-normal">
                  ({(selectedPackage.coins + (selectedPackage.bonus || 0)).toLocaleString()} Coins)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePurchase}
              disabled={isCheckingOut || !agreeTerms || !verifiedUser}
              className="w-full sm:w-auto px-10 py-3.5 rounded-full bg-[#5653FE] hover:bg-[#433ffd] text-white font-bold text-sm sm:text-base shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5" />
                  <span>Purchase Now</span>
                </>
              )}
            </button>
          </div>

          {/* Legal Compliance Disclaimer */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="recharge-agree"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-[#5653FE] bg-gray-900 border-gray-700 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="recharge-agree" className="text-xs text-gray-400 leading-relaxed cursor-pointer">
              I confirm I am at least 18 years of age, and I agree to the{' '}
              <Link href="/policies/recharge-agreement" className="text-[#5653FE] hover:underline font-bold">
                User Recharge Agreement
              </Link>{' '}
              and{' '}
              <Link href="/policies/privacy" className="text-[#5653FE] hover:underline font-bold">
                Privacy Protection
              </Link>
              . All coin purchases are final and credited directly to the verified Poppo Live User ID.
            </label>
          </div>
        </section>
      </main>

      {/* 3. RECHARGE FOOTER COMPLIANCE */}
      <footer className="border-t border-gray-800 bg-[#0E1528] py-6 px-4 text-center text-xs text-gray-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© 2026 POPPO LIVE. All rights reserved. Official Coin Recharge Gateway.</div>
          <div className="flex items-center gap-4">
            <Link href="/policies/recharge-agreement" className="hover:text-white">
              Recharge Policy
            </Link>
            <Link href="/contact" className="hover:text-white">
              Customer Support
            </Link>
          </div>
        </div>
      </footer>

      {/* MODAL: WHERE TO FIND USER ID? */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121A30] border border-gray-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#5653FE]" />
              <span>Where to find your User ID?</span>
            </h3>
            <ol className="list-decimal list-inside text-xs sm:text-sm text-gray-300 space-y-2">
              <li>Open the Poppo Live App on your mobile device.</li>
              <li>Tap the "Me" (Profile) icon in the bottom right corner.</li>
              <li>Your User ID is a 7-9 digit number located directly under your nickname.</li>
              <li>Tap the copy button next to your ID and paste it here.</li>
            </ol>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#5653FE] text-white font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* MODAL: PURCHASE SUCCESS RECEIPT */}
      {purchaseSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121A30] border border-emerald-500/50 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl relative">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Recharge Successful!</h3>
            <p className="text-xs text-gray-400">
              <span className="font-bold text-white">
                {(selectedPackage.coins + (selectedPackage.bonus || 0)).toLocaleString()} Coins
              </span>{' '}
              have been credited to User ID <span className="text-purple-400 font-bold">{verifiedUser?.id}</span>.
            </p>
            <div className="p-3 bg-[#0A0F1D] rounded-xl text-xs text-gray-400 font-mono text-left space-y-1">
              <div>Order ID: POP-{Date.now().toString().slice(-8)}</div>
              <div>Channel: {selectedMethod}</div>
              <div>Status: Completed (Instant Settlement)</div>
            </div>
            <div className="flex gap-3 pt-2">
              <Link
                href="/live"
                className="flex-1 py-2.5 rounded-xl bg-[#5653FE] text-white text-xs font-bold text-center"
              >
                Go to Live Rooms
              </Link>
              <button
                onClick={() => setPurchaseSuccess(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
