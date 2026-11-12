import { createInitialAgencyHosts } from '@/components/agency-management/mockAgencyData';
import {
  AgentChartPoint,
  AgentEarningRecord,
  AgentEarningSummaryMetrics,
  AgentProfileSummary,
  ChartViewMode,
  CommissionHistoryRecord,
  DateFilterPeriod,
  HostActivityEarningItem,
} from './types';

export function formatSamplePts(pts: number): string {
  return pts.toLocaleString('en-US');
}

export function createInitialAgentProfile(): AgentProfileSummary {
  return {
    agentId: 'AGNT-3082',
    username: 'Ayesha Khan',
    handle: '@ayesha.agent',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
    agencyName: 'Star Creators Agency (AG-2048)',
    unitLabel: 'pts',
    demoCaption: 'Sample points · Demo data',
  };
}

export const INITIAL_AGENT_SUMMARY: AgentEarningSummaryMetrics = {
  totalEarningsPts: 12450,
  thisMonthPts: 4250,
  lastMonthPts: 3800,
  pendingEarningsPts: 1200,
  completedEarningsPts: 11250,
};

export function createInitialEarningRecords(): AgentEarningRecord[] {
  const hosts = createInitialAgencyHosts();
  const h = (idx: number) => hosts[idx % hosts.length];

  return [
    {
      id: 'EARN-9801',
      title: 'Host activity share',
      category: 'Host activity share',
      hostId: h(0).hostId,
      hostName: h(0).username,
      hostHandle: h(0).handle,
      hostAvatarUrl: h(0).avatarUrl,
      referenceCode: 'ACT-2026-1112A',
      dateIso: '2026-11-12',
      dateLabel: 'Today',
      sampleAmountPts: 350,
      status: 'Completed',
      summaryNote:
        'Sample activity share preview logged from evening acoustic showcase activity (no real payout).',
    },
    {
      id: 'EARN-9802',
      title: 'Host activity share',
      category: 'Host activity share',
      hostId: h(1).hostId,
      hostName: h(1).username,
      hostHandle: h(1).handle,
      hostAvatarUrl: h(1).avatarUrl,
      referenceCode: 'ACT-2026-1111B',
      dateIso: '2026-11-11',
      dateLabel: 'Yesterday',
      sampleAmountPts: 280,
      status: 'Completed',
      summaryNote:
        'Sample points entry reflecting interactive variety room participation in demo data.',
    },
    {
      id: 'EARN-9803',
      title: 'Pending earning entry',
      category: 'Pending earning entry',
      hostId: h(2).hostId,
      hostName: h(2).username,
      hostHandle: h(2).handle,
      hostAvatarUrl: h(2).avatarUrl,
      referenceCode: 'PND-2026-1112C',
      dateIso: '2026-11-12',
      dateLabel: 'Today',
      sampleAmountPts: 450,
      status: 'Pending',
      summaryNote:
        'Demo earning item marked as awaiting scheduled monthly cycle check (mock status only).',
    },
    {
      id: 'EARN-9804',
      title: 'Agency-related activity',
      category: 'Agency-related activity',
      hostId: h(3).hostId,
      hostName: h(3).username,
      hostHandle: h(3).handle,
      hostAvatarUrl: h(3).avatarUrl,
      referenceCode: 'AGN-2026-1110D',
      dateIso: '2026-11-10',
      dateLabel: 'Nov 10, 2026',
      sampleAmountPts: 520,
      status: 'Processing',
      summaryNote:
        'Sample agency coordination summary record in temporary frontend preview state.',
    },
    {
      id: 'EARN-9805',
      title: 'Pending earning entry',
      category: 'Pending earning entry',
      hostId: h(4).hostId,
      hostName: h(4).username,
      hostHandle: h(4).handle,
      hostAvatarUrl: h(4).avatarUrl,
      referenceCode: 'PND-2026-1109E',
      dateIso: '2026-11-09',
      dateLabel: 'Nov 09, 2026',
      sampleAmountPts: 750,
      status: 'Pending',
      summaryNote:
        'Queued demo host participation points shown for Pending Earnings filtering preview.',
    },
    {
      id: 'EARN-9806',
      title: 'Completed earning entry',
      category: 'Completed earning entry',
      hostId: h(5).hostId,
      hostName: h(5).username,
      hostHandle: h(5).handle,
      hostAvatarUrl: h(5).avatarUrl,
      referenceCode: 'CMP-2026-1108F',
      dateIso: '2026-11-08',
      dateLabel: 'Nov 08, 2026',
      sampleAmountPts: 640,
      status: 'Completed',
      summaryNote:
        'Completed sample earning summary for weekly community stream showcase.',
    },
    {
      id: 'EARN-9807',
      title: 'Monthly earning record',
      category: 'Monthly earning record',
      hostId: h(0).hostId,
      hostName: h(0).username,
      hostHandle: h(0).handle,
      hostAvatarUrl: h(0).avatarUrl,
      referenceCode: 'MON-2026-1105G',
      dateIso: '2026-11-05',
      dateLabel: 'Nov 05, 2026',
      sampleAmountPts: 1260,
      status: 'Completed',
      summaryNote:
        'Aggregated early-November sample record across active showcase broadcasts.',
    },
    {
      id: 'EARN-9808',
      title: 'Host activity share',
      category: 'Host activity share',
      hostId: h(6).hostId,
      hostName: h(6).username,
      hostHandle: h(6).handle,
      hostAvatarUrl: h(6).avatarUrl,
      referenceCode: 'ACT-2026-1028H',
      dateIso: '2026-10-28',
      dateLabel: 'Oct 28, 2026',
      sampleAmountPts: 980,
      status: 'Completed',
      summaryNote:
        'Late October host stream summary included in Last Month sample comparison.',
    },
    {
      id: 'EARN-9809',
      title: 'Monthly earning record',
      category: 'Monthly earning record',
      hostId: h(1).hostId,
      hostName: h(1).username,
      hostHandle: h(1).handle,
      hostAvatarUrl: h(1).avatarUrl,
      referenceCode: 'MON-2026-1020I',
      dateIso: '2026-10-20',
      dateLabel: 'Oct 20, 2026',
      sampleAmountPts: 1620,
      status: 'Completed',
      summaryNote:
        'Mid-October sample summary checkpoint using demo units only.',
    },
    {
      id: 'EARN-9810',
      title: 'Agency-related activity',
      category: 'Agency-related activity',
      hostId: h(7).hostId,
      hostName: h(7).username,
      hostHandle: h(7).handle,
      hostAvatarUrl: h(7).avatarUrl,
      referenceCode: 'AGN-2026-1014J',
      dateIso: '2026-10-14',
      dateLabel: 'Oct 14, 2026',
      sampleAmountPts: 1200,
      status: 'Completed',
      summaryNote:
        'Sample host panel checkpoint logged in October demo dataset.',
    },
    {
      id: 'EARN-9811',
      title: 'Host activity share',
      category: 'Host activity share',
      hostId: h(8).hostId,
      hostName: h(8).username,
      hostHandle: h(8).handle,
      hostAvatarUrl: h(8).avatarUrl,
      referenceCode: 'ACT-2026-1007K',
      dateIso: '2026-10-07',
      dateLabel: 'Oct 07, 2026',
      sampleAmountPts: 240,
      status: 'Cancelled',
      summaryNote:
        'Demo cancelled entry included to test Cancelled status visual formatting.',
    },
  ];
}

