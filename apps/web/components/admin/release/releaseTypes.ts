export type ReleasePlatform = 'Android' | 'iOS' | 'Cross-Platform';

export type ReleaseChannel =
  | 'Internal Testing'
  | 'Closed Testing'
  | 'Open Testing'
  | 'Production'
  | 'TestFlight Preparation'
  | 'TestFlight Testing'
  | 'App Store Preparation';

export type BuildStatus = 'Pending' | 'Building' | 'Successful' | 'Failed' | 'Archived';
export type TestResult = 'Passed' | 'Failed' | 'Pending' | 'Blocked';
export type BugPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type BugStatus = 'Open' | 'In Progress' | 'Fixed' | 'Verified' | 'Closed';

export type ReadinessStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'Needs Attention'
  | 'Blocked';

export type ReleaseDecision =
  | 'Not Ready'
  | 'Needs Review'
  | 'Ready for Final Approval'
  | 'Demo Approved';

export type ReleaseEmptyKind =
  | 'no_release_records'
  | 'no_android_builds'
  | 'no_ios_builds'
  | 'no_test_records'
  | 'no_bugs'
  | 'no_critical_bugs'
  | 'no_pending_checklist'
  | 'no_release_notes'
  | 'no_rehearsal_activity'
  | 'no_search_results';

export type ReleaseTabKey =
  | 'dashboard'
  | 'readiness'
  | 'android'
  | 'ios'
  | 'versions'
  | 'builds'
  | 'checklist'
  | 'qa'
  | 'devices'
  | 'bugs'
  | 'security_privacy'
  | 'play_preview'
  | 'appstore_preview'
  | 'notes'
  | 'rehearsal'
  | 'approval';

export interface AppVersionRecord {
  id: string; // e.g. VER-100
  versionName: string; // e.g. v1.0.0
  versionCode: number; // e.g. 100
  platform: ReleasePlatform;
  buildNumber: number; // e.g. 104
  releaseDate: string; // e.g. 2026-11-14
  status: 'Staged' | 'Production' | 'Beta' | 'Alpha' | 'Archived';
  channel: ReleaseChannel;
  releaseNotes: string;
  minOsVersion: string;
  targetOsVersion: string;
}

export interface BuildRecord {
  id: string; // e.g. BLD-10901
  platform: ReleasePlatform;
  appVersion: string; // e.g. v1.0.0
  buildNumber: number;
  buildDate: string;
  buildType: 'Release AAB' | 'Debug APK' | 'TestFlight IPA' | 'Release IPA';
  status: BuildStatus;
  testingStatus: 'Passed' | 'In Progress' | 'Pending' | 'Failed';
  fileSizeMb: number;
  commitHash: string;
  buildNotes: string;
  signed: boolean;
}

export interface TestCaseRecord {
  id: string; // e.g. TC-401
  name: string;
  category:
    | 'Functional Testing'
    | 'UI Testing'
    | 'Navigation Testing'
    | 'Authentication Testing'
    | 'Live Streaming Testing'
    | 'Wallet Interface Testing'
    | 'Notification Testing'
    | 'Responsive Testing'
    | 'Regression Testing';
  platform: ReleasePlatform;
  result: TestResult;
  testDate: string;
  reviewer: string;
  executionDuration: string;
  stepsCount: number;
  notes: string;
}

export interface BugRecord {
  id: string; // e.g. BUG-801
  title: string;
  description: string;
  relatedModule: string; // e.g. Live Monitor, Wallet, Report Queue
  platform: ReleasePlatform;
  priority: BugPriority;
  status: BugStatus;
  reportedDate: string;
  assignedDeveloper: string;
  resolutionNotes?: string;
  fixedInBuild?: string;
}

export interface ChecklistRecord {
  id: string; // e.g. CHK-101
  category:
    | 'Application Readiness'
    | 'Android Readiness'
    | 'iOS Readiness'
    | 'Quality Assurance'
    | 'Store Readiness';
  taskName: string;
  description: string;
  assignedReviewer: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Needs Attention';
  updatedDate: string;
  isCritical: boolean;
}

export interface ReadinessCategorySummary {
  id: string;
  category: string;
  completionPercentage: number;
  completedTasks: number;
  pendingTasks: number;
  failedTasks: number;
  status: ReadinessStatus;
  leadReviewer: string;
  description: string;
}

export interface DeviceTestRecord {
  id: string; // e.g. DEV-01
  deviceCategory:
    | 'Small Screen'
    | 'Standard Screen'
    | 'Large Screen'
    | 'Tablet'
    | 'Small iPhone Screen'
    | 'Standard iPhone Screen'
    | 'Large iPhone Screen'
    | 'iPad';
  deviceName: string;
  operatingSystem: string;
  screenSize: string; // e.g. 6.1" (1170 x 2532)
  platform: 'Android' | 'iOS';
  testStatus: 'Passed' | 'Passed with Minor' | 'Pending' | 'In Progress';
  lastTestDate: string;
  testNotes: string;
}

export interface SecurityCheckRecord {
  id: string; // e.g. SEC-01
  checkName: string;
  description: string;
  status: 'Verified' | 'Needs Review' | 'In Progress';
  reviewer: string;
  lastUpdatedDate: string;
  riskLevel: 'Low' | 'Medium' | 'Safe';
}

export interface PrivacyCheckRecord {
  id: string; // e.g. PRV-01
  checkName: string;
  description: string;
  status: 'Compliant' | 'Pending Review' | 'In Progress';
  assignedReviewer: string;
  lastUpdatedDate: string;
  disclosureType: 'Required' | 'Recommended' | 'Mandatory';
}

export interface ReleaseNotesRecord {
  id: string; // e.g. RN-100
  appVersion: string;
  platform: ReleasePlatform;
  releaseTitle: string;
  newFeatures: string[];
  improvements: string[];
  bugFixes: string[];
  releaseDate: string;
  status: 'Draft' | 'Approved' | 'Published Demo';
  languagesCount: number;
}

export interface RehearsalStageRecord {
  id: string; // e.g. STG-01
  stageName: string;
  description: string;
  assignedReviewer: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Passed';
  pendingTasksCount: number;
  reviewDate: string;
  validationChecklist: string[];
}

export interface ReleaseActivityRecord {
  id: string;
  title: string;
  moduleName: string;
  adminName: string;
  dateTime: string;
  relatedRecordId: string;
  description: string;
  type: 'build' | 'qa' | 'bug' | 'checklist' | 'store' | 'security' | 'rehearsal';
}
