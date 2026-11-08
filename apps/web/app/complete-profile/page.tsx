'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import { COUNTRIES_LIST, CountryItem } from '@/lib/countries';
import {
  ArrowLeft,
  Camera,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  ChevronRight,
  X,
  Trash2,
  Sparkles,
} from 'lucide-react';

function CompleteProfileContent() {
  const router = useRouter();
  const { lang, setLang, isUr } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading & session states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [nickname, setNickname] = useState('PopoUser');
  const [nicknameStatus, setNicknameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  const [birthdate, setBirthdate] = useState('2000-01-01');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(26);

  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(COUNTRIES_LIST[0]); // Pakistan
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState<string>('/avatars/default.png');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // 1. Fetch current profile state on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile/setup', { cache: 'no-store' });
        if (res.status === 401) {
          router.push('/login?error=auth_required');
          return;
        }

        const data = await res.json();
        if (data.user) {
          if (data.user.nickname && data.user.nickname !== 'Poppo Streamer') {
            setNickname(data.user.nickname);
          }
          if (data.user.birthdate) {
            setBirthdate(data.user.birthdate);
          }
          if (data.user.gender && ['male', 'female', 'other'].includes(data.user.gender)) {
            setGender(data.user.gender as any);
          }
          if (data.user.country) {
            const match = COUNTRIES_LIST.find((c) => c.name.toLowerCase() === data.user.country.toLowerCase());
            if (match) setSelectedCountry(match);
          }
          if (data.user.avatarUrl) {
            setAvatarUrl(data.user.avatarUrl);
          }
        }
      } catch (err) {
        console.error('Failed to load profile state:', err);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadProfile();
  }, [router]);

  // 2. Debounced Nickname Availability Checker
  useEffect(() => {
    if (!nickname.trim()) {
      setNicknameStatus({ checking: false, available: false, message: 'Nickname is required.' });
      return;
    }

    if (nickname.trim().length < 3) {
      setNicknameStatus({ checking: false, available: false, message: 'Minimum 3 characters.' });
      return;
    }

    if (nickname.trim().length > 20) {
      setNicknameStatus({ checking: false, available: false, message: 'Maximum 20 characters.' });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(nickname.trim())) {
      setNicknameStatus({ checking: false, available: false, message: 'Only letters, numbers, and _ are allowed.' });
      return;
    }

    setNicknameStatus({ checking: true });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/check-nickname?nickname=${encodeURIComponent(nickname.trim())}`);
        const data = await res.json();
        setNicknameStatus({
          checking: false,
          available: data.available,
          message: data.reason,
        });
      } catch (err) {
        setNicknameStatus({ checking: false, available: true });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [nickname]);

  // 3. Calculate Age whenever birthdate changes
  useEffect(() => {
    if (!birthdate) {
      setCalculatedAge(null);
      return;
    }
    const b = new Date(birthdate);
    if (isNaN(b.getTime())) {
      setCalculatedAge(null);
      return;
    }
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) {
      age--;
    }
    setCalculatedAge(age);
  }, [birthdate]);

  // 4. Handle Profile Picture Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(isUr ? 'صرف تصویری فائلیں اپلوڈ کی جا سکتی ہیں۔' : 'Only image files are permitted.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(isUr ? 'تصویر کا سائز ۵ ایم بی سے کم ہونا چاہیے۔' : 'File size must be under 5MB.');
      return;
    }

    setAvatarUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      setAvatarUrl(data.avatarUrl);
      setSuccessMessage(isUr ? 'تصویر کامیابی سے اپلوڈ ہو گئی!' : 'Profile picture uploaded!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // 5. Handle Remove Profile Picture
  const handleRemoveAvatar = async () => {
    try {
      setAvatarUploading(true);
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
      const data = await res.json();
      setAvatarUrl(data.avatarUrl || '/avatars/default.png');
    } catch (err) {
      console.error('Failed to reset avatar:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  // 6. Handle Profile Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nickname.trim() || nickname.trim().length < 3) {
      setErrorMessage(isUr ? 'براہ کرم ۳ سے ۲۰ حروف کا نک نیم درج کریں۔' : 'Please choose a valid nickname (3-20 characters).');
      return;
    }

    if (nicknameStatus.available === false) {
      setErrorMessage(nicknameStatus.message || 'Please choose an available nickname.');
      return;
    }

    if (!birthdate) {
      setErrorMessage(isUr ? 'براہ کرم تاریخ پیدائش منتخب کریں۔' : 'Please select your birthdate.');
      return;
    }

    if (calculatedAge === null || calculatedAge < 18) {
      setErrorMessage(
        isUr
          ? 'پوپو لائیو استعمال کرنے کے لیے آپ کی عمر کم از کم ۱۸ سال ہونی چاہیے۔'
          : 'You must be at least 18 years of age to register on Popo Live.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          birthdate,
          gender,
          country: selectedCountry.name,
          countryCode: selectedCountry.code,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile details.');
      }

      setSuccessMessage(
        isUr
          ? 'پروفائل کامیابی کے ساتھ مکمل ہو گیا! براہ راست سٹریمنگ میں خوش آمدید۔'
          : 'Profile successfully completed! Welcome to Popo Live.'
      );

      setTimeout(() => {
        router.push('/user-id');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter countries for modal search
  const filteredCountries = COUNTRIES_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#07040E] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF1A6C]" />
      </div>
    );
  }

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#07040E] text-white flex flex-col justify-between selection:bg-[#FF1A6C] selection:text-white relative overflow-hidden"
    >
      {/* Ambient background glow flares matching 02_03_new_user_details.png */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[550px] sm:h-[700px] bg-gradient-to-tr from-purple-900/30 via-[#FF1A6C]/20 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-[320px] h-[320px] bg-pink-600/15 rounded-full blur-[110px] pointer-events-none" />

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

      {/* Main Container Card: Matches 02_03_new_user_details.png */}
      <main className="max-w-[420px] sm:max-w-[450px] mx-auto w-full px-4 py-6 z-10 my-auto">
        <div className="relative rounded-[32px] sm:rounded-[36px] bg-gradient-to-b from-[#140C29] via-[#0E091E] to-[#0A0614] border border-[#2D1B4E]/90 p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(168,85,247,0.18)] flex flex-col gap-5 text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Subtle top edge glow */}
          <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#FF1A6C] to-transparent opacity-80" />

          {/* Heading and Subtitle */}
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isUr ? 'اپنا پروفائل مکمل کریں' : 'Complete Your Profile'}
            </h1>
            <p className="text-xs sm:text-sm text-[#B3A8C7]">
              {isUr ? 'شروع کرنے کے لیے اپنا پروفائل سیٹ اپ کریں۔' : 'Set up your profile to get started.'}
            </p>
          </div>

          {/* Feedback Alerts */}
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

          {/* 1. Profile Picture / Avatar Section (Centered Circle with Camera Badge) */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              {/* Outer glowing ring */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] bg-gradient-to-tr from-[#9333EA] via-[#FF1A6C] to-[#4F46E5] shadow-[0_0_25px_rgba(255,26,108,0.35)] flex items-center justify-center overflow-hidden">
                <div className="w-full h-full rounded-full bg-[#18102E] flex items-center justify-center overflow-hidden relative">
                  {avatarUrl && avatarUrl !== '/avatars/default.png' ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Default Silhouette */
                    <svg className="w-14 h-14 text-purple-300/80" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M12 2a5 5 0 100 10 5 5 0 000-10zM4 21v-2a7 7 0 0114 0v2H4z" clipRule="evenodd" />
                    </svg>
                  )}

                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Camera Badge Button (Matches bottom-right icon in screenshot) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                title={isUr ? 'تصویر تبدیل کریں' : 'Change Profile Picture'}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1F143D] border-2 border-[#FF1A6C] hover:bg-[#FF1A6C] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Change / Remove picture controls */}
            {avatarUrl && avatarUrl !== '/avatars/default.png' && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-[11px] text-gray-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isUr ? 'تصویر ہٹائیں' : 'Remove Photo'}</span>
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            {/* 2. Nickname Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                <label htmlFor="profile-nickname">{isUr ? 'نک نیم' : 'Nickname'}</label>
                <span className="text-[11px] text-gray-500 font-mono">
                  {nickname.length}/20
                </span>
              </div>
              <div className="relative">
                <input
                  id="profile-nickname"
                  type="text"
                  value={nickname}
                  maxLength={20}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="PopoUser"
                  required
                  className={`w-full bg-[#18102E] border rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none transition-all ${
                    nicknameStatus.available === true
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : nicknameStatus.available === false
                      ? 'border-rose-500/50 focus:border-rose-500'
                      : 'border-white/10 focus:border-[#FF1A6C]'
                  }`}
                />
                <div className="absolute right-3.5 top-3.5 flex items-center">
                  {nicknameStatus.checking ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  ) : nicknameStatus.available === true ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : nicknameStatus.available === false ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : null}
                </div>
              </div>
              {nicknameStatus.message && (
                <span
                  className={`text-[11px] ${
                    nicknameStatus.available ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {nicknameStatus.message}
                </span>
              )}
            </div>

            {/* 3. Date of Birth Field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
                <label htmlFor="profile-dob">{isUr ? 'تاریخ پیدائش' : 'Date of Birth'}</label>
                {calculatedAge !== null && (
                  <span
                    className={`text-[11px] font-semibold ${
                      calculatedAge >= 18 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUr
                      ? `عمر: ${calculatedAge} سال ${calculatedAge >= 18 ? '(۱۸+ تصدیق شدہ)' : '(نابالغ - ممنوع)'}`
                      : `Age: ${calculatedAge} ${calculatedAge >= 18 ? '(18+ Verified)' : '(Under 18 - Prohibited)'}`}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="profile-dob"
                  type="date"
                  value={birthdate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBirthdate(e.target.value)}
                  required
                  className="w-full bg-[#18102E] border border-white/10 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C] transition-all pr-12 [color-scheme:dark]"
                />
                <div className="absolute right-3.5 top-3 pointer-events-none p-1.5 rounded-lg bg-pink-500/15 text-[#FF1A6C]">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* 4. Gender Selection (Matches Pill Switcher in 02_03_new_user_details.png) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300">
                {isUr ? 'جنس' : 'Gender'}
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-[#0E091E] rounded-2xl border border-white/10">
                {/* Male */}
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    gender === 'male'
                      ? 'bg-gradient-to-r from-[#FF1A6C]/80 via-[#9333EA]/80 to-[#FF1A6C]/80 text-white shadow-[0_0_15px_rgba(255,26,108,0.4)] border border-[#FF1A6C]/60'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      gender === 'male' ? 'bg-white shadow-[0_0_8px_#FFF]' : 'bg-gray-500'
                    }`}
                  />
                  <span>{isUr ? 'مرد' : 'Male'}</span>
                </button>

                {/* Female */}
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    gender === 'female'
                      ? 'bg-gradient-to-r from-[#FF1A6C]/80 via-[#9333EA]/80 to-[#FF1A6C]/80 text-white shadow-[0_0_15px_rgba(255,26,108,0.4)] border border-[#FF1A6C]/60'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      gender === 'female' ? 'bg-white shadow-[0_0_8px_#FFF]' : 'bg-gray-500'
                    }`}
                  />
                  <span>{isUr ? 'عورت' : 'Female'}</span>
                </button>

                {/* Other */}
                <button
                  type="button"
                  onClick={() => setGender('other')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    gender === 'other'
                      ? 'bg-gradient-to-r from-[#FF1A6C]/80 via-[#9333EA]/80 to-[#FF1A6C]/80 text-white shadow-[0_0_15px_rgba(255,26,108,0.4)] border border-[#FF1A6C]/60'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      gender === 'other' ? 'bg-white shadow-[0_0_8px_#FFF]' : 'bg-gray-500'
                    }`}
                  />
                  <span>{isUr ? 'دیگر' : 'Other'}</span>
                </button>
              </div>
            </div>

            {/* 5. Country Selection Field (Matches Pakistan > in 02_03_new_user_details.png) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300">
                {isUr ? 'ملک' : 'Country'}
              </label>
              <button
                type="button"
                onClick={() => setCountryModalOpen(true)}
                className="w-full bg-[#18102E] hover:bg-[#1E1438] border border-white/10 rounded-2xl px-4 py-3.5 flex items-center justify-between text-xs sm:text-sm text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{selectedCountry.flag}</span>
                  <span className="font-semibold text-white">{selectedCountry.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* 6. Continue Button */}
            <button
              type="submit"
              disabled={isSubmitting || nicknameStatus.available === false || (calculatedAge !== null && calculatedAge < 18)}
              className="w-full mt-2 py-4 px-6 rounded-full font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#FF1A6C] via-[#FF2E80] to-[#E0125C] shadow-[0_8px_25px_rgba(255,26,108,0.45)] hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isUr ? 'پروفائل محفوظ ہو رہا ہے...' : 'Saving Profile...'}</span>
                </>
              ) : (
                <span>{isUr ? 'جاری رکھیں' : 'Continue'}</span>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full px-4 py-5 text-center text-xs text-gray-500 z-10">
        <span>© 2026 Popo Live Global Inc. All rights reserved.</span>
      </footer>

      {/* ============================================================ */}
      {/* COUNTRY SELECTION SEARCH MODAL                               */}
      {/* ============================================================ */}
      {countryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-[#130B26] border border-purple-500/40 rounded-3xl p-5 shadow-2xl text-white flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-base text-white">
                {isUr ? 'اپنا ملک منتخب کریں' : 'Select Your Country'}
              </h3>
              <button
                type="button"
                onClick={() => setCountryModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative my-3">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder={isUr ? 'ملک تلاش کریں...' : 'Search country...'}
                className="w-full bg-[#18102E] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#FF1A6C]"
              />
            </div>

            {/* Countries List */}
            <div className="overflow-y-auto space-y-1 pr-1 flex-1">
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(c);
                    setCountryModalOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors ${
                    selectedCountry.code === c.code
                      ? 'bg-[#FF1A6C]/20 border border-[#FF1A6C]/50 text-white font-bold'
                      : 'hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.flag}</span>
                    <span>{c.name}</span>
                  </div>
                  <span className="text-gray-500 font-mono text-[11px]">{c.phoneCode}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-500">
                  {isUr ? 'کوئی ملک نہیں ملا' : 'No countries found.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07040E] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF1A6C]" />
        </div>
      }
    >
      <CompleteProfileContent />
    </Suspense>
  );
}
