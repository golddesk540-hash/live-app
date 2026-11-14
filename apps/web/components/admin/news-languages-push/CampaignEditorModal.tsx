import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Send,
  Calendar,
  Users,
  Image as ImageIcon,
  Sparkles,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  CampaignRecord,
  PushNotificationType,
  AudienceGroupId,
  AudienceGroup,
  LanguageRecord,
  CampaignStatus,
} from './newsLanguagesPushTypes';

interface CampaignEditorModalProps {
  isOpen: boolean;
  campaign: CampaignRecord | null;
  audienceGroups: AudienceGroup[];
  languages: LanguageRecord[];
  onClose: () => void;
  onSave: (campaign: CampaignRecord, action: 'draft' | 'schedule' | 'send') => void;
  onPreview: (campaign: Partial<CampaignRecord>) => void;
}

const NOTIFICATION_TYPES: PushNotificationType[] = [
  'General Announcement',
  'News Update',
  'Event Notification',
  'Promotional Notification',
  'Important Notice',
];

export const CampaignEditorModal: React.FC<CampaignEditorModalProps> = ({
  isOpen,
  campaign,
  audienceGroups,
  languages,
  onClose,
  onSave,
  onPreview,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState('');
  const [type, setType] = useState<PushNotificationType>('General Announcement');
  const [selectedAudiences, setSelectedAudiences] = useState<AudienceGroupId[]>(['all_users']);
  const [languageCode, setLanguageCode] = useState('en');
  const [scheduledAt, setScheduledAt] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title);
      setMessage(campaign.message);
      setImage(campaign.image || '');
      setType(campaign.type);
      setSelectedAudiences(
        campaign.audienceGroups.length > 0 ? campaign.audienceGroups : ['all_users']
      );
      setLanguageCode(campaign.languageCode || 'en');
      setScheduledAt(campaign.scheduledAt ? campaign.scheduledAt.replace(' ', 'T') : '');
    } else {
      setTitle('');
      setMessage('');
      setImage(
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
      );
      setType('General Announcement');
      setSelectedAudiences(['all_users']);
      setLanguageCode('en');
      const now = new Date();
      now.setHours(now.getHours() + 2);
      setScheduledAt(now.toISOString().slice(0, 16));
    }
    setErrors({});
  }, [campaign, isOpen]);

  if (!isOpen) return null;

  const toggleAudience = (audId: AudienceGroupId) => {
    if (audId === 'all_users') {
      setSelectedAudiences(['all_users']);
      return;
    }

    let next: AudienceGroupId[] = selectedAudiences.filter((id) => id !== 'all_users');
    if (next.includes(audId)) {
      next = next.filter((id) => id !== audId);
      if (next.length === 0) next = ['all_users'];
    } else {
      next.push(audId);
    }
    setSelectedAudiences(next);
  };

  // Calculate estimated total audience size
  const totalAudienceEstimate = selectedAudiences.reduce((sum, id) => {
    const group = audienceGroups.find((g) => g.id === id);
    return sum + (group ? group.sizeEstimate : 0);
  }, 0);

  const audienceSummaryText = selectedAudiences
    .map((id) => audienceGroups.find((g) => g.id === id)?.name || id)
    .join(', ');

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = 'Notification title is required';
    if (!message.trim()) newErrors.message = 'Notification message body is required';
    if (selectedAudiences.length === 0) newErrors.audience = 'Select at least one audience group';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAction = (action: 'draft' | 'schedule' | 'send') => {
    if (!validate()) return;

    const statusMap: { [key: string]: CampaignStatus } = {
      draft: 'Draft',
      schedule: 'Scheduled',
      send: 'Sent Demo',
    };

    const newCampaign: CampaignRecord = {
      id: campaign ? campaign.id : `CMP-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      message: message.trim(),
      image: image.trim(),
      type,
      audienceGroups: selectedAudiences,
      audienceSummary: audienceSummaryText,
      languageCode,
      createdAt: campaign ? campaign.createdAt : new Date().toISOString().split('T')[0],
      scheduledAt: scheduledAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
      sentAt: action === 'send' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : campaign?.sentAt,
      status: statusMap[action],
      deliveredCount:
        action === 'send'
          ? totalAudienceEstimate
          : campaign?.deliveredCount || 0,
      openRatePercentage:
        action === 'send'
          ? Math.floor(Math.random() * 20) + 25
          : campaign?.openRatePercentage || 0,
    };

    onSave(newCampaign, action);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn"
      data-testid="campaign-editor-modal"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {campaign ? 'Edit Push Notification' : 'Create Push Notification Campaign'}
              </h2>
              <p className="text-xs text-slate-400">
                Compose, target audience, schedule, or dispatch demo alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Notification Title & Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Campaign Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🌟 Weekend Star Battle Has Begun!"
                className={`w-full px-3.5 py-2.5 bg-slate-800 border ${
                  errors.title ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-sm`}
              />
              {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Notification Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PushNotificationType)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500"
              >
                {NOTIFICATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Message Body *
              </label>
              <span className="text-[11px] text-slate-400">{message.length}/200 characters</span>
            </div>
            <textarea
              rows={3}
              maxLength={200}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Keep it punchy, engaging, and action-oriented for maximum open rates..."
              className={`w-full px-3.5 py-2.5 bg-slate-800 border ${
                errors.message ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-sm resize-none`}
            />
            {errors.message && <p className="text-xs text-rose-400 mt-1">{errors.message}</p>}
          </div>

          {/* Image URL & Thumbnail Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Image Attachment URL (Optional)
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-sm"
              />
              {image && (
                <div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-950">
                  <img
                    src={image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Target Audience Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                Target Audience Multi-select *
              </label>
              <span className="text-xs text-pink-400 font-semibold">
                Estimated Recipients: {totalAudienceEstimate.toLocaleString()} users
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
              {audienceGroups.map((aud) => {
                const isSelected = selectedAudiences.includes(aud.id);
                return (
                  <div
                    key={aud.id}
                    onClick={() => toggleAudience(aud.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all select-none ${
                      isSelected
                        ? 'bg-pink-500/15 border-pink-500 text-pink-200'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{aud.name}</span>
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isSelected ? 'bg-pink-500 text-white' : 'border border-slate-600'
                        }`}
                      >
                        {isSelected && '✓'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{aud.description}</p>
                    <div className="text-[10px] font-semibold text-pink-400/90 mt-1">
                      ~{aud.sizeEstimate.toLocaleString()} users
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.audience && <p className="text-xs text-rose-400 mt-1">{errors.audience}</p>}
          </div>

          {/* Language & Scheduled Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Language
              </label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Schedule Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-800/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              onPreview({
                title,
                message,
                image,
                type,
                languageCode,
                audienceSummary: audienceSummaryText,
              })
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-pink-400 bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview Banner</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleAction('draft')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleAction('schedule')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Clock className="w-3.5 h-3.5" />
              Schedule Campaign
            </button>
            <button
              type="button"
              onClick={() => handleAction('send')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 transition-all shadow-lg shadow-pink-500/25"
            >
              <Send className="w-3.5 h-3.5" />
              Send Demo Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
