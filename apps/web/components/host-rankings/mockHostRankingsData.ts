import { HostRankingEntry, PeriodRankingDataset, RankingPeriod } from './types';

export const CURRENT_DEMO_HOST_ID = 'host_ayesha';

interface BaseMockHostProfile {
  hostId: string;
  username: string;
  shortName: string;
  handle: string;
  avatarUrl: string;
  verified: boolean;
  level: number;
  countryLabel: string;
  bio: string;
  isCurrentUser?: boolean;
}

const BASE_HOSTS: Record<string, BaseMockHostProfile> = {
  host_ayesha: {
    hostId: 'host_ayesha',
    username: 'Ayesha Khan',
    shortName: 'Ayesha',
    handle: '@ayesha.live',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 42,
    countryLabel: 'Pakistan',
    bio: 'Acoustic sessions, evening Q&A rooms, and community stage nights on Popo Live.',
    isCurrentUser: true,
  },
  host_mina: {
    hostId: 'host_mina',
    username: 'Mina Noor',
    shortName: 'Mina',
    handle: '@mina.noor',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 48,
    countryLabel: 'Pakistan',
    bio: 'Vocal covers, talent showcases, and cozy late-night hangouts.',
  },
  host_sara: {
    hostId: 'host_sara',
    username: 'Sara Ali',
    shortName: 'Sara',
    handle: '@sara.voice',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 39,
    countryLabel: 'UAE',
    bio: '9-seat party rooms, storytelling, and weekend talent battles.',
  },
  host_hamza: {
    hostId: 'host_hamza',
    username: 'Hamza Ali',
    shortName: 'Hamza',
    handle: '@hamza.stage',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 36,
    countryLabel: 'Pakistan',
    bio: 'Interactive comedy talks and creator interviews.',
  },
  host_zara: {
    hostId: 'host_zara',
    username: 'Zara Noor',
    shortName: 'Zara',
    handle: '@zara.vibes',
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 31,
    countryLabel: 'UK',
    bio: 'Daily lifestyle streams and community trivia nights.',
  },
  host_zaid: {
    hostId: 'host_zaid',
    username: 'Zaid Star',
    shortName: 'Zaid',
    handle: '@zaid.star',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 65,
    countryLabel: 'Saudi Arabia',
    bio: 'High-energy PK arena host and live music curator.',
  },
  host_hira: {
    hostId: 'host_hira',
    username: 'Hira Malik',
    shortName: 'Hira',
    handle: '@hira.melody',
    avatarUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 34,
    countryLabel: 'Pakistan',
    bio: 'Indie music nights and audience song requests.',
  },
  host_bilal: {
    hostId: 'host_bilal',
    username: 'Bilal Raza',
    shortName: 'Bilal',
    handle: '@bilal.live',
    avatarUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 28,
    countryLabel: 'UAE',
    bio: 'Gaming co-streams and friendly squad party rooms.',
  },
  host_maham: {
    hostId: 'host_maham',
    username: 'Maham Tariq',
    shortName: 'Maham',
    handle: '@maham.chat',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 29,
    countryLabel: 'Pakistan',
    bio: 'Art sketching sessions and calm evening discussions.',
  },
  host_usman: {
    hostId: 'host_usman',
    username: 'Usman Qureshi',
    shortName: 'Usman',
    handle: '@usman.beats',
    avatarUrl:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 26,
    countryLabel: 'Canada',
    bio: 'DJ mixes and weekend party room co-hosts.',
  },
  host_anaya: {
    hostId: 'host_anaya',
    username: 'Anaya Siddiqui',
    shortName: 'Anaya',
    handle: '@anaya.glow',
    avatarUrl:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 33,
    countryLabel: 'UK',
    bio: 'Skincare tutorials, Q&A lounges, and friendly chats.',
  },
  host_farhan: {
    hostId: 'host_farhan',
    username: 'Farhan Sheikh',
    shortName: 'Farhan',
    handle: '@farhan.mic',
    avatarUrl:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 24,
    countryLabel: 'Pakistan',
    bio: 'Poetry open-mic rooms and late-evening podcasts.',
  },
  host_noor: {
    hostId: 'host_noor',
    username: 'Noor Fatima',
    shortName: 'Noor',
    handle: '@noor.fatima',
    avatarUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 27,
    countryLabel: 'Malaysia',
    bio: 'Acoustic guitar, tea chats, and fan spotlights.',
  },
  host_danish: {
    hostId: 'host_danish',
    username: 'Danish Iqbal',
    shortName: 'Danish',
    handle: '@danish.arena',
    avatarUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 22,
    countryLabel: 'Qatar',
    bio: 'Sports recap shows and match watch-along discussions.',
  },
  host_iqra: {
    hostId: 'host_iqra',
    username: 'Iqra Javed',
    shortName: 'Iqra',
    handle: '@iqra.live',
    avatarUrl:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 30,
    countryLabel: 'Pakistan',
    bio: 'Cooking corners, baking live streams, and family chat.',
  },
  host_omer: {
    hostId: 'host_omer',
    username: 'Omer Farooq',
    shortName: 'Omer',
    handle: '@omer.streams',
    avatarUrl:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 21,
    countryLabel: 'UAE',
    bio: 'Travel diaries and city walk broadcasts.',
  },
  host_sana: {
    hostId: 'host_sana',
    username: 'Sana Mir',
    shortName: 'Sana',
    handle: '@sana.studio',
    avatarUrl:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 25,
    countryLabel: 'Pakistan',
    bio: 'Book club evenings and study-with-me broadcasts.',
  },
  host_ali: {
    hostId: 'host_ali',
    username: 'Ali Hassan',
    shortName: 'Ali',
    handle: '@ali.hassan',
    avatarUrl:
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 19,
    countryLabel: 'Saudi Arabia',
    bio: 'Friendly multiplayer streams and nightly Q&A.',
  },
  host_kiran: {
    hostId: 'host_kiran',
    username: 'Kiran Zahra',
    shortName: 'Kiran',
    handle: '@kiran.zahra',
    avatarUrl:
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 20,
    countryLabel: 'UK',
    bio: 'Creative crafts, journaling, and calming soundtracks.',
  },
  host_saad: {
    hostId: 'host_saad',
    username: 'Saad Mahmood',
    shortName: 'Saad',
    handle: '@saad.host',
    avatarUrl:
      'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 23,
    countryLabel: 'Pakistan',
    bio: 'Tech chat, gear tips, and creator onboarding hangouts.',
  },
  host_rabia: {
    hostId: 'host_rabia',
    username: 'Rabia Aslam',
    shortName: 'Rabia',
    handle: '@rabia.voice',
    avatarUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 18,
    countryLabel: 'Malaysia',
    bio: 'Language exchange party rooms and casual chats.',
  },
  host_taha: {
    hostId: 'host_taha',
    username: 'Taha Siddiq',
    shortName: 'Taha',
    handle: '@taha.chill',
    avatarUrl:
      'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 17,
    countryLabel: 'Canada',
    bio: 'Late-night chill radio and community shoutouts.',
  },
};

