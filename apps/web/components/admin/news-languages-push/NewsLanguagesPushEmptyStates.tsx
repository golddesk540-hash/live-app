import React from 'react';
import {
  Newspaper,
  Layers,
  Globe,
  Languages,
  CheckCircle2,
  Bell,
  Clock,
  FileCode,
  Search,
  AlertCircle,
} from 'lucide-react';
import { NewsLanguagesPushEmptyKind } from './newsLanguagesPushTypes';

interface NewsLanguagesPushEmptyStateProps {
  kind: NewsLanguagesPushEmptyKind;
  onResetFilters?: () => void;
  onAction?: () => void;
  customMessage?: string;
}

export const NewsLanguagesPushEmptyStates: React.FC<NewsLanguagesPushEmptyStateProps> = ({
  kind,
  onResetFilters,
  onAction,
  customMessage,
}) => {
  const configs: Record<
    NewsLanguagesPushEmptyKind,
    {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      desc: string;
      color: string;
      actionText?: string;
    }
  > = {
    no_news: {
      icon: Newspaper,
      title: 'No News Articles Found',
      desc: 'There are no published, draft, or scheduled news articles matching this view.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      actionText: 'Clear News Filters',
    },
    no_news_categories: {
      icon: Layers,
      title: 'No News Categories',
      desc: 'No taxonomy categories configured for news articles.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      actionText: 'View All Categories',
    },
    no_languages: {
      icon: Globe,
      title: 'No Languages Available',
      desc: 'No language localization packs match the current criteria.',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      actionText: 'Reset Languages',
    },
    no_translations: {
      icon: Languages,
      title: 'No Translation Strings Found',
      desc: 'No string dictionary keys match your active search or filter selection.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      actionText: 'Clear Translation Filters',
    },
    no_missing_translations: {
      icon: CheckCircle2,
      title: 'No Missing Translations',
      desc: 'All dictionary keys are 100% translated for this language pack.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      actionText: 'View All Strings',
    },
    no_campaigns: {
      icon: Bell,
      title: 'No Push Campaigns Found',
      desc: 'There are no notification campaigns registered under this filter.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      actionText: 'Clear Campaign Filters',
    },
    no_campaign_history: {
      icon: Clock,
      title: 'No Campaign History',
      desc: 'No dispatched or past notification broadcast logs recorded.',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      actionText: 'View All History',
    },
    no_templates: {
      icon: FileCode,
      title: 'No Notification Templates',
      desc: 'There are no reusable push templates matching your selection.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      actionText: 'Reset Templates',
    },
    no_search_results: {
      icon: Search,
      title: 'No Matching Results',
      desc: 'No items match your active search terms or selected filters.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      actionText: 'Clear Search & Filters',
    },
  };

  const current = configs[kind] || {
    icon: AlertCircle,
    title: 'No Records Found',
    desc: 'No data available for display.',
    color: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
    actionText: 'Reset',
  };

  const Icon = current.icon;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#130728]/70 border border-purple-500/20 rounded-2xl my-6 backdrop-blur-md">
      <div className={`p-4 rounded-2xl border mb-4 shadow-lg ${current.color}`}>
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{current.title}</h3>
      <p className="text-purple-300/80 max-w-md text-sm mb-6 leading-relaxed">
        {customMessage || current.desc}
      </p>
      {(onAction || onResetFilters) && current.actionText && (
        <button
          onClick={onAction || onResetFilters}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium text-sm hover:from-pink-600 hover:to-purple-700 transition shadow-lg shadow-pink-500/20 cursor-pointer"
        >
          {current.actionText}
        </button>
      )}
    </div>
  );
};
