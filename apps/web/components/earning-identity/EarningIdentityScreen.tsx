'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useUnreadNotificationsCount } from '@/components/notifications/useUnreadNotificationsCount';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Coins,
  Compass,
  Edit3,
  FileCheck2,
  Heart,
  Home,
  Lock,
  MoreVertical,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import {
  DOCUMENT_TYPE_OPTIONS,
  STATUS_METADATA_MAP,
  createInitialEarningIdentityState,
  createPresetIdentityState,
  getDocumentTypeLabel,
  maskContactPhone,
  maskDateOfBirth,
  maskDocumentNumber,
} from './mockEarningIdentityData';
import {
  EarningIdentityState,
  EarningIdentityStatus,
  IdentityStepId,
  IdentityViewMode,
  PersonalIdentityFormData,
  UploadedIdentityFile,
} from './types';
import { VerificationProgressTracker } from './VerificationProgressTracker';
import { PersonalIdentityForm } from './PersonalIdentityForm';
import { IdentityDocumentSection } from './IdentityDocumentSection';
import { VerificationStatusPanel } from './VerificationStatusPanel';
import { IdentityHelpSection } from './IdentityHelpSection';

interface EarningIdentityScreenProps {
  initialView?: IdentityViewMode;
}

export const EarningIdentityScreen: React.FC<EarningIdentityScreenProps> = ({
  initialView = 'dashboard',
}) => {
  const unreadNotifications = useUnreadNotificationsCount();
  const [identityState, setIdentityState] = useState<EarningIdentityState>(
    createInitialEarningIdentityState
  );
  const [viewMode, setViewMode] = useState<IdentityViewMode>(initialView);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2600);
  };

  const personalCompleted = useMemo(() => {
    const f = identityState.form;
    return Boolean(
      f.legalFullName.trim().length >= 3 &&
        f.countryCode &&
        f.dateOfBirth &&
        f.documentNumber.trim().length >= 5 &&
        f.contactPhone.trim().length >= 6
    );
  }, [identityState.form]);

  const activeDocOption = useMemo(
    () =>
      DOCUMENT_TYPE_OPTIONS.find((item) => item.id === identityState.form.documentType) ||
      DOCUMENT_TYPE_OPTIONS[0],
    [identityState.form.documentType]
  );

  const documentsCompleted = useMemo(() => {
    if (!identityState.frontDocument) return false;
    if (activeDocOption.requiresBackSide && !identityState.backDocument) return false;
    return true;
  }, [identityState.frontDocument, identityState.backDocument, activeDocOption.requiresBackSide]);

  const submissionCompleted = useMemo(
    () =>
      identityState.status === 'submitted' ||
      identityState.status === 'under_review' ||
      identityState.status === 'verified',
    [identityState.status]
  );

  const statusMeta = STATUS_METADATA_MAP[identityState.status];

  const handleSavePersonal = (updated: PersonalIdentityFormData, goToDocuments?: boolean) => {
    setIdentityState((prev) => {
      const nextStatus: EarningIdentityStatus =
        prev.status === 'not_started' || prev.status === 'rejected'
          ? 'incomplete'
          : prev.status;
      return {
        ...prev,
        status: nextStatus,
        lastUpdatedLabel: 'Saved locally just now',
        form: updated,
      };
    });
    showToast('Personal identity information saved locally');
    setViewMode(goToDocuments ? 'documents' : 'dashboard');
  };

  const handleUpdateDocument = (side: 'front' | 'back', file: UploadedIdentityFile | null) => {
    setIdentityState((prev) => ({
      ...prev,
      status: prev.status === 'not_started' ? 'incomplete' : prev.status,
      lastUpdatedLabel: 'Updated document preview locally',
      frontDocument: side === 'front' ? file : prev.frontDocument,
      backDocument: side === 'back' ? file : prev.backDocument,
    }));
  };

  const handleContinueVerification = () => {
    if (!personalCompleted) {
      setViewMode('personal');
      return;
    }
    if (!documentsCompleted) {
      setViewMode('documents');
      return;
    }
    if (!submissionCompleted) {
      setViewMode('review');
      return;
    }
    setViewMode('status');
  };

  const handleSubmitDemoVerification = () => {
    if (!personalCompleted) {
      setReviewError('Please complete all required personal details before submitting.');
      return;
    }
    if (!documentsCompleted) {
      setReviewError('Please attach the required local document preview(s) before submitting.');
      return;
    }
    if (!reviewConfirmed) {
      setReviewError('Please confirm the local frontend demo preview acknowledgment first.');
      return;
    }

    setReviewError(null);
    const nowLabel = new Date().toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setIdentityState((prev) => ({
      ...prev,
      status: 'submitted',
      submittedAtLabel: `${nowLabel} (Local Demo)`,
      lastUpdatedLabel: 'Submitted locally',
      rejectionReasonPlaceholder: null,
    }));
    setSubmissionModalOpen(true);
    setViewMode('status');
  };

  const handleSelectStatusPreset = (presetStatus: EarningIdentityStatus) => {
    setIdentityState((prev) => {
      if (prev.frontDocument?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.frontDocument.previewUrl);
      }
      if (prev.backDocument?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.backDocument.previewUrl);
      }
      return createPresetIdentityState(presetStatus);
    });
    setReviewConfirmed(false);
    setReviewError(null);
    setShowOptionsMenu(false);
    showToast(`Switched preview to: ${STATUS_METADATA_MAP[presetStatus].label}`);
  };

  const documentSummaryText = useMemo(() => {
    const label = getDocumentTypeLabel(identityState.form.documentType);
    if (!identityState.frontDocument) {
      return 'Not submitted';
    }
    const sides =
      activeDocOption.requiresBackSide && identityState.backDocument
        ? 'Front & Back local preview ready'
        : activeDocOption.requiresBackSide
        ? 'Front preview ready · Back needed'
        : 'Bio-page local preview ready';
    const maskedNo = identityState.form.documentNumber
      ? ` · ${maskDocumentNumber(identityState.form.documentNumber)}`
      : '';
    return `${label}${maskedNo} · ${sides}`;
  }, [
    identityState.form.documentType,
    identityState.form.documentNumber,
    identityState.frontDocument,
    identityState.backDocument,
    activeDocOption.requiresBackSide,
  ]);

  const handleSelectStep = (step: IdentityStepId) => {
    setViewMode(step);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      data-testid="earning-identity-screen"
      className="min-h-screen bg-[#0D031B] text-white flex flex-col pb-8 lg:pb-10"
    >
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 border-b border-purple-400/20 bg-[#120624]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (viewMode !== 'dashboard') {
                  setViewMode('dashboard');
                } else if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back();
                } else if (typeof window !== 'undefined') {
                  window.location.href = '/earnings';
                }
              }}
              data-testid="identity-header-back-btn"
              aria-label="Back"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/90 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <Link href="/live" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#1F0B3B] border-2 border-[#FF1A6C] flex items-center justify-center shadow-glow-pink">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-tight text-white">Popo Live</span>
                  <span className="hidden xs:inline-block px-1.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/35 text-[9px] font-extrabold text-amber-300 uppercase tracking-wider">
                    Phase 9.1
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav aria-label="Creator Identity Navigation" className="hidden lg:flex items-center gap-1.5">
            {[
              { href: '/live', label: 'Home', active: false },
              { href: '/earnings?preview=demo', label: 'Host Earnings', active: false },
              { href: '/earning-identity', label: 'Earning Identity', active: viewMode !== 'status' },
              { href: '/earning-identity/status', label: 'Verification Status', active: viewMode === 'status' },
              { href: '/square', label: 'Square', active: false },
              { href: '/profile', label: 'Profile', active: false },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  item.active
                    ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                    : 'text-purple-200/75 hover:text-white hover:bg-[#1E0E3D]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons matching 09_01_identity_for_earning.png */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
            >
              <Bell className="w-4 h-4 text-[#FF6BA3]" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF1A6C] text-white text-[9px] font-black flex items-center justify-center border border-[#120624]">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              href="/help"
              aria-label="Creator Support"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
            >
              <Heart className="w-4 h-4 text-purple-200/80" />
            </Link>

            {/* Tight Relative Wrapper for Options Menu */}
            <div className="relative">
              <button
                type="button"
                data-testid="identity-options-menu-btn"
                onClick={() => setShowOptionsMenu((v) => !v)}
                aria-label="Identity preview options"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showOptionsMenu && (
                <div
                  data-testid="identity-options-menu"
                  className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-[#16082E] border border-purple-400/25 shadow-2xl p-2 z-50 space-y-1 text-xs"
                >
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-200/55">
                    Demo Status Presets
                  </div>
                  {(
                    [
                      'not_started',
                      'incomplete',
                      'submitted',
                      'under_review',
                      'verified',
                      'rejected',
                    ] as EarningIdentityStatus[]
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      data-testid={`menu-preset-${st}`}
                      onClick={() => handleSelectStatusPreset(st)}
                      className={`w-full text-left px-3 py-2 rounded-xl font-bold transition-colors flex items-center justify-between ${
                        identityState.status === st
                          ? 'bg-[#FF1A6C]/20 text-[#FF6BA3]'
                          : 'text-purple-100/85 hover:bg-white/10'
                      }`}
                    >
                      <span>{STATUS_METADATA_MAP[st].label}</span>
                      {identityState.status === st && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  ))}

                  <div className="border-t border-white/10 my-1" />
                  <button
                    type="button"
                    data-testid="menu-reset-demo-btn"
                    onClick={() => handleSelectStatusPreset('incomplete')}
                    className="w-full text-left px-3 py-2 rounded-xl font-bold text-amber-300 hover:bg-white/10 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo State</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-6 space-y-5">
        {/* Page Heading + View Switcher Pills */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Earning Identity
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/70 mt-1">
              Complete your host earning profile · Frontend preview only
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {(
              [
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'personal', label: 'Personal Info' },
                { id: 'documents', label: 'Documents' },
                { id: 'review', label: 'Review' },
                { id: 'status', label: 'Status' },
              ] as { id: IdentityViewMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`identity-view-tab-${tab.id}`}
                onClick={() => setViewMode(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                  viewMode === tab.id
                    ? 'bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white shadow-glow-pink'
                    : 'bg-[#190B33] text-purple-200/75 border border-purple-400/20 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* LEFT / PRIMARY CONTENT COLUMN */}
          <div className="space-y-5 min-w-0">
            {/* Host Profile Status Hero Card shown first on Dashboard (matches 09_01_identity_for_earning.png) */}
            {viewMode === 'dashboard' && (
              <section
                data-testid="identity-host-hero-card"
                className="rounded-3xl bg-gradient-to-br from-[#230E45] via-[#180A33] to-[#130627] border border-purple-400/25 p-5 sm:p-6 space-y-5 shadow-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] bg-gradient-to-tr from-[#FF1A6C] to-[#EC4899] shadow-glow-pink">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#14072A]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={identityState.host.avatarUrl}
                          alt={identityState.host.hostName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <h2 className="text-lg sm:text-xl font-black text-white truncate">
                      {identityState.host.hostName}
                    </h2>
                    <p className="text-xs text-purple-200/70">
                      {identityState.host.username} · Host ID: {identityState.host.hostId}
                    </p>
                    <div>
                      <span
                        data-testid="dashboard-status-pill"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusMeta.pillClasses}`}
                      >
                        {statusMeta.badgeText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Progress Meter */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-200/75 font-medium">Earning profile status</span>
                    <span
                      data-testid="dashboard-status-label"
                      className={`font-extrabold ${statusMeta.textAccentClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#110424] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF1A6C] to-amber-400 transition-all duration-300"
                      style={{ width: `${statusMeta.progressPercent}%` }}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Step-by-Step Progress Strip */}
            <VerificationProgressTracker
              activeView={viewMode}
              personalCompleted={personalCompleted}
              documentsCompleted={documentsCompleted}
              submissionCompleted={submissionCompleted}
              onSelectStep={handleSelectStep}
            />

            {/* VIEW 1: EARNING IDENTITY DASHBOARD */}
            {viewMode === 'dashboard' && (
              <div data-testid="identity-dashboard-view" className="space-y-5">
                {/* Stacked Identity Information Summary Cards (Exact match to 09_01 PNG) */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      Identity information
                    </h2>
                    <button
                      type="button"
                      data-testid="dashboard-edit-info-btn"
                      onClick={() => setViewMode('personal')}
                      className="text-xs font-bold text-[#FF4D8D] hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Information</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('personal')}
                      className="w-full text-left rounded-2xl bg-[#180A33] hover:bg-[#210F44] border border-purple-400/20 px-4 py-3.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-extrabold text-white">Legal name</div>
                        <div
                          data-testid="summary-legal-name"
                          className="text-xs text-purple-200/75 mt-0.5"
                        >
                          {identityState.form.legalFullName || 'Not entered'}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-200/50 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('personal')}
                      className="w-full text-left rounded-2xl bg-[#180A33] hover:bg-[#210F44] border border-purple-400/20 px-4 py-3.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-extrabold text-white">Country</div>
                        <div
                          data-testid="summary-country"
                          className="text-xs text-purple-200/75 mt-0.5"
                        >
                          {identityState.form.countryName}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-200/50 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('personal')}
                      className="w-full text-left rounded-2xl bg-[#180A33] hover:bg-[#210F44] border border-purple-400/20 px-4 py-3.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-extrabold text-white">Date of birth</div>
                        <div
                          data-testid="summary-dob"
                          className="text-xs font-mono text-purple-200/75 mt-0.5"
                        >
                          {maskDateOfBirth(identityState.form.dateOfBirth)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-200/50 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('documents')}
                      className="w-full text-left rounded-2xl bg-[#180A33] hover:bg-[#210F44] border border-purple-400/20 px-4 py-3.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-white">Identity document</div>
                        <div
                          data-testid="summary-document-status"
                          className="text-xs text-purple-200/75 mt-0.5 truncate"
                        >
                          {documentSummaryText}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-200/50 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('personal')}
                      className="w-full text-left rounded-2xl bg-[#180A33] hover:bg-[#210F44] border border-purple-400/20 px-4 py-3.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-extrabold text-white">Contact information</div>
                        <div
                          data-testid="summary-contact-phone"
                          className="text-xs font-mono text-purple-200/75 mt-0.5"
                        >
                          {maskContactPhone(identityState.form.contactPhone)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-200/50 shrink-0" />
                    </button>
                  </div>

                  {/* Primary Magenta CTA Button matching reference PNG */}
                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      data-testid="identity-continue-btn"
                      onClick={handleContinueVerification}
                      className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] hover:brightness-110 active:scale-[0.99] text-white text-sm sm:text-base font-black shadow-glow-pink transition-all"
                    >
                      {statusMeta.nextActionLabel}
                    </button>

                    <button
                      type="button"
                      data-testid="identity-view-status-btn"
                      onClick={() => setViewMode('status')}
                      className="w-full py-2.5 px-5 rounded-full bg-[#190B33] hover:bg-[#25124A] border border-purple-400/25 text-xs font-bold text-purple-100 transition-colors"
                    >
                      View Verification Status Details
                    </button>
                  </div>
                </section>

                {/* Help Section for Mobile/Tablet directly inside scroll */}
                <div className="lg:hidden">
                  <IdentityHelpSection />
                </div>
              </div>
            )}

            {/* VIEW 2: PERSONAL INFORMATION */}
            {viewMode === 'personal' && (
              <PersonalIdentityForm
                initialData={identityState.form}
                onSave={handleSavePersonal}
                onCancel={() => setViewMode('dashboard')}
              />
            )}

            {/* VIEW 3: IDENTITY DOCUMENT SECTION */}
            {viewMode === 'documents' && (
              <IdentityDocumentSection
                documentType={identityState.form.documentType}
                frontDocument={identityState.frontDocument}
                backDocument={identityState.backDocument}
                onChangeDocumentType={(docType) =>
                  setIdentityState((prev) => ({
                    ...prev,
                    form: { ...prev.form, documentType: docType },
                  }))
                }
                onUpdateDocument={handleUpdateDocument}
                onBack={() => setViewMode('personal')}
                onContinueToReview={() => setViewMode('review')}
              />
            )}

            {/* VIEW 4: REVIEW & LOCAL DEMO SUBMISSION */}
            {viewMode === 'review' && (
              <section
                data-testid="identity-review-screen"
                className="rounded-3xl bg-[#130728]/95 border border-purple-400/20 p-5 sm:p-6 space-y-5 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      Review Information
                    </h2>
                    <p className="text-xs text-purple-200/65 mt-0.5">
                      Confirm masked details and local document previews before local demo submission
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-[11px] font-bold text-amber-300 self-start sm:self-auto">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Masked Review</span>
                  </span>
                </div>

                {/* Masked Summary Details */}
                <div className="rounded-2xl bg-[#180A33] border border-white/10 p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-sm">Personal Details</span>
                    <button
                      type="button"
                      onClick={() => setViewMode('personal')}
                      className="text-xs font-bold text-[#FF4D8D] hover:underline"
                    >
                      Edit Personal Info
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="text-purple-200/55">Legal Full Name</div>
                      <div className="font-bold text-white mt-0.5">
                        {identityState.form.legalFullName || 'Missing'}
                      </div>
                    </div>
                    <div>
                      <div className="text-purple-200/55">Country</div>
                      <div className="font-bold text-white mt-0.5">
                        {identityState.form.countryName}
                      </div>
                    </div>
                    <div>
                      <div className="text-purple-200/55">Date of Birth (Masked)</div>
                      <div className="font-bold text-white font-mono mt-0.5">
                        {maskDateOfBirth(identityState.form.dateOfBirth)}
                      </div>
                    </div>
                    <div>
                      <div className="text-purple-200/55">Document Number (Masked)</div>
                      <div className="font-bold text-white font-mono mt-0.5">
                        {getDocumentTypeLabel(identityState.form.documentType)} ·{' '}
                        {maskDocumentNumber(identityState.form.documentNumber)}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-purple-200/55">Contact Info (Masked)</div>
                      <div className="font-bold text-white font-mono mt-0.5">
                        {maskContactPhone(identityState.form.contactPhone)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Previews */}
                <div className="rounded-2xl bg-[#180A33] border border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white text-sm">Document Previews</span>
                    <button
                      type="button"
                      onClick={() => setViewMode('documents')}
                      className="text-xs font-bold text-[#FF4D8D] hover:underline"
                    >
                      Edit Documents
                    </button>
                  </div>

                  {!identityState.frontDocument ? (
                    <div className="text-xs text-rose-300">
                      No local document preview attached yet. Click Edit Documents to choose a sample or local image.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#110424] border border-white/10 p-2.5 space-y-1.5">
                        <div className="text-[11px] font-bold text-purple-200/80">Front Side</div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={identityState.frontDocument.previewUrl}
                          alt="Review front preview"
                          className="w-full h-32 object-contain rounded-lg bg-[#0D031B]"
                        />
                      </div>

                      {activeDocOption.requiresBackSide && identityState.backDocument && (
                        <div className="rounded-xl bg-[#110424] border border-white/10 p-2.5 space-y-1.5">
                          <div className="text-[11px] font-bold text-purple-200/80">Back Side</div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={identityState.backDocument.previewUrl}
                            alt="Review back preview"
                            className="w-full h-32 object-contain rounded-lg bg-[#0D031B]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirmation Checkbox */}
                <label className="flex items-start gap-2.5 rounded-2xl bg-[#1A0B35] border border-purple-400/20 p-3.5 cursor-pointer text-xs text-purple-100/85">
                  <input
                    type="checkbox"
                    data-testid="identity-review-confirm-checkbox"
                    checked={reviewConfirmed}
                    onChange={(e) => {
                      setReviewConfirmed(e.target.checked);
                      setReviewError(null);
                    }}
                    className="mt-0.5 accent-[#FF1A6C]"
                  />
                  <span>
                    I understand this is a <strong>frontend-only demo submission</strong>. No documents
                    are uploaded to external servers or permanently stored.
                  </span>
                </label>

                {reviewError && (
                  <div
                    data-testid="identity-review-error"
                    className="rounded-2xl bg-rose-500/15 border border-rose-400/40 px-4 py-3 text-xs font-semibold text-rose-200"
                  >
                    {reviewError}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setViewMode('documents')}
                    className="border border-white/10 bg-[#1B0B38]/60 hover:bg-[#27124C]"
                  >
                    Back to Documents
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    data-testid="identity-submit-demo-btn"
                    onClick={handleSubmitDemoVerification}
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Submit Demo Request
                  </Button>
                </div>
              </section>
            )}

            {/* VIEW 5: VERIFICATION STATUS SCREEN */}
            {viewMode === 'status' && (
              <VerificationStatusPanel
                state={identityState}
                onSelectStatusPreset={handleSelectStatusPreset}
                onEditInformation={() => setViewMode('personal')}
                onBackToDashboard={() => setViewMode('dashboard')}
              />
            )}
          </div>

          {/* RIGHT SIDEBAR RAIL (Desktop) */}
          <aside className="hidden lg:block space-y-5 lg:sticky lg:top-20">
            <div className="rounded-3xl bg-[#130728]/95 border border-purple-400/20 p-5 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-200/65">
                  Session Summary
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusMeta.pillClasses}`}>
                  {statusMeta.label}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-purple-200/60">Personal Details</span>
                  <span className={personalCompleted ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                    {personalCompleted ? 'Ready' : 'Incomplete'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-200/60">Document Previews</span>
                  <span className={documentsCompleted ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                    {documentsCompleted ? 'Ready' : 'Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-200/60">Storage Mode</span>
                  <span className="text-purple-100 font-bold inline-flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#FF4D8D]" /> Memory Only
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewMode('status')}
                className="w-full py-2.5 rounded-full bg-[#1E0D3D] hover:bg-[#2A1554] border border-purple-400/25 text-xs font-bold text-white transition-colors"
              >
                Open Verification Status Screen
              </button>
            </div>

            <IdentityHelpSection />
          </aside>
        </div>
      </main>

      {/* Submission Confirmation Modal */}
      {submissionModalOpen && (
        <div
          data-testid="identity-submission-confirmation"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#15072E] border border-[#FF1A6C]/45 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Local Demo Request Submitted</h3>
            <p className="text-xs text-purple-100/80 leading-relaxed">
              Your Earning Identity sample details have been recorded locally for this session (
              <strong>Submitted</strong> display state). No real identity check or external upload occurred.
            </p>
            <button
              type="button"
              data-testid="identity-confirmation-done-btn"
              onClick={() => setSubmissionModalOpen(false)}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#FF1A6C] to-[#EC4899] text-white text-sm font-black shadow-glow-pink"
            >
              View Verification Status
            </button>
          </div>
        </div>
      )}

      {/* Non-blocking Toast */}
      {toast && (
        <div
          data-testid="identity-toast"
          className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#240F4A] border border-[#FF1A6C]/50 text-xs font-bold text-white shadow-2xl"
        >
          {toast}
        </div>
      )}

      {/* Inline Mobile Quick Footer Navigation (non-overlapping with forms) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden mt-8 border-t border-purple-400/20 bg-[#120624]/80 px-4 py-3 flex items-center justify-around text-[10px] font-bold"
      >
        <Link href="/live" className="flex flex-col items-center gap-1 text-purple-200/70">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link href="/earnings?preview=demo" className="flex flex-col items-center gap-1 text-purple-200/70">
          <Coins className="w-4 h-4" />
          <span>Earnings</span>
        </Link>
        <Link href="/earning-identity" className="flex flex-col items-center gap-1 text-[#FF4D8D]">
          <ShieldCheck className="w-4 h-4" />
          <span>Identity</span>
        </Link>
        <Link href="/square/discovery" className="flex flex-col items-center gap-1 text-purple-200/70">
          <Compass className="w-4 h-4" />
          <span>Discovery</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-purple-200/70">
          <User className="w-4 h-4" />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
};