export function createInitialCommissionHistory(): CommissionHistoryRecord[] {
  const hosts = createInitialAgencyHosts();
  const h = (idx: number) => hosts[idx % hosts.length];

  return [
    {
      commissionId: 'COM-5501',
      linkedEarningId: 'EARN-9801',
      hostId: h(0).hostId,
      hostName: h(0).username,
      hostHandle: h(0).handle,
      hostAvatarUrl: h(0).avatarUrl,
      activityDateIso: '2026-11-12',
      activityDateLabel: 'Today · Nov 12',
      sampleCommissionPts: 350,
      status: 'Completed',
      activityTitle: 'Showcase Live Session Sample Entry',
      note: 'Demo commission figure displayed for UI verification (no rate calculation applied).',
    },
    {
      commissionId: 'COM-5502',
      linkedEarningId: 'EARN-9803',
      hostId: h(2).hostId,
      hostName: h(2).username,
      hostHandle: h(2).handle,
      hostAvatarUrl: h(2).avatarUrl,
      activityDateIso: '2026-11-12',
      activityDateLabel: 'Today · Nov 12',
      sampleCommissionPts: 450,
      status: 'Pending',
      activityTitle: 'Music Lounge Sample Checkpoint',
      note: 'Pending demo entry awaiting simulated batch confirmation.',
    },
    {
      commissionId: 'COM-5503',
      linkedEarningId: 'EARN-9802',
      hostId: h(1).hostId,
      hostName: h(1).username,
      hostHandle: h(1).handle,
      hostAvatarUrl: h(1).avatarUrl,
      activityDateIso: '2026-11-11',
      activityDateLabel: 'Yesterday · Nov 11',
      sampleCommissionPts: 280,
      status: 'Completed',
      activityTitle: 'Interactive Q&A Sample Entry',
      note: 'Completed demo activity share without financial disbursement.',
    },
    {
      commissionId: 'COM-5504',
      linkedEarningId: 'EARN-9804',
      hostId: h(3).hostId,
      hostName: h(3).username,
      hostHandle: h(3).handle,
      hostAvatarUrl: h(3).avatarUrl,
      activityDateIso: '2026-11-10',
      activityDateLabel: 'Nov 10, 2026',
      sampleCommissionPts: 520,
      status: 'Processing',
      activityTitle: 'Voice Room Host Sample Share',
      note: 'In-progress mock processing state for UI review.',
    },
    {
      commissionId: 'COM-5505',
      linkedEarningId: 'EARN-9805',
      hostId: h(4).hostId,
      hostName: h(4).username,
      hostHandle: h(4).handle,
      hostAvatarUrl: h(4).avatarUrl,
      activityDateIso: '2026-11-09',
      activityDateLabel: 'Nov 09, 2026',
      sampleCommissionPts: 750,
      status: 'Pending',
      activityTitle: 'Creative Studio Weekend Entry',
      note: 'Demo Pending status item stored locally.',
    },
    {
      commissionId: 'COM-5506',
      linkedEarningId: 'EARN-9806',
      hostId: h(5).hostId,
      hostName: h(5).username,
      hostHandle: h(5).handle,
      hostAvatarUrl: h(5).avatarUrl,
      activityDateIso: '2026-11-08',
      activityDateLabel: 'Nov 08, 2026',
      sampleCommissionPts: 640,
      status: 'Completed',
      activityTitle: 'Late Evening Stream Checkpoint',
      note: 'Sample completed commission item (pts).',
    },
    {
      commissionId: 'COM-5507',
      linkedEarningId: 'EARN-9808',
      hostId: h(6).hostId,
      hostName: h(6).username,
      hostHandle: h(6).handle,
      hostAvatarUrl: h(6).avatarUrl,
      activityDateIso: '2026-10-28',
      activityDateLabel: 'Oct 28, 2026',
      sampleCommissionPts: 980,
      status: 'Completed',
      activityTitle: 'October Showcase Sample Batch',
      note: 'Previous month completed demo entry.',
    },
    {
      commissionId: 'COM-5508',
      linkedEarningId: 'EARN-9811',
      hostId: h(8).hostId,
      hostName: h(8).username,
      hostHandle: h(8).handle,
      hostAvatarUrl: h(8).avatarUrl,
      activityDateIso: '2026-10-07',
      activityDateLabel: 'Oct 07, 2026',
      sampleCommissionPts: 240,
      status: 'Cancelled',
      activityTitle: 'Sample Adjusted / Cancelled Entry',
      note: 'Displayed solely to demonstrate Cancelled status pill & detail state.',
    },
  ];
}

