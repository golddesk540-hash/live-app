'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import {
  ArrowLeft,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Info,
} from 'lucide-react';

interface ProviderConfig {
  configured: boolean;
  name: string;
  requiredEnv: string[];
  callbackUrl: string;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, setLang, isUr } = useLanguage();

  // Mode: 'overview' matches 02_02_login_system.png exactly, 'email', 'phone', or 'signup'
  const [activeView, setActiveView] = useState<'overview' | 'email' | 'phone' | 'signup'>('overview');

  // Providers availability from backend
  const [providers, setProviders] = useState<{
    [key: string]: ProviderConfig;
  }>({
    google: { configured: false, name: 'Google', requiredEnv: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'], callbackUrl: '/api/auth/callback/google' },
    facebook: { configured: false, name: 'Facebook', requiredEnv: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'], callbackUrl: '/api/auth/callback/facebook' },
    apple: { configured: false, name: 'Apple', requiredEnv: ['APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID'], callbackUrl: '/api/auth/callback/apple' },
  });

  // Modal for unconfigured social providers
  const [unconfiguredProviderModal, setUnconfiguredProviderModal] = useState<ProviderConfig | null>(null);

  // General error or notification from URL
  const [urlMessage, setUrlMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  // Phone login form state
  const [countryCode, setCountryCode] = useState('+92');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);

  // Sign up form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupNickname, setSignupNickname] = useState('');
  const [signupAdultConfirmed, setSignupAdultConfirmed] = useState(false);
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);

  // Check URL params on mount
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'terms_required') {
      setUrlMessage(
        isUr
          ? 'پہلے سروس کی شرائط اور پرائیویسی پالیسی کو قبول کرنا ضروری ہے۔'
          : 'You must accept the Terms of Service and Privacy Policy before logging in.'
      );
    } else if (errorParam === 'provider_unconfigured') {
      const p = searchParams.get('provider') || 'OAuth';
      setUrlMessage(`${p} OAuth requires credentials in .env.local.`);
    } else if (errorParam) {
      setUrlMessage(decodeURIComponent(errorParam));
    }

    // Fetch active provider statuses
    fetch('/api/auth/providers')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.social) {
          setProviders(data.social);
        }
      })
      .catch((err) => console.error('Error loading auth providers:', err));
  }, [searchParams, isUr]);

  // Countdown timer for Phone OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountingDown && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setIsCountingDown(false);
    }
    return () => clearTimeout(timer);
  }, [isCountingDown, countdown]);

  const countryCodes = [
    { code: '+92', flag: '🇵🇰', name: 'Pakistan (+92)' },
    { code: '+971', flag: '🇦🇪', name: 'UAE (+971)' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia (+966)' },
    { code: '+1', flag: '🇺🇸', name: 'USA / Canada (+1)' },
    { code: '+44', flag: '🇬🇧', name: 'UK (+44)' },
    { code: '+90', flag: '🇹🇷', name: 'Turkey (+90)' },
    { code: '+880', flag: '🇧🇩', name: 'Bangladesh (+880)' },
    { code: '+62', flag: '🇮🇩', name: 'Indonesia (+62)' },
    { code: '+91', flag: '🇮🇳', name: 'India (+91)' },
  ];

  // Social Login Click Handler
  const handleSocialClick = (providerKey: 'google' | 'facebook' | 'apple') => {
    setErrorMessage(null);
    const provider = providers[providerKey];

    if (provider && provider.configured) {
      window.location.href = `/api/auth/${providerKey}`;
    } else {
      setUnconfiguredProviderModal(
        provider || {
          configured: false,
          name: providerKey.toUpperCase(),
          requiredEnv: [`${providerKey.toUpperCase()}_CLIENT_ID`],
          callbackUrl: `/api/auth/callback/${providerKey}`,
        }
      );
    }
  };

  // Handle Email & Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage(isUr ? 'براہ کرم اپنا ای میل ایڈریس درج کریں۔' : 'Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage(isUr ? 'براہ کرم اپنا پاس ورڈ درج کریں۔' : 'Please enter your password.');
      return;
    }

    setIsEmailSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccessMessage(
        isUr
          ? `خوش آمدید ${data.user.nickname}! لاگ ان کامیاب۔`
          : `Welcome back, ${data.user.nickname}! Redirecting...`
      );
      const target = data.user?.isProfileCompleted ? '/' : '/complete-profile';
      setTimeout(() => {
        router.push(target);
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  // Handle Send Phone OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNumber = phoneNumber.replace(/[\s-]/g, '');
    if (!cleanNumber || cleanNumber.length < 6) {
      setErrorMessage(isUr ? 'براہ کرم درست فون نمبر درج کریں۔' : 'Please enter a valid mobile number.');
      return;
    }

    const fullPhone = `${countryCode}${cleanNumber}`;
    setIsOtpSending(true);

    try {
      const res = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setOtpSent(true);
      setIsCountingDown(true);
      setCountdown(60);
      const codeDigits = (data.devOtp || '123456').split('').slice(0, 6);
      setOtpCode(codeDigits);
      setSuccessMessage(
        isUr
          ? `تصدیقی کوڈ (OTP): ${data.devOtp || '123456'}`
          : `Verification Code: ${data.devOtp || '123456'}`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP.');
    } finally {
      setIsOtpSending(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newOtp = [...otpCode];
    newOtp[index] = val;
    setOtpCode(newOtp);

    if (val && index < 5) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const enteredOtp = otpCode.join('');
    if (enteredOtp.length < 6) {
      setErrorMessage(isUr ? 'براہ کرم مکمل ۶ ہندسوں کا کوڈ درج کریں۔' : 'Please enter all 6 digits of the code.');
      return;
    }

    const fullPhone = `${countryCode}${phoneNumber.replace(/[\s-]/g, '')}`;
    setIsOtpVerifying(true);

    try {
      const res = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, otp: enteredOtp, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired verification code');
      }

      setSuccessMessage(
        isUr
          ? `کامیابی! خوش آمدید ${data.user.nickname}`
          : `Success! Welcome to Popo Live, ${data.user.nickname}`
      );
      const target = data.user?.isProfileCompleted ? '/' : '/complete-profile';
      setTimeout(() => {
        router.push(target);
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed.');
    } finally {
      setIsOtpVerifying(false);
    }
  };

  // Handle Register New Account
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signupEmail.trim() || !/^\S+@\S+\.\S+$/.test(signupEmail)) {
      setErrorMessage(isUr ? 'درست ای میل ایڈریس درج کریں۔' : 'Please provide a valid email address.');
      return;
    }
    if (!signupPassword || signupPassword.length < 8) {
      setErrorMessage(isUr ? 'پاس ورڈ کم از کم ۸ حروف پر مشتمل ہونا چاہیے۔' : 'Password must be at least 8 characters long.');
      return;
    }
    if (!signupAdultConfirmed) {
      setErrorMessage(isUr ? 'پوپو لائیو استعمال کرنے کے لیے آپ کی عمر کم از کم ۱۸ سال ہونی چاہیے۔' : 'You must confirm that you are at least 18 years of age.');
      return;
    }

    setIsSignupSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          nickname: signupNickname,
          isAdultConfirmed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      setSuccessMessage(
        isUr
          ? `اکاؤنٹ بن گیا! پوپو آئی ڈی: ${data.user.poppoId}`
          : `Account created successfully! Your Poppo ID: ${data.user.poppoId}`
      );
      setTimeout(() => {
        router.push('/complete-profile');
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setIsSignupSubmitting(false);
    }
  };

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#07040E] text-white flex flex-col justify-between selection:bg-[#FF1A6C] selection:text-white relative overflow-hidden"
    >
      {/* Ambient glowing atmosphere matching 02_02_login_system.png */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] bg-gradient-to-tr from-purple-800/25 via-[#FF1A6C]/20 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[350px] h-[350px] bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 flex items-center justify-between z-10">
        <Link
          href="/"
          className={`flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 ${
            isUr ? 'flex-row-reverse' : ''
          }`}
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
          <span>{isUr ? 'ہوم پیج پر واپس جائیں' : 'Back to Home'}</span>
        </Link>

        {/* Working Language selector */}
        <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              !isUr
                ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('ur')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isUr
                ? 'bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            اردو
          </button>
        </div>
      </header>

      {/* Main Authentication Center Screen */}
      <main className="max-w-[430px] mx-auto w-full px-4 py-6 z-10 my-auto">
        <div className="relative rounded-[32px] sm:rounded-[36px] bg-gradient-to-b from-[#140C29] via-[#0E091E] to-[#0A0614] border border-[#2D1B4E]/90 p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(168,85,247,0.18)] flex flex-col gap-5 text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Subtle top edge glow */}
          <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#FF1A6C] to-transparent opacity-80" />

          {/* Back button within modal if inside sub-forms */}
          {activeView !== 'overview' && (
            <button
              type="button"
              onClick={() => {
                setActiveView('overview');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="self-start -mb-2 flex items-center gap-1.5 text-xs text-purple-300 hover:text-white transition-colors"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${isUr ? 'rotate-180' : ''}`} />
              <span>{isUr ? 'لاگ ان کے اختیارات' : 'All Sign-In Options'}</span>
            </button>
          )}

          {/* Logo & Header (Directly from 02_02_login_system.png) */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative mb-1">
              <div className="absolute inset-0 bg-[#FF1A6C] blur-md opacity-60 rounded-full" />
              <svg
                className="relative w-12 h-12 text-[#FF1A6C]"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M50 82C50 82 18 58 18 36C18 24 28 16 40 16C46 16 50 19 50 19C50 19 54 16 60 16C72 16 82 24 82 36C82 58 50 82 50 82Z"
                  stroke="url(#loginHeartGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M38 42C44 50 56 50 62 42"
                  stroke="url(#loginHeartGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="loginHeartGrad" x1="18" y1="16" x2="82" y2="82" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF2E93" />
                    <stop offset="1" stopColor="#E0125C" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h2 className="text-sm font-bold tracking-wide text-gray-300 uppercase">
              Popo Live
            </h2>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeView === 'signup'
                ? isUr ? 'نیا اکاؤنٹ بنائیں' : 'Create Popo Account'
                : isUr ? 'پوپو لائیو میں خوش آمدید' : 'Welcome to Popo Live'}
            </h1>

            <p className="text-xs text-[#B3A8C7] leading-relaxed">
              {isUr ? 'جڑیں، اسٹریم کریں اور سب کے ساتھ لطف اندوز ہوں' : 'Connect, Stream and Enjoy Together.'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {urlMessage && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{urlMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-left flex items-start gap-2 animate-in zoom-in-95">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 1: OVERVIEW (MATCHES 02_02_login_system.png 100%)       */}
          {/* ============================================================ */}
          {activeView === 'overview' && (
            <div className="flex flex-col gap-3 my-1">
              {/* 1. Continue with Google */}
              <button
                type="button"
                onClick={() => handleSocialClick('google')}
                className="flex items-center justify-center gap-3 w-full py-3.5 px-5 rounded-2xl bg-[#1C1333] hover:bg-[#251A43] border border-white/10 hover:border-purple-400/40 text-white font-bold text-xs sm:text-sm transition-all transform active:scale-[0.99] shadow-md"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12s.45 3.86 1.24 5.42l4.04-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>{isUr ? 'گوگل کے ساتھ جاری رکھیں' : 'Continue with Google'}</span>
              </button>

              {/* 2. Continue with Facebook */}
              <button
                type="button"
                onClick={() => handleSocialClick('facebook')}
                className="flex items-center justify-center gap-3 w-full py-3.5 px-5 rounded-2xl bg-[#1C1333] hover:bg-[#251A43] border border-white/10 hover:border-purple-400/40 text-white font-bold text-xs sm:text-sm transition-all transform active:scale-[0.99] shadow-md"
              >
                <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>{isUr ? 'فیس بک کے ساتھ جاری رکھیں' : 'Continue with Facebook'}</span>
              </button>

              {/* 3. Continue with Apple */}
              <button
                type="button"
                onClick={() => handleSocialClick('apple')}
                className="flex items-center justify-center gap-3 w-full py-3.5 px-5 rounded-2xl bg-[#1C1333] hover:bg-[#251A43] border border-white/10 hover:border-purple-400/40 text-white font-bold text-xs sm:text-sm transition-all transform active:scale-[0.99] shadow-md"
              >
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.64-.78 1.08-1.87.96-2.97-1 .04-2.14.64-2.81 1.42-.58.68-1.09 1.78-.96 2.85 1.12.09 2.19-.55 2.81-1.3" />
                </svg>
                <span>{isUr ? 'ایپل کے ساتھ جاری رکھیں' : 'Continue with Apple'}</span>
              </button>

              {/* Divider "Or" */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0E091E] px-3 text-gray-500 font-medium">Or</span>
                </div>
              </div>

              {/* 4. Login with Email */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('email');
                  setErrorMessage(null);
                }}
                className="flex items-center justify-center gap-3 w-full py-3.5 px-5 rounded-2xl bg-[#1C1333] hover:bg-[#251A43] border border-white/10 hover:border-pink-500/40 text-white font-bold text-xs sm:text-sm transition-all transform active:scale-[0.99] shadow-md"
              >
                <Mail className="w-4 h-4 text-purple-300" />
                <span>{isUr ? 'ای میل کے ذریعے لاگ ان کریں' : 'Login with Email'}</span>
              </button>

              {/* 5. Login with Phone */}
              <button
                type="button"
                onClick={() => {
                  setActiveView('phone');
                  setErrorMessage(null);
                }}
                className="flex items-center justify-center gap-3 w-full py-3.5 px-5 rounded-2xl bg-[#1C1333] hover:bg-[#251A43] border border-white/10 hover:border-pink-500/40 text-white font-bold text-xs sm:text-sm transition-all transform active:scale-[0.99] shadow-md"
              >
                <Smartphone className="w-4 h-4 text-pink-400" />
                <span>{isUr ? 'فون نمبر کے ذریعے لاگ ان کریں' : 'Login with Phone'}</span>
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 2: EMAIL LOGIN FORM                                     */}
          {/* ============================================================ */}
          {activeView === 'email' && (
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  {isUr ? 'ای میل ایڈریس' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-[#18102E] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C] focus:ring-1 focus:ring-[#FF1A6C] transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  {isUr ? 'پاس ورڈ' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#18102E] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C] focus:ring-1 focus:ring-[#FF1A6C] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/40 text-[#FF1A6C] focus:ring-[#FF1A6C]"
                  />
                  <span>{isUr ? 'مجھے یاد رکھیں' : 'Remember Me'}</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[#FF4A8B] hover:underline font-semibold"
                >
                  {isUr ? 'پاس ورڈ بھول گئے؟' : 'Forgot Password?'}
                </Link>
              </div>

              <button
                type="submit"
                disabled={isEmailSubmitting}
                className="w-full mt-2 py-3.5 px-6 rounded-full font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#FF1A6C] via-[#FF2E80] to-[#E0125C] shadow-[0_8px_25px_rgba(255,26,108,0.4)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isEmailSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isUr ? 'لاگ ان ہو رہا ہے...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <span>{isUr ? 'لاگ ان کریں' : 'Log In with Email'}</span>
                )}
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* VIEW 3: PHONE & OTP LOGIN FORM                               */}
          {/* ============================================================ */}
          {activeView === 'phone' && (
            <div className="text-left">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      {isUr ? 'موبائل فون نمبر' : 'Mobile Phone Number'}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-32 bg-[#18102E] text-white text-xs rounded-xl px-2.5 py-2.5 border border-white/10 outline-none focus:border-[#FF1A6C]"
                      >
                        {countryCodes.map((c) => (
                          <option key={c.code} value={c.code} className="bg-[#120B24] text-white">
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="300 1234567"
                        required
                        className="flex-1 bg-[#18102E] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C] focus:ring-1 focus:ring-[#FF1A6C]"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    {isUr
                      ? 'ہم آپ کے فون پر ۶ ہندسوں کا ون ٹائم تصدیقی کوڈ بھیجیں گے۔'
                      : 'We will send a 6-digit one-time verification code to your phone.'}
                  </p>

                  <button
                    type="submit"
                    disabled={isOtpSending}
                    className="w-full mt-2 py-3.5 px-6 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#FF1A6C] via-[#FF2E80] to-[#E0125C] shadow-[0_8px_25px_rgba(255,26,108,0.4)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    {isOtpSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isUr ? 'کوڈ بھیجا جا رہا ہے...' : 'Sending Code...'}</span>
                      </>
                    ) : (
                      <span>{isUr ? 'او ٹی پی کوڈ حاصل کریں' : 'Send Verification OTP'}</span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4 text-center">
                  <div className="text-xs text-gray-300">
                    <span>{isUr ? 'کوڈ بھیجا گیا برائے: ' : 'Enter 6-digit code sent to: '}</span>
                    <strong className="text-white font-mono">{countryCode} {phoneNumber}</strong>
                  </div>

                  {/* 6-Digit OTP inputs */}
                  <div className="flex items-center justify-center gap-2 my-2" dir="ltr">
                    {otpCode.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`login-otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        className="w-10 h-12 text-center text-lg font-bold font-mono bg-[#18102E] text-white rounded-xl border border-white/15 focus:border-[#FF1A6C] focus:ring-2 focus:ring-[#FF1A6C]/30 outline-none"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                    <span>
                      {isCountingDown ? (
                        <>Resend in <strong className="text-white font-mono">{countdown}s</strong></>
                      ) : (
                        <span>Code expired</span>
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={isCountingDown}
                      onClick={handleSendOtp}
                      className="text-[#FF4A8B] hover:underline disabled:text-gray-600 disabled:no-underline font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isUr ? 'دوبارہ کوڈ بھیجیں' : 'Resend Code'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isOtpVerifying}
                    className="w-full mt-2 py-3.5 px-6 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#FF1A6C] via-[#FF2E80] to-[#E0125C] shadow-[0_8px_25px_rgba(255,26,108,0.4)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    {isOtpVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isUr ? 'تصدیق ہو رہی ہے...' : 'Verifying...'}</span>
                      </>
                    ) : (
                      <span>{isUr ? 'تصدیق کریں اور لاگ ان ہوں' : 'Verify & Sign In'}</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 4: SIGN UP / REGISTRATION FORM                          */}
          {/* ============================================================ */}
          {activeView === 'signup' && (
            <form onSubmit={handleSignup} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  {isUr ? 'ای میل ایڈریس *' : 'Email Address *'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-[#18102E] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  {isUr ? 'نک نیم (اختیاری)' : 'Nickname (Optional)'}
                </label>
                <input
                  type="text"
                  value={signupNickname}
                  onChange={(e) => setSignupNickname(e.target.value)}
                  placeholder="e.g. StarCreator"
                  className="w-full bg-[#18102E] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  {isUr ? 'پاس ورڈ (کم از کم ۸ حروف) *' : 'Password (Min 8 chars) *'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full bg-[#18102E] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Age Confirmation Requirement Checkbox */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer text-xs text-amber-200">
                <input
                  type="checkbox"
                  checked={signupAdultConfirmed}
                  onChange={(e) => setSignupAdultConfirmed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-amber-500/40 bg-black/40 text-amber-500 focus:ring-amber-500"
                />
                <span>
                  {isUr
                    ? 'میں تصدیق کرتا ہوں کہ میری عمر ۱۸ سال یا اس سے زیادہ ہے۔'
                    : 'I confirm that I am at least 18 years of age to use Popo Live.'}
                </span>
              </label>

              <button
                type="submit"
                disabled={isSignupSubmitting}
                className="w-full mt-2 py-3.5 px-6 rounded-full font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#FF1A6C] via-[#FF2E80] to-[#E0125C] shadow-[0_8px_25px_rgba(255,26,108,0.4)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isSignupSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isUr ? 'اکاؤنٹ بن رہا ہے...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <span>{isUr ? 'اکاؤنٹ رجسٹر کریں' : 'Register Account'}</span>
                )}
              </button>
            </form>
          )}

          {/* Don't have an account? Sign Up footer (Direct from 02_02_login_system.png) */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            {activeView === 'signup' ? (
              <>
                <span>{isUr ? 'پہلے سے اکاؤنٹ موجود ہے؟' : 'Already have an account?'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('overview');
                    setErrorMessage(null);
                  }}
                  className="text-[#FF1A6C] font-bold hover:underline"
                >
                  {isUr ? 'لاگ ان کریں' : 'Log In'}
                </button>
              </>
            ) : (
              <>
                <span>{isUr ? 'اکاؤنٹ موجود نہیں ہے؟' : "Don't have an account?"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('signup');
                    setErrorMessage(null);
                  }}
                  className="text-[#FF1A6C] font-bold hover:underline"
                >
                  {isUr ? 'سائن اپ کریں' : 'Sign Up'}
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full px-4 py-5 text-center text-xs text-gray-500 z-10">
        <span>© 2026 Popo Live Global Inc. All rights reserved. Strict 18+ Entertainment Platform.</span>
      </footer>

      {/* ============================================================ */}
      {/* MODAL: UNCONFIGURED OAUTH PROVIDER CREDENTIALS NOTICE        */}
      {/* ============================================================ */}
      {unconfiguredProviderModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-[#130B26] border border-purple-500/40 rounded-3xl p-6 shadow-2xl text-white">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
              <Info className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-white mb-2">
              {unconfiguredProviderModal.name} OAuth Configuration
            </h3>

            <p className="text-xs text-gray-300 leading-relaxed text-center mb-4">
              {isUr
                ? `سوشل لاگ ان محفوظ طریقے سے کنفیگر ہے۔ ${unconfiguredProviderModal.name} لاگ ان کو چالو کرنے کے لیے .env.local فائل میں ڈویلپر کریڈینشلز درج کریں۔`
                : `OAuth handler is built and secured. To initiate live sign-in with ${unconfiguredProviderModal.name}, provide your credentials in .env.local:`}
            </p>

            <div className="bg-[#0A0614] rounded-xl p-3 border border-white/10 text-xs font-mono space-y-1.5 text-left mb-4">
              {unconfiguredProviderModal.requiredEnv.map((envVar) => (
                <div key={envVar} className="text-pink-400">
                  {envVar}=your_{envVar.toLowerCase()}
                </div>
              ))}
              <div className="text-gray-500 pt-1 text-[11px]">
                # Callback URL: {unconfiguredProviderModal.callbackUrl}
              </div>
            </div>

            <p className="text-[11px] text-gray-400 text-center mb-5">
              Email and Phone OTP logins are currently active and ready for use!
            </p>

            <button
              type="button"
              onClick={() => setUnconfiguredProviderModal(null)}
              className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#E0125C] text-white font-bold text-xs sm:text-sm shadow-md"
            >
              {isUr ? 'سمجھ گیا / بند کریں' : 'Understood, Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07040E] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF1A6C]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
