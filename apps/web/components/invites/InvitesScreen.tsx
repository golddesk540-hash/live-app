'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DEFAULT_INVITE_MESSAGE,
  DEMO_INVITE_CODE,
  DEMO_INVITE_FULL_URL,
  INITIAL_INVITE_CONTACTS,
  INITIAL_INVITE_HISTORY,
} from './mockInvitesData';
import {
  clearLocalInviteStorage,
  loadLocalInviteHistory,
  loadLocalInviteMessage,
  saveLocalInviteHistory,
  saveLocalInviteMessage,
} from './invitesLocalStore';
import {
  DemoInviteContact,
  InviteHistoryRecord,
  InviteMainTab,
} from './types';
import { InviteSharePanel } from './InviteSharePanel';
import { InviteContactsPanel } from './InviteContactsPanel';
import { InviteHistoryPanel } from './InviteHistoryPanel';
import { InviteDetailView } from './InviteDetailView';
import {
  ArrowLeft,
  Bell,
  Compass,
  History,
  Home,
  MessageCircle,
  MoreVertical,
  PlusSquare,
  RotateCcw,
  Share2,
  Trash2,
  User,
  UserPlus,
  Users,
} from 'lucide-react';

export const InvitesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InviteMainTab>('invite');
  const [inviteMessage, setInviteMessage] = useState<string>(DEFAULT_INVITE_MESSAGE);
  const [contacts, setContacts] = useState<DemoInviteContact[]>(INITIAL_INVITE_CONTACTS);
  const [history, setHistory] = useState<InviteHistoryRecord[]>(INITIAL_INVITE_HISTORY);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    INITIAL_INVITE_HISTORY[0]?.id ?? null
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setInviteMessage(loadLocalInviteMessage());
    const storedHistory = loadLocalInviteHistory();
    setHistory(storedHistory);
    setSelectedRecordId(storedHistory[0]?.id ?? null);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2600);
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied!`);
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch {
      showToast(`Could not auto-copy ${label.toLowerCase()} — please copy manually`);
    }
  };

  const handleChangeMessage = (nextMsg: string) => {
    setInviteMessage(nextMsg);
    saveLocalInviteMessage(nextMsg);
  };

  const handleRestoreDefaultMessage = () => {
    setInviteMessage(DEFAULT_INVITE_MESSAGE);
    saveLocalInviteMessage(DEFAULT_INVITE_MESSAGE);
    showToast('Default invite message restored');
  };

  const handleLogDemoShare = (channelLabel: string) => {
    const newRecord: InviteHistoryRecord = {
      id: `inv_local_share_${Date.now()}`,
      contactName: `${channelLabel} Share`,
      inviteCode: DEMO_INVITE_CODE,
      inviteLink: DEMO_INVITE_FULL_URL,
      invitedDate: 'Nov 12, 2026',
      method: channelLabel,
      status: 'pending',
      isDemoLocal: true,
    };
    setHistory((prev) => {
      const next = [newRecord, ...prev];
      saveLocalInviteHistory(next);
      return next;
    });
    setSelectedRecordId(newRecord.id);
    showToast(`${channelLabel} share preview prepared (local demo log updated)`);
  };

  const handleInviteContacts = (selected: DemoInviteContact[]) => {
    const timestamp = Date.now();
    const created: InviteHistoryRecord[] = selected.map((c, idx) => ({
      id: `inv_local_${timestamp}_${idx}`,
      contactName: c.name,
      contactPhone: c.phoneNumber,
      inviteCode: DEMO_INVITE_CODE,
      inviteLink: DEMO_INVITE_FULL_URL,
      invitedDate: 'Nov 12, 2026',
      method: 'Demo Contact',
      status: 'pending',
      isDemoLocal: true,
    }));

    setHistory((prev) => {
      const next = [...created, ...prev];
      saveLocalInviteHistory(next);
      return next;
    });
    if (created[0]) {
      setSelectedRecordId(created[0].id);
    }
    showToast(
      `Prepared demo invite for ${selected.length} ${selected.length === 1 ? 'contact' : 'contacts'}`
    );
  };

  const switchTab = (tab: InviteMainTab) => {
    setActiveTab(tab);
    setMobileDetailOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleSelectRecord = (record: InviteHistoryRecord) => {
    setSelectedRecordId(record.id);
    setMobileDetailOpen(true);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleRestoreDemoAll = () => {
    clearLocalInviteStorage();
    setInviteMessage(DEFAULT_INVITE_MESSAGE);
    setContacts(INITIAL_INVITE_CONTACTS);
    setHistory(INITIAL_INVITE_HISTORY);
    setSelectedRecordId(INITIAL_INVITE_HISTORY[0]?.id ?? null);
    setMobileDetailOpen(false);
    showToast('Restored default Popo Live demo invites');
  };

  const selectedRecord = history.find((item) => item.id === selectedRecordId) ?? null;

  return (
    <div
      data-testid="invites-screen"
      className="min-h-screen bg-[#0D031B] text-white flex flex-col pb-24 lg:pb-10"
    >
      {/* Top Popo Live Branded App Bar */}
      <header className="sticky top-0 z-40 border-b border-purple-400/20 bg-[#120624]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/live"
              aria-label="Back to Popo Live Home"
              className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/90 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link href="/live" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF1A6C] to-[#9333EA] flex items-center justify-center shadow-glow-pink">
                <span className="font-black text-white text-sm tracking-tight">P</span>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-tight text-white">Popo Live</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#FF1A6C]/20 border border-[#FF1A6C]/35 text-[9px] font-extrabold text-[#FF4D8D] uppercase tracking-wider">
                    Invites
                  </span>
                </div>
                <p className="text-[10px] text-purple-200/60 hidden sm:block">Share &amp; Grow Community</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchTab('history')}
              data-testid="invites-header-history-btn"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-purple-400/25 text-xs font-bold text-purple-100 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-[#FF4D8D]" />
              <span className="hidden sm:inline">History ({history.length})</span>
              <span className="sm:hidden">{history.length}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHeaderMenu((v) => !v)}
                data-testid="invites-header-menu-btn"
                aria-label="Invites options"
                className="p-2 rounded-full bg-[#1C0D38] hover:bg-[#28154D] border border-white/10 text-purple-100/85 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showHeaderMenu && (
                <div
                  data-testid="invites-header-menu"
                  className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#1A0B33] border border-purple-400/25 shadow-2xl p-1.5 z-50"
                >
                  <button
                    type="button"
                    data-testid="menu-clear-contacts-btn"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setContacts([]);
                      setActiveTab('contacts');
                      showToast('Cleared demo contacts (empty state preview)');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Preview Empty Contacts
                  </button>
                  <button
                    type="button"
                    data-testid="menu-clear-history-btn"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setHistory([]);
                      saveLocalInviteHistory([]);
                      setSelectedRecordId(null);
                      setMobileDetailOpen(false);
                      setActiveTab('history');
                      showToast('Cleared demo invite history');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Preview Empty History
                  </button>
                  <button
                    type="button"
                    data-testid="menu-restore-invites-btn"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      handleRestoreDemoAll();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> Restore Demo Invites
                  </button>
                  <Link
                    href="/notifications"
                    onClick={() => setShowHeaderMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#FF4D8D]" /> Notifications
                  </Link>
                  <Link
                    href="/inbox"
                    onClick={() => setShowHeaderMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-100 hover:bg-white/10 flex items-center gap-2"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-cyan-300" /> Open Inbox
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-5">
        {/* Heading Card */}
        <section className="rounded-3xl bg-[#110523]/90 border border-purple-400/20 p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF1A6C] to-[#9333EA] flex items-center justify-center shadow-glow-pink shrink-0">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-white">
                Invite Friends
              </h1>
              <p className="text-xs text-purple-200/70">
                Grow your Popo Live circle
              </p>
            </div>
          </div>

          {/* Mobile Section Tabs (lg shows responsive multi-column panels side by side) */}
          <div
            role="tablist"
            aria-label="Invites sections"
            className="flex lg:hidden items-center gap-1.5 bg-[#1B0B36] p-1.5 rounded-2xl border border-purple-400/20 scroll-mt-20"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'invite'}
              data-testid="invites-tab-invite"
              onClick={() => switchTab('invite')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap scroll-mt-20 ${
                activeTab === 'invite'
                  ? 'bg-[#FF1A6C] text-white shadow-glow-pink'
                  : 'text-purple-200/75 hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'contacts'}
              data-testid="invites-tab-contacts"
              onClick={() => switchTab('contacts')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap scroll-mt-20 ${
                activeTab === 'contacts'
                  ? 'bg-[#FF1A6C] text-white shadow-glow-pink'
                  : 'text-purple-200/75 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Contacts</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              data-testid="invites-tab-history"
              onClick={() => switchTab('history')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap scroll-mt-20 ${
                activeTab === 'history'
                  ? 'bg-[#FF1A6C] text-white shadow-glow-pink'
                  : 'text-purple-200/75 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>
        </section>

        {/* Responsive Multi-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-6 items-start">
          {/* LEFT COLUMN: Share Invite + Demo Contacts */}
          <div className="space-y-6">
            <div className={activeTab === 'invite' ? 'block' : 'hidden lg:block'}>
              <InviteSharePanel
                message={inviteMessage}
                onChangeMessage={handleChangeMessage}
                onRestoreDefaultMessage={handleRestoreDefaultMessage}
                onCopyText={handleCopyText}
                onOpenHistoryTab={() => {
                  setActiveTab('history');
                  setMobileDetailOpen(false);
                }}
                onLogDemoShare={handleLogDemoShare}
              />
            </div>

            <div className={activeTab === 'contacts' ? 'block' : 'hidden lg:block'}>
              <InviteContactsPanel
                contacts={contacts}
                onInviteContacts={handleInviteContacts}
                onRestoreDemoContacts={() => setContacts(INITIAL_INVITE_CONTACTS)}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Invite History + Invitation Detail */}
          <div
            className={`${
              activeTab === 'history' ? 'space-y-6' : 'hidden lg:block lg:space-y-6'
            }`}
          >
            <div className={mobileDetailOpen ? 'hidden lg:block' : 'block'}>
              <InviteHistoryPanel
                records={history}
                selectedRecordId={selectedRecordId}
                onSelectRecord={handleSelectRecord}
                onRestoreDemoHistory={() => {
                  setHistory(INITIAL_INVITE_HISTORY);
                  saveLocalInviteHistory(INITIAL_INVITE_HISTORY);
                  setSelectedRecordId(INITIAL_INVITE_HISTORY[0]?.id ?? null);
                  showToast('Restored sample invite history');
                }}
              />
            </div>

            <div className={mobileDetailOpen ? 'block' : 'hidden lg:block'}>
              <InviteDetailView
                record={selectedRecord}
                onBackMobile={() => setMobileDetailOpen(false)}
                onCopyText={handleCopyText}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav Bar */}
      {!mobileDetailOpen && (
        <nav
          aria-label="Mobile quick navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-[#130626]/95 backdrop-blur-xl border-t border-purple-400/20 flex items-center justify-around px-2"
        >
          <Link
            href="/live"
            className="flex flex-col items-center gap-0.5 text-purple-200/60 hover:text-white"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <Link
            href="/square"
            className="flex flex-col items-center gap-0.5 text-purple-200/60 hover:text-white"
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Square</span>
          </Link>
          <Link
            href="/square/create"
            aria-label="Create Post"
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF1A6C] to-[#9333EA] flex items-center justify-center text-white shadow-glow-pink"
          >
            <PlusSquare className="w-5 h-5" />
          </Link>
          <Link
            href="/inbox"
            className="flex flex-col items-center gap-0.5 text-purple-200/60 hover:text-white"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Inbox</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center gap-0.5 text-[#FF1A6C]"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-extrabold">Me</span>
          </Link>
        </nav>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div
          data-testid="invites-toast"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1F0E3D]/95 border border-[#FF1A6C]/50 text-white text-xs font-bold shadow-glow-pink backdrop-blur-md whitespace-nowrap pointer-events-none"
        >
          {toast}
        </div>
      )}
    </div>
  );
};