export function createInitialHostActivityEarnings(): HostActivityEarningItem[] {
  const hosts = createInitialAgencyHosts();
  const statuses: Array<'Completed' | 'Pending' | 'Processing'> = [
    'Completed',
    'Completed',
    'Pending',
    'Processing',
    'Pending',
    'Completed',
    'Completed',
    'Completed',
    'Completed',
    'Completed',
  ];
  const amounts = [1850, 1620, 1280, 1140, 1090, 960, 880, 740, 690, 560];
  const dates = [
    ['2026-11-12', 'Today'],
    ['2026-11-11', 'Yesterday'],
    ['2026-11-12', 'Today'],
    ['2026-11-10', 'Nov 10, 2026'],
    ['2026-11-09', 'Nov 09, 2026'],
    ['2026-11-08', 'Nov 08, 2026'],
    ['2026-11-05', 'Nov 05, 2026'],
    ['2026-10-28', 'Oct 28, 2026'],
    ['2026-10-22', 'Oct 22, 2026'],
    ['2026-10-16', 'Oct 16, 2026'],
  ];

  return hosts.slice(0, 10).map((host, idx) => ({
    recordId: `HAE-${9101 + idx}`,
    hostId: host.hostId,
    username: host.username,
    handle: host.handle,
    avatarUrl: host.avatarUrl,
    verified: host.verified,
    activitySummary: `${host.sampleSessionsThisWeek} sample sessions · ${host.sampleLiveHours.toFixed(1)} hrs live`,
    relatedEarningTitle: idx % 2 === 0 ? 'Host activity share' : 'Monthly host summary (Demo)',
    activityDateIso: dates[idx][0],
    activityDateLabel: dates[idx][1],
    sampleAmountPts: amounts[idx],
    status: statuses[idx],
  }));
}

