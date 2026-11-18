// ==============================================================================
// POPO LIVE — WEB DESIGN FIXTURES (PHASE 1 - D0 - PROMPT 2)
// Path: apps/web/lib/design/designFixtures.ts
//
// Complete parity with Mobile Design Fixtures (apps/mobile/lib/design/design_fixtures.dart)
// Clean, strongly-typed design fixtures for offline UI development,
// visual inspection, state previews, and web component testing.
//
// Fictional test data: Amina Noor, Sana Ali, Karachi Nights, and peers.
// ==============================================================================

/**
 * Selectable design states for UI prototyping and acceptance testing.
 */
export type DesignFixtureState = 'filled' | 'empty' | 'error';

/**
 * ============================================================================
 * STATE SWITCH CONTROLLER
 * Change activeDesignFixtureState below to toggle the design mode globally.
 * ============================================================================
 */
export const activeDesignFixtureState: DesignFixtureState = 'filled';

/**
 * Error thrown when accessing fixtures in the 'error' state.
 */
export class DesignFixtureError extends Error {
  public readonly code: string;

  constructor(message: string, code = 'FIXTURE_SIMULATED_ERROR') {
    super(`DesignFixtureError [${code}]: ${message}`);
    this.name = 'DesignFixtureError';
    this.code = code;
  }
}

// ----------------------------------------------------------------------------
// INTERFACES (Full Parity with Mobile Data Classes)
// ----------------------------------------------------------------------------

export interface FixtureUserProfile {
  userId: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
  gender: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  wealthLevel: number;
  hostLevel: number;
  vipLevel: number;
  followingCount: number;
  followersCount: number;
  friendsCount: number;
  visitorCount: number;
  isHostEligible: boolean;
  isLiveNow: boolean;
  currentLiveRoomId?: string;
}

export interface FixtureLiveChatMessage {
  id: string;
  senderNickname: string;
  senderAvatar: string;
  senderLevel: number;
  isVip: boolean;
  content: string;
  timestamp: string;
}

export interface FixtureLiveViewer {
  roomId: string;
  roomNumber: string;
  title: string;
  host: FixtureUserProfile;
  streamUrl: string;
  agoraChannelId: string;
  agoraToken: string;
  viewerCount: number;
  totalLikes: number;
  roomDiamonds: number;
  isLive: boolean;
  category: string;
  country: string;
  countryCode: string;
  activeSeatCount: number;
  pinnedAnnouncement: string;
  topContributors: FixtureUserProfile[];
  recentChatMessages: FixtureLiveChatMessage[];
}

export interface FixtureLiveRoom {
  id: string;
  roomNumber: string;
  title: string;
  hostNickname: string;
  hostAvatar: string;
  coverUrl: string;
  category: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  viewerCount: number;
  heatScore: number;
  isLive: boolean;
  isPkActive: boolean;
  tags: string[];
}

export interface FixturePartySeat {
  index: number;
  userId: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  isHost: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  giftPoints: number;
  isOccupied: boolean;
}

export interface FixturePartyRoom {
  id: string;
  roomNumber: string;
  title: string;
  hostNickname: string;
  category: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  maxSeats: number;
  occupiedSeatCount: number;
  seats: FixturePartySeat[];
}

export interface FixtureChatThread {
  threadId: string;
  peerUserId: string;
  peerNickname: string;
  peerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface FixtureOfficialNotice {
  id: string;
  category: string;
  badgeLabel: string;
  title: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  isUrgent: boolean;
}

export interface FixtureWalletTransaction {
  id: string;
  type: string;
  description: string;
  amount: string;
  timestamp: string;
  isCredit: boolean;
}

export interface FixtureWallet {
  coinBalance: number;
  pointsBalance: number;
  withdrawableUsd: number;
  diamondValue: number;
  currencySymbol: string;
  exchangeRateFormatted: string;
  recentTransactions: FixtureWalletTransaction[];
}

export interface FixtureVipPrivilege {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface FixtureVipPlan {
  tierLevel: number;
  tierName: string;
  isActive: boolean;
  expiryDate: string;
  daysRemaining: number;
  progressPercentage: number;
  pointsToNextTier: number;
  badgeAsset: string;
  privileges: FixtureVipPrivilege[];
}

export interface FixtureMedal {
  id: string;
  name: string;
  category: string;
  rarity: string;
  iconEmoji: string;
  description: string;
  isUnlocked: boolean;
  unlockedDate: string;
}

export interface FixtureFanClubMember {
  userId: string;
  nickname: string;
  avatarUrl: string;
  intimacyLevel: number;
  rank: number;
  joinedDaysAgo: number;
}

export interface FixtureFanClub {
  id: string;
  clubName: string;
  hostNickname: string;
  hostAvatar: string;
  badgeTag: string;
  clubLevel: number;
  memberCount: number;
  dailyIntimacyPoints: number;
  description: string;
  topMembers: FixtureFanClubMember[];
}

export interface FixtureGuardian {
  id: string;
  rank: number;
  tierName: string;
  guardianNickname: string;
  guardianAvatar: string;
  shieldIconEmoji: string;
  contributionPoints: number;
  daysRemaining: number;
  privilegeSummary: string;
}

export interface FixtureRedeemCode {
  code: string;
  isValid: boolean;
  coinReward: number;
  bonusItem: string | null;
  message: string;
}

export interface FixtureTask {
  id: string;
  title: string;
  rewardText: string;
  currentProgress: number;
  targetGoal: number;
  unit: string;
  status: string;
  isClaimed: boolean;
}

export interface FixtureHostRanking {
  rank: number;
  hostNickname: string;
  avatarUrl: string;
  diamondsEarned: number;
  country: string;
  countryFlag: string;
  level: number;
}

export interface FixtureStoreItem {
  id: string;
  title: string;
  category: string;
  priceCoins: number;
  validityDays: number;
  previewImage: string;
  isHot: boolean;
}

export interface FixtureBagItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  isEquipped: boolean;
  expiresInText: string;
}

export interface FixtureAgency {
  agencyId: string;
  agencyCode: string;
  agencyName: string;
  agentLeader: string;
  contactPhone: string;
  registeredCity: string;
  totalActiveHosts: number;
  monthlyDiamondVolume: number;
  commissionTierPercentage: number;
  settlementStatus: string;
  announcement: string;
}

export interface FixtureHelpTopic {
  id: string;
  category: string;
  question: string;
  answer: string;
}

// ----------------------------------------------------------------------------
// DATA REPOSITORY IMPLEMENTATION (Mirror of Dart DesignFixtures)
// ----------------------------------------------------------------------------

export class DesignFixtures {
  /**
   * Mutable runtime state switch. Initialized from [activeDesignFixtureState].
   */
  public static currentState: DesignFixtureState = activeDesignFixtureState;

