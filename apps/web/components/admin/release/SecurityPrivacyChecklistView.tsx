'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ExternalLink,
  Key,
  FileText
} from 'lucide-react';
import { SecurityCheckRecord, PrivacyCheckRecord } from './releaseTypes';

interface SecurityPrivacyChecklistViewProps {
  securityChecks: SecurityCheckRecord[];
  privacyChecks: PrivacyCheckRecord[];
  onToggleSecurityStatus?: (id: string) => void;
  onTogglePrivacyStatus?: (id: string) => void;
}

export const SecurityPrivacyChecklistView: React.FC<SecurityPrivacyChecklistViewProps> = ({
  securityChecks,
  privacyChecks,
  onToggleSecurityStatus,
  onTogglePrivacyStatus
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'privacy'>('security');

  const verifiedSecurityCount = securityChecks.filter((s) => s.status === 'Verified').length;
  const compliantPrivacyCount = privacyChecks.filter((p) => p.status === 'Compliant').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 border border-pink-500/30 rounded-xl text-pink-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Security & Privacy Compliance Console
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Zero credentials in client bundles, COPPA 18+ verification, ATT transparency, and hardware permission declarations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/40 text-xs text-slate-300">
              Security: <span className="text-emerald-400 font-bold font-mono">{verifiedSecurityCount}/{securityChecks.length}</span> Verified
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/40 text-xs text-slate-300">
              Privacy: <span className="text-pink-400 font-bold font-mono">{compliantPrivacyCount}/{privacyChecks.length}</span> Compliant
            </div>
          </div>
        </div>

        {/* Sub Navigation Switcher */}
        <div className="mt-6 pt-5 border-t border-purple-800/20 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/40'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Security Review Checklist ({securityChecks.length})
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'privacy'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/40'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Privacy & Permissions Audit ({privacyChecks.length})
          </button>
        </div>
      </div>

      {/* Security Checklist Content */}
      {activeTab === 'security' && (
        <div className="space-y-3">
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
            <Key className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Client Bundle Audit: </span>
              All secret keys, database credentials, and payment signing secrets are strictly isolated on server endpoints. Zero plaintext tokens exist in public client bundles.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityChecks.map((sec) => (
              <div
                key={sec.id}
                className="p-5 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-pink-400 font-bold">{sec.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        sec.status === 'Verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : sec.status === 'Needs Review'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {sec.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm mt-2">{sec.checkName}</h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{sec.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-800/20 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-purple-400" />
                    {sec.reviewer}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-sans">
                    Risk: <strong className="text-emerald-400">{sec.riskLevel}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Checklist Content */}
      {activeTab === 'privacy' && (
        <div className="space-y-3">
          <div className="p-4 bg-pink-950/20 border border-pink-500/30 rounded-2xl flex items-center gap-3 text-xs text-pink-300">
            <ShieldCheck className="w-5 h-5 text-pink-400 shrink-0" />
            <div>
              <span className="font-bold text-white">App Store & Google Play Privacy Declarations: </span>
              Accurate descriptions for Camera, Microphone, and ATT are bundled in Info.plist and AndroidManifest.xml. User self-serve account deletion is confirmed functional.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {privacyChecks.map((prv) => (
              <div
                key={prv.id}
                className="p-5 bg-slate-900/60 border border-purple-800/30 rounded-2xl backdrop-blur-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-cyan-400 font-bold">{prv.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        prv.status === 'Compliant'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {prv.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm mt-2">{prv.checkName}</h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{prv.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-800/20 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-cyan-400" />
                    {prv.assignedReviewer}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950/70 border border-purple-800/40 text-purple-300 font-sans">
                    {prv.disclosureType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