export const AGENT_CHARTS_BY_VIEW: Record<ChartViewMode, AgentChartPoint[]> = {
  daily: [
    { label: '09:00', completedPts: 120, pendingPts: 40 },
    { label: '12:00', completedPts: 210, pendingPts: 60 },
    { label: '15:00', completedPts: 280, pendingPts: 90 },
    { label: '18:00', completedPts: 350, pendingPts: 150 },
    { label: '21:00', completedPts: 410, pendingPts: 180 },
  ],
  weekly: [
    { label: 'Mon', completedPts: 420, pendingPts: 120 },
    { label: 'Tue', completedPts: 510, pendingPts: 140 },
    { label: 'Wed', completedPts: 480, pendingPts: 160 },
    { label: 'Thu', completedPts: 640, pendingPts: 180 },
    { label: 'Fri', completedPts: 720, pendingPts: 240 },
    { label: 'Sat', completedPts: 610, pendingPts: 210 },
    { label: 'Sun', completedPts: 590, pendingPts: 150 },
  ],
  monthly: [
    { label: 'Wk 1', completedPts: 880, pendingPts: 220 },
    { label: 'Wk 2', completedPts: 1020, pendingPts: 310 },
    { label: 'Wk 3', completedPts: 1180, pendingPts: 350 },
    { label: 'Wk 4', completedPts: 970, pendingPts: 320 },
  ],
  comparison: [
    { label: 'Aug', completedPts: 2850, pendingPts: 450 },
    { label: 'Sep', completedPts: 3240, pendingPts: 620 },
    { label: 'Oct', completedPts: 3520, pendingPts: 280 },
    { label: 'Nov', completedPts: 3050, pendingPts: 1200 },
  ],
};

export function mapDatePeriodToChartMode(period: DateFilterPeriod): ChartViewMode {
  switch (period) {
    case 'today':
      return 'daily';
    case 'this_week':
      return 'weekly';
    case 'this_month':
      return 'monthly';
    case 'last_month':
    case 'custom':
      return 'comparison';
  }
}

export function matchesDatePeriod(
  dateIso: string,
  period: DateFilterPeriod,
  customStart: string,
  customEnd: string
): boolean {
  if (period === 'today') return dateIso === '2026-11-12';
  if (period === 'this_week') return dateIso >= '2026-11-06' && dateIso <= '2026-11-12';
  if (period === 'this_month') return dateIso.startsWith('2026-11-');
  if (period === 'last_month') return dateIso.startsWith('2026-10-');
  if (period === 'custom') {
    if (customStart && dateIso < customStart) return false;
    if (customEnd && dateIso > customEnd) return false;
    return true;
  }
  return true;
}
