'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  createInitialLiveSessions,
  createInitialSessionHistory,
  INITIAL_LIVE_METRICS,
} from './mockLiveMonitorData';
import {
  LiveActivityEvent,
  LiveMonitorMetrics,
  LiveMonitorSubView,
  LiveSessionCategory,
  LiveSessionRecord,
  LiveSessionStatus,
} from './liveMonitorTypes';
import { LiveMonitorDashboard } from './LiveMonitorDashboard';
import { ActiveLiveSessionsView } from './ActiveLiveSessionsView';
import { LiveSessionDetailsView } from './LiveSessionDetailsView';
import { LiveSessionHistoryView } from './LiveSessionHistoryView';
import { LiveStreamPreviewModal } from './LiveStreamPreviewModal';

interface LiveMonitorModuleProps {
  onLogActivity?: (action: string, details: string, category: any) => void;
  onNavigateToHostAdmin?: (hostId: string) => void;
}

export const LiveMonitorModule: React.FC<LiveMonitorModuleProps> = ({
  onLogActivity,
  onNavigateToHostAdmin,
}) => {
  // Core Local State
  const [sessions, setSessions] = useState<LiveSessionRecord[]>(createInitialLiveSessions());
  const [historyRecords] = useState(createInitialSessionHistory());
  const [subView, setSubView] = useState<LiveMonitorSubView>('dashboard');
  const [selectedSession, setSelectedSession] = useState<LiveSessionRecord | null>(null);
  const [dashboardCategory, setDashboardCategory] = useState<LiveSessionCategory>('All');
  const [dashboardSearch, setDashboardSearch] = useState<string>('');

  // Preview Modal State
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    session: LiveSessionRecord | null;
  }>({
    isOpen: false,
    session: null,
  });

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3500);
  }, []);

  // Compute Live Metrics dynamically based on current sessions state
  const metrics: LiveMonitorMetrics = useMemo(() => {
    let activeSessionsCount = 0;
    let totalViewersCount = 0;
    let partyRoomsCount = 0;
    let privateSessionsCount = 0;

    sessions.forEach((s) => {
      if (s.status === 'Live' || s.status === 'Ending' || s.status === 'Interrupted') {
        activeSessionsCount++;
        totalViewersCount += s.currentViewers;
        if (s.sessionType === 'Party Room') partyRoomsCount++;
        if (s.sessionType === 'Private') privateSessionsCount++;
      }
    });

    return {
      totalActiveSessions: INITIAL_LIVE_METRICS.totalActiveSessions,
      totalLiveHosts: INITIAL_LIVE_METRICS.totalLiveHosts,
      totalViewers: INITIAL_LIVE_METRICS.totalViewers,
      activePartyRooms: partyRoomsCount > 0 ? partyRoomsCount : INITIAL_LIVE_METRICS.activePartyRooms,
      privateSessionsCount: privateSessionsCount > 0 ? privateSessionsCount : INITIAL_LIVE_METRICS.privateSessionsCount,
      peakConcurrentViewersToday: INITIAL_LIVE_METRICS.peakConcurrentViewersToday,
      averageSessionDuration: INITIAL_LIVE_METRICS.averageSessionDuration,
    };
  }, [sessions]);

  // Aggregate recent activities from all sessions
  const recentActivities: LiveActivityEvent[] = useMemo(() => {
    const list: LiveActivityEvent[] = [];
    sessions.forEach((s) => {
      s.sessionActivities.forEach((act) => list.push(act));
    });

    if (list.length === 0) {
      list.push({
        id: 'DEF-01',
        sessionId: 'LIV-88201',
        hostId: 'H3007101',
        hostUsername: 'Host_Lina',
        eventType: 'session_started',
        title: 'Broadcast Active',
        description: 'Host_Lina broadcasting in Room #88201',
        timestamp: 'Just now',
        highlightColor: '#FF0F7B',
      });
    }

    return list.slice(0, 6);
  }, [sessions]);

  // Filtered sessions for dashboard
  const displayedDashboardSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (dashboardCategory !== 'All' && s.category !== dashboardCategory) return false;
      if (dashboardSearch.trim()) {
        const q = dashboardSearch.toLowerCase().trim();
        const inUser = s.hostUsername.toLowerCase().includes(q);
        const inRoom = s.roomNumber.includes(q);
        const inTitle = s.sessionTitle.toLowerCase().includes(q);
        if (!inUser && !inRoom && !inTitle) return false;
      }
      return true;
    });
  }, [sessions, dashboardCategory, dashboardSearch]);

  // Handlers
  const handleOpenPreview = (session: LiveSessionRecord) => {
    setPreviewModal({
      isOpen: true,
      session,
    });
  };

  const handleClosePreview = () => {
    setPreviewModal({
      isOpen: false,
      session: null,
    });
  };

  const handleViewSessionDetails = (session: LiveSessionRecord) => {
    setSelectedSession(session);
    setSubView('details');
  };

  const handleUpdateDemoStatus = (sessionId: string, nextStatus: LiveSessionStatus) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const newActivity: LiveActivityEvent = {
            id: `ACT-${Date.now()}`,
            sessionId,
            hostId: s.hostId,
            hostUsername: s.hostUsername,
            eventType: 'status_changed',
            title: `Status Changed: ${nextStatus}`,
            description: `Session status modified to ${nextStatus} via Admin Live Monitor`,
            timestamp: 'Just now',
            highlightColor: nextStatus === 'Live' ? '#10B981' : nextStatus === 'Ending' ? '#F59E0B' : '#EF4444',
          };

          const updated: LiveSessionRecord = {
            ...s,
            status: nextStatus,
            sessionActivities: [newActivity, ...s.sessionActivities],
          };

          if (selectedSession?.id === sessionId) {
            setSelectedSession(updated);
          }
          return updated;
        }
        return s;
      })
    );

    onLogActivity?.(
      `Live Session Status Updated (${sessionId})`,
      `Changed standing to ${nextStatus}.`,
      'security'
    );
    showToast(`Session ${sessionId} status updated to ${nextStatus}.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="live-monitor-module">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-md p-4 rounded-2xl bg-[#160A2D] border border-pink-500/50 text-white shadow-[0_0_25px_rgba(255,15,123,0.4)] flex items-center gap-3 animate-fadeIn">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-xs font-semibold leading-snug">{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto text-zinc-400 hover:text-white p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Sub-view Switcher Bar */}
      {subView !== 'details' && (
        <div className="flex items-center justify-between gap-3 border-b border-purple-500/20 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubView('dashboard')}
              data-testid="subview-dashboard-btn"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                subView === 'dashboard'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_10px_rgba(255,15,123,0.2)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monitor Overview
            </button>
            <button
              onClick={() => setSubView('active_sessions')}
              data-testid="subview-active-sessions-btn"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                subView === 'active_sessions'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_10px_rgba(255,15,123,0.2)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Active Streams Directory ({sessions.length})
            </button>
            <button
              onClick={() => setSubView('history')}
              data-testid="subview-history-btn"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                subView === 'history'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_10px_rgba(255,15,123,0.2)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Archived Session History
            </button>
          </div>
        </div>
      )}

      {/* Main Sub-view content */}
      {subView === 'dashboard' && (
        <LiveMonitorDashboard
          metrics={metrics}
          sessions={displayedDashboardSessions}
          recentActivities={recentActivities}
          selectedCategory={dashboardCategory}
          onSelectCategory={setDashboardCategory}
          searchQuery={dashboardSearch}
          onSearchChange={setDashboardSearch}
          onNavigateToActiveSessions={() => setSubView('active_sessions')}
          onNavigateToHistory={() => setSubView('history')}
          onPreviewSession={handleOpenPreview}
          onViewSessionDetails={handleViewSessionDetails}
        />
      )}

      {subView === 'active_sessions' && (
        <ActiveLiveSessionsView
          sessions={sessions}
          initialCategory={dashboardCategory}
          onPreviewSession={handleOpenPreview}
          onViewSessionDetails={handleViewSessionDetails}
          onBackToDashboard={() => setSubView('dashboard')}
        />
      )}

      {subView === 'details' && selectedSession && (
        <LiveSessionDetailsView
          session={selectedSession}
          onBack={() => setSubView('active_sessions')}
          onOpenPreview={handleOpenPreview}
          onUpdateDemoStatus={handleUpdateDemoStatus}
          onViewHostProfile={onNavigateToHostAdmin}
        />
      )}

      {subView === 'history' && (
        <LiveSessionHistoryView
          historyRecords={historyRecords}
          onBackToDashboard={() => setSubView('dashboard')}
        />
      )}

      {/* Live Stream Preview Modal */}
      <LiveStreamPreviewModal
        isOpen={previewModal.isOpen}
        session={previewModal.session}
        onClose={handleClosePreview}
        onOpenSessionDetails={handleViewSessionDetails}
      />
    </div>
  );
};
