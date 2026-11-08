'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/languageContext';
import { COUNTRIES_LIST, CountryItem } from '@/lib/countries';
import { AvatarCropperModal } from '@/components/profile/AvatarCropperModal';
import {
  ArrowLeft,
  Camera,
  Trash2,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  ChevronRight,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

function EditProfileContent() {
  const router = useRouter();
  const { lang, isUr } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial loading & status
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [poppoId, setPoppoId] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/avatars/default.png');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [selectedCountry, setSelectedCountry] = useState<CountryItem>(COUNTRIES_LIST[0]);

  // Nickname live validation
  const [nicknameStatus, setNicknameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });
  const [initialNickname, setInitialNickname] = useState('');

  // Country modal
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Cropper modal
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);

  // 1. Fetch user data on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/profile/me', { cache: 'no-store' });
        if (res.status === 401) {
          router.push('/login?redirect=/profile/edit');
          return;
        }

        const data = await res.json();
        if (data.user) {
          setPoppoId(data.user.poppoId || '');
          setBirthdate(data.user.birthdate || 'Not specified');
          setAvatarUrl(data.user.avatarUrl || '/avatars/default.png');
          setNickname(data.user.nickname || '');
          setInitialNickname(data.user.nickname || '');
          setBio(data.user.bio || '');

          if (data.user.gender && ['male', 'female', 'other'].includes(data.user.gender)) {
            setGender(data.user.gender as any);
          }

          if (data.user.country) {
            const match = COUNTRIES_LIST.find(
              (c) => c.name.toLowerCase() === data.user.country.toLowerCase()
            );
            if (match) setSelectedCountry(match);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setErrorMessage('Failed to load profile data.');
      } finally {
        setLoadingInitial(false);
      }
    }

    loadUser();
  }, [router]);

  // 2. Debounce nickname check
  useEffect(() => {
    if (!nickname || nickname.trim() === '') {
      setNicknameStatus({ checking: false, available: false, message: 'Nickname cannot be empty.' });
      return;
    }

    if (nickname.trim().length < 3) {
      setNicknameStatus({ checking: false, available: false, message: 'Must be at least 3 characters.' });
      return;
    }

    if (nickname.trim() === initialNickname) {
      setNicknameStatus({ checking: false, available: true, message: 'Current nickname' });
      return;
    }

    const timer = setTimeout(async () => {
      setNicknameStatus({ checking: true });
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
    }, 400);

    return () => clearTimeout(timer);
  }, [nickname, initialNickname]);

  // 3. Avatar file selection & crop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected if needed
    e.target.value = '';

    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(file.type.toLowerCase())) {
      setErrorMessage(isUr ? 'صرف JPG، PNG یا WebP تصاویر کی اجازت ہے۔' : 'Only JPG, PNG, or WebP images are permitted.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(isUr ? 'تصویر کا سائز 5MB سے زیادہ نہیں ہونا چاہیے۔' : 'File size must not exceed 5MB.');
      return;
    }

    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImageSrc(reader.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBase64: string) => {
    const res = await fetch('/api/profile/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: croppedBase64 }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload cropped avatar.');
    }

    setAvatarUrl(data.avatarUrl);
    setSuccessMessage(isUr ? 'پروفائل تصویر کامیابی سے تبدیل ہوگئی۔' : 'Profile picture updated successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRemoveAvatar = async () => {
    if (!confirm(isUr ? 'کیا آپ واقعی پروفائل تصویر ہٹانا چاہتے ہیں؟' : 'Are you sure you want to remove your profile picture?')) {
      return;
    }

    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setAvatarUrl(data.avatarUrl || '/avatars/default.png');
        setSuccessMessage(isUr ? 'پروفائل تصویر ہٹا دی گئی۔' : 'Profile picture reset to default.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setErrorMessage('Failed to remove profile picture.');
    }
  };

  // 4. Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!nickname.trim() || nickname.trim().length < 3) {
      setErrorMessage(isUr ? 'براہ کرم 3 سے 30 حروف کا درست نام درج کریں۔' : 'Please provide a valid nickname (3-30 characters).');
      return;
    }

    if (nicknameStatus.available === false && nickname.trim() !== initialNickname) {
      setErrorMessage(nicknameStatus.message || 'Nickname is not available.');
      return;
    }

    if (bio.trim().length > 500) {
      setErrorMessage(isUr ? 'بائیو 500 حروف سے زیادہ نہیں ہو سکتی۔' : 'Bio cannot exceed 500 characters.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          country: selectedCountry.name,
          countryCode: selectedCountry.code,
          gender,
          bio: bio.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update profile.');
        return;
      }

      setSuccessMessage(isUr ? 'پروفائل کامیابی سے اپ ڈیٹ ہوگئی!' : 'Profile updated successfully!');
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error while saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCountries = COUNTRIES_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#0A071E] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
          <p className="text-xs text-white/60">{isUr ? 'پروفائل لوڈ ہو رہی ہے...' : 'Loading profile...'}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A071E] via-[#0E0A28] to-[#140D36] text-white py-6 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isUr ? 'پروفائل پر واپس جائیں' : 'Back to Profile'}</span>
          </Link>
          <h1 className="text-base font-bold bg-gradient-to-r from-white via-pink-100 to-[#FF2E74] bg-clip-text text-transparent">
            {isUr ? 'پروفائل میں ترمیم کریں' : 'Edit Profile'}
          </h1>
          <div className="w-16" />
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Management Card */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 shadow-xl backdrop-blur-md flex flex-col items-center">
            <div className="relative group">
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-[#FF2E74] shadow-[0_0_30px_rgba(255,46,116,0.4)] bg-[#0A061C]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Upload trigger button overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white cursor-pointer"
              >
                <Camera className="w-6 h-6 text-[#FF2E74]" />
                <span className="text-[10px] font-bold">{isUr ? 'تبدیل کریں' : 'Change'}</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF2E74] to-[#A855F7] text-white text-xs font-bold hover:brightness-110 shadow-md shadow-[#FF2E74]/20 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isUr ? 'نئی تصویر لگائیں' : 'Upload New Photo'}</span>
              </button>

              {avatarUrl && avatarUrl !== '/avatars/default.png' && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 text-xs font-medium border border-white/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isUr ? 'تصویر ہٹائیں' : 'Remove'}</span>
                </button>
              )}
            </div>

            <p className="mt-2 text-[11px] text-white/50 text-center">
              {isUr
                ? 'JPG، PNG یا WebP (زیادہ سے زیادہ 5MB)۔ کراپ اور زوم کی سہولت دستیاب ہے۔'
                : 'JPG, PNG, or WebP (max 5MB). Image crop and zoom adjustment supported.'}
            </p>
          </div>

          {/* Form Fields Card */}
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 shadow-xl backdrop-blur-md space-y-5">
            {/* Read-Only Permanent User ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#FF2E74]" />
                  <span>{isUr ? 'پوپو لائیو یوزر آئی ڈی (مستقل)' : 'Popo Live User ID (Permanent)'}</span>
                </label>
                <span className="text-[10px] text-white/40 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>{isUr ? 'ناقابلِ تبدیلی' : 'Cannot be changed'}</span>
                </span>
              </div>
              <div className="w-full px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/10 text-white/50 font-mono text-sm flex items-center justify-between select-none">
                <span>{poppoId || 'Generating...'}</span>
                <span className="text-[10px] uppercase font-sans tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/60">
                  Fixed
                </span>
              </div>
            </div>

            {/* Nickname Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/80">
                  {isUr ? 'نک نیم (سٹریمر نام)' : 'Nickname (Display Name)'}
                </label>
                <span className="text-[11px] text-white/50">{nickname.length}/30</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={30}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Sara Khan"
                  className={`w-full px-4 py-3 rounded-2xl bg-white/5 border text-sm text-white focus:outline-none transition-all ${
                    nicknameStatus.available === false
                      ? 'border-red-500/50 focus:border-red-500'
                      : nicknameStatus.available === true
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-white/15 focus:border-[#FF2E74]'
                  }`}
                />
                {nicknameStatus.checking && (
                  <div className="absolute right-3.5 top-3.5">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FF2E74]" />
                  </div>
                )}
              </div>
              {nicknameStatus.message && (
                <p
                  className={`mt-1.5 text-[11px] ${
                    nicknameStatus.available === false
                      ? 'text-red-400'
                      : nicknameStatus.available === true
                      ? 'text-emerald-400'
                      : 'text-white/60'
                  }`}
                >
                  {nicknameStatus.message}
                </p>
              )}
            </div>

            {/* Short Bio Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/80">
                  {isUr ? 'مختصر بائیو (Bio)' : 'Short Bio'}
                </label>
                <span className="text-[11px] text-white/50">{bio.length}/500</span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={
                  isUr
                    ? 'اپنے لائیو سٹریم، مشاغل اور اوقات کے بارے میں بتائیں...'
                    : 'Tell the Popo Live community about your streams, schedule, music, hobbies...'
                }
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF2E74] transition-all resize-none"
              />
            </div>

            {/* Country Selector */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'ملک' : 'Country'}
              </label>
              <button
                type="button"
                onClick={() => setCountryModalOpen(true)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 hover:border-white/30 text-sm text-white flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="font-medium">{selectedCountry.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/50" />
              </button>
            </div>

            {/* Gender Selector */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                {isUr ? 'جنس' : 'Gender'}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'male', label: isUr ? 'مرد' : 'Male', symbol: '♂', color: 'text-cyan-400' },
                  { id: 'female', label: isUr ? 'عورت' : 'Female', symbol: '♀', color: 'text-pink-400' },
                  { id: 'other', label: isUr ? 'دیگر' : 'Other', symbol: '⚧', color: 'text-purple-400' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGender(item.id as any)}
                    className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      gender === item.id
                        ? 'bg-gradient-to-r from-[#FF2E74]/20 to-[#A855F7]/20 border-[#FF2E74] text-white shadow-md shadow-[#FF2E74]/20'
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className={item.color}>{item.symbol}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Read-Only Birthday */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#FF2E74]" />
                  <span>{isUr ? 'تاریخ پیدائش (تصدیق شدہ)' : 'Birthday (Verified 18+)'}</span>
                </label>
                <span className="text-[10px] text-white/40 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>{isUr ? 'تبدیلی کے لیے سپورٹ سے رابطہ کریں' : 'Contact support to change'}</span>
                </span>
              </div>
              <div className="w-full px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/10 text-white/50 text-sm flex items-center justify-between select-none">
                <span>{birthdate}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  18+ Verified
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/profile"
              className="w-1/3 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold text-center transition-all"
            >
              {isUr ? 'منسوخ کریں' : 'Cancel'}
            </Link>

            <button
              type="submit"
              disabled={isSaving || (nicknameStatus.available === false && nickname !== initialNickname)}
              className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-[#FF2E74] to-[#A855F7] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-[#FF2E74]/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isUr ? 'تبدیلیاں محفوظ ہو رہی ہیں...' : 'Saving Changes...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isUr ? 'تبدیلیاں محفوظ کریں' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Country Picker Modal */}
        {countryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-sm rounded-3xl bg-[#140E2E] border border-white/15 p-5 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold">{isUr ? 'ملک منتخب کریں' : 'Select Country'}</h3>
                <button
                  type="button"
                  onClick={() => setCountryModalOpen(false)}
                  className="p-1 rounded-full text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="my-3 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-white/40" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder={isUr ? 'ملک تلاش کریں...' : 'Search country...'}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF2E74]"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(c);
                      setCountryModalOpen(false);
                      setCountrySearch('');
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between text-xs transition-colors ${
                      selectedCountry.code === c.code
                        ? 'bg-gradient-to-r from-[#FF2E74]/20 to-[#A855F7]/20 text-[#FF2E74] font-bold'
                        : 'hover:bg-white/5 text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                    {selectedCountry.code === c.code && <CheckCircle className="w-3.5 h-3.5 text-[#FF2E74]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cropper Modal */}
        <AvatarCropperModal
          isOpen={cropperOpen}
          imageSrc={cropperImageSrc}
          onClose={() => setCropperOpen(false)}
          onCropComplete={handleCropComplete}
          isUr={isUr}
        />
      </div>
    </main>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A071E] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <EditProfileContent />
    </Suspense>
  );
}
