'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { NotificationPreferenceState, NotificationType } from './types';
import {
  Heart,
  MessageCircle,
  UserPlus,
  AtSign,
  Crown,
  Sparkles,
  Radio,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

interface NotificationSettingRow {
  key: NotificationType;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

const SETTING_ROWS: NotificationSettingRow[] = [
  {
    key: 'likes',
    label: 'Likes notifications',
    description: 'When someone likes your Square photo, video, or status post.',
    Icon: Heart,
    iconColor: 'text-[#FF4D8D]',
  },
  {
    key: 'comments',
    label: 'Comments notifications',
    description: 'When followers reply or leave comments on your posts.',
    Icon: MessageCircle,
    iconColor: 'text-purple-300',
  },
  {
    key: 'followers',
    label: 'New followers notifications',
    description: 'Alerts when someone starts following your Popo Live profile.',
    Icon: UserPlus,
    iconColor: 'text-pink-400',
  },
  {
    key: 'mentions',
    label: 'Mentions notifications',
    description: 'When another user tags @you in a Square post or thread.',
    Icon: AtSign,
    iconColor: 'text-cyan-300',
  },
  {
    key: 'fan_club',
    label: 'Fan Club notifications',
    description: 'Host announcements, badge milestones, and club updates.',
    Icon: Crown,
    iconColor: 'text-amber-300',
  },
  {
    key: 'invites',
    label: 'Invitation notifications',
    description: 'Party room invites and community co-host requests.',
    Icon: Sparkles,
    iconColor: 'text-emerald-300',
  },
  {
    key: 'live',
    label: 'Live activity notifications',
    description: 'Alerts when followed hosts start a live video stream.',
    Icon: Radio,
    iconColor: 'text-rose-400',
  },
];

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: NotificationPreferenceState;
  onTogglePreference: (key: NotificationType) => void;
  onResetDefaults: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onTogglePreference,
  onResetDefaults,
}) => {
  const enabledCount = Object.values(preferences).filter(Boolean).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notification Settings" maxWidth="lg">
      <div data-testid="notification-settings-view" className="space-y-3">
        <div className="rounded-2xl bg-[#1E0F3B]/90 border border-purple-400/20 p-3 flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF1A6C]/20 border border-[#FF1A6C]/35 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#FF4D8D]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">
              Local Notification Preferences ({enabledCount}/7 Active)
            </p>
            <p className="text-[11px] text-purple-200/70 mt-0.5 leading-snug">
              Visual frontend preferences only (System Notices remain separate under Module 8.2).
            </p>
          </div>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
          {SETTING_ROWS.map((row) => {
            const Icon = row.Icon;
            const enabled = preferences[row.key];
            return (
              <div
                key={row.key}
                data-testid={`setting-row-${row.key}`}
                className="rounded-2xl bg-[#16092D]/95 border border-purple-400/20 px-3.5 py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#241046] border border-white/10 flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${row.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {row.label}
                    </p>
                    <p className="text-[10px] text-purple-200/60 leading-tight">
                      {row.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={row.label}
                  data-testid={`setting-switch-${row.key}`}
                  onClick={() => onTogglePreference(row.key)}
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 border ${
                    enabled
                      ? 'bg-gradient-to-r from-[#FF1A6C] to-[#D946EF] border-[#FF6BA3]/50 shadow-glow-pink'
                      : 'bg-[#261647] border-purple-300/20'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            data-testid="settings-reset-defaults-btn"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={onResetDefaults}
          >
            Reset All ON
          </Button>
          <Button
            variant="primary"
            size="sm"
            data-testid="settings-done-btn"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
