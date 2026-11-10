'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Lock,
  Users,
  User,
  Swords,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Globe,
  X,
} from 'lucide-react';
import { PKBattleType, PKBattleTypeId, CANONICAL_PK_BATTLE_TYPES } from '@/lib/pk';

export interface PKBattleTypeScreenProps {
  roomNumber?: string;
  hostId?: string;
  onClose?: () => void;
  onContinue?: (battleType: PKBattleTypeId) => void;
  isModal?: boolean;
}

export default function PKBattleTypeScreen({
  roomNumber = '7001',
  hostId = 'host_maria_7001',
  onClose,
  onContinue,
  isModal = false,
}: PKBattleTypeScreenProps) {
  const router = useRouter();

  // Selected battle type: 1v1 is selected by default as required
  const [selectedType, setSelectedType] = useState<PKBattleTypeId>('1v1');
  const [language, setLanguage] = useState<'en' | 'ur'>('en');

  // Backend state
  const [battleTypes, setBattleTypes] = useState<PKBattleType[]>(CANONICAL_PK_BATTLE_TYPES);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isUrdu = language === 'ur';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Fetch battle types & feature flags from backend
  useEffect(() => {
    let isMounted = true;
    async function loadBattleTypes() {
      try {
        setLoading(true);
        const res = await fetch('/api/pk/battle-types');
        if (res.ok) {
          const data = await res.json();
          if (data.success && isMounted) {
            setBattleTypes(data.battleTypes || CANONICAL_PK_BATTLE_TYPES);
          }
        }
      } catch (err) {
        console.error('Error fetching PK battle types:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBattleTypes();
    return () => {
      isMounted = false;
    };
  }, []);

  // Card click handler
  const handleSelectCard = (typeId: PKBattleTypeId, isLocked: boolean) => {
    if (isLocked) {
      // 4-Host is locked at launch as per strict prompt rules
      const lockedNotice = isUrdu
        ? '4 میزبان جنگ فی الوقت مقفل ہے۔ آئندہ اپڈیٹ میں دستیاب ہوگی۔'
        : '4-Host Battle is locked. Available in a future release.';
      showToast(lockedNotice);
      return;
    }
    setSelectedType(typeId);
  };

  // Submit selection to backend
  const handleContinue = async () => {
    if (selectedType !== '1v1') {
      const msg = isUrdu
        ? 'براہ کرم فعال جنگ کی قسم (1 بمقابلہ 1) کا انتخاب کریں۔'
        : 'Please select a supported battle type (1v1).';
      setErrorMessage(msg);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const res = await fetch('/api/pk/battle-types/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber,
          hostId,
          battleType: selectedType,
          language,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const successMsg = isUrdu ? data.messageUr : data.message;
        showToast(successMsg || '1v1 PK Battle selected successfully!');

        if (onContinue) {
          onContinue(selectedType);
        } else if (onClose) {
          setTimeout(onClose, 800);
        } else {
          setTimeout(() => {
            router.push(`/party/room/${roomNumber}?pkSession=${data.sessionId || 'active'}`);
          }, 800);
        }
      } else {
        const errorText = isUrdu ? data.errorUr || data.error : data.error;
        setErrorMessage(errorText || 'Failed to select battle type.');
      }
    } catch (err: any) {
      console.error('Error submitting battle type:', err);
      setErrorMessage(isUrdu ? 'نیٹ ورک کی خرابی پیش آگئی ہے۔' : 'Network error submitting battle type.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  // Localized texts
  const t = {
    title: isUrdu ? 'پی کے جنگ' : 'PK Battle',
    sectionHeader: isUrdu ? 'جنگ کی قسم منتخب کریں' : 'Select Battle Type',
    continueBtn: isUrdu ? 'جاری رکھیں' : 'Continue',
    saving: isUrdu ? 'محفوظ کیا جا رہا ہے...' : 'Configuring...',
    oneVsOneName: isUrdu ? '1 بمقابلہ 1' : '1 vs 1',
    oneVsOneSub: isUrdu ? 'دو میزبان الگ الگ اسکور کے ساتھ آمنے سامنے' : 'Two hosts compete in real-time',
    fourHostName: isUrdu ? '4 میزبان جنگ' : '4-Host Battle',
    fourHostSub: isUrdu ? 'چار میزبان جنگ (جلد آرہا ہے)' : 'Four host positions (Coming Soon)',
    watermarkTop: '6.1 Battle Types',
    watermarkBottom: '(1v1, optional 4-host)',
  };

  const type1v1 = battleTypes.find((t) => t.id === '1v1') || CANONICAL_PK_BATTLE_TYPES[0];
  const type4host = battleTypes.find((t) => t.id === '4_host') || CANONICAL_PK_BATTLE_TYPES[1];

  return (
    <div
      className={`relative w-full max-w-[375px] mx-auto min-h-[667px] max-h-[667px] bg-[#0c0822] text-white flex flex-col justify-between overflow-hidden shadow-2xl select-none ${
        isModal ? 'rounded-3xl border border-pink-500/30' : ''
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 12%, #2d1045 0%, #130a28 50%, #080516 100%)',
      }}
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      {/* 1. Status Bar */}
      <div className="w-full flex items-center justify-between px-6 pt-3 pb-1 text-xs text-white/90 select-none z-10">
        <span className="font-semibold tracking-tight text-[13px]">9:41</span>
        <div className="flex items-center space-x-1.5" dir="ltr">
          {/* Signal 4 bars */}
          <div className="flex items-end space-x-0.5 h-3">
            <div className="w-[2.5px] h-1 bg-white rounded-sm" />
            <div className="w-[2.5px] h-1.5 bg-white rounded-sm" />
            <div className="w-[2.5px] h-1.5 bg-white rounded-sm" />
            <div className="w-[2.5px] h-2 bg-white rounded-sm" />
          </div>
          {/* WiFi icon */}
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4zm0 3c3.78 0 7.22 1.48 9.77 3.93L12 18.57 2.23 10.93C4.78 8.48 8.22 7 12 7z" />
          </svg>
          {/* Battery */}
          <div className="w-5 h-2.5 border border-white/80 rounded-sm p-0.5 flex items-center">
            <div className="w-3 h-1.5 bg-white rounded-2xs" />
          </div>
        </div>
      </div>

      {/* 2. Top Header Bar matching 06_01_battle_types.png */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 z-10">
        {/* Left: Back button */}
        <button
          onClick={handleBack}
          data-action="back"
          data-testid="btn-back"
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronLeft className={`w-5 h-5 ${isUrdu ? 'rotate-180' : ''}`} />
        </button>

        {/* Center: Title "PK Battle" */}
        <h1 className="text-lg font-bold text-white tracking-wide">
          {t.title}
        </h1>

        {/* Right: Language Switcher (EN | UR) */}
        <button
          onClick={() => setLanguage((prev) => (prev === 'en' ? 'ur' : 'en'))}
          data-action="toggle-language"
          data-testid="btn-toggle-language"
          className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-pink-500/30 text-[11px] font-bold text-pink-200 flex items-center gap-1 transition-all active:scale-95"
          title="Switch Language / زبان تبدیل کریں"
        >
          <Globe className="w-3 h-3 text-pink-400" />
          <span>{isUrdu ? 'EN' : 'اردو'}</span>
        </button>
      </div>

      {/* 3. Section Heading: "Select Battle Type" */}
      <div className="w-full px-6 pt-3 pb-2 z-10">
        <h2 className="text-[17px] font-bold text-white/95 tracking-normal">
          {t.sectionHeader}
        </h2>
      </div>

      {/* 4. Battle Types Cards Container */}
      <div className="flex-1 px-5 flex flex-col justify-start space-y-4 pt-1 z-10">
        {/* ================================================================= */}
        {/* CARD 1: 1 vs 1 PK Battle (Selected & Highlighted matching PNG)     */}
        {/* ================================================================= */}
        <div
          onClick={() => handleSelectCard('1v1', false)}
          data-battle-type="1v1"
          data-testid="card-battle-1v1"
          className={`relative w-full rounded-[22px] p-5 cursor-pointer transition-all duration-200 select-none ${
            selectedType === '1v1'
              ? 'bg-[#1e1338] border-2 border-[#ff2d78] shadow-[0_0_20px_rgba(255,45,120,0.38)]'
              : 'bg-[#160f2d] border border-white/10 hover:border-pink-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Left Content: Title and Subtitle */}
            <div className="flex-1 pr-3">
              <div className="flex items-center space-x-2">
                <span className="text-[20px] font-extrabold text-white tracking-wide">
                  {isUrdu ? t.oneVsOneName : '1 vs'}
                </span>
                {!isUrdu && (
                  <span className="text-[20px] font-extrabold text-white tracking-wide">
                    1
                  </span>
                )}
                {/* Active Tag */}
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  {isUrdu ? 'فعال' : 'Active'}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] text-white/60 leading-tight">
                {t.oneVsOneSub}
              </p>
            </div>

            {/* Right Graphic: Two Stylized Host Avatars matching PNG */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Host A Avatar silhouette */}
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#8b5cf6] to-[#ec4899] p-0.5 shadow-md shadow-purple-500/30 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#1e1136] flex items-center justify-center">
                  <User className="w-5 h-5 text-pink-300" />
                </div>
              </div>

              {/* VS separator badge */}
              <span className="text-[11px] font-black text-pink-400 italic">VS</span>

              {/* Host B Avatar silhouette */}
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#ec4899] to-[#a855f7] p-0.5 shadow-md shadow-pink-500/30 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#1e1136] flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CARD 2: 4-Host Battle (Locked & Disabled matching PNG)            */}
        {/* ================================================================= */}
        <div
          onClick={() => handleSelectCard('4_host', true)}
          data-battle-type="4_host"
          data-testid="card-battle-4host"
          className="relative w-full rounded-[22px] p-5 cursor-not-allowed bg-[#130d28]/85 border border-white/5 opacity-80 transition-all select-none hover:bg-[#160f2e]"
        >
          <div className="flex items-center justify-between">
            {/* Left Content */}
            <div className="flex-1 pr-3">
              <div className="flex items-center space-x-2">
                <span className="text-[18px] font-bold text-white/90 tracking-wide">
                  {t.fourHostName}
                </span>
                {/* Coming Soon badge */}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/10">
                  {isUrdu ? 'جلد آرہا ہے' : 'Coming Soon'}
                </span>
              </div>

              {/* 4 Host Silhouettes Graphic */}
              <div className="mt-2 flex items-center space-x-1.5 opacity-60">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white/70" />
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white/70" />
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white/70" />
                </div>
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white/70" />
                </div>
              </div>
            </div>

            {/* Right Graphic: Closed Padlock Icon matching reference PNG */}
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-300/80 shrink-0 shadow-inner">
              <Lock className="w-5 h-5 text-pink-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Action Button: Continue */}
      <div className="w-full px-5 pb-2 z-10">
        <button
          onClick={handleContinue}
          disabled={selectedType !== '1v1' || submitting}
          data-action="continue"
          data-testid="btn-continue"
          className={`w-full h-12 rounded-2xl font-bold text-[16px] tracking-wide text-white flex items-center justify-center shadow-lg transition-all active:scale-[0.98] ${
            selectedType !== '1v1' || submitting
              ? 'bg-pink-950/40 text-white/40 cursor-not-allowed border border-pink-500/20'
              : 'bg-gradient-to-r from-[#ff2a75] to-[#f43f5e] hover:brightness-110 shadow-pink-600/40'
          }`}
        >
          {submitting ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.saving}</span>
            </div>
          ) : (
            <span>{t.continueBtn}</span>
          )}
        </button>
      </div>

      {/* 6. Footer Watermark Badge matching reference PNG exactly */}
      <div className="w-full flex justify-center pb-4 pt-1 z-10">
        <div
          data-testid="pk-watermark-pill"
          className="px-6 py-2 rounded-[24px] bg-[#831853] border border-pink-400/40 text-center shadow-xl backdrop-blur-md"
        >
          <div className="text-[12px] font-extrabold text-white leading-tight tracking-wide">
            {t.watermarkTop}
          </div>
          <div className="text-[11px] font-medium text-pink-200/90 leading-tight">
            {t.watermarkBottom}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-4 right-4 bg-purple-950/95 border border-pink-500/60 rounded-xl px-4 py-2.5 text-xs text-pink-100 shadow-2xl flex items-center space-x-2 z-50 animate-fade-in backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="absolute top-16 left-4 right-4 bg-rose-950/95 border border-rose-500/60 rounded-xl px-4 py-2.5 text-xs text-rose-100 shadow-2xl flex items-center space-x-2 z-50 animate-fade-in backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-white/60 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
