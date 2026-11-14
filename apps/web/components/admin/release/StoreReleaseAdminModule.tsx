'use client';

import React, { useState } from 'react';
import {
  Rocket,
  Layers,
  Smartphone,
  Apple,
  Tag,
  ClipboardList,
  CheckCircle2,
  Bug,
  ShieldCheck,
  Eye,
  FileText,
  Play,
  Award,
  Search,
  Bell,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

import {
  ReleaseTabKey,
  AppVersionRecord,
  BuildRecord,
  TestCaseRecord,
  BugRecord,
  ChecklistRecord,
  ReadinessCategorySummary,
  DeviceTestRecord,
  SecurityCheckRecord,
  PrivacyCheckRecord,
  ReleaseNotesRecord,
  RehearsalStageRecord,
  ReleaseActivityRecord,
  TestResult
} from './releaseTypes';

import {
  INITIAL_APP_VERSIONS,
  INITIAL_BUILDS,
  INITIAL_TEST_CASES,
  INITIAL_BUGS,
  INITIAL_RELEASE_CHECKLIST,
  INITIAL_READINESS_CATEGORIES,
  INITIAL_DEVICE_TESTS,
  INITIAL_SECURITY_CHECKS,
  INITIAL_PRIVACY_CHECKS,
  INITIAL_RELEASE_NOTES,
  INITIAL_REHEARSAL_STAGES,
  INITIAL_RELEASE_ACTIVITIES
} from './mockReleaseData';

import { ReleaseDashboardView } from './ReleaseDashboardView';
import { LaunchReadinessView } from './LaunchReadinessView';
import { PlatformReleaseView } from './PlatformReleaseView';
import { AppVersionManagementView } from './AppVersionManagementView';
import { BuildInformationView } from './BuildInformationView';
import { ReleaseChecklistTab } from './ReleaseChecklistTab';
import { QualityAssuranceView } from './QualityAssuranceView';
import { DeviceTestingView } from './DeviceTestingView';
import { BugTrackingView } from './BugTrackingView';
import { SecurityPrivacyChecklistView } from './SecurityPrivacyChecklistView';
import { StoreListingPreviewView } from './StoreListingPreviewView';
import { ReleaseNotesManagementView } from './ReleaseNotesManagementView';
import { LaunchRehearsalView } from './LaunchRehearsalView';
import { FinalReleaseApprovalView } from './FinalReleaseApprovalView';

interface StoreReleaseAdminModuleProps {
  onNavigateSection?: (sectionId: string) => void;
}

export const StoreReleaseAdminModule: React.FC<StoreReleaseAdminModuleProps> = ({
  onNavigateSection
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ReleaseTabKey>('dashboard');

  // Local Reactive Store States
  const [versions, setVersions] = useState<AppVersionRecord[]>(INITIAL_APP_VERSIONS);
  const [builds, setBuilds] = useState<BuildRecord[]>(INITIAL_BUILDS);
  const [qaTests, setQaTests] = useState<TestCaseRecord[]>(INITIAL_TEST_CASES);
  const [bugs, setBugs] = useState<BugRecord[]>(INITIAL_BUGS);
  const [checklist, setChecklist] = useState<ChecklistRecord[]>(INITIAL_RELEASE_CHECKLIST);
  const [readinessSummaries, setReadinessSummaries] = useState<ReadinessCategorySummary[]>(INITIAL_READINESS_CATEGORIES);
  const [deviceTests, setDeviceTests] = useState<DeviceTestRecord[]>(INITIAL_DEVICE_TESTS);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheckRecord[]>(INITIAL_SECURITY_CHECKS);
  const [privacyChecks, setPrivacyChecks] = useState<PrivacyCheckRecord[]>(INITIAL_PRIVACY_CHECKS);
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNotesRecord[]>(INITIAL_RELEASE_NOTES);
  const [rehearsalStages, setRehearsalStages] = useState<RehearsalStageRecord[]>(INITIAL_REHEARSAL_STAGES);
  const [activities, setActivities] = useState<ReleaseActivityRecord[]>(INITIAL_RELEASE_ACTIVITIES);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // State mutation handlers
  const handleUpdateChecklistStatus = (id: string, newStatus: ChecklistRecord['status']) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus, updatedDate: '2026-11-14' } : item))
    );
    showToast(`Checklist task ${id} updated to ${newStatus}`);
  };

  const handleBatchCompleteCategory = (category: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.category === category ? { ...item, status: 'Completed', updatedDate: '2026-11-14' } : item))
    );
    showToast(`All tasks in "${category}" marked as Completed!`);
  };

  const handleUpdateTestResult = (id: string, result: TestResult) => {
    setQaTests((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, result, testDate: '2026-11-14' } : tc))
    );
    showToast(`Test case ${id} marked as ${result}`);
  };

  const handleUpdateBug = (updated: BugRecord) => {
    setBugs((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    showToast(`Bug ticket ${updated.id} triaged successfully`);
  };

  const handleUpdateVersion = (updated: AppVersionRecord) => {
    setVersions((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    showToast(`Version ${updated.versionName} updated`);
  };

  const handleCreateVersion = (created: AppVersionRecord) => {
    setVersions((prev) => [created, ...prev]);
    showToast(`New Version Milestone ${created.versionName} created!`);
  };

  const handleSaveNotes = (saved: ReleaseNotesRecord) => {
    setReleaseNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
    showToast(`Release notes for ${saved.appVersion} saved!`);
  };

  const handleTriggerDemoBuild = () => {
    const newBuildId = `BLD-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBuild: BuildRecord = {
      id: newBuildId,
      platform: 'Cross-Platform',
      appVersion: 'v1.0.0',
      buildNumber: 105,
      buildDate: '2026-11-14',
      buildType: 'Release AAB',
      status: 'Building',
      testingStatus: 'In Progress',
      fileSizeMb: 35.1,
      commitHash: '#b8cad3f',
      buildNotes: 'Automated CI/CD release build triggered from admin console.',
      signed: true
    };
    setBuilds([newBuild, ...builds]);
    showToast(`Pipeline triggered: ${newBuildId} compilation in progress...`);
    setTimeout(() => {
      setBuilds((prev) =>
        prev.map((b) => (b.id === newBuildId ? { ...b, status: 'Successful', testingStatus: 'Passed' } : b))
      );
      showToast(`Build ${newBuildId} completed successfully!`);
    }, 2500);
  };

  const handleApproveRelease = () => {
    showToast('🚀 Release v1.0.0 officially approved for production store submission!');
  };

  // Tab definitions
  const tabs: { key: ReleaseTabKey; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { key: 'dashboard', label: 'Release Dashboard', icon: Rocket },
    { key: 'readiness', label: 'Readiness Gates', icon: CheckCircle2, badge: '94%' },
    { key: 'android', label: 'Android Release', icon: Smartphone, badge: 'AAB' },
    { key: 'ios', label: 'iOS Release', icon: Apple, badge: 'IPA' },
    { key: 'versions', label: 'Versions', icon: Tag, badge: `${versions.length}` },
    { key: 'builds', label: 'Builds & Artifacts', icon: Layers, badge: `${builds.length}` },
    { key: 'checklist', label: 'Checklist (27)', icon: ClipboardList },
    { key: 'qa', label: 'QA Matrix (32)', icon: CheckCircle2 },
    { key: 'devices', label: 'Device Tests', icon: Smartphone, badge: '8' },
    { key: 'bugs', label: 'Bug Tracker', icon: Bug, badge: `${bugs.filter((b) => b.priority === 'Critical' && b.status === 'Open').length} P0` },
    { key: 'security_privacy', label: 'Security & Privacy', icon: ShieldCheck },
    { key: 'play_preview', label: 'Play Store Preview', icon: Smartphone },
    { key: 'appstore_preview', label: 'App Store Preview', icon: Apple },
    { key: 'notes', label: 'Release Notes', icon: FileText },
    { key: 'rehearsal', label: 'Launch Rehearsal', icon: Play },
    { key: 'approval', label: 'Final Approval', icon: Award }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-pink-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-fadeIn">
          <div className="p-1.5 bg-pink-500/20 text-pink-400 rounded-lg">
            <Rocket className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Tab Navigation Bar */}
      <div className="bg-slate-900/60 border border-purple-800/30 rounded-2xl p-2.5 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/25'
                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-purple-950/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab View Rendering */}
      <div>
        {activeTab === 'dashboard' && (
          <ReleaseDashboardView
            currentVersion={versions[0]}
            builds={builds}
            checklist={checklist}
            bugs={bugs}
            activities={activities}
            readinessCategories={readinessSummaries}
            onSelectTab={setActiveTab}
            onOpenRehearsal={() => setActiveTab('rehearsal')}
            onExportReport={() => showToast('Release report exported.')}
          />
        )}

        {activeTab === 'readiness' && (
          <LaunchReadinessView
            categories={readinessSummaries}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'android' && (
          <PlatformReleaseView
            currentVersion={versions[0]}
            builds={builds}
            initialPlatform="Android"
          />
        )}

        {activeTab === 'ios' && (
          <PlatformReleaseView
            currentVersion={versions[0]}
            builds={builds}
            initialPlatform="iOS"
          />
        )}

        {activeTab === 'versions' && (
          <AppVersionManagementView
            versions={versions}
            onUpdateVersion={handleUpdateVersion}
            onCreateVersion={handleCreateVersion}
          />
        )}

        {activeTab === 'builds' && (
          <BuildInformationView
            builds={builds}
            onTriggerDemoBuild={handleTriggerDemoBuild}
          />
        )}

        {activeTab === 'checklist' && (
          <ReleaseChecklistTab
            checklist={checklist}
            onUpdateChecklistStatus={handleUpdateChecklistStatus}
            onBatchCompleteCategory={handleBatchCompleteCategory}
          />
        )}

        {activeTab === 'qa' && (
          <QualityAssuranceView
            testCases={qaTests}
            onUpdateTestResult={handleUpdateTestResult}
          />
        )}

        {activeTab === 'devices' && (
          <DeviceTestingView deviceTests={deviceTests} />
        )}

        {activeTab === 'bugs' && (
          <BugTrackingView
            bugs={bugs}
            onUpdateBug={handleUpdateBug}
          />
        )}

        {activeTab === 'security_privacy' && (
          <SecurityPrivacyChecklistView
            securityChecks={securityChecks}
            privacyChecks={privacyChecks}
          />
        )}

        {activeTab === 'play_preview' && (
          <StoreListingPreviewView />
        )}

        {activeTab === 'appstore_preview' && (
          <StoreListingPreviewView />
        )}

        {activeTab === 'notes' && (
          <ReleaseNotesManagementView
            releaseNotes={releaseNotes}
            onSaveNotes={handleSaveNotes}
          />
        )}

        {activeTab === 'rehearsal' && (
          <LaunchRehearsalView
            stages={rehearsalStages}
            onRehearsalComplete={() => showToast('🎉 All 9 Launch Rehearsal Stages Completed Successfully!')}
          />
        )}

        {activeTab === 'approval' && (
          <FinalReleaseApprovalView onApproveRelease={handleApproveRelease} />
        )}
      </div>
    </div>
  );
};
