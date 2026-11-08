'use client';

import React from 'react';
import Link from 'next/link';
import { PoppoLogo } from './PoppoLogo';
import { useLanguage } from '@/lib/languageContext';
import { 
  ShieldCheck, 
  Smartphone, 
  Apple, 
  Play, 
  Download, 
  QrCode, 
  Heart,
  Globe,
  ExternalLink
} from 'lucide-react';

export const PoppoFooter: React.FC = () => {
  const { isUr } = useLanguage();

  return (
    <footer className="relative bg-white border-t border-gray-100 overflow-hidden text-gray-700">
      {/* Background Watermark Outline Text */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none select-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[120px] sm:text-[180px] lg:text-[230px] font-black text-gray-50/70 tracking-widest whitespace-nowrap z-0 uppercase"
        style={{ letterSpacing: '0.08em' }}
      >
        POPPO LIVE
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-gray-100">
          
          {/* Brand & Mission Column (Col 1 & 2 on wide screens) */}
          <div className="lg:col-span-2 space-y-5">
            <PoppoLogo size="lg" />
            <p className="text-base font-medium text-gray-600 max-w-sm leading-relaxed">
              {isUr 
                ? 'لائیو آئیں، نئے دوست بنائیں، خوشیوں سے لطف اندوز ہوں۔ سب کچھ پوپو لائیو پر!' 
                : 'Go live. Make friends. Feel the fun. All on Poppo.'}
            </p>
            <p className="text-xs text-gray-400 max-w-md leading-relaxed">
              {isUr
                ? 'پوپو لائیو ایک محفوظ اور متحرک تفریحی پلیٹ فارم ہے جہاں دنیا بھر کے تخلیق کار اور ناظرین ایک ساتھ جڑتے ہیں۔'
                : 'Poppo Live is a premier global video social community empowering creators, party rooms, interactive games, and friendly live PK battles.'}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              {[
                { name: 'Facebook', icon: 'f', href: 'https://facebook.com' },
                { name: 'Instagram', icon: '📸', href: 'https://instagram.com' },
                { name: 'TikTok', icon: '🎵', href: 'https://tiktok.com' },
                { name: 'YouTube', icon: '▶', href: 'https://youtube.com' },
                { name: 'X', icon: '𝕏', href: 'https://twitter.com' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-[#5653FE] hover:text-white text-gray-600 flex items-center justify-center font-bold text-xs transition-all shadow-sm"
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* 18+ Age Notice */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold">
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black">18+</span>
              <span>{isUr ? 'صرف 18 سال یا اس سے زیادہ عمر کے افراد کے لیے' : 'Strictly 18+ Age Restriction'}</span>
            </div>
          </div>

          {/* Column 3: Security & Policies */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5653FE]" />
              {isUr ? 'تحفظ اور پالیسیاں' : 'Security & Policies'}
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>
                <Link href="/policies/privacy" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'پرائیویسی پالیسی' : 'Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'استعمال کی شرائط' : 'Terms of Service'}
                </Link>
              </li>
              <li>
                <Link href="/policies/live-agreement" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'لائیو معاہدہ' : 'Live Agreement'}
                </Link>
              </li>
              <li>
                <Link href="/policies/recharge-agreement" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'صارف ریچارج معاہدہ' : 'User Recharge Agreement'}
                </Link>
              </li>
              <li>
                <Link href="/policies/child-protection" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'چائلڈ پروٹیکشن پالیسی' : 'No Child Endangerment'}
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'کمیونٹی گائیڈ لائنز' : 'Community Guidelines'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Help & Services */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              {isUr ? 'مدد اور خدمات' : 'Help & Services'}
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'ہمارے بارے میں' : 'About Us'}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'رابطہ سینٹر' : 'Contact Us'}
                </Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'نیوز سینٹر' : 'News Center'}
                </Link>
              </li>
              <li>
                <Link href="/agency" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'ایجنسی پارٹنر بنیں' : 'Agency Partnership'}
                </Link>
              </li>
              <li>
                <Link href="/recharge" className="hover:text-[#5653FE] transition-colors font-medium text-[#5653FE] flex items-center gap-1.5">
                  <span>{isUr ? 'کوائن ریچارج سینٹر' : 'Coin Recharge'}</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded font-bold">TOP UP</span>
                </Link>
              </li>
              <li>
                <Link href="/download" className="hover:text-[#5653FE] transition-colors">
                  {isUr ? 'ایپ ڈاؤن لوڈ' : 'Download App'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: App QR Codes / Download Matrix */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#5653FE]" />
              {isUr ? 'ایپ حاصل کریں' : 'Get The App'}
            </h3>
            <p className="text-xs text-gray-500">
              {isUr ? 'کیو آر کوڈ اسکین کریں یا براہ راست ڈاؤن لوڈ کریں:' : 'Scan QR code or download for your device:'}
            </p>
            
            <div className="grid grid-cols-2 gap-2.5">
              {/* iOS */}
              <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:border-[#5653FE]/30 hover:bg-purple-50/30 transition-all text-center">
                <div className="w-16 h-16 mx-auto mb-1.5 bg-white p-1 rounded-lg border border-gray-200 flex items-center justify-center">
                  {/* Stylized QR placeholder */}
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-700 rounded p-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                    </div>
                    <div className="flex justify-center items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                      <div className="w-1.5 h-1.5 bg-white"></div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-gray-800">App Store</div>
                <div className="text-[9px] text-gray-400">iOS 12.0+</div>
              </div>

              {/* Google Play */}
              <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:border-[#5653FE]/30 hover:bg-purple-50/30 transition-all text-center">
                <div className="w-16 h-16 mx-auto mb-1.5 bg-white p-1 rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-teal-800 rounded p-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                    </div>
                    <div className="flex justify-center items-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                      <div className="w-1.5 h-1.5 bg-white"></div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-gray-800">Google Play</div>
                <div className="text-[9px] text-gray-400">Android 6.0+</div>
              </div>

              {/* Huawei */}
              <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:border-[#5653FE]/30 hover:bg-purple-50/30 transition-all text-center">
                <div className="w-16 h-16 mx-auto mb-1.5 bg-white p-1 rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-rose-900 to-red-800 rounded p-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                    </div>
                    <div className="flex justify-center items-center">
                      <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                      <div className="w-1.5 h-1.5 bg-white"></div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-gray-800">AppGallery</div>
                <div className="text-[9px] text-gray-400">Huawei Store</div>
              </div>

              {/* Android Direct */}
              <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:border-[#5653FE]/30 hover:bg-purple-50/30 transition-all text-center">
                <div className="w-16 h-16 mx-auto mb-1.5 bg-white p-1 rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-[#5653FE] to-indigo-900 rounded p-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                    </div>
                    <div className="flex justify-center items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-3 h-3 bg-white rounded-xs"></div>
                      <div className="w-1.5 h-1.5 bg-white"></div>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-gray-800">Android APK</div>
                <div className="text-[9px] text-gray-400">Direct v4.2.1</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            © 2026 POPPO LIVE. {isUr ? 'جملہ حقوق محفوظ ہیں۔' : 'All rights reserved.'}
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-gray-400">V4.2.1-Global</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <Link href="/policies/privacy" className="hover:text-[#5653FE]">
              {isUr ? 'رازداری کی ضمانت' : 'Privacy Protection'}
            </Link>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <Link href="/policies/terms" className="hover:text-[#5653FE]">
              {isUr ? 'قانونی رہنمائی' : 'Legal Compliance'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