interface RankingRowSeed {
  hostId: string;
  points: number;
  movement: HostRankingEntry['movement'];
  movementDelta: number;
}

function buildPeriodEntries(period: RankingPeriod, seeds: RankingRowSeed[]): HostRankingEntry[] {
  return seeds.map((seed, index) => {
    const profile = BASE_HOSTS[seed.hostId];
    return {
      ...profile,
      id: `${period}_${seed.hostId}`,
      rank: index + 1,
      points: seed.points,
      movement: seed.movement,
      movementDelta: seed.movementDelta,
    };
  });
}

const DAILY_SEEDS: RankingRowSeed[] = [
  { hostId: 'host_ayesha', points: 9800, movement: 'up', movementDelta: 1 },
  { hostId: 'host_mina', points: 8420, movement: 'down', movementDelta: 1 },
  { hostId: 'host_sara', points: 7910, movement: 'up', movementDelta: 2 },
  { hostId: 'host_hamza', points: 7250, movement: 'same', movementDelta: 0 },
  { hostId: 'host_zara', points: 6840, movement: 'up', movementDelta: 3 },
  { hostId: 'host_zaid', points: 6490, movement: 'down', movementDelta: 2 },
  { hostId: 'host_hira', points: 6120, movement: 'up', movementDelta: 1 },
  { hostId: 'host_bilal', points: 5830, movement: 'new', movementDelta: 0 },
  { hostId: 'host_maham', points: 5490, movement: 'down', movementDelta: 1 },
  { hostId: 'host_anaya', points: 5180, movement: 'up', movementDelta: 4 },
  { hostId: 'host_usman', points: 4860, movement: 'same', movementDelta: 0 },
  { hostId: 'host_noor', points: 4540, movement: 'up', movementDelta: 2 },
  { hostId: 'host_farhan', points: 4210, movement: 'down', movementDelta: 3 },
  { hostId: 'host_iqra', points: 3960, movement: 'up', movementDelta: 1 },
  { hostId: 'host_danish', points: 3680, movement: 'same', movementDelta: 0 },
  { hostId: 'host_sana', points: 3420, movement: 'up', movementDelta: 2 },
  { hostId: 'host_omer', points: 3190, movement: 'down', movementDelta: 2 },
  { hostId: 'host_saad', points: 2940, movement: 'new', movementDelta: 0 },
  { hostId: 'host_kiran', points: 2710, movement: 'same', movementDelta: 0 },
  { hostId: 'host_ali', points: 2520, movement: 'up', movementDelta: 1 },
  { hostId: 'host_rabia', points: 2330, movement: 'down', movementDelta: 1 },
  { hostId: 'host_taha', points: 2140, movement: 'same', movementDelta: 0 },
];

