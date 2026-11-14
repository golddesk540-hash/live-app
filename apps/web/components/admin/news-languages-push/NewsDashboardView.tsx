import React from 'react';
import {
  Newspaper,
  Languages,
  Bell,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  Globe2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Edit,
  Tag,
  Send,
  Users,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  NewsArticleRecord,
  LanguageRecord,
  CampaignRecord,
  NewsLanguagesPushMetrics,
  NewsLanguagesPushTab,
  NewsAdminActivityItem,
} from './newsLanguagesPushTypes';

interface NewsDashboardViewProps {
  articles: NewsArticleRecord[];
  languages: LanguageRecord[];
  campaigns: CampaignRecord[];
  activities: NewsAdminActivityItem[];
  metrics: NewsLanguagesPushMetrics;
  onNavigateTab: (tab: NewsLanguagesPushTab) => void;
  onCreateNews: () => void;
  onEditNews: (article: NewsArticleRecord) => void;
  onPreviewNews: (article: NewsArticleRecord) => void;
  onCreateCampaign: () => void;
  onPreviewCampaign: (campaign: CampaignRecord) => void;
}

export const NewsDashboardView: React.FC<NewsDashboardViewProps> = ({
  articles,
  languages,
  campaigns,
  activities,
  metrics,
  onNavigateTab,
  onCreateNews,
  onEditNews,
  onPreviewNews,
  onCreateCampaign,
  onPreviewCampaign,
}) => {
  // Extract 3 prominent cards matching 10_08_news_languages_push.png visual reference
  const featuredEvent = articles.find((a) => a.id === 'NEWS-101') || articles[0];
  const featuredHost = articles.find((a) => a.id === 'NEWS-102') || articles[1];
  const featuredFeatures = articles.find((a) => a.id === 'NEWS-103') || articles[2];

  const visualCards = [featuredEvent, featuredHost, featuredFeatures].filter(Boolean);

  return (
    <div className="space-y-8" data-testid="news-dashboard-view">
      {/* Top Banner & Quick Controls matching 10_08_news_languages_push.png */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-pink-950/20 to-slate-900 border border-pink-500/20 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Module 10.8 Live
            </span>
            <span className="text-xs text-slate-400">Popo Live International Operations</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            News, Languages, Push
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Publish platform announcements, localize global strings across 8 languages, and dispatch targeted push campaigns.
          </p>
        </div>

        {/* Action Button matching visual design */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('news_management')}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            All Articles ({articles.length})
          </button>
          <button
            onClick={onCreateNews}
            data-testid="create-news-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 via-pink-600 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Create News</span>
          </button>
        </div>
      </div>

      {/* Pill Switcher Row matching visual reference: [News] [Languages] [Push] */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" data-testid="dashboard-top-pills">
        <button
          onClick={() => onNavigateTab('news_management')}
          className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 shadow-md shadow-pink-500/25 transition-all flex items-center gap-2"
        >
          <Newspaper className="w-4 h-4" />
          <span>News</span>
        </button>
        <button
          onClick={() => onNavigateTab('languages')}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center gap-2"
        >
          <Languages className="w-4 h-4" />
          <span>Languages</span>
        </button>
        <button
          onClick={() => onNavigateTab('push_campaigns')}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center gap-2"
        >
          <Bell className="w-4 h-4" />
          <span>Push</span>
        </button>
      </div>

      {/* Visual Reference Cards matching 10_08_news_languages_push.png */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            Featured News Showcase
          </h2>
          <button
            onClick={() => onNavigateTab('news_management')}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="visual-reference-cards">
          {visualCards.map((card, idx) => {
            const isPublished = card.status === 'Published';
            const isDraft = card.status === 'Draft';
            const isScheduled = card.status === 'Scheduled';

            return (
              <div
                key={card.id || idx}
                className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-pink-500/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Thumbnail Image */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={card.thumbnail}
                    alt={card.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />

                  {/* Top Status & Category Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-700 flex items-center gap-1">
                      {card.categoryName}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-md ${
                        isPublished
                          ? 'bg-emerald-500/90 text-white'
                          : isDraft
                          ? 'bg-purple-600/90 text-white'
                          : isScheduled
                          ? 'bg-indigo-600/90 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {card.status}
                    </span>
                  </div>

                  {/* Views count */}
                  <div className="absolute bottom-2.5 right-3 text-[11px] font-medium text-slate-300 bg-slate-900/70 px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1">
                    <Eye className="w-3 h-3 text-pink-400" />
                    <span>{card.viewsCount.toLocaleString()} views</span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{card.publishedAt || card.createdAt}</span>
                      <span>•</span>
                      <span className="text-pink-400 font-medium">By {card.author}</span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-1 mb-1">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Interactive card footer actions */}
                  <div className="pt-4 mt-3 border-t border-slate-700/60 flex items-center justify-between">
                    <button
                      onClick={() => onPreviewNews(card)}
                      className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-pink-400" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => onEditNews(card)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3" data-testid="news-kpi-metrics">
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Total News</span>
          <span className="text-xl font-bold text-white mt-1">{metrics.totalNews}</span>
          <span className="text-[10px] text-pink-400 mt-1">Articles tracked</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Published</span>
          <span className="text-xl font-bold text-emerald-400 mt-1">{metrics.publishedNews}</span>
          <span className="text-[10px] text-emerald-400/80 mt-1">Live in app</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Drafts</span>
          <span className="text-xl font-bold text-purple-400 mt-1">{metrics.draftNews}</span>
          <span className="text-[10px] text-purple-400/80 mt-1">In review</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Scheduled</span>
          <span className="text-xl font-bold text-indigo-400 mt-1">{metrics.scheduledNews}</span>
          <span className="text-[10px] text-indigo-400/80 mt-1">Queued launch</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Languages</span>
          <span className="text-xl font-bold text-cyan-400 mt-1">{metrics.totalLanguages}</span>
          <span className="text-[10px] text-cyan-400/80 mt-1">{metrics.activeLanguages} Active</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Localization</span>
          <span className="text-xl font-bold text-amber-400 mt-1">
            {metrics.translationOverallPercentage}%
          </span>
          <span className="text-[10px] text-amber-400/80 mt-1">Completion rate</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Push Campaigns</span>
          <span className="text-xl font-bold text-pink-400 mt-1">{metrics.totalCampaigns}</span>
          <span className="text-[10px] text-pink-400/80 mt-1">{metrics.scheduledCampaigns} Queued</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Push Reach</span>
          <span className="text-xl font-bold text-white mt-1">
            {(metrics.totalRecipients / 1000000).toFixed(1)}M
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Total deliveries</span>
        </div>
      </div>

      {/* Quick Action Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* News Section Quick Card */}
        <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
                <Newspaper className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">News Operations</h3>
            </div>
            <span className="text-xs font-semibold text-pink-400">{articles.length} Items</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Create rich articles with thumbnail imagery, multi-category tags, and instant audience preview.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => onNavigateTab('news_management')}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-700/80 hover:bg-slate-700 transition-colors"
            >
              Manage Articles
            </button>
            <button
              onClick={() => onNavigateTab('news_categories')}
              className="py-2 px-3 rounded-xl text-xs font-semibold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 transition-colors"
            >
              Categories
            </button>
          </div>
        </div>

        {/* Localization Quick Card */}
        <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Globe2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Global Languages</h3>
            </div>
            <span className="text-xs font-semibold text-cyan-400">8 Supported</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Localize app strings in Urdu, Arabic, Turkish, Indonesian, Spanish, Hindi, and Bengali.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => onNavigateTab('languages')}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-700/80 hover:bg-slate-700 transition-colors"
            >
              Language Packs
            </button>
            <button
              onClick={() => onNavigateTab('translations')}
              className="py-2 px-3 rounded-xl text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
            >
              Translations
            </button>
          </div>
        </div>

        {/* Push Notifications Quick Card */}
        <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Push Marketing</h3>
            </div>
            <span className="text-xs font-semibold text-purple-400">16 Campaigns</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dispatch announcements to All Users, Hosts, Agency Members, or Coin Sellers with lockscreen preview.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => onNavigateTab('push_campaigns')}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 bg-slate-700/80 hover:bg-slate-700 transition-colors"
            >
              Campaigns
            </button>
            <button
              onClick={onCreateCampaign}
              className="py-2 px-3 rounded-xl text-xs font-semibold text-purple-300 bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
            >
              New Push
            </button>
          </div>
        </div>
      </div>

      {/* Two Column: Recent Campaigns & Recent Admin Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Push Campaigns */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-pink-400" />
              Recent Push Campaigns
            </h3>
            <button
              onClick={() => onNavigateTab('push_campaigns')}
              className="text-xs text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1"
            >
              <span>All ({campaigns.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {campaigns.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 hover:border-slate-600 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0 text-pink-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{c.title}</h4>
                    <p className="text-[11px] text-slate-400 truncate">
                      {c.audienceSummary} • {c.scheduledAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      c.status === 'Sent Demo'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : c.status === 'Scheduled'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {c.status}
                  </span>
                  <button
                    onClick={() => onPreviewCampaign(c)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Preview banner"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Activity History */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Admin Activity
            </h3>
            <button
              onClick={() => onNavigateTab('admin_activity')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>Full Audit ({activities.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activities.slice(0, 4).map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400 text-xs font-bold mt-0.5">
                  {act.adminName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">{act.adminName}</span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{act.description}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-cyan-400 border border-slate-700">
                      {act.activityType}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{act.relatedRecordId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
