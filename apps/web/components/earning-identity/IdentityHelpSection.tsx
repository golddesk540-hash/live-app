'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, HelpCircle, LifeBuoy, MessageSquare } from 'lucide-react';

interface HelpItem {
  id: string;
  question: string;
  answer: string;
}

const HELP_ITEMS: HelpItem[] = [
  {
    id: 'why_requested',
    question: 'Why is earning identity information requested?',
    answer:
      'Creator platforms collect basic identity details to help verify host account ownership and protect creator payouts when official earning rules are active. Exact eligibility rules will match the finalized client-approved Popo Live policy.',
  },
  {
    id: 'what_needed',
    question: 'What information may be needed?',
    answer:
      'Typically a host legal name, country, date of birth, contact details, and a clear preview of a supported identity document. During frontend development, only sample placeholder entries and local previews are used.',
  },
  {
    id: 'check_status',
    question: 'How do I check my verification status?',
    answer:
      'Open the Earning Identity Dashboard or visit Verification Status to view whether your profile is Not Started, Incomplete, Submitted, Under Review, Verified, or needs updates.',
  },
  {
    id: 'if_incomplete',
    question: 'What should I do if my information is incomplete?',
    answer:
      'Tap Continue Verification or select Personal Information or Document Information in the progress tracker to fill in missing fields and attach clear document previews.',
  },
];

export const IdentityHelpSection: React.FC = () => {
  const [openId, setOpenId] = useState<string>('why_requested');

  return (
    <section
      data-testid="identity-help-section"
      className="rounded-3xl bg-[#130728]/95 border border-purple-400/20 p-4 sm:p-5 space-y-3 shadow-xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FF1A6C]/15 border border-[#FF1A6C]/35 flex items-center justify-center text-[#FF4D8D]">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white">Help &amp; Information</h2>
            <p className="text-[11px] text-purple-200/60">
              General guide · Final policy rules subject to official approval
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {HELP_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-2xl bg-[#1A0B35] border border-white/10 overflow-hidden"
            >
              <button
                type="button"
                data-testid={`identity-help-toggle-${item.id}`}
                onClick={() => setOpenId(isOpen ? '' : item.id)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left text-xs font-bold text-white hover:bg-white/[0.03] transition-colors"
              >
                <span>{item.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#FF4D8D] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-purple-200/60 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-3.5 text-xs text-purple-100/75 leading-relaxed border-t border-white/5 pt-2.5">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Support Entry Point */}
      <div className="rounded-2xl bg-gradient-to-r from-[#220B42] to-[#16072E] border border-[#FF1A6C]/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <LifeBuoy className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-extrabold text-white">Need help with your host identity profile?</p>
            <p className="text-[11px] text-purple-200/65">
              Reach out to Popo Live creator support for general guidance.
            </p>
          </div>
        </div>
        <Link
          href="/help"
          data-testid="identity-contact-support-link"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#FF1A6C] hover:brightness-110 text-white text-xs font-bold shadow-glow-pink whitespace-nowrap shrink-0 transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Contact Support</span>
        </Link>
      </div>
    </section>
  );
};
