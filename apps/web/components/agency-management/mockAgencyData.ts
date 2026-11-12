import {
  AgencyFaqItem,
  AgencyGuidanceItem,
  AgencyHostRecord,
  AgencyLogoPresetId,
  AgencyPerformanceDataset,
  AgencyProfileData,
  PerformancePeriod,
} from './types';

export function getAgencyLogoSvg(preset: AgencyLogoPresetId): string {
  const palette: Record<
    AgencyLogoPresetId,
    { ring: string; bg: string; dot: string; innerGlow: string }
  > = {
    gold_orbit: {
      ring: '#FBBF24',
      bg: '#2A124C',
      dot: '#FFFFFF',
      innerGlow: '#F59E0B',
    },
    neon_star: {
      ring: '#FF2E93',
      bg: '#250D42',
      dot: '#FFE4F1',
      innerGlow: '#FF2E93',
    },
    violet_crown: {
      ring: '#A855F7',
      bg: '#1E0B3B',
      dot: '#F3E8FF',
      innerGlow: '#C084FC',
    },
    emerald_crest: {
      ring: '#34D399',
      bg: '#161D3B',
      dot: '#ECFDF5',
      innerGlow: '#10B981',
    },
  };

  const c = palette[preset];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <circle cx="60" cy="60" r="56" fill="${c.bg}"/>
    <circle cx="60" cy="60" r="46" fill="none" stroke="${c.ring}" stroke-width="8"/>
    <circle cx="60" cy="60" r="30" fill="${c.innerGlow}" fill-opacity="0.14"/>
    <circle cx="60" cy="60" r="10" fill="${c.dot}"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function makeAgencyCoverSvg(agencyName: string): string {
  const safeTitle = agencyName.slice(0, 32).replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 320" width="1200" height="320" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="agBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E0B3B"/>
        <stop offset="50%" stop-color="#3B1063"/>
        <stop offset="100%" stop-color="#110524"/>
      </linearGradient>
      <radialGradient id="agPink" cx="80%" cy="35%" r="48%">
        <stop offset="0%" stop-color="#FF2E93" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="#FF2E93" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="agGold" cx="20%" cy="65%" r="42%">
        <stop offset="0%" stop-color="#FBBF24" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#FBBF24" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="320" fill="url(#agBg)"/>
    <rect width="1200" height="320" fill="url(#agPink)"/>
    <rect width="1200" height="320" fill="url(#agGold)"/>
    <circle cx="960" cy="145" r="115" fill="none" stroke="#FBBF24" stroke-opacity="0.2" stroke-width="2"/>
    <circle cx="960" cy="145" r="78" fill="none" stroke="#FF2E93" stroke-opacity="0.25" stroke-width="2"/>
    <text x="64" y="274" fill="#FFFFFF" fill-opacity="0.09" font-family="sans-serif" font-size="44" font-weight="800">${safeTitle}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const AGENCY_LOGO_PRESETS: Array<{ id: AgencyLogoPresetId; label: string }> = [
  { id: 'gold_orbit', label: 'Gold Orbit' },
  { id: 'neon_star', label: 'Neon Star' },
  { id: 'violet_crown', label: 'Violet Crown' },
  { id: 'emerald_crest', label: 'Emerald Crest' },
];

export function createInitialAgencyProfile(): AgencyProfileData {
  return {
    agencyId: 'AG-2048',
    agencyName: 'Star Creators Agency',
    status: 'Active agency',
    description:
      'Creator-focused talent collective supporting live streaming hosts, acoustic rooms, and interactive community showcases using local frontend preview data.',
    ownerName: 'Ayesha Khan',
    ownerHandle: '@ayesha.live',
    ownerAvatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
    ownerRole: 'Agency Owner & Talent Lead',
    contactEmail: 'hello@starcreators.example',
    contactPhone: '+92 300 000 2048',
    country: 'Pakistan & Global',
    createdDateLabel: 'Mar 14, 2025 (Sample)',
    logoPreset: 'gold_orbit',
    highlights: [
      'Weekly acoustic & community host check-ins',
      'New-host onboarding & schedule guidance',
      'Participation tracking separated from real payouts',
    ],
  };
}

export function createInitialAgencyHosts(): AgencyHostRecord[] {
  return [
    {
      hostId: 'PL-88401',
      username: 'Ayesha Khan',
      handle: '@ayesha.live',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
      verified: true,
      status: 'Active',
      joiningDate: 'Apr 02, 2025',
      activityStatusLabel: 'Live active · 6 sessions this week',
      sampleSessionsThisWeek: 6,
      sampleLiveHours: 14.5,
      sampleParticipationScore: 96,
      dailyTaskStatusLabel: 'Completed',
      dailyTaskProgressLabel: '5/5 tasks done',
      taskLevelCode: 'Level 03',
      taskLevelName: 'Rising Creator',
      countryLabel: 'Pakistan',
      membershipRole: 'Lead Showcase Host',
      bio: 'Evening acoustic live creator mentoring new agency hosts on stream setup and community chats.',
    },
    {
      hostId: 'PL-88402',
      username: 'Hamza Ali',
      handle: '@hamza.stage',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80',
      verified: true,
      status: 'Active',
      joiningDate: 'Apr 18, 2025',
      activityStatusLabel: 'Live active · 5 sessions this week',
      sampleSessionsThisWeek: 5,
      sampleLiveHours: 12.0,
      sampleParticipationScore: 91,
      dailyTaskStatusLabel: 'Completed',
      dailyTaskProgressLabel: '4/5 tasks done',
      taskLevelCode: 'Level 04',
      taskLevelName: 'Spotlight Host',
      countryLabel: 'Pakistan',
      membershipRole: 'Variety Room Host',
      bio: 'Interactive stage host focused on Q&A lounges and collaborative multi-guest rooms.',
    },
    {
      hostId: 'PL-88403',
      username: 'Mina Noor',
      handle: '@mina.noor',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
      verified: true,
      status: 'Active',
      joiningDate: 'May 09, 2025',
      activityStatusLabel: 'Online · 5 sessions this week',
      sampleSessionsThisWeek: 5,
      sampleLiveHours: 11.2,
      sampleParticipationScore: 89,
      dailyTaskStatusLabel: 'In Progress',
      dailyTaskProgressLabel: '3/5 tasks done',
      taskLevelCode: 'Level 03',
      taskLevelName: 'Rising Creator',
      countryLabel: 'Pakistan',
      membershipRole: 'Music & Chat Host',
      bio: 'Daily evening music broadcaster hosting chill fan sessions and trivia streams.',
    },
    {
      hostId: 'PL-88404',
      username: 'Sara Ali',
      handle: '@sara.voice',
      avatarUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=180&auto=format&fit=crop&q=80',
      verified: true,
      status: 'Active',
      joiningDate: 'May 22, 2025',
      activityStatusLabel: 'Online · 4 sessions this week',
      sampleSessionsThisWeek: 4,
      sampleLiveHours: 9.8,
      sampleParticipationScore: 84,
      dailyTaskStatusLabel: 'In Progress',
      dailyTaskProgressLabel: '3/5 tasks done',
      taskLevelCode: 'Level 03',
      taskLevelName: 'Rising Creator',
      countryLabel: 'UAE',
      membershipRole: 'Voice Lounge Host',
      bio: 'Storytelling and regional poetry live host participating in weekend creator spotlights.',
    },
    {
      hostId: 'PL-88405',
      username: 'Zara Noor',
      handle: '@zara.studio',
      avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=180&auto=format&fit=crop&q=80',
      verified: true,
      status: 'Active',
      joiningDate: 'Jun 04, 2025',
      activityStatusLabel: 'Live active · 4 sessions this week',
      sampleSessionsThisWeek: 4,
      sampleLiveHours: 9.4,
      sampleParticipationScore: 82,
      dailyTaskStatusLabel: 'Completed',
      dailyTaskProgressLabel: '5/5 tasks done',
      taskLevelCode: 'Level 03',
      taskLevelName: 'Rising Creator',
      countryLabel: 'UK',
      membershipRole: 'Community Creator',
      bio: 'Creative studio streamer covering art tutorials and cozy community check-ins.',
    },
    {
      hostId: 'PL-88406',
      username: 'Bilal Tariq',
      handle: '@bilal.onair',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=180&auto=format&fit=crop&q=80',
      verified: true,
      status: 'Active',
      joiningDate: 'Jun 19, 2025',
      activityStatusLabel: 'Online · 4 sessions this week',
      sampleSessionsThisWeek: 4,
      sampleLiveHours: 8.6,
      sampleParticipationScore: 80,
      dailyTaskStatusLabel: 'In Progress',
      dailyTaskProgressLabel: '2/5 tasks done',
      taskLevelCode: 'Level 02',
      taskLevelName: 'Active Streamer',
      countryLabel: 'Pakistan',
      membershipRole: 'Gaming & Chat Host',
      bio: 'Night-owl commentary creator focused on casual co-host conversations.',
    },
    {
      hostId: 'PL-88407',
      username: 'Hira Malik',
      handle: '@hira.beats',
      avatarUrl:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=180&auto=format&fit=crop&q=80',
      verified: false,
      status: 'Active',
      joiningDate: 'Jul 08, 2025',
      activityStatusLabel: 'Online · 3 sessions this week',
      sampleSessionsThisWeek: 3,
      sampleLiveHours: 7.5,
      sampleParticipationScore: 76,
      dailyTaskStatusLabel: 'In Progress',
      dailyTaskProgressLabel: '3/5 tasks done',
      taskLevelCode: 'Level 02',
      taskLevelName: 'Active Streamer',
      countryLabel: 'Pakistan',
      membershipRole: 'Audio Lounge Host',
      bio: 'Acoustic playlist host warming up regular evening broadcast hours.',
    },
    {
      hostId: 'PL-88408',
      username: 'Usman Raza',
      handle: '@usman.live',
      avatarUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=180&auto=format&fit=crop&q=80',
      verified: true,
      status: 'Active',
      joiningDate: 'Jul 24, 2025',
      activityStatusLabel: 'Online · 3 sessions this week',
      sampleSessionsThisWeek: 3,
      sampleLiveHours: 7.0,
      sampleParticipationScore: 74,
      dailyTaskStatusLabel: 'Completed',
      dailyTaskProgressLabel: '5/5 tasks done',
      taskLevelCode: 'Level 02',
      taskLevelName: 'Active Streamer',
      countryLabel: 'UAE',
      membershipRole: 'Talk Room Host',
      bio: 'Tech and pop-culture panel host running scheduled weekend talks.',
    },
    {
      hostId: 'PL-88409',
      username: 'Sana Iqbal',
      handle: '@sana.glow',
      avatarUrl:
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=180&auto=format&fit=crop&q=80',
      verified: false,
      status: 'Active',
      joiningDate: 'Aug 11, 2025',
      activityStatusLabel: 'Online · 3 sessions this week',
      sampleSessionsThisWeek: 3,
      sampleLiveHours: 6.4,
      sampleParticipationScore: 71,
      dailyTaskStatusLabel: 'In Progress',
      dailyTaskProgressLabel: '2/5 tasks done',
      taskLevelCode: 'Level 02',
      taskLevelName: 'Active Streamer',
      countryLabel: 'Saudi Arabia',
      membershipRole: 'Lifestyle Creator',
      bio: 'Lifestyle Q&A creator building steady weekday live routines.',
    },
    {
      hostId: 'PL-88410',
      username: 'Omar Farooq',
      handle: '@omar.fm',
      avatarUrl:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=180&auto=format&fit=crop&q=80',
      verified: false,
      status: 'Active',
      joiningDate: 'Sep 03, 2025',
      activityStatusLabel: 'Online · 3 sessions this week',
      sampleSessionsThisWeek: 3,
      sampleLiveHours: 6.1,
      sampleParticipationScore: 68,
      dailyTaskStatusLabel: 'Not Started',
      dailyTaskProgressLabel: '0/5 tasks today',
      taskLevelCode: 'Level 02',
      taskLevelName: 'Active Streamer',
      countryLabel: 'Pakistan',
      membershipRole: 'Late Night Radio Host',
      bio: 'Late-night chill commentary host welcoming new followers.',
    },
    {
      hostId: 'PL-88411',
      username: 'Nadia Shah',
      handle: '@nadia.stage',
      avatarUrl:
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=180&auto=format&fit=crop&q=80',
      verified: false,
      status: 'Pending',
      joiningDate: 'Nov 02, 2026',
      activityStatusLabel: 'Onboarding review · Demo checklist',
      sampleSessionsThisWeek: 1,
      sampleLiveHours: 1.5,
      sampleParticipationScore: 42,
      dailyTaskStatusLabel: 'In Progress',
      dailyTaskProgressLabel: '1/5 starter tasks',
      taskLevelCode: 'Level 01',
      taskLevelName: 'Newcomer',
      countryLabel: 'Pakistan',
      membershipRole: 'New-Host Candidate',
      bio: 'Completing sample profile checklist and first practice live stream.',
    },
    {
      hostId: 'PL-88412',
      username: 'Farhan Siddiqui',
      handle: '@farhan.mic',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=180&auto=format&fit=crop&q=80',
      verified: false,
      status: 'Pending',
      joiningDate: 'Nov 05, 2026',
      activityStatusLabel: 'Pending activation · Audio test scheduled',
      sampleSessionsThisWeek: 1,
      sampleLiveHours: 1.0,
      sampleParticipationScore: 35,
      dailyTaskStatusLabel: 'Not Started',
      dailyTaskProgressLabel: '0/5 starter tasks',
      taskLevelCode: 'Level 01',
      taskLevelName: 'Newcomer',
      countryLabel: 'UAE',
      membershipRole: 'New-Host Candidate',
      bio: 'Preparing acoustic mic setup prior to initial showcase schedule.',
    },
    {
      hostId: 'PL-88413',
      username: 'Kiran Tariq',
      handle: '@kiran.notes',
      avatarUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=180&auto=format&fit=crop&q=80',
      verified: false,
      status: 'Pending',
      joiningDate: 'Nov 08, 2026',
      activityStatusLabel: 'Pending · Reviewing community guide',
      sampleSessionsThisWeek: 0,
      sampleLiveHours: 0.5,
      sampleParticipationScore: 28,
      dailyTaskStatusLabel: 'Not Started',
      dailyTaskProgressLabel: 'New-Host Pack in progress',
      taskLevelCode: 'Level 01',
      taskLevelName: 'Newcomer',
      countryLabel: 'UK',
      membershipRole: 'Onboarding Trainee',
      bio: 'Walking through community safety guide and room moderation tips.',
    },
    {
      hostId: 'PL-88414',
      username: 'Saad Mahmood',
      handle: '@saad.streams',
      avatarUrl:
        'https://images.unsplash.com/photo-1463453091185-61582044d556?w=180&auto=format&fit=crop&q=80',
      verified: false,
      status: 'Pending',
      joiningDate: 'Nov 10, 2026',
      activityStatusLabel: 'Pending · Roster verification preview',
      sampleSessionsThisWeek: 0,
      sampleLiveHours: 0.0,
      sampleParticipationScore: 20,
      dailyTaskStatusLabel: 'Not Started',
      dailyTaskProgressLabel: '0/5 starter tasks',
      taskLevelCode: 'Level 01',
      taskLevelName: 'Newcomer',
      countryLabel: 'Pakistan',
      membershipRole: 'Onboarding Trainee',
      bio: 'Recently invited creator awaiting first scheduled welcome room.',
    },
    {
      hostId: 'PL-88415',
      username: 'Zainab Tariq',
      handle: '@zainab.art',
      avatarUrl:
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=180&auto=format&fit=crop&q=80',
      verified: true,
      status: 'Inactive',
      joiningDate: 'Mar 28, 2025',
      activityStatusLabel: 'Inactive · Last active 9 days ago',
      sampleSessionsThisWeek: 0,
      sampleLiveHours: 0.0,
      sampleParticipationScore: 18,
      dailyTaskStatusLabel: 'Not Started',
      dailyTaskProgressLabel: 'On temporary break',
      taskLevelCode: 'Level 03',
      taskLevelName: 'Rising Creator',
      countryLabel: 'Pakistan',
      membershipRole: 'Weekend Sketch Host',
      bio: 'Taking a planned break from weekly evening broadcasts.',
    },
    {
      hostId: 'PL-88416',
      username: 'Rohan Mirza',
      handle: '@rohan.vibe',
      avatarUrl:
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=180&auto=format&fit=crop&q=80',
      verified: false,
      status: 'Inactive',
      joiningDate: 'Jun 12, 2025',
      activityStatusLabel: 'Inactive · Last active 14 days ago',
      sampleSessionsThisWeek: 0,
      sampleLiveHours: 0.0,
      sampleParticipationScore: 12,
      dailyTaskStatusLabel: 'Not Started',
      dailyTaskProgressLabel: 'No activity this week',
      taskLevelCode: 'Level 02',
      taskLevelName: 'Active Streamer',
      countryLabel: 'Canada',
      membershipRole: 'Music Room Host',
      bio: 'Seasonal weekend creator currently between semester schedules.',
    },
    {
      hostId: 'PL-88417',
      username: 'Ali Raza',
      handle: '@ali.demo',
      avatarUrl:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=180&auto=format&fit=crop&q=80',
      verified: false,
      status: 'Suspended',
      joiningDate: 'May 14, 2025',
      activityStatusLabel: 'Suspended (Demo) · Schedule pause',
      sampleSessionsThisWeek: 0,
      sampleLiveHours: 0.0,
      sampleParticipationScore: 8,
      dailyTaskStatusLabel: 'Paused (Demo)',
      dailyTaskProgressLabel: 'Paused in sample state',
      taskLevelCode: 'Level 02',
      taskLevelName: 'Active Streamer',
      countryLabel: 'Pakistan',
      membershipRole: 'Sample Status Record',
      bio: 'Sample Suspended status entry used solely to demonstrate status filters in frontend UI.',
    },
    {
      hostId: 'PL-88418',
      username: 'Taha Qureshi',
      handle: '@taha.preview',
      avatarUrl:
        'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=180&auto=format&fit=crop&q=80',
      verified: false,
      status: 'Suspended',
      joiningDate: 'Aug 29, 2025',
      activityStatusLabel: 'Suspended (Demo) · Info review hold',
      sampleSessionsThisWeek: 0,
      sampleLiveHours: 0.0,
      sampleParticipationScore: 5,
      dailyTaskStatusLabel: 'Paused (Demo)',
      dailyTaskProgressLabel: 'Paused in sample state',
      taskLevelCode: 'Level 01',
      taskLevelName: 'Newcomer',
      countryLabel: 'UAE',
      membershipRole: 'Sample Status Record',
      bio: 'Placeholder status record representing demo Suspended state filtering without real moderation.',
    },
  ];
}

export const AGENCY_PERFORMANCE_BY_PERIOD: Record<PerformancePeriod, AgencyPerformanceDataset> = {
  daily: {
    period: 'daily',
    periodLabel: 'Daily Preview',
    totalSessions: 14,
    totalLiveHours: 24.5,
    activeHostCount: 10,
    participationRate: 78,
    summaryText:
      'Today features 10 active hosts running 14 sample live sessions across music, chat, and showcase rooms.',
    chartPoints: [
      { label: '08:00', sessions: 1, liveHours: 1.5, activeHosts: 2 },
      { label: '12:00', sessions: 2, liveHours: 3.5, activeHosts: 4 },
      { label: '16:00', sessions: 3, liveHours: 5.0, activeHosts: 6 },
      { label: '19:00', sessions: 4, liveHours: 7.5, activeHosts: 9 },
      { label: '22:00', sessions: 4, liveHours: 7.0, activeHosts: 8 },
    ],
    activityHistory: [
      {
        id: 'act_d1',
        hostName: 'Ayesha Khan',
        handle: '@ayesha.live',
        actionLabel: 'Completed evening showcase live session (2.5h sample)',
        timestampLabel: 'Today · 8:40 PM',
        category: 'Streaming',
      },
      {
        id: 'act_d2',
        hostName: 'Hamza Ali',
        handle: '@hamza.stage',
        actionLabel: 'Checked off Daily Host Tasks preview milestone (4/5)',
        timestampLabel: 'Today · 6:15 PM',
        category: 'Tasks',
      },
      {
        id: 'act_d3',
        hostName: 'Nadia Shah',
        handle: '@nadia.stage',
        actionLabel: 'Reviewed New-Host Pack onboarding checklist',
        timestampLabel: 'Today · 3:20 PM',
        category: 'Onboarding',
      },
    ],
  },
  weekly: {
    period: 'weekly',
    periodLabel: 'Weekly Preview',
    totalSessions: 42,
    totalLiveHours: 93.0,
    activeHostCount: 10,
    participationRate: 84,
    summaryText:
      'Weekly agency activity reflects 42 sample streaming sessions and 93 live hours led by active hosts.',
    chartPoints: [
      { label: 'Mon', sessions: 5, liveHours: 11.0, activeHosts: 7 },
      { label: 'Tue', sessions: 6, liveHours: 13.5, activeHosts: 8 },
      { label: 'Wed', sessions: 5, liveHours: 12.0, activeHosts: 8 },
      { label: 'Thu', sessions: 7, liveHours: 15.0, activeHosts: 9 },
      { label: 'Fri', sessions: 8, liveHours: 17.5, activeHosts: 10 },
      { label: 'Sat', sessions: 6, liveHours: 13.0, activeHosts: 9 },
      { label: 'Sun', sessions: 5, liveHours: 11.0, activeHosts: 8 },
    ],
    activityHistory: [
      {
        id: 'act_w1',
        hostName: 'Mina Noor',
        handle: '@mina.noor',
        actionLabel: 'Hosted 5 consecutive acoustic rooms this week',
        timestampLabel: 'Yesterday · 9:10 PM',
        category: 'Streaming',
      },
      {
        id: 'act_w2',
        hostName: 'Zara Noor',
        handle: '@zara.studio',
        actionLabel: 'Joined weekend community studio co-stream',
        timestampLabel: '2 days ago',
        category: 'Community',
      },
      {
        id: 'act_w3',
        hostName: 'Farhan Siddiqui',
        handle: '@farhan.mic',
        actionLabel: 'Completed audio test check with agency lead',
        timestampLabel: '3 days ago',
        category: 'Onboarding',
      },
    ],
  },
  monthly: {
    period: 'monthly',
    periodLabel: 'Monthly Preview',
    totalSessions: 176,
    totalLiveHours: 382.0,
    activeHostCount: 14,
    participationRate: 88,
    summaryText:
      'Monthly overview summarizes 176 sample live broadcasts and consistent participation across 18 listed host records.',
    chartPoints: [
      { label: 'Wk 1', sessions: 38, liveHours: 82.0, activeHosts: 11 },
      { label: 'Wk 2', sessions: 44, liveHours: 95.0, activeHosts: 12 },
      { label: 'Wk 3', sessions: 49, liveHours: 106.0, activeHosts: 13 },
      { label: 'Wk 4', sessions: 45, liveHours: 99.0, activeHosts: 14 },
    ],
    activityHistory: [
      {
        id: 'act_m1',
        hostName: 'Star Creators Agency',
        handle: 'AG-2048',
        actionLabel: 'Onboarded 4 pending newcomer hosts into roster preview',
        timestampLabel: 'Nov 2026',
        category: 'Onboarding',
      },
      {
        id: 'act_m2',
        hostName: 'Ayesha Khan',
        handle: '@ayesha.live',
        actionLabel: 'Participated in Star Creator Challenge sample showcase',
        timestampLabel: 'Nov 2026',
        category: 'Community',
      },
      {
        id: 'act_m3',
        hostName: 'Hamza Ali',
        handle: '@hamza.stage',
        actionLabel: 'Maintained Spotlight Host Level 04 activity streak',
        timestampLabel: 'Oct 2026',
        category: 'Tasks',
      },
    ],
  },
};

export const AGENCY_FAQS: AgencyFaqItem[] = [
  {
    id: 'faq_1',
    category: 'Agency',
    question: 'What does the Agency Management portal show right now?',
    answer:
      'This frontend module previews agency identity details, host roster management, status filtering, and sample activity summaries using local UI state only.',
  },
  {
    id: 'faq_2',
    category: 'Hosts',
    question: 'Are host status tags (Active, Pending, Inactive, Suspended) connected to moderation?',
    answer:
      'No. All host statuses and records are sample frontend data designed for UI inspection and filtering without real moderation or account enforcement.',
  },
  {
    id: 'faq_3',
    category: 'Activity',
    question: 'Does this screen calculate agency commissions or Agent Earnings?',
    answer:
      'No. Commission rates, revenue splits, and payouts are intentionally excluded here and belong separately to future Agent Earnings workflows.',
  },
  {
    id: 'faq_4',
    category: 'Agency',
    question: 'How do demo Agency Information edits behave?',
    answer:
      'Clicking Edit Profile lets you update sample agency fields locally in your browser session. Reloading resets to the default sample record.',
  },
];

export const AGENCY_MANAGEMENT_GUIDES: AgencyGuidanceItem[] = [
  {
    id: 'guide_agency',
    title: 'Agency Management Guidance',
    summary: 'Best practices for keeping creator rosters organized and responsive.',
    steps: [
      'Review active and pending host counts weekly to spot onboarding needs.',
      'Keep agency description and contact preview details clear and current.',
      'Encourage hosts to check Daily Host Tasks and Task Level milestones.',
    ],
  },
  {
    id: 'guide_hosts',
    title: 'Host Management Guidance',
    summary: 'Supporting creators from onboarding through regular live rooms.',
    steps: [
      'Filter by Pending to follow up with newcomers completing setup.',
      'Open Host Details to review activity hours alongside Task Level progress.',
      'Direct new hosts to the New-Host Pack for streaming and safety basics.',
    ],
  },
];
