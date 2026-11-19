// ==============================================================================
// POPO LIVE — WEB DESIGN FIXTURES (PHASE 1 - D0 - PROMPT 4)
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
  public readonly module?: string;

  constructor(message: string, code = 'FIXTURE_SIMULATED_ERROR', module?: string) {
    super(`DesignFixtureError [${code}]: ${message}`);
    this.name = 'DesignFixtureError';
    this.code = code;
    this.module = module;
  }
}

export interface FixtureModuleError {
  module: string;
  code: string;
  title: string;
  message: string;
  actionLabel: string;
  isRetryable: boolean;
}

export interface FixtureEmptyStateInfo {
  module: string;
  title: string;
  message: string;
  actionLabel: string;
  iconEmoji: string;
}

// ----------------------------------------------------------------------------
// INTERFACES (Full Parity with Mobile Data Classes)
// ----------------------------------------------------------------------------

export interface FixtureUserProfile {
  userId: string;
  poppoId: string;
  nickname: string;
  username: string;
  avatarUrl: string;
  bio: string;
  gender: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  wealthLevel: number;
  hostLevel: number;
  vipLevel: number;
  vipStatus: string;
  coinBalance: number;
  pointsBalance: number;
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
  isLocked: boolean;
  canJoin: boolean;
  joinRequestStatus: string;
}

export interface FixturePartyRoom {
  id: string;
  roomNumber: string;
  title: string;
  hostNickname: string;
  hostAvatar: string;
  hostUserId: string;
  coverUrl: string;
  category: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  viewerCount: number;
  maxSeats: number;
  occupiedSeatCount: number;
  joinStatus: string;
  seats: FixturePartySeat[];
}

export interface FixtureChatThread {
  threadId: string;
  senderId: string;
  receiverId: string;
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
  senderId: string;
  receiverId: string;
  senderName: string;
  senderAvatar: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface FixtureSquareComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface FixtureSquarePost {
  id: string;
  author: FixtureUserProfile;
  content: string;
  imageUrl?: string | null;
  timestamp: string;
  initialLikes: number;
  initialIsLiked?: boolean;
  comments: FixtureSquareComment[];
}

export interface FixtureWalletTransaction {
  id: string;
  type: string;
  description: string;
  amount: string;
  timestamp: string;
  isCredit: boolean;
}

export interface FixtureCoinPackage {
  id: string;
  coins: number;
  bonusCoins: number;
  priceUsd: number;
  pricePkr: number;
  badgeLabel: string;
}

export interface FixturePointsRecord {
  id: string;
  source: string;
  amount: number;
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
  totalRechargedUsd: number;
  totalWithdrawnUsd: number;
  estimatedRevenueUsd: number;
  recentTransactions: FixtureWalletTransaction[];
}

export interface FixtureGift {
  id: string;
  name: string;
  iconUrl: string;
  priceCoins: number;
  category: string;
  animationUrl: string;
  comboMax: number;
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

export interface FixtureVipPlanHistory {
  id: string;
  tierName: string;
  startDate: string;
  endDate: string;
  pricePaidUsd: number;
  status: string;
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
  intimacyPoints: number;
  rank: number;
}

export interface FixtureFanClub {
  clubId: string;
  clubName: string;
  badgeName: string;
  badgeColorHex: string;
  totalMembers: number;
  userClubLevel: number;
  userIntimacyPoints: number;
  announcement: string;
  topMembers: FixtureFanClubMember[];
}

export interface FixtureGuardian {
  id: string;
  hostUserId: string;
  guardianUserId: string;
  guardianNickname: string;
  guardianAvatar: string;
  tier: string;
  guardDaysRemaining: number;
  protectRank: number;
  customBanner: string;
}

export interface FixtureUserRelation {
  userId: string;
  nickname: string;
  avatarUrl: string;
  relationType: string;
  isOnline: boolean;
  mutualCount: number;
}

export interface FixtureProfileVisitor {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  visitTimestamp: string;
  vipLevel: number;
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

export interface FixtureEventRanking {
  rank: number;
  eventName: string;
  hostNickname: string;
  avatarUrl: string;
  eventPoints: number;
  badgeTitle: string;
}

export interface FixtureRewardHistory {
  id: string;
  taskTitle: string;
  rewardText: string;
  claimedAt: string;
}

export interface FixtureStoreItem {
  id: string;
  title: string;
  category: string;
  priceCoins: number;
  validityDays: number;
  previewImage: string;
  description: string;
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

export interface FixtureAgencyMember {
  id: string;
  userId: string;
  nickname: string;
  avatarUrl: string;
  hostLevel: number;
  monthlyDiamonds: number;
  status: string;
}

export interface FixtureCoinSeller {
  sellerId: string;
  sellerName: string;
  agentName: string;
  whatsappContact: string;
  verificationBadge: string;
  rating: number;
  totalOrdersCompleted: number;
  paymentMethods: string[];
  discountNote: string;
}

export interface FixtureWithdrawalRecord {
  id: string;
  amountPoints: number;
  amountUsd: number;
  amountPkr: number;
  paymentMethod: string;
  status: string;
  timestamp: string;
}

export interface FixtureHelpTopic {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface FixtureSupportTicket {
  id: string;
  ticketNumber: string;
  category: string;
  subject: string;
  status: string;
  lastUpdated: string;
}

// ----------------------------------------------------------------------------
// REPOSITORY IMPLEMENTATION
// ----------------------------------------------------------------------------

export class DesignFixtures {
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

  public static setFilled(): void {
    this.currentState = 'filled';
  }

  public static setEmpty(): void {
    this.currentState = 'empty';
  }

  public static setError(): void {
    this.currentState = 'error';
  }

  public static reset(): void {
    this.currentState = 'filled';
    this.mutableCoinBalance = 154200;
    this.mutablePointsBalance = 420500;
  }

  private static mutableCoinBalance = 154200;
  private static mutablePointsBalance = 420500;

  public static get currentCoinBalance(): number {
    return this.mutableCoinBalance;
  }

  public static deductCoins(amount: number): boolean {
    if (this.mutableCoinBalance >= amount) {
      this.mutableCoinBalance -= amount;
      return true;
    }
    return false;
  }

  public static addCoins(amount: number): void {
    this.mutableCoinBalance += amount;
  }

  // --------------------------------------------------------------------------
  // REALISTIC ERROR-STATE FIXTURES (PROMPT 4)
  // --------------------------------------------------------------------------
  public static readonly userProfileError: FixtureModuleError = {
    module: 'userProfile',
    code: 'ERR_USER_PROFILE_503',
    title: 'User Profile Unavailable',
    message: 'Failed to load user profile: Service temporarily unavailable.',
    actionLabel: 'Tap to retry',
    isRetryable: true,
  };

  public static readonly liveRoomsError: FixtureModuleError = {
    module: 'liveRooms',
    code: 'ERR_LIVE_ROOMS_503',
    title: 'Live Streams Unavailable',
    message: 'Failed to load live broadcast rooms. Please check your network connection and tap to retry.',
    actionLabel: 'Tap to retry',
    isRetryable: true,
  };

  public static readonly partyRoomsError: FixtureModuleError = {
    module: 'partyRooms',
    code: 'ERR_PARTY_ROOMS_503',
    title: 'Party Audio Cluster Offline',
    message: 'Failed to connect to party room audio cluster. 9-seat rooms cannot be displayed right now.',
    actionLabel: 'Tap to reconnect',
    isRetryable: true,
  };

  public static readonly messagesError: FixtureModuleError = {
    module: 'messages',
    code: 'ERR_MESSAGES_TIMEOUT',
    title: 'Inbox Sync Failed',
    message: 'Failed to synchronize direct messages and official notices. Pull down to refresh.',
    actionLabel: 'Pull down to refresh',
    isRetryable: true,
  };

  public static readonly squareError: FixtureModuleError = {
    module: 'square',
    code: 'ERR_SQUARE_TIMEOUT',
    title: 'Square Feed Unavailable',
    message: 'Failed to synchronize community posts and comments. Pull down to refresh.',
    actionLabel: 'Pull down to refresh',
    isRetryable: true,
  };

  public static readonly walletError: FixtureModuleError = {
    module: 'wallet',
    code: 'ERR_WALLET_SYNC_500',
    title: 'Wallet Ledger Unavailable',
    message: 'Failed to synchronize coin and point balances. Your transaction records are safely stored on the ledger.',
    actionLabel: 'Tap to retry',
    isRetryable: true,
  };

