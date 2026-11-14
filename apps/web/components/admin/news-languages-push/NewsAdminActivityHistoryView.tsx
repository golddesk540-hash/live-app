import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  Languages,
  Bell,
  Newspaper,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import { NewsAdminActivityItem } from './newsLanguagesPushTypes';

interface NewsAdminActivityHistoryViewProps {
  activities: NewsAdminActivityItem[];
}

export const NewsAdminActivityHistoryView: React.FC<NewsAdminActivityHistoryViewProps> = ({
  activities,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch =
        act.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.relatedRecordId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'ALL' || act.activityType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [activities, searchQuery, typeFilter]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'News Created':
      case 'News Edited':
      case 'News Status Updated':
        return <Newspaper className="w-4 h-4 text-pink-400" />;
      case 'Category Updated':
        return <Tag className="w-4 h-4 text-amber-400" />;
      case 'Language Added':
      case 'Translation Updated':
        return <Languages className="w-4 h-4 text-cyan-400" />;
      case 'Campaign Created':
      case 'Campaign Scheduled':
        return <Bell className="w-4 h-4 text-purple-400" />;
      case 'Template Edited':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="news-admin-activity-view">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Admin Activity Audit Log</h2>
        <p className="text-xs text-slate-400">
          Traceable timeline of editorial changes, localization updates, and push dispatches
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by admin name, action description, or record ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-pink-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
        >
          <option value="ALL">All Actions</option>
          <option value="News Created">News Created</option>
          <option value="News Edited">News Edited</option>
          <option value="News Status Updated">News Status Updated</option>
          <option value="Category Updated">Category Updated</option>
          <option value="Language Added">Language Added</option>
          <option value="Translation Updated">Translation Updated</option>
          <option value="Campaign Created">Campaign Created</option>
          <option value="Campaign Scheduled">Campaign Scheduled</option>
          <option value="Template Edited">Template Edited</option>
        </select>

        {(typeFilter !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('ALL');
            }}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Activity Timeline List */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No activity matches the current search and filter criteria.
          </div>
        ) : (
          <div className="relative border-l border-slate-700 pl-6 space-y-6">
            {filteredActivities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Dot / Icon */}
                <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-pink-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-pink-400" />
                </div>

                <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{act.adminName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-pink-300 border border-slate-700 flex items-center gap-1">
                        {getActivityIcon(act.activityType)}
                        <span>{act.activityType}</span>
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{act.timestamp}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>

                  <div className="mt-2 text-[11px] text-slate-500 font-mono">
                    Target Reference: <span className="text-cyan-400">{act.relatedRecordId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
