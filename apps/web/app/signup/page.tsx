'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PoppoLogo } from '@/components/poppo/PoppoLogo';
import { useLanguage } from '@/lib/languageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import {
  ArrowLeft,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Smartphone,
  Calendar,
  AlertCircle,
  Globe,
  CheckCircle,
  Loader2,
  LogIn,
} from 'lucide-react';

export default function SignupPage() {
  const { lang, toggleLang, isUr } = useLanguage();

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [dob, setDob] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const countryOptions = [
    { value: 'Pakistan', label: '🇵🇰 Pakistan' },
    { value: 'UAE', label: '🇦🇪 United Arab Emirates' },
    { value: 'Saudi Arabia', label: '🇸🇦 Saudi Arabia' },
    { value: 'Turkey', label: '🇹🇷 Turkey' },
    { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
    { value: 'United States', label: '🇺🇸 United States' },
    { value: 'Bangladesh', label: '🇧🇩 Bangladesh' },
    { value: 'Indonesia', label: '🇮🇩 Indonesia' },
    { value: 'India', label: '🇮🇳 India' },
    { value: 'Other', label: '🌐 Other Region' },
  ];

  // Helper to validate minimum 18 years age
  const validateAge = (birthDateString: string): boolean => {
    if (!birthDateString) return false;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return false;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!fullName.trim()) {
      errs.fullName = isUr ? 'پورا نام درج کریں' : 'Full Name is required';
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      errs.email = isUr ? 'درست ای میل ایڈریس درج کریں' : 'Valid email address is required';
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 7) {
      errs.phoneNumber = isUr ? 'درست موبائل نمبر درج کریں' : 'Valid phone number is required';
    }
    if (!password || password.length < 6) {
      errs.password = isUr ? 'پاس ورڈ کم از کم ۶ حروف پر مشتمل ہو' : 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = isUr ? 'پاس ورڈز ایک جیسے نہیں ہیں' : 'Passwords do not match';
    }
    if (!dob) {
      errs.dob = isUr ? 'تاریخ پیدائش درج کریں' : 'Date of Birth is required';
    } else if (!validateAge(dob)) {
      errs.dob = isUr
        ? 'پوپو لائیو استعمال کرنے کے لیے آپ کی عمر کم از کم ۱۸ سال ہونا لازمی ہے۔'
        : 'You must be at least 18 years old to create a Popo Live account.';
    }
    if (!agreeTerms) {
      errs.agreeTerms = isUr
        ? 'جاری رکھنے کے لیے شرائط اور پرائیویسی پالیسی سے اتفاق کرنا لازمی ہے'
        : 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-[#0B0E17] text-white flex flex-col justify-between selection:bg-popo-pink selection:text-white relative overflow-hidden ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-purple-600/20 via-pink-600/20 to-indigo-600/15 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex items-center justify-between z-10">
        <Link
          href="/"
          className={`flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-[#171722] px-4 py-2 rounded-full border border-white/10 ${
            isUr ? 'flex-row-reverse' : ''
          }`}
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
          <span>{isUr ? 'ہوم پیج پر واپس جائیں' : 'Back to Home'}</span>
        </Link>

        {/* Language Switcher */}
        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#171722] hover:bg-[#20202F] text-xs font-bold text-gray-300 hover:text-white border border-white/10 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{lang === 'en' ? 'اردو' : 'English'}</span>
        </button>
      </header>

      {/* Main Signup Card Center */}
      <main className="max-w-xl mx-auto w-full px-4 py-8 z-10">
        <div className="rounded-3xl bg-gradient-to-b from-[#171722] to-[#12121A] border border-white/15 p-6 sm:p-10 shadow-2xl shadow-purple-950/40 flex flex-col gap-6 text-center">
          {/* Brand Logo & Heading */}
          <div className="flex flex-col items-center gap-3">
            <PoppoLogo size="lg" isDark={true} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isUr ? 'اپنا پوپو لائیو اکاؤنٹ بنائیں' : 'Create Your Popo Live Account'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">
                {isUr
                  ? 'دنیا بھر کے لاکھوں کری ایٹرز اور ناظرین کے ساتھ شامل ہوں'
                  : 'Join millions of live creators and viewers across the globe.'}
              </p>
            </div>
          </div>

          {/* Staging Demo Mode Alert */}
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className={`text-xs text-amber-200/90 leading-relaxed ${isUr ? 'text-right' : 'text-left'}`}>
              <span className="font-bold block text-amber-400">
                {isUr ? 'فیز ۱ پریویو — اکاؤنٹ رجسٹریشن' : 'Phase 1 UI Preview — Account Registration'}
              </span>
              <span>
                {isUr
                  ? 'یہ فرنٹ اینڈ فارم ڈیمو ہے۔ اصل صارفین کے اکاؤنٹس، یوزر آئی ڈی کی الاٹمنٹ اور سیشنز فیز ۲ میں محفوظ ہوں گے۔'
                  : 'This form operates with active frontend validation. User ID allocation and database persistence will connect in Phase 2.'}
              </span>
            </div>
          </div>

          {isSuccess ? (
            /* Success State */
            <div className="py-8 flex flex-col items-center gap-4 animate-in zoom-in-95 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-mono font-bold text-popo-pink uppercase">Demo Registration Successful</span>
                <h3 className="text-xl font-bold text-white">
                  {isUr ? 'اکاؤنٹ فارم کی تصدیق مکمل!' : 'Account Form Validated!'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 max-w-sm leading-relaxed">
                  {isUr
                    ? 'آپ کی تمام تفصیلات اور عمر (۱۸ سال سے زائد) کی توثیق ہو چکی ہے۔ فیز ۲ میں یہ ڈیٹا بیس سے منسلک ہو جائے گا۔'
                    : 'All input fields and strict 18+ age criteria passed verification. You can proceed to the Login interface.'}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full">
                <Link href="/login" className="w-full">
                  <Button variant="primary" size="md" className="w-full font-bold" leftIcon={<LogIn className="w-4 h-4" />}>
                    {isUr ? 'لاگ ان صفحہ پر جائیں' : 'Proceed to Log In'}
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsSuccess(false)}
                  className="w-full bg-white/5 border-white/10"
                >
                  {isUr ? 'دوبارہ فارم بھریں' : 'Reset Form'}
                </Button>
              </div>
            </div>
          ) : (
            /* 7 Signup Fields Form */
            <form onSubmit={handleSignup} className="flex flex-col gap-4 text-left">
              {/* Field 1: Full Name */}
              <Input
                label={isUr ? 'پورا نام *' : '1. Full Name *'}
                placeholder={isUr ? 'مثال: محمد احمد' : 'e.g. Alexander Vance'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                leftIcon={<User className="w-4 h-4" />}
              />

              {/* Field 2 & 3: Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={isUr ? 'ای میل ایڈریس *' : '2. Email Address *'}
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <Input
                  label={isUr ? 'فون نمبر *' : '3. Phone Number *'}
                  placeholder="+92 300 1234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  error={errors.phoneNumber}
                  leftIcon={<Smartphone className="w-4 h-4" />}
                />
              </div>

              {/* Field 4 & 5: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-popo-text-secondary">
                    {isUr ? 'پاس ورڈ *' : '4. Password *'}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full bg-popo-dark-850 text-white placeholder:text-gray-500 text-sm rounded-xl pl-10 pr-10 py-2.5 transition-all duration-200 border border-white/10 outline-none focus:border-popo-pink focus:ring-2 focus:ring-popo-pink/20 ${
                        errors.password ? 'border-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <span className="text-xs font-medium text-red-400">{errors.password}</span>}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-popo-text-secondary">
                    {isUr ? 'پاس ورڈ کی تصدیق *' : '5. Confirm Password *'}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-popo-dark-850 text-white placeholder:text-gray-500 text-sm rounded-xl pl-10 pr-10 py-2.5 transition-all duration-200 border border-white/10 outline-none focus:border-popo-pink focus:ring-2 focus:ring-popo-pink/20 ${
                        errors.confirmPassword ? 'border-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 text-gray-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-xs font-medium text-red-400">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>

              {/* Field 6 & 7: Country & Date of Birth (Strict 18+ requirement) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Dropdown
                  label={isUr ? 'ملک / خطہ *' : '6. Country *'}
                  options={countryOptions}
                  value={country}
                  onChange={setCountry}
                />

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-popo-text-secondary">
                    {isUr ? 'تاریخ پیدائش (۱۸+ لازمی) *' : '7. Date of Birth (Strict 18+) *'}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full bg-popo-dark-850 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all duration-200 border border-white/10 outline-none focus:border-popo-pink focus:ring-2 focus:ring-popo-pink/20 ${
                        errors.dob ? 'border-red-500' : ''
                      }`}
                    />
                  </div>
                  {errors.dob && <span className="text-xs font-medium text-red-400">{errors.dob}</span>}
                </div>
              </div>

              {/* Strict 18+ Age Notice Banner */}
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  {isUr
                    ? 'عمر کی تصدیق: پوپو لائیو صرف ۱۸ سال یا زائد عمر کے افراد کے لیے ہے۔ نابالغوں کا رجسٹریشن سختی سے ممنوع ہے۔'
                    : 'Age Verification: Popo Live is strictly intended for individuals 18 years or older. Registration of minors is prohibited.'}
                </span>
              </div>

              {/* Terms and Privacy Checkbox */}
              <div className="flex flex-col gap-1 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-white/20 bg-black/40 text-popo-pink focus:ring-popo-pink/20 shrink-0"
                  />
                  <span>
                    {isUr ? (
                      <>
                        میں تصدیق کرتا ہوں کہ میری عمر ۱۸ سال سے زیادہ ہے اور میں پوپو لائیو کے{' '}
                        <Link href="/policies/terms" target="_blank" className="text-popo-pink hover:underline font-bold">
                          استعمال کی شرائط
                        </Link>{' '}
                        اور{' '}
                        <Link href="/policies/privacy" target="_blank" className="text-popo-pink hover:underline font-bold">
                          پرائیویسی پالیسی
                        </Link>{' '}
                        سے اتفاق کرتا ہوں۔
                      </>
                    ) : (
                      <>
                        I certify that I am at least 18 years old and I agree to the Popo Live{' '}
                        <Link href="/policies/terms" target="_blank" className="text-popo-pink hover:underline font-bold">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/policies/privacy" target="_blank" className="text-popo-pink hover:underline font-bold">
                          Privacy Policy
                        </Link>
                        .
                      </>
                    )}
                  </span>
                </label>
                {errors.agreeTerms && <span className="text-xs font-medium text-red-400">{errors.agreeTerms}</span>}
              </div>

              {/* Create Account Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full mt-2 font-bold shadow-lg shadow-popo-pink/25"
                leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              >
                {isSubmitting
                  ? isUr ? 'اکاؤنٹ بن رہا ہے...' : 'Creating Account...'
                  : isUr ? 'اکاؤنٹ بنائیں' : 'Create Popo Live Account'}
              </Button>
            </form>
          )}

          {/* Already have an account? Login link */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-300 pt-2 border-t border-white/10">
            <span>{isUr ? 'پہلے سے اکاؤنٹ موجود ہے؟' : 'Already have a Popo Live account?'}</span>
            <Link
              href="/login"
              className="text-popo-pink font-bold hover:underline flex items-center gap-1"
            >
              <span>{isUr ? 'لاگ ان کریں' : 'Log In Here'}</span>
              <LogIn className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full px-4 py-6 text-center text-xs text-gray-400 z-10">
        <span>© 2026 Popo Live Global Inc. All rights reserved.</span>
      </footer>
    </div>
  );
}
