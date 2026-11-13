'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Filter,
  Grid,
  History,
  Inbox,
  LayoutDashboard,
  Layers,
  List,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { AllReportsTableView } from './AllReportsTableView';
import { BulkActionModal } from './BulkActionModal';
import {
  calculateMetrics,
  createInitialReports,
  REPORT_CATEGORIES,
} from './mockReportQueueData';
import { ReportDashboardView } from './ReportDashboardView';
import { ReportDetailsView } from './ReportDetailsView';
import { ReportEvidencePreviewModal } from './ReportEvidencePreviewModal';
import {
  ReportCategoryKey,
  ReportFilters,
  ReportNavTab,
  ReportPriority,
  ReportRecord,
  ReportStatus,
} from './reportQueueTypes';
import { ReportReviewModal } from './ReportReviewModal';

interface ReportQueueModuleProps {
  onNavigateToUser?: (userId: string) => void;
  onNavigateToHost?: (hostId: string) => void;
}

export const ReportQueueModule: React.FC<ReportQueueModuleProps> = ({
  onNavigateToUser,
  onNavigateToHost,
}) => {
  // Local state initialized with 56 comprehensive records
  const [reports, setReports] = useState<ReportRecord[]>(() => createInitialReports());
  const [activeTab, setActiveTab] = useState<ReportNavTab>('dashboard');
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);

  // Review & Bulk Modals State
  const [reviewingReport, setReviewingReport] = useState<ReportRecord | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Filters State
  const [filters, setFilters] = useState<ReportFilters>({
    searchQuery: '',
    status: 'All',
    category: 'All',
    priority: 'All',
    accountType: 'All',
    sortBy: 'newest',
    dateRange: 'all',
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const metrics = calculateMetrics(reports);

  // Category counts
  const categoryCounts = REPORT_CATEGORIES.map((c) => ({
    ...c,
    reportCount: reports.filter((r) => r.category === c.key).length,
  }));

  // Handlers
  const handleTabChange = (tab: ReportNavTab) => {
    setActiveTab(tab);
    setSelectedReport(null);
    if (tab === 'pending') {
      setFilters((prev) => ({ ...prev, status: 'Pending' }));
    } else if (tab === 'review') {
      setFilters((prev) => ({ ...prev, status: 'Under Review' }));
    } else if (tab === 'resolved') {
      setFilters((prev) => ({ ...prev, status: 'Resolved' }));
    } else if (tab === 'rejected') {
      setFilters((prev) => ({ ...prev, status: 'Rejected' }));
    } else if (tab === 'all') {
      setFilters((prev) => ({ ...prev, status: 'All' }));
    }
  };

  const handleSelectCategory = (category: ReportCategoryKey) => {
    setFilters((prev) => ({ ...prev, category, status: 'All' }));
    setActiveTab('all');
    setSelectedReport(null);
  };

  const handleSelectReport = (report: ReportRecord) => {
    // Keep reference fresh from current state
    const current = reports.find((r) => r.id === report.id) || report;
    setSelectedReport(current);
  };

  const handleOpenReviewModal = (report: ReportRecord) => {
    setReviewingReport(report);
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = (
    reportId: string,
    newStatus: ReportStatus,
    newPriority: ReportPriority,
    adminNotes: string
  ) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        const newHistoryEvent = {
          id: `ACT-${Date.now()}`,
          title: `Status updated to ${newStatus}`,
          adminName: 'Admin Dave',
          timestamp: 'Just now',
          description: `Moderator set status to ${newStatus} with priority ${newPriority}. Notes updated.`,
          status: newStatus,
        };
        const updated = {
          ...r,
          status: newStatus,
          priority: newPriority,
          adminNotes,
          lastUpdatedAt: 'Just now',
          reviewHistory: [newHistoryEvent, ...r.reviewHistory],
        };
        if (selectedReport?.id === reportId) {
          setSelectedReport(updated);
        }
        return updated;
      })
    );
    showToast(`Report ${reportId} updated to ${newStatus} (${newPriority} priority).`);
  };

  const handleChangePriority = (reportId: string, newPriority: ReportPriority) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        const updated = {
          ...r,
          priority: newPriority,
          lastUpdatedAt: 'Just now',
          reviewHistory: [
            {
              id: `ACT-${Date.now()}`,
              title: `Priority updated to ${newPriority}`,
              adminName: 'Admin Dave',
              timestamp: 'Just now',
              description: `Triage priority changed to ${newPriority}.`,
            },
            ...r.reviewHistory,
          ],
        };
        if (selectedReport?.id === reportId) {
          setSelectedReport(updated);
        }
        return updated;
      })
    );
    showToast(`Priority for ${reportId} updated to ${newPriority}.`);
  };

  const handleSaveAdminNotes = (reportId: string, notes: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        const updated = { ...r, adminNotes: notes, lastUpdatedAt: 'Just now' };
        if (selectedReport?.id === reportId) {
          setSelectedReport(updated);
        }
        return updated;
      })
    );
    showToast(`Notes for ${reportId} saved successfully.`);
  };

  const handleApplyBulkAction = (targetStatus: ReportStatus, note: string) => {
    const count = selectedReportIds.length;
    setReports((prev) =>
      prev.map((r) => {
        if (!selectedReportIds.includes(r.id)) return r;
        return {
          ...r,
          status: targetStatus,
          adminNotes: note ? `${r.adminNotes} [Batch Note: ${note}]` : r.adminNotes,
          lastUpdatedAt: 'Just now',
          reviewHistory: [
            {
              id: `ACT-BULK-${Date.now()}-${r.id}`,
              title: `Bulk Action: ${targetStatus}`,
              adminName: 'Admin Dave',
              timestamp: 'Just now',
              description: note || `Batch updated to ${targetStatus}`,
              status: targetStatus,
            },
            ...r.reviewHistory,
          ],
        };
      })
    );
    setSelectedReportIds([]);
    showToast(`Batch update applied: ${count} reports marked as ${targetStatus}.`);
  };

  const handleToggleSelectReport = (id: string) => {
    setSelectedReportIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = (ids: string[]) => {
    setSelectedReportIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelection = () => {
    setSelectedReportIds([]);
  };

  const handleRefresh = () => {
    setReports(createInitialReports());
    setSelectedReportIds([]);
    showToast('Report queue reloaded with fresh telemetry.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#1A103C] border border-pink-500/40 text-white text-xs shadow-[0_0_25px_rgba(255,15,123,0.3)] animate-fadeIn">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-pink-400" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Module Subnav Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard' && !selectedReport
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_15px_rgba(255,15,123,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleTabChange('all')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all' && !selectedReport
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_15px_rgba(255,15,123,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>All Reports ({metrics.totalReports})</span>
          </button>

          <button
            onClick={() => handleTabChange('pending')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pending' && !selectedReport
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending ({metrics.pendingReports})</span>
          </button>

          <button
            onClick={() => handleTabChange('review')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'review' && !selectedReport
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Under Review ({metrics.underReviewReports})</span>
          </button>
        </div>

        {selectedReport && (
          <button
            onClick={() => setSelectedReport(null)}
            className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Queue</span>
          </button>
        )}
      </div>

      {/* Main View Router */}
      {selectedReport ? (
        <ReportDetailsView
          report={selectedReport}
          onBack={() => setSelectedReport(null)}
          onOpenReviewModal={handleOpenReviewModal}
          onChangePriority={handleChangePriority}
          onSaveAdminNotes={handleSaveAdminNotes}
          onNavigateToUser={onNavigateToUser}
          onNavigateToHost={onNavigateToHost}
        />
      ) : activeTab === 'dashboard' ? (
        <ReportDashboardView
          metrics={metrics}
          recentReports={reports}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSelectCategory={handleSelectCategory}
          onSelectReport={handleSelectReport}
          onOpenReviewModal={handleOpenReviewModal}
          onRefresh={handleRefresh}
        />
      ) : (
        <AllReportsTableView
          reports={reports}
          allReportsCount={metrics.totalReports}
          pendingCount={metrics.pendingReports}
          reviewCount={metrics.underReviewReports}
          resolvedCount={metrics.resolvedReports}
          rejectedCount={metrics.rejectedReports}
          filters={filters}
          onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
          onResetFilters={() =>
            setFilters({
              searchQuery: '',
              status: 'All',
              category: 'All',
              priority: 'All',
              accountType: 'All',
              sortBy: 'newest',
              dateRange: 'all',
            })
          }
          onSelectReport={handleSelectReport}
          onOpenReviewModal={handleOpenReviewModal}
          selectedReportIds={selectedReportIds}
          onToggleSelectReport={handleToggleSelectReport}
          onSelectAllVisible={handleSelectAllVisible}
          onClearSelection={handleClearSelection}
          onOpenBulkModal={() => setIsBulkModalOpen(true)}
        />
      )}

      {/* Modal 1: Review & Disposition Modal */}
      <ReportReviewModal
        report={reviewingReport}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSaveReview={handleSaveReview}
      />

      {/* Modal 2: Bulk Action Modal */}
      <BulkActionModal
        selectedCount={selectedReportIds.length}
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onApplyBulkAction={handleApplyBulkAction}
      />
    </div>
  );
};
