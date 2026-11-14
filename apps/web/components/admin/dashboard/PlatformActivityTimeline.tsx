import React, { useState, useMemo } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
  Users,
  UserCheck,
  Radio,
  ShieldAlert,
  Shield,
  Coins,
  Building2,
  Store,
  CreditCard,
  Newspaper,
  Bell,
} from 'lucide-react';
import { PlatformActivityRecord, ModuleCategoryKey } from './dashboardTypes';

interface PlatformActivityTimelineProps {
  activities: PlatformActivityRecord[];
  onNavigateModule: (section: string) => void;
}

export const PlatformActivityTimeline: React.FC<PlatformActivityTimelineProps> = ({
  activities,
  onNavigateModule,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<ModuleCategoryKey>('all');

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch =
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.relatedRecordId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesModule =
        selectedModule === 'all' || act.module.toLowerCase() === selectedModule;

      return matchesSearch && matchesModule;
    });
  }, [activities, searchQuery, selectedModule]);

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'Users':
        return <Users className="w-3.5 h-3.5 text-blue-400" />;
      case 'Hosts':
        return <UserCheck className="w-3.5 h-3.5 text-purple-400" />;
      case 'Live':
        return <Radio className="w-3.5 h-3.5 text-pink-400" />;
      case 'Reports':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case 'Safety':
        return <Shield className="w-3.5 h-3.5 text-rose-400" />;
      case 'Economy':
        return <Coins className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Agencies':
        return <Building2 className="w-3.5 h-3.5 text-pink-400" />;
      case 'Sellers':
        return <Store className="w-3.5 h-3.5 text-purple-400" />;
      case 'Payouts':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
      case 'News':
        return <Newspaper className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Push':
        return <Bell className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSeverityBadge = (sev: PlatformActivityRecord['severity']) => {
    switch (sev) {
      case 'alert':
        return (
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
        );
      case 'warning':
        return (
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
        );
      case 'success':
        return (
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        );
      default:
        return <span className="w-2 h-2 rounded-full bg-blue-400" />;
    }
  };

  const mapModuleToNavSection = (mod: string): string => {
    switch (mod) {
      case 'Users':
        return 'users';
      case 'Hosts':
        return 'hosts';
      case 'Live':
        return 'live_monitor';
      case 'Reports':
        return 'reports';
      case 'Safety':
        return 'safety';
      case 'Economy':
        return 'economy';
      case 'Agencies':
      case 'Sellers':
      case 'Payouts':
        return 'agency';
      case 'News':
      case 'Push':
        return 'news';
      default:
        return 'dashboard';
    }
  };

  return (
    <div className="space-y-4" data-testid="platform-activity-timeline">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-[#1b0a33]/80 border border-purple-500/20 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Central Platform Activity Timeline</h3>
            <p className="text-[11px] text-slate-400">
              Traceable cross-module system events and real-time operational feeds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity or record ID..."
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-purple-500/30 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-pink-500 w-44 sm:w-56"
            />
          </div>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value as ModuleCategoryKey)}
            className="px-2.5 py-1.5 bg-slate-900 border border-purple-500/30 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
          >
            <option value="all">All Modules</option>
            <option value="users">Users</option>
            <option value="hosts">Hosts</option>
            <option value="live">Live</option>
            <option value="reports">Reports</option>
            <option value="safety">Safety</option>
            <option value="economy">Economy</option>
            <option value="agencies">Agencies</option>
            <option value="sellers">Sellers</option>
            <option value="payouts">Payouts</option>
            <option value="news">News</option>
            <option value="push">Push</option>
          </select>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-2.5">
        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-purple-500/20">
            No platform events match your search query.
          </div>
        ) : (
          filteredActivities.map((act) => (
            <div
              key={act.id}
              className="group p-3.5 rounded-xl bg-gradient-to-r from-[#17082e] to-[#120726] border border-purple-500/20 hover:border-pink-500/40 transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                  {getModuleIcon(act.module)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(act.severity)}
                    <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                      {act.title}
                    </h4>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                      {act.module}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{act.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-500 block font-mono">{act.relatedRecordId}</span>
                  <span className="text-[11px] text-slate-400">{act.timestamp}</span>
                </div>

                <button
                  onClick={() => onNavigateModule(mapModuleToNavSection(act.module))}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 transition-all flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