  public static get isFilled(): boolean {
    return this.currentState === 'filled';
  }

  public static get isEmpty(): boolean {
    return this.currentState === 'empty';
  }

  public static get isError(): boolean {
    return this.currentState === 'error';
  }

  public static setState(state: DesignFixtureState): void {
    this.currentState = state;
  }

  public static reset(): void {
    this.currentState = 'filled';
  }

  // --------------------------------------------------------------------------
  // 1. USER PROFILES
  // --------------------------------------------------------------------------
  public static get currentUserProfile(): FixtureUserProfile {
    if (this.isError) {
      throw new DesignFixtureError(
        'Failed to load user profile: Service temporarily unavailable [ERR_503]',
        'ERR_503'
      );
    }
    if (this.isEmpty) {
      return {
        userId: '',
        poppoId: '',
        nickname: 'Guest User',
        avatarUrl: '',
        bio: '',
        gender: 'unspecified',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        wealthLevel: 1,
        hostLevel: 1,
        vipLevel: 0,
        followingCount: 0,
        followersCount: 0,
        friendsCount: 0,
        visitorCount: 0,
        isHostEligible: false,
        isLiveNow: false,
      };
    }
    return this.profileAminaNoor;
  }

  public static get userProfiles(): FixtureUserProfile[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Failed to query user profiles list [ERR_500]',
        'ERR_500'
      );
    }
    if (this.isEmpty) return [];
    return [
      this.profileAminaNoor,
      this.profileSanaAli,
      this.profileBilalAhmed,
      this.profileZainabKhan,
      this.profileHamzaTariq,
      this.profileHiraMalik,
    ];
  }

  // --------------------------------------------------------------------------
  // 2. LIVE VIEWER
  // --------------------------------------------------------------------------
  public static get liveViewer(): FixtureLiveViewer {
    if (this.isError) {
      throw new DesignFixtureError(
        'Live stream connection refused: Agora channel timeout [ERR_RTC_408]',
        'ERR_RTC_408'
      );
    }
    if (this.isEmpty) {
      return {
        roomId: '',
        roomNumber: '',
        title: 'Stream Offline',
        host: this.currentUserProfile,
        streamUrl: '',
        agoraChannelId: '',
        agoraToken: '',
        viewerCount: 0,
        totalLikes: 0,
        roomDiamonds: 0,
        isLive: false,
        category: 'General',
        country: 'Pakistan',
        countryCode: 'PK',
        activeSeatCount: 0,
        pinnedAnnouncement: '',
        topContributors: [],
        recentChatMessages: [],
      };
    }
    return {
      roomId: 'live_room_001',
      roomNumber: '883901',
      title: 'Karachi Nights 🎶 Acoustic Live Session',
      host: this.profileAminaNoor,
      streamUrl: 'https://stream.kigolive.com/live/karachi_nights_001.m3u8',
      agoraChannelId: 'room_883901_channel',
      agoraToken: '006appIdTokenSampleAminaNoorKarachiNights883901',
      viewerCount: 1420,
      totalLikes: 89450,
      roomDiamonds: 324000,
      isLive: true,
      category: 'Singing',
      country: 'Pakistan',
      countryCode: 'PK',
      activeSeatCount: 1,
      pinnedAnnouncement: 'Welcome to Karachi Nights! Request songs in the live chat 🎸✨',
      topContributors: [
        this.profileBilalAhmed,
        this.profileFaizanSheikh,
        this.profileTariqJamil,
      ],
      recentChatMessages: [
        {
          id: 'lmsg_01',
          senderNickname: 'Sana Ali',
          senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          senderLevel: 14,
          isVip: true,
          content: 'Sing the acoustic version of Karachi Nights again please! ❤️',
          timestamp: 'Just now',
        },
        {
          id: 'lmsg_02',
          senderNickname: 'Bilal Ahmed',
          senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          senderLevel: 22,
          isVip: true,
          content: 'Sent a Luxury Sports Car 🏎️💨 keep rocking!',
          timestamp: '1m ago',
        },
        {
          id: 'lmsg_03',
          senderNickname: 'Hamza Tariq',
          senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          senderLevel: 9,
          isVip: false,
          content: 'Greetings from Lahore! Brilliant voice Amina.',
          timestamp: '2m ago',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 3. EIGHT (8) LIVE ROOMS
  // --------------------------------------------------------------------------
  public static get liveRooms(): FixtureLiveRoom[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Failed to fetch live broadcast feeds [ERR_GATEWAY_TIMEOUT]',
        'ERR_GATEWAY_TIMEOUT'
      );
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'room_001',
        roomNumber: '883901',
        title: 'Karachi Nights 🎶 Acoustic Live Session',
        hostNickname: 'Amina Noor',
        hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        category: 'Singing',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 1420,
        heatScore: 98500,
        isLive: true,
        isPkActive: false,
        tags: ['Acoustic', 'Karachi', 'Vocals'],
      },
      {
        id: 'room_002',
        roomNumber: '883902',
        title: 'Chai & Midnight Chill Talk ☕🌙',
        hostNickname: 'Sana Ali',
        hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600',
        category: 'ChitChat',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 980,
        heatScore: 64200,
        isLive: true,
        isPkActive: true,
        tags: ['Podcast', 'Chai', 'LateNight'],
      },
      {
        id: 'room_003',
        roomNumber: '883903',
        title: 'Gaming Marathon & Battle Arena 🎮🔥',
        hostNickname: 'Bilal Ahmed',
        hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
        category: 'Gaming',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 1850,
        heatScore: 112000,
        isLive: true,
        isPkActive: false,
        tags: ['Esports', 'Battlefield', 'Action'],
      },
      {
        id: 'room_004',
        roomNumber: '883904',
        title: 'Lahore Beats & Eastern Classical 🪕✨',
        hostNickname: 'Zainab Khan',
        hostAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600',
        category: 'Music',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 740,
        heatScore: 48900,
        isLive: true,
        isPkActive: false,
        tags: ['Classical', 'Sufi', 'Lahore'],
      },
      {
        id: 'room_005',
        roomNumber: '883905',
        title: 'Standup Comedy & Talent Hunt 😂🎭',
        hostNickname: 'Hamza Tariq',
        hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600',
        category: 'Talent',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 620,
        heatScore: 39500,
        isLive: true,
        isPkActive: true,
        tags: ['Comedy', 'Improv', 'Banter'],
      },
      {
        id: 'room_006',
        roomNumber: '883906',
        title: 'Fashion, Style & Glow Up Diary 💄👗',
        hostNickname: 'Hira Malik',
        hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600',
        category: 'Fashion',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 890,
        heatScore: 57400,
        isLive: true,
        isPkActive: false,
        tags: ['Style', 'Trends', 'Beauty'],
      },
      {
        id: 'room_007',
        roomNumber: '883907',
        title: 'Indus Waves: Live Q&A & Poetry 🌊📖',
        hostNickname: 'Faizan Sheikh',
        hostAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600',
        category: 'Literature',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 510,
        heatScore: 31200,
        isLive: true,
        isPkActive: false,
        tags: ['Poetry', 'Shayari', 'Q&A'],
      },
      {
        id: 'room_008',
        roomNumber: '883908',
        title: 'Late Night Sing-Along & Requests 🎤🌙',
        hostNickname: 'Ayesha Siddiqui',
        hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
        category: 'Singing',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 1100,
        heatScore: 78000,
        isLive: true,
        isPkActive: false,
        tags: ['Songs', 'Requests', 'Melody'],
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 4. SIX (6) MULTI-SEAT PARTY ROOMS WITH SEAT FACES
  // --------------------------------------------------------------------------
  public static get partyRooms(): FixturePartyRoom[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Party rooms discovery failed: WebSocket connection lost [ERR_WS_DISCONNECTED]',
        'ERR_WS_DISCONNECTED'
      );
    }
    if (this.isEmpty) return [];

    return [
      this.createPartyRoom(
        'party_001',
        '771001',
        'Karachi Nights Club 🌙 Party Lounge',
        'Amina Noor',
        'ChitChat',
        [
          { index: 1, userId: 'u_amina', nickname: 'Amina Noor', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', isHost: true, isMuted: false, isSpeaking: true, giftPoints: 12500, isOccupied: true },
          { index: 2, userId: 'u_sana', nickname: 'Sana Ali', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', isHost: false, isMuted: false, isSpeaking: false, giftPoints: 8900, isOccupied: true },
          { index: 3, userId: 'u_bilal', nickname: 'Bilal Ahmed', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', isHost: false, isMuted: false, isSpeaking: true, giftPoints: 6400, isOccupied: true },
          { index: 4, userId: 'u_hamza', nickname: 'Hamza Tariq', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', isHost: false, isMuted: true, isSpeaking: false, giftPoints: 4300, isOccupied: true },
          { index: 5, userId: 'u_zainab', nickname: 'Zainab Khan', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', isHost: false, isMuted: false, isSpeaking: false, giftPoints: 3100, isOccupied: true },
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ]
      ),
      this.createPartyRoom(
        'party_002',
        '771002',
        'Music Jam & Acoustic Showcase 🎸',
        'Zainab Khan',
        'Music',
        [
          { index: 1, userId: 'u_zainab', nickname: 'Zainab Khan', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', isHost: true, isMuted: false, isSpeaking: true, giftPoints: 9200, isOccupied: true },
          { index: 2, userId: 'u_faizan', nickname: 'Faizan Sheikh', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', isHost: false, isMuted: false, isSpeaking: false, giftPoints: 5400, isOccupied: true },
          { index: 3, userId: 'u_ayesha', nickname: 'Ayesha Siddiqui', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', isHost: false, isMuted: false, isSpeaking: true, giftPoints: 7800, isOccupied: true },
          this.emptySeat(4),
          this.emptySeat(5),
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ]
      ),
      this.createPartyRoom(
        'party_003',
        '771003',
        'Desi Chai & Gup Shup Circle ☕',
        'Faizan Sheikh',
        'ChitChat',
        [
          { index: 1, userId: 'u_faizan', nickname: 'Faizan Sheikh', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', isHost: true, isMuted: false, isSpeaking: false, giftPoints: 4100, isOccupied: true },
          { index: 2, userId: 'u_sana', nickname: 'Sana Ali', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', isHost: false, isMuted: false, isSpeaking: true, giftPoints: 6700, isOccupied: true },
          { index: 3, userId: 'u_tariq', nickname: 'Tariq Jamil', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', isHost: false, isMuted: false, isSpeaking: false, giftPoints: 3400, isOccupied: true },
          { index: 4, userId: 'u_usman', nickname: 'Usman Raza', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', isHost: false, isMuted: true, isSpeaking: false, giftPoints: 2100, isOccupied: true },
          this.emptySeat(5),
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ]
      ),
      this.createPartyRoom(
        'party_004',
        '771004',
        'Youth Talent & Poetry Open Mic 🎙️',
        'Hira Malik',
        'Talent',
        [
          { index: 1, userId: 'u_hira', nickname: 'Hira Malik', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', isHost: true, isMuted: false, isSpeaking: true, giftPoints: 8300, isOccupied: true },
          { index: 2, userId: 'u_amina', nickname: 'Amina Noor', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', isHost: false, isMuted: false, isSpeaking: false, giftPoints: 11400, isOccupied: true },
          this.emptySeat(3),
          this.emptySeat(4),
          this.emptySeat(5),
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ]
      ),
      this.createPartyRoom(
        'party_005',
        '771005',
        'Gamers Corner & Esports Banter 🏆',
        'Usman Raza',
        'Gaming',
        [
          { index: 1, userId: 'u_usman', nickname: 'Usman Raza', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', isHost: true, isMuted: false, isSpeaking: true, giftPoints: 7200, isOccupied: true },
          { index: 2, userId: 'u_bilal', nickname: 'Bilal Ahmed', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', isHost: false, isMuted: false, isSpeaking: false, giftPoints: 6100, isOccupied: true },
          { index: 3, userId: 'u_hamza', nickname: 'Hamza Tariq', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', isHost: false, isMuted: false, isSpeaking: true, giftPoints: 5900, isOccupied: true },
          this.emptySeat(4),
          this.emptySeat(5),
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ]
      ),
      this.createPartyRoom(
        'party_006',
        '771006',
        'Midnight Ghazal & Acoustic Moods 🎶',
        'Sana Ali',
        'Music',
        [
          { index: 1, userId: 'u_sana', nickname: 'Sana Ali', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', isHost: true, isMuted: false, isSpeaking: true, giftPoints: 14500, isOccupied: true },
          { index: 2, userId: 'u_amina', nickname: 'Amina Noor', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', isHost: false, isMuted: false, isSpeaking: false, giftPoints: 12300, isOccupied: true },
          { index: 3, userId: 'u_zainab', nickname: 'Zainab Khan', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', isHost: false, isMuted: false, isSpeaking: false, giftPoints: 8900, isOccupied: true },
          this.emptySeat(4),
          this.emptySeat(5),
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ]
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 5. TWELVE (12) DIRECT INBOX CHATS
  // --------------------------------------------------------------------------
  public static get chats(): FixtureChatThread[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Failed to retrieve inbox threads: Chat database locked [ERR_DB_LOCKED]',
        'ERR_DB_LOCKED'
      );
    }
    if (this.isEmpty) return [];
    return [
      {
        threadId: 'th_01',
        peerUserId: 'u_sana',
        peerNickname: 'Sana Ali',
        peerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastMessage: 'Hey Amina! Are we doing the PK battle tonight on Karachi Nights?',
        lastMessageTime: '10:42 AM',
        unreadCount: 2,
        isOnline: true,
      },
      {
        threadId: 'th_02',
        peerUserId: 'u_bilal',
        peerNickname: 'Bilal Ahmed',
        peerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        lastMessage: 'Thanks for sending the lion gift on my gaming stream! 🦁🔥',
        lastMessageTime: '09:15 AM',
        unreadCount: 0,
        isOnline: true,
      },
      {
        threadId: 'th_03',
        peerUserId: 'u_zainab',
        peerNickname: 'Zainab Khan',
        peerAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        lastMessage: 'Loved your acoustic cover yesterday! The guitar tone was perfect.',
        lastMessageTime: 'Yesterday',
        unreadCount: 1,
        isOnline: false,
      },
      {
        threadId: 'th_04',
        peerUserId: 'u_hamza',
        peerNickname: 'Hamza Tariq',
        peerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        lastMessage: 'Party room slot booked for 10 PM PKT. See you there!',
        lastMessageTime: 'Yesterday',
        unreadCount: 0,
        isOnline: false,
      },
      {
        threadId: 'th_05',
        peerUserId: 'u_hira',
        peerNickname: 'Hira Malik',
        peerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        lastMessage: 'Let us collaborate on the weekend live stream event.',
        lastMessageTime: 'Nov 16',
        unreadCount: 0,
        isOnline: true,
      },
      {
        threadId: 'th_06',
        peerUserId: 'u_faizan',
        peerNickname: 'Faizan Sheikh',
        peerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        lastMessage: 'Best of luck with the weekly agency rankings table!',
        lastMessageTime: 'Nov 15',
        unreadCount: 0,
        isOnline: false,
      },
      {
        threadId: 'th_07',
        peerUserId: 'u_ayesha',
        peerNickname: 'Ayesha Siddiqui',
        peerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        lastMessage: 'Sent you the new song chords on WhatsApp too.',
        lastMessageTime: 'Nov 14',
        unreadCount: 0,
        isOnline: false,
      },
      {
        threadId: 'th_08',
        peerUserId: 'u_usman',
        peerNickname: 'Usman Raza',
        peerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        lastMessage: 'Are you joining the 9-seat party tonight with the team?',
        lastMessageTime: 'Nov 13',
        unreadCount: 0,
        isOnline: true,
      },
      {
        threadId: 'th_09',
        peerUserId: 'u_danish',
        peerNickname: 'Danish Qureshi',
        peerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        lastMessage: 'Welcome to the Popo Live creator community!',
        lastMessageTime: 'Nov 12',
        unreadCount: 0,
        isOnline: false,
      },
      {
        threadId: 'th_10',
        peerUserId: 'u_maryam',
        peerNickname: 'Maryam Noor',
        peerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        lastMessage: 'Can you share your microphone settings for acoustic singing?',
        lastMessageTime: 'Nov 11',
        unreadCount: 0,
        isOnline: false,
      },
      {
        threadId: 'th_11',
        peerUserId: 'u_tariq',
        peerNickname: 'Tariq Jamil',
        peerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        lastMessage: 'Congratulations on reaching Level 12 host status!',
        lastMessageTime: 'Nov 10',
        unreadCount: 0,
        isOnline: false,
      },
      {
        threadId: 'th_12',
        peerUserId: 'u_sara',
        peerNickname: 'Sara Khan',
        peerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastMessage: 'See you in the upcoming talent hunt event on Saturday!',
        lastMessageTime: 'Nov 09',
        unreadCount: 0,
        isOnline: true,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 6. FOUR (4) OFFICIAL SYSTEM MESSAGE ROWS
  // --------------------------------------------------------------------------
  public static get officialMessages(): FixtureOfficialNotice[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Official notices service unavailable [ERR_NOTICE_503]',
        'ERR_NOTICE_503'
      );
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'notice_01',
        category: 'Security',
        badgeLabel: 'Important',
        title: 'New Sign-in Detected',
        preview: 'A new sign-in was detected on your account from Android Pixel device (Karachi, PK).',
        timestamp: '10 mins ago',
        isRead: false,
        isUrgent: true,
      },
      {
        id: 'notice_02',
        category: 'Wallet',
        badgeLabel: 'Finance',
        title: 'Weekly Settlement Credited',
        preview: 'Your host earnings of 420,000 points have been converted and credited to your wallet balance.',
        timestamp: '2 hours ago',
        isRead: true,
        isUrgent: false,
      },
      {
        id: 'notice_03',
        category: 'Activity',
        badgeLabel: 'Event',
        title: 'Grand Super PK Tournament Open',
        preview: 'Registration for the regional Super PK Tournament is now live! Sign up before Friday.',
        timestamp: '1 day ago',
        isRead: true,
        isUrgent: false,
      },
      {
        id: 'notice_04',
        category: 'System',
        badgeLabel: 'Policy',
        title: 'Streaming Guidelines & Safety Update',
        preview: 'Please review our updated community guidelines regarding background music and fair play.',
        timestamp: '3 days ago',
        isRead: true,
        isUrgent: false,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 7. COINS AND POINTS WALLET
  // --------------------------------------------------------------------------
  public static get wallet(): FixtureWallet {
    if (this.isError) {
      throw new DesignFixtureError(
        'Failed to synchronize wallet balance [ERR_LEDGER_TIMEOUT]',
        'ERR_LEDGER_TIMEOUT'
      );
    }
    if (this.isEmpty) {
      return {
        coinBalance: 0,
        pointsBalance: 0,
        withdrawableUsd: 0.0,
        diamondValue: 0,
        currencySymbol: '🪙',
        exchangeRateFormatted: '10,000 Points = $1.00 USD',
        recentTransactions: [],
      };
    }
    return {
      coinBalance: 154200,
      pointsBalance: 420500,
      withdrawableUsd: 42.05,
      diamondValue: 420500,
      currencySymbol: '🪙',
      exchangeRateFormatted: '10,000 Points = $1.00 USD',
      recentTransactions: [
        {
          id: 'tx_01',
          type: 'settlement',
          description: 'Weekly Live Stream Host Settlement',
          amount: '+125,000 pts',
          timestamp: 'Today, 08:30 AM',
          isCredit: true,
        },
        {
          id: 'tx_02',
          type: 'topup',
          description: 'Google Play Coin Pack Top-Up',
          amount: '+50,000 coins',
          timestamp: 'Yesterday, 06:14 PM',
          isCredit: true,
        },
        {
          id: 'tx_03',
          type: 'gift_sent',
          description: 'Sent Luxury Sports Car to Bilal Ahmed',
          amount: '-15,000 coins',
          timestamp: 'Nov 16, 11:20 PM',
          isCredit: false,
        },
        {
          id: 'tx_04',
          type: 'pk_reward',
          description: 'PK Battle Victory Bonus',
          amount: '+25,000 pts',
          timestamp: 'Nov 15, 09:45 PM',
          isCredit: true,
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 8. ACTIVE VIP PLAN
  // --------------------------------------------------------------------------
  public static get vipPlan(): FixtureVipPlan {
    if (this.isError) {
      throw new DesignFixtureError(
        'VIP membership service unavailable [ERR_VIP_TIMEOUT]',
        'ERR_VIP_TIMEOUT'
      );
    }
    if (this.isEmpty) {
      return {
        tierLevel: 0,
        tierName: 'Standard Member',
        isActive: false,
        expiryDate: 'None',
        daysRemaining: 0,
        progressPercentage: 0.0,
        pointsToNextTier: 10000,
        badgeAsset: 'assets/vip/vip_tier_none.png',
        privileges: [],
      };
    }
    return {
      tierLevel: 3,
      tierName: 'Crown Sovereign',
      isActive: true,
      expiryDate: '2026-12-31',
      daysRemaining: 43,
      progressPercentage: 0.72,
      pointsToNextTier: 28000,
      badgeAsset: 'assets/vip/vip_tier_3_crown.png',
      privileges: [
        {
          id: 'p_01',
          title: 'Custom Entrance Animation',
          description: 'Golden carriage and celestial fanfare on entering any live room',
          iconName: 'car_crash_rounded',
        },
        {
          id: 'p_02',
          title: 'Exclusive Glowing Avatar Ring',
          description: 'Prismatic animated border surrounding your profile picture',
          iconName: 'blur_circular_rounded',
        },
        {
          id: 'p_03',
          title: 'Chat Message Highlight',
          description: 'Golden bubble and bold typography in audience live chats',
          iconName: 'mark_chat_read_rounded',
        },
        {
          id: 'p_04',
          title: 'Stealth Mode Visitor',
          description: 'Browse rooms without appearing in public visitor counters',
          iconName: 'visibility_off_rounded',
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 9. EIGHT (8) MEDALS
  // --------------------------------------------------------------------------
  public static get medals(): FixtureMedal[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Medals collection service failed [ERR_MEDALS_500]',
        'ERR_MEDALS_500'
      );
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'med_01',
        name: 'Top Broadcaster 2026',
        category: 'Honor',
        rarity: 'Legendary',
        iconEmoji: '🏆',
        description: 'Awarded to creators in the Top 10 national ranking',
        isUnlocked: true,
        unlockedDate: '2026-10-15',
      },
      {
        id: 'med_02',
        name: 'Karachi Star',
        category: 'Regional',
        rarity: 'Epic',
        iconEmoji: '⭐',
        description: 'Earned 1M+ live popularity points from Karachi audiences',
        isUnlocked: true,
        unlockedDate: '2026-11-01',
      },
      {
        id: 'med_03',
        name: 'Gift Master',
        category: 'Gifting',
        rarity: 'Epic',
        iconEmoji: '🎁',
        description: 'Sent over 100,000 coins in gifts across creator streams',
        isUnlocked: true,
        unlockedDate: '2026-09-20',
      },
      {
        id: 'med_04',
        name: 'Loyal Fan Lv.10',
        category: 'Community',
        rarity: 'Rare',
        iconEmoji: '💖',
        description: 'Achieved Level 10 fan status in a verified host club',
        isUnlocked: true,
        unlockedDate: '2026-10-28',
      },
      {
        id: 'med_05',
        name: 'PK Champion',
        category: 'Battle',
        rarity: 'Epic',
        iconEmoji: '⚔️',
        description: 'Achieved 50+ victories in official 1v1 PK battle competitions',
        isUnlocked: true,
        unlockedDate: '2026-11-10',
      },
      {
        id: 'med_06',
        name: 'Party Maestro',
        category: 'Party',
        rarity: 'Rare',
        iconEmoji: '🎉',
        description: 'Hosted more than 100 hours in 9-seat party rooms',
        isUnlocked: true,
        unlockedDate: '2026-10-05',
      },
      {
        id: 'med_07',
        name: 'Super Guardian',
        category: 'Protection',
        rarity: 'Legendary',
        iconEmoji: '🛡️',
        description: 'Holds an active Guardian Shield protecting a creator',
        isUnlocked: true,
        unlockedDate: '2026-11-02',
      },
      {
        id: 'med_08',
        name: 'Verified Creator',
        category: 'Identity',
        rarity: 'Exclusive',
        iconEmoji: '✅',
        description: 'Official Popo Live identity-verified creator badge',
        isUnlocked: true,
        unlockedDate: '2026-08-14',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 10. FAN CLUB
  // --------------------------------------------------------------------------
  public static get fanClub(): FixtureFanClub {
    if (this.isError) {
      throw new DesignFixtureError(
        'Fan club repository unavailable [ERR_FANCLUB_TIMEOUT]',
        'ERR_FANCLUB_TIMEOUT'
      );
    }
    if (this.isEmpty) {
      return {
        id: '',
        clubName: 'No Fan Club',
        hostNickname: '',
        hostAvatar: '',
        badgeTag: '',
        clubLevel: 0,
        memberCount: 0,
        dailyIntimacyPoints: 0,
        description: 'You have not joined any fan club yet.',
        topMembers: [],
      };
    }
    return {
      id: 'fc_amina_noor',
      clubName: 'Noor Fam',
      hostNickname: 'Amina Noor',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      badgeTag: '🌟 NoorFam',
      clubLevel: 8,
      memberCount: 432,
      dailyIntimacyPoints: 18450,
      description: 'The official family for Amina Noor acoustic sessions & Karachi Nights!',
      topMembers: [
        {
          userId: 'u_bilal',
          nickname: 'Bilal Ahmed',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          intimacyLevel: 18,
          rank: 1,
          joinedDaysAgo: 120,
        },
        {
          userId: 'u_sana',
          nickname: 'Sana Ali',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          intimacyLevel: 15,
          rank: 2,
          joinedDaysAgo: 95,
        },
        {
          userId: 'u_faizan',
          nickname: 'Faizan Sheikh',
          avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
          intimacyLevel: 12,
          rank: 3,
          joinedDaysAgo: 60,
        },
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 11. THREE (3) GUARDIANS
  // --------------------------------------------------------------------------
  public static get guardians(): FixtureGuardian[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Guardian roster lookup failed [ERR_GUARDIAN_503]',
        'ERR_GUARDIAN_503'
      );
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'guard_01',
        rank: 1,
        tierName: 'Gold Dragon Guardian',
        guardianNickname: 'Bilal Ahmed',
        guardianAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        shieldIconEmoji: '🐉',
        contributionPoints: 250000,
        daysRemaining: 28,
        privilegeSummary: 'Custom dragon entrance banner, seat lock immunity, priority chat voice',
      },
      {
        id: 'guard_02',
        rank: 2,
        tierName: 'Silver Phoenix Guardian',
        guardianNickname: 'Faizan Sheikh',
        guardianAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        shieldIconEmoji: '🦅',
        contributionPoints: 120000,
        daysRemaining: 14,
        privilegeSummary: 'Phoenix aura glow, silver seat shield, exclusive guardian badge',
      },
      {
        id: 'guard_03',
        rank: 3,
        tierName: 'Bronze Lion Guardian',
        guardianNickname: 'Tariq Jamil',
        guardianAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        shieldIconEmoji: '🦁',
        contributionPoints: 60000,
        daysRemaining: 7,
        privilegeSummary: 'Bronze lion badge, special entrance notification, fan club multiplier',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 12. SUCCESSFUL AND INVALID REDEEM CODES
  // --------------------------------------------------------------------------
  public static get successfulRedeemCode(): FixtureRedeemCode {
    return {
      code: 'POPO-WELCOME-2026',
      isValid: true,
      coinReward: 5000,
      bonusItem: '1-Day VIP Trial Pass + Karachi Nights Avatar Frame',
      message: 'Voucher successfully redeemed! 5,000 coins credited to your wallet.',
    };
  }

  public static get expiredRedeemCode(): FixtureRedeemCode {
    return {
      code: 'EXPIRED-BONUS-999',
      isValid: false,
      coinReward: 0,
      bonusItem: null,
      message: 'This redemption code has expired or has already been claimed by another account.',
    };
  }

  public static get invalidRedeemCode(): FixtureRedeemCode {
    return {
      code: 'INVALID-CODE-XYZ',
      isValid: false,
      coinReward: 0,
      bonusItem: null,
      message: 'Invalid voucher code. Please check your spelling and try again.',
    };
  }

  // --------------------------------------------------------------------------
  // 13. TASKS AND REWARDS
  // --------------------------------------------------------------------------
  public static get tasksAndRewards(): FixtureTask[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Task progress sync failed: Server busy [ERR_TASK_SYNC_503]',
        'ERR_TASK_SYNC_503'
      );
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'task_01',
        title: 'Go Live for 60 Minutes',
        rewardText: '500 Host Points',
        currentProgress: 45,
        targetGoal: 60,
        unit: 'mins',
        status: 'in_progress',
        isClaimed: false,
      },
      {
        id: 'task_02',
        title: 'Receive 3 Gifts in Live Room',
        rewardText: '1,000 Host Points',
        currentProgress: 3,
        targetGoal: 3,
        unit: 'gifts',
        status: 'completed',
        isClaimed: false,
      },
      {
        id: 'task_03',
        title: 'Join a 9-Seat Party Room for 15 Mins',
        rewardText: '300 Free Coins',
        currentProgress: 15,
        targetGoal: 15,
        unit: 'mins',
        status: 'claimed',
        isClaimed: true,
      },
      {
        id: 'task_04',
        title: 'Win 1 Official PK Battle',
        rewardText: '2,000 Host Points + 1 PK Card',
        currentProgress: 0,
        targetGoal: 1,
        unit: 'battle',
        status: 'not_started',
        isClaimed: false,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 14. HOST RANKINGS
  // --------------------------------------------------------------------------
  public static get hostRankings(): FixtureHostRanking[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Leaderboard database timeout [ERR_RANKINGS_TIMEOUT]',
        'ERR_RANKINGS_TIMEOUT'
      );
    }
    if (this.isEmpty) return [];
    return [
      {
        rank: 1,
        hostNickname: 'Amina Noor',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        diamondsEarned: 1850000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 18,
      },
      {
        rank: 2,
        hostNickname: 'Sana Ali',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        diamondsEarned: 1420000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 15,
      },
      {
        rank: 3,
        hostNickname: 'Zainab Khan',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        diamondsEarned: 980000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 14,
      },
      {
        rank: 4,
        hostNickname: 'Hamza Tariq',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        diamondsEarned: 760000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 12,
      },
      {
        rank: 5,
        hostNickname: 'Hira Malik',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        diamondsEarned: 620000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 11,
      },
      {
        rank: 6,
        hostNickname: 'Faizan Sheikh',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        diamondsEarned: 510000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 10,
      },
      {
        rank: 7,
        hostNickname: 'Ayesha Siddiqui',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        diamondsEarned: 430000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 9,
      },
      {
        rank: 8,
        hostNickname: 'Bilal Ahmed',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        diamondsEarned: 380000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 22,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 15. STORE ITEMS
  // --------------------------------------------------------------------------
  public static get storeItems(): FixtureStoreItem[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Store inventory query failed [ERR_STORE_503]',
        'ERR_STORE_503'
      );
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'store_01',
        title: 'Golden Dragon Avatar Frame',
        category: 'Avatar Frame',
        priceCoins: 30000,
        validityDays: 30,
        previewImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200',
        isHot: true,
      },
      {
        id: 'store_02',
        title: 'Cyberpunk Neon Ride Entrance',
        category: 'Entrance Effect',
        priceCoins: 85000,
        validityDays: 30,
        previewImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=200',
        isHot: true,
      },
      {
        id: 'store_03',
        title: 'Karachi Nights Glowing Bubble',
        category: 'Chat Bubble',
        priceCoins: 12000,
        validityDays: 15,
        previewImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200',
        isHot: false,
      },
      {
        id: 'store_04',
        title: 'Royal Rose Crown Ring',
        category: 'Avatar Frame',
        priceCoins: 25000,
        validityDays: 30,
        previewImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200',
        isHot: false,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 16. BAG ITEMS
  // --------------------------------------------------------------------------
  public static get bagItems(): FixtureBagItem[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Backpack inventory retrieval failed [ERR_BAG_TIMEOUT]',
        'ERR_BAG_TIMEOUT'
      );
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'bag_01',
        name: 'Golden Dragon Avatar Frame',
        category: 'Avatar Frame',
        quantity: 1,
        isEquipped: true,
        expiresInText: '14 days left',
      },
      {
        id: 'bag_02',
        name: 'Cyberpunk Neon Ride Entrance',
        category: 'Entrance Effect',
        quantity: 1,
        isEquipped: true,
        expiresInText: '7 days left',
      },
      {
        id: 'bag_03',
        name: 'PK Double Points Boost Card',
        category: 'Battle Prop',
        quantity: 3,
        isEquipped: false,
        expiresInText: 'Permanent',
      },
      {
        id: 'bag_04',
        name: 'VIP 3-Day Trial Pass',
        category: 'Voucher',
        quantity: 1,
        isEquipped: false,
        expiresInText: 'Expires in 30 days',
      },
      {
        id: 'bag_05',
        name: 'Rose Fireworks Gift Voucher',
        category: 'Gift Prop',
        quantity: 5,
        isEquipped: false,
        expiresInText: 'Expires in 60 days',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 17. AGENCY INFORMATION
  // --------------------------------------------------------------------------
  public static get agencyInfo(): FixtureAgency {
    if (this.isError) {
      throw new DesignFixtureError(
        'Agency management portal error [ERR_AGENCY_PORTAL_403]',
        'ERR_AGENCY_PORTAL_403'
      );
    }
    if (this.isEmpty) {
      return {
        agencyId: '',
        agencyCode: '',
        agencyName: 'Unassigned',
        agentLeader: 'None',
        contactPhone: '',
        registeredCity: '',
        totalActiveHosts: 0,
        monthlyDiamondVolume: 0,
        commissionTierPercentage: 0.0,
        settlementStatus: 'Unregistered',
        announcement: '',
      };
    }
    return {
      agencyId: 'agy_78601',
      agencyCode: 'AGY-78601',
      agencyName: 'Indus Star Media Agency',
      agentLeader: 'Kamran Malik',
      contactPhone: '+92 300 8765432',
      registeredCity: 'Karachi, Pakistan',
      totalActiveHosts: 48,
      monthlyDiamondVolume: 14850000,
      commissionTierPercentage: 12.0,
      settlementStatus: 'Active & Verified',
      announcement: 'Weekly settlement cycle runs every Monday at 12:00 UTC. Submit bank updates by Sunday midnight.',
    };
  }

  // --------------------------------------------------------------------------
  // 18. HELP TOPICS
  // --------------------------------------------------------------------------
  public static get helpTopics(): FixtureHelpTopic[] {
    if (this.isError) {
      throw new DesignFixtureError(
        'Help center knowledge base unreachable [ERR_HELP_503]',
        'ERR_HELP_503'
      );
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'help_01',
        category: 'Recharge & Wallet',
        question: 'How do I top up coins with Google Play or Card?',
        answer: 'Navigate to Wallet > Top Up. Choose your desired coin bundle and complete checkout via Google Play billing or authorized payment providers.',
      },
      {
        id: 'help_02',
        category: 'Broadcasting',
        question: 'How do I qualify to go live as a host?',
        answer: 'You must reach Wealth Level 5, verify your profile face photo, and accept our broadcasting safety guidelines before opening the host studio.',
      },
      {
        id: 'help_03',
        category: 'Withdrawals',
        question: 'How do I withdraw host points into my bank or e-wallet?',
        answer: 'Go to Me > Wallet > Host Earnings > Withdraw. Complete identity KYC and select your local bank transfer or registered e-wallet account.',
      },
      {
        id: 'help_04',
        category: 'Security',
        question: 'How can I protect my Popo Live account from unauthorized access?',
        answer: 'Bind your phone number and email in Settings > Account Security. Always enable two-factor OTP verification for new device logins.',
      },
      {
        id: 'help_05',
        category: 'PK Battles',
        question: 'How are PK battle scores and winners decided?',
        answer: 'In 1v1 PK, audience gifts during the 5-minute timer determine each host score. The host with the highest gift point tally wins the battle.',
      },
      {
        id: 'help_06',
        category: 'Party Rooms',
        question: 'How do 9-seat party rooms work and how do I speak?',
        answer: 'Tap any empty seat in a party room to send a mic request. Once approved by the room host, your microphone un-mutes and you join the live conversation.',
      },
      {
        id: 'help_07',
        category: 'VIP System',
        question: 'What are the privileges of subscribing to VIP tiers?',
        answer: 'VIP members enjoy custom carriage entry animations, glowing avatar frames, chat badges, stealth visitor mode, and special gift discounts.',
      },
      {
        id: 'help_08',
        category: 'Safety & Bans',
        question: 'What content is prohibited during live streams?',
        answer: 'Harassment, hate speech, dangerous activities, copyright violations, and vulgarity are strictly forbidden and result in instant broadcast termination.',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // INTERNAL PROFILES
  // --------------------------------------------------------------------------
  public static readonly profileAminaNoor: FixtureUserProfile = {
    userId: 'u_amina_noor',
    poppoId: '8839201',
    nickname: 'Amina Noor',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    bio: 'Singer & acoustic guitarist from Karachi 🎸🎶 Welcome to Karachi Nights!',
    gender: 'female',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 18,
    hostLevel: 12,
    vipLevel: 3,
    followingCount: 142,
    followersCount: 8920,
    friendsCount: 56,
    visitorCount: 12450,
    isHostEligible: true,
    isLiveNow: true,
    currentLiveRoomId: 'live_room_001',
  };

  public static readonly profileSanaAli: FixtureUserProfile = {
    userId: 'u_sana_ali',
    poppoId: '8839202',
    nickname: 'Sana Ali',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    bio: 'Chai enthusiast, storyteller & late-night podcaster ☕✨',
    gender: 'female',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 14,
    hostLevel: 15,
    vipLevel: 2,
    followingCount: 98,
    followersCount: 6540,
    friendsCount: 42,
    visitorCount: 9100,
    isHostEligible: true,
    isLiveNow: true,
    currentLiveRoomId: 'live_room_002',
  };

  public static readonly profileBilalAhmed: FixtureUserProfile = {
    userId: 'u_bilal_ahmed',
    poppoId: '8839203',
    nickname: 'Bilal Ahmed',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    bio: 'Esports streamer & community champion 🎮🔥 High tier gamer.',
    gender: 'male',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 22,
    hostLevel: 8,
    vipLevel: 4,
    followingCount: 210,
    followersCount: 11400,
    friendsCount: 88,
    visitorCount: 18900,
    isHostEligible: true,
    isLiveNow: false,
  };

  public static readonly profileZainabKhan: FixtureUserProfile = {
    userId: 'u_zainab_khan',
    poppoId: '8839204',
    nickname: 'Zainab Khan',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
    bio: 'Eastern classical vocalist & poetess from Lahore 🪕✨',
    gender: 'female',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 11,
    hostLevel: 14,
    vipLevel: 1,
    followingCount: 75,
    followersCount: 4890,
    friendsCount: 31,
    visitorCount: 6200,
    isHostEligible: true,
    isLiveNow: false,
  };

  public static readonly profileHamzaTariq: FixtureUserProfile = {
    userId: 'u_hamza_tariq',
    poppoId: '8839205',
    nickname: 'Hamza Tariq',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    bio: 'Standup comedian, entertainer & improv host 😂🎭',
    gender: 'male',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 9,
    hostLevel: 10,
    vipLevel: 0,
    followingCount: 120,
    followersCount: 3750,
    friendsCount: 25,
    visitorCount: 4100,
    isHostEligible: true,
    isLiveNow: false,
  };

  public static readonly profileHiraMalik: FixtureUserProfile = {
    userId: 'u_hira_malik',
    poppoId: '8839206',
    nickname: 'Hira Malik',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
    bio: 'Fashion curator, lifestyle vlogger & daily host 💄👗',
    gender: 'female',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 12,
    hostLevel: 11,
    vipLevel: 2,
    followingCount: 135,
    followersCount: 5200,
    friendsCount: 39,
    visitorCount: 7800,
    isHostEligible: true,
    isLiveNow: false,
  };

  public static readonly profileFaizanSheikh: FixtureUserProfile = {
    userId: 'u_faizan_sheikh',
    poppoId: '8839207',
    nickname: 'Faizan Sheikh',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
    bio: 'Literature enthusiast & community speaker 📖',
    gender: 'male',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 10,
    hostLevel: 9,
    vipLevel: 1,
    followingCount: 88,
    followersCount: 3100,
    friendsCount: 28,
    visitorCount: 3900,
    isHostEligible: true,
    isLiveNow: false,
  };

  public static readonly profileTariqJamil: FixtureUserProfile = {
    userId: 'u_tariq_jamil',
    poppoId: '8839208',
    nickname: 'Tariq Jamil',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
    bio: 'Music patron & supporter of acoustic talent 🎵',
    gender: 'male',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 15,
    hostLevel: 5,
    vipLevel: 2,
    followingCount: 150,
    followersCount: 2200,
    friendsCount: 45,
    visitorCount: 3100,
    isHostEligible: false,
    isLiveNow: false,
  };

  private static emptySeat(index: number): FixturePartySeat {
    return {
      index,
      userId: null,
      nickname: null,
      avatarUrl: null,
      isHost: false,
      isMuted: false,
      isSpeaking: false,
      giftPoints: 0,
      isOccupied: false,
    };
  }

  private static createPartyRoom(
    id: string,
    roomNumber: string,
    title: string,
    hostNickname: string,
    category: string,
    seats: FixturePartySeat[]
  ): FixturePartyRoom {
    const activeCount = seats.filter((s) => s.isOccupied).length;
    return {
      id,
      roomNumber,
      title,
      hostNickname,
      category,
      country: 'Pakistan',
      countryCode: 'PK',
      flagEmoji: '🇵🇰',
      maxSeats: 9,
      occupiedSeatCount: activeCount,
      seats,
    };
  }
}
