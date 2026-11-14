import React from 'react';
import {
  Shield,
  Users,
  Radio,
  ShieldAlert,
  Lock,
  Coins,
  Building2,
  Newspaper,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { QUICK_NAV_ITEMS } from './mockDashboardData';
import { QuickNavModuleItem } from './dashboardTypes';

interface QuickNavigationGridProps {
  onNavigateModule?: (section: string) => void;
  onNavigateSection?: (section: string) => void;
}

export const QuickNavigationGrid: React.FC<QuickNavigationGridProps> = ({
  onNavigateModule,
  onNavigateSection,
}) => {
  const handleNav = (sec: string) => {
    if (onNavigateSection) onNavigateSection(sec);
    else if (onNavigateModule) onNavigateModule(sec);
  };
  const getIcon = (name: string) => {
    switch (name) {
      case 'Shield':
        return <Shield className="w-5 h-5 text-purple-400" />;
      case 'Users':
        return <Users className="w-5 h-5 text-blue-400" />;
      case 'Radio':
        return <Radio className="w-5 h-5 text-pink-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'Lock':
        return <Lock className="w-5 h-5 text-rose-400" />;
      case 'Coins':
        return <Coins className="w-5 h-5 text-emerald-400" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-pink-400" />;
      case 'Newspaper':
        return <Newspaper className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div className="space-y-4" data-testid="quick-navigation-grid">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            Phase 10 Operations Hub & Direct Navigation
          </h2>
          <p className="text-xs text-slate-400">
            Quickly jump into any specialized administration terminal across all 8 completed modules
          </p>
        </div>
        <span className="text-xs font-semibold text-pink-400">8 Modules Ready</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            onClick={() => handleNav(item.targetSection)}
            className="group p-5 rounded-2xl bg-gradient-to-b from-[#1b0a33] to-[#120726] border border-purple-500/20 hover:border-pink-500/50 hover:from-[#210c40] transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {getIcon(item.iconName)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700">
                    {item.moduleCode}
                  </span>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-purple-500/20 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[170px]">
                {item.statsSummary}
              </span>
              <div className="flex items-center gap-1 text-xs font-semibold text-pink-400 group-hover:text-pink-300 transition-colors">
                <span>Open</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
