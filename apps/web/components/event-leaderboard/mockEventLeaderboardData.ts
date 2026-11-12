import { EventParticipantRecord, EventRecord, EventStatus } from './types';

export const CURRENT_EVENT_PARTICIPANT_ID = 'ev_part_ayesha';

function makeBannerSvg(_title: string, _subtitle: string, accentHex: string, secondaryHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 420" width="1200" height="420" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#190836"/>
        <stop offset="52%" stop-color="${accentHex}" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="#0D031B"/>
      </linearGradient>
      <radialGradient id="glowCenter" cx="50%" cy="46%" r="52%">
        <stop offset="0%" stop-color="${secondaryHex}" stop-opacity="0.48"/>
        <stop offset="100%" stop-color="${secondaryHex}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glowLeft" cx="18%" cy="72%" r="36%">
        <stop offset="0%" stop-color="${accentHex}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="${accentHex}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="420" fill="#120624"/>
    <rect width="1200" height="420" fill="url(#bg)"/>
    <rect width="1200" height="420" fill="url(#glowCenter)"/>
    <rect width="1200" height="420" fill="url(#glowLeft)"/>
    <circle cx="600" cy="195" r="145" fill="none" stroke="${secondaryHex}" stroke-opacity="0.22" stroke-width="2"/>
    <circle cx="600" cy="195" r="96" fill="${accentHex}" fill-opacity="0.14" stroke="${accentHex}" stroke-opacity="0.45" stroke-width="2"/>
    <path d="M600 132 L617 170 L659 175 L628 204 L636 246 L600 225 L564 246 L572 204 L541 175 L583 170 Z" fill="#FCD34D" fill-opacity="0.92"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

interface ParticipantBase {
  participantId: string;
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

const BASE_PARTICIPANTS: ParticipantBase[] = [
  {
    participantId: 'ev_part_ayesha',
    username: 'Ayesha Khan',
    shortName: 'Ayesha',
    handle: '@ayesha.live',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 42,
    countryLabel: 'Pakistan',
    bio: 'Acoustic stage creator and evening community host featured in sample event spotlights.',
    isCurrentUser: true,
  },
  {
    participantId: 'ev_part_hamza',
    username: 'Hamza Ali',
    shortName: 'Hamza',
    handle: '@hamza.stage',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 36,
    countryLabel: 'Pakistan',
    bio: 'Creator talk shows and interactive audience quizzes.',
  },
  {
    participantId: 'ev_part_mina',
    username: 'Mina Noor',
    shortName: 'Mina',
    handle: '@mina.noor',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 48,
    countryLabel: 'Pakistan',
    bio: 'Vocal covers and special festival live rooms.',
  },
  {
    participantId: 'ev_part_sara',
    username: 'Sara Ali',
    shortName: 'Sara',
    handle: '@sara.voice',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 39,
    countryLabel: 'UAE',
    bio: 'Community panel moderator and party room host.',
  },
  {
    participantId: 'ev_part_zara',
    username: 'Zara Noor',
    shortName: 'Zara',
    handle: '@zara.vibes',
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 31,
    countryLabel: 'UK',
    bio: 'Lifestyle showcases and fan challenge rooms.',
  },
  {
    participantId: 'ev_part_zaid',
    username: 'Zaid Star',
    shortName: 'Zaid',
    handle: '@zaid.star',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 65,
    countryLabel: 'Saudi Arabia',
    bio: 'High-energy music curator and festival host.',
  },
  {
    participantId: 'ev_part_hira',
    username: 'Hira Malik',
    shortName: 'Hira',
    handle: '@hira.melody',
    avatarUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 34,
    countryLabel: 'Pakistan',
    bio: 'Indie song nights and live acoustic sets.',
  },
  {
    participantId: 'ev_part_bilal',
    username: 'Bilal Raza',
    shortName: 'Bilal',
    handle: '@bilal.live',
    avatarUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 28,
    countryLabel: 'UAE',
    bio: 'Gaming co-streams and weekend challenge rooms.',
  },
  {
    participantId: 'ev_part_maham',
    username: 'Maham Tariq',
    shortName: 'Maham',
    handle: '@maham.chat',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 29,
    countryLabel: 'Pakistan',
    bio: 'Sketching showcases and chill evening hangouts.',
  },
  {
    participantId: 'ev_part_anaya',
    username: 'Anaya Siddiqui',
    shortName: 'Anaya',
    handle: '@anaya.glow',
    avatarUrl:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 33,
    countryLabel: 'UK',
    bio: 'Beauty lounges and creator community spotlights.',
  },
  {
    participantId: 'ev_part_usman',
    username: 'Usman Qureshi',
    shortName: 'Usman',
    handle: '@usman.beats',
    avatarUrl:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 26,
    countryLabel: 'Canada',
    bio: 'Live DJ mixes and audio room sessions.',
  },
  {
    participantId: 'ev_part_noor',
    username: 'Noor Fatima',
    shortName: 'Noor',
    handle: '@noor.fatima',
    avatarUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 27,
    countryLabel: 'Malaysia',
    bio: 'Acoustic sessions and tea chat showcases.',
  },
  {
    participantId: 'ev_part_farhan',
    username: 'Farhan Sheikh',
    shortName: 'Farhan',
    handle: '@farhan.mic',
    avatarUrl:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 24,
    countryLabel: 'Pakistan',
    bio: 'Poetry open-mic shows and storytelling nights.',
  },
  {
    participantId: 'ev_part_iqra',
    username: 'Iqra Javed',
    shortName: 'Iqra',
    handle: '@iqra.live',
    avatarUrl:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 30,
    countryLabel: 'Pakistan',
    bio: 'Recipe corners and weekend baking challenges.',
  },
  {
    participantId: 'ev_part_danish',
    username: 'Danish Iqbal',
    shortName: 'Danish',
    handle: '@danish.arena',
    avatarUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 22,
    countryLabel: 'Qatar',
    bio: 'Community trivia and match watch-along chat.',
  },
  {
    participantId: 'ev_part_sana',
    username: 'Sana Mir',
    shortName: 'Sana',
    handle: '@sana.studio',
    avatarUrl:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 25,
    countryLabel: 'Pakistan',
    bio: 'Book club evenings and study rooms.',
  },
  {
    participantId: 'ev_part_omer',
    username: 'Omer Farooq',
    shortName: 'Omer',
    handle: '@omer.streams',
    avatarUrl:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 21,
    countryLabel: 'UAE',
    bio: 'Travel stories and city walk broadcasts.',
  },
  {
    participantId: 'ev_part_saad',
    username: 'Saad Mahmood',
    shortName: 'Saad',
    handle: '@saad.host',
    avatarUrl:
      'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=180&auto=format&fit=crop&q=80',
    verified: true,
    level: 23,
    countryLabel: 'Pakistan',
    bio: 'Creator tips and onboarding live sessions.',
  },
  {
    participantId: 'ev_part_kiran',
    username: 'Kiran Zahra',
    shortName: 'Kiran',
    handle: '@kiran.zahra',
    avatarUrl:
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 20,
    countryLabel: 'UK',
    bio: 'Creative crafts and calm music sessions.',
  },
  {
    participantId: 'ev_part_ali',
    username: 'Ali Hassan',
    shortName: 'Ali',
    handle: '@ali.hassan',
    avatarUrl:
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 19,
    countryLabel: 'Saudi Arabia',
    bio: 'Evening casual Q&A and group voice streams.',
  },
  {
    participantId: 'ev_part_rabia',
    username: 'Rabia Aslam',
    shortName: 'Rabia',
    handle: '@rabia.voice',
    avatarUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 18,
    countryLabel: 'Malaysia',
    bio: 'Language exchange rooms and storytelling.',
  },
  {
    participantId: 'ev_part_taha',
    username: 'Taha Siddiq',
    shortName: 'Taha',
    handle: '@taha.chill',
    avatarUrl:
      'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=180&auto=format&fit=crop&q=80',
    verified: false,
    level: 17,
    countryLabel: 'Canada',
    bio: 'Chill radio broadcasts and shoutouts.',
  },
];

function buildParticipantsForEvent(
  eventId: string,
  status: EventStatus,
  orderedPoints: Array<{ participantIndex: number; points: number; movement: EventParticipantRecord['movement']; delta: number }>
): EventParticipantRecord[] {
  const participationStatus: EventParticipantRecord['participationStatus'] =
    status === 'live' ? 'Active' : status === 'upcoming' ? 'Registered' : 'Finalized';

  const sorted = [...orderedPoints].sort((a, b) => b.points - a.points);

  return sorted.map((row, index) => {
    const base = BASE_PARTICIPANTS[row.participantIndex];
    return {
      ...base,
      id: `${eventId}_${base.participantId}`,
      rank: index + 1,
      eventPoints: row.points,
      movement: row.movement,
      movementDelta: row.delta,
      participationStatus,
    };
  });
}

const FEATURED_STAR_CHALLENGE_POINTS = [
  { participantIndex: 0, points: 24500, movement: 'up' as const, delta: 2 },
  { participantIndex: 1, points: 21300, movement: 'up' as const, delta: 1 },
  { participantIndex: 2, points: 18900, movement: 'down' as const, delta: 1 },
  { participantIndex: 3, points: 16750, movement: 'up' as const, delta: 3 },
  { participantIndex: 4, points: 14200, movement: 'same' as const, delta: 0 },
  { participantIndex: 5, points: 13450, movement: 'down' as const, delta: 2 },
  { participantIndex: 6, points: 12600, movement: 'up' as const, delta: 1 },
  { participantIndex: 7, points: 11850, movement: 'new' as const, delta: 0 },
  { participantIndex: 8, points: 11100, movement: 'same' as const, delta: 0 },
  { participantIndex: 9, points: 10350, movement: 'up' as const, delta: 2 },
  { participantIndex: 10, points: 9640, movement: 'down' as const, delta: 1 },
  { participantIndex: 11, points: 8920, movement: 'up' as const, delta: 1 },
  { participantIndex: 12, points: 8250, movement: 'down' as const, delta: 3 },
  { participantIndex: 13, points: 7680, movement: 'up' as const, delta: 2 },
  { participantIndex: 14, points: 7120, movement: 'same' as const, delta: 0 },
  { participantIndex: 15, points: 6540, movement: 'new' as const, delta: 0 },
  { participantIndex: 16, points: 5980, movement: 'down' as const, delta: 1 },
  { participantIndex: 17, points: 5420, movement: 'up' as const, delta: 2 },
  { participantIndex: 18, points: 4890, movement: 'same' as const, delta: 0 },
  { participantIndex: 19, points: 4310, movement: 'down' as const, delta: 2 },
  { participantIndex: 20, points: 3780, movement: 'up' as const, delta: 1 },
  { participantIndex: 21, points: 3240, movement: 'same' as const, delta: 0 },
];

const ACOUSTIC_WEEK_POINTS = [
  { participantIndex: 2, points: 19400, movement: 'up' as const, delta: 1 },
  { participantIndex: 6, points: 17650, movement: 'up' as const, delta: 2 },
  { participantIndex: 0, points: 15820, movement: 'down' as const, delta: 1 },
  { participantIndex: 11, points: 14100, movement: 'up' as const, delta: 3 },
  { participantIndex: 3, points: 12850, movement: 'same' as const, delta: 0 },
  { participantIndex: 1, points: 11640, movement: 'down' as const, delta: 2 },
  { participantIndex: 9, points: 10900, movement: 'up' as const, delta: 1 },
  { participantIndex: 5, points: 9850, movement: 'down' as const, delta: 2 },
  { participantIndex: 13, points: 9120, movement: 'new' as const, delta: 0 },
  { participantIndex: 4, points: 8460, movement: 'same' as const, delta: 0 },
  { participantIndex: 8, points: 7820, movement: 'up' as const, delta: 1 },
  { participantIndex: 7, points: 7210, movement: 'down' as const, delta: 1 },
  { participantIndex: 15, points: 6650, movement: 'up' as const, delta: 2 },
  { participantIndex: 10, points: 6120, movement: 'same' as const, delta: 0 },
  { participantIndex: 17, points: 5540, movement: 'new' as const, delta: 0 },
  { participantIndex: 12, points: 4980, movement: 'down' as const, delta: 2 },
  { participantIndex: 14, points: 4460, movement: 'same' as const, delta: 0 },
  { participantIndex: 18, points: 3920, movement: 'up' as const, delta: 1 },
  { participantIndex: 16, points: 3410, movement: 'down' as const, delta: 1 },
  { participantIndex: 20, points: 2980, movement: 'same' as const, delta: 0 },
  { participantIndex: 19, points: 2540, movement: 'up' as const, delta: 1 },
  { participantIndex: 21, points: 2110, movement: 'same' as const, delta: 0 },
];

const WINTER_GALA_POINTS = [
  { participantIndex: 5, points: 4800, movement: 'new' as const, delta: 0 },
  { participantIndex: 2, points: 4350, movement: 'new' as const, delta: 0 },
  { participantIndex: 3, points: 3920, movement: 'new' as const, delta: 0 },
  { participantIndex: 1, points: 3480, movement: 'new' as const, delta: 0 },
  { participantIndex: 0, points: 3150, movement: 'new' as const, delta: 0 },
  { participantIndex: 9, points: 2820, movement: 'new' as const, delta: 0 },
  { participantIndex: 6, points: 2540, movement: 'new' as const, delta: 0 },
  { participantIndex: 4, points: 2290, movement: 'new' as const, delta: 0 },
  { participantIndex: 8, points: 2050, movement: 'new' as const, delta: 0 },
  { participantIndex: 7, points: 1840, movement: 'new' as const, delta: 0 },
  { participantIndex: 11, points: 1620, movement: 'new' as const, delta: 0 },
  { participantIndex: 10, points: 1410, movement: 'new' as const, delta: 0 },
  { participantIndex: 13, points: 1240, movement: 'new' as const, delta: 0 },
  { participantIndex: 15, points: 1090, movement: 'new' as const, delta: 0 },
  { participantIndex: 12, points: 960, movement: 'new' as const, delta: 0 },
  { participantIndex: 17, points: 830, movement: 'new' as const, delta: 0 },
  { participantIndex: 14, points: 710, movement: 'new' as const, delta: 0 },
  { participantIndex: 16, points: 590, movement: 'new' as const, delta: 0 },
  { participantIndex: 18, points: 480, movement: 'new' as const, delta: 0 },
  { participantIndex: 19, points: 370, movement: 'new' as const, delta: 0 },
  { participantIndex: 20, points: 260, movement: 'new' as const, delta: 0 },
  { participantIndex: 21, points: 150, movement: 'new' as const, delta: 0 },
];

const AUTUMN_CUP_POINTS = [
  { participantIndex: 1, points: 31200, movement: 'up' as const, delta: 1 },
  { participantIndex: 5, points: 28450, movement: 'down' as const, delta: 1 },
  { participantIndex: 2, points: 25600, movement: 'up' as const, delta: 2 },
  { participantIndex: 0, points: 22900, movement: 'same' as const, delta: 0 },
  { participantIndex: 3, points: 20450, movement: 'up' as const, delta: 1 },
  { participantIndex: 9, points: 18100, movement: 'down' as const, delta: 2 },
  { participantIndex: 6, points: 16300, movement: 'up' as const, delta: 1 },
  { participantIndex: 4, points: 14750, movement: 'same' as const, delta: 0 },
  { participantIndex: 7, points: 13200, movement: 'down' as const, delta: 1 },
  { participantIndex: 8, points: 11850, movement: 'up' as const, delta: 2 },
  { participantIndex: 10, points: 10600, movement: 'same' as const, delta: 0 },
  { participantIndex: 11, points: 9420, movement: 'down' as const, delta: 2 },
  { participantIndex: 13, points: 8390, movement: 'up' as const, delta: 1 },
  { participantIndex: 12, points: 7410, movement: 'same' as const, delta: 0 },
  { participantIndex: 15, points: 6580, movement: 'down' as const, delta: 1 },
  { participantIndex: 14, points: 5790, movement: 'up' as const, delta: 2 },
  { participantIndex: 17, points: 5120, movement: 'same' as const, delta: 0 },
  { participantIndex: 16, points: 4490, movement: 'down' as const, delta: 2 },
  { participantIndex: 18, points: 3860, movement: 'same' as const, delta: 0 },
  { participantIndex: 19, points: 3250, movement: 'up' as const, delta: 1 },
  { participantIndex: 20, points: 2680, movement: 'down' as const, delta: 1 },
  { participantIndex: 21, points: 2150, movement: 'same' as const, delta: 0 },
];

export function createInitialEventLeaderboardRecords(): EventRecord[] {
  const starParticipants = buildParticipantsForEvent(
    'evt_star_creator',
    'live',
    FEATURED_STAR_CHALLENGE_POINTS
  );
  const acousticParticipants = buildParticipantsForEvent(
    'evt_acoustic_week',
    'live',
    ACOUSTIC_WEEK_POINTS
  );
  const galaParticipants = buildParticipantsForEvent(
    'evt_winter_gala',
    'upcoming',
    WINTER_GALA_POINTS
  );
  const cupParticipants = buildParticipantsForEvent(
    'evt_autumn_cup',
    'completed',
    AUTUMN_CUP_POINTS
  );

  const sumPoints = (list: EventParticipantRecord[]) =>
    list.reduce((acc, item) => acc + item.eventPoints, 0);

  return [
    {
      id: 'evt_star_creator',
      title: 'Star Creator Challenge',
      category: 'Creator Showcase',
      shortDescription:
        'Sample live creator event spotlighting community rooms and interactive host showcases.',
      fullDescription:
        'Star Creator Challenge is a sample Popo Live creator showcase used to preview event information cards, participant standings, and leaderboard filtering in frontend state.',
      bannerImageUrl: makeBannerSvg(
        'Star Creator Challenge',
        'Featured Live Creator Event Preview',
        '#FF1A6C',
        '#F59E0B'
      ),
      startDate: 'Nov 10, 2026',
      endDate: 'Nov 18, 2026',
      periodLabel: 'Event period · Sample event',
      status: 'live',
      featured: true,
      participantCount: starParticipants.length,
      totalEventPoints: sumPoints(starParticipants),
      rules: [
        'Placeholder Rule 1: Event listings and participant scores shown here are sample frontend preview values.',
        'Placeholder Rule 2: Participants appear ordered by sample event points without invoking real live tracking.',
        'Placeholder Rule 3: Official Popo Live event policies and eligibility terms are managed outside this preview.',
      ],
      participants: starParticipants,
    },
    {
      id: 'evt_acoustic_week',
      title: 'Golden Mic Acoustic Week',
      category: 'Music & Voice',
      shortDescription:
        'Sample themed music week highlighting acoustic performances and evening Q&A sessions.',
      fullDescription:
        'A separate sample live event dataset demonstrating multi-event switching, distinct participant scores, and independent My Event Ranking position updates.',
      bannerImageUrl: makeBannerSvg(
        'Golden Mic Acoustic Week',
        'Music & Voice Live Event Preview',
        '#9333EA',
        '#FF2E74'
      ),
      startDate: 'Nov 11, 2026',
      endDate: 'Nov 17, 2026',
      periodLabel: 'Nov 11 – Nov 17 · Sample live event',
      status: 'live',
      featured: false,
      participantCount: acousticParticipants.length,
      totalEventPoints: sumPoints(acousticParticipants),
      rules: [
        'Placeholder Rule 1: All music event figures are demonstration values for UI verification.',
        'Placeholder Rule 2: No official gift counting, audio scoring, or cash rewards are calculated here.',
      ],
      participants: acousticParticipants,
    },
    {
      id: 'evt_winter_gala',
      title: 'Winter Community Gala',
      category: 'Seasonal Spotlight',
      shortDescription:
        'Upcoming seasonal community event preview with pre-registered host participants.',
      fullDescription:
        'Winter Community Gala illustrates the Upcoming event status in Popo Live with placeholder schedule details and registered sample participants.',
      bannerImageUrl: makeBannerSvg(
        'Winter Community Gala',
        'Upcoming Seasonal Event Preview',
        '#3B82F6',
        '#A855F7'
      ),
      startDate: 'Nov 22, 2026',
      endDate: 'Nov 30, 2026',
      periodLabel: 'Starts Nov 22 · Sample upcoming event',
      status: 'upcoming',
      featured: false,
      participantCount: galaParticipants.length,
      totalEventPoints: sumPoints(galaParticipants),
      rules: [
        'Placeholder Rule 1: Upcoming event registration counts and starter points are local demo fixtures.',
        'Placeholder Rule 2: Dates and schedules shown are non-binding UI preview metadata.',
      ],
      participants: galaParticipants,
    },
    {
      id: 'evt_autumn_cup',
      title: 'Autumn Creators Cup',
      category: 'Community Event',
      shortDescription:
        'Completed creator event archive showing finalized leaderboard standings.',
      fullDescription:
        'Autumn Creators Cup demonstrates Completed event history with archived standings, finalized participant status badges, and retrospective leaderboard inspection.',
      bannerImageUrl: makeBannerSvg(
        'Autumn Creators Cup',
        'Completed Event Archive Preview',
        '#10B981',
        '#F59E0B'
      ),
      startDate: 'Oct 24, 2026',
      endDate: 'Oct 31, 2026',
      periodLabel: 'Oct 24 – Oct 31 · Completed archive',
      status: 'completed',
      featured: false,
      participantCount: cupParticipants.length,
      totalEventPoints: sumPoints(cupParticipants),
      rules: [
        'Placeholder Rule 1: Completed event archive points represent closed demo records only.',
        'Placeholder Rule 2: Historical archive does not imply wallet credits or payout distributions.',
      ],
      participants: cupParticipants,
    },
  ];
}

export function formatEventPoints(points: number): string {
  return `${points.toLocaleString('en-US')} points`;
}

export function formatShortEventPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return points.toLocaleString('en-US');
}
