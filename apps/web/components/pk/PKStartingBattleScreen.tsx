'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  Users,
  Shuffle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Radio,
  Eye,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { LiveHost, PKInvitation, RandomMatchStatus } from '@/lib/pk';

interface PKStartingBattleScreenProps {
  currentHostId?: string;
  currentRoomNumber?: string;
  currentHostNickname?: string;
  onBack?: () => void;
  onBattleConfirmed?: (battleId: string, opponent: any) => void;
  initialTab?: 'invite' | 'random';
}

export default function PKStartingBattleScreen({
  currentHostId = 'host_maria_7001',
  currentRoomNumber = '7001',
  currentHostNickname = 'Maria Live',
  onBack,
  onBattleConfirmed,
  initialTab = 'invite',
}: PKStartingBattleScreenProps) {
  const [activeTab, setActiveTab] = useState<'invite' | 'random'>(initialTab);
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [hosts, setHosts] = useState<LiveHost[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Active Outgoing Invitation state
  const [activeInvite, setActiveInvite] = useState<PKInvitation | null>(null);
  const [invitingHostId, setInvitingHostId] = useState<string | null>(null);

  // Incoming Invitation state
  const [incomingInvite, setIncomingInvite] = useState<PKInvitation | null>(null);

  // Random Matchmaking state
  const [randomStatus, setRandomStatus] = useState<RandomMatchStatus>('idle');
  const [randomOpponent, setRandomOpponent] = useState<any | null>(null);
  const [randomBattleId, setRandomBattleId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isRtl = lang === 'ur';

  // Localized strings
  const t = {
    title: lang === 'en' ? 'PK Battle' : 'پی کے جنگ',
    inviteTab: lang === 'en' ? 'Invite' : 'دعوت',
    randomTab: lang === 'en' ? 'Random' : 'رینڈم',
    searchPlaceholder: lang === 'en' ? 'Search host or ID' : 'میزبان یا آئی ڈی تلاش کریں',
    online: lang === 'en' ? 'Online' : 'آن لائن',
    inviteBtn: lang === 'en' ? 'Invite' : 'دعوت دیں',
    sending: lang === 'en' ? 'Sending...' : 'بھیج رہا ہے...',
    noHostsFound: lang === 'en' ? 'No live hosts found' : 'کوئی لائیو میزبان نہیں ملا',
    viewers: lang === 'en' ? 'viewers' : 'ناظرین',
    idLabel: lang === 'en' ? 'ID:' : 'آئی ڈی:',
    watermarkLine1: '6.2 Starting a Battle',
    watermarkLine2: '(Invite / Random)',
    // Outgoing Invite Modal
    invitingTitle: lang === 'en' ? 'PK Battle Invitation Sent' : 'پی کے جنگ کی دعوت بھیج دی گئی',
    waitingOpponent: lang === 'en' ? 'Waiting for opponent to accept...' : 'مخالف کے قبول کرنے کا انتظار ہے...',
    cancelInvite: lang === 'en' ? 'Cancel Invitation' : 'دعوت منسوخ کریں',
    expiresIn: lang === 'en' ? 'Expires in' : 'ختم ہونے میں',
    seconds: lang === 'en' ? 's' : 'سیکنڈ',
    // Incoming Invite Modal
    incomingTitle: lang === 'en' ? 'Incoming PK Challenge!' : 'پی کے جنگ کا چیلنج موصول ہوا!',
    wantsToBattle: lang === 'en' ? 'wants to start a 1v1 PK battle with you.' : 'آپ کے ساتھ 1v1 پی کے جنگ شروع کرنا چاہتے ہیں۔',
    accept: lang === 'en' ? 'Accept' : 'قبول کریں',
    reject: lang === 'en' ? 'Decline' : 'مسترد کریں',
    // Random Match
    randomTitle: lang === 'en' ? 'Random Matchmaking' : 'رینڈم میچ میکنگ',
    randomSubtitle: lang === 'en' ? 'Find an available live host for a 1v1 battle' : '1v1 مقابلے کے لیے کسی بھی دستیاب میزبان کو تلاش کریں',
    startRandomBtn: lang === 'en' ? 'Start Random Match' : 'رینڈم میچ تلاش کریں',
    cancelSearchBtn: lang === 'en' ? 'Cancel Search' : 'تلاش منسوخ کریں',
    findingOpponent: lang === 'en' ? 'Finding Opponent...' : 'مخالف کی تلاش جاری ہے...',
    opponentFound: lang === 'en' ? 'Opponent Found!' : 'مخالف مل گیا!',
    waitingConfirmation: lang === 'en' ? 'Waiting for Confirmation...' : 'تصدیق کا انتظار ہے...',
    matchAccepted: lang === 'en' ? 'Match Confirmed!' : 'میچ کی تصدیق ہو گئی!',
    matchCancelled: lang === 'en' ? 'Search Cancelled' : 'تلاش منسوخ کر دی گئی',
    noOpponentAvailable: lang === 'en' ? 'No Opponent Available' : 'کوئی مخالف دستیاب نہیں ہے',
    retrySearch: lang === 'en' ? 'Try Again' : 'دوبارہ کوشش کریں',
  };

  // Toast auto-clear
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch available live hosts
  const fetchHosts = async (queryStr = '') => {
    setLoadingHosts(true);
    try {
      const res = await fetch(`/api/pk/hosts?search=${encodeURIComponent(queryStr)}&excludeHostId=${encodeURIComponent(currentHostId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.hosts)) {
        setHosts(data.hosts);
      }
    } catch (err) {
      console.error('Failed to load live hosts', err);
    } finally {
      setLoadingHosts(false);
    }
  };

  useEffect(() => {
    fetchHosts(searchQuery);
  }, [searchQuery]);

  // 2. Poll for active outgoing invitation status
  useEffect(() => {
    if (!activeInvite || activeInvite.status !== 'pending') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pk/invitation/status?invitationId=${activeInvite.id}`);
        const data = await res.json();

        if (data.success && data.invitation) {
          if (data.invitation.status === 'accepted') {
            setActiveInvite({ ...activeInvite, status: 'accepted' });
            showToast(lang === 'en' ? 'Invitation accepted! Starting battle...' : 'دعوت قبول ہو گئی! جنگ شروع ہو رہی ہے...', 'success');
            if (data.battle) {
              setTimeout(() => {
                if (onBattleConfirmed) {
                  onBattleConfirmed(data.battle.id, data.battle);
                } else if (typeof window !== 'undefined') {
                  window.location.href = `/pk/battle/${data.battle.id}`;
                }
              }, 1200);
            }
          } else if (data.invitation.status === 'rejected') {
            setActiveInvite({ ...activeInvite, status: 'rejected' });
            showToast(lang === 'en' ? 'Host declined the invitation.' : 'میزبان نے دعوت مسترد کر دی۔', 'error');
          } else if (data.invitation.status === 'expired') {
            setActiveInvite({ ...activeInvite, status: 'expired' });
            showToast(lang === 'en' ? 'Invitation expired.' : 'دعوت نامے کی میعاد ختم ہو گئی۔', 'info');
          } else {
            setActiveInvite((prev) => prev ? { ...prev, secondsRemaining: data.invitation.secondsRemaining } : null);
          }
        }
      } catch (err) {
        console.error('Failed to poll invite status', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeInvite?.id, activeInvite?.status]);

  // 3. Poll for incoming invitations directed to current host
  useEffect(() => {
    const checkIncoming = async () => {
      if (activeInvite && activeInvite.status === 'pending') return;
      try {
        const res = await fetch(`/api/pk/invitation/status?hostId=${encodeURIComponent(currentHostId)}&roomNumber=${encodeURIComponent(currentRoomNumber)}`);
        const data = await res.json();
        if (data.success && data.hasActiveInvitation && data.invitation) {
          // Verify current host is the receiver
          if (data.invitation.receiverHostId === currentHostId || data.invitation.receiverRoomNumber === currentRoomNumber) {
            setIncomingInvite(data.invitation);
          }
        } else {
          setIncomingInvite(null);
        }
      } catch {}
    };

    const interval = setInterval(checkIncoming, 3000);
    return () => clearInterval(interval);
  }, [currentHostId, currentRoomNumber, activeInvite]);

  // 4. Poll for Random Matchmaking status if 'finding_opponent'
  useEffect(() => {
    if (randomStatus !== 'finding_opponent') return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const poller = setInterval(async () => {
      try {
        const res = await fetch(`/api/pk/matchmaking/status?hostId=${encodeURIComponent(currentHostId)}`);
        const data = await res.json();

        if (data.success) {
          if (data.status === 'match_accepted' || data.status === 'opponent_found') {
            setRandomStatus('match_accepted');
            setRandomOpponent(data.opponent);
            setRandomBattleId(data.battleId);
            showToast(lang === 'en' ? 'Opponent matched! Connecting battle...' : 'مخالف مل گیا! جنگ سے منسلک ہو رہے ہیں...', 'success');
            if (data.battleId) {
              setTimeout(() => {
                if (onBattleConfirmed) {
                  onBattleConfirmed(data.battleId, data.opponent);
                } else if (typeof window !== 'undefined') {
                  window.location.href = `/pk/battle/${data.battleId}`;
                }
              }, 1500);
            }
          } else if (data.status === 'no_opponent_available') {
            setRandomStatus('no_opponent_available');
            showToast(lang === 'en' ? 'No opponent available right now.' : 'اس وقت کوئی مخالف دستیاب نہیں ہے۔', 'info');
          } else if (data.status === 'match_cancelled') {
            setRandomStatus('match_cancelled');
          }
        }
      } catch (err) {
        console.error('Matchmaking poll error', err);
      }
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [randomStatus, currentHostId]);

  // Send Invitation Action
  const handleSendInvite = async (targetHost: LiveHost) => {
    if (!targetHost.isEligibleForPk) {
      showToast(lang === 'en' ? `${targetHost.nickname} is currently unavailable for PK.` : `${targetHost.nickname} اس وقت پی کے کے لیے دستیاب نہیں ہیں۔`, 'error');
      return;
    }

    setInvitingHostId(targetHost.id);
    try {
      const res = await fetch('/api/pk/invitation/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderHostId: currentHostId,
          senderRoomNumber: currentRoomNumber,
          receiverHostId: targetHost.id,
          battleType: '1v1',
          language: lang,
        }),
      });

      const data = await res.json();
      if (data.success && data.invitation) {
        setActiveInvite(data.invitation);
        showToast(lang === 'en' ? `Invitation sent to ${targetHost.nickname}!` : `${targetHost.nickname} کو دعوت بھیج دی گئی ہے!`, 'success');
      } else {
        const errorMsg = lang === 'ur' && data.errorUr ? data.errorUr : data.error || 'Failed to send invitation';
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      showToast('Network error while sending invitation.', 'error');
    } finally {
      setInvitingHostId(null);
    }
  };

  // Cancel Outgoing Invitation Action
  const handleCancelInvite = async () => {
    if (!activeInvite) return;
    try {
      const res = await fetch('/api/pk/invitation/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: activeInvite.id,
          senderHostId: currentHostId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveInvite(null);
        showToast(lang === 'en' ? 'Invitation cancelled.' : 'دعوت نامہ منسوخ کر دیا گیا۔', 'info');
      }
    } catch {
      setActiveInvite(null);
    }
  };

  // Respond to Incoming Invitation Action (Accept / Reject)
  const handleRespondIncoming = async (action: 'accept' | 'reject') => {
    if (!incomingInvite) return;
    try {
      const res = await fetch('/api/pk/invitation/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: incomingInvite.id,
          receiverHostId: currentHostId,
          action,
          language: lang,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'accept') {
          showToast(lang === 'en' ? 'Challenge accepted! Preparing battle...' : 'چیلنج قبول کر لیا گیا! جنگ کی تیاری ہو رہی ہے...', 'success');
          setIncomingInvite(null);
          if (data.battle) {
            setTimeout(() => {
              if (onBattleConfirmed) {
                onBattleConfirmed(data.battle.id, data.battle);
              } else if (typeof window !== 'undefined') {
                window.location.href = `/pk/battle/${data.battle.id}`;
              }
            }, 1200);
          }
        } else {
          showToast(lang === 'en' ? 'Challenge declined.' : 'چیلنج مسترد کر دیا گیا۔', 'info');
          setIncomingInvite(null);
        }
      } else {
        showToast(data.error || 'Failed to respond', 'error');
        setIncomingInvite(null);
      }
    } catch {
      setIncomingInvite(null);
    }
  };

  // Start Random Matchmaking Action
  const handleStartRandom = async () => {
    setRandomStatus('finding_opponent');
    setElapsedSeconds(0);
    setRandomOpponent(null);
    setRandomBattleId(null);

    try {
      const res = await fetch('/api/pk/matchmaking/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: currentHostId,
          roomNumber: currentRoomNumber,
          battleType: '1v1',
          language: lang,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.status === 'match_accepted') {
          setRandomStatus('match_accepted');
          setRandomOpponent(data.opponent);
          setRandomBattleId(data.battleId);
          showToast(lang === 'en' ? 'Matched with an opponent!' : 'مخالف کے ساتھ میچ ہو گیا!', 'success');
          if (data.battleId) {
            setTimeout(() => {
              if (onBattleConfirmed) {
                onBattleConfirmed(data.battleId, data.opponent);
              } else if (typeof window !== 'undefined') {
                window.location.href = `/pk/battle/${data.battleId}`;
              }
            }, 1500);
          }
        } else {
          setRandomStatus('finding_opponent');
        }
      } else {
        setRandomStatus('no_opponent_available');
        showToast(data.error || 'Failed to start matchmaking', 'error');
      }
    } catch {
      setRandomStatus('no_opponent_available');
      showToast('Network error in matchmaking', 'error');
    }
  };

  // Cancel Random Matchmaking Action
  const handleCancelRandom = async () => {
    try {
      await fetch('/api/pk/matchmaking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: currentHostId }),
      });
    } catch {}
    setRandomStatus('match_cancelled');
    showToast(lang === 'en' ? 'Matchmaking search cancelled.' : 'میچ میکنگ منسوخ کر دی گئی۔', 'info');
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative flex flex-col items-center justify-start min-h-screen w-full bg-[#0d0718] text-white select-none px-4 py-3 sm:py-6"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shadow-2xl backdrop-blur-md transition-all animate-bounce bg-[#22133e]/95 border border-[#ff2d78]/50 text-white">
          {toastMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toastMessage.type === 'info' && <Radio className="w-4 h-4 text-pink-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Mobile Device Frame */}
      <div className="relative w-full max-w-[420px] rounded-[36px] bg-[#140b25] border border-purple-900/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col pb-6 min-h-[780px]">
        {/* Top Phone Speaker Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-black/60 rounded-full z-20 pointer-events-none" />

        {/* Status Bar */}
        <div className="relative z-10 w-full flex items-center justify-between px-6 pt-3 pb-1 text-xs text-gray-300 font-semibold tracking-tight">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            {/* Cellular 4 bars */}
            <div className="flex items-end gap-[1.5px] h-3">
              <span className="w-[3px] h-1 bg-white rounded-sm" />
              <span className="w-[3px] h-1.5 bg-white rounded-sm" />
              <span className="w-[3px] h-2 bg-white rounded-sm" />
              <span className="w-[3px] h-2.5 bg-white rounded-sm" />
            </div>
            {/* WiFi */}
            <span className="text-[11px] leading-none">📶</span>
            {/* Battery Outline */}
            <div className="w-5 h-2.5 border border-white/80 rounded-sm p-[1px] flex items-center">
              <div className="w-full h-full bg-white rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Navigation Header */}
        <div className="relative z-10 flex items-center justify-between px-5 py-3">
          <button
            onClick={onBack || (() => window.history.back())}
            data-action="back"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center transition text-white border border-white/10"
            aria-label="Back"
          >
            <ArrowLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
          </button>

          <h1 className="text-lg font-bold tracking-wide text-white drop-shadow-sm">
            {t.title}
          </h1>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-[#23173d] px-2.5 py-1 rounded-full border border-purple-500/30 text-xs">
            <button
              onClick={() => setLang('en')}
              className={`px-1.5 py-0.5 rounded transition ${lang === 'en' ? 'text-pink-400 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              EN
            </button>
            <span className="text-purple-400/50">|</span>
            <button
              onClick={() => setLang('ur')}
              className={`px-1.5 py-0.5 rounded transition ${lang === 'ur' ? 'text-pink-400 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              اردو
            </button>
          </div>
        </div>

        {/* Tab Switcher (Segmented Control matching 06_02 reference) */}
        <div className="px-5 mt-2">
          <div className="bg-[#1f1338] p-1 rounded-full flex items-center border border-purple-800/30">
            {/* Invite Tab */}
            <button
              onClick={() => setActiveTab('invite')}
              data-tab="invite"
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'invite'
                  ? 'bg-[#ff2d78] text-white shadow-[0_0_15px_rgba(255,45,120,0.5)]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.inviteTab}</span>
            </button>

            {/* Random Tab */}
            <button
              onClick={() => setActiveTab('random')}
              data-tab="random"
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'random'
                  ? 'bg-[#ff2d78] text-white shadow-[0_0_15px_rgba(255,45,120,0.5)]'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              <span>{t.randomTab}</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 flex flex-col px-5 mt-4 overflow-y-auto">
          {/* ================================================================= */}
          {/* TAB 1: INVITE LIVE HOSTS                                         */}
          {/* ================================================================= */}
          {activeTab === 'invite' && (
            <div className="flex-1 flex flex-col">
              {/* Search Bar */}
              <div className="relative w-full mb-4">
                <div className="flex items-center w-full bg-[#20143a] rounded-full px-4 py-2.5 border border-purple-500/20 focus-within:border-[#ff2d78] transition shadow-inner">
                  <Search className="w-4 h-4 text-gray-400 mr-2.5 rtl:mr-0 rtl:ml-2.5 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    data-input="host-search"
                    className="w-full bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-gray-400 hover:text-white px-1.5"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Host List */}
              <div className="flex-1 flex flex-col divide-y divide-purple-900/30 space-y-1">
                {loadingHosts ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#ff2d78]" />
                    <span className="text-xs">Loading live hosts...</span>
                  </div>
                ) : hosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
                    <Users className="w-10 h-10 text-purple-600/50" />
                    <span className="text-sm font-medium">{t.noHostsFound}</span>
                  </div>
                ) : (
                  hosts.map((host) => {
                    const isInvitingThis = invitingHostId === host.id;
                    return (
                      <div
                        key={host.id}
                        data-host-row={host.poppoId}
                        className="flex items-center justify-between py-3 px-1 hover:bg-white/[0.02] transition rounded-xl"
                      >
                        {/* Host Avatar & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Circular Avatar */}
                          <div className="relative w-12 h-12 shrink-0">
                            <img
                              src={host.avatarUrl}
                              alt={host.nickname}
                              className="w-full h-full rounded-full object-cover border border-purple-500/40"
                              onError={(e) => {
                                (e.target as HTMLElement).setAttribute('src', '/avatars/default.png');
                              }}
                            />
                            {/* Live Badge dot */}
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#140b25]" />
                          </div>

                          {/* Nickname, Status & Meta */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-sm font-bold text-white truncate">
                                {host.nickname}
                              </span>
                              <span className="text-xs" title={host.country}>
                                {host.flagEmoji}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                              {/* Green Dot Online */}
                              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {t.online}
                              </span>
                              <span>•</span>
                              <span>{t.idLabel} {host.poppoId}</span>
                              {host.viewerCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-purple-300">
                                    <Eye className="w-3 h-3 text-purple-400" />
                                    {host.viewerCount >= 1000 ? `${(host.viewerCount / 1000).toFixed(1)}k` : host.viewerCount}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Invite Button (matching 06_02 pink pill button) */}
                        <button
                          onClick={() => handleSendInvite(host)}
                          disabled={!host.isEligibleForPk || isInvitingThis}
                          data-action="invite-host"
                          data-host-id={host.poppoId}
                          className={`shrink-0 ml-3 rtl:ml-0 rtl:mr-3 px-5 py-2 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 ${
                            !host.isEligibleForPk
                              ? 'bg-gray-800/60 text-gray-500 cursor-not-allowed border border-gray-700/50'
                              : isInvitingThis
                              ? 'bg-[#ff2d78]/70 text-white cursor-wait'
                              : 'bg-[#ff2d78] hover:bg-[#e0246a] text-white shadow-[0_0_15px_rgba(255,45,120,0.4)]'
                          }`}
                        >
                          {isInvitingThis ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>{t.sending}</span>
                            </>
                          ) : (
                            <span>{t.inviteBtn}</span>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: RANDOM MATCHMAKING                                        */}
          {/* ================================================================= */}
          {activeTab === 'random' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              {/* Radar / Matchmaking Visualizer */}
              <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                {/* Outer Pulsing Rings */}
                {randomStatus === 'finding_opponent' && (
                  <>
                    <div className="absolute inset-0 rounded-full border border-[#ff2d78]/40 animate-ping" />
                    <div className="absolute -inset-4 rounded-full border border-purple-500/20 animate-pulse" />
                    <div className="absolute inset-4 rounded-full border border-[#ff2d78]/60 animate-spin border-dashed" />
                  </>
                )}

                {/* Central Sphere / Avatar Area */}
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#ff2d78] to-[#7928ca] p-[3px] shadow-[0_0_30px_rgba(255,45,120,0.5)] flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#140b25] flex flex-col items-center justify-center p-2">
                    {randomStatus === 'finding_opponent' ? (
                      <Shuffle className="w-10 h-10 text-[#ff2d78] animate-bounce" />
                    ) : randomStatus === 'match_accepted' ? (
                      <CheckCircle className="w-12 h-12 text-emerald-400 animate-pulse" />
                    ) : randomStatus === 'no_opponent_available' ? (
                      <AlertCircle className="w-10 h-10 text-amber-400" />
                    ) : (
                      <Users className="w-10 h-10 text-purple-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Status Header */}
              <h2 className="text-lg font-bold text-white mb-1">
                {randomStatus === 'finding_opponent'
                  ? t.findingOpponent
                  : randomStatus === 'opponent_found'
                  ? t.opponentFound
                  : randomStatus === 'match_accepted'
                  ? t.matchAccepted
                  : randomStatus === 'no_opponent_available'
                  ? t.noOpponentAvailable
                  : randomStatus === 'match_cancelled'
                  ? t.matchCancelled
                  : t.randomTitle}
              </h2>

              <p className="text-xs text-gray-400 max-w-xs mb-6">
                {randomStatus === 'finding_opponent'
                  ? `${t.waitingOpponent} (${elapsedSeconds}s)`
                  : randomStatus === 'match_accepted' && randomOpponent
                  ? `Matched with ${randomOpponent.nickname}! Connecting streams...`
                  : randomStatus === 'no_opponent_available'
                  ? 'No available host found in the queue. You can try again or invite a live host directly.'
                  : t.randomSubtitle}
              </p>

              {/* Opponent Preview Card when matched */}
              {randomStatus === 'match_accepted' && randomOpponent && (
                <div className="w-full bg-[#1e1338] border border-[#ff2d78]/50 rounded-2xl p-4 mb-6 shadow-lg flex items-center justify-center gap-4 animate-fade-in">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-400">
                    <img
                      src={randomOpponent.avatar || '/avatars/default.png'}
                      alt={randomOpponent.nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left rtl:text-right">
                    <div className="text-sm font-bold text-white">{randomOpponent.nickname}</div>
                    <div className="text-xs text-emerald-400 font-semibold">Ready for 1v1 PK Battle</div>
                    <div className="text-[11px] text-gray-400">Room #{randomOpponent.roomNumber}</div>
                  </div>
                </div>
              )}

              {/* Matchmaking Action Buttons */}
              <div className="w-full max-w-xs space-y-2.5">
                {randomStatus === 'finding_opponent' ? (
                  <button
                    onClick={handleCancelRandom}
                    data-action="cancel-random-search"
                    className="w-full py-3 rounded-full bg-[#2a1b47] hover:bg-[#342258] text-white text-sm font-bold border border-white/10 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>{t.cancelSearchBtn}</span>
                  </button>
                ) : randomStatus === 'no_opponent_available' || randomStatus === 'match_cancelled' ? (
                  <button
                    onClick={handleStartRandom}
                    data-action="start-random-match"
                    className="w-full py-3 rounded-full bg-[#ff2d78] hover:bg-[#e0246a] text-white text-sm font-bold transition shadow-[0_0_20px_rgba(255,45,120,0.5)] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t.retrySearch}</span>
                  </button>
                ) : randomStatus === 'idle' ? (
                  <button
                    onClick={handleStartRandom}
                    data-action="start-random-match"
                    className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#ff2d78] to-[#9333ea] hover:brightness-110 text-white text-sm font-bold transition shadow-[0_0_25px_rgba(255,45,120,0.5)] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{t.startRandomBtn}</span>
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* OUTGOING INVITATION WAITING MODAL                                */}
        {/* ================================================================= */}
        {activeInvite && activeInvite.status === 'pending' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="relative w-24 h-24 mb-4">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border-2 border-[#ff2d78] animate-ping" />
              <img
                src={activeInvite.receiverAvatar || '/avatars/default.png'}
                alt={activeInvite.receiverNickname}
                className="w-full h-full rounded-full object-cover border-2 border-[#ff2d78] shadow-[0_0_20px_rgba(255,45,120,0.6)]"
              />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              {t.invitingTitle}
            </h3>
            <p className="text-sm font-semibold text-pink-400 mb-2">
              {activeInvite.receiverNickname}
            </p>
            <p className="text-xs text-gray-300 max-w-xs mb-6">
              {t.waitingOpponent}
            </p>

            {/* Countdown Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2a1745] border border-purple-500/40 text-xs font-bold text-amber-400 mb-8">
              <Clock className="w-3.5 h-3.5" />
              <span>{t.expiresIn} {activeInvite.secondsRemaining ?? 30}{t.seconds}</span>
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCancelInvite}
              data-action="cancel-invite"
              className="w-full max-w-xs py-3 rounded-full bg-[#27153f] hover:bg-[#341b54] text-white text-xs font-bold border border-white/10 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>{t.cancelInvite}</span>
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* INCOMING INVITATION CHALLENGE MODAL                              */}
        {/* ================================================================= */}
        {incomingInvite && (
          <div className="absolute inset-x-4 top-16 bg-[#1f1338]/95 border-2 border-[#ff2d78] rounded-3xl p-5 z-40 shadow-[0_0_40px_rgba(255,45,120,0.6)] backdrop-blur-xl animate-slide-down">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-pink-500 shrink-0">
                <img
                  src={incomingInvite.senderAvatar || '/avatars/default.png'}
                  alt={incomingInvite.senderNickname}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left rtl:text-right min-w-0">
                <div className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.incomingTitle}
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {incomingInvite.senderNickname}
                </div>
                <div className="text-[11px] text-gray-300">
                  {t.wantsToBattle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleRespondIncoming('reject')}
                data-action="reject-challenge"
                className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold transition active:scale-95"
              >
                {t.reject}
              </button>
              <button
                onClick={() => handleRespondIncoming('accept')}
                data-action="accept-challenge"
                className="flex-1 py-2.5 rounded-full bg-[#ff2d78] hover:bg-[#e0246a] text-white text-xs font-bold shadow-[0_0_15px_rgba(255,45,120,0.5)] transition active:scale-95"
              >
                {t.accept}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Watermark Capsule Badge (matching 06_02 reference image) */}
        <div className="mt-auto pt-3 flex justify-center">
          <div
            data-watermark="6.2-invite-random"
            className="w-[90%] bg-[#7a1c5d]/90 hover:bg-[#7a1c5d] transition border border-[#ff2d78]/40 rounded-2xl py-2 px-4 text-center shadow-lg"
          >
            <div className="text-sm font-bold text-white tracking-wide leading-tight">
              {t.watermarkLine1}
            </div>
            <div className="text-xs font-medium text-pink-200/90 leading-tight">
              {t.watermarkLine2}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