const WEEKLY_SEEDS: RankingRowSeed[] = [
  { hostId: 'host_mina', points: 54600, movement: 'up', movementDelta: 1 },
  { hostId: 'host_hamza', points: 49300, movement: 'up', movementDelta: 2 },
  { hostId: 'host_zaid', points: 45800, movement: 'down', movementDelta: 2 },
  { hostId: 'host_ayesha', points: 42150, movement: 'up', movementDelta: 2 },
  { hostId: 'host_sara', points: 39900, movement: 'same', movementDelta: 0 },
  { hostId: 'host_hira', points: 37450, movement: 'up', movementDelta: 3 },
  { hostId: 'host_zara', points: 35200, movement: 'down', movementDelta: 1 },
  { hostId: 'host_anaya', points: 33100, movement: 'up', movementDelta: 2 },
  { hostId: 'host_bilal', points: 30950, movement: 'down', movementDelta: 2 },
  { hostId: 'host_maham', points: 28800, movement: 'same', movementDelta: 0 },
  { hostId: 'host_noor', points: 26750, movement: 'up', movementDelta: 3 },
  { hostId: 'host_usman', points: 24900, movement: 'down', movementDelta: 1 },
  { hostId: 'host_iqra', points: 23100, movement: 'new', movementDelta: 0 },
  { hostId: 'host_sana', points: 21400, movement: 'up', movementDelta: 1 },
  { hostId: 'host_farhan', points: 19850, movement: 'down', movementDelta: 2 },
  { hostId: 'host_danish', points: 18200, movement: 'same', movementDelta: 0 },
  { hostId: 'host_saad', points: 16900, movement: 'up', movementDelta: 2 },
  { hostId: 'host_omer', points: 15450, movement: 'down', movementDelta: 1 },
  { hostId: 'host_ali', points: 14100, movement: 'up', movementDelta: 1 },
  { hostId: 'host_kiran', points: 12950, movement: 'same', movementDelta: 0 },
  { hostId: 'host_taha', points: 11800, movement: 'new', movementDelta: 0 },
  { hostId: 'host_rabia', points: 10650, movement: 'down', movementDelta: 2 },
];

const MONTHLY_SEEDS: RankingRowSeed[] = [
  { hostId: 'host_zaid', points: 188500, movement: 'up', movementDelta: 1 },
  { hostId: 'host_sara', points: 169200, movement: 'up', movementDelta: 2 },
  { hostId: 'host_mina', points: 154900, movement: 'down', movementDelta: 2 },
  { hostId: 'host_hira', points: 141300, movement: 'up', movementDelta: 1 },
  { hostId: 'host_hamza', points: 132750, movement: 'down', movementDelta: 1 },
  { hostId: 'host_bilal', points: 124600, movement: 'new', movementDelta: 0 },
  { hostId: 'host_ayesha', points: 118400, movement: 'down', movementDelta: 1 },
  { hostId: 'host_anaya', points: 111200, movement: 'up', movementDelta: 3 },
  { hostId: 'host_zara', points: 104850, movement: 'same', movementDelta: 0 },
  { hostId: 'host_maham', points: 98400, movement: 'up', movementDelta: 1 },
  { hostId: 'host_noor', points: 91700, movement: 'down', movementDelta: 2 },
  { hostId: 'host_iqra', points: 85300, movement: 'up', movementDelta: 2 },
  { hostId: 'host_usman', points: 79900, movement: 'down', movementDelta: 1 },
  { hostId: 'host_sana', points: 74200, movement: 'same', movementDelta: 0 },
  { hostId: 'host_farhan', points: 68800, movement: 'down', movementDelta: 3 },
  { hostId: 'host_saad', points: 63500, movement: 'up', movementDelta: 2 },
  { hostId: 'host_danish', points: 58900, movement: 'same', movementDelta: 0 },
  { hostId: 'host_omer', points: 54100, movement: 'down', movementDelta: 1 },
  { hostId: 'host_kiran', points: 49600, movement: 'up', movementDelta: 1 },
  { hostId: 'host_ali', points: 45200, movement: 'new', movementDelta: 0 },
  { hostId: 'host_rabia', points: 41300, movement: 'same', movementDelta: 0 },
  { hostId: 'host_taha', points: 37800, movement: 'down', movementDelta: 2 },
];

export function createInitialRankingsByPeriod(): Record<RankingPeriod, PeriodRankingDataset> {
  return {
    daily: {
      period: 'daily',
      label: 'Daily Rankings',
      periodWindowLabel: 'Today · Sample daily leaderboard',
      entries: buildPeriodEntries('daily', DAILY_SEEDS),
    },
    weekly: {
      period: 'weekly',
      label: 'Weekly Rankings',
      periodWindowLabel: 'This Week · Sample 7-day leaderboard',
      entries: buildPeriodEntries('weekly', WEEKLY_SEEDS),
    },
    monthly: {
      period: 'monthly',
      label: 'Monthly Rankings',
      periodWindowLabel: 'This Month · Sample monthly leaderboard',
      entries: buildPeriodEntries('monthly', MONTHLY_SEEDS),
    },
  };
}

export function formatShortPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return points.toLocaleString('en-US');
}

export function formatFullPoints(points: number): string {
  return `${points.toLocaleString('en-US')} pts`;
}