  public static readonly vipError: FixtureModuleError = {
    module: 'vip',
    code: 'ERR_VIP_LOAD_FAILED',
    title: 'VIP Membership Check Failed',
    message: 'VIP membership status and exclusive privileges could not be loaded. Please try again.',
    actionLabel: 'Tap to reload',
    isRetryable: true,
  };

  public static readonly storeError: FixtureModuleError = {
    module: 'store',
    code: 'ERR_STORE_INVENTORY_503',
    title: 'Store Catalog Unavailable',
    message: 'Failed to load virtual store items and owned bag items. Please check your internet connection.',
    actionLabel: 'Retry store query',
    isRetryable: true,
  };

  public static readonly supportTicketsError: FixtureModuleError = {
    module: 'helpTickets',
    code: 'ERR_SUPPORT_TICKETS_500',
    title: 'Support Center Unreachable',
    message: 'Customer support ticketing system is temporarily unreachable. Help topics and tickets are offline.',
    actionLabel: 'Check network status',
    isRetryable: true,
  };

  public static readonly redeemCodeError: FixtureModuleError = {
    module: 'redeemCode',
    code: 'ERR_REDEEM_SYSTEM_BUSY',
    title: 'Voucher Service Error',
    message: 'Promotional code validation server is currently busy. Your code was not redeemed. Please retry in a few moments.',
    actionLabel: 'Try again',
    isRetryable: true,
  };

  public static readonly allModuleErrors: Record<string, FixtureModuleError> = {
    userProfile: DesignFixtures.userProfileError,
    liveRooms: DesignFixtures.liveRoomsError,
    partyRooms: DesignFixtures.partyRoomsError,
    messages: DesignFixtures.messagesError,
    wallet: DesignFixtures.walletError,
    vip: DesignFixtures.vipError,
    store: DesignFixtures.storeError,
    helpTickets: DesignFixtures.supportTicketsError,
    redeemCode: DesignFixtures.redeemCodeError,
  };

  public static errorForModule(module: string): FixtureModuleError | undefined {
    return this.allModuleErrors[module];
  }

  // --------------------------------------------------------------------------
  // REALISTIC EMPTY-STATE FIXTURES (PROMPT 4)
  // --------------------------------------------------------------------------
  public static readonly liveRoomsEmpty: FixtureEmptyStateInfo = {
    module: 'liveRooms',
    title: 'No Live Broadcasts',
    message: 'No hosts are live right now. Be the first to start streaming!',
    actionLabel: 'Go Live Now',
    iconEmoji: '📡',
  };

  public static readonly partyRoomsEmpty: FixtureEmptyStateInfo = {
    module: 'partyRooms',
    title: 'No Party Rooms Available',
    message: 'All party lounges are currently quiet. Open a 9-seat room to invite your friends!',
    actionLabel: 'Create Party Room',
    iconEmoji: '🎉',
  };

  public static readonly messagesEmpty: FixtureEmptyStateInfo = {
    module: 'messages',
    title: 'No Messages Yet',
    message: 'Your inbox is empty. Say hello to creator hosts or join a party room to connect!',
    actionLabel: 'Discover Creators',
    iconEmoji: '💬',
  };

  public static readonly walletEmpty: FixtureEmptyStateInfo = {
    module: 'wallet',
    title: 'No Transactions',
    message: 'You have no recent coin or point transaction records in your wallet history.',
    actionLabel: 'Top Up Coins',
    iconEmoji: '🪙',
  };

  public static readonly storeEmpty: FixtureEmptyStateInfo = {
    module: 'store',
    title: 'No Store Products',
    message: 'There are currently no items in this store category.',
    actionLabel: 'Refresh Store',
    iconEmoji: '🛍️',
  };

  public static readonly bagEmpty: FixtureEmptyStateInfo = {
    module: 'bag',
    title: 'Backpack is Empty',
    message: 'You have not acquired any avatar frames, entrance effects, or battle cards yet.',
    actionLabel: 'Browse Store',
    iconEmoji: '🎒',
  };

  public static readonly supportTicketsEmpty: FixtureEmptyStateInfo = {
    module: 'supportTickets',
    title: 'No Support Tickets',
    message: 'You have no pending or past support requests. We are here if you need assistance!',
    actionLabel: 'Submit Ticket',
    iconEmoji: '🎫',
  };

  public static readonly allEmptyStates: Record<string, FixtureEmptyStateInfo> = {
    liveRooms: DesignFixtures.liveRoomsEmpty,
    partyRooms: DesignFixtures.partyRoomsEmpty,
    messages: DesignFixtures.messagesEmpty,
    wallet: DesignFixtures.walletEmpty,
    store: DesignFixtures.storeEmpty,
    bag: DesignFixtures.bagEmpty,
    supportTickets: DesignFixtures.supportTicketsEmpty,
  };

  public static emptyInfoForModule(module: string): FixtureEmptyStateInfo | undefined {
    return this.allEmptyStates[module];
  }

  // --------------------------------------------------------------------------
  // 1. USER PROFILES
  // --------------------------------------------------------------------------
  public static get currentUserProfile(): FixtureUserProfile {
    if (this.isError) {
      throw new DesignFixtureError('Failed to load user profile: Service temporarily unavailable.', 'ERR_USER_PROFILE_503', 'userProfile');
    }
    if (this.isEmpty) return this.emptyUserProfile();
    return this.profileAminaNoor;
  }

  public static get userProfiles(): FixtureUserProfile[] {
    if (this.isError) {
      throw new DesignFixtureError('Failed to load user profile: Service temporarily unavailable.', 'ERR_USER_PROFILE_503', 'userProfile');
    }
    if (this.isEmpty) return [];
    return [
      this.profileAminaNoor,
      this.profileSanaAli,
      this.profileBilalAhmed,
      this.profileZainabKhan,
      this.profileHamzaTariq,
      this.profileHiraMalik,
      this.profileFaizanSheikh,
      this.profileTariqJamil,
    ];
  }

