'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  Shield,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export interface HostRule {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  displayOrder: number;
}

const CANONICAL_RULES: HostRule[] = [
  {
    id: 'rule_nudity',
    title: 'No nudity or sexual content',
    description:
      'Any sexually suggestive or explicit content, pornography, transparent clothing, or indecent exposure is strictly banned on Popo Live. Violations lead to immediate termination of the live broadcast.',
    category: 'Content Safety',
    displayOrder: 1,
  },
  {
    id: 'rule_minors',
    title: 'No minors (under 18)',
    description:
      'Broadcasters must be at least 18 years of age. Streaming featuring minors without adult guardianship or any child exploitation is completely prohibited under our Child Protection Policy.',
    category: 'Age Restriction',
    displayOrder: 2,
  },
  {
    id: 'rule_violence',
    title: 'No violence or hate speech',
    description:
      'Bullying, harassment, hate speech, threats of physical violence, defamation, or discrimination against any individual or demographic group will result in permanent account suspension.',
    category: 'Community Conduct',
    displayOrder: 3,
  },
  {
    id: 'rule_illegal',
    title: 'No illegal or harmful activities',
    description:
      'Broadcasting illegal acts, substance abuse, smoking/vaping or alcohol consumption on camera, gambling, self-harm, weapons, or dangerous stunts is strictly forbidden.',
    category: 'Legal Compliance',
    displayOrder: 4,
  },
  {
    id: 'rule_guidelines',
    title: 'Follow community guidelines',
    description:
      'All hosts must adhere to Popo Live Community Guidelines and Broadcaster Code of Decorum. Treat viewers, fellow broadcasters, and platform staff with dignity and respect.',
    category: 'Platform Decorum',
    displayOrder: 5,
  },
];

interface HostRulesScreenProps {
  onUnderstood?: () => void;
  onDismiss?: () => void;
  isModal?: boolean;
  roomId?: string;
  hostId?: string;
}

