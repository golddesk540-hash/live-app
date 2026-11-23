const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../apps/web/components/discovery/WebProfilePanel.tsx');

const content = `'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Copy,
  Check,
  Coins,
  Crown,
  Sparkles,
  Award,
  Flame,
  ArrowRight,
  ShieldCheck,
  Users,
  Eye,
  Settings,
  Gift,
  HelpCircle,
  FileText,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Smartphone,
  Radio,
  Briefcase,
  History,
  QrCode,
  Tag,
  X,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
  Share2,
  Download,
  CheckCircle2,
  Calendar,
  Lock,
  Star,
  Trophy,
  Filter,
  CheckCircle,
} from 'lucide-react';
import {
  DesignFixtures,
  FixtureRedeemCode,
  FixtureHelpTopic,
  FixtureAgencyMember,
  FixtureUserRelation,
  FixtureUserProfile,
  FixtureLiveRoom,
  FixtureStoreItem,
  FixtureBagItem,
  FixtureTask,
  FixtureHostRanking,
  FixtureEventRanking,
  FixtureMedal,
  FixtureGuardian,
  FixtureFanClub,
  FixtureInvitationInfo,
  FixtureInvitedUser,
  FixtureCoinPackage,
  FixtureVipPlan,
  FixtureVipPlanHistory,
  FixturePointsRecord,
} from '@/lib/design/designFixtures';
import { USE_VIP_API, USE_FINAL_API } from '@/lib/clientFlags';

export type ProfileSubView =
  | 'main'
  | 'reward'
  | 'rank'
  | 'store'
  | 'invite'
  | 'guardian'
  | 'honor'
  | 'fan_club'
  | 'medal_wall'
  | 'watch_history'
  | 'poster'
  | 'bag'
  | 'wallet'
  | 'vip';

export interface WebProfilePanelProps {
  isUr?: boolean;
  onOpenAppModal?: () => void;
  onOpenGoLive?: () => void;
}

export const WebProfilePanel: React.FC<WebProfilePanelProps> = ({
  isUr = false,
  onOpenAppModal,
  onOpenGoLive,
}) => {
  const router = useRouter();
  const [activeSubView, setActiveSubView] = useState<ProfileSubView>('main');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals for external actions
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemResult, setRedeemResult] = useState<FixtureRedeemCode | null>(null);

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // People relation modal state (Section 4, R2)
  const [activeRelationType, setActiveRelationType] = useState<
    'friends' | 'following' | 'followers' | 'visitors' | null
  >(null);
  const [followVersion, setFollowVersion] = useState(0);

  // Sub-view interactive states
  const [claimedTaskIds, setClaimedTaskIds] = useState<Record<string, boolean>>({
    task_03: true,
  });
  const [rankingsSubTab, setRankingsSubTab] = useState<'hosts' | 'events'>('hosts');
  const [storeCategory, setStoreCategory] = useState<string>('All');
  const [medalFilter, setMedalFilter] = useState<string>('All');
  const [isFanClubMember, setIsFanClubMember] = useState<boolean>(true);
  const [equippedBagItems, setEquippedBagItems] = useState<Record<string, boolean>>({
    bag_01: true,
    bag_02: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleToggleFollow = (targetUserId: string, name: string) => {
    const isNowFollowed = DesignFixtures.toggleFollow(targetUserId);
    setFollowVersion((v) => v + 1);
    showToast(isNowFollowed ? \`Following \${name}\` : \`Unfollowed \${name}\`);
  };

  // 1. USER PROFILE: Read strictly from DesignFixtures without fake fallbacks
  const { user, profileError } = useMemo(() => {
    try {
      if (DesignFixtures.isError) {
        return {
          user: null as FixtureUserProfile | null,
          profileError:
            DesignFixtures.userProfileError?.message ||
            'Failed to load user profile: Service temporarily unavailable [ERR_USER_PROFILE_503]',
        };
      }
      return {
        user: DesignFixtures.currentUserProfile,
        profileError: null as string | null,
      };
    } catch (err: any) {
      return {
        user: null as FixtureUserProfile | null,
        profileError: err?.message || 'Failed to load user profile [ERR_USER_PROFILE_503]',
      };
    }
  }, []);

  // 2. RELATION DATA FOR R2 MODAL
  const relationData = useMemo(() => {
    if (!activeRelationType) return { people: [] as FixtureUserRelation[], error: null as string | null, isEmpty: false };
    try {
      let people: FixtureUserRelation[] = [];
      if (activeRelationType === 'friends') people = DesignFixtures.friends;
      else if (activeRelationType === 'following') people = DesignFixtures.following;
      else if (activeRelationType === 'followers') people = DesignFixtures.followers;
      else if (activeRelationType === 'visitors') people = DesignFixtures.visitors;

      const isEmpty = DesignFixtures.isEmpty || people.length === 0;
      return { people, error: null, isEmpty };
    } catch (err: any) {
      return { people: [], error: err?.message || 'Failed to load list [ERR_SOCIAL_503]', isEmpty: false };
    }
  }, [activeRelationType, followVersion]);

  // 3. COIN BALANCE: Driven by DesignFixtures
  const [coinBalance, setCoinBalance] = useState<number>(() => {
    try {
      return DesignFixtures.currentCoinBalance;
    } catch {
      return 154200;
    }
  });

  const [liveVipLevel, setLiveVipLevel] = useState<number | null>(null);
  const [liveWealthLevel, setLiveWealthLevel] = useState<number | null>(null);
  const [liveShiningLevel, setLiveShiningLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!USE_VIP_API || !user) return;
    fetch('/api/vip/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.vip) {
          setLiveVipLevel(data.vip.vipLevel);
        }
      })
      .catch(() => {});
  }, [user]);

  // 4. FIXTURE DATA ACCESSORS WITH SAFE ERROR CATCHING
  const wallet = useMemo(() => {
    try {
      return DesignFixtures.wallet;
    } catch {
      return {
        coinBalance: 154200,
        pointsBalance: 420500,
        withdrawableUsd: 420.5,
      };
    }
  }, []);

  const agency = useMemo(() => {
    try {
      return DesignFixtures.agencyInfo;
    } catch {
      return {
        agencyId: 'agy_78601',
        agencyCode: 'AGY-78601',
        agencyName: 'Indus Star Media Agency',
        agentLeader: 'Kamran Malik',
        status: 'active',
        memberCount: 4,
      };
    }
  }, []);

  const coinSeller = useMemo(() => {
    try {
      return DesignFixtures.coinSellerInfo;
    } catch {
      return {
        sellerName: 'Karachi TopUp Express',
        agentName: 'Kamran Malik',
        whatsappContact: '+92 300 8765432',
      };
    }
  }, []);

  const helpTopics = useMemo(() => {
    try {
      return DesignFixtures.helpTopics;
    } catch {
      return [];
    }
  }, []);

  const agencyMembers = useMemo(() => {
    try {
      return DesignFixtures.agencyMembers;
    } catch {
      return [];
    }
  }, []);

  const handleCopyId = async () => {
    if (!user) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(user.poppoId);
      }
      setCopied(true);
      showToast(\`ID copied: \${user.poppoId}\`);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy ID:', e);
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemInput.trim()) return;

    if (process.env.NEXT_PUBLIC_USE_STORE_API !== 'false') {
      try {
        const res = await fetch('/api/redeem/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: redeemInput.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          setRedeemResult({
            code: redeemInput.trim(),
            isValid: true,
            coinReward: data.coinReward,
            bonusItem: data.bonusItem,
            message: data.message || \`🎉 Code redeemed: +\${data.coinReward.toLocaleString()} Coins!\`,
          });
          if (data.newBalance !== undefined) {
            setCoinBalance(data.newBalance);
          }
          return;
        }
      } catch (e) {
        console.error('Redeem error:', e);
      }
    }

    const res = DesignFixtures.redeemCode(redeemInput.trim());
    setRedeemResult(res);
    if (res.isValid && res.coinReward > 0) {
      setCoinBalance((b) => b + res.coinReward);
    }
  };

  // Eight canonical profile entries matching Section 8, R6
  const featureIcons = [
    { id: 'reward' as ProfileSubView, title: 'Reward', titleUr: 'انعامات', icon: Gift, color: 'text-pink-500 bg-pink-50' },
    { id: 'rank' as ProfileSubView, title: 'Rank', titleUr: 'رینکنگ', icon: Flame, color: 'text-amber-500 bg-amber-50' },
    { id: 'store' as ProfileSubView, title: 'Store', titleUr: 'اسٹور', icon: CreditCard, color: 'text-purple-500 bg-purple-50' },
    { id: 'invite' as ProfileSubView, title: 'Invite', titleUr: 'دعوت', icon: Users, color: 'text-blue-500 bg-blue-50' },
    { id: 'guardian' as ProfileSubView, title: 'Guardian', titleUr: 'گارڈین', icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'honor' as ProfileSubView, title: 'Honor', titleUr: 'اعزاز', icon: Crown, color: 'text-yellow-600 bg-yellow-50' },
    { id: 'fan_club' as ProfileSubView, title: 'Fan Club', titleUr: 'فین کلب', icon: Sparkles, color: 'text-rose-500 bg-rose-50' },
    { id: 'medal_wall' as ProfileSubView, title: 'Medal Wall', titleUr: 'تمغہ جات', icon: Award, color: 'text-indigo-500 bg-indigo-50' },
  ];

  // Helper for subview navigation back header
  const renderSubViewHeader = (title: string, subtitle?: string, titleUr?: string) => (
    <div className="flex items-center justify-between border-b border-gray-200/80 pb-4 mb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveSubView('main')}
          data-testid="profile-subview-back-button"
          className="w-9 h-9 rounded-full bg-white hover:bg-gray-100 border border-gray-200/80 text-gray-700 flex items-center justify-center transition-all active:scale-95 shadow-2xs"
          title="Back to Profile"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
            {isUr && titleUr ? titleUr : title}
          </h2>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setActiveSubView('main')}
        className="text-xs font-bold text-[#FF1A6C] hover:underline"
      >
        {isUr ? 'واپس پروفائل' : 'Back to Profile'}
      </button>
    </div>
  );

  // Error State Handler for Entire Profile
  if (profileError || !user) {
    return (
      <div data-testid="profile-error-state" className="p-10 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-extrabold text-gray-900">
          {isUr ? 'پروفائل سروس فی الوقت دستیاب نہیں ہے' : 'User Profile Unavailable'}
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          {profileError || 'Unable to synchronize user profile. Please check your network and retry.'}
        </p>
        <button
          type="button"
          onClick={() => {
            DesignFixtures.reset();
            window.location.reload();
          }}
          className="px-5 py-2.5 rounded-xl bg-[#FF1A6C] text-white text-xs font-bold shadow-xs hover:bg-[#e0125c] transition-colors"
        >
          {isUr ? 'دوبارہ کوشش کریں' : 'Retry'}
        </button>
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 1: REWARD (Daily Host Tasks Layout)
  // =========================================================================
  if (activeSubView === 'reward') {
    let tasks: FixtureTask[] = [];
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Task progress sync failed: Server busy [ERR_TASK_SYNC_503]');
      tasks = DesignFixtures.tasksAndRewards;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load daily tasks';
    }

    const claimableCount = tasks.filter((t) => t.status === 'completed' && !claimedTaskIds[t.id]).length;

    const handleClaimTask = (taskId: string, rewardText: string) => {
      setClaimedTaskIds((prev) => ({ ...prev, [taskId]: true }));
      showToast(\`🎉 Reward Claimed: \${rewardText} added to your account!\`);
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-reward-layout">
        {renderSubViewHeader('Daily Host Tasks & Rewards', 'Complete broadcaster missions to claim points and bonus rewards', 'روزانہ میزبان ٹاسکس')}

        {isError ? (
          <div data-testid="reward-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Task Service Unavailable</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div data-testid="reward-empty-state" className="p-8 text-center rounded-3xl bg-white border border-gray-200 shadow-xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-gray-400 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">No Tasks Scheduled</h4>
            <p className="text-xs text-gray-500">Check back tomorrow for fresh daily broadcaster challenges.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Progress Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-pink-50 via-purple-50 to-amber-50 border border-pink-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-[#FF1A6C] tracking-wider">Mission Center</span>
                <h3 className="text-base font-extrabold text-gray-900 mt-0.5">Daily Creator Progression</h3>
                <p className="text-xs text-gray-500">
                  {claimableCount > 0 ? \`\${claimableCount} reward(s) ready to claim!\` : 'All tasks up to date'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-pink-100 text-[#FF1A6C] text-xs font-black">
                  {claimableCount} Claimable
                </span>
              </div>
            </div>

            {/* Task Rows */}
            <div className="space-y-3">
              {tasks.map((task) => {
                const isClaimed = claimedTaskIds[task.id] || task.isClaimed || task.status === 'claimed';
                const isCompleted = task.status === 'completed' || task.currentProgress >= task.targetGoal;
                const canClaim = isCompleted && !isClaimed;
                const progressPct = Math.min(100, Math.round((task.currentProgress / task.targetGoal) * 100));

                return (
                  <div
                    key={task.id}
                    data-testid={\`task-row-\${task.id}\`}
                    className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-gray-900 truncate">{task.title}</h4>
                        {canClaim && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase animate-pulse">
                            Claimable
                          </span>
                        )}
                        {isClaimed && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                            Claimed
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500 font-semibold">
                          <span>Progress: {task.currentProgress} / {task.targetGoal} {task.unit}</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#FF1A6C] to-pink-500 rounded-full transition-all duration-300"
                            style={{ width: \`\${progressPct}%\` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold">
                        <Gift className="w-3.5 h-3.5 text-amber-500" />
                        <span>Reward: {task.rewardText}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {canClaim ? (
                        <button
                          type="button"
                          onClick={() => handleClaimTask(task.id, task.rewardText)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF1A6C] to-[#E0155A] hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-md shadow-pink-500/20 transition-all"
                        >
                          Claim Reward
                        </button>
                      ) : isClaimed ? (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs cursor-default"
                        >
                          Claimed ✓
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs cursor-default"
                        >
                          In Progress
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 2: RANK (Host Rankings & Event Board Layout)
  // =========================================================================
  if (activeSubView === 'rank') {
    let rankings: FixtureHostRanking[] = [];
    let eventRankings: FixtureEventRanking[] = [];
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Leaderboard database timeout [ERR_RANKINGS_TIMEOUT]');
      rankings = DesignFixtures.hostRankings;
      eventRankings = DesignFixtures.eventRankings;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load rankings';
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-rank-layout">
        {renderSubViewHeader('Host Rankings & Event Board', 'Top broadcasters, diamond earnings, and competitive seasonal events', 'میزبان رینکنگ اور ایونٹس')}

        {isError ? (
          <div data-testid="rank-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Leaderboard Offline</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Sub-tab Switcher */}
            <div className="flex items-center gap-2 border-b border-gray-200/80 pb-2">
              <button
                type="button"
                onClick={() => setRankingsSubTab('hosts')}
                className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-all \${
                  rankingsSubTab === 'hosts'
                    ? 'bg-[#FF1A6C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }\`}
              >
                Top Host Rankings
              </button>
              <button
                type="button"
                onClick={() => setRankingsSubTab('events')}
                className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-all \${
                  rankingsSubTab === 'events'
                    ? 'bg-[#FF1A6C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }\`}
              >
                Karachi Nights Event Board
              </button>
            </div>

            {rankingsSubTab === 'hosts' ? (
              <div className="space-y-4">
                {/* Top 3 Podium */}
                {rankings.length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 pt-2 pb-4 text-center">
                    {/* Rank 2 */}
                    <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-end space-y-2">
                      <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center">2</span>
                      <img src={rankings[1].avatarUrl} alt={rankings[1].hostNickname} className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-400" />
                      <h4 className="text-xs font-extrabold text-gray-900 truncate max-w-full">{rankings[1].hostNickname}</h4>
                      <span className="text-[11px] font-bold text-slate-600">{(rankings[1].diamondsEarned / 1000).toFixed(0)}k 💎</span>
                    </div>

                    {/* Rank 1 */}
                    <div className="p-4 rounded-3xl bg-gradient-to-b from-amber-50 to-yellow-50 border-2 border-amber-300 flex flex-col items-center justify-end space-y-2 shadow-sm scale-105">
                      <div className="flex items-center gap-1">
                        <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center">1</span>
                      </div>
                      <img src={rankings[0].avatarUrl} alt={rankings[0].hostNickname} className="w-16 h-16 rounded-full object-cover ring-4 ring-amber-400" />
                      <h4 className="text-sm font-black text-gray-900 truncate max-w-full">{rankings[0].hostNickname}</h4>
                      <span className="text-xs font-black text-amber-700">{(rankings[0].diamondsEarned / 1000).toFixed(0)}k 💎</span>
                    </div>

                    {/* Rank 3 */}
                    <div className="p-4 rounded-3xl bg-amber-900/5 border border-amber-200 flex flex-col items-center justify-end space-y-2">
                      <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center">3</span>
                      <img src={rankings[2].avatarUrl} alt={rankings[2].hostNickname} className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-600" />
                      <h4 className="text-xs font-extrabold text-gray-900 truncate max-w-full">{rankings[2].hostNickname}</h4>
                      <span className="text-[11px] font-bold text-amber-800">{(rankings[2].diamondsEarned / 1000).toFixed(0)}k 💎</span>
                    </div>
                  </div>
                )}

                {/* Ranked List */}
                <div className="space-y-2">
                  {rankings.map((host) => (
                    <div
                      key={host.rank}
                      data-testid={\`rank-item-\${host.rank}\`}
                      className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className={\`w-6 text-center font-black text-xs \${host.rank <= 3 ? 'text-[#FF1A6C]' : 'text-gray-400'}\`}>
                          #{host.rank}
                        </span>
                        <img src={host.avatarUrl} alt={host.hostNickname} className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-gray-900">{host.hostNickname}</h5>
                            <span className="text-xs">{host.countryFlag}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">Host Lv.{host.level} · {host.country}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-[#FF1A6C]">{host.diamondsEarned.toLocaleString()} 💎</span>
                        <span className="block text-[10px] text-gray-400">Diamonds</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Event Board Tab */
              <div className="space-y-4">
                <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-black text-white space-y-2">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Seasonal Tourney</span>
                  <h3 className="text-lg font-black tracking-tight">Karachi Nights Star Hunt 2026</h3>
                  <p className="text-xs text-purple-200">
                    Broadcasters gather points through live stream gifts and audience fan clubs. Top 3 win exclusive crown frames.
                  </p>
                </div>

                <div className="space-y-2">
                  {eventRankings.map((ev) => (
                    <div
                      key={ev.rank}
                      className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-black text-xs text-purple-600">#{ev.rank}</span>
                        <img src={ev.avatarUrl} alt={ev.hostNickname} className="w-10 h-10 rounded-full object-cover ring-1 ring-purple-200" />
                        <div>
                          <h5 className="text-xs font-bold text-gray-900">{ev.hostNickname}</h5>
                          <span className="text-[10px] font-bold text-purple-600">{ev.badgeTitle}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-purple-700">{ev.eventPoints.toLocaleString()} pts</span>
                        <span className="block text-[10px] text-gray-400">Event Score</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 3: STORE (Popo Virtual Store Layout)
  // =========================================================================
  if (activeSubView === 'store') {
    let items: FixtureStoreItem[] = [];
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Virtual store catalog unavailable [ERR_STORE_INVENTORY_503]');
      items = DesignFixtures.storeItems;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load store';
    }

    const categories = ['All', 'Avatar Frame', 'Entrance Effect', 'Chat Bubble'];
    const filteredItems = items.filter((item) => {
      if (storeCategory === 'All') return true;
      return item.category === storeCategory;
    });

    const handleBuyItem = (item: FixtureStoreItem) => {
      if (coinBalance < item.priceCoins) {
        showToast(\`Insufficient coins! You need \${(item.priceCoins - coinBalance).toLocaleString()} more coins.\`);
        return;
      }
      setCoinBalance((b) => b - item.priceCoins);
      showToast(\`🎉 Purchased \${item.title}! Added to your Backpack.\`);
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-store-layout">
        {renderSubViewHeader('Popo Virtual Store', 'Customize your avatar, comments and live entrances with premium digital items', 'ورچوئل اسٹور')}

        {isError ? (
          <div data-testid="store-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Store Offline</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Balance Bar & Category Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-amber-50/80 border border-amber-200">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500 fill-amber-400" />
                <span className="text-xs font-bold text-amber-900">Your Coin Balance:</span>
                <span className="text-sm font-black text-amber-900 font-mono">{coinBalance.toLocaleString()} Coins</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubView('wallet')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs self-start sm:self-auto"
              >
                + Get More Coins
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setStoreCategory(cat)}
                  className={\`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 \${
                    storeCategory === cat
                      ? 'bg-[#FF1A6C] text-white shadow-xs'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200/80'
                  }\`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={\`store-item-\${item.id}\`}
                  className="p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={item.previewImage}
                      alt={item.title}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-100 shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                          {item.category}
                        </span>
                        {item.isHot && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-[#FF1A6C]">
                            HOT
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-gray-900 truncate">{item.title}</h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-xs font-black text-amber-700 font-mono">
                        {item.priceCoins.toLocaleString()} Coins
                      </span>
                      <span className="block text-[10px] text-gray-400">Valid for {item.validityDays} days</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleBuyItem(item)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF1A6C] to-pink-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-xs transition-all"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 4: INVITE (Referral Program Layout)
  // =========================================================================
  if (activeSubView === 'invite') {
    let inviteInfo: FixtureInvitationInfo | null = null;
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Invitation referral server unavailable [ERR_INVITE_503]');
      inviteInfo = DesignFixtures.invitationInfo;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load invites';
    }

    const handleCopyCode = async (code: string) => {
      try {
        if (navigator.clipboard) await navigator.clipboard.writeText(code);
        showToast(\`Invitation code \${code} copied!\`);
      } catch {
        showToast(\`Code: \${code}\`);
      }
    };

    const handleShareLink = async (link: string) => {
      try {
        if (navigator.clipboard) await navigator.clipboard.writeText(link);
        showToast('Invite link copied to clipboard! Share it with friends.');
      } catch {
        showToast('Invite link ready to share');
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-invite-layout">
        {renderSubViewHeader('Invite Friends & Earn Rewards', 'Share your referral code to unlock bonus coins and exclusive creator badges', 'دوستوں کو مدعو کریں')}

        {isError || !inviteInfo ? (
          <div data-testid="invite-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Referral Service Offline</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Invite Code Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-pink-400 tracking-wider">Your Exclusive Referral Code</span>
                  <h3 className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-amber-300">
                    {inviteInfo.inviteCode}
                  </h3>
                  <p className="text-xs text-blue-200">Friends earn 5,000 bonus coins on first broadcast registration.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(inviteInfo!.inviteCode)}
                    className="px-4 py-2.5 rounded-2xl bg-white text-indigo-950 font-black text-xs hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareLink(inviteInfo!.inviteUrl)}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF1A6C] to-pink-500 text-white font-black text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-blue-200 font-bold uppercase">Friends Joined</span>
                  <p className="text-xl font-black text-white">{inviteInfo.totalInvited}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-blue-200 font-bold uppercase">Coins Earned</span>
                  <p className="text-xl font-black text-amber-300">+{inviteInfo.totalCoinsEarned.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* People Who Joined */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <h4 className="text-sm font-extrabold text-gray-900">
                Joined Broadcasters ({inviteInfo.joinedUsers.length})
              </h4>

              {inviteInfo.joinedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-xs">No one has joined using your referral code yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {inviteInfo.joinedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} alt={user.nickname} className="w-10 h-10 rounded-full object-cover ring-1 ring-blue-200" />
                        <div>
                          <h5 className="text-xs font-bold text-gray-900">{user.nickname}</h5>
                          <span className="text-[10px] text-gray-500">Wealth Lv.{user.wealthLevel} · Joined {user.joinedAgo}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600 font-mono">+{user.bonusEarned.toLocaleString()} Coins</span>
                        <span className="block text-[10px] text-gray-400">Referral Reward</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 5: GUARDIAN (Guardian Angels & Shield Protection)
  // =========================================================================
  if (activeSubView === 'guardian') {
    let guardians: FixtureGuardian[] = [];
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Guardian angel shield status unknown [ERR_SHIELD_404]');
      guardians = DesignFixtures.guardians;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load guardians';
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-guardian-layout">
        {renderSubViewHeader('Guardian Angels & Shield Protection', 'Guardians protect the broadcaster with priority chat badges and special entrance effects', 'گارڈین اینجلز اور شیلڈ')}

        {isError ? (
          <div data-testid="guardian-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Guardian Services Unavailable</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Shield Overview Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-black text-white space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h3 className="text-base font-extrabold">Active Guardian Shield</h3>
              </div>
              <p className="text-xs text-emerald-200 leading-relaxed">
                Guardians hold special authority in broadcaster rooms. They enjoy distinctive entrance announcements, dedicated guardian rings, and immunity against audience silence penalties.
              </p>
            </div>

            {/* Guardians List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Assigned Broadcaster Guardians ({guardians.length})
              </h4>

              {guardians.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-white border border-gray-200 text-gray-400">
                  <p className="text-xs">No guardians assigned yet. Broadcasters can invite VIP supporters to become guardians.</p>
                </div>
              ) : (
                guardians.map((g) => (
                  <div
                    key={g.id}
                    data-testid={\`guardian-card-\${g.id}\`}
                    className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img src={g.guardianAvatar} alt={g.guardianNickname} className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-300" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center">
                          #{g.protectRank}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-extrabold text-gray-900">{g.guardianNickname}</h5>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                            {g.tier}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{g.customBanner}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-700">{g.guardDaysRemaining} days remaining</span>
                      <span className="block text-[10px] text-gray-400">Active Protection</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 6: HONOR & RECOGNITION (Three Progress Bars)
  // =========================================================================
  if (activeSubView === 'honor') {
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Recognition status unavailable [ERR_RECOGNITION_503]');
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load recognition status';
    }

    const wealthLevel = liveWealthLevel !== null ? liveWealthLevel : user.wealthLevel || 12;
    const shiningLevel = liveShiningLevel !== null ? liveShiningLevel : user.hostLevel || 18;
    const honorLevel = user.honorLevel || 5;

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-honor-layout">
        {renderSubViewHeader('Honor, Prestige & Creator Recognition', 'Authoritative progression tracking across Wealth, Shining, and Community Honor', 'عزت اور شناخت')}

        {isError ? (
          <div data-testid="honor-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Recognition System Offline</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* BAR 1: WEALTH LEVEL */}
            <div data-testid="progress-bar-wealth" className="p-5 sm:p-6 rounded-3xl bg-white border border-amber-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Coins className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Wealth Level · Lv.{wealthLevel}</h3>
                    <p className="text-[11px] text-gray-400">Total gift diamond spending and support milestone</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                  Wealth Mogul
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Current Tier Score: 12,450 pts</span>
                  <span className="text-amber-700 font-bold">83% to Lv.{wealthLevel + 1}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-amber-100/60 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full w-[83%]" />
                </div>
              </div>
            </div>

            {/* BAR 2: SHINING LEVEL */}
            <div data-testid="progress-bar-shining" className="p-5 sm:p-6 rounded-3xl bg-white border border-pink-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#FF1A6C] flex items-center justify-center font-black">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Shining Level · Lv.{shiningLevel}</h3>
                    <p className="text-[11px] text-gray-400">Broadcast duration and audience popularity tier</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-pink-100 text-[#FF1A6C] text-xs font-black">
                  Shining Broadcaster
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Current Tier Score: 22,420 pts</span>
                  <span className="text-[#FF1A6C] font-bold">68% to Lv.{shiningLevel + 1}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-pink-100/60 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#FF1A6C] to-pink-500 rounded-full w-[68%]" />
                </div>
              </div>
            </div>

            {/* BAR 3: HONOR LEVEL */}
            <div data-testid="progress-bar-honor" className="p-5 sm:p-6 rounded-3xl bg-white border border-purple-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                    <Crown className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Honor Level · Lv.{honorLevel}</h3>
                    <p className="text-[11px] text-gray-400">Community integrity, verified creator conduct, and safety standing</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black">
                  Community Pillar
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Current Tier Score: 7,850 pts</span>
                  <span className="text-purple-700 font-bold">74% to Lv.{honorLevel + 1}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-purple-100/60 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full w-[74%]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 7: FAN CLUB (Creator Fan Community Layout)
  // =========================================================================
  if (activeSubView === 'fan_club') {
    let fanClub: FixtureFanClub | null = null;
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Fan club directory timeout [ERR_FANCLUB_TIMEOUT]');
      fanClub = DesignFixtures.fanClub;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load fan club';
    }

    const handleToggleMembership = () => {
      setIsFanClubMember((prev) => !prev);
      showToast(!isFanClubMember ? 'Joined Amina Star Club! 🌟' : 'Left Fan Club');
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-fan-club-layout">
        {renderSubViewHeader('Fan Club: Amina Star Club', 'Exclusive creator intimacy badges, chat perks, and supporter leaderboards', 'فین کلب')}

        {isError || !fanClub ? (
          <div data-testid="fanclub-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Fan Club Unavailable</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-amber-900 font-black text-xs">
                      {fanClub.badgeName}
                    </span>
                    <span className="text-xs font-semibold text-white/90">{fanClub.totalMembers.toLocaleString()} Members</span>
                  </div>
                  <h3 className="text-2xl font-black">{fanClub.clubName}</h3>
                  <p className="text-xs text-white/80">{fanClub.announcement}</p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMembership}
                  className={\`px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-md \${
                    isFanClubMember
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : 'bg-white text-purple-900 hover:bg-yellow-50'
                  }\`}
                >
                  {isFanClubMember ? 'Leave Club' : '+ Join Fan Club'}
                </button>
              </div>

              {isFanClubMember && (
                <div className="p-3 rounded-2xl bg-black/20 flex items-center justify-between text-xs">
                  <span>Your Status: Active Supporter (Lv.{fanClub.userClubLevel})</span>
                  <span className="font-mono font-bold text-amber-200">{fanClub.userIntimacyPoints.toLocaleString()} Intimacy Points</span>
                </div>
              )}
            </div>

            {/* Top Members List */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-4">
              <h4 className="text-sm font-extrabold text-gray-900">Top Club Supporters</h4>

              <div className="space-y-2.5">
                {fanClub.topMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center font-black text-xs text-amber-600">#{m.rank}</span>
                      <img src={m.avatarUrl} alt={m.nickname} className="w-10 h-10 rounded-full object-cover ring-1 ring-amber-200" />
                      <div>
                        <h5 className="text-xs font-bold text-gray-900">{m.nickname}</h5>
                        <span className="text-[10px] text-gray-400">Intimacy Score</span>
                      </div>
                    </div>

                    <span className="text-xs font-black text-amber-700 font-mono">
                      {m.intimacyPoints.toLocaleString()} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 8: MEDAL WALL (Medals of Fame Layout)
  // =========================================================================
  if (activeSubView === 'medal_wall') {
    let medals: FixtureMedal[] = [];
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Medals collection service failed [ERR_MEDALS_500]');
      medals = DesignFixtures.medals;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load medals';
    }

    const categories = ['All', 'Honor', 'Regional', 'Gifting', 'Community', 'Battle', 'Protection', 'Identity'];
    const filteredMedals = medals.filter((m) => {
      if (medalFilter === 'All') return true;
      return m.category.toLowerCase() === medalFilter.toLowerCase();
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-medal-wall-layout">
        {renderSubViewHeader('Medal Wall of Fame', 'Creator achievements, broadcast milestones, and seasonal honor trophies', 'تمغہ جات کی دیوار')}

        {isError ? (
          <div data-testid="medal-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Medals Unavailable</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header Status Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Hall of Fame</span>
                <h3 className="text-base font-extrabold text-gray-900 mt-0.5">Unlocked Medals & Trophies</h3>
                <p className="text-xs text-gray-500">{medals.length} of {medals.length} medals unlocked (100% completion)</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-black">
                Master Collector
              </span>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMedalFilter(cat)}
                  className={\`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 \${
                    medalFilter === cat
                      ? 'bg-[#FF1A6C] text-white shadow-xs'
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200/80'
                  }\`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Medals Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {filteredMedals.map((m) => (
                <div
                  key={m.id}
                  data-testid={\`medal-card-\${m.id}\`}
                  className="p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs flex items-start gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                    {m.iconEmoji}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                        {m.rarity}
                      </span>
                      <span className="text-[10px] text-gray-400">{m.category}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-gray-900 truncate">{m.name}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{m.description}</p>
                    <span className="block text-[10px] text-emerald-600 font-bold pt-1">
                      Unlocked on {m.unlockedDate} ✓
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 9: WATCH HISTORY (Real List of Visited Live Rooms)
  // =========================================================================
  if (activeSubView === 'watch_history') {
    let rooms: FixtureLiveRoom[] = [];
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Watch history sync failed: Server busy [ERR_HISTORY_503]');
      rooms = DesignFixtures.liveRooms;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load watch history';
    }

    const elapsedTimes = [
      'Watched 2 hours ago',
      'Watched 5 hours ago',
      'Watched yesterday',
      'Watched 2 days ago',
      'Watched 3 days ago',
      'Watched 4 days ago',
      'Watched 5 days ago',
      'Watched last week',
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-watch-history-layout">
        {renderSubViewHeader('Broadcast Watch History', 'Review previously attended live stream rooms and creator broadcasts', 'دیکھنے کی تاریخ')}

        {isError ? (
          <div data-testid="watch-history-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Failed to Load History</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : rooms.length === 0 ? (
          <div data-testid="watch-history-empty-state" className="p-8 text-center rounded-3xl bg-white border border-gray-200 shadow-xs space-y-2">
            <History className="w-8 h-8 text-gray-400 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">No Watch History Yet</h4>
            <p className="text-xs text-gray-500">Live streams you visit will appear here in chronological order.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room, idx) => (
              <div
                key={room.id}
                data-testid={\`watch-history-item-\${room.id}\`}
                className="p-4 rounded-3xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={room.coverUrl}
                    alt={room.title}
                    className="w-14 h-14 rounded-2xl object-cover ring-1 ring-gray-200 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{room.flagEmoji}</span>
                      <h4 className="text-sm font-bold text-gray-900 truncate">{room.title}</h4>
                    </div>
                    <p className="text-xs text-gray-500">Host: <strong>{room.hostNickname}</strong> · {room.category}</p>
                    <span className="block text-[11px] text-purple-600 font-semibold">{elapsedTimes[idx % elapsedTimes.length]}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-gray-700">{room.viewerCount.toLocaleString()} viewers</span>
                  <button
                    type="button"
                    onClick={() => router.push(\`/live/room/\${room.id}\`)}
                    className="mt-1 block text-xs font-bold text-[#FF1A6C] hover:underline"
                  >
                    Watch Again →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 10: ACHIEVEMENT POSTER (Visual Creator Poster)
  // =========================================================================
  if (activeSubView === 'poster') {
    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-poster-layout">
        {renderSubViewHeader('Achievement Milestone Poster', 'Shareable creator summary highlighting your broadcaster prestige and audience reach', 'کامیابی کا پوسٹر')}

        <div className="max-w-md mx-auto space-y-5">
          {/* Branded Poster Card */}
          <div
            data-testid="achievement-poster-card"
            className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#2D091F] via-[#1A0515] to-[#0A0209] text-white border-2 border-pink-500/40 shadow-2xl text-center space-y-4"
          >
            {/* Avatar with Ring */}
            <div className="relative w-20 h-20 mx-auto">
              <img
                src={user.avatarUrl}
                alt={user.nickname}
                className="w-full h-full rounded-full object-cover ring-4 ring-pink-500 shadow-md"
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-xs">
                ★
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tight">{user.nickname}</h3>
              <p className="text-xs text-pink-300 font-mono">Popo ID: {user.poppoId}</p>
              <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">{user.bio}</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/10 text-center">
              <div>
                <span className="text-[10px] text-pink-300 uppercase font-bold">Followers</span>
                <p className="text-base font-black text-white">{(user.followersCount / 1000).toFixed(1)}k</p>
              </div>
              <div>
                <span className="text-[10px] text-amber-300 uppercase font-bold">Wealth</span>
                <p className="text-base font-black text-white">Lv.{user.wealthLevel}</p>
              </div>
              <div>
                <span className="text-[10px] text-purple-300 uppercase font-bold">Shining</span>
                <p className="text-base font-black text-white">Lv.{user.hostLevel}</p>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-pink-500/20 border border-pink-500/30 text-[11px] font-bold text-pink-200">
              ★ Popo Live Verified Broadcaster ★
            </div>

            {/* Simulated QR Code for Scan */}
            <div className="flex items-center justify-center gap-3 pt-2 text-left">
              <div className="w-14 h-14 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center shadow-xs">
                <QrCode className="w-12 h-12 text-gray-900" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-white block">Scan & Watch Live</span>
                <span className="text-[9px] text-zinc-400 block">Download Popo Live iOS & Android</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => showToast('Poster saved to Photos! 📸')}
              className="flex-1 py-3 rounded-2xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Save Poster</span>
            </button>
            <button
              type="button"
              onClick={() => showToast('Poster link ready to share! 🔗')}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#FF1A6C] to-pink-600 text-white text-xs font-black shadow-md shadow-pink-500/20 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Poster</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 11: BAG / BACKPACK (Owned Inventory & Equip Controls)
  // =========================================================================
  if (activeSubView === 'bag') {
    let bagItems: FixtureBagItem[] = [];
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Backpack inventory retrieval failed [ERR_BAG_TIMEOUT]');
      bagItems = DesignFixtures.bagItems;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load backpack';
    }

    const handleToggleEquip = (itemId: string, name: string) => {
      setEquippedBagItems((prev) => {
        const nextState = !prev[itemId];
        showToast(nextState ? \`Equipped \${name}\` : \`Unequipped \${name}\`);
        return { ...prev, [itemId]: nextState };
      });
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-bag-layout">
        {renderSubViewHeader('Backpack & Inventory', 'Manage owned avatar frames, virtual gifts, entrance carriages, and boost vouchers', 'بیگ اور انوینٹری')}

        {isError ? (
          <div data-testid="bag-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Backpack Unavailable</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500">
              <span>Owned Items: {bagItems.length}</span>
              <button
                type="button"
                onClick={() => setActiveSubView('store')}
                className="text-[#FF1A6C] hover:underline"
              >
                + Visit Virtual Store
              </button>
            </div>

            <div className="space-y-3">
              {bagItems.map((item) => {
                const isEquipped = equippedBagItems[item.id] !== undefined ? equippedBagItems[item.id] : item.isEquipped;
                const canEquip = item.category === 'Avatar Frame' || item.category === 'Entrance Effect';

                return (
                  <div
                    key={item.id}
                    data-testid={\`bag-item-\${item.id}\`}
                    className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 text-purple-700 flex items-center justify-center font-black">
                        <Package className="w-6 h-6 text-[#FF1A6C]" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-gray-900">{item.name}</h4>
                          {isEquipped && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                              Equipped
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{item.category} · Qty: {item.quantity}</p>
                        <span className="text-[11px] text-amber-700 font-semibold">{item.expiresInText}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {canEquip ? (
                        <button
                          type="button"
                          onClick={() => handleToggleEquip(item.id, item.name)}
                          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all \${
                            isEquipped
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              : 'bg-gradient-to-r from-[#FF1A6C] to-pink-600 text-white hover:brightness-110 shadow-xs'
                          }\`}
                        >
                          {isEquipped ? 'Unequip' : 'Equip'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-bold px-3 py-1 bg-gray-50 rounded-lg">
                          Passive Item
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 12: WALLET (Coins Wallet Layout)
  // =========================================================================
  if (activeSubView === 'wallet') {
    let coinPackages: FixtureCoinPackage[] = [];
    let txHistory: FixturePointsRecord[] = [];
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('Failed to synchronize coin and point balances [ERR_WALLET_SYNC_500]');
      coinPackages = DesignFixtures.coinPackages;
      txHistory = DesignFixtures.pointsHistory;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load wallet';
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-wallet-layout">
        {renderSubViewHeader('Popo Coins Wallet', 'Recharge coins, view coin packages, and track verified ledger history', 'کوائن والٹ')}

        {isError ? (
          <div data-testid="wallet-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">Wallet Service Unavailable</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Balance Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-yellow-100 text-xs font-bold uppercase tracking-wider">
                  <Coins className="w-5 h-5 text-yellow-200" />
                  <span>Available Coin Balance</span>
                </div>
                <h3 className="text-3xl font-black font-mono tracking-tight">{coinBalance.toLocaleString()}</h3>
                <p className="text-xs text-yellow-100">Ready for sending gifts and supporting creator lives</p>
              </div>

              <span className="px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold border border-white/30">
                Active Wallet
              </span>
            </div>

            {/* Coin Packages Grid */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-gray-900">Recharge Packages</h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {coinPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    data-testid={\`coin-pkg-\${pkg.id}\`}
                    className="p-4 rounded-3xl bg-white border border-gray-200/90 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-700 font-mono">{pkg.coins.toLocaleString()} Coins</span>
                        {pkg.bonusCoins > 0 && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-pink-100 text-[#FF1A6C]">
                            +{pkg.bonusCoins} Bonus
                          </span>
                        )}
                      </div>
                      {pkg.isPopular && (
                        <span className="mt-1 inline-block text-[9px] font-black uppercase text-amber-600">
                          Popular
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => showToast(\`Selected package: \${pkg.coins.toLocaleString()} Coins for $\${pkg.priceUsd} USD\`)}
                      className="w-full py-2 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-800 text-xs font-extrabold border border-gray-200 transition"
                    >
                      ${pkg.priceUsd} USD
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transaction Records */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-3">
              <h4 className="text-sm font-extrabold text-gray-900">Ledger History</h4>

              <div className="space-y-2">
                {txHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-gray-800">{tx.description}</h5>
                      <span className="text-[10px] text-gray-400">{tx.timestamp} · {tx.type}</span>
                    </div>
                    <span className={\`text-xs font-black font-mono \${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-600'}\`}>
                      {tx.amount > 0 ? \`+\${tx.amount.toLocaleString()}\` : tx.amount.toLocaleString()} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SUB-VIEW 13: VIP (VIP Privileges & Plans Layout)
  // =========================================================================
  if (activeSubView === 'vip') {
    let vipPlan: FixtureVipPlan | null = null;
    let vipHistory: FixtureVipPlanHistory[] = [];
    let isError = false;
    let errorMessage = '';

    try {
      if (DesignFixtures.isError) throw new Error('VIP membership status and exclusive privileges could not be loaded [ERR_VIP_LOAD_FAILED]');
      vipPlan = DesignFixtures.vipPlan;
      vipHistory = DesignFixtures.vipPlanHistory;
    } catch (e: any) {
      isError = true;
      errorMessage = e?.message || 'Failed to load VIP';
    }

    const vipPlans = [
      { id: 'tier_1', name: 'Silver Noble', price: '$9.99/mo', level: 1, active: false },
      { id: 'tier_2', name: 'Diamond Aristocrat', price: '$29.99/mo', level: 2, active: false },
      { id: 'tier_3', name: 'Crown Sovereign', price: '$49.99/mo', level: 3, active: true },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-vip-layout">
        {renderSubViewHeader('VIP Membership & Privileges', 'Exclusive luxury entrance animations, golden crowns, priority badges, and stealth mode', 'وی آئی پی رکنیت')}

        {isError || !vipPlan ? (
          <div data-testid="vip-error-state" className="p-8 text-center rounded-3xl bg-white border border-red-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800">VIP System Unavailable</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Active VIP Status Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-900 via-purple-950 to-black text-white space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-md">
                    <Crown className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black">{vipPlan.tierName}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase">
                        Active Tier
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">Valid until {vipPlan.expiryDate} ({vipPlan.daysRemaining} days remaining)</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-amber-300">Tier Level {vipPlan.tierLevel}</span>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400 font-semibold">
                  <span>Tier Maintenance Progress</span>
                  <span className="text-amber-300 font-bold">{Math.round(vipPlan.progressPercentage * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                    style={{ width: \`\${vipPlan.progressPercentage * 100}%\` }}
                  />
                </div>
              </div>
            </div>

            {/* VIP Plans Catalog */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-gray-900">VIP Membership Tiers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {vipPlans.map((plan) => (
                  <div
                    key={plan.id}
                    data-testid={\`vip-plan-\${plan.id}\`}
                    className={\`p-5 rounded-3xl border flex flex-col justify-between space-y-3 \${
                      plan.active
                        ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                        : 'bg-white border-gray-200'
                    }\`}
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-700">Tier {plan.level}</span>
                      <h5 className="text-sm font-black text-gray-900">{plan.name}</h5>
                      <span className="text-xs font-black text-gray-600 block mt-1">{plan.price}</span>
                    </div>

                    <button
                      type="button"
                      disabled={plan.active}
                      onClick={() => showToast(\`VIP Tier: \${plan.name}\`)}
                      className={\`w-full py-2 rounded-xl text-xs font-bold transition \${
                        plan.active
                          ? 'bg-amber-400 text-black font-black cursor-default'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }\`}
                    >
                      {plan.active ? 'Active Plan' : 'Select Plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Exclusive Privileges */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-3">
              <h4 className="text-sm font-extrabold text-gray-900">Exclusive Privileges</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vipPlan.privileges.map((p) => (
                  <div key={p.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">{p.title}</h5>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* VIP History */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-3">
              <h4 className="text-sm font-extrabold text-gray-900">VIP Subscription History</h4>
              <div className="space-y-2">
                {vipHistory.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <h5 className="font-bold text-gray-900">{item.tierName}</h5>
                      <span className="text-[10px] text-gray-400">{item.startDate} to {item.endDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-800">${item.pricePaidUsd}</span>
                      <span className={\`block text-[10px] font-bold \${item.status === 'Active' ? 'text-emerald-600' : 'text-gray-400'}\`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // MAIN VIEW: PROFILE DASHBOARD
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-150" data-testid="profile-main-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-gray-900 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. PROFILE HEADER CARD (Authentic Fixture Image and Details) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-200/90 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with VIP Golden Crown Ring */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-amber-400 shadow-md bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-sm">
              <Crown className="w-4 h-4 fill-white" />
            </div>
          </div>

          {/* User Information */}
          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {user.nickname}
              </h1>
              <span className="text-base">{user.flagEmoji}</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                VIP {liveVipLevel !== null ? liveVipLevel : user.vipLevel}
              </span>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-extrabold border border-amber-200 text-[10px]">
                Wealth Lv. {liveWealthLevel !== null ? liveWealthLevel : user.wealthLevel}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-pink-50 text-[#FF1A6C] font-extrabold border border-pink-200 text-[10px]">
                Shining Lv. {liveShiningLevel !== null ? liveShiningLevel : user.hostLevel}
              </span>
              <span className="text-[11px] text-gray-400">
                {user.bio}
              </span>
            </div>

            {/* User ID & Copy Button */}
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-gray-500">
              <span>ID: <strong className="text-gray-800 font-mono">{user.poppoId}</strong></span>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                title="Copy User ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. FOUR PROFILE STATS ROW (Clickable - Section 4, R2 - Actual Fixture Friends Count) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-8 pt-6 border-t border-gray-100 text-center">
          <button
            type="button"
            data-testid="profile-stat-friends"
            onClick={() => setActiveRelationType('friends')}
            className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/60 active:scale-95 transition-all text-center group cursor-pointer border border-transparent hover:border-pink-200"
            title="View Friends List"
          >
            <span className="block text-base sm:text-xl font-black text-gray-900 group-hover:text-[#FF1A6C] transition-colors">{user.friendsCount}</span>
            <span className="text-xs font-semibold text-gray-500">Friends</span>
          </button>
          <button
            type="button"
            data-testid="profile-stat-following"
            onClick={() => setActiveRelationType('following')}
            className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/60 active:scale-95 transition-all text-center group cursor-pointer border border-transparent hover:border-pink-200"
            title="View Following List"
          >
            <span className="block text-base sm:text-xl font-black text-gray-900 group-hover:text-[#FF1A6C] transition-colors">{user.followingCount}</span>
            <span className="text-xs font-semibold text-gray-500">Following</span>
          </button>
          <button
            type="button"
            data-testid="profile-stat-followers"
            onClick={() => setActiveRelationType('followers')}
            className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/60 active:scale-95 transition-all text-center group cursor-pointer border border-transparent hover:border-pink-200"
            title="View Followers List"
          >
            <span className="block text-base sm:text-xl font-black text-gray-900 group-hover:text-[#FF1A6C] transition-colors">{(user.followersCount / 1000).toFixed(1)}k</span>
            <span className="text-xs font-semibold text-gray-500">Followers</span>
          </button>
          <button
            type="button"
            data-testid="profile-stat-visitors"
            onClick={() => setActiveRelationType('visitors')}
            className="p-3 rounded-2xl bg-gray-50/80 hover:bg-pink-50/60 active:scale-95 transition-all text-center group cursor-pointer border border-transparent hover:border-pink-200"
            title="View Visitors List"
          >
            <span className="block text-base sm:text-xl font-black text-gray-900 group-hover:text-[#FF1A6C] transition-colors">{(user.visitorCount / 1000).toFixed(1)}k</span>
            <span className="text-xs font-semibold text-gray-500">Visitors</span>
          </button>
        </div>
      </div>

      {/* 3. COINS & POINTS CARDS (Coins button opens Coins Wallet Sub-view) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Coins Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-100">
                Popo Coins
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {coinBalance.toLocaleString()}
            </h3>
            <p className="text-[11px] text-yellow-100/90 font-medium">Available for sending gifts</p>
          </div>

          <button
            type="button"
            data-testid="profile-btn-coins"
            onClick={() => setActiveSubView('wallet')}
            className="px-4 py-2 rounded-2xl bg-white text-amber-800 text-xs font-black shadow-md hover:bg-yellow-50 active:scale-95 transition-transform"
          >
            Get Coins
          </button>
        </div>

        {/* Points Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-700 to-indigo-900 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-300" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                Broadcaster Points
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {wallet.pointsBalance.toLocaleString()}
            </h3>
            <p className="text-[11px] text-purple-200/90 font-medium">
              ≈ ${(wallet.withdrawableUsd || 420.5).toFixed(2)} USD Withdrawable
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            className="px-4 py-2 rounded-2xl bg-white text-indigo-900 text-xs font-black shadow-md hover:bg-purple-50 active:scale-95 transition-transform"
          >
            Exchange
          </button>
        </div>
      </div>

      {/* 4. VIP PRIVILEGE BANNER (VIP Button opens VIP Sub-view) */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 text-white border border-purple-900/40 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-md">
              <Crown className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">VIP 3 · Crown Sovereign</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Active (43 days left)
                </span>
              </div>
              <p className="text-xs text-gray-400">Exclusive gifts, entrance anims, and stealth browsing</p>
            </div>
          </div>

          <button
            type="button"
            data-testid="profile-btn-vip"
            onClick={() => setActiveSubView('vip')}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
          >
            VIP Privileges
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-gray-400">
            <span>VIP Progress</span>
            <span className="text-amber-300 font-bold">7,200 / 10,000 pts (72%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full w-[72%]" />
          </div>
        </div>

        {/* 6 VIP Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">Exclusive Crown Frame</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">Studio Entrance Waves</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">5% Bonus Diamonds</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">Priority KYC Queue</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">Daily Coin Grant</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-[11px] font-semibold text-white/90">Star Club Access</span>
          </div>
        </div>
      </div>

      {/* 5. EIGHT FEATURE ICONS (Complete Working Navigation Controls) */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-3">
        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
          Centers & Features
        </span>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 text-center">
          {featureIcons.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                data-testid={\`feature-icon-\${feat.id}\`}
                onClick={() => setActiveSubView(feat.id)}
                className="flex flex-col items-center space-y-1.5 p-2 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group active:scale-95"
              >
                <div className={\`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs \${feat.color}\`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 group-hover:text-[#FF1A6C] transition-colors">
                  {isUr ? feat.titleUr : feat.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. STREAMER CENTER & BUILDER CENTER HUBS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Streamer Center Card */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#FF1A6C] flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Streamer Center</h3>
                <p className="text-[11px] text-gray-400">Broadcaster tasks, level perks, and earnings</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onOpenGoLive) onOpenGoLive();
              }}
              className="px-3 py-1.5 rounded-full bg-[#FF1A6C] hover:bg-[#e0125c] text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>+ Go Live</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div
              onClick={() => setActiveSubView('reward')}
              className="p-3 rounded-2xl bg-gray-50 hover:bg-pink-50/50 border border-gray-100 space-y-1 cursor-pointer transition"
            >
              <span className="text-[10px] text-gray-400 font-bold uppercase">Daily Host Tasks</span>
              <p className="font-extrabold text-gray-900">3 of 5 Completed</p>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="w-3/5 h-full bg-[#FF1A6C]" />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Task Level</span>
              <p className="font-extrabold text-gray-900">Level 14 · Advanced</p>
              <span className="text-[10px] text-emerald-600 font-semibold">+15% Earning Boost</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Starter Pack</span>
              <p className="font-extrabold text-gray-900">Claimed (Active)</p>
              <span className="text-[10px] text-purple-600 font-semibold">Priority Broadcaster</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Earning Identity</span>
              <p className="font-extrabold text-gray-900">Verified Broadcaster</p>
              <span className="text-[10px] text-blue-600 font-semibold">KYC Level 2 Approved</span>
            </div>
          </div>
        </div>

        {/* Builder Center Card */}
        <div className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Builder Center</h3>
                <p className="text-[11px] text-gray-400">Agency roster, coin sellers & withdrawals</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAgencyModal(true)}
              className="px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition"
            >
              My Agency
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Agency Details</span>
              <p className="font-extrabold text-gray-900 truncate">{agency.agencyName}</p>
              <span className="text-[10px] text-gray-500 font-mono">Code: {agency.agencyCode}</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Agency Members</span>
              <p className="font-extrabold text-gray-900">{agencyMembers.length} Broadcasters</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Active Roster</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Coin Seller</span>
              <p className="font-extrabold text-gray-900 truncate">{coinSeller.sellerName}</p>
              <span className="text-[10px] text-gray-500">{coinSeller.whatsappContact}</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Withdrawable</span>
              <p className="font-extrabold text-emerald-600">${(wallet.withdrawableUsd || 420.5).toFixed(2)} USD</p>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(true)}
                className="text-[10px] text-[#FF1A6C] font-bold hover:underline"
              >
                Request Withdrawal →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. SEVEN LOWER MODULE ROWS (Complete Navigation - No Toasts) */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-2">
        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">
          Account & Services
        </span>

        {/* Row 1: Help Topics */}
        <div
          data-testid="profile-row-help"
          onClick={() => setShowHelpModal(true)}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Help Center & FAQ</h4>
              <p className="text-[10px] text-gray-400">8 comprehensive help topics and guidelines</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 2: Watch History */}
        <div
          data-testid="profile-row-watch-history"
          onClick={() => setActiveSubView('watch_history')}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Watch History</h4>
              <p className="text-[10px] text-gray-400">Review previously visited live streams</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 3: Level (Renamed from Task Level -> opens Honor & Recognition bars) */}
        <div
          data-testid="profile-row-level"
          onClick={() => setActiveSubView('honor')}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Level</h4>
              <p className="text-[10px] text-gray-400">Wealth, Shining & Honor level progression</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 4: Achievement Poster */}
        <div
          data-testid="profile-row-poster"
          onClick={() => setActiveSubView('poster')}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Achievement Poster</h4>
              <p className="text-[10px] text-gray-400">Shareable creator milestone posters</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 5: Backpack / Bag */}
        <div
          data-testid="profile-row-bag"
          onClick={() => setActiveSubView('bag')}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Backpack & Inventory</h4>
              <p className="text-[10px] text-gray-400">Your store items, frames, and entrance carriages</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 6: My Agency */}
        <div
          data-testid="profile-row-agency"
          onClick={() => setShowAgencyModal(true)}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">My Agency</h4>
              <p className="text-[10px] text-gray-400">Indus Star Media Agency (Code: AGY-78601)</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>

        {/* Row 7: Redeem Code */}
        <div
          data-testid="profile-row-redeem"
          onClick={() => {
            setRedeemResult(null);
            setRedeemInput('');
            setShowRedeemModal(true);
          }}
          className="p-3.5 rounded-2xl hover:bg-gray-50 flex items-center justify-between cursor-pointer transition border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Redeem Code</h4>
              <p className="text-[10px] text-gray-400">Enter voucher code for bonus coins</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* 8. POLICY BANNERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-50 text-[#FF1A6C]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Community Safety & Rules</h4>
              <p className="text-gray-400 text-[11px]">Strict zero-harassment and anti-fraud policies.</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </div>

        <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Broadcaster Terms & Payouts</h4>
              <p className="text-gray-400 text-[11px]">Fair revenue sharing and diamond withdrawals.</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REDEEM CODE MODAL                                                */}
      {/* ========================================================================= */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#FF1A6C]" />
                <h3 className="text-sm font-extrabold text-gray-900">Redeem Voucher Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRedeemModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Enter official promotional code to receive instant coin rewards.
              (Try test code: <strong className="text-pink-600 font-mono">POPO-WELCOME-2026</strong>)
            </p>

            <form onSubmit={handleRedeemCode} className="space-y-3">
              <input
                type="text"
                value={redeemInput}
                onChange={(e) => setRedeemInput(e.target.value)}
                placeholder="e.g. POPO-WELCOME-2026"
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-[#FF1A6C]"
              />

              {redeemResult && (
                <div
                  className={\`p-3 rounded-xl text-xs flex items-center gap-2 \${
                    redeemResult.isValid
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }\`}
                >
                  {redeemResult.isValid ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{redeemResult.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!redeemInput.trim()}
                className="w-full py-2.5 rounded-xl bg-[#FF1A6C] hover:bg-[#e0125c] disabled:opacity-40 text-white text-xs font-bold transition shadow-xs"
              >
                Redeem Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: HELP TOPICS MODAL                                               */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-extrabold text-gray-900">Help Center & FAQ</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {helpTopics.map((topic) => (
                <div key={topic.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold text-[#FF1A6C] uppercase">{topic.category}</span>
                  <h4 className="text-xs font-bold text-gray-900">{topic.question}</h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{topic.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AGENCY MANAGEMENT MODAL                                         */}
      {/* ========================================================================= */}
      {showAgencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">{agency.agencyName}</h3>
                  <span className="text-[10px] text-gray-500 font-mono">Leader: {agency.agentLeader} · Code: {agency.agencyCode}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAgencyModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-xs font-bold text-gray-700">Agency Broadcaster Roster:</h4>
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {agencyMembers.map((member) => (
                <div key={member.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={member.avatarUrl} alt={member.nickname} className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200" />
                    <div>
                      <h5 className="text-xs font-bold text-gray-900">{member.nickname}</h5>
                      <p className="text-[10px] text-gray-500">ID: {member.userId} · Lv.{member.hostLevel}</p>
                    </div>
                  </div>
                  <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${
                    member.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                  }\`}>
                    {member.status === 'active' ? 'Active Host' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DIAMOND WITHDRAWAL FORM                                         */}
      {/* ========================================================================= */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-gray-900">Exchange & Withdrawal</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawSuccess(false);
                }}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-base font-extrabold text-gray-900">Withdrawal Request Submitted</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  $420.50 USD request has been routed to your authorized payment method (Bank Transfer / EasyPaisa).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawSuccess(false);
                  }}
                  className="px-6 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                  <span className="text-gray-500">Available Points:</span>
                  <span className="font-bold text-gray-900">{wallet.pointsBalance.toLocaleString()} pts</span>
                </div>

                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                  <span className="text-gray-500">Withdrawable Cash:</span>
                  <span className="font-extrabold text-emerald-600 text-sm">${(wallet.withdrawableUsd || 420.5).toFixed(2)} USD</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">Payout Method</label>
                  <select className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-800">
                    <option>Bank Transfer (Habib Bank Limited)</option>
                    <option>EasyPaisa Mobile Wallet</option>
                    <option>JazzCash Wallet</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setWithdrawSuccess(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  Submit Withdrawal Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PEOPLE LIST (FRIENDS, FOLLOWING, FOLLOWERS, VISITORS) (R2)      */}
      {/* ========================================================================= */}
      {activeRelationType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF1A6C]" />
                <h3 className="text-base font-extrabold text-gray-900 capitalize">
                  {activeRelationType === 'friends' && \`Friends (\${user.friendsCount})\`}
                  {activeRelationType === 'following' && \`Following (\${user.followingCount})\`}
                  {activeRelationType === 'followers' && \`Followers (\${user.followersCount.toLocaleString()})\`}
                  {activeRelationType === 'visitors' && \`Visitors (\${user.visitorCount.toLocaleString()})\`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveRelationType(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Error, Empty, or Filled */}
            {relationData.error ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 capitalize">Unable to Load {activeRelationType}</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">{relationData.error}</p>
                <button
                  type="button"
                  onClick={() => setFollowVersion((v) => v + 1)}
                  className="px-4 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-black transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : relationData.isEmpty ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-pink-50 text-[#FF1A6C] flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 capitalize">No {activeRelationType} yet</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  When you connect with people, they will appear in this list.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
                {relationData.people.map((person) => {
                  const isFollowing = DesignFixtures.isUserFollowed(person.userId);
                  return (
                    <div
                      key={person.userId}
                      className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100/80 border border-gray-100 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={person.avatarUrl}
                            alt={person.nickname}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-pink-100"
                          />
                          {person.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                          )}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-gray-900">{person.nickname}</h5>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <span>{person.country || 'Pakistan'}</span>
                            {person.mutualCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{person.mutualCount} mutual</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(person.userId, person.nickname)}
                        className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all \${
                          isFollowing
                            ? 'bg-gray-200/90 text-gray-700 hover:bg-gray-300'
                            : 'bg-gradient-to-r from-[#FF1A6C] to-[#E0155A] text-white hover:brightness-105 shadow-sm'
                        }\`}
                      >
                        {isFollowing ? 'Following' : '+ Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebProfilePanel;
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('WebProfilePanel.tsx updated successfully');
