'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldCheck, Smartphone, Mail } from 'lucide-react';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'ur';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  lang = 'en',
}) => {
  const [tab, setTab] = useState<'quick' | 'phone' | 'email'>('quick');
  const isUr = lang === 'ur';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isUr ? 'پوپو لائیو میں لاگ ان کریں' : 'Welcome to Popo Live'}
      subtitle={isUr ? 'براہ راست اسٹریمنگ اور تحائف کے لیے لاگ ان کریں' : 'Sign in to watch live broadcasts, chat & send gifts'}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 text-left">
        {/* Method selection tabs */}
        <div className="flex p-1 bg-popo-dark-850 rounded-xl border border-white/5">
          <button
            onClick={() => setTab('quick')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'quick' ? 'bg-popo-pink text-white shadow-sm' : 'text-popo-text-secondary hover:text-white'
            }`}
          >
            {isUr ? 'فوری لاگ ان' : 'Quick Social'}
          </button>
          <button
            onClick={() => setTab('phone')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'phone' ? 'bg-popo-pink text-white shadow-sm' : 'text-popo-text-secondary hover:text-white'
            }`}
          >
            {isUr ? 'فون نمبر' : 'Phone OTP'}
          </button>
          <button
            onClick={() => setTab('email')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'email' ? 'bg-popo-pink text-white shadow-sm' : 'text-popo-text-secondary hover:text-white'
            }`}
          >
            {isUr ? 'ای میل' : 'Email'}
          </button>
        </div>

        {tab === 'quick' && (
          <div className="flex flex-col gap-2.5 my-2">
            <button
              type="button"
              className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-sm transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.14 0 9.89 0 12s.45 3.86 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isUr ? 'گوگل سے لاگ ان کریں' : 'Continue with Google'}</span>
            </button>

            <button
              type="button"
              className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold text-sm transition-all"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>{isUr ? 'فیس بک سے جاری رکھیں' : 'Continue with Facebook'}</span>
            </button>

            <button
              type="button"
              className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl bg-black hover:bg-neutral-900 text-white border border-white/20 font-semibold text-sm transition-all"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.64-.78 1.08-1.87.96-2.97-1 .04-2.14.64-2.81 1.42-.58.68-1.09 1.78-.96 2.85 1.12.09 2.19-.55 2.81-1.3" />
              </svg>
              <span>{isUr ? 'ایپل اکاؤنٹ سے لاگ ان کریں' : 'Sign in with Apple'}</span>
            </button>
          </div>
        )}

        {tab === 'phone' && (
          <div className="flex flex-col gap-3 my-2">
            <Input
              label={isUr ? 'موبائل نمبر درج کریں' : 'Mobile Phone Number'}
              placeholder="+92 300 1234567"
              leftIcon={<Smartphone className="w-4 h-4" />}
            />
            <Button variant="primary" size="md" className="w-full">
              {isUr ? 'او ٹی پی کوڈ بھیجیں' : 'Send Verification Code'}
            </Button>
          </div>
        )}

        {tab === 'email' && (
          <div className="flex flex-col gap-3 my-2">
            <Input
              label={isUr ? 'ای میل ایڈریس' : 'Email Address'}
              placeholder="user@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              label={isUr ? 'پاس ورڈ' : 'Password'}
              type="password"
              placeholder="••••••••"
            />
            <Button variant="primary" size="md" className="w-full">
              {isUr ? 'لاگ ان کریں' : 'Sign In'}
            </Button>
          </div>
        )}

        {/* 18+ and Security Notice */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-popo-text-secondary mt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {isUr
              ? 'صرف ۱۸ سال اور زائد عمر کے لیے۔ آپ پاپو لائیو کے شرائط و ضوابط اور رازداری پالیسی سے متفق ہیں۔'
              : 'Strict 18+ policy. By continuing you agree to Popo Live Terms of Service and Privacy Policy.'}
          </span>
        </div>
      </div>
    </Modal>
  );
};
