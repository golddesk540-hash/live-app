'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Download,
  Share2,
  Sparkles,
  Lock,
  UserCheck,
  Award,
  Layers,
  Smartphone,
  Apple
} from 'lucide-react';
import { ReleaseDecision } from './releaseTypes';

interface FinalReleaseApprovalViewProps {
  onApproveRelease?: () => void;
}

export const FinalReleaseApprovalView: React.FC<FinalReleaseApprovalViewProps> = ({
  onApproveRelease
}) => {
  const [currentDecision, setCurrentDecision] = useState<ReleaseDecision>('Ready for Final Approval');
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const pillars = [
    { name: 'Build Packaging & Signing', status: 'Passed', detail: 'Signed with Keystore v3 & Apple Distribution', icon: Layers },
    { name: 'Store Assets & Descriptions', status: 'Passed', detail: '1080x2400 and 1290x2796 screenshots verified', icon: Smartphone },
    { name: 'Security & Secret Isolation', status: 'Passed', detail: '0 plaintext secrets in bundle, HTTPS enforced', icon: Lock },
    { name: 'Privacy & COPPA 18+ Gate', status: 'Passed', detail: 'Age gate active, ATT and camera/mic descriptors verified', icon: ShieldCheck },
    { name: 'QA Test Matrix Validation', status: 'Passed', detail: '31/32 passed, 0 blockers across 9 categories', icon: FileCheck },
    { name: 'Zero Critical Defect Gate', status: 'Passed', detail: '0 P0 critical bugs open in tracker', icon: CheckCircle2 }
  ];

  const signatories = [
    { role: 'Mobile Engineering Lead', name: 'Alex Rivera, Lead Staff Engineer', date: '2026-11-14', status: 'Signed' },
    { role: 'Quality Assurance Director', name: 'Sophia Chen, Head of QA', date: '2026-11-14', status: 'Signed' },
    { role: 'Chief Information Security Officer', name: 'Marcus Vance, InfoSec Principal', date: '2026-11-14', status: 'Signed' },
    { role: 'Executive Vice President', name: 'Popo Live Executive Board', date: '2026-11-14', status: isApproved ? 'Approved' : 'Pending Sign' }
  ];

  const handleExecuteApproval = () => {
    setIsApproved(true);
    setCurrentDecision('Demo Approved');
    setApprovalModalOpen(false);
    if (onApproveRelease) {
      onApproveRelease();
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <div className="bg-gradient-to-r from-purple-900/50 via-pink-950/40 to-slate-900/60 border border-pink-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-pink-500/30">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Release Gate v1.0.0
                </span>
                <span className="text-xs text-slate-400">Build #104 (Cross-Platform)</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                Final Release Sign-Off & Go/No-Go Decision Console
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Formal executive approval authority for Google Play Store and Apple App Store production rollout.
              </p>
            </div>
          </div>

          {/* Decision Control Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentDecision('Not Ready')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                currentDecision === 'Not Ready'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-white'
              }`}
            >
              Not Ready
            </button>
            <button
              onClick={() => setCurrentDecision('Needs Review')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                currentDecision === 'Needs Review'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-white'
              }`}
            >
              Needs Review
            </button>
            <button
              onClick={() => setCurrentDecision('Ready for Final Approval')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                currentDecision === 'Ready for Final Approval'
                  ? 'bg-purple-500/20 text-purple-200 border-purple-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-white'
              }`}
            >
              Ready for Final Approval
            </button>
            <button
              onClick={() => setApprovalModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-pink-500/30 active:scale-95"
            >
              <Rocket className="w-4 h-4 fill-white" />
              {isApproved ? 'Demo Approved 🚀' : 'Authorize Release 🚀'}
            </button>
          </div>
        </div>
      </div>

      {/* 6 Release Pillars */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider text-slate-400">
          6 Core Release Governance Pillars
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="p-4 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md flex items-start gap-3.5"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-xs">{pillar.name}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {pillar.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{pillar.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Signatories & Executive Authorization Record */}
      <div className="bg-slate-900/60 border border-purple-800/30 rounded-2xl p-6 backdrop-blur-md">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-pink-400" />
          Executive Sign-off Signatures & Audit Trail
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {signatories.map((sig, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-950/60 border border-purple-800/20 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{sig.role}</span>
                <span className="text-white font-semibold text-xs mt-1 block">{sig.name}</span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-purple-800/20 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono">{sig.date}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    sig.status === 'Signed' || sig.status === 'Approved'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  ✓ {sig.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-purple-800/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Release Manifest Spec generated with SHA-256 integrity hash verification.
          </div>
          <button
            onClick={() => alert('Release Manifest JSON exported successfully for demo verification.')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/40 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export Signed Release Manifest (JSON)
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-pink-500/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-pink-500/30">
              <Rocket className="w-7 h-7 fill-white" />
            </div>

            <h3 className="text-xl font-bold text-white">
              Authorize Production Release v1.0.0?
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              All 6 release governance pillars, 27 checklist items, and 32 QA test suites have been verified. This demo confirmation signs the final executive release decree.
            </p>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-purple-800/40 my-4 text-xs font-mono text-left space-y-1 text-slate-300">
              <div>Version: v1.0.0 (Build #104)</div>
              <div>Platform: Cross-Platform (Android & iOS)</div>
              <div>Decision: Executive Release Authorized</div>
              <div className="text-emerald-400">Gate: 0 Critical Bugs • 100% Security Compliant</div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setApprovalModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteApproval}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-pink-500/30"
              >
                Confirm Release Authorization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
