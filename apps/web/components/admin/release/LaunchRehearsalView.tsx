'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Rocket,
  Layers,
  Terminal,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { RehearsalStageRecord } from './releaseTypes';

interface LaunchRehearsalViewProps {
  stages: RehearsalStageRecord[];
  onRehearsalComplete?: () => void;
}

export const LaunchRehearsalView: React.FC<LaunchRehearsalViewProps> = ({
  stages: initialStages,
  onRehearsalComplete
}) => {
  const [stages, setStages] = useState<RehearsalStageRecord[]>(initialStages);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [activeStage, setActiveStage] = useState<RehearsalStageRecord | null>(initialStages[0] || null);

  const passedCount = stages.filter((s) => s.status === 'Passed' || s.status === 'Completed').length;
  const progressPercent = Math.round((passedCount / stages.length) * 100);

  // Simulation runner effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && currentStepIndex >= 0 && currentStepIndex < stages.length) {
      timer = setTimeout(() => {
        setStages((prev) =>
          prev.map((s, idx) => {
            if (idx === currentStepIndex) {
              return { ...s, status: 'Passed', pendingTasksCount: 0 };
            } else if (idx === currentStepIndex + 1) {
              return { ...s, status: 'In Progress' };
            }
            return s;
          })
        );

        if (currentStepIndex + 1 < stages.length) {
          setCurrentStepIndex((curr) => curr + 1);
        } else {
          setIsRunning(false);
          if (onRehearsalComplete) onRehearsalComplete();
        }
      }, 700);
    }
    return () => clearTimeout(timer);
  }, [isRunning, currentStepIndex, stages.length, onRehearsalComplete]);

  const handleStartSimulation = () => {
    // Reset all to pending except first to In Progress
    setStages((prev) =>
      prev.map((s, idx) => ({
        ...s,
        status: idx === 0 ? 'In Progress' : 'Pending',
        pendingTasksCount: idx === 0 ? 1 : s.validationChecklist.length
      }))
    );
    setCurrentStepIndex(0);
    setIsRunning(true);
  };

  const handleResetSimulation = () => {
    setIsRunning(false);
    setCurrentStepIndex(-1);
    setStages(initialStages);
  };

  const getStatusBadge = (status: RehearsalStageRecord['status']) => {
    switch (status) {
      case 'Passed':
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse';
      case 'Pending':
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-600/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Disclaimer Banner */}
      <div className="p-4 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900/60 border border-amber-500/40 rounded-2xl flex items-start gap-3 backdrop-blur-md">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
            Launch Rehearsal Simulation Environment
          </span>
          <p className="text-slate-300 leading-relaxed">
            This rehearsal engine executes an end-to-end dry-run across all 9 production launch gates using local reactive state. No actual submissions are transmitted to Google Play Console or Apple App Store Connect.
          </p>
        </div>
      </div>

      {/* Main Control Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900/40 border border-purple-700/30 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 border border-pink-500/30 rounded-xl text-pink-400">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Launch Rehearsal & Dry-Run Simulator
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-normal">
                  9 Critical Stages
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Simulate full store release lifecycle from compilation to executive approval.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetSimulation}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Stages
            </button>

            <button
              onClick={handleStartSimulation}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-pink-500/25 active:scale-95"
            >
              {isRunning ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-white" />
                  Executing Simulation (Stage {currentStepIndex + 1}/9)...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Run Rehearsal Simulation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-5 border-t border-purple-800/20">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium">Rehearsal Validation Progress</span>
            <span className="text-pink-400 font-bold font-mono">{passedCount} / {stages.length} Stages Passed ({progressPercent}%)</span>
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-purple-800/40">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stages Grid & Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Stages List */}
        <div className="lg:col-span-7 space-y-3">
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              onClick={() => setActiveStage(stage)}
              className={`p-4 rounded-2xl border transition backdrop-blur-md cursor-pointer flex items-center justify-between gap-4 ${
                activeStage?.id === stage.id
                  ? 'bg-purple-900/40 border-pink-500/50 shadow-lg shadow-pink-500/10'
                  : 'bg-slate-900/60 border-purple-800/30 hover:border-purple-600/40'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    stage.status === 'Passed' || stage.status === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : stage.status === 'In Progress'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {stage.status === 'Passed' || stage.status === 'Completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-pink-400 font-bold">{stage.id}</span>
                    <h3 className="font-bold text-white text-xs">{stage.stageName}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{stage.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(stage.status)}`}>
                  {stage.status}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>

        {/* Active Stage Inspection Card */}
        <div className="lg:col-span-5">
          {activeStage && (
            <div className="p-6 bg-slate-900/70 border border-purple-800/40 rounded-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-800/20">
                <div>
                  <span className="text-[10px] font-mono text-pink-400 font-bold block">{activeStage.id}</span>
                  <h3 className="font-bold text-white text-base mt-0.5">{activeStage.stageName}</h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(activeStage.status)}`}>
                  {activeStage.status}
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed">
                {activeStage.description}
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/20 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Assigned Owner:</span>
                  <span className="text-white font-medium">{activeStage.assignedReviewer}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Verification Date:</span>
                  <span className="text-slate-300 font-mono">{activeStage.reviewDate}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase block mb-2">
                  Validation Assertions ({activeStage.validationChecklist.length})
                </span>
                <div className="space-y-1.5">
                  {activeStage.validationChecklist.map((item, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-purple-800/20 flex items-start gap-2 text-xs text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
