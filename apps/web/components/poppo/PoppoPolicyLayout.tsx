'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PoppoHeader } from './PoppoHeader';
import { PoppoFooter } from './PoppoFooter';
import { useLanguage } from '@/lib/languageContext';
import { 
  ShieldCheck, 
  FileText, 
  Scale, 
  CreditCard, 
  UserCheck, 
  ChevronRight,
  ExternalLink,
  Download,
  AlertTriangle
} from 'lucide-react';

export interface PoppoPolicyLayoutProps {
  title: string;
  titleUr?: string;
  updatedDate?: string;
  children: React.ReactNode;
}

export const PoppoPolicyLayout: React.FC<PoppoPolicyLayoutProps> = ({
  title,
  titleUr,
  updatedDate = '2026-03-15',
  children,
}) => {
  const pathname = usePathname();
  const { isUr } = useLanguage();

  const policyNavItems = [
    {
      id: 'privacy',
      label: isUr ? 'پرائیویسی پالیسی' : 'Privacy Policy',
      href: '/policies/privacy',
      icon: ShieldCheck,
    },
    {
      id: 'terms',
      label: isUr ? 'استعمال کی شرائط' : 'Terms Of Service',
      href: '/policies/terms',
      icon: Scale,
    },
    {
      id: 'live-agreement',
      label: isUr ? 'لائیو براڈکاسٹ معاہدہ' : 'Live Agreement',
      href: '/policies/live-agreement',
      icon: FileText,
    },
    {
      id: 'recharge-agreement',
      label: isUr ? 'ریچارج معاہدہ' : 'Recharge Agreement',
      href: '/policies/recharge-agreement',
      icon: CreditCard,
    },
    {
      id: 'child-protection',
      label: isUr ? 'چائلڈ پروٹیکشن پالیسی' : 'No Child Endangerment Policy',
      href: '/policies/child-protection',
      icon: UserCheck,
    },
  ];

  return (
    <div
      dir={isUr ? 'rtl' : 'ltr'}
      className={`min-h-screen bg-white text-gray-900 selection:bg-[#5653FE] selection:text-white ${
        isUr ? 'font-urdu' : 'font-sans'
      }`}
    >
      <PoppoHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        
        {/* Mobile Horizontal Policy Tabs (Visible on mobile & tablet) */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-150 scrollbar-none">
          {policyNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#5653FE] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14">
          
          {/* LEFT COLUMN: Main Policy Document Content */}
          <div className="lg:col-span-8">
            {/* Document Header */}
            <div className="pb-8 border-b border-gray-150 mb-8">
              <span className="text-[11px] font-bold text-[#5653FE] uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                {isUr ? 'قانونی دستاویز' : 'Legal Compliance Document'}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-gray-950 mt-2.5 tracking-tight">
                {isUr && titleUr ? titleUr : title}
              </h1>
              <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm text-gray-400">
                <span>Latest updated: {updatedDate}</span>
                <span>•</span>
                <span>Version 4.2 Global</span>
              </div>
            </div>

            {/* Document Body */}
            <div className="policy-content space-y-8 text-gray-700 leading-relaxed text-sm sm:text-base">
              {children}
            </div>

            {/* Bottom Inquiries Notice */}
            <div className="mt-14 p-6 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  {isUr ? 'قانونی سوالات یا رپورٹنگ کے لیے' : 'Have questions regarding this agreement?'}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Contact our compliance and data protection officer at <span className="font-semibold text-gray-800">legal@poppolive.com</span>
                </p>
              </div>
              <Link
                href="/contact"
                className="px-5 py-2 rounded-full bg-[#5653FE] hover:bg-[#433ffd] text-white text-xs font-bold shrink-0 transition-colors"
              >
                {isUr ? 'رابطہ کریں' : 'Contact Support'}
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: 3D Blue Folder Graphic + Navigation Menu (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6">
            
            {/* Top 3D Blue Folder Illustration (Exact Authentic Element from Screenshots 05-09) */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 border border-blue-100/80 overflow-hidden flex flex-col items-center text-center shadow-xs">
              {/* Stylized 3D Blue Folder SVG Art */}
              <div className="relative w-36 h-28 mb-3">
                {/* Back Folder Tab */}
                <div className="absolute top-1 left-2 w-14 h-6 bg-blue-600 rounded-t-lg" />
                <div className="absolute top-4 left-0 w-32 h-20 bg-blue-500 rounded-xl shadow-md" />
                
                {/* Sticking Document Sheets */}
                <div className="absolute top-0 right-4 w-22 h-22 bg-white rounded-lg shadow-md border border-gray-150 p-2 transform rotate-6">
                  <div className="w-8 h-1.5 bg-blue-300 rounded-full mb-1" />
                  <div className="w-14 h-1 bg-gray-200 rounded-full mb-1" />
                  <div className="w-12 h-1 bg-gray-200 rounded-full mb-1" />
                  <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>
                <div className="absolute top-2 right-2 w-20 h-20 bg-blue-50 rounded-lg shadow-sm border border-blue-200 p-2 transform -rotate-3">
                  <div className="w-6 h-1.5 bg-blue-400 rounded-full mb-1" />
                  <div className="w-12 h-1 bg-blue-200 rounded-full mb-1" />
                  <div className="w-10 h-1 bg-blue-200 rounded-full" />
                </div>

                {/* Front Folder Flap */}
                <div className="absolute top-7 left-0 w-34 h-18 bg-gradient-to-tr from-blue-600 to-[#5653FE] rounded-xl shadow-lg border-t border-blue-300/40 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-white/90 drop-shadow-sm" />
                </div>
              </div>

              <h3 className="text-base font-bold text-gray-900">
                {isUr ? 'قانونی اور حفاظتی مرکز' : 'Security & Legal Center'}
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                {isUr
                  ? 'صارف کے حقوق، رازداری اور چائلڈ پروٹیکشن کے تمام باضابطہ قوانین۔'
                  : 'Official policies governing data protection, live rules, and compliance.'}
              </p>
            </div>

            {/* Right Sticky Navigation Menu (Matching 05_privacy_policy_page.png) */}
            <div className="sticky top-24 bg-white rounded-3xl border border-gray-200 p-4 shadow-xs space-y-1.5">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
                {isUr ? 'پالیسی دستاویزات' : 'Agreements & Policies'}
              </div>

              {policyNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-[#5653FE] border-l-4 border-[#5653FE] shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-[#5653FE]' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#5653FE]" />}
                  </Link>
                );
              })}
            </div>

            {/* 18+ Compliance Alert Badge */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800">
              <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                18+
              </div>
              <div className="text-xs">
                <span className="font-bold">Strict Age Requirement: </span>
                <span>Poppo Live strictly prohibits minors under 18 years from live streaming or registering accounts.</span>
              </div>
            </div>

          </aside>

        </div>
      </main>

      <PoppoFooter />
    </div>
  );
};
