import React from 'react';
import {
  X,
  Building2,
  Users,
  Calendar,
  Mail,
  Phone,
  Globe,
  Radio,
  Clock,
  Shield,
  Edit3,
} from 'lucide-react';
import { AgencyRecord } from './agencySellerPayoutTypes';

interface AgencyDetailsModalProps {
  agency: AgencyRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEditStatus: (agency: AgencyRecord) => void;
}

export const AgencyDetailsModal: React.FC<AgencyDetailsModalProps> = ({
  agency,
  isOpen,
  onClose,
  onEditStatus,
}) => {
  if (!isOpen || !agency) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#17082e] border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-950/60 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-purple-500/20 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={agency.logo}
              alt={agency.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-pink-500/40 shadow-lg shadow-pink-500/20"
            />
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="text-xl font-bold text-white">{agency.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    agency.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : agency.status === 'Pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : agency.status === 'Suspended'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}
                >
                  {agency.status}
                </span>
              </div>
              <p className="text-xs text-purple-300 flex items-center gap-2">
                <span className="font-mono bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/20">
                  {agency.id}
                </span>
                <span>• Registered {agency.registeredAt}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditStatus(agency)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-xs font-medium text-purple-200 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-pink-400" />
              Change Status
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-purple-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description & Overview */}
        <div className="mb-6 p-4 rounded-xl bg-purple-950/30 border border-purple-500/20">
          <p className="text-xs text-purple-200 leading-relaxed mb-3">{agency.description}</p>
          <div className="flex items-center gap-2 text-xs text-purple-300">
            <Globe className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Region: {agency.country}</span>
            <span className="mx-2">•</span>
            <span>Commission Tier: <strong className="text-pink-400 font-bold">{agency.commissionRate}%</strong></span>
          </div>
        </div>

        {/* Host Counts KPI Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20 text-center">
            <p className="text-xs text-purple-400 mb-1">Total Hosts</p>
            <p className="text-xl font-bold text-white">{agency.totalHosts}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 text-center">
            <p className="text-xs text-emerald-400 mb-1">Active Hosts</p>
            <p className="text-xl font-bold text-emerald-300">{agency.activeHosts}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/20 text-center">
            <p className="text-xs text-amber-400 mb-1">Pending Hosts</p>
            <p className="text-xl font-bold text-amber-300">{agency.pendingHosts}</p>
          </div>
        </div>

        {/* Owner Information */}
        <div className="mb-6 p-4 rounded-xl bg-black/40 border border-purple-500/20">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-400" />
            Agency Owner / Authorized Representative
          </h4>
          <div className="flex items-center gap-3 mb-3">
            <img
              src={agency.ownerAvatar}
              alt={agency.owner}
              className="w-10 h-10 rounded-full object-cover border border-purple-500/30"
            />
            <div>
              <p className="text-sm font-semibold text-white">{agency.owner}</p>
              <p className="text-xs text-purple-300">@{agency.ownerUsername}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-purple-300/90 pt-2 border-t border-purple-500/10">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              <span>{agency.ownerEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-purple-400" />
              <span>{agency.ownerPhone}</span>
            </div>
          </div>
        </div>

        {/* Related Host Records */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-pink-400" />
              Affiliated Hosts Roster ({agency.hosts.length})
            </h4>
          </div>
          {agency.hosts.length === 0 ? (
            <p className="text-xs text-purple-400/80 italic p-3 bg-black/30 rounded-xl border border-purple-500/10">
              No individual host records loaded in current view.
            </p>
          ) : (
            <div className="space-y-2">
              {agency.hosts.map((host) => (
                <div
                  key={host.hostId}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-purple-500/20"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={host.avatar}
                      alt={host.name}
                      className="w-9 h-9 rounded-full object-cover border border-purple-500/30"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{host.name}</p>
                      <p className="text-[11px] text-purple-300">
                        @{host.username} • {host.hostId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <p className="text-white font-medium">{host.monthlyPoints.toLocaleString()} pts</p>
                      <p className="text-[10px] text-purple-400">Monthly Est.</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        host.liveStatus === 'online'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {host.liveStatus === 'online' ? 'LIVE NOW' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agency History & Review Notes */}
        <div className="p-4 rounded-xl bg-black/30 border border-purple-500/20">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-400" />
            Compliance Notes & History
          </h4>
          <p className="text-xs text-purple-200/90 leading-relaxed mb-3">
            {agency.reviewNotes || 'No special review notes recorded for this agency.'}
          </p>
          {agency.history && agency.history.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-purple-500/10">
              {agency.history.map((ev) => (
                <div key={ev.id} className="text-[11px] text-purple-300 flex items-center justify-between">
                  <span>
                    <strong className="text-white">{ev.title}</strong> — {ev.description}
                  </span>
                  <span className="text-purple-400 text-[10px]">{ev.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-5 border-t border-purple-500/20 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 font-medium text-xs transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
