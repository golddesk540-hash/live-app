'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  LayoutDashboard,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { AgeRelatedQueueView } from './AgeRelatedQueueView';
import { ChildSafetyDashboardView } from './ChildSafetyDashboardView';
import { ChildSafetyReviewModal } from './ChildSafetyReviewModal';
import {
  calculateSafetyMetrics,
  createInitialSafetyAlerts,
  createInitialSafetyCases,
} from './mockChildSafetyData';
import { SafetyAlertsListView } from './SafetyAlertsListView';
import { SafetyCaseDetailsView } from './SafetyCaseDetailsView';
import { SafetyCaseManagementView } from './SafetyCaseManagementView';
import { SafetyGuidelinesView } from './SafetyGuidelinesView';
import {
  SafetyAlertRecord,
  SafetyCaseRecord,
  SafetyCaseStatus,
  SafetyFilters,
  SafetyNavTab,
  SafetyPriority,
} from './childSafetyTypes';

interface ChildSafetyOperationsModuleProps {
  onNavigateToUser?: (userId: string) => void;
  onNavigateToHost?: (hostId: string) => void;
}

export const ChildSafetyOperationsModule: React.FC<ChildSafetyOperationsModuleProps> = ({
  onNavigateToUser,
  onNavigateToHost,
}) => {
  const [cases, setCases] = useState<SafetyCaseRecord[]>(() => createInitialSafetyCases());
  const [alerts, setAlerts] = useState<SafetyAlertRecord[]>(() => createInitialSafetyAlerts());
  const [activeTab, setActiveTab] = useState<SafetyNavTab>('dashboard');
  const [selectedCase, setSelectedCase] = useState<SafetyCaseRecord | null>(null);

  // Review Modal state
  const [reviewingCase, setReviewingCase] = useState<SafetyCaseRecord | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  // Toast alert
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Case Filters State
  const [filters, setFilters] = useState<SafetyFilters>({
    searchQuery: '',
    status: 'All',
    category: 'All',
    priority: 'All',
    assignedReviewer: 'All',
    isEscalatedOnly: false,
    sortBy: 'newest',
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const metrics = calculateSafetyMetrics(cases, alerts);

  // Handlers
  const handleTabChange = (tab: SafetyNavTab) => {
    setActiveTab(tab);
    setSelectedCase(null);
    if (tab === 'high_priority') {
      setFilters((prev) => ({ ...prev, priority: 'Urgent', isEscalatedOnly: false, status: 'All' }));
    } else if (tab === 'escalations') {
      setFilters((prev) => ({ ...prev, isEscalatedOnly: true, priority: 'All', status: 'All' }));
    } else if (tab === 'cases') {
      setFilters((prev) => ({ ...prev, isEscalatedOnly: false, priority: 'All', status: 'All' }));
    }
  };

  const handleSelectCase = (safetyCase: SafetyCaseRecord) => {
    const current = cases.find((c) => c.id === safetyCase.id) || safetyCase;
    setSelectedCase(current);
  };

  const handleSelectCaseById = (caseId: string) => {
    const found = cases.find((c) => c.id === caseId);
    if (found) {
      setSelectedCase(found);
    } else {
      setActiveTab('cases');
      setFilters((prev) => ({ ...prev, searchQuery: caseId }));
    }
  };

  const handleOpenReviewModal = (safetyCase: SafetyCaseRecord) => {
    setReviewingCase(safetyCase);
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = (
    caseId: string,
    newStatus: SafetyCaseStatus,
    newPriority: SafetyPriority,
    reviewerNotes: string,
    isEscalated: boolean,
    escalationReason?: string
  ) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const newEvent = {
          id: `ACT-${Date.now()}`,
          title: `Status: ${newStatus}`,
          adminName: 'Safety Lead Sarah',
          timestamp: 'Just now',
          description: `Updated disposition to ${newStatus} (${newPriority} priority).`,
          caseStatus: newStatus,
        };
        const updated: SafetyCaseRecord = {
          ...c,
          status: newStatus,
          priority: newPriority,
          reviewerNotes,
          isEscalated,
          escalationReason: escalationReason || c.escalationReason,
          escalatedAt: isEscalated ? (c.escalatedAt || 'Just now') : undefined,
          lastUpdatedRelative: 'Just now',
          timeline: [newEvent, ...c.timeline],
        };
        if (selectedCase?.id === caseId) {
          setSelectedCase(updated);
        }
        return updated;
      })
    );
    showToast(`Case ${caseId} updated: ${newStatus} (${newPriority}).`);
  };

  const handleChangePriority = (caseId: string, priority: SafetyPriority) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const updated = {
          ...c,
          priority,
          lastUpdatedRelative: 'Just now',
          timeline: [
            {
              id: `ACT-${Date.now()}`,
              title: `Priority changed to ${priority}`,
              adminName: 'Safety Lead Sarah',
              timestamp: 'Just now',
              description: `Audit priority set to ${priority}.`,
            },
            ...c.timeline,
          ],
        };
        if (selectedCase?.id === caseId) setSelectedCase(updated);
        return updated;
      })
    );
    showToast(`Priority for ${caseId} updated to ${priority}.`);
  };

  const handleSaveNotes = (caseId: string, notes: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const updated = { ...c, reviewerNotes: notes, lastUpdatedRelative: 'Just now' };
        if (selectedCase?.id === caseId) setSelectedCase(updated);
        return updated;
      })
    );
    showToast(`Notes for ${caseId} saved.`);
  };

  const handleRefresh = () => {
    setCases(createInitialSafetyCases());
    setAlerts(createInitialSafetyAlerts());
    showToast('Safety telemetry reloaded with fresh case records.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
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
              activeTab === 'dashboard' && !selectedCase
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_15px_rgba(255,15,123,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleTabChange('alerts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'alerts' && !selectedCase
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Alerts ({alerts.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('age_queue')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'age_queue' && !selectedCase
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Age Queue ({metrics.ageReviewsPending})</span>
          </button>

          <button
            onClick={() => handleTabChange('cases')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cases' && !selectedCase
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Case Management ({metrics.totalCases})</span>
          </button>

          <button
            onClick={() => handleTabChange('high_priority')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'high_priority' && !selectedCase
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>High Priority ({metrics.highPriorityCases})</span>
          </button>

          <button
            onClick={() => handleTabChange('escalations')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'escalations' && !selectedCase
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Escalations ({metrics.escalatedCases})</span>
          </button>

          <button
            onClick={() => handleTabChange('guidelines')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'guidelines' && !selectedCase
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_15px_rgba(255,15,123,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Guidelines</span>
          </button>
        </div>

        {selectedCase && (
          <button
            onClick={() => setSelectedCase(null)}
            className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Safety Queue</span>
          </button>
        )}
      </div>

      {/* View Routing */}
      {selectedCase ? (
        <SafetyCaseDetailsView
          safetyCase={selectedCase}
          onBack={() => setSelectedCase(null)}
          onOpenReviewModal={handleOpenReviewModal}
          onChangePriority={handleChangePriority}
          onSaveNotes={handleSaveNotes}
          onNavigateToUser={onNavigateToUser}
          onNavigateToHost={onNavigateToHost}
        />
      ) : activeTab === 'dashboard' ? (
        <ChildSafetyDashboardView
          metrics={metrics}
          recentCases={cases}
          activeAlerts={alerts}
          onTabChange={handleTabChange}
          onSelectCase={handleSelectCase}
          onOpenReviewModal={handleOpenReviewModal}
          onRefresh={handleRefresh}
        />
      ) : activeTab === 'alerts' ? (
        <SafetyAlertsListView
          alerts={alerts}
          allCases={cases}
          onSelectCaseById={handleSelectCaseById}
          onRefresh={handleRefresh}
        />
      ) : activeTab === 'age_queue' ? (
        <AgeRelatedQueueView
          cases={cases}
          onSelectCase={handleSelectCase}
          onOpenReviewModal={handleOpenReviewModal}
          onRefresh={handleRefresh}
        />
      ) : activeTab === 'guidelines' ? (
        <SafetyGuidelinesView />
      ) : (
        <SafetyCaseManagementView
          cases={cases}
          filters={filters}
          onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
          onResetFilters={() =>
            setFilters({
              searchQuery: '',
              status: 'All',
              category: 'All',
              priority: 'All',
              assignedReviewer: 'All',
              isEscalatedOnly: false,
              sortBy: 'newest',
            })
          }
          onSelectCase={handleSelectCase}
          onOpenReviewModal={handleOpenReviewModal}
          onRefresh={handleRefresh}
        />
      )}

      {/* Review Modal */}
      <ChildSafetyReviewModal
        safetyCase={reviewingCase}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSaveReview={handleSaveReview}
      />
    </div>
  );
};
