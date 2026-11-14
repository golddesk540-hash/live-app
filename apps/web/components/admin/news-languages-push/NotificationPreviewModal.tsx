import React, { useState } from 'react';
import { X, Bell, Smartphone, Radio, Globe2, Users, Sparkles, ChevronDown, Check } from 'lucide-react';
import { PushNotificationType } from './newsLanguagesPushTypes';

interface NotificationPreviewData {
  title: string;
  message: string;
  image?: string;
  type?: PushNotificationType | string;
  languageCode?: string;
  audienceSummary?: string;
}

interface NotificationPreviewModalProps {
  isOpen: boolean;
  data: NotificationPreviewData | null;
  onClose: () => void;
}

export const NotificationPreviewModal: React.FC<NotificationPreviewModalProps> = ({
  isOpen,
  data,
  onClose,
}) => {
  const [previewStyle, setPreviewStyle] = useState<'lockscreen' | 'banner'>('lockscreen');
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isOpen || !data) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      data-testid="notification-preview-modal"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Push Notification Preview</h2>
              <p className="text-xs text-slate-400">Mobile notification shade & lockscreen simulator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Controls */}
        <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewStyle('lockscreen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                previewStyle === 'lockscreen'
                  ? 'bg-pink-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Lockscreen Mode
            </button>
            <button
              onClick={() => setPreviewStyle('banner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                previewStyle === 'banner'
                  ? 'bg-pink-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              In-App Top Banner
            </button>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-pink-400 hover:text-pink-300 font-medium"
          >
            {isExpanded ? 'Collapse' : 'Expand Media'}
          </button>
        </div>

        {/* Preview Container simulating Phone UI */}
        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[340px]">
          {/* Simulated Smartphone Screen */}
          <div className="w-full max-w-sm rounded-[32px] p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-slate-700 shadow-2xl relative overflow-hidden">
            {/* Phone Notch / Dynamic Island */}
            <div className="w-24 h-4 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
              <div className="w-3 h-1 rounded-full bg-slate-900" />
            </div>

            {/* Lockscreen Time / Date (if lockscreen) */}
            {previewStyle === 'lockscreen' && (
              <div className="text-center my-3 text-slate-300">
                <div className="text-3xl font-extralight tracking-tight">09:41</div>
                <div className="text-[11px] text-slate-400 font-medium">Tuesday, November 13</div>
              </div>
            )}

            {/* Notification Card */}
            <div className="w-full rounded-2xl bg-slate-800/85 backdrop-blur-md border border-slate-700/80 p-3.5 shadow-xl transition-all">
              {/* App Icon + App Name + Timestamp */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white font-black text-[10px] shadow-sm">
                    P
                  </div>
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                    Popo Live
                  </span>
                  {data.type && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-medium border border-pink-500/30">
                      {data.type}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">now</span>
              </div>

              {/* Title & Body */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white leading-tight">
                  {data.title || 'Notification Title'}
                </h4>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-3">
                  {data.message || 'Notification content body will appear here.'}
                </p>
              </div>

              {/* Attached Rich Image if expanded */}
              {isExpanded && data.image && (
                <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-700/80 aspect-[16/9] bg-slate-900 relative">
                  <img
                    src={data.image}
                    alt="Push Media"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Home Bar indicator */}
            <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-6" />
          </div>
        </div>

        {/* Campaign Metadata Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {data.audienceSummary && (
              <span className="flex items-center gap-1 text-slate-300">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                <span>Target: {data.audienceSummary}</span>
              </span>
            )}
            {data.languageCode && (
              <span className="flex items-center gap-1 text-slate-300">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Lang: {data.languageCode.toUpperCase()}</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
