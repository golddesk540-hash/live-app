'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Headphones,
  HelpCircle,
  Send,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  AGENCY_FAQS,
  AGENCY_MANAGEMENT_GUIDES,
} from './mockAgencyData';

interface AgencySupportSectionProps {
  onShowNotice: (msg: string) => void;
}

export const AgencySupportSection: React.FC<AgencySupportSectionProps> = ({
  onShowNotice,
}) => {
  const [openFaqId, setOpenFaqId] = useState<string | null>(AGENCY_FAQS[0]?.id ?? null);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('Host Roster Guidance');
  const [message, setMessage] = useState('');
  const [submittedDemo, setSubmittedDemo] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || subject.trim().length < 4) {
      setFormError('Please enter a brief subject (at least 4 characters).');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setFormError('Please enter your sample question (at least 10 characters).');
      return;
    }
    setFormError(null);
    setSubmittedDemo(true);
    setSubject('');
    setMessage('');
    onShowNotice('Demo agency support inquiry logged locally (no backend ticket sent).');
  };

  return (
    <div className="space-y-4" data-testid="agency-support-section">
      {/* Help Intro */}
      <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5 shadow-[0_14px_38px_rgba(9,3,22,0.5)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF2E93]/15 border border-[#FF2E93]/35 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#FF6BA3]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Agency Support & Guidance</h2>
              <p className="text-xs text-purple-200/75">
                Creator roster guidance, FAQ answers, and sample support inquiry preview
              </p>
            </div>
          </div>

          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-purple-400/25 text-xs font-bold text-purple-100 transition self-start sm:self-auto"
          >
            Help Center
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Agency Management & Host Management Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENCY_MANAGEMENT_GUIDES.map((guide, index) => (
          <div
            key={guide.id}
            className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5 space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-400/25 flex items-center justify-center">
                {index === 0 ? (
                  <BookOpen className="w-4 h-4 text-amber-300" />
                ) : (
                  <Users className="w-4 h-4 text-[#FF6BA3]" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-white">{guide.title}</h3>
                <p className="text-[11px] text-purple-200/70">{guide.summary}</p>
              </div>
            </div>

            <ul className="space-y-2 pt-1">
              {guide.steps.map((step) => (
                <li
                  key={step}
                  className="flex items-start gap-2 text-xs text-purple-100/85 leading-relaxed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Frequently Asked Questions */}
      <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-300" />
          <h3 className="text-sm font-black text-white">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-2">
          {AGENCY_FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl bg-[#120624]/85 border border-purple-400/15 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  data-testid={`agency-faq-btn-${faq.id}`}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-xs font-bold text-white hover:bg-white/[0.03] transition"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-purple-300 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#FF6BA3]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-3.5 text-xs text-purple-200/80 leading-relaxed border-t border-white/5 pt-2.5">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Support Entry Point (Frontend Demo Preview) */}
      <div className="rounded-3xl bg-[#1A0B2E]/95 border border-purple-400/20 p-5">
        <h3 className="text-sm font-black text-white">Contact Agency Support (Demo Preview)</h3>
        <p className="text-[11px] text-purple-200/75 mt-1">
          Test submitting a sample agency question using local state. No backend support ticket is
          created.
        </p>

        {submittedDemo && (
          <div
            data-testid="agency-support-confirmation"
            className="mt-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/35 px-4 py-3 text-xs font-semibold text-emerald-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>
              Sample inquiry recorded locally! For live platform tickets, use{' '}
              <Link href="/help/contact" className="underline text-white">
                Contact Help Desk
              </Link>
              .
            </span>
          </div>
        )}

        <form onSubmit={handleSupportSubmit} className="mt-4 space-y-3">
          {formError && (
            <div className="rounded-xl bg-rose-500/15 border border-rose-400/35 px-3.5 py-2 text-xs font-semibold text-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Inquiry Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              data-testid="agency-support-subject"
              placeholder="e.g. Host onboarding checklist question"
              className="bg-[#120624] border-purple-400/25 text-white"
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#120624] border border-purple-400/25 text-white text-sm focus:outline-none focus:border-[#FF2E93]"
              >
                <option value="Host Roster Guidance">Host Roster Guidance</option>
                <option value="Agency Profile Updates">Agency Profile Updates</option>
                <option value="Activity Preview Metrics">Activity Preview Metrics</option>
                <option value="New-Host Pack Support">New-Host Pack Support</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Message Preview
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              data-testid="agency-support-message"
              placeholder="Write a sample support message to test local form confirmation..."
              className="w-full rounded-xl bg-[#120624] border border-purple-400/25 px-3.5 py-2.5 text-sm text-white placeholder:text-purple-300/45 focus:outline-none focus:border-[#FF2E93]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Link
              href="/help/contact"
              className="text-xs font-bold text-purple-200 hover:text-white hover:underline"
            >
              Open Platform Support Form →
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              data-testid="agency-support-submit-btn"
              className="rounded-full bg-[#FF2E93] hover:bg-[#ff429e] text-white border-0 shadow-[0_6px_20px_rgba(255,46,147,0.35)]"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Send Sample Inquiry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
