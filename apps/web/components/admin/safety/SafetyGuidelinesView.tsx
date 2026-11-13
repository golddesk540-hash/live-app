'use client';

import React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  FileCheck,
  FileQuestion,
  Lock,
  MessageSquareWarning,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { SAFETY_GUIDELINES_DATA } from './mockChildSafetyData';

export const SafetyGuidelinesView: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Users':
        return Users;
      case 'AlertTriangle':
        return AlertTriangle;
      case 'MessageSquareWarning':
        return MessageSquareWarning;
      case 'FileQuestion':
        return FileQuestion;
      case 'Lock':
        return Lock;
      case 'FileCheck':
        return FileCheck;
      case 'ArrowUpRight':
        return ArrowUpRight;
      default:
        return Shield;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pink-400" />
            Child Safety Operational Guidelines
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
              Demo Guidance
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Standard operating procedures, evidence chain-of-custody protocols, and minor protection criteria
          </p>
        </div>
      </div>

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SAFETY_GUIDELINES_DATA.map((item) => {
          const Icon = getIcon(item.iconName);
          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-gradient-to-br from-[#1A103C] to-[#120A2A] border border-white/10 hover:border-pink-500/30 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                      {item.id} · {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">{item.summary}</p>

              {/* Key points */}
              <div className="p-3 rounded-xl bg-[#0B0716] border border-white/5 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                  Key Principles
                </span>
                {item.keyPoints.map((kp, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] text-gray-300">
                    <span className="text-pink-400 leading-none mt-1">•</span>
                    <span>{kp}</span>
                  </div>
                ))}
              </div>

              {/* Protocol steps */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Standard Action Steps
                </span>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-300 pl-1">
                  {item.protocolSteps.map((step, idx) => (
                    <li key={idx} className="leading-snug">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