  // --------------------------------------------------------------------------
  // 2. LIVE VIEWER FIXTURE
  // --------------------------------------------------------------------------
  public static get liveViewer(): FixtureLiveViewer {
    if (this.isError) {
      throw new DesignFixtureError('Failed to load live broadcast rooms. Please check your network connection and tap to retry.', 'ERR_LIVE_ROOMS_503', 'liveRooms');
    }
    if (this.isEmpty) return this.emptyLiveViewer();
    return {
      roomId: 'room_001',
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
          content: 'Sent a Super Sports Car 🏎️💨 keep rocking!',
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
      throw new DesignFixtureError('Failed to load live broadcast rooms. Please check your network connection and tap to retry.', 'ERR_LIVE_ROOMS_503', 'liveRooms');
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
        category: 'Comedy',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 1120,
        heatScore: 78500,
        isLive: true,
        isPkActive: true,
        tags: ['Comedy', 'Mimicry', 'Talent'],
      },
      {
        id: 'room_006',
        roomNumber: '883906',
        title: 'Sufi Soul & Poetry Night 📜🕊️',
        hostNickname: 'Hira Malik',
        hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
        category: 'Dance',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 630,
        heatScore: 41200,
        isLive: true,
        isPkActive: false,
        tags: ['Sufi', 'Poetry', 'Peace'],
      },
      {
        id: 'room_007',
        roomNumber: '883907',
        title: 'Karachi Street Food & Kitchen Diaries 🍲🌶️',
        hostNickname: 'Faizan Sheikh',
        hostAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
        category: 'Cooking',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 890,
        heatScore: 56700,
        isLive: true,
        isPkActive: false,
        tags: ['Food', 'Biryani', 'Recipes'],
      },
      {
        id: 'room_008',
        roomNumber: '883908',
        title: 'Late Night Fitness & Cardio Motivation 🏋️‍♂️⚡',
        hostNickname: 'Tariq Jamil',
        hostAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        coverUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',
        category: 'Fitness',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 450,
        heatScore: 32100,
        isLive: true,
        isPkActive: false,
        tags: ['Fitness', 'Workout', 'Health'],
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 4. SIX (6) MULTI-SEAT PARTY ROOMS WITH EXACTLY 9 SEATS
  // --------------------------------------------------------------------------
  public static get partyRooms(): FixturePartyRoom[] {
    if (this.isError) {
      throw new DesignFixtureError('Failed to connect to party room audio cluster. 9-seat rooms cannot be displayed right now.', 'ERR_PARTY_ROOMS_503', 'partyRooms');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'party_001',
        roomNumber: '771001',
        title: 'Late Night Tea House & Chai Pe Charcha ☕',
        hostNickname: 'Amina Noor',
        hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        hostUserId: 'u_amina_noor',
        coverUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500',
        category: 'ChitChat',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 380,
        maxSeats: 9,
        occupiedSeatCount: 5,
        joinStatus: 'open',
        seats: [
          {
            index: 1,
            userId: 'u_amina_noor',
            nickname: 'Amina Noor',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 12500,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 2,
            userId: 'u_sana_ali',
            nickname: 'Sana Ali',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 8900,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 3,
            userId: 'u_bilal_ahmed',
            nickname: 'Bilal Ahmed',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 6400,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 4,
            userId: 'u_hamza_tariq',
            nickname: 'Hamza Tariq',
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            isHost: false,
            isMuted: true,
            isSpeaking: false,
            giftPoints: 4300,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 5,
            userId: 'u_zainab_khan',
            nickname: 'Zainab Khan',
            avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 3100,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ],
      },
      {
        id: 'party_002',
        roomNumber: '771002',
        title: 'Music Jam & Acoustic Showcase 🎸',
        hostNickname: 'Zainab Khan',
        hostAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        hostUserId: 'u_zainab_khan',
        coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500',
        category: 'Music',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 290,
        maxSeats: 9,
        occupiedSeatCount: 3,
        joinStatus: 'open',
        seats: [
          {
            index: 1,
            userId: 'u_zainab_khan',
            nickname: 'Zainab Khan',
            avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 9200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 2,
            userId: 'u_faizan_sheikh',
            nickname: 'Faizan Sheikh',
            avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 5400,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 3,
            userId: 'u_ayesha_siddiqui',
            nickname: 'Ayesha Siddiqui',
            avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 7800,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          this.emptySeat(4),
          this.emptySeat(5),
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ],
      },
      {
        id: 'party_003',
        roomNumber: '771003',
        title: 'Urdu Poetry & Mushaira Circle 📖',
        hostNickname: 'Hira Malik',
        hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        hostUserId: 'u_hira_malik',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
        category: 'Poetry',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 210,
        maxSeats: 9,
        occupiedSeatCount: 4,
        joinStatus: 'open',
        seats: [
          {
            index: 1,
            userId: 'u_hira_malik',
            nickname: 'Hira Malik',
            avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 8100,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 2,
            userId: 'u_amina_noor',
            nickname: 'Amina Noor',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 6200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 3,
            userId: 'u_tariq_jamil',
            nickname: 'Tariq Jamil',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            isHost: false,
            isMuted: true,
            isSpeaking: false,
            giftPoints: 3400,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 4,
            userId: 'u_usman_ghani',
            nickname: 'Usman Ghani',
            avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 4900,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          this.emptySeat(5),
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ],
      },
      {
        id: 'party_004',
        roomNumber: '771004',
        title: 'Gaming Lounge & Squad Up 🎮',
        hostNickname: 'Bilal Ahmed',
        hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        hostUserId: 'u_bilal_ahmed',
        coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500',
        category: 'Gaming',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 450,
        maxSeats: 9,
        occupiedSeatCount: 4,
        joinStatus: 'open',
        seats: [
          {
            index: 1,
            userId: 'u_bilal_ahmed',
            nickname: 'Bilal Ahmed',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 15400,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 2,
            userId: 'u_hamza_tariq',
            nickname: 'Hamza Tariq',
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 9800,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 3,
            userId: 'u_faizan_sheikh',
            nickname: 'Faizan Sheikh',
            avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 8700,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 4,
            userId: 'u_nadia_parveen',
            nickname: 'Nadia Parveen',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isHost: false,
            isMuted: true,
            isSpeaking: false,
            giftPoints: 6200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          this.emptySeat(5),
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ],
      },
      {
        id: 'party_005',
        roomNumber: '771005',
        title: 'Karachi Talent & Voice Battle 🎤',
        hostNickname: 'Hamza Tariq',
        hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        hostUserId: 'u_hamza_tariq',
        coverUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=500',
        category: 'Talent',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 340,
        maxSeats: 9,
        occupiedSeatCount: 3,
        joinStatus: 'open',
        seats: [
          {
            index: 1,
            userId: 'u_hamza_tariq',
            nickname: 'Hamza Tariq',
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 11200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 2,
            userId: 'u_sana_ali',
            nickname: 'Sana Ali',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 7600,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 3,
            userId: 'u_zainab_khan',
            nickname: 'Zainab Khan',
            avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 8300,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          this.emptySeat(4),
          this.emptySeat(5),
          this.emptySeat(6),
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ],
      },
      {
        id: 'party_006',
        roomNumber: '771006',
        title: 'Midnight Gossip & Friend Finder 🌙',
        hostNickname: 'Sana Ali',
        hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        hostUserId: 'u_sana_ali',
        coverUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500',
        category: 'Social',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 520,
        maxSeats: 9,
        occupiedSeatCount: 6,
        joinStatus: 'open',
        seats: [
          {
            index: 1,
            userId: 'u_sana_ali',
            nickname: 'Sana Ali',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 14200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 2,
            userId: 'u_amina_noor',
            nickname: 'Amina Noor',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 12100,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 3,
            userId: 'u_bilal_ahmed',
            nickname: 'Bilal Ahmed',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 9500,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 4,
            userId: 'u_hira_malik',
            nickname: 'Hira Malik',
            avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 7200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 5,
            userId: 'u_tariq_jamil',
            nickname: 'Tariq Jamil',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            isHost: false,
            isMuted: true,
            isSpeaking: false,
            giftPoints: 5800,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          {
            index: 6,
            userId: 'u_ayesha_siddiqui',
            nickname: 'Ayesha Siddiqui',
            avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 8900,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          },
          this.emptySeat(7),
          this.emptySeat(8),
          this.emptySeat(9),
        ],
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 5. TWELVE (12) DIRECT INBOX CHATS
  // --------------------------------------------------------------------------
  public static get inboxChats(): FixtureChatThread[] {
    if (this.isError) {
      throw new DesignFixtureError('Failed to synchronize direct messages and official notices. Pull down to refresh.', 'ERR_MESSAGES_TIMEOUT', 'messages');
    }
    if (this.isEmpty) return [];
    return [
      {
        threadId: 'th_01',
        senderId: 'u_sana_ali',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_sana_ali',
        peerNickname: 'Sana Ali',
        peerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastMessage: 'Are we doing the dual acoustic PK battle tomorrow night?',
        lastMessageTime: '10:45 AM',
        unreadCount: 2,
        isOnline: true,
      },
      {
        threadId: 'th_02',
        senderId: 'u_bilal_ahmed',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_bilal_ahmed',
        peerNickname: 'Bilal Ahmed',
        peerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        lastMessage: 'Loved the guitar solo in your live stream today! 🎸✨',
        lastMessageTime: '09:30 AM',
        unreadCount: 0,
        isOnline: true,
      },
      {
        threadId: 'th_03',
        senderId: 'u_zainab_khan',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_zainab_khan',
        peerNickname: 'Zainab Khan',
        peerAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        lastMessage: 'Sent you the audio stems for our Sufi-fusion track.',
        lastMessageTime: 'Yesterday',
        unreadCount: 1,
        isOnline: false,
      },
      {
        threadId: 'th_04',
        senderId: 'u_hamza_tariq',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_hamza_tariq',
        peerNickname: 'Hamza Tariq',
        peerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        lastMessage: 'Let me know when the next 9-seat party starts!',
        lastMessageTime: 'Yesterday',
        unreadCount: 0,
        isOnline: true,
      },
      {
        threadId: 'th_05',
        senderId: 'u_hira_malik',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_hira_malik',
        peerNickname: 'Hira Malik',
        peerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        lastMessage: 'The poetry recitation segment was mesmerising 🕊️',
        lastMessageTime: 'Nov 16',
        unreadCount: 0,
        isOnline: false,
      },
      {
        threadId: 'th_06',
        senderId: 'u_faizan_sheikh',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_faizan_sheikh',
        peerNickname: 'Faizan Sheikh',
        peerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        lastMessage: 'Next Karachi food tour live stream is planned for Burns Road!',
        lastMessageTime: 'Nov 15',
        unreadCount: 0,
        isOnline: true,
      },
      {
        threadId: 'th_07',
        senderId: 'u_tariq_jamil',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_tariq_jamil',
        peerNickname: 'Tariq Jamil',
        peerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        lastMessage: 'Remember to keep your hydration up during long sessions 💧',
        lastMessageTime: 'Nov 15',
        unreadCount: 0,
        isOnline: false,
      },
      {
        threadId: 'th_08',
        senderId: 'u_ayesha_siddiqui',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_ayesha_siddiqui',
        peerNickname: 'Ayesha Siddiqui',
        peerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        lastMessage: 'Can you recommend the acoustic microphone model you use?',
        lastMessageTime: 'Nov 14',
        unreadCount: 0,
        isOnline: true,
      },
      {
        threadId: 'th_09',
        senderId: 'u_usman_ghani',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_usman_ghani',
        peerNickname: 'Usman Ghani',
        peerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        lastMessage: 'Dropped 10 Super Rockets in your studio earlier! 🚀',
        lastMessageTime: 'Nov 14',
        unreadCount: 0,
        isOnline: false,
      },
      {
        threadId: 'th_10',
        senderId: 'u_nadia_parveen',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_nadia_parveen',
        peerNickname: 'Nadia Parveen',
        peerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastMessage: 'Joined your official Star Club today! Excited to level up.',
        lastMessageTime: 'Nov 13',
        unreadCount: 0,
        isOnline: true,
      },
      {
        threadId: 'th_11',
        senderId: 'u_kamran_malik',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_kamran_malik',
        peerNickname: 'Kamran Malik',
        peerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        lastMessage: 'Weekly agency diamond volume report is finalized. Outstanding work!',
        lastMessageTime: 'Nov 12',
        unreadCount: 0,
        isOnline: false,
      },
      {
        threadId: 'th_12',
        senderId: 'u_popo_support',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_popo_support',
        peerNickname: 'Popo Support Bot',
        peerAvatar: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150',
        lastMessage: 'Your creator identity verification (KYC Level 2) is approved.',
        lastMessageTime: 'Nov 10',
        unreadCount: 0,
        isOnline: true,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 6. FOUR (4) OFFICIAL SYSTEM MESSAGE ROWS
  // Categories: 1. Achievements, 2. System, 3. Account Security, 4. New Followers
  // --------------------------------------------------------------------------
  public static get officialNotices(): FixtureOfficialNotice[] {
    if (this.isError) {
      throw new DesignFixtureError('Failed to synchronize direct messages and official notices. Pull down to refresh.', 'ERR_MESSAGES_TIMEOUT', 'messages');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'notice_01',
        category: 'Achievements',
        badgeLabel: 'Achievement',
        title: 'Million Diamond Milestone Unlocked! 🏆',
        preview: 'Congratulations Amina! You crossed 1,000,000 diamonds received this month. Top Broadcaster badge awarded.',
        timestamp: 'Today, 10:30 AM',
        isRead: false,
        isUrgent: false,
        senderId: 'sys_achieve_01',
        receiverId: 'u_amina_noor',
        senderName: 'Popo Achievement Center',
        senderAvatar: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150',
        unreadCount: 1,
        isOnline: true,
      },
      {
        id: 'notice_02',
        category: 'System',
        badgeLabel: 'Maintenance',
        title: 'Server Upgrade & Live Stream Enhancements ⚡',
        preview: 'Scheduled infrastructure maintenance completed successfully. Enjoy reduced latency on Agora audio/video channels.',
        timestamp: 'Yesterday, 04:00 AM',
        isRead: true,
        isUrgent: false,
        senderId: 'sys_system_01',
        receiverId: 'u_amina_noor',
        senderName: 'Popo System Broadcast',
        senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        unreadCount: 0,
        isOnline: true,
      },
      {
        id: 'notice_03',
        category: 'Account Security',
        badgeLabel: 'Important',
        title: 'New Device Sign-in Verified 🛡️',
        preview: 'A new sign-in was confirmed on your account from Android Pixel device (Karachi, Pakistan). IP 169.58.50.184.',
        timestamp: 'Nov 16, 09:15 PM',
        isRead: true,
        isUrgent: true,
        senderId: 'sys_security_01',
        receiverId: 'u_amina_noor',
        senderName: 'Popo Security Guard',
        senderAvatar: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150',
        unreadCount: 0,
        isOnline: true,
      },
      {
        id: 'notice_04',
        category: 'New Followers',
        badgeLabel: 'Social',
        title: '24 New Followers This Morning 💖',
        preview: 'Ayesha Siddiqui, Tariq Jamil and 22 others started following your live stream studio.',
        timestamp: 'Nov 15, 08:00 AM',
        isRead: false,
        isUrgent: false,
        senderId: 'sys_followers_01',
        receiverId: 'u_amina_noor',
        senderName: 'Followers Assistant',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        unreadCount: 24,
        isOnline: true,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // SQUARE COMMUNITY SOCIAL FEED FIXTURES (6 POSTS)
  // --------------------------------------------------------------------------
  public static get squarePosts(): FixtureSquarePost[] {
    if (this.isError) {
      throw new DesignFixtureError('Failed to synchronize community posts and comments. Pull down to refresh.', 'ERR_SQUARE_TIMEOUT', 'square');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'post_01',
        author: this.profileAminaNoor,
        content: "Getting ready for tonight's acoustic session! Which song should we open with? Leave your requests below 🎸✨ #KarachiNights #LiveMusic",
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        timestamp: '2 hours ago',
        initialLikes: 142,
        initialIsLiked: false,
        comments: [
          {
            id: 'com_01_1',
            authorId: 'u_sana_ali',
            authorName: 'Sana Ali',
            authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            text: 'Definitely start with the Sufi melody! Can’t wait! 🎤',
            timestamp: '1 hour ago',
            likes: 12,
          },
          {
            id: 'com_01_2',
            authorId: 'u_bilal_ahmed',
            authorName: 'Bilal Ahmed',
            authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            text: 'Tuning in from Lahore, front row ready! 🌟',
            timestamp: '45 mins ago',
            likes: 8,
          },
        ],
      },
      {
        id: 'post_02',
        author: this.profileSanaAli,
        content: 'Big announcement! Joining the 1v1 PK tournament tomorrow evening. Who’s team are you on? Drop some fire in the comments! 🔥⚔️',
        imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
        timestamp: '4 hours ago',
        initialLikes: 89,
        initialIsLiked: false,
        comments: [
          {
            id: 'com_02_1',
            authorId: 'u_hamza_tariq',
            authorName: 'Hamza Tariq',
            authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            text: 'Team Sana all the way! 🚀',
            timestamp: '3 hours ago',
            likes: 5,
          },
        ],
      },
      {
        id: 'post_03',
        author: this.profileBilalAhmed,
        content: 'Studio upgrade complete! Added new dynamic microphone condenser for crisper audio in 9-seat party rooms. Check it out tonight! 🎙️🎧',
        imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600',
        timestamp: 'Yesterday',
        initialLikes: 215,
        initialIsLiked: true,
        comments: [
          {
            id: 'com_03_1',
            authorId: 'u_tariq_jamil',
            authorName: 'Tariq Jamil',
            authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            text: 'Looking professional Bilal bhai! Will test the mic later.',
            timestamp: 'Yesterday',
            likes: 14,
          },
        ],
      },
      {
        id: 'post_04',
        author: this.profileZainabKhan,
        content: 'Thank you to everyone who sent Super Rockets during yesterday’s broadcast! We hit the Star Club milestone together! 💖🚀 #StarClub #Milestone',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
        timestamp: 'Yesterday',
        initialLikes: 310,
        initialIsLiked: false,
        comments: [],
      },
      {
        id: 'post_05',
        author: this.profileHamzaTariq,
        content: 'Late night gaming squad starting in 15 minutes! Hosting an open 9-seat voice lounge for anyone who wants to hop on the mic. 🎮🕹️',
        imageUrl: null,
        timestamp: 'Nov 16',
        initialLikes: 67,
        initialIsLiked: false,
        comments: [
          {
            id: 'com_05_1',
            authorId: 'u_faizan_sheikh',
            authorName: 'Faizan Sheikh',
            authorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            text: 'Count me in, grabbing headset now.',
            timestamp: 'Nov 16',
            likes: 3,
          },
        ],
      },
      {
        id: 'post_06',
        author: this.profileFaizanSheikh,
        content: 'Burns Road food street exploration live stream was unforgettable. What city should we visit next? 🍲✨',
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
        timestamp: 'Nov 15',
        initialLikes: 198,
        initialIsLiked: false,
        comments: [
          {
            id: 'com_06_1',
            authorId: 'u_amina_noor',
            authorName: 'Amina Noor',
            authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            text: 'Anarkali in Lahore next for sure!',
            timestamp: 'Nov 15',
            likes: 19,
          },
        ],
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 7. COINS AND POINTS WALLET & ECONOMY
  // --------------------------------------------------------------------------
  public static get wallet(): FixtureWallet {
    if (this.isError) {
      throw new DesignFixtureError('Failed to synchronize coin and point balances. Your transaction records are safely stored on the ledger.', 'ERR_WALLET_SYNC_500', 'wallet');
    }
    if (this.isEmpty) return this.emptyWallet();
    return {
      coinBalance: this.mutableCoinBalance,
      pointsBalance: this.mutablePointsBalance,
      withdrawableUsd: 42.05,
      diamondValue: 420500,
      currencySymbol: '🪙',
      exchangeRateFormatted: '10,000 Points = $1.00 USD',
      totalRechargedUsd: 149.99,
      totalWithdrawnUsd: 420.0,
      estimatedRevenueUsd: 42.05,
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
          description: 'Sent Super Sports Car to Bilal Ahmed',
          amount: '-1,500 coins',
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

  public static get coinPackages(): FixtureCoinPackage[] {
    if (this.isError) {
      throw new DesignFixtureError('Top-up coin catalog unavailable [ERR_STORE_503]', 'ERR_STORE_503');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'pkg_01',
        coins: 5000,
        bonusCoins: 0,
        priceUsd: 0.99,
        pricePkr: 280,
        badgeLabel: 'Popular',
      },
      {
        id: 'pkg_02',
        coins: 25000,
        bonusCoins: 1500,
        priceUsd: 4.99,
        pricePkr: 1400,
        badgeLabel: 'Best Value',
      },
      {
        id: 'pkg_03',
        coins: 55000,
        bonusCoins: 5000,
        priceUsd: 9.99,
        pricePkr: 2800,
        badgeLabel: '10% Bonus',
      },
      {
        id: 'pkg_04',
        coins: 120000,
        bonusCoins: 15000,
        priceUsd: 19.99,
        pricePkr: 5600,
        badgeLabel: 'Hot',
      },
      {
        id: 'pkg_05',
        coins: 320000,
        bonusCoins: 50000,
        priceUsd: 49.99,
        pricePkr: 14000,
        badgeLabel: 'VIP Pack',
      },
      {
        id: 'pkg_06',
        coins: 700000,
        bonusCoins: 120000,
        priceUsd: 99.99,
        pricePkr: 28000,
        badgeLabel: 'Whale Pack',
      },
    ];
  }

  public static get pointsHistory(): FixturePointsRecord[] {
    if (this.isError) {
      throw new DesignFixtureError('Points ledger retrieval timeout [ERR_POINTS_500]', 'ERR_POINTS_500');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'pts_01',
        source: 'Live Stream Gift Revenue',
        amount: 45000,
        timestamp: 'Nov 17, 11:30 PM',
        isCredit: true,
      },
      {
        id: 'pts_02',
        source: 'PK Battle Victory Pool',
        amount: 20000,
        timestamp: 'Nov 16, 10:15 PM',
        isCredit: true,
      },
      {
        id: 'pts_03',
        source: '9-Seat Party Host Pool',
        amount: 12500,
        timestamp: 'Nov 15, 08:45 PM',
        isCredit: true,
      },
      {
        id: 'pts_04',
        source: 'Easypaisa Cash Settlement',
        amount: -50000,
        timestamp: 'Nov 14, 02:00 PM',
        isCredit: false,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 8. GIFTS FIXTURES & BALANCE UPDATE CAPABILITY
  // --------------------------------------------------------------------------
  public static get gifts(): FixtureGift[] {
    if (this.isError) {
      throw new DesignFixtureError('Gift panel repository failure [ERR_GIFTS_503]', 'ERR_GIFTS_503');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'gift_01',
        name: 'Rose Flower',
        iconUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100',
        priceCoins: 10,
        category: 'Popular',
        animationUrl: 'assets/animations/gifts/rose_anim.json',
        comboMax: 99,
      },
      {
        id: 'gift_02',
        name: 'Karachi Chai Cup',
        iconUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=100',
        priceCoins: 50,
        category: 'Special',
        animationUrl: 'assets/animations/gifts/chai_anim.json',
        comboMax: 99,
      },
      {
        id: 'gift_03',
        name: 'Heart Rocket',
        iconUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=100',
        priceCoins: 299,
        category: 'Romantic',
        animationUrl: 'assets/animations/gifts/rocket_anim.json',
        comboMax: 66,
      },
      {
        id: 'gift_04',
        name: 'Super Sports Car',
        iconUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=100',
        priceCoins: 1500,
        category: 'Luxury',
        animationUrl: 'assets/animations/gifts/car_anim.json',
        comboMax: 10,
      },
      {
        id: 'gift_05',
        name: 'Crown Sovereign',
        iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=100',
        priceCoins: 5000,
        category: 'Luxury',
        animationUrl: 'assets/animations/gifts/crown_anim.json',
        comboMax: 5,
      },
      {
        id: 'gift_06',
        name: 'Galaxy Pegasus',
        iconUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100',
        priceCoins: 10000,
        category: 'Special',
        animationUrl: 'assets/animations/gifts/pegasus_anim.json',
        comboMax: 1,
      },
      {
        id: 'gift_07',
        name: 'Golden Lion',
        iconUrl: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=100',
        priceCoins: 25000,
        category: 'Luxury',
        animationUrl: 'assets/animations/gifts/lion_anim.json',
        comboMax: 1,
      },
      {
        id: 'gift_08',
        name: 'Luxury Yacht',
        iconUrl: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=100',
        priceCoins: 50000,
        category: 'Luxury',
        animationUrl: 'assets/animations/gifts/yacht_anim.json',
        comboMax: 1,
      },
    ];
  }

  public static sendGift(giftId: string, recipientUserId: string, count = 1): boolean {
    if (this.isError || this.isEmpty) return false;
    const gift = this.gifts.find((g) => g.id === giftId) || this.gifts[0];
    const totalCost = gift.priceCoins * count;
    if (this.mutableCoinBalance >= totalCost) {
      this.mutableCoinBalance -= totalCost;
      return true;
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // 9. ACTIVE VIP PLAN & VIP HISTORY
  // --------------------------------------------------------------------------
  public static get vipPlan(): FixtureVipPlan {
    if (this.isError) {
      throw new DesignFixtureError('VIP membership status and exclusive privileges could not be loaded. Please try again.', 'ERR_VIP_LOAD_FAILED', 'vip');
    }
    if (this.isEmpty) return this.inactiveVipPlan();
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

  public static get vipPlanHistory(): FixtureVipPlanHistory[] {
    if (this.isError) {
      throw new DesignFixtureError('VIP billing history unavailable [ERR_VIP_HIST_500]', 'ERR_VIP_HIST_500');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'viph_01',
        tierName: 'Crown Sovereign (Tier 3)',
        startDate: '2026-11-01',
        endDate: '2026-12-31',
        pricePaidUsd: 49.99,
        status: 'Active',
      },
      {
        id: 'viph_02',
        tierName: 'Diamond Aristocrat (Tier 2)',
        startDate: '2026-09-01',
        endDate: '2026-10-31',
        pricePaidUsd: 29.99,
        status: 'Expired',
      },
      {
        id: 'viph_03',
        tierName: 'Silver Noble (Tier 1)',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        pricePaidUsd: 9.99,
        status: 'Expired',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 10. EIGHT (8) MEDALS
  // --------------------------------------------------------------------------
  public static get medals(): FixtureMedal[] {
    if (this.isError) {
      throw new DesignFixtureError('Medals collection service failed [ERR_MEDALS_500]', 'ERR_MEDALS_500');
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
        iconEmoji: '✨',
        description: 'Identity verified and certified by Popo Live Trust & Safety',
        isUnlocked: true,
        unlockedDate: '2026-08-01',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 11. FAN CLUB & THREE (3) GUARDIANS
  // --------------------------------------------------------------------------
  public static get fanClub(): FixtureFanClub {
    if (this.isError) {
      throw new DesignFixtureError('Fan club directory timeout [ERR_FANCLUB_TIMEOUT]', 'ERR_FANCLUB_TIMEOUT');
    }
    if (this.isEmpty) return this.emptyFanClub();
    return {
      clubId: 'fc_001',
      clubName: 'Amina Star Club',
      badgeName: 'STAR',
      badgeColorHex: '#FFB800',
      totalMembers: 1840,
      userClubLevel: 12,
      userIntimacyPoints: 14200,
      announcement: 'Welcome to Amina Star Club! Weekly fan badge rewards drop every Sunday 🌟',
      topMembers: [
        {
          userId: 'u_bilal_ahmed',
          nickname: 'Bilal Ahmed',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
          intimacyPoints: 89400,
          rank: 1,
        },
        {
          userId: 'u_faizan_sheikh',
          nickname: 'Faizan Sheikh',
          avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
          intimacyPoints: 56200,
          rank: 2,
        },
        {
          userId: 'u_tariq_jamil',
          nickname: 'Tariq Jamil',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
          intimacyPoints: 42100,
          rank: 3,
        },
      ],
    };
  }

  public static get guardians(): FixtureGuardian[] {
    if (this.isError) {
      throw new DesignFixtureError('Guardian angel shield status unknown [ERR_SHIELD_404]', 'ERR_SHIELD_404');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'guard_01',
        hostUserId: 'u_amina_noor',
        guardianUserId: 'u_bilal_ahmed',
        guardianNickname: 'Bilal Ahmed',
        guardianAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        tier: 'Gold Guardian',
        guardDaysRemaining: 26,
        protectRank: 1,
        customBanner: 'Shield of Karachi ✨',
      },
      {
        id: 'guard_02',
        hostUserId: 'u_amina_noor',
        guardianUserId: 'u_faizan_sheikh',
        guardianNickname: 'Faizan Sheikh',
        guardianAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        tier: 'Silver Guardian',
        guardDaysRemaining: 14,
        protectRank: 2,
        customBanner: 'Acoustic Protector 🛡️',
      },
      {
        id: 'guard_03',
        hostUserId: 'u_amina_noor',
        guardianUserId: 'u_tariq_jamil',
        guardianNickname: 'Tariq Jamil',
        guardianAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        tier: 'Bronze Guardian',
        guardDaysRemaining: 8,
        protectRank: 3,
        customBanner: 'Late Night Defender 🌙',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 12. FRIENDS, FOLLOWERS, AND PROFILE VISITORS
  // --------------------------------------------------------------------------
  public static get friends(): FixtureUserRelation[] {
    if (this.isError) {
      throw new DesignFixtureError('Friend list synchronization failed [ERR_SOCIAL_503]', 'ERR_SOCIAL_503');
    }
    if (this.isEmpty) return [];
    return [
      {
        userId: 'u_sana_ali',
        nickname: 'Sana Ali',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        relationType: 'friend',
        isOnline: true,
        mutualCount: 18,
      },
      {
        userId: 'u_bilal_ahmed',
        nickname: 'Bilal Ahmed',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        relationType: 'friend',
        isOnline: true,
        mutualCount: 24,
      },
      {
        userId: 'u_zainab_khan',
        nickname: 'Zainab Khan',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        relationType: 'friend',
        isOnline: false,
        mutualCount: 12,
      },
      {
        userId: 'u_hamza_tariq',
        nickname: 'Hamza Tariq',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        relationType: 'friend',
        isOnline: true,
        mutualCount: 15,
      },
    ];
  }

  public static get followers(): FixtureUserRelation[] {
    if (this.isError) {
      throw new DesignFixtureError('Follower graph retrieval failed [ERR_SOCIAL_500]', 'ERR_SOCIAL_500');
    }
    if (this.isEmpty) return [];
    return [
      {
        userId: 'u_hira_malik',
        nickname: 'Hira Malik',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        relationType: 'follower',
        isOnline: false,
        mutualCount: 6,
      },
      {
        userId: 'u_faizan_sheikh',
        nickname: 'Faizan Sheikh',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        relationType: 'follower',
        isOnline: true,
        mutualCount: 9,
      },
      {
        userId: 'u_tariq_jamil',
        nickname: 'Tariq Jamil',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        relationType: 'follower',
        isOnline: false,
        mutualCount: 14,
      },
      {
        userId: 'u_ayesha_siddiqui',
        nickname: 'Ayesha Siddiqui',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        relationType: 'follower',
        isOnline: true,
        mutualCount: 8,
      },
    ];
  }

  public static get profileVisitors(): FixtureProfileVisitor[] {
    if (this.isError) {
      throw new DesignFixtureError('Profile visitor tracking unavailable [ERR_VISITOR_503]', 'ERR_VISITOR_503');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'v_01',
        userId: 'u_sana_ali',
        nickname: 'Sana Ali',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        visitTimestamp: '10 minutes ago',
        vipLevel: 2,
      },
      {
        id: 'v_02',
        userId: 'u_bilal_ahmed',
        nickname: 'Bilal Ahmed',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        visitTimestamp: '45 minutes ago',
        vipLevel: 4,
      },
      {
        id: 'v_03',
        userId: 'u_hamza_tariq',
        nickname: 'Hamza Tariq',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        visitTimestamp: '2 hours ago',
        vipLevel: 1,
      },
      {
        id: 'v_04',
        userId: 'u_zainab_khan',
        nickname: 'Zainab Khan',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        visitTimestamp: 'Yesterday',
        vipLevel: 1,
      },
      {
        id: 'v_05',
        userId: 'u_hira_malik',
        nickname: 'Hira Malik',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        visitTimestamp: '2 days ago',
        vipLevel: 1,
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 13. SUCCESSFUL AND INVALID REDEEM CODES
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

  public static redeemCode(code: string): FixtureRedeemCode {
    if (this.isError) {
      throw new DesignFixtureError('Promotional code validation server is currently busy. Your code was not redeemed. Please retry in a few moments.', 'ERR_REDEEM_SYSTEM_BUSY', 'redeemCode');
    }
    const clean = code.trim().toUpperCase();
    if (clean === this.successfulRedeemCode.code) {
      this.mutableCoinBalance += this.successfulRedeemCode.coinReward;
      return this.successfulRedeemCode;
    } else if (clean === this.expiredRedeemCode.code) {
      return this.expiredRedeemCode;
    }
    return this.invalidRedeemCode;
  }

  // --------------------------------------------------------------------------
  // 14. TASKS, REWARDS, AND RANKINGS
  // --------------------------------------------------------------------------
  public static get tasksAndRewards(): FixtureTask[] {
    if (this.isError) {
      throw new DesignFixtureError('Task progress sync failed: Server busy [ERR_TASK_SYNC_503]', 'ERR_TASK_SYNC_503');
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

  public static get claimableTasksCount(): number {
    if (this.isError || this.isEmpty) return 0;
    return this.tasksAndRewards.filter((t) => t.status === 'completed' && !t.isClaimed).length;
  }

  public static get hostRankings(): FixtureHostRanking[] {
    if (this.isError) {
      throw new DesignFixtureError('Leaderboard database timeout [ERR_RANKINGS_TIMEOUT]', 'ERR_RANKINGS_TIMEOUT');
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
        hostNickname: 'Tariq Jamil',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        diamondsEarned: 380000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 22,
      },
    ];
  }

  public static get eventRankings(): FixtureEventRanking[] {
    if (this.isError) {
      throw new DesignFixtureError('Event leaderboard unreachable [ERR_EVENT_500]', 'ERR_EVENT_500');
    }
    if (this.isEmpty) return [];
    return [
      {
        rank: 1,
        eventName: 'Karachi Nights Star Hunt 2026',
        hostNickname: 'Amina Noor',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        eventPoints: 2450000,
        badgeTitle: 'Grand Champion',
      },
      {
        rank: 2,
        eventName: 'Karachi Nights Star Hunt 2026',
        hostNickname: 'Sana Ali',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        eventPoints: 1920000,
        badgeTitle: '1st Runner Up',
      },
      {
        rank: 3,
        eventName: 'Karachi Nights Star Hunt 2026',
        hostNickname: 'Zainab Khan',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        eventPoints: 1340000,
        badgeTitle: '2nd Runner Up',
      },
      {
        rank: 4,
        eventName: 'Karachi Nights Star Hunt 2026',
        hostNickname: 'Hamza Tariq',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        eventPoints: 980000,
        badgeTitle: 'Finalist',
      },
      {
        rank: 5,
        eventName: 'Karachi Nights Star Hunt 2026',
        hostNickname: 'Bilal Ahmed',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        eventPoints: 850000,
        badgeTitle: 'Finalist',
      },
    ];
  }

  public static get rewardHistory(): FixtureRewardHistory[] {
    if (this.isError) {
      throw new DesignFixtureError('Reward redemption log unreachable [ERR_REWARD_LOG_500]', 'ERR_REWARD_LOG_500');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'rh_01',
        taskTitle: 'Join a 9-Seat Party Room for 15 Mins',
        rewardText: '300 Free Coins',
        claimedAt: 'Today, 10:15 AM',
      },
      {
        id: 'rh_02',
        taskTitle: 'Daily Check-in Day 5',
        rewardText: '100 Free Coins',
        claimedAt: 'Yesterday, 09:00 AM',
      },
      {
        id: 'rh_03',
        taskTitle: 'Send 5 Live Chat Comments',
        rewardText: '50 Free Coins',
        claimedAt: 'Nov 16, 04:30 PM',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 15. STORE ITEMS & BACKPACK
  // --------------------------------------------------------------------------
  public static readonly storeCategories: string[] = [
    'Avatar Frame',
    'Entrance Effect',
    'Chat Bubble',
    'Special Badge',
  ];

  public static get storeItems(): FixtureStoreItem[] {
    if (this.isError) {
      throw new DesignFixtureError('Failed to load virtual store items and owned bag items. Please check your internet connection.', 'ERR_STORE_INVENTORY_503', 'store');
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
        description: 'Majestic celestial golden dragon animated border for creator profile avatars.',
        isHot: true,
      },
      {
        id: 'store_02',
        title: 'Cyberpunk Neon Ride Entrance',
        category: 'Entrance Effect',
        priceCoins: 85000,
        validityDays: 30,
        previewImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=200',
        description: 'High-octane neon supercar entrance banner that plays across the audience screen.',
        isHot: true,
      },
      {
        id: 'store_03',
        title: 'Karachi Nights Glowing Bubble',
        category: 'Chat Bubble',
        priceCoins: 12000,
        validityDays: 15,
        previewImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200',
        description: 'Luminous violet chat bubble styling all comments posted in live broadcasting channels.',
        isHot: false,
      },
      {
        id: 'store_04',
        title: 'Royal Rose Crown Ring',
        category: 'Avatar Frame',
        priceCoins: 25000,
        validityDays: 30,
        previewImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200',
        description: 'Romantic ruby-encrusted tiara ring suited for VIP party room seat faces.',
        isHot: false,
      },
    ];
  }

  public static get bagItems(): FixtureBagItem[] {
    if (this.isError) {
      throw new DesignFixtureError('Backpack inventory retrieval failed [ERR_BAG_TIMEOUT]', 'ERR_BAG_TIMEOUT');
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
  // 16. AGENCY, COIN SELLER, AND WITHDRAWALS
  // --------------------------------------------------------------------------
  public static get agencyInfo(): FixtureAgency {
    if (this.isError) {
      throw new DesignFixtureError('Agency management portal error [ERR_AGENCY_PORTAL_403]', 'ERR_AGENCY_PORTAL_403');
    }
    if (this.isEmpty) return this.emptyAgency();
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

  public static get agencyMembers(): FixtureAgencyMember[] {
    if (this.isError) {
      throw new DesignFixtureError('Agency roster query timeout [ERR_AGENCY_ROSTER_503]', 'ERR_AGENCY_ROSTER_503');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'agym_01',
        userId: 'u_amina_noor',
        nickname: 'Amina Noor',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        hostLevel: 18,
        monthlyDiamonds: 1850000,
        status: 'Active',
      },
      {
        id: 'agym_02',
        userId: 'u_sana_ali',
        nickname: 'Sana Ali',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        hostLevel: 15,
        monthlyDiamonds: 1420000,
        status: 'Active',
      },
      {
        id: 'agym_03',
        userId: 'u_zainab_khan',
        nickname: 'Zainab Khan',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100',
        hostLevel: 14,
        monthlyDiamonds: 980000,
        status: 'Active',
      },
      {
        id: 'agym_04',
        userId: 'u_hamza_tariq',
        nickname: 'Hamza Tariq',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        hostLevel: 12,
        monthlyDiamonds: 760000,
        status: 'Active',
      },
    ];
  }

  public static get coinSellerInfo(): FixtureCoinSeller {
    if (this.isError) {
      throw new DesignFixtureError('Authorized coin seller directory offline [ERR_SELLER_503]', 'ERR_SELLER_503');
    }
    if (this.isEmpty) return this.emptyCoinSeller();
    return {
      sellerId: 'seller_khi_01',
      sellerName: 'Karachi TopUp Express',
      agentName: 'Kamran Malik',
      whatsappContact: '+92 300 8765432',
      verificationBadge: 'Official Verified Reseller',
      rating: 4.98,
      totalOrdersCompleted: 15420,
      paymentMethods: ['Easypaisa', 'JazzCash', 'Raast', 'Bank Transfer (HBL / Meezan)'],
      discountNote: 'Save 5% on direct bank/Easypaisa top-ups compared to store pricing.',
    };
  }

  public static get withdrawalRecords(): FixtureWithdrawalRecord[] {
    if (this.isError) {
      throw new DesignFixtureError('Withdrawal settlement ledger failed [ERR_PAYOUT_TIMEOUT]', 'ERR_PAYOUT_TIMEOUT');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'wd_01',
        amountPoints: 200000,
        amountUsd: 20.0,
        amountPkr: 5600,
        paymentMethod: 'Easypaisa (0300-8765432)',
        status: 'Completed',
        timestamp: 'Nov 14, 2026',
      },
      {
        id: 'wd_02',
        amountPoints: 300000,
        amountUsd: 30.0,
        amountPkr: 8400,
        paymentMethod: 'Meezan Bank (PK89MEZN00018839201)',
        status: 'Processing',
        timestamp: 'Today, 09:12 AM',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // 17. HELP TOPICS AND SUPPORT TICKETS
  // --------------------------------------------------------------------------
  public static get helpTopics(): FixtureHelpTopic[] {
    if (this.isError) {
      throw new DesignFixtureError('Help center knowledge base unreachable [ERR_HELP_503]', 'ERR_HELP_503');
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

  public static get supportTickets(): FixtureSupportTicket[] {
    if (this.isError) {
      throw new DesignFixtureError('Customer support ticketing system is temporarily unreachable. Help topics and tickets are offline.', 'ERR_SUPPORT_TICKETS_500', 'helpTickets');
    }
    if (this.isEmpty) return [];
    return [
      {
        id: 'tkt_01',
        ticketNumber: 'TKT-2026-891',
        category: 'Payment',
        subject: 'Coin top-up confirmation delay',
        status: 'Resolved',
        lastUpdated: 'Yesterday, 11:45 AM',
      },
      {
        id: 'tkt_02',
        ticketNumber: 'TKT-2026-904',
        category: 'Broadcasting',
        subject: 'Audio lag during 9-seat party stream',
        status: 'In Review',
        lastUpdated: 'Today, 08:30 AM',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // STATIC INTERNAL PROFILES
  // --------------------------------------------------------------------------
  public static readonly profileAminaNoor: FixtureUserProfile = {
    userId: 'u_amina_noor',
    poppoId: '8839201',
    nickname: 'Amina Noor',
    username: 'amina.noor',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    bio: 'Singing from the heart of Karachi 🎤✨ Acoustic soul & pop vocalist.',
    gender: 'female',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 12,
    hostLevel: 18,
    vipLevel: 3,
    vipStatus: 'Crown Sovereign',
    coinBalance: 154200,
    pointsBalance: 420500,
    followingCount: 84,
    followersCount: 14200,
    friendsCount: 36,
    visitorCount: 18950,
    isHostEligible: true,
    isLiveNow: true,
    currentLiveRoomId: 'room_001',
  };

  public static readonly profileSanaAli: FixtureUserProfile = {
    userId: 'u_sana_ali',
    poppoId: '8839202',
    nickname: 'Sana Ali',
    username: 'sana.ali',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    bio: 'Host, content creator & Karachi food explorer ☕🍕',
    gender: 'female',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 14,
    hostLevel: 15,
    vipLevel: 2,
    vipStatus: 'Diamond Aristocrat',
    coinBalance: 85400,
    pointsBalance: 210000,
    followingCount: 120,
    followersCount: 9800,
    friendsCount: 42,
    visitorCount: 11400,
    isHostEligible: true,
    isLiveNow: true,
    currentLiveRoomId: 'room_002',
  };

  public static readonly profileBilalAhmed: FixtureUserProfile = {
    userId: 'u_bilal_ahmed',
    poppoId: '8839203',
    nickname: 'Bilal Ahmed',
    username: 'bilal.ahmed',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    bio: 'Tech enthusiast & pro gamer 🎮 Top contributor in Karachi Nights.',
    gender: 'male',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 22,
    hostLevel: 8,
    vipLevel: 4,
    vipStatus: 'Royal Sovereign',
    coinBalance: 320000,
    pointsBalance: 95000,
    followingCount: 45,
    followersCount: 3400,
    friendsCount: 18,
    visitorCount: 6200,
    isHostEligible: true,
    isLiveNow: true,
    currentLiveRoomId: 'room_003',
  };

  public static readonly profileZainabKhan: FixtureUserProfile = {
    userId: 'u_zainab_khan',
    poppoId: '8839204',
    nickname: 'Zainab Khan',
    username: 'zainab.khan',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
    bio: 'Classical sitar & Eastern fusion beats from Lahore 🪕✨',
    gender: 'female',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 10,
    hostLevel: 14,
    vipLevel: 1,
    vipStatus: 'Silver Noble',
    coinBalance: 42000,
    pointsBalance: 310000,
    followingCount: 95,
    followersCount: 7400,
    friendsCount: 29,
    visitorCount: 8900,
    isHostEligible: true,
    isLiveNow: true,
    currentLiveRoomId: 'room_004',
  };

  public static readonly profileHamzaTariq: FixtureUserProfile = {
    userId: 'u_hamza_tariq',
    poppoId: '8839205',
    nickname: 'Hamza Tariq',
    username: 'hamza.tariq',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    bio: 'Standup comedy, mimicry & late-night laughs 😂🎭',
    gender: 'male',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 9,
    hostLevel: 12,
    vipLevel: 1,
    vipStatus: 'Silver Noble',
    coinBalance: 28000,
    pointsBalance: 175000,
    followingCount: 110,
    followersCount: 6800,
    friendsCount: 24,
    visitorCount: 5400,
    isHostEligible: true,
    isLiveNow: true,
    currentLiveRoomId: 'room_005',
  };

  public static readonly profileHiraMalik: FixtureUserProfile = {
    userId: 'u_hira_malik',
    poppoId: '8839206',
    nickname: 'Hira Malik',
    username: 'hira.malik',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
    bio: 'Sufi dance, poetry & artistic storytelling 📜🕊️',
    gender: 'female',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 8,
    hostLevel: 11,
    vipLevel: 1,
    vipStatus: 'Silver Noble',
    coinBalance: 35000,
    pointsBalance: 142000,
    followingCount: 60,
    followersCount: 5200,
    friendsCount: 22,
    visitorCount: 4700,
    isHostEligible: true,
    isLiveNow: true,
    currentLiveRoomId: 'room_006',
  };

  public static readonly profileFaizanSheikh: FixtureUserProfile = {
    userId: 'u_faizan_sheikh',
    poppoId: '8839207',
    nickname: 'Faizan Sheikh',
    username: 'faizan.sheikh',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
    bio: 'Karachi street food explorer & chef live 🍲🌶️',
    gender: 'male',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 16,
    hostLevel: 10,
    vipLevel: 2,
    vipStatus: 'Diamond Aristocrat',
    coinBalance: 110000,
    pointsBalance: 128000,
    followingCount: 88,
    followersCount: 4900,
    friendsCount: 31,
    visitorCount: 7100,
    isHostEligible: true,
    isLiveNow: true,
    currentLiveRoomId: 'room_007',
  };

  public static readonly profileTariqJamil: FixtureUserProfile = {
    userId: 'u_tariq_jamil',
    poppoId: '8839208',
    nickname: 'Tariq Jamil',
    username: 'tariq.jamil',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
    bio: 'Fitness trainer & motivational live mentor 🏋️‍♂️⚡',
    gender: 'male',
    country: 'Pakistan',
    countryCode: 'PK',
    flagEmoji: '🇵🇰',
    wealthLevel: 15,
    hostLevel: 9,
    vipLevel: 2,
    vipStatus: 'Diamond Aristocrat',
    coinBalance: 92000,
    pointsBalance: 115000,
    followingCount: 150,
    followersCount: 4100,
    friendsCount: 45,
    visitorCount: 6800,
    isHostEligible: true,
    isLiveNow: true,
    currentLiveRoomId: 'room_008',
  };

  // Helper factory for empty states
  private static emptyUserProfile(): FixtureUserProfile {
    return {
      userId: '',
      poppoId: '',
      nickname: 'Guest User',
      username: 'guest',
      avatarUrl: '',
      bio: '',
      gender: 'unspecified',
      country: 'Pakistan',
      countryCode: 'PK',
      flagEmoji: '🇵🇰',
      wealthLevel: 1,
      hostLevel: 1,
      vipLevel: 0,
      vipStatus: 'None',
      coinBalance: 0,
      pointsBalance: 0,
      followingCount: 0,
      followersCount: 0,
      friendsCount: 0,
      visitorCount: 0,
      isHostEligible: false,
      isLiveNow: false,
    };
  }

  private static emptyLiveViewer(): FixtureLiveViewer {
    return {
      roomId: '',
      roomNumber: '',
      title: 'Broadcast Ended',
      host: this.emptyUserProfile(),
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

  private static emptyWallet(): FixtureWallet {
    return {
      coinBalance: 0,
      pointsBalance: 0,
      withdrawableUsd: 0,
      diamondValue: 0,
      currencySymbol: '🪙',
      exchangeRateFormatted: '10,000 Points = $1.00 USD',
      totalRechargedUsd: 0,
      totalWithdrawnUsd: 0,
      estimatedRevenueUsd: 0,
      recentTransactions: [],
    };
  }

  private static inactiveVipPlan(): FixtureVipPlan {
    return {
      tierLevel: 0,
      tierName: 'None',
      isActive: false,
      expiryDate: 'N/A',
      daysRemaining: 0,
      progressPercentage: 0,
      pointsToNextTier: 10000,
      badgeAsset: '',
      privileges: [],
    };
  }

  private static emptyFanClub(): FixtureFanClub {
    return {
      clubId: '',
      clubName: 'Not Joined',
      badgeName: 'FAN',
      badgeColorHex: '#CCCCCC',
      totalMembers: 0,
      userClubLevel: 0,
      userIntimacyPoints: 0,
      announcement: '',
      topMembers: [],
    };
  }

  private static emptyAgency(): FixtureAgency {
    return {
      agencyId: '',
      agencyCode: '',
      agencyName: 'Unassigned',
      agentLeader: 'None',
      contactPhone: '',
      registeredCity: '',
      totalActiveHosts: 0,
      monthlyDiamondVolume: 0,
      commissionTierPercentage: 0,
      settlementStatus: 'Unregistered',
      announcement: '',
    };
  }

  private static emptyCoinSeller(): FixtureCoinSeller {
    return {
      sellerId: '',
      sellerName: 'None',
      agentName: 'None',
      whatsappContact: '',
      verificationBadge: 'Unverified',
      rating: 0,
      totalOrdersCompleted: 0,
      paymentMethods: [],
      discountNote: '',
    };
  }

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
      isLocked: false,
      canJoin: true,
      joinRequestStatus: 'none',
    };
  }
}
