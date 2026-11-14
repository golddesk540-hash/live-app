import React, { useState, useMemo } from 'react';
import {
  Bell,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  Send,
  XCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { CampaignRecord, CampaignStatus, PushNotificationType } from './newsLanguagesPushTypes';
import { NewsLanguagesPushEmptyStates } from './NewsLanguagesPushEmptyStates';

interface NotificationCampaignsViewProps {
  campaigns: CampaignRecord[];
  onCreateCampaign: () => void;
  onEditCampaign: (campaign: CampaignRecord) => void;
  onPreviewCampaign: (campaign: CampaignRecord) => void;
  onCancelCampaign: (campaignId: string) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onDuplicateCampaign: (campaign: CampaignRecord) => void;
}

export const NotificationCampaignsView: React.FC<NotificationCampaignsViewProps> = ({
  campaigns,
  onCreateCampaign,
  onEditCampaign,
  onPreviewCampaign,
  onCancelCampaign,
  onDeleteCampaign,
  onDuplicateCampaign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((cmp) => {
      const matchesSearch =
        cmp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmp.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmp.audienceSummary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || cmp.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || cmp.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [campaigns, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage) || 1;
  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'Sent Demo':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Sent Demo
          </span>
        );
      case 'Scheduled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Scheduled
          </span>
        );
      case 'Draft':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Draft
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700 text-slate-300 border border-slate-600">
            Cancelled
          </span>
        );
      case 'Failed Demo':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Failed Demo
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" data-testid="notification-campaigns-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Push Notification Campaigns</h2>
          <p className="text-xs text-slate-400">
            Campaign queue, scheduled marketing blasts, and delivery performance ({campaigns.length} campaigns)
          </p>
        </div>
        <button
          onClick={onCreateCampaign}
          data-testid="create-campaign-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search campaigns by title, message, ID, or audience..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-pink-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Sent Demo">Sent Demo</option>
          <option value="Draft">Draft</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Failed Demo">Failed Demo</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
        >
          <option value="ALL">All Types</option>
          <option value="General Announcement">General Announcement</option>
          <option value="News Update">News Update</option>
          <option value="Event Notification">Event Notification</option>
          <option value="Promotional Notification">Promotional Notification</option>
          <option value="Important Notice">Important Notice</option>
        </select>

        {(statusFilter !== 'ALL' || typeFilter !== 'ALL' || searchQuery) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setTypeFilter('ALL');
            }}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Campaigns Table */}
      {filteredCampaigns.length === 0 ? (
        <NewsLanguagesPushEmptyStates
          kind={campaigns.length === 0 ? 'no_campaigns' : 'no_search_results'}
          onAction={onCreateCampaign}
        />
      ) : (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="campaigns-table">
              <thead>
                <tr className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                  <th className="py-3.5 px-4">Campaign</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Target Audience</th>
                  <th className="py-3.5 px-4">Schedule / Sent</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Performance</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-sm">
                {paginatedCampaigns.map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-slate-700/30 transition-colors group">
                    {/* Title & Message */}
                    <td className="py-3 px-4 max-w-xs md:max-w-sm">
                      <div className="font-semibold text-white group-hover:text-pink-400 transition-colors truncate">
                        {cmp.title}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{cmp.message}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{cmp.id}</div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-300">
                        {cmp.type}
                      </span>
                    </td>

                    {/* Audience */}
                    <td className="py-3 px-4 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{cmp.audienceSummary}</span>
                      </div>
                    </td>

                    {/* Schedule Date */}
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      <div>{cmp.scheduledAt}</div>
                      {cmp.sentAt && (
                        <div className="text-[10px] text-emerald-400/80">Sent: {cmp.sentAt}</div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(cmp.status)}</td>

                    {/* Performance Metrics */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {cmp.status === 'Sent Demo' ? (
                        <div className="text-xs">
                          <span className="font-bold text-white block">
                            {cmp.deliveredCount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            {cmp.openRatePercentage}% Open Rate
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Not triggered</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPreviewCampaign(cmp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                          title="Preview Notification Banner"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDuplicateCampaign(cmp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                          title="Duplicate Campaign"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditCampaign(cmp)}
                          className="p-1.5 rounded-lg text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 transition-colors"
                          title="Edit Campaign"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {cmp.status === 'Scheduled' && (
                          <button
                            onClick={() => onCancelCampaign(cmp.id)}
                            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                            title="Cancel Scheduled Push"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteCampaign(cmp.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/70 rounded-2xl text-xs">
          <span className="text-slate-400">
            Page <span className="font-bold text-white">{currentPage}</span> of{' '}
            <span className="font-bold text-white">{totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
