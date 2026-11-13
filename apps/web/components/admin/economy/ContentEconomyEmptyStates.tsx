import React from 'react';
import {
  Coins,
  Gift,
  Layers,
  Package,
  Sparkles,
  ShoppingBag,
  History,
  SearchX,
  PlusCircle,
  FolderTree,
} from 'lucide-react';

export type ContentEconomyEmptyKind =
  | 'no_content'
  | 'no_gifts'
  | 'no_packages'
  | 'no_virtual_items'
  | 'no_store_content'
  | 'no_categories'
  | 'no_activity'
  | 'no_search_results';

interface Props {
  type: ContentEconomyEmptyKind;
  onAction?: () => void;
  actionLabel?: string;
  searchTerm?: string;
}

export const ContentEconomyEmptyStates: React.FC<Props> = ({
  type,
  onAction,
  actionLabel,
  searchTerm,
}) => {
  const configs: Record<
    ContentEconomyEmptyKind,
    {
      icon: React.ComponentType<{ className?: string }>;
      title: string;
      desc: string;
      defaultBtn?: string;
      color: string;
    }
  > = {
    no_content: {
      icon: Layers,
      title: 'No Content Records Found',
      desc: 'There are currently no banners, events or category promotional items registered in this filter.',
      defaultBtn: 'Create Demo Content',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
    no_gifts: {
      icon: Gift,
      title: 'No Virtual Gifts Registered',
      desc: 'The virtual gift catalog has no matching gifts for the selected category or filter criteria.',
      defaultBtn: 'Add Sample Gift',
      color: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
    },
    no_packages: {
      icon: Package,
      title: 'No Coin Packages Available',
      desc: 'No coin recharge packages match the selected status or tier filtering configuration.',
      defaultBtn: 'Create Coin Tier',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
    no_virtual_items: {
      icon: Sparkles,
      title: 'No Virtual Items in Catalog',
      desc: 'No equippable profile frames, chat bubbles or entrance effects found.',
      defaultBtn: 'Add Virtual Asset',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    },
    no_store_content: {
      icon: ShoppingBag,
      title: 'Store Inventory Empty',
      desc: 'There are no active products listed in the virtual store catalog matching this view.',
      defaultBtn: 'Populate Store Items',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    },
    no_categories: {
      icon: FolderTree,
      title: 'No Content Categories Defined',
      desc: 'Platform discoverability sections have not yet been initialized or are inactive.',
      defaultBtn: 'New Category',
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    },
    no_activity: {
      icon: History,
      title: 'No Economy Activity Recorded',
      desc: 'Administrative events and price updates will be logged here in chronological sequence.',
      defaultBtn: 'Refresh Log Stream',
      color: 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10',
    },
    no_search_results: {
      icon: SearchX,
      title: 'No Matching Items Found',
      desc: searchTerm
        ? `No records match your search criteria "${searchTerm}". Try adjusting your keywords or clearing filters.`
        : 'No records match the active filter criteria. Clear filters to see all available items.',
      defaultBtn: 'Clear Search & Filters',
      color: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
    },
  };

  const c = configs[type];
  const Icon = c.icon;

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-[#120726]/60 border border-white/5 my-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-4 ${c.color}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-white mb-1.5">{c.title}</h4>
      <p className="text-xs text-gray-400 max-w-md leading-relaxed mb-5">{c.desc}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-pink-500/50 transition-all cursor-pointer active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5 text-pink-400" />
          <span>{actionLabel || c.defaultBtn}</span>
        </button>
      )}
    </div>
  );
};
