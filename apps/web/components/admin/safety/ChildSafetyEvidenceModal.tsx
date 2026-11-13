'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileCheck,
  FileText,
  Image as ImageIcon,
  Lock,
  Maximize2,
  Minimize2,
  Shield,
  ShieldAlert,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { SafetyEvidenceItem } from './childSafetyTypes';

interface ChildSafetyEvidenceModalProps {
  evidence: SafetyEvidenceItem | null;
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChildSafetyEvidenceModal: React.FC<ChildSafetyEvidenceModalProps> = ({
  evidence,
  caseId,
  isOpen,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  if (!isOpen || !evidence) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full ${
          isFullscreen ? 'max-w-6xl h-[92vh]' : 'max-w-3xl max-h-[88vh]'
        } flex flex-col bg-[#120A2A] border border-pink-500/30 rounded-2xl shadow-[0_0_50px_rgba(255,15,123,0.3)] overflow-hidden transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1A103C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                  Evidence Audit · {caseId}
                </span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/10 text-gray-300 font-mono">
                  {evidence.referenceId}
                </span>
              </div>
              <h3 className="text-base font-bold text-white truncate max-w-md">
                {evidence.category}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & Privacy Banner */}
        <div className="px-6 py-2 bg-pink-500/10 border-b border-pink-500/20 flex items-center gap-2 text-[11px] text-pink-300">
          <Lock className="w-3.5 h-3.5 shrink-0 text-pink-400" />
          <span>
            <strong>Demo Data Protocol:</strong> Sample placeholder telemetry. All sensitive data is
            redacted. Fictional records for demonstration only.
          </span>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-[#0B0716] relative min-h-[320px]">
          {evidence.type === 'chat_excerpt' ? (
            <div className="w-full max-w-xl p-5 rounded-xl bg-[#1A103C] border border-white/10 font-mono text-xs text-gray-200 leading-relaxed shadow-inner">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-gray-400">
                <span>Sanitized Chat Log Extract</span>
                <span>{evidence.submissionDate}</span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded bg-black/40 border border-white/5">
                  <span className="text-purple-400 font-semibold">[08:42:10] Target User: </span>
                  <span>&quot;Do you have another social media account we can chat on?&quot;</span>
                </div>
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30">
                  <span className="text-rose-400 font-semibold">[08:42:15] Safety Alert Trigger: </span>
                  <span className="text-gray-300">
                    Keyword filter flagged external contact solicitation attempt targeting host co-seat.
                  </span>
                </div>
                <div className="p-2.5 rounded bg-black/40 border border-white/5">
                  <span className="text-purple-400 font-semibold">[08:42:22] Target User: </span>
                  <span>&quot;Send me your private phone number...&quot;</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden flex items-center justify-center max-w-full max-h-full">
              <img
                src={evidence.safeThumbnailUrl}
                alt={evidence.description}
                style={{ transform: `scale(${zoomLevel})` }}
                className="max-h-[55vh] object-contain rounded-lg border border-white/10 transition-transform duration-200 shadow-2xl"
              />
            </div>
          )}

          {/* Zoom controls for image evidence */}
          {evidence.type !== 'chat_excerpt' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 border border-white/15 backdrop-blur-md text-white text-xs shadow-lg">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:text-pink-400 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 py-0.5 hover:bg-white/10 rounded font-mono text-[11px]"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:text-pink-400 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer & Audit Info */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#1A103C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <p className="text-white font-medium">{evidence.description}</p>
            <div className="flex items-center gap-4 text-gray-400 text-[11px]">
              <span>Captured: {evidence.submissionDate}</span>
              <span>Size: {evidence.fileSize}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> Status: {evidence.reviewStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
