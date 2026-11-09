'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Cast,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Check,
  Shield,
  Sparkles,
  Info,
  Plus,
  Trash2,
  Flag,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PartyRule } from '@/lib/party';

export interface PartyRulesScreenProps {
  roomId?: string;
  userId?: string;
  userName?: string;
  isHost?: boolean;
  onClose?: () => void;
  onAccept?: () => void;
  isModal?: boolean;
}

export default function PartyRulesScreen({
  roomId = '7001',
  userId = 'viewer_demo_01',
  userName = 'Demo Viewer',
  isHost = false,
  onClose,
  onAccept,
  isModal = false,
}: PartyRulesScreenProps) {
  const router = useRouter();

  // State matching 05_10_party_rules.png
  const [rules, setRules] = useState<PartyRule[]>([]);
  const [policyVersion, setPolicyVersion] = useState<string>('v1.0');
  const [hasAccepted, setHasAccepted] = useState<boolean>(false);
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);

  // Acceptance & UI state
  const [agreedCheckbox, setAgreedCheckbox] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Expandable details & Host management
  const [expandedDetails, setExpandedDetails] = useState<boolean>(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customDesc, setCustomDesc] = useState<string>('');
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportTargetUser, setReportTargetUser] = useState<string>('');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('rule_respect');
  const [reportReason, setReportReason] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Fetch party rules from backend
  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/party/${roomId}/rules?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRules(data.rules || []);
          setPolicyVersion(data.policyVersion || 'v1.0');
          setHasAccepted(Boolean(data.hasAccepted));
          setAcceptedAt(data.acceptedAt || null);
        }
      }
    } catch (err: any) {
      console.error('Error loading party rules:', err);
      setErrorMessage('Failed to load active rules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [roomId, userId]);

  // Submit Rule Acceptance
  const handleAccept = async () => {
    if (!agreedCheckbox) {
      setErrorMessage('Please check the acknowledgement box to accept rules.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const res = await fetch(`/api/party/${roomId}/rules/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          policyVersion,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setHasAccepted(true);
        setAcceptedAt(data.acceptedAt);
        showToast('Party rules accepted successfully! Access granted.');
        if (onAccept) {
          onAccept();
        } else if (onClose) {
          setTimeout(onClose, 800);
        } else {
          setTimeout(() => {
            router.push(`/party/room/${roomId}`);
          }, 800);
        }
      } else {
        setErrorMessage(data.error || 'Failed to submit acceptance.');
      }
    } catch (err: any) {
      console.error('Error accepting party rules:', err);
      setErrorMessage('Network error submitting acceptance.');
    } finally {
      setSubmitting(false);
    }
  };

  // Host Add Custom Rule
  const handleAddCustomRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    try {
      const res = await fetch(`/api/party/${roomId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle.trim(),
          description: customDesc.trim(),
          isHostAction: true,
          hostId: userId,
          category: 'custom',
          icon: 'custom',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Custom party guideline added!');
        setCustomTitle('');
        setCustomDesc('');
        setShowAddCustomModal(false);
        loadRules();
      } else {
        setErrorMessage(data.error || 'Failed to add custom rule.');
      }
    } catch (err) {
      setErrorMessage('Network error adding custom rule.');
    }
  };

  // Host Delete Custom Rule
  const handleDeleteRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/party/${roomId}/rules?ruleId=${encodeURIComponent(ruleId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Custom guideline removed.');
        loadRules();
      } else {
        setErrorMessage(data.error || 'Cannot remove rule.');
      }
    } catch (err) {
      setErrorMessage('Network error deleting rule.');
    }
  };

  // Submit Violation Report
  const handleReportViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetUser.trim()) return;

    try {
      const res = await fetch(`/api/party/${roomId}/rules/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: userId,
          reportedUserId: reportTargetUser.trim(),
          ruleId: selectedRuleId,
          reason: reportReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Report submitted. Safety moderators will review.');
        setShowReportModal(false);
        setReportTargetUser('');
        setReportReason('');
      } else {
        setErrorMessage(data.error || 'Failed to submit report.');
      }
    } catch (err) {
      setErrorMessage('Network error submitting report.');
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  // Rule icon renderer matching 05_10_party_rules.png
  const renderRuleIcon = (icon: string) => {
    switch (icon) {
      case 'respect':
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-amber-950 shadow-md shadow-amber-500/30">
            <span className="text-xs font-black">👋</span>
          </div>
        );
      case 'hate_speech':
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-orange-500/30">
            <span className="text-xs font-black">👑</span>
          </div>
        );
      case 'inappropriate':
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center text-white shadow-md shadow-pink-500/30">
            <span className="text-xs font-black">🚫</span>
          </div>
        );
      case 'spam':
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-violet-400 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
            <span className="text-xs font-black">📢</span>
          </div>
        );
      case 'guidelines':
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <span className="text-xs font-black">🛡️</span>
          </div>
        );
    }
  };

  // Primary 5 rules matching 05_10_party_rules.png
  const primaryRules = rules.slice(0, 5);
  const remainingRules = rules.slice(5);

  return (
    <div
      className={`relative w-full max-w-[375px] mx-auto min-h-[667px] bg-[#0b0a1d] text-white flex flex-col justify-between overflow-hidden shadow-2xl ${
        isModal ? 'rounded-3xl border border-purple-500/30' : ''
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 15%, #2a1147 0%, #110d28 45%, #080614 100%)',
      }}
    >
      {/* 1. Status Bar */}
      <div className="w-full flex items-center justify-between px-6 pt-3 pb-1 text-xs text-white/90 select-none z-10">
        <span className="font-semibold tracking-tight text-[13px]">9:41</span>
        <div className="flex items-center space-x-1.5">
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

      {/* 2. Top Header Navigation */}
      <div className="w-full flex items-center justify-between px-4 py-2 z-10">
        {/* Left: Back button */}
        <button
          onClick={handleBack}
          data-action="back"
          data-testid="btn-back"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/90 hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center: Popo Live Branding */}
        <div className="flex items-center space-x-1 select-none">
          <span className="text-purple-400 font-extrabold text-lg tracking-tight drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]">
            P
          </span>
          <span className="text-white font-bold text-lg tracking-tight">opo Live</span>
        </div>

        {/* Right: Cast glyph */}
        <button
          data-action="cast"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:bg-white/10 active:scale-95 transition-all"
        >
          <div className="w-5 h-5 flex items-center justify-center font-mono text-sm tracking-tighter">
            {`{•}`}
          </div>
        </button>
      </div>

      {/* 3. Subheader Chevron */}
      <div className="w-full px-5 py-0.5 z-10">
        <button
          onClick={handleBack}
          data-action="sub-back"
          className="text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Center Hero Badge */}
      <div className="flex flex-col items-center justify-center mt-0 mb-1 z-10">
        {/* Glowing document badge */}
        <div className="relative w-13 h-13 rounded-2xl bg-gradient-to-br from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] flex items-center justify-center shadow-[0_0_24px_rgba(168,85,247,0.7)] border border-purple-300/40">
          {/* Document stylized icon */}
          <div className="w-6 h-7 bg-white/20 rounded-md border border-white/40 flex flex-col justify-center px-1.5 space-y-1">
            <div className="w-3.5 h-1 bg-white rounded-full" />
            <div className="w-3 h-1 bg-white/80 rounded-full" />
            <div className="w-2 h-1 bg-white/60 rounded-full" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mt-2 text-[20px] font-bold text-white tracking-wide">
          Party Rules
        </h1>

        {/* Room / Policy badge */}
        <div className="mt-0.5 flex items-center space-x-2 text-[11px] text-purple-300/80">
          <span>Room #{roomId}</span>
          <span>•</span>
          <span className="px-1.5 py-0.2 rounded bg-purple-900/60 border border-purple-500/30 font-mono">
            {policyVersion}
          </span>
          {hasAccepted && (
            <span className="flex items-center text-emerald-400 font-medium">
              <Check className="w-3 h-3 mr-0.5" /> Accepted
            </span>
          )}
        </div>
      </div>

      {/* 5. Main Content Area */}
      <div className="flex-1 px-5 flex flex-col justify-center z-10">
        {loading ? (
          <div className="w-full h-44 rounded-[26px] bg-[#14152f]/80 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
            <span className="text-xs text-white/60">Loading party rules...</span>
          </div>
        ) : (
          <div className="w-full bg-[#14152f]/90 backdrop-blur-xl rounded-[26px] border border-purple-500/20 p-4 shadow-2xl flex flex-col space-y-3">
            {/* Primary 5 canonical rules */}
            {primaryRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center space-x-3.5 group cursor-pointer"
                onClick={() => setExpandedDetails((prev) => !prev)}
              >
                {/* Rule Icon matching PNG */}
                <div className="shrink-0">{renderRuleIcon(rule.icon)}</div>
                {/* Rule Title */}
                <div className="flex-1">
                  <span className="text-[14px] font-medium text-white/95 tracking-wide leading-snug">
                    {rule.title}
                  </span>
                </div>
              </div>
            ))}

            {/* Expand / Collapse Extended Guidelines */}
            <button
              onClick={() => setExpandedDetails((prev) => !prev)}
              className="pt-0.5 flex items-center justify-center space-x-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>{expandedDetails ? 'Hide Details' : 'View All Guidelines & Policies'}</span>
              {expandedDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Extended Guidelines Drawer */}
            {expandedDetails && (
              <div className="pt-2 border-t border-white/10 space-y-3 max-h-40 overflow-y-auto pr-1">
                {/* Rule descriptions */}
                {rules.map((r, idx) => (
                  <div key={r.id} className="text-xs bg-white/5 p-2 rounded-xl">
                    <div className="flex items-center justify-between text-white font-medium">
                      <span>{idx + 1}. {r.title}</span>
                      <span className="text-[10px] text-purple-300 uppercase font-mono">
                        {r.isMandatory ? 'Mandatory' : 'Custom'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-white/70">{r.description}</p>
                    {isHost && !r.isMandatory && (
                      <button
                        onClick={() => handleDeleteRule(r.id)}
                        className="mt-1 text-[10px] text-rose-400 hover:text-rose-300 flex items-center"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete Custom Rule
                      </button>
                    )}
                  </div>
                ))}

                {/* Host Actions */}
                {isHost && (
                  <button
                    onClick={() => setShowAddCustomModal(true)}
                    className="w-full py-2 bg-purple-700/40 hover:bg-purple-700/60 border border-purple-500/40 rounded-xl text-xs text-purple-200 flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Guideline</span>
                  </button>
                )}

                {/* Report Violation */}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full py-1.5 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 rounded-xl text-[11px] text-rose-300 flex items-center justify-center space-x-1"
                >
                  <Flag className="w-3 h-3" />
                  <span>Report Rule Violation (Safety Tools)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Checkbox acknowledgement */}
        <div className="mt-2.5 flex items-center justify-center space-x-2 text-xs text-white/80 select-none">
          <input
            type="checkbox"
            id="party-rules-agree-check"
            checked={agreedCheckbox}
            onChange={(e) => setAgreedCheckbox(e.target.checked)}
            className="w-4 h-4 rounded border-purple-500/50 bg-[#161730] text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="party-rules-agree-check" className="cursor-pointer text-[12px] text-white/85">
            I agree to the Party Rules and Guidelines
          </label>
        </div>

        {/* Action Button: I Agree */}
        <div className="mt-2 mb-0.5">
          <button
            onClick={handleAccept}
            disabled={!agreedCheckbox || submitting}
            data-action="agree-rules"
            data-testid="btn-agree-rules"
            className={`w-full h-10.5 rounded-2xl font-bold text-[15px] tracking-wide text-white flex items-center justify-center shadow-lg transition-all active:scale-[0.98] ${
              !agreedCheckbox || submitting
                ? 'bg-purple-900/40 text-white/40 cursor-not-allowed border border-purple-500/20'
                : 'bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:brightness-110 shadow-purple-600/40'
            }`}
          >
            {submitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : hasAccepted ? (
              <span>Continue to Party</span>
            ) : (
              <span>I Agree</span>
            )}
          </button>
        </div>
      </div>

      {/* 6. Footer Watermark Badge */}
      <div className="w-full flex justify-center pb-2 pt-0 z-10">
        <div className="px-4 py-1 rounded-full bg-purple-950/40 border border-purple-500/20 text-[11px] font-medium text-white/70 tracking-wide backdrop-blur-md">
          05_10 Party Rules
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-4 right-4 bg-purple-950/95 border border-purple-500/60 rounded-xl px-4 py-2.5 text-xs text-purple-100 shadow-2xl flex items-center space-x-2 z-50 animate-fade-in backdrop-blur-md">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
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

      {/* Host Add Custom Rule Modal */}
      {showAddCustomModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#161730] border border-purple-500/30 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Add Custom Guideline</h3>
              <button onClick={() => setShowAddCustomModal(false)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustomRule} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] text-white/70">Rule Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Mic muted when singing"
                  maxLength={100}
                  required
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/70">Description (Optional)</label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Briefly explain the guideline"
                  rows={2}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="flex-1 py-2 bg-white/10 rounded-xl text-xs text-white/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white"
                >
                  Save Guideline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safety Tools Report Violation Modal */}
      {showReportModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#161730] border border-rose-500/30 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Flag className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Report Rule Violation</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleReportViolation} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] text-white/70">User to Report (ID or Nickname)</label>
                <input
                  type="text"
                  value={reportTargetUser}
                  onChange={(e) => setReportTargetUser(e.target.value)}
                  placeholder="e.g. viewer_david"
                  required
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-white/70">Violated Rule</label>
                <select
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="w-full mt-1 bg-[#100d27] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {rules.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-white/70">Details / Evidence</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe the incident"
                  rows={2}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2 bg-white/10 rounded-xl text-xs text-white/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-semibold text-white"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
