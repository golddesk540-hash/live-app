import React from 'react';
import {
  Bell,
  Send,
  Calendar,
  Users,
  Clock,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import {
  CampaignRecord,
  AudienceGroup,
  NewsLanguagesPushMetrics,
  NewsLanguagesPushTab,
} from './newsLanguagesPushTypes';

interface PushNotificationDashboardViewProps {
  campaigns: CampaignRecord[];
  audienceGroups: AudienceGroup[];
  metrics: NewsLanguagesPushMetrics;
  onNavigateTab: (tab: NewsLanguagesPushTab) => void;
  onCreateCampaign: () => void;
  onPreviewCampaign: (campaign: CampaignRecord) => void;
}

export const PushNotificationDashboardView: React.FC<PushNotificationDashboardViewProps> = ({
  campaigns,
  audienceGroups,
  metrics,
  onNavigateTab,
  onCreateCampaign,
  onPreviewCampaign,
}) => {
  const sentCampaigns = campaigns.filter((c) => c.status === 'Sent Demo');
  const scheduledCampaigns = campaigns.filter((c) => c.status === 'Scheduled');
  const draftCampaigns = campaigns.filter((c) => c.status === 'Draft');

  return (
    <div className="space-y-6" data-testid="push-notification-dashboard-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Push Notifications & Marketing</h2>
          <p className="text-xs text-slate-400">
            Scheduled broadcasts, dynamic segmentation, simulated lockscreen delivery, and open-rate analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('push_templates')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 transition-all"
          >
            Templates Library
          </button>
          <button
            onClick={onCreateCampaign}
            data-testid="dash-create-push-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Push Campaign</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400">Total Campaigns</span>
          <div className="text-2xl font-bold text-white mt-1">{campaigns.length}</div>
          <span className="text-[10px] text-pink-400 mt-1 block">Configured demo records</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400">Sent (Demo)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{sentCampaigns.length}</div>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Successfully delivered</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400">Scheduled Queued</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{scheduledCampaigns.length}</div>
          <span className="text-[10px] text-indigo-400/80 mt-1 block">Awaiting target trigger</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
          <span className="text-xs text-slate-400">Drafts</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">{draftCampaigns.length}</div>
          <span className="text-[10px] text-purple-400/80 mt-1 block">Unpublished copy</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 col-span-2 md:col-span-1">
          <span className="text-xs text-slate-400">Total Audience Reach</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {(metrics.totalRecipients / 1000000).toFixed(2)}M
          </div>
          <span className="text-[10px] text-amber-400/80 mt-1 block">Registered subscribers</span>
        </div>
      </div>

      {/* Audience Segmentation Breakdown */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-400" />
            Configurable Audience Segments
          </h3>
          <span className="text-xs text-slate-400">6 Verified Groups</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {audienceGroups.map((grp) => (
            <div
              key={grp.id}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-start justify-between gap-3"
            >
              <div>
                <h4 className="text-xs font-bold text-white">{grp.name}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{grp.description}</p>
                <span className="text-xs font-semibold text-pink-400 mt-1.5 block">
                  ~{grp.sizeEstimate.toLocaleString()} recipients
                </span>
              </div>
              <span className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold">
                {grp.id.charAt(0).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Campaigns Table Preview */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-400" />
            Active Push Campaigns ({campaigns.length})
          </h3>
          <button
            onClick={() => onNavigateTab('push_campaigns')}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1"
          >
            <span>Manage All Campaigns</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {campaigns.slice(0, 5).map((cmp) => (
            <div
              key={cmp.id}
              className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-pink-400 flex-shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">{cmp.title}</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      {cmp.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Target: {cmp.audienceSummary} • Scheduled: {cmp.scheduledAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-bold text-white block">
                    {cmp.deliveredCount ? cmp.deliveredCount.toLocaleString() : '—'}
                  </span>
                  <span className="text-[10px] text-slate-500">Delivered</span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    cmp.status === 'Sent Demo'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : cmp.status === 'Scheduled'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : cmp.status === 'Draft'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {cmp.status}
                </span>
                <button
                  onClick={() => onPreviewCampaign(cmp)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Simulate notification lockscreen"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