export default function HostRulesScreen({
  onUnderstood,
  onDismiss,
  isModal = false,
  roomId = '880219',
  hostId = '8802194',
}: HostRulesScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryRoomId = searchParams.get('roomId') || roomId;
  const queryHostId = searchParams.get('hostId') || hostId;
  const isDemo = searchParams.get('preview') === 'demo' || searchParams.get('demo') === '1';

  const [rules, setRules] = useState<HostRule[]>(CANONICAL_RULES);
  const [policyVersion, setPolicyVersion] = useState<string>('1.0.0');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);

  // Acknowledgement state matching Section 4 of prompt
  const [isChecked, setIsChecked] = useState<boolean>(true); // checked by default for immediate 1-click confirmation
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasAlreadyAccepted, setHasAlreadyAccepted] = useState<boolean>(false);
  const [acceptedTimestamp, setAcceptedTimestamp] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load active rules and host acknowledgement status
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        // Fetch active rules
        const rulesRes = await fetch('/api/live/rules');
        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          if (isMounted && rulesData.success && rulesData.rules?.length > 0) {
            setRules(rulesData.rules);
            if (rulesData.policyVersion) {
              setPolicyVersion(rulesData.policyVersion);
            }
          }
        }

        // Fetch host status
        const statusRes = await fetch(`/api/live/rules/status?hostId=${queryHostId}&preview=demo`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (isMounted && statusData.success) {
            if (statusData.hasAccepted) {
              setHasAlreadyAccepted(true);
              setAcceptedTimestamp(statusData.acceptedAt);
            }
          }
        }
      } catch (err) {
        console.warn('Host rules load notice:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [queryHostId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUnderstand = async () => {
    if (!isChecked && !hasAlreadyAccepted) {
      showToast('Please check the acknowledgement box to proceed.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/live/rules/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: queryHostId,
          policyVersion,
          acknowledgedCheckbox: isChecked,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setHasAlreadyAccepted(true);
        setAcceptedTimestamp(data.acknowledgement?.acceptedAt || new Date().toISOString());
        showToast('Host rules accepted successfully!');

        if (onUnderstood) {
          setTimeout(() => {
            onUnderstood();
          }, 400);
        } else if (!isModal) {
          // If standalone page, proceed to Host Studio or back
          setTimeout(() => {
            router.push(`/live/studio/${queryRoomId}`);
          }, 600);
        }
      } else {
        showToast(data.error || 'Failed to submit acknowledgement');
      }
    } catch (err) {
      console.error('Acceptance error:', err);
      showToast('Network error while saving acknowledgement');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpandRule = (id: string) => {
    setExpandedRuleId(expandedRuleId === id ? null : id);
  };

  return (
    <div
      data-testid="host-rules-screen"
      className="relative w-full max-w-sm sm:max-w-md mx-auto min-h-screen bg-[#0a0a1f] text-white flex flex-col justify-between overflow-x-hidden font-sans select-none"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 12%, rgba(255, 32, 110, 0.16) 0%, rgba(139, 92, 246, 0.08) 35%, transparent 65%), linear-gradient(180deg, #090919 0%, #0d0f28 50%, #090a18 100%)',
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#ff206e] text-white font-semibold text-xs px-4 py-2 rounded-full shadow-lg shadow-pink-500/30 animate-in fade-in zoom-in duration-200 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center px-5 pt-8 pb-4">
        {/* TOP BRAND HEADER (poppo Live logo with rainbow badge) */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-pink-500 via-amber-400 to-cyan-400 p-[1.5px] shadow-sm flex items-center justify-center">
            <div className="w-full h-full bg-[#181938] rounded-[5px] flex items-center justify-center">
              <span className="text-[9px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-200 to-cyan-300">
                pls
              </span>
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,32,110,0.4)]">
            poppo <span className="font-bold">Live</span>
          </span>
        </div>

        {/* SECURITY SHIELD ICON (Neon magenta glowing shield with golden flame crest) */}
        <div className="relative mb-4 flex items-center justify-center">
          {/* Subtle neon glow behind shield */}
          <div className="absolute w-20 h-20 rounded-full bg-[#ff206e]/25 blur-xl -z-0" />
          
          <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 duration-200">
            <svg
              viewBox="0 0 64 74"
              className="w-14 h-16 drop-shadow-[0_4px_16px_rgba(255,32,110,0.6)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="shieldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4081" />
                  <stop offset="50%" stopColor="#ff206e" />
                  <stop offset="100%" stopColor="#9c27b0" />
                </linearGradient>
                <linearGradient id="shieldFillGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#2b1142" />
                  <stop offset="50%" stopColor="#1a0e33" />
                  <stop offset="100%" stopColor="#110a26" />
                </linearGradient>
                <linearGradient id="crestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffe082" />
                  <stop offset="50%" stopColor="#ffb300" />
                  <stop offset="100%" stopColor="#ff7043" />
                </linearGradient>
              </defs>
              {/* Outer Shield Path with Thick Neon Border */}
              <path
                d="M32 3L60 14V34C60 52.8 48 65.5 32 71C16 65.5 4 52.8 4 34V14L32 3Z"
                fill="url(#shieldFillGrad)"
                stroke="url(#shieldBorderGrad)"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              {/* Inner Golden Flame / Diamond Crest */}
              <path
                d="M32 20C32 20 23 30 23 38C23 43.5 27 48 32 48C37 48 41 43.5 41 38C41 30 32 20 32 20Z"
                fill="url(#crestGrad)"
              />
              <path
                d="M32 27C32 27 27 34 27 39C27 42 29.2 44.5 32 44.5C34.8 44.5 37 42 37 39C37 34 32 27 32 27Z"
                fill="#ffffff"
                opacity="0.4"
              />
            </svg>
          </div>
        </div>

        {/* PAGE HEADING: Host Rules */}
        <h1 className="text-2xl font-bold tracking-normal text-white text-center mb-6">
          Host Rules
        </h1>

        {/* SINGLE ROUNDED NAVY CARD CONTAINING THE 5 RULES (Matching 04_10_host_rules_on_screen.png) */}
        <div
          data-testid="rules-card"
          className="w-full bg-[#121533] border border-[#22254e] rounded-2xl p-5 shadow-xl shadow-black/40 flex flex-col gap-4 mb-5"
        >
          {rules.map((rule) => {
            const isExpanded = expandedRuleId === rule.id;
            return (
              <div key={rule.id} className="flex flex-col">
                <div
                  data-rule-id={rule.id}
                  onClick={() => toggleExpandRule(rule.id)}
                  className="flex items-center gap-3.5 cursor-pointer py-1 group transition-colors"
                >
                  {/* Vibrant Emerald Checkmark Icon */}
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <Check
                      strokeWidth={3.5}
                      className="w-4 h-4 text-[#00e676] drop-shadow-[0_0_6px_rgba(0,230,118,0.5)] transition-transform group-hover:scale-110"
                    />
                  </div>

                  {/* Rule Title in Clean Crisp White Typography */}
                  <span className="flex-1 text-[15px] font-semibold text-white/95 tracking-wide leading-tight group-hover:text-pink-200 transition-colors">
                    {rule.title}
                  </span>

                  {/* Expand / Info hint chevron */}
                  <div className="text-zinc-500 group-hover:text-zinc-300">
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </div>
                </div>

                {/* Expanded Policy Description Drawer / Accordion */}
                {isExpanded && (
                  <div className="mt-2 ml-8 mr-1 p-3 rounded-xl bg-[#181a3d] border border-white/5 text-xs text-zinc-300 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between text-[11px] font-bold text-pink-400 mb-1">
                      <span>{rule.category}</span>
                      <span className="text-zinc-400 font-mono">v{policyVersion}</span>
                    </div>
                    <p className="text-zinc-200">{rule.description}</p>
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Standard Community Guideline</span>
                      <Link
                        href="/policies/community-guidelines"
                        target="_blank"
                        className="text-pink-400 hover:underline flex items-center gap-1"
                      >
                        Read full policy <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ACKNOWLEDGEMENT CHECKBOX (Section 4 of prompt) */}
        <label
          data-action="toggle-acknowledgement"
          className="w-full flex items-center gap-2.5 px-2 py-1 mb-5 cursor-pointer text-xs text-zinc-300 select-none group"
        >
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
              isChecked
                ? 'bg-[#ff206e] text-white shadow-sm shadow-pink-500/50'
                : 'bg-white/10 border border-zinc-500 group-hover:border-zinc-400'
            }`}
          >
            {isChecked && <Check strokeWidth={3.5} className="w-3 h-3 text-white" />}
          </div>
          <span className="flex-1 text-[12px] leading-tight text-zinc-300 group-hover:text-white transition-colors">
            I understand and agree to strictly uphold Popo Live Host Safety Rules
          </span>
        </label>

        {/* WIDE VIBRANT PINK PILL BUTTON: "I Understand" */}
        <button
          type="button"
          data-action="i-understand"
          onClick={handleUnderstand}
          disabled={isLoading || (!isChecked && !hasAlreadyAccepted)}
          className={`w-full py-3.5 rounded-full font-bold text-[15px] tracking-wide text-white transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
            !isChecked && !hasAlreadyAccepted
              ? 'bg-zinc-700/60 text-zinc-400 cursor-not-allowed shadow-none'
              : 'bg-[#ff206e] hover:bg-[#fa1566] active:scale-[0.98] shadow-pink-600/30 hover:shadow-pink-600/50 cursor-pointer'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Recording...</span>
            </>
          ) : (
            <span>I Understand</span>
          )}
        </button>

        {/* Acceptance Status Hint / Policy Version Footer */}
        {hasAlreadyAccepted && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Policy v{policyVersion} accepted</span>
            {acceptedTimestamp && (
              <span className="text-zinc-500 font-mono text-[10px]">
                ({new Date(acceptedTimestamp).toLocaleDateString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* OFFICIAL MODULE BOTTOM BANNER (Matching 04_10_host_rules_on_screen.png) */}
      <footer className="w-full bg-[#10122e] border-t border-[#1b1e42] py-3.5 px-4 text-center mt-auto">
        <span className="text-sm font-bold text-white tracking-wide">
          4.10 Host Rules on Screen
        </span>
      </footer>
    </div>
  );
}
