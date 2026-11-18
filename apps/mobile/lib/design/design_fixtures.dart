// ==============================================================================
// POPO LIVE — MOBILE DESIGN FIXTURES (PHASE 1 - D0 - PROMPT 3)
// Path: apps/mobile/lib/design/design_fixtures.dart
//
// Clean, strongly-typed design fixtures for offline UI development,
// visual inspection, state previews, and widget testing.
//
// Fictional test data: Amina Noor, Sana Ali, Karachi Nights, and peers.
// ==============================================================================

/// Selectable design states for UI prototyping and acceptance testing.
enum DesignFixtureState {
  /// Full realistic UI fixtures populated with rich content.
  filled,

  /// Zero-state UI fixtures (empty lists, 0 balances, no messages).
  empty,

  /// Error-state representations and simulated network/service exceptions.
  error,
}

/// ============================================================================
/// STATE SWITCH CONTROLLER
/// Change [activeDesignFixtureState] below to toggle the design mode globally.
/// ============================================================================
const DesignFixtureState activeDesignFixtureState = DesignFixtureState.filled;

/// Exception thrown when accessing fixtures while in [DesignFixtureState.error]
class DesignFixtureException implements Exception {
  final String message;
  final String code;

  const DesignFixtureException({
    required this.message,
    this.code = 'FIXTURE_SIMULATED_ERROR',
  });

  @override
  String toString() => 'DesignFixtureException [$code]: $message';
}

/// Central fixture repository providing access to all mobile design data
class DesignFixtures {
  /// Mutable state switch, initialized from [activeDesignFixtureState].
  static DesignFixtureState currentState = activeDesignFixtureState;

  /// Helper to check current state
  static bool get isFilled => currentState == DesignFixtureState.filled;
  static bool get isEmpty => currentState == DesignFixtureState.empty;
  static bool get isError => currentState == DesignFixtureState.error;

  /// Sets state programmatically for runtime UI testing
  static void setState(DesignFixtureState state) {
    currentState = state;
  }

  /// Resets state to default filled mode
  static void reset() {
    currentState = DesignFixtureState.filled;
    _mutableCoinBalance = 154200;
    _mutablePointsBalance = 420500;
  }

  // Mutable state cache for UI simulation
  static int _mutableCoinBalance = 154200;
  static int _mutablePointsBalance = 420500;

  // --------------------------------------------------------------------------
  // 1. USER PROFILES
  // --------------------------------------------------------------------------
  static FixtureUserProfile get currentUserProfile {
    if (isError) {
      throw const DesignFixtureException(
        message:
            'Failed to load user profile: Service temporarily unavailable [ERR_503]',
      );
    }
    if (isEmpty) return FixtureUserProfile.empty();
    return _profileAminaNoor;
  }

  static List<FixtureUserProfile> get userProfiles {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Failed to query user profiles list [ERR_500]',
      );
    }
    if (isEmpty) return const [];
    return const [
      _profileAminaNoor,
      _profileSanaAli,
      _profileBilalAhmed,
      _profileZainabKhan,
      _profileHamzaTariq,
      _profileHiraMalik,
      _profileFaizanSheikh,
      _profileTariqJamil,
    ];
  }

  // --------------------------------------------------------------------------
  // 2. LIVE VIEWER FIXTURE
  // --------------------------------------------------------------------------
  static FixtureLiveViewer get liveViewer {
    if (isError) {
      throw const DesignFixtureException(
        message:
            'Live stream connection refused: Agora channel timeout [ERR_RTC_408]',
      );
    }
    if (isEmpty) return FixtureLiveViewer.empty();
    return const FixtureLiveViewer(
      roomId: 'room_001',
      roomNumber: '883901',
      title: 'Karachi Nights 🎶 Acoustic Live Session',
      host: _profileAminaNoor,
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
      pinnedAnnouncement:
          'Welcome to Karachi Nights! Request songs in the live chat 🎸✨',
      topContributors: [
        _profileBilalAhmed,
        _profileFaizanSheikh,
        _profileTariqJamil,
      ],
      recentChatMessages: [
        FixtureLiveChatMessage(
          id: 'lmsg_01',
          senderNickname: 'Sana Ali',
          senderAvatar:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          senderLevel: 14,
          isVip: true,
          content:
              'Sing the acoustic version of Karachi Nights again please! ❤️',
          timestamp: 'Just now',
        ),
        FixtureLiveChatMessage(
          id: 'lmsg_02',
          senderNickname: 'Bilal Ahmed',
          senderAvatar:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          senderLevel: 22,
          isVip: true,
          content: 'Sent a Super Sports Car 🏎️💨 keep rocking!',
          timestamp: '1m ago',
        ),
        FixtureLiveChatMessage(
          id: 'lmsg_03',
          senderNickname: 'Hamza Tariq',
          senderAvatar:
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          senderLevel: 9,
          isVip: false,
          content: 'Greetings from Lahore! Brilliant voice Amina.',
          timestamp: '2m ago',
        ),
      ],
    );
  }

  // --------------------------------------------------------------------------
  // 3. EIGHT (8) LIVE ROOMS
  // --------------------------------------------------------------------------
  static List<FixtureLiveRoom> get liveRooms {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Failed to fetch live broadcast feeds [ERR_GATEWAY_TIMEOUT]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureLiveRoom(
        id: 'room_001',
        roomNumber: '883901',
        title: 'Karachi Nights 🎶 Acoustic Live Session',
        hostNickname: 'Amina Noor',
        hostAvatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        category: 'Singing',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 1420,
        heatScore: 98500,
        isLive: true,
        isPkActive: false,
        tags: ['Acoustic', 'Karachi', 'Vocals'],
      ),
      FixtureLiveRoom(
        id: 'room_002',
        roomNumber: '883902',
        title: 'Chai & Midnight Chill Talk ☕🌙',
        hostNickname: 'Sana Ali',
        hostAvatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600',
        category: 'ChitChat',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 980,
        heatScore: 64200,
        isLive: true,
        isPkActive: true,
        tags: ['Podcast', 'Chai', 'LateNight'],
      ),
      FixtureLiveRoom(
        id: 'room_003',
        roomNumber: '883903',
        title: 'Gaming Marathon & Battle Arena 🎮🔥',
        hostNickname: 'Bilal Ahmed',
        hostAvatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
        category: 'Gaming',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 1850,
        heatScore: 112000,
        isLive: true,
        isPkActive: false,
        tags: ['Esports', 'Battlefield', 'Action'],
      ),
      FixtureLiveRoom(
        id: 'room_004',
        roomNumber: '883904',
        title: 'Lahore Beats & Eastern Classical 🪕✨',
        hostNickname: 'Zainab Khan',
        hostAvatar:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600',
        category: 'Music',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 740,
        heatScore: 48900,
        isLive: true,
        isPkActive: false,
        tags: ['Classical', 'Sufi', 'Lahore'],
      ),
      FixtureLiveRoom(
        id: 'room_005',
        roomNumber: '883905',
        title: 'Standup Comedy & Talent Hunt 😂🎭',
        hostNickname: 'Hamza Tariq',
        hostAvatar:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600',
        category: 'Comedy',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 1120,
        heatScore: 78500,
        isLive: true,
        isPkActive: true,
        tags: ['Comedy', 'Mimicry', 'Talent'],
      ),
      FixtureLiveRoom(
        id: 'room_006',
        roomNumber: '883906',
        title: 'Sufi Soul & Poetry Night 📜🕊️',
        hostNickname: 'Hira Malik',
        hostAvatar:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
        category: 'Dance',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 630,
        heatScore: 41200,
        isLive: true,
        isPkActive: false,
        tags: ['Sufi', 'Poetry', 'Peace'],
      ),
      FixtureLiveRoom(
        id: 'room_007',
        roomNumber: '883907',
        title: 'Karachi Street Food & Kitchen Diaries 🍲🌶️',
        hostNickname: 'Faizan Sheikh',
        hostAvatar:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
        category: 'Cooking',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 890,
        heatScore: 56700,
        isLive: true,
        isPkActive: false,
        tags: ['Food', 'Biryani', 'Recipes'],
      ),
      FixtureLiveRoom(
        id: 'room_008',
        roomNumber: '883908',
        title: 'Late Night Fitness & Cardio Motivation 🏋️‍♂️⚡',
        hostNickname: 'Tariq Jamil',
        hostAvatar:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600',
        category: 'Fitness',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 450,
        heatScore: 32100,
        isLive: true,
        isPkActive: false,
        tags: ['Fitness', 'Workout', 'Health'],
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 4. SIX (6) MULTI-SEAT PARTY ROOMS WITH EXACTLY 9 SEAT POSITIONS
  // --------------------------------------------------------------------------
  static List<FixturePartyRoom> get partyRooms {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Failed to join party room cluster [ERR_RTC_ROSTER_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixturePartyRoom(
        id: 'party_001',
        roomNumber: '771001',
        title: 'Late Night Tea House & Chai Pe Charcha ☕',
        hostNickname: 'Amina Noor',
        hostAvatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        hostUserId: 'u_amina_noor',
        coverUrl:
            'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500',
        category: 'ChitChat',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 380,
        maxSeats: 9,
        occupiedSeatCount: 5,
        joinStatus: 'open',
        seats: [
          FixturePartySeat(
            index: 1,
            userId: 'u_amina_noor',
            nickname: 'Amina Noor',
            avatarUrl:
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 12500,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 2,
            userId: 'u_sana_ali',
            nickname: 'Sana Ali',
            avatarUrl:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 8900,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 3,
            userId: 'u_bilal_ahmed',
            nickname: 'Bilal Ahmed',
            avatarUrl:
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 6400,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 4,
            userId: 'u_hamza_tariq',
            nickname: 'Hamza Tariq',
            avatarUrl:
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            isHost: false,
            isMuted: true,
            isSpeaking: false,
            giftPoints: 4300,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 5,
            userId: 'u_zainab_khan',
            nickname: 'Zainab Khan',
            avatarUrl:
                'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 3100,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat.empty(6),
          FixturePartySeat.empty(7),
          FixturePartySeat.empty(8),
          FixturePartySeat.empty(9),
        ],
      ),
      FixturePartyRoom(
        id: 'party_002',
        roomNumber: '771002',
        title: 'Music Jam & Acoustic Showcase 🎸',
        hostNickname: 'Zainab Khan',
        hostAvatar:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        hostUserId: 'u_zainab_khan',
        coverUrl:
            'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500',
        category: 'Music',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 290,
        maxSeats: 9,
        occupiedSeatCount: 3,
        joinStatus: 'open',
        seats: [
          FixturePartySeat(
            index: 1,
            userId: 'u_zainab_khan',
            nickname: 'Zainab Khan',
            avatarUrl:
                'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 9200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 2,
            userId: 'u_faizan_sheikh',
            nickname: 'Faizan Sheikh',
            avatarUrl:
                'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 5400,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 3,
            userId: 'u_ayesha_siddiqui',
            nickname: 'Ayesha Siddiqui',
            avatarUrl:
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 7800,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat.empty(4),
          FixturePartySeat.empty(5),
          FixturePartySeat.empty(6),
          FixturePartySeat.empty(7),
          FixturePartySeat.empty(8),
          FixturePartySeat.empty(9),
        ],
      ),
      FixturePartyRoom(
        id: 'party_003',
        roomNumber: '771003',
        title: 'Urdu Poetry & Mushaira Circle 📖',
        hostNickname: 'Hira Malik',
        hostAvatar:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        hostUserId: 'u_hira_malik',
        coverUrl:
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
        category: 'Poetry',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 210,
        maxSeats: 9,
        occupiedSeatCount: 4,
        joinStatus: 'open',
        seats: [
          FixturePartySeat(
            index: 1,
            userId: 'u_hira_malik',
            nickname: 'Hira Malik',
            avatarUrl:
                'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 8100,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 2,
            userId: 'u_amina_noor',
            nickname: 'Amina Noor',
            avatarUrl:
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 6200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 3,
            userId: 'u_tariq_jamil',
            nickname: 'Tariq Jamil',
            avatarUrl:
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            isHost: false,
            isMuted: true,
            isSpeaking: false,
            giftPoints: 3400,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 4,
            userId: 'u_usman_ghani',
            nickname: 'Usman Ghani',
            avatarUrl:
                'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 4900,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat.empty(5),
          FixturePartySeat.empty(6),
          FixturePartySeat.empty(7),
          FixturePartySeat.empty(8),
          FixturePartySeat.empty(9),
        ],
      ),
      FixturePartyRoom(
        id: 'party_004',
        roomNumber: '771004',
        title: 'Gaming Lounge & Squad Up 🎮',
        hostNickname: 'Bilal Ahmed',
        hostAvatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        hostUserId: 'u_bilal_ahmed',
        coverUrl:
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500',
        category: 'Gaming',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 450,
        maxSeats: 9,
        occupiedSeatCount: 4,
        joinStatus: 'open',
        seats: [
          FixturePartySeat(
            index: 1,
            userId: 'u_bilal_ahmed',
            nickname: 'Bilal Ahmed',
            avatarUrl:
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 15400,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 2,
            userId: 'u_hamza_tariq',
            nickname: 'Hamza Tariq',
            avatarUrl:
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 9800,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 3,
            userId: 'u_faizan_sheikh',
            nickname: 'Faizan Sheikh',
            avatarUrl:
                'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 8700,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 4,
            userId: 'u_nadia_parveen',
            nickname: 'Nadia Parveen',
            avatarUrl:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isHost: false,
            isMuted: true,
            isSpeaking: false,
            giftPoints: 6200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat.empty(5),
          FixturePartySeat.empty(6),
          FixturePartySeat.empty(7),
          FixturePartySeat.empty(8),
          FixturePartySeat.empty(9),
        ],
      ),
      FixturePartyRoom(
        id: 'party_005',
        roomNumber: '771005',
        title: 'Karachi Talent & Voice Battle 🎤',
        hostNickname: 'Hamza Tariq',
        hostAvatar:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        hostUserId: 'u_hamza_tariq',
        coverUrl:
            'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=500',
        category: 'Talent',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 340,
        maxSeats: 9,
        occupiedSeatCount: 3,
        joinStatus: 'open',
        seats: [
          FixturePartySeat(
            index: 1,
            userId: 'u_hamza_tariq',
            nickname: 'Hamza Tariq',
            avatarUrl:
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 11200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 2,
            userId: 'u_sana_ali',
            nickname: 'Sana Ali',
            avatarUrl:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 7600,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 3,
            userId: 'u_zainab_khan',
            nickname: 'Zainab Khan',
            avatarUrl:
                'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 8300,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat.empty(4),
          FixturePartySeat.empty(5),
          FixturePartySeat.empty(6),
          FixturePartySeat.empty(7),
          FixturePartySeat.empty(8),
          FixturePartySeat.empty(9),
        ],
      ),
      FixturePartyRoom(
        id: 'party_006',
        roomNumber: '771006',
        title: 'Midnight Gossip & Friend Finder 🌙',
        hostNickname: 'Sana Ali',
        hostAvatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        hostUserId: 'u_sana_ali',
        coverUrl:
            'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500',
        category: 'Social',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 520,
        maxSeats: 9,
        occupiedSeatCount: 6,
        joinStatus: 'open',
        seats: [
          FixturePartySeat(
            index: 1,
            userId: 'u_sana_ali',
            nickname: 'Sana Ali',
            avatarUrl:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            isHost: true,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 14200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 2,
            userId: 'u_amina_noor',
            nickname: 'Amina Noor',
            avatarUrl:
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 12100,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 3,
            userId: 'u_bilal_ahmed',
            nickname: 'Bilal Ahmed',
            avatarUrl:
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 9500,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 4,
            userId: 'u_hira_malik',
            nickname: 'Hira Malik',
            avatarUrl:
                'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: false,
            giftPoints: 7200,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 5,
            userId: 'u_tariq_jamil',
            nickname: 'Tariq Jamil',
            avatarUrl:
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            isHost: false,
            isMuted: true,
            isSpeaking: false,
            giftPoints: 5800,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat(
            index: 6,
            userId: 'u_ayesha_siddiqui',
            nickname: 'Ayesha Siddiqui',
            avatarUrl:
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            isHost: false,
            isMuted: false,
            isSpeaking: true,
            giftPoints: 8900,
            isOccupied: true,
            isLocked: false,
            canJoin: false,
            joinRequestStatus: 'accepted',
          ),
          FixturePartySeat.empty(7),
          FixturePartySeat.empty(8),
          FixturePartySeat.empty(9),
        ],
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 5. TWELVE (12) DIRECT INBOX CHATS
  // --------------------------------------------------------------------------
  static List<FixtureChatThread> get inboxChats {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Inbox message store unreachable [ERR_IM_TIMEOUT]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureChatThread(
        threadId: 'th_01',
        senderId: 'u_sana_ali',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_sana_ali',
        peerNickname: 'Sana Ali',
        peerAvatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastMessage: 'Are we doing the dual acoustic PK battle tomorrow night?',
        lastMessageTime: '10:45 AM',
        unreadCount: 2,
        isOnline: true,
      ),
      FixtureChatThread(
        threadId: 'th_02',
        senderId: 'u_bilal_ahmed',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_bilal_ahmed',
        peerNickname: 'Bilal Ahmed',
        peerAvatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        lastMessage: 'Loved the guitar solo in your live stream today! 🎸✨',
        lastMessageTime: '09:30 AM',
        unreadCount: 0,
        isOnline: true,
      ),
      FixtureChatThread(
        threadId: 'th_03',
        senderId: 'u_zainab_khan',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_zainab_khan',
        peerNickname: 'Zainab Khan',
        peerAvatar:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        lastMessage: 'Sent you the audio stems for our Sufi-fusion track.',
        lastMessageTime: 'Yesterday',
        unreadCount: 1,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_04',
        senderId: 'u_hamza_tariq',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_hamza_tariq',
        peerNickname: 'Hamza Tariq',
        peerAvatar:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        lastMessage: 'Let me know when the next 9-seat party starts!',
        lastMessageTime: 'Yesterday',
        unreadCount: 0,
        isOnline: true,
      ),
      FixtureChatThread(
        threadId: 'th_05',
        senderId: 'u_hira_malik',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_hira_malik',
        peerNickname: 'Hira Malik',
        peerAvatar:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        lastMessage: 'The poetry recitation segment was mesmerising 🕊️',
        lastMessageTime: 'Nov 16',
        unreadCount: 0,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_06',
        senderId: 'u_faizan_sheikh',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_faizan_sheikh',
        peerNickname: 'Faizan Sheikh',
        peerAvatar:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        lastMessage:
            'Next Karachi food tour live stream is planned for Burns Road!',
        lastMessageTime: 'Nov 15',
        unreadCount: 0,
        isOnline: true,
      ),
      FixtureChatThread(
        threadId: 'th_07',
        senderId: 'u_tariq_jamil',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_tariq_jamil',
        peerNickname: 'Tariq Jamil',
        peerAvatar:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        lastMessage:
            'Remember to keep your hydration up during long sessions 💧',
        lastMessageTime: 'Nov 15',
        unreadCount: 0,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_08',
        senderId: 'u_ayesha_siddiqui',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_ayesha_siddiqui',
        peerNickname: 'Ayesha Siddiqui',
        peerAvatar:
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        lastMessage: 'Can you recommend the acoustic microphone model you use?',
        lastMessageTime: 'Nov 14',
        unreadCount: 0,
        isOnline: true,
      ),
      FixtureChatThread(
        threadId: 'th_09',
        senderId: 'u_usman_ghani',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_usman_ghani',
        peerNickname: 'Usman Ghani',
        peerAvatar:
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        lastMessage: 'Dropped 10 Super Rockets in your studio earlier! 🚀',
        lastMessageTime: 'Nov 14',
        unreadCount: 0,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_10',
        senderId: 'u_nadia_parveen',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_nadia_parveen',
        peerNickname: 'Nadia Parveen',
        peerAvatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastMessage:
            'Joined your official Star Club today! Excited to level up.',
        lastMessageTime: 'Nov 13',
        unreadCount: 0,
        isOnline: true,
      ),
      FixtureChatThread(
        threadId: 'th_11',
        senderId: 'u_kamran_malik',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_kamran_malik',
        peerNickname: 'Kamran Malik',
        peerAvatar:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        lastMessage:
            'Weekly agency diamond volume report is finalized. Outstanding work!',
        lastMessageTime: 'Nov 12',
        unreadCount: 0,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_12',
        senderId: 'u_popo_support',
        receiverId: 'u_amina_noor',
        peerUserId: 'u_popo_support',
        peerNickname: 'Popo Support Bot',
        peerAvatar:
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150',
        lastMessage:
            'Your creator identity verification (KYC Level 2) is approved.',
        lastMessageTime: 'Nov 10',
        unreadCount: 0,
        isOnline: true,
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 6. FOUR (4) OFFICIAL SYSTEM MESSAGE ROWS
  // Categories: 1. Achievements, 2. System, 3. Account Security, 4. New Followers
  // --------------------------------------------------------------------------
  static List<FixtureOfficialNotice> get officialNotices {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Official notices service unavailable [ERR_NOTICE_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureOfficialNotice(
        id: 'notice_01',
        category: 'Achievements',
        badgeLabel: 'Achievement',
        title: 'Million Diamond Milestone Unlocked! 🏆',
        preview:
            'Congratulations Amina! You crossed 1,000,000 diamonds received this month. Top Broadcaster badge awarded.',
        timestamp: 'Today, 10:30 AM',
        isRead: false,
        isUrgent: false,
        senderId: 'sys_achieve_01',
        receiverId: 'u_amina_noor',
        senderName: 'Popo Achievement Center',
        senderAvatar:
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=150',
        unreadCount: 1,
        isOnline: true,
      ),
      FixtureOfficialNotice(
        id: 'notice_02',
        category: 'System',
        badgeLabel: 'Maintenance',
        title: 'Server Upgrade & Live Stream Enhancements ⚡',
        preview:
            'Scheduled infrastructure maintenance completed successfully. Enjoy reduced latency on Agora audio/video channels.',
        timestamp: 'Yesterday, 04:00 AM',
        isRead: true,
        isUrgent: false,
        senderId: 'sys_system_01',
        receiverId: 'u_amina_noor',
        senderName: 'Popo System Broadcast',
        senderAvatar:
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        unreadCount: 0,
        isOnline: true,
      ),
      FixtureOfficialNotice(
        id: 'notice_03',
        category: 'Account Security',
        badgeLabel: 'Important',
        title: 'New Device Sign-in Verified 🛡️',
        preview:
            'A new sign-in was confirmed on your account from Android Pixel device (Karachi, Pakistan). IP 169.58.50.184.',
        timestamp: 'Nov 16, 09:15 PM',
        isRead: true,
        isUrgent: true,
        senderId: 'sys_security_01',
        receiverId: 'u_amina_noor',
        senderName: 'Popo Security Guard',
        senderAvatar:
            'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150',
        unreadCount: 0,
        isOnline: true,
      ),
      FixtureOfficialNotice(
        id: 'notice_04',
        category: 'New Followers',
        badgeLabel: 'Social',
        title: '24 New Followers This Morning 💖',
        preview:
            'Ayesha Siddiqui, Tariq Jamil and 22 others started following your live stream studio.',
        timestamp: 'Nov 15, 08:00 AM',
        isRead: false,
        isUrgent: false,
        senderId: 'sys_followers_01',
        receiverId: 'u_amina_noor',
        senderName: 'Followers Assistant',
        senderAvatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        unreadCount: 24,
        isOnline: true,
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 7. COINS AND POINTS WALLET & ECONOMY
  // --------------------------------------------------------------------------
  static FixtureWallet get wallet {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Failed to synchronize wallet balance [ERR_LEDGER_TIMEOUT]',
      );
    }
    if (isEmpty) return FixtureWallet.empty();
    return FixtureWallet(
      coinBalance: _mutableCoinBalance,
      pointsBalance: _mutablePointsBalance,
      withdrawableUsd: 42.05,
      diamondValue: 420500,
      currencySymbol: '🪙',
      exchangeRateFormatted: '10,000 Points = \$1.00 USD',
      totalRechargedUsd: 149.99,
      totalWithdrawnUsd: 420.0,
      estimatedRevenueUsd: 42.05,
      recentTransactions: const [
        FixtureWalletTransaction(
          id: 'tx_01',
          type: 'settlement',
          description: 'Weekly Live Stream Host Settlement',
          amount: '+125,000 pts',
          timestamp: 'Today, 08:30 AM',
          isCredit: true,
        ),
        FixtureWalletTransaction(
          id: 'tx_02',
          type: 'topup',
          description: 'Google Play Coin Pack Top-Up',
          amount: '+50,000 coins',
          timestamp: 'Yesterday, 06:14 PM',
          isCredit: true,
        ),
        FixtureWalletTransaction(
          id: 'tx_03',
          type: 'gift_sent',
          description: 'Sent Super Sports Car to Bilal Ahmed',
          amount: '-1,500 coins',
          timestamp: 'Nov 16, 11:20 PM',
          isCredit: false,
        ),
        FixtureWalletTransaction(
          id: 'tx_04',
          type: 'pk_reward',
          description: 'PK Battle Victory Bonus',
          amount: '+25,000 pts',
          timestamp: 'Nov 15, 09:45 PM',
          isCredit: true,
        ),
      ],
    );
  }

  static List<FixtureCoinPackage> get coinPackages {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Top-up coin catalog unavailable [ERR_STORE_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureCoinPackage(
        id: 'pkg_01',
        coins: 5000,
        bonusCoins: 0,
        priceUsd: 0.99,
        pricePkr: 280,
        badgeLabel: 'Popular',
      ),
      FixtureCoinPackage(
        id: 'pkg_02',
        coins: 25000,
        bonusCoins: 1500,
        priceUsd: 4.99,
        pricePkr: 1400,
        badgeLabel: 'Best Value',
      ),
      FixtureCoinPackage(
        id: 'pkg_03',
        coins: 55000,
        bonusCoins: 5000,
        priceUsd: 9.99,
        pricePkr: 2800,
        badgeLabel: '10% Bonus',
      ),
      FixtureCoinPackage(
        id: 'pkg_04',
        coins: 120000,
        bonusCoins: 15000,
        priceUsd: 19.99,
        pricePkr: 5600,
        badgeLabel: 'Hot',
      ),
      FixtureCoinPackage(
        id: 'pkg_05',
        coins: 320000,
        bonusCoins: 50000,
        priceUsd: 49.99,
        pricePkr: 14000,
        badgeLabel: 'VIP Pack',
      ),
      FixtureCoinPackage(
        id: 'pkg_06',
        coins: 700000,
        bonusCoins: 120000,
        priceUsd: 99.99,
        pricePkr: 28000,
        badgeLabel: 'Whale Pack',
      ),
    ];
  }

  static List<FixturePointsRecord> get pointsHistory {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Points ledger retrieval timeout [ERR_POINTS_500]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixturePointsRecord(
        id: 'pts_01',
        source: 'Live Stream Gift Revenue',
        amount: 45000,
        timestamp: 'Nov 17, 11:30 PM',
        isCredit: true,
      ),
      FixturePointsRecord(
        id: 'pts_02',
        source: 'PK Battle Victory Pool',
        amount: 20000,
        timestamp: 'Nov 16, 10:15 PM',
        isCredit: true,
      ),
      FixturePointsRecord(
        id: 'pts_03',
        source: '9-Seat Party Host Pool',
        amount: 12500,
        timestamp: 'Nov 15, 08:45 PM',
        isCredit: true,
      ),
      FixturePointsRecord(
        id: 'pts_04',
        source: 'Easypaisa Cash Settlement',
        amount: -50000,
        timestamp: 'Nov 14, 02:00 PM',
        isCredit: false,
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 8. GIFTS FIXTURES & BALANCE UPDATE CAPABILITY
  // --------------------------------------------------------------------------
  static List<FixtureGift> get gifts {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Gift panel repository failure [ERR_GIFTS_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureGift(
        id: 'gift_01',
        name: 'Rose Flower',
        iconUrl:
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100',
        priceCoins: 10,
        category: 'Popular',
        animationUrl: 'assets/animations/gifts/rose_anim.json',
        comboMax: 99,
      ),
      FixtureGift(
        id: 'gift_02',
        name: 'Karachi Chai Cup',
        iconUrl:
            'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=100',
        priceCoins: 50,
        category: 'Special',
        animationUrl: 'assets/animations/gifts/chai_anim.json',
        comboMax: 99,
      ),
      FixtureGift(
        id: 'gift_03',
        name: 'Heart Rocket',
        iconUrl:
            'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=100',
        priceCoins: 299,
        category: 'Romantic',
        animationUrl: 'assets/animations/gifts/rocket_anim.json',
        comboMax: 66,
      ),
      FixtureGift(
        id: 'gift_04',
        name: 'Super Sports Car',
        iconUrl:
            'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=100',
        priceCoins: 1500,
        category: 'Luxury',
        animationUrl: 'assets/animations/gifts/car_anim.json',
        comboMax: 10,
      ),
      FixtureGift(
        id: 'gift_05',
        name: 'Crown Sovereign',
        iconUrl:
            'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=100',
        priceCoins: 5000,
        category: 'Luxury',
        animationUrl: 'assets/animations/gifts/crown_anim.json',
        comboMax: 5,
      ),
      FixtureGift(
        id: 'gift_06',
        name: 'Galaxy Pegasus',
        iconUrl:
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=100',
        priceCoins: 10000,
        category: 'Special',
        animationUrl: 'assets/animations/gifts/pegasus_anim.json',
        comboMax: 1,
      ),
      FixtureGift(
        id: 'gift_07',
        name: 'Golden Lion',
        iconUrl:
            'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=100',
        priceCoins: 25000,
        category: 'Luxury',
        animationUrl: 'assets/animations/gifts/lion_anim.json',
        comboMax: 1,
      ),
      FixtureGift(
        id: 'gift_08',
        name: 'Luxury Yacht',
        iconUrl:
            'https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?w=100',
        priceCoins: 50000,
        category: 'Luxury',
        animationUrl: 'assets/animations/gifts/yacht_anim.json',
        comboMax: 1,
      ),
    ];
  }

  /// Simulates sending a gift and updating fixture coin balance
  static bool sendGift({
    required String giftId,
    required String recipientUserId,
    int count = 1,
  }) {
    if (isError || isEmpty) return false;
    final gift =
        gifts.firstWhere((g) => g.id == giftId, orElse: () => gifts.first);
    final totalCost = gift.priceCoins * count;
    if (_mutableCoinBalance >= totalCost) {
      _mutableCoinBalance -= totalCost;
      return true;
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // 9. ACTIVE VIP PLAN & VIP HISTORY
  // --------------------------------------------------------------------------
  static FixtureVipPlan get vipPlan {
    if (isError) {
      throw const DesignFixtureException(
        message: 'VIP membership service unavailable [ERR_VIP_TIMEOUT]',
      );
    }
    if (isEmpty) return FixtureVipPlan.inactive();
    return const FixtureVipPlan(
      tierLevel: 3,
      tierName: 'Crown Sovereign',
      isActive: true,
      expiryDate: '2026-12-31',
      daysRemaining: 43,
      progressPercentage: 0.72,
      pointsToNextTier: 28000,
      badgeAsset: 'assets/vip/vip_tier_3_crown.png',
      privileges: [
        FixtureVipPrivilege(
          id: 'p_01',
          title: 'Custom Entrance Animation',
          description:
              'Golden carriage and celestial fanfare on entering any live room',
          iconName: 'car_crash_rounded',
        ),
        FixtureVipPrivilege(
          id: 'p_02',
          title: 'Exclusive Glowing Avatar Ring',
          description:
              'Prismatic animated border surrounding your profile picture',
          iconName: 'blur_circular_rounded',
        ),
        FixtureVipPrivilege(
          id: 'p_03',
          title: 'Chat Message Highlight',
          description:
              'Golden bubble and bold typography in audience live chats',
          iconName: 'mark_chat_read_rounded',
        ),
        FixtureVipPrivilege(
          id: 'p_04',
          title: 'Stealth Mode Visitor',
          description:
              'Browse rooms without appearing in public visitor counters',
          iconName: 'visibility_off_rounded',
        ),
      ],
    );
  }

  static List<FixtureVipPlanHistory> get vipPlanHistory {
    if (isError) {
      throw const DesignFixtureException(
        message: 'VIP billing history unavailable [ERR_VIP_HIST_500]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureVipPlanHistory(
        id: 'viph_01',
        tierName: 'Crown Sovereign (Tier 3)',
        startDate: '2026-11-01',
        endDate: '2026-12-31',
        pricePaidUsd: 49.99,
        status: 'Active',
      ),
      FixtureVipPlanHistory(
        id: 'viph_02',
        tierName: 'Diamond Aristocrat (Tier 2)',
        startDate: '2026-09-01',
        endDate: '2026-10-31',
        pricePaidUsd: 29.99,
        status: 'Expired',
      ),
      FixtureVipPlanHistory(
        id: 'viph_03',
        tierName: 'Silver Noble (Tier 1)',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        pricePaidUsd: 9.99,
        status: 'Expired',
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 10. EIGHT (8) MEDALS
  // --------------------------------------------------------------------------
  static List<FixtureMedal> get medals {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Medals collection service failed [ERR_MEDALS_500]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureMedal(
        id: 'med_01',
        name: 'Top Broadcaster 2026',
        category: 'Honor',
        rarity: 'Legendary',
        iconEmoji: '🏆',
        description: 'Awarded to creators in the Top 10 national ranking',
        isUnlocked: true,
        unlockedDate: '2026-10-15',
      ),
      FixtureMedal(
        id: 'med_02',
        name: 'Karachi Star',
        category: 'Regional',
        rarity: 'Epic',
        iconEmoji: '⭐',
        description: 'Earned 1M+ live popularity points from Karachi audiences',
        isUnlocked: true,
        unlockedDate: '2026-11-01',
      ),
      FixtureMedal(
        id: 'med_03',
        name: 'Gift Master',
        category: 'Gifting',
        rarity: 'Epic',
        iconEmoji: '🎁',
        description: 'Sent over 100,000 coins in gifts across creator streams',
        isUnlocked: true,
        unlockedDate: '2026-09-20',
      ),
      FixtureMedal(
        id: 'med_04',
        name: 'Loyal Fan Lv.10',
        category: 'Community',
        rarity: 'Rare',
        iconEmoji: '💖',
        description: 'Achieved Level 10 fan status in a verified host club',
        isUnlocked: true,
        unlockedDate: '2026-10-28',
      ),
      FixtureMedal(
        id: 'med_05',
        name: 'PK Champion',
        category: 'Battle',
        rarity: 'Epic',
        iconEmoji: '⚔️',
        description:
            'Achieved 50+ victories in official 1v1 PK battle competitions',
        isUnlocked: true,
        unlockedDate: '2026-11-10',
      ),
      FixtureMedal(
        id: 'med_06',
        name: 'Party Maestro',
        category: 'Party',
        rarity: 'Rare',
        iconEmoji: '🎉',
        description: 'Hosted more than 100 hours in 9-seat party rooms',
        isUnlocked: true,
        unlockedDate: '2026-10-05',
      ),
      FixtureMedal(
        id: 'med_07',
        name: 'Super Guardian',
        category: 'Protection',
        rarity: 'Legendary',
        iconEmoji: '🛡️',
        description: 'Holds an active Guardian Shield protecting a creator',
        isUnlocked: true,
        unlockedDate: '2026-11-02',
      ),
      FixtureMedal(
        id: 'med_08',
        name: 'Verified Creator',
        category: 'Identity',
        rarity: 'Exclusive',
        iconEmoji: '✨',
        description:
            'Identity verified and certified by Popo Live Trust & Safety',
        isUnlocked: true,
        unlockedDate: '2026-08-01',
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 11. FAN CLUB & THREE (3) GUARDIANS
  // --------------------------------------------------------------------------
  static FixtureFanClub get fanClub {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Fan club directory timeout [ERR_FANCLUB_TIMEOUT]',
      );
    }
    if (isEmpty) return FixtureFanClub.empty();
    return const FixtureFanClub(
      clubId: 'fc_001',
      clubName: 'Amina Star Club',
      badgeName: 'STAR',
      badgeColorHex: '#FFB800',
      totalMembers: 1840,
      userClubLevel: 12,
      userIntimacyPoints: 14200,
      announcement:
          'Welcome to Amina Star Club! Weekly fan badge rewards drop every Sunday 🌟',
      topMembers: [
        FixtureFanClubMember(
          userId: 'u_bilal_ahmed',
          nickname: 'Bilal Ahmed',
          avatarUrl:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
          intimacyPoints: 89400,
          rank: 1,
        ),
        FixtureFanClubMember(
          userId: 'u_faizan_sheikh',
          nickname: 'Faizan Sheikh',
          avatarUrl:
              'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100',
          intimacyPoints: 56200,
          rank: 2,
        ),
        FixtureFanClubMember(
          userId: 'u_tariq_jamil',
          nickname: 'Tariq Jamil',
          avatarUrl:
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
          intimacyPoints: 42100,
          rank: 3,
        ),
      ],
    );
  }

  static List<FixtureGuardian> get guardians {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Guardian angel shield status unknown [ERR_SHIELD_404]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureGuardian(
        id: 'guard_01',
        hostUserId: 'u_amina_noor',
        guardianUserId: 'u_bilal_ahmed',
        guardianNickname: 'Bilal Ahmed',
        guardianAvatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        tier: 'Gold Guardian',
        guardDaysRemaining: 26,
        protectRank: 1,
        customBanner: 'Shield of Karachi ✨',
      ),
      FixtureGuardian(
        id: 'guard_02',
        hostUserId: 'u_amina_noor',
        guardianUserId: 'u_faizan_sheikh',
        guardianNickname: 'Faizan Sheikh',
        guardianAvatar:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        tier: 'Silver Guardian',
        guardDaysRemaining: 14,
        protectRank: 2,
        customBanner: 'Acoustic Protector 🛡️',
      ),
      FixtureGuardian(
        id: 'guard_03',
        hostUserId: 'u_amina_noor',
        guardianUserId: 'u_tariq_jamil',
        guardianNickname: 'Tariq Jamil',
        guardianAvatar:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        tier: 'Bronze Guardian',
        guardDaysRemaining: 8,
        protectRank: 3,
        customBanner: 'Late Night Defender 🌙',
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 12. FRIENDS, FOLLOWERS, AND PROFILE VISITORS
  // --------------------------------------------------------------------------
  static List<FixtureUserRelation> get friends {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Friend list synchronization failed [ERR_SOCIAL_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureUserRelation(
        userId: 'u_sana_ali',
        nickname: 'Sana Ali',
        avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        relationType: 'friend',
        isOnline: true,
        mutualCount: 18,
      ),
      FixtureUserRelation(
        userId: 'u_bilal_ahmed',
        nickname: 'Bilal Ahmed',
        avatarUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        relationType: 'friend',
        isOnline: true,
        mutualCount: 24,
      ),
      FixtureUserRelation(
        userId: 'u_zainab_khan',
        nickname: 'Zainab Khan',
        avatarUrl:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        relationType: 'friend',
        isOnline: false,
        mutualCount: 12,
      ),
      FixtureUserRelation(
        userId: 'u_hamza_tariq',
        nickname: 'Hamza Tariq',
        avatarUrl:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        relationType: 'friend',
        isOnline: true,
        mutualCount: 15,
      ),
    ];
  }

  static List<FixtureUserRelation> get followers {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Follower graph retrieval failed [ERR_SOCIAL_500]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureUserRelation(
        userId: 'u_hira_malik',
        nickname: 'Hira Malik',
        avatarUrl:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        relationType: 'follower',
        isOnline: false,
        mutualCount: 6,
      ),
      FixtureUserRelation(
        userId: 'u_faizan_sheikh',
        nickname: 'Faizan Sheikh',
        avatarUrl:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        relationType: 'follower',
        isOnline: true,
        mutualCount: 9,
      ),
      FixtureUserRelation(
        userId: 'u_tariq_jamil',
        nickname: 'Tariq Jamil',
        avatarUrl:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        relationType: 'follower',
        isOnline: false,
        mutualCount: 14,
      ),
      FixtureUserRelation(
        userId: 'u_ayesha_siddiqui',
        nickname: 'Ayesha Siddiqui',
        avatarUrl:
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        relationType: 'follower',
        isOnline: true,
        mutualCount: 8,
      ),
    ];
  }

  static List<FixtureProfileVisitor> get profileVisitors {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Profile visitor tracking unavailable [ERR_VISITOR_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureProfileVisitor(
        id: 'v_01',
        userId: 'u_sana_ali',
        nickname: 'Sana Ali',
        avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        visitTimestamp: '10 minutes ago',
        vipLevel: 2,
      ),
      FixtureProfileVisitor(
        id: 'v_02',
        userId: 'u_bilal_ahmed',
        nickname: 'Bilal Ahmed',
        avatarUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        visitTimestamp: '45 minutes ago',
        vipLevel: 4,
      ),
      FixtureProfileVisitor(
        id: 'v_03',
        userId: 'u_hamza_tariq',
        nickname: 'Hamza Tariq',
        avatarUrl:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        visitTimestamp: '2 hours ago',
        vipLevel: 1,
      ),
      FixtureProfileVisitor(
        id: 'v_04',
        userId: 'u_zainab_khan',
        nickname: 'Zainab Khan',
        avatarUrl:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        visitTimestamp: 'Yesterday',
        vipLevel: 1,
      ),
      FixtureProfileVisitor(
        id: 'v_05',
        userId: 'u_hira_malik',
        nickname: 'Hira Malik',
        avatarUrl:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        visitTimestamp: '2 days ago',
        vipLevel: 1,
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 13. SUCCESSFUL AND INVALID REDEEM CODES
  // --------------------------------------------------------------------------
  static FixtureRedeemCode get successfulRedeemCode => const FixtureRedeemCode(
        code: 'POPO-WELCOME-2026',
        isValid: true,
        coinReward: 5000,
        bonusItem: '1-Day VIP Trial Pass + Karachi Nights Avatar Frame',
        message:
            'Voucher successfully redeemed! 5,000 coins credited to your wallet.',
      );

  static FixtureRedeemCode get expiredRedeemCode => const FixtureRedeemCode(
        code: 'EXPIRED-BONUS-999',
        isValid: false,
        coinReward: 0,
        bonusItem: null,
        message:
            'This redemption code has expired or has already been claimed by another account.',
      );

  static FixtureRedeemCode get invalidRedeemCode => const FixtureRedeemCode(
        code: 'INVALID-CODE-XYZ',
        isValid: false,
        coinReward: 0,
        bonusItem: null,
        message:
            'Invalid voucher code. Please check your spelling and try again.',
      );

  /// Validates and redeems a promotional voucher code
  static FixtureRedeemCode redeemCode(String code) {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Redemption service maintenance [ERR_REDEEM_503]',
      );
    }
    final clean = code.trim().toUpperCase();
    if (clean == successfulRedeemCode.code) {
      _mutableCoinBalance += successfulRedeemCode.coinReward;
      return successfulRedeemCode;
    } else if (clean == expiredRedeemCode.code) {
      return expiredRedeemCode;
    }
    return invalidRedeemCode;
  }

  // --------------------------------------------------------------------------
  // 14. TASKS, REWARDS, AND RANKINGS
  // --------------------------------------------------------------------------
  static List<FixtureTask> get tasksAndRewards {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Task progress sync failed: Server busy [ERR_TASK_SYNC_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureTask(
        id: 'task_01',
        title: 'Go Live for 60 Minutes',
        rewardText: '500 Host Points',
        currentProgress: 45,
        targetGoal: 60,
        unit: 'mins',
        status: 'in_progress',
        isClaimed: false,
      ),
      FixtureTask(
        id: 'task_02',
        title: 'Receive 3 Gifts in Live Room',
        rewardText: '1,000 Host Points',
        currentProgress: 3,
        targetGoal: 3,
        unit: 'gifts',
        status: 'completed',
        isClaimed: false,
      ),
      FixtureTask(
        id: 'task_03',
        title: 'Join a 9-Seat Party Room for 15 Mins',
        rewardText: '300 Free Coins',
        currentProgress: 15,
        targetGoal: 15,
        unit: 'mins',
        status: 'claimed',
        isClaimed: true,
      ),
      FixtureTask(
        id: 'task_04',
        title: 'Win 1 Official PK Battle',
        rewardText: '2,000 Host Points + 1 PK Card',
        currentProgress: 0,
        targetGoal: 1,
        unit: 'battle',
        status: 'not_started',
        isClaimed: false,
      ),
    ];
  }

  static int get claimableTasksCount {
    if (isError || isEmpty) return 0;
    return tasksAndRewards
        .where((t) => t.status == 'completed' && !t.isClaimed)
        .length;
  }

  static List<FixtureHostRanking> get hostRankings {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Leaderboard database timeout [ERR_RANKINGS_TIMEOUT]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureHostRanking(
        rank: 1,
        hostNickname: 'Amina Noor',
        avatarUrl:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        diamondsEarned: 1850000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 18,
      ),
      FixtureHostRanking(
        rank: 2,
        hostNickname: 'Sana Ali',
        avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        diamondsEarned: 1420000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 15,
      ),
      FixtureHostRanking(
        rank: 3,
        hostNickname: 'Zainab Khan',
        avatarUrl:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        diamondsEarned: 980000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 14,
      ),
      FixtureHostRanking(
        rank: 4,
        hostNickname: 'Hamza Tariq',
        avatarUrl:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        diamondsEarned: 760000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 12,
      ),
      FixtureHostRanking(
        rank: 5,
        hostNickname: 'Hira Malik',
        avatarUrl:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        diamondsEarned: 620000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 11,
      ),
      FixtureHostRanking(
        rank: 6,
        hostNickname: 'Faizan Sheikh',
        avatarUrl:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        diamondsEarned: 510000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 10,
      ),
      FixtureHostRanking(
        rank: 7,
        hostNickname: 'Ayesha Siddiqui',
        avatarUrl:
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        diamondsEarned: 430000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 9,
      ),
      FixtureHostRanking(
        rank: 8,
        hostNickname: 'Tariq Jamil',
        avatarUrl:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        diamondsEarned: 380000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 22,
      ),
    ];
  }

  static List<FixtureEventRanking> get eventRankings {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Event leaderboard unreachable [ERR_EVENT_500]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureEventRanking(
        rank: 1,
        eventName: 'Karachi Nights Star Hunt 2026',
        hostNickname: 'Amina Noor',
        avatarUrl:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        eventPoints: 2450000,
        badgeTitle: 'Grand Champion',
      ),
      FixtureEventRanking(
        rank: 2,
        eventName: 'Karachi Nights Star Hunt 2026',
        hostNickname: 'Sana Ali',
        avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        eventPoints: 1920000,
        badgeTitle: '1st Runner Up',
      ),
      FixtureEventRanking(
        rank: 3,
        eventName: 'Karachi Nights Star Hunt 2026',
        hostNickname: 'Zainab Khan',
        avatarUrl:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        eventPoints: 1340000,
        badgeTitle: '2nd Runner Up',
      ),
      FixtureEventRanking(
        rank: 4,
        eventName: 'Karachi Nights Star Hunt 2026',
        hostNickname: 'Hamza Tariq',
        avatarUrl:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        eventPoints: 980000,
        badgeTitle: 'Finalist',
      ),
      FixtureEventRanking(
        rank: 5,
        eventName: 'Karachi Nights Star Hunt 2026',
        hostNickname: 'Bilal Ahmed',
        avatarUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        eventPoints: 850000,
        badgeTitle: 'Finalist',
      ),
    ];
  }

  static List<FixtureRewardHistory> get rewardHistory {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Reward redemption log unreachable [ERR_REWARD_LOG_500]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureRewardHistory(
        id: 'rh_01',
        taskTitle: 'Join a 9-Seat Party Room for 15 Mins',
        rewardText: '300 Free Coins',
        claimedAt: 'Today, 10:15 AM',
      ),
      FixtureRewardHistory(
        id: 'rh_02',
        taskTitle: 'Daily Check-in Day 5',
        rewardText: '100 Free Coins',
        claimedAt: 'Yesterday, 09:00 AM',
      ),
      FixtureRewardHistory(
        id: 'rh_03',
        taskTitle: 'Send 5 Live Chat Comments',
        rewardText: '50 Free Coins',
        claimedAt: 'Nov 16, 04:30 PM',
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 15. STORE ITEMS & BACKPACK
  // --------------------------------------------------------------------------
  static List<String> get storeCategories => const [
        'Avatar Frame',
        'Entrance Effect',
        'Chat Bubble',
        'Special Badge',
      ];

  static List<FixtureStoreItem> get storeItems {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Store inventory query failed [ERR_STORE_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureStoreItem(
        id: 'store_01',
        title: 'Golden Dragon Avatar Frame',
        category: 'Avatar Frame',
        priceCoins: 30000,
        validityDays: 30,
        previewImage:
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200',
        description:
            'Majestic celestial golden dragon animated border for creator profile avatars.',
        isHot: true,
      ),
      FixtureStoreItem(
        id: 'store_02',
        title: 'Cyberpunk Neon Ride Entrance',
        category: 'Entrance Effect',
        priceCoins: 85000,
        validityDays: 30,
        previewImage:
            'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=200',
        description:
            'High-octane neon supercar entrance banner that plays across the audience screen.',
        isHot: true,
      ),
      FixtureStoreItem(
        id: 'store_03',
        title: 'Karachi Nights Glowing Bubble',
        category: 'Chat Bubble',
        priceCoins: 12000,
        validityDays: 15,
        previewImage:
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200',
        description:
            'Luminous violet chat bubble styling all comments posted in live broadcasting channels.',
        isHot: false,
      ),
      FixtureStoreItem(
        id: 'store_04',
        title: 'Royal Rose Crown Ring',
        category: 'Avatar Frame',
        priceCoins: 25000,
        validityDays: 30,
        previewImage:
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200',
        description:
            'Romantic ruby-encrusted tiara ring suited for VIP party room seat faces.',
        isHot: false,
      ),
    ];
  }

  static List<FixtureBagItem> get bagItems {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Backpack inventory retrieval failed [ERR_BAG_TIMEOUT]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureBagItem(
        id: 'bag_01',
        name: 'Golden Dragon Avatar Frame',
        category: 'Avatar Frame',
        quantity: 1,
        isEquipped: true,
        expiresInText: '14 days left',
      ),
      FixtureBagItem(
        id: 'bag_02',
        name: 'Cyberpunk Neon Ride Entrance',
        category: 'Entrance Effect',
        quantity: 1,
        isEquipped: true,
        expiresInText: '7 days left',
      ),
      FixtureBagItem(
        id: 'bag_03',
        name: 'PK Double Points Boost Card',
        category: 'Battle Prop',
        quantity: 3,
        isEquipped: false,
        expiresInText: 'Permanent',
      ),
      FixtureBagItem(
        id: 'bag_04',
        name: 'VIP 3-Day Trial Pass',
        category: 'Voucher',
        quantity: 1,
        isEquipped: false,
        expiresInText: 'Expires in 30 days',
      ),
      FixtureBagItem(
        id: 'bag_05',
        name: 'Rose Fireworks Gift Voucher',
        category: 'Gift Prop',
        quantity: 5,
        isEquipped: false,
        expiresInText: 'Expires in 60 days',
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 16. AGENCY, COIN SELLER, AND WITHDRAWALS
  // --------------------------------------------------------------------------
  static FixtureAgency get agencyInfo {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Agency management portal error [ERR_AGENCY_PORTAL_403]',
      );
    }
    if (isEmpty) return FixtureAgency.empty();
    return const FixtureAgency(
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
      announcement:
          'Weekly settlement cycle runs every Monday at 12:00 UTC. Submit bank updates by Sunday midnight.',
    );
  }

  static List<FixtureAgencyMember> get agencyMembers {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Agency roster query timeout [ERR_AGENCY_ROSTER_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureAgencyMember(
        id: 'agym_01',
        userId: 'u_amina_noor',
        nickname: 'Amina Noor',
        avatarUrl:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        hostLevel: 18,
        monthlyDiamonds: 1850000,
        status: 'Active',
      ),
      FixtureAgencyMember(
        id: 'agym_02',
        userId: 'u_sana_ali',
        nickname: 'Sana Ali',
        avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        hostLevel: 15,
        monthlyDiamonds: 1420000,
        status: 'Active',
      ),
      FixtureAgencyMember(
        id: 'agym_03',
        userId: 'u_zainab_khan',
        nickname: 'Zainab Khan',
        avatarUrl:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100',
        hostLevel: 14,
        monthlyDiamonds: 980000,
        status: 'Active',
      ),
      FixtureAgencyMember(
        id: 'agym_04',
        userId: 'u_hamza_tariq',
        nickname: 'Hamza Tariq',
        avatarUrl:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        hostLevel: 12,
        monthlyDiamonds: 760000,
        status: 'Active',
      ),
    ];
  }

  static FixtureCoinSeller get coinSellerInfo {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Authorized coin seller directory offline [ERR_SELLER_503]',
      );
    }
    if (isEmpty) return FixtureCoinSeller.empty();
    return const FixtureCoinSeller(
      sellerId: 'seller_khi_01',
      sellerName: 'Karachi TopUp Express',
      agentName: 'Kamran Malik',
      whatsappContact: '+92 300 8765432',
      verificationBadge: 'Official Verified Reseller',
      rating: 4.98,
      totalOrdersCompleted: 15420,
      paymentMethods: [
        'Easypaisa',
        'JazzCash',
        'Raast',
        'Bank Transfer (HBL / Meezan)'
      ],
      discountNote:
          'Save 5% on direct bank/Easypaisa top-ups compared to store pricing.',
    );
  }

  static List<FixtureWithdrawalRecord> get withdrawalRecords {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Withdrawal settlement ledger failed [ERR_PAYOUT_TIMEOUT]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureWithdrawalRecord(
        id: 'wd_01',
        amountPoints: 200000,
        amountUsd: 20.0,
        amountPkr: 5600,
        paymentMethod: 'Easypaisa (0300-8765432)',
        status: 'Completed',
        timestamp: 'Nov 14, 2026',
      ),
      FixtureWithdrawalRecord(
        id: 'wd_02',
        amountPoints: 300000,
        amountUsd: 30.0,
        amountPkr: 8400,
        paymentMethod: 'Meezan Bank (PK89MEZN00018839201)',
        status: 'Processing',
        timestamp: 'Today, 09:12 AM',
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 17. HELP TOPICS AND SUPPORT TICKETS
  // --------------------------------------------------------------------------
  static List<FixtureHelpTopic> get helpTopics {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Help center knowledge base unreachable [ERR_HELP_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureHelpTopic(
        id: 'help_01',
        category: 'Recharge & Wallet',
        question: 'How do I top up coins with Google Play or Card?',
        answer:
            'Navigate to Wallet > Top Up. Choose your desired coin bundle and complete checkout via Google Play billing or authorized payment providers.',
      ),
      FixtureHelpTopic(
        id: 'help_02',
        category: 'Broadcasting',
        question: 'How do I qualify to go live as a host?',
        answer:
            'You must reach Wealth Level 5, verify your profile face photo, and accept our broadcasting safety guidelines before opening the host studio.',
      ),
      FixtureHelpTopic(
        id: 'help_03',
        category: 'Withdrawals',
        question: 'How do I withdraw host points into my bank or e-wallet?',
        answer:
            'Go to Me > Wallet > Host Earnings > Withdraw. Complete identity KYC and select your local bank transfer or registered e-wallet account.',
      ),
      FixtureHelpTopic(
        id: 'help_04',
        category: 'Security',
        question:
            'How can I protect my Popo Live account from unauthorized access?',
        answer:
            'Bind your phone number and email in Settings > Account Security. Always enable two-factor OTP verification for new device logins.',
      ),
      FixtureHelpTopic(
        id: 'help_05',
        category: 'PK Battles',
        question: 'How are PK battle scores and winners decided?',
        answer:
            'In 1v1 PK, audience gifts during the 5-minute timer determine each host score. The host with the highest gift point tally wins the battle.',
      ),
      FixtureHelpTopic(
        id: 'help_06',
        category: 'Party Rooms',
        question: 'How do 9-seat party rooms work and how do I speak?',
        answer:
            'Tap any empty seat in a party room to send a mic request. Once approved by the room host, your microphone un-mutes and you join the live conversation.',
      ),
      FixtureHelpTopic(
        id: 'help_07',
        category: 'VIP System',
        question: 'What are the privileges of subscribing to VIP tiers?',
        answer:
            'VIP members enjoy custom carriage entry animations, glowing avatar frames, chat badges, stealth visitor mode, and special gift discounts.',
      ),
      FixtureHelpTopic(
        id: 'help_08',
        category: 'Safety & Bans',
        question: 'What content is prohibited during live streams?',
        answer:
            'Harassment, hate speech, dangerous activities, copyright violations, and vulgarity are strictly forbidden and result in instant broadcast termination.',
      ),
    ];
  }

  static List<FixtureSupportTicket> get supportTickets {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Customer support ticketing unavailable [ERR_TICKET_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureSupportTicket(
        id: 'tkt_01',
        ticketNumber: 'TKT-2026-891',
        category: 'Payment',
        subject: 'Coin top-up confirmation delay',
        status: 'Resolved',
        lastUpdated: 'Yesterday, 11:45 AM',
      ),
      FixtureSupportTicket(
        id: 'tkt_02',
        ticketNumber: 'TKT-2026-904',
        category: 'Broadcasting',
        subject: 'Audio lag during 9-seat party stream',
        status: 'In Review',
        lastUpdated: 'Today, 08:30 AM',
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // INTERNAL PROFILE CONSTANTS
  // --------------------------------------------------------------------------
  static const _profileAminaNoor = FixtureUserProfile(
    userId: 'u_amina_noor',
    poppoId: '8839201',
    nickname: 'Amina Noor',
    username: 'amina.noor',
    avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
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
  );

  static const _profileSanaAli = FixtureUserProfile(
    userId: 'u_sana_ali',
    poppoId: '8839202',
    nickname: 'Sana Ali',
    username: 'sana.ali',
    avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
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
  );

  static const _profileBilalAhmed = FixtureUserProfile(
    userId: 'u_bilal_ahmed',
    poppoId: '8839203',
    nickname: 'Bilal Ahmed',
    username: 'bilal.ahmed',
    avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
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
  );

  static const _profileZainabKhan = FixtureUserProfile(
    userId: 'u_zainab_khan',
    poppoId: '8839204',
    nickname: 'Zainab Khan',
    username: 'zainab.khan',
    avatarUrl:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
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
  );

  static const _profileHamzaTariq = FixtureUserProfile(
    userId: 'u_hamza_tariq',
    poppoId: '8839205',
    nickname: 'Hamza Tariq',
    username: 'hamza.tariq',
    avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
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
  );

  static const _profileHiraMalik = FixtureUserProfile(
    userId: 'u_hira_malik',
    poppoId: '8839206',
    nickname: 'Hira Malik',
    username: 'hira.malik',
    avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
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
  );

  static const _profileFaizanSheikh = FixtureUserProfile(
    userId: 'u_faizan_sheikh',
    poppoId: '8839207',
    nickname: 'Faizan Sheikh',
    username: 'faizan.sheikh',
    avatarUrl:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
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
  );

  static const _profileTariqJamil = FixtureUserProfile(
    userId: 'u_tariq_jamil',
    poppoId: '8839208',
    nickname: 'Tariq Jamil',
    username: 'tariq.jamil',
    avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
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
  );
}

// ==============================================================================
// STRONGLY-TYPED DATA MODELS
// ==============================================================================

/// User Profile design fixture model
class FixtureUserProfile {
  final String userId;
  final String poppoId;
  final String nickname;
  final String username;
  final String avatarUrl;
  final String bio;
  final String gender;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final int wealthLevel;
  final int hostLevel;
  final int vipLevel;
  final String vipStatus;
  final int coinBalance;
  final int pointsBalance;
  final int followingCount;
  final int followersCount;
  final int friendsCount;
  final int visitorCount;
  final bool isHostEligible;
  final bool isLiveNow;
  final String? currentLiveRoomId;

  const FixtureUserProfile({
    required this.userId,
    required this.poppoId,
    required this.nickname,
    required this.username,
    required this.avatarUrl,
    required this.bio,
    required this.gender,
    required this.country,
    required this.countryCode,
    required this.flagEmoji,
    required this.wealthLevel,
    required this.hostLevel,
    required this.vipLevel,
    required this.vipStatus,
    required this.coinBalance,
    required this.pointsBalance,
    required this.followingCount,
    required this.followersCount,
    required this.friendsCount,
    required this.visitorCount,
    required this.isHostEligible,
    this.isLiveNow = false,
    this.currentLiveRoomId,
  });

  factory FixtureUserProfile.empty() => const FixtureUserProfile(
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
      );

  Map<String, dynamic> toMap() => {
        'id': userId,
        'poppoId': poppoId,
        'nickname': nickname,
        'username': username,
        'avatarUrl': avatarUrl,
        'bio': bio,
        'gender': gender,
        'country': country,
        'countryCode': countryCode,
        'flagEmoji': flagEmoji,
        'wealthLevel': wealthLevel,
        'hostLevel': hostLevel,
        'vipLevel': vipLevel,
        'vipStatus': vipStatus,
        'coinBalance': coinBalance,
        'pointsBalance': pointsBalance,
        'followingCount': followingCount,
        'followersCount': followersCount,
        'friendsCount': friendsCount,
        'visitorCount': visitorCount,
        'isHostEligible': isHostEligible,
        'isLiveNow': isLiveNow,
        'currentLiveRoomId': currentLiveRoomId,
      };
}

/// Live room viewer session model
class FixtureLiveViewer {
  final String roomId;
  final String roomNumber;
  final String title;
  final FixtureUserProfile host;
  final String streamUrl;
  final String agoraChannelId;
  final String agoraToken;
  final int viewerCount;
  final int totalLikes;
  final int roomDiamonds;
  final bool isLive;
  final String category;
  final String country;
  final String countryCode;
  final int activeSeatCount;
  final String pinnedAnnouncement;
  final List<FixtureUserProfile> topContributors;
  final List<FixtureLiveChatMessage> recentChatMessages;

  const FixtureLiveViewer({
    required this.roomId,
    required this.roomNumber,
    required this.title,
    required this.host,
    required this.streamUrl,
    required this.agoraChannelId,
    required this.agoraToken,
    required this.viewerCount,
    required this.totalLikes,
    required this.roomDiamonds,
    required this.isLive,
    required this.category,
    required this.country,
    required this.countryCode,
    required this.activeSeatCount,
    required this.pinnedAnnouncement,
    required this.topContributors,
    required this.recentChatMessages,
  });

  factory FixtureLiveViewer.empty() => FixtureLiveViewer(
        roomId: '',
        roomNumber: '',
        title: 'Broadcast Ended',
        host: FixtureUserProfile.empty(),
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
        topContributors: const [],
        recentChatMessages: const [],
      );
}

/// Live chat message entry in a viewer room
class FixtureLiveChatMessage {
  final String id;
  final String senderNickname;
  final String senderAvatar;
  final int senderLevel;
  final bool isVip;
  final String content;
  final String timestamp;

  const FixtureLiveChatMessage({
    required this.id,
    required this.senderNickname,
    required this.senderAvatar,
    required this.senderLevel,
    required this.isVip,
    required this.content,
    required this.timestamp,
  });
}

/// Live Room card model for discovery feeds
class FixtureLiveRoom {
  final String id;
  final String roomNumber;
  final String title;
  final String hostNickname;
  final String hostAvatar;
  final String coverUrl;
  final String category;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final int viewerCount;
  final int heatScore;
  final bool isLive;
  final bool isPkActive;
  final List<String> tags;

  const FixtureLiveRoom({
    required this.id,
    required this.roomNumber,
    required this.title,
    required this.hostNickname,
    required this.hostAvatar,
    required this.coverUrl,
    required this.category,
    required this.country,
    required this.countryCode,
    required this.flagEmoji,
    required this.viewerCount,
    required this.heatScore,
    required this.isLive,
    required this.isPkActive,
    required this.tags,
  });
}

/// 9-seat party room model
class FixturePartyRoom {
  final String id;
  final String roomNumber;
  final String title;
  final String hostNickname;
  final String hostAvatar;
  final String hostUserId;
  final String coverUrl;
  final String category;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final int viewerCount;
  final int maxSeats;
  final int occupiedSeatCount;
  final String joinStatus;
  final List<FixturePartySeat> seats;

  const FixturePartyRoom({
    required this.id,
    required this.roomNumber,
    required this.title,
    required this.hostNickname,
    required this.hostAvatar,
    required this.hostUserId,
    required this.coverUrl,
    required this.category,
    required this.country,
    required this.countryCode,
    required this.flagEmoji,
    required this.viewerCount,
    required this.maxSeats,
    required this.occupiedSeatCount,
    required this.joinStatus,
    required this.seats,
  });
}

/// Party seat representation with seat face / avatar
class FixturePartySeat {
  final int index;
  final String? userId;
  final String? nickname;
  final String? avatarUrl;
  final bool isHost;
  final bool isMuted;
  final bool isSpeaking;
  final int giftPoints;
  final bool isOccupied;
  final bool isLocked;
  final bool canJoin;
  final String joinRequestStatus;

  const FixturePartySeat({
    required this.index,
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.isHost,
    required this.isMuted,
    required this.isSpeaking,
    required this.giftPoints,
    required this.isOccupied,
    required this.isLocked,
    required this.canJoin,
    required this.joinRequestStatus,
  });

  const FixturePartySeat.empty(this.index)
      : userId = null,
        nickname = null,
        avatarUrl = null,
        isHost = false,
        isMuted = false,
        isSpeaking = false,
        giftPoints = 0,
        isOccupied = false,
        isLocked = false,
        canJoin = true,
        joinRequestStatus = 'none';
}

/// Inbox chat thread model
class FixtureChatThread {
  final String threadId;
  final String senderId;
  final String receiverId;
  final String peerUserId;
  final String peerNickname;
  final String peerAvatar;
  final String lastMessage;
  final String lastMessageTime;
  final int unreadCount;
  final bool isOnline;

  const FixtureChatThread({
    required this.threadId,
    required this.senderId,
    required this.receiverId,
    required this.peerUserId,
    required this.peerNickname,
    required this.peerAvatar,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.unreadCount,
    required this.isOnline,
  });
}

/// Official system notice message
class FixtureOfficialNotice {
  final String id;
  final String category;
  final String badgeLabel;
  final String title;
  final String preview;
  final String timestamp;
  final bool isRead;
  final bool isUrgent;
  final String senderId;
  final String receiverId;
  final String senderName;
  final String senderAvatar;
  final int unreadCount;
  final bool isOnline;

  const FixtureOfficialNotice({
    required this.id,
    required this.category,
    required this.badgeLabel,
    required this.title,
    required this.preview,
    required this.timestamp,
    required this.isRead,
    required this.isUrgent,
    required this.senderId,
    required this.receiverId,
    required this.senderName,
    required this.senderAvatar,
    required this.unreadCount,
    required this.isOnline,
  });
}

/// Wallet balance and economy model
class FixtureWallet {
  final int coinBalance;
  final int pointsBalance;
  final double withdrawableUsd;
  final int diamondValue;
  final String currencySymbol;
  final String exchangeRateFormatted;
  final double totalRechargedUsd;
  final double totalWithdrawnUsd;
  final double estimatedRevenueUsd;
  final List<FixtureWalletTransaction> recentTransactions;

  const FixtureWallet({
    required this.coinBalance,
    required this.pointsBalance,
    required this.withdrawableUsd,
    required this.diamondValue,
    required this.currencySymbol,
    required this.exchangeRateFormatted,
    required this.totalRechargedUsd,
    required this.totalWithdrawnUsd,
    required this.estimatedRevenueUsd,
    required this.recentTransactions,
  });

  factory FixtureWallet.empty() => const FixtureWallet(
        coinBalance: 0,
        pointsBalance: 0,
        withdrawableUsd: 0.0,
        diamondValue: 0,
        currencySymbol: '🪙',
        exchangeRateFormatted: '10,000 Points = \$1.00 USD',
        totalRechargedUsd: 0.0,
        totalWithdrawnUsd: 0.0,
        estimatedRevenueUsd: 0.0,
        recentTransactions: [],
      );
}

/// Transaction history entry
class FixtureWalletTransaction {
  final String id;
  final String type;
  final String description;
  final String amount;
  final String timestamp;
  final bool isCredit;

  const FixtureWalletTransaction({
    required this.id,
    required this.type,
    required this.description,
    required this.amount,
    required this.timestamp,
    required this.isCredit,
  });
}

/// Coin package available in store
class FixtureCoinPackage {
  final String id;
  final int coins;
  final int bonusCoins;
  final double priceUsd;
  final int pricePkr;
  final String badgeLabel;

  const FixtureCoinPackage({
    required this.id,
    required this.coins,
    required this.bonusCoins,
    required this.priceUsd,
    required this.pricePkr,
    required this.badgeLabel,
  });
}

/// Points ledger record
class FixturePointsRecord {
  final String id;
  final String source;
  final int amount;
  final String timestamp;
  final bool isCredit;

  const FixturePointsRecord({
    required this.id,
    required this.source,
    required this.amount,
    required this.timestamp,
    required this.isCredit,
  });
}

/// Gift catalog item with animation reference
class FixtureGift {
  final String id;
  final String name;
  final String iconUrl;
  final int priceCoins;
  final String category;
  final String animationUrl;
  final int comboMax;

  const FixtureGift({
    required this.id,
    required this.name,
    required this.iconUrl,
    required this.priceCoins,
    required this.category,
    required this.animationUrl,
    required this.comboMax,
  });
}

/// VIP Plan model
class FixtureVipPlan {
  final int tierLevel;
  final String tierName;
  final bool isActive;
  final String expiryDate;
  final int daysRemaining;
  final double progressPercentage;
  final int pointsToNextTier;
  final String badgeAsset;
  final List<FixtureVipPrivilege> privileges;

  const FixtureVipPlan({
    required this.tierLevel,
    required this.tierName,
    required this.isActive,
    required this.expiryDate,
    required this.daysRemaining,
    required this.progressPercentage,
    required this.pointsToNextTier,
    required this.badgeAsset,
    required this.privileges,
  });

  factory FixtureVipPlan.inactive() => const FixtureVipPlan(
        tierLevel: 0,
        tierName: 'None',
        isActive: false,
        expiryDate: 'N/A',
        daysRemaining: 0,
        progressPercentage: 0.0,
        pointsToNextTier: 10000,
        badgeAsset: '',
        privileges: [],
      );
}

/// VIP Privilege perk
class FixtureVipPrivilege {
  final String id;
  final String title;
  final String description;
  final String iconName;

  const FixtureVipPrivilege({
    required this.id,
    required this.title,
    required this.description,
    required this.iconName,
  });
}

/// VIP Plan Subscription History
class FixtureVipPlanHistory {
  final String id;
  final String tierName;
  final String startDate;
  final String endDate;
  final double pricePaidUsd;
  final String status;

  const FixtureVipPlanHistory({
    required this.id,
    required this.tierName,
    required this.startDate,
    required this.endDate,
    required this.pricePaidUsd,
    required this.status,
  });
}

/// User Achievement / Honor Medal
class FixtureMedal {
  final String id;
  final String name;
  final String category;
  final String rarity;
  final String iconEmoji;
  final String description;
  final bool isUnlocked;
  final String unlockedDate;

  const FixtureMedal({
    required this.id,
    required this.name,
    required this.category,
    required this.rarity,
    required this.iconEmoji,
    required this.description,
    required this.isUnlocked,
    required this.unlockedDate,
  });
}

/// Fan Club entity
class FixtureFanClub {
  final String clubId;
  final String clubName;
  final String badgeName;
  final String badgeColorHex;
  final int totalMembers;
  final int userClubLevel;
  final int userIntimacyPoints;
  final String announcement;
  final List<FixtureFanClubMember> topMembers;

  const FixtureFanClub({
    required this.clubId,
    required this.clubName,
    required this.badgeName,
    required this.badgeColorHex,
    required this.totalMembers,
    required this.userClubLevel,
    required this.userIntimacyPoints,
    required this.announcement,
    required this.topMembers,
  });

  factory FixtureFanClub.empty() => const FixtureFanClub(
        clubId: '',
        clubName: 'Not Joined',
        badgeName: 'FAN',
        badgeColorHex: '#CCCCCC',
        totalMembers: 0,
        userClubLevel: 0,
        userIntimacyPoints: 0,
        announcement: '',
        topMembers: [],
      );
}

/// Fan club member model
class FixtureFanClubMember {
  final String userId;
  final String nickname;
  final String avatarUrl;
  final int intimacyPoints;
  final int rank;

  const FixtureFanClubMember({
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.intimacyPoints,
    required this.rank,
  });
}

/// Guardian model
class FixtureGuardian {
  final String id;
  final String hostUserId;
  final String guardianUserId;
  final String guardianNickname;
  final String guardianAvatar;
  final String tier;
  final int guardDaysRemaining;
  final int protectRank;
  final String customBanner;

  const FixtureGuardian({
    required this.id,
    required this.hostUserId,
    required this.guardianUserId,
    required this.guardianNickname,
    required this.guardianAvatar,
    required this.tier,
    required this.guardDaysRemaining,
    required this.protectRank,
    required this.customBanner,
  });
}

/// Social relation (friend/follower) model
class FixtureUserRelation {
  final String userId;
  final String nickname;
  final String avatarUrl;
  final String relationType;
  final bool isOnline;
  final int mutualCount;

  const FixtureUserRelation({
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.relationType,
    required this.isOnline,
    required this.mutualCount,
  });
}

/// Profile Visitor log
class FixtureProfileVisitor {
  final String id;
  final String userId;
  final String nickname;
  final String avatarUrl;
  final String visitTimestamp;
  final int vipLevel;

  const FixtureProfileVisitor({
    required this.id,
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.visitTimestamp,
    required this.vipLevel,
  });
}

/// Redeem Code model
class FixtureRedeemCode {
  final String code;
  final bool isValid;
  final int coinReward;
  final String? bonusItem;
  final String message;

  const FixtureRedeemCode({
    required this.code,
    required this.isValid,
    required this.coinReward,
    required this.bonusItem,
    required this.message,
  });
}

/// Task & Reward model
class FixtureTask {
  final String id;
  final String title;
  final String rewardText;
  final int currentProgress;
  final int targetGoal;
  final String unit;
  final String status;
  final bool isClaimed;

  const FixtureTask({
    required this.id,
    required this.title,
    required this.rewardText,
    required this.currentProgress,
    required this.targetGoal,
    required this.unit,
    required this.status,
    required this.isClaimed,
  });
}

/// Host Leaderboard ranking entry
class FixtureHostRanking {
  final int rank;
  final String hostNickname;
  final String avatarUrl;
  final int diamondsEarned;
  final String country;
  final String countryFlag;
  final int level;

  const FixtureHostRanking({
    required this.rank,
    required this.hostNickname,
    required this.avatarUrl,
    required this.diamondsEarned,
    required this.country,
    required this.countryFlag,
    required this.level,
  });
}

/// Event ranking entry
class FixtureEventRanking {
  final int rank;
  final String eventName;
  final String hostNickname;
  final String avatarUrl;
  final int eventPoints;
  final String badgeTitle;

  const FixtureEventRanking({
    required this.rank,
    required this.eventName,
    required this.hostNickname,
    required this.avatarUrl,
    required this.eventPoints,
    required this.badgeTitle,
  });
}

/// Claimed reward history record
class FixtureRewardHistory {
  final String id;
  final String taskTitle;
  final String rewardText;
  final String claimedAt;

  const FixtureRewardHistory({
    required this.id,
    required this.taskTitle,
    required this.rewardText,
    required this.claimedAt,
  });
}

/// Virtual Store item model
class FixtureStoreItem {
  final String id;
  final String title;
  final String category;
  final int priceCoins;
  final int validityDays;
  final String previewImage;
  final String description;
  final bool isHot;

  const FixtureStoreItem({
    required this.id,
    required this.title,
    required this.category,
    required this.priceCoins,
    required this.validityDays,
    required this.previewImage,
    required this.description,
    required this.isHot,
  });
}

/// User Bag / Backpack owned item
class FixtureBagItem {
  final String id;
  final String name;
  final String category;
  final int quantity;
  final bool isEquipped;
  final String expiresInText;

  const FixtureBagItem({
    required this.id,
    required this.name,
    required this.category,
    required this.quantity,
    required this.isEquipped,
    required this.expiresInText,
  });
}

/// Agency profile model
class FixtureAgency {
  final String agencyId;
  final String agencyCode;
  final String agencyName;
  final String agentLeader;
  final String contactPhone;
  final String registeredCity;
  final int totalActiveHosts;
  final int monthlyDiamondVolume;
  final double commissionTierPercentage;
  final String settlementStatus;
  final String announcement;

  const FixtureAgency({
    required this.agencyId,
    required this.agencyCode,
    required this.agencyName,
    required this.agentLeader,
    required this.contactPhone,
    required this.registeredCity,
    required this.totalActiveHosts,
    required this.monthlyDiamondVolume,
    required this.commissionTierPercentage,
    required this.settlementStatus,
    required this.announcement,
  });

  factory FixtureAgency.empty() => const FixtureAgency(
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
      );
}

/// Agency Host member model
class FixtureAgencyMember {
  final String id;
  final String userId;
  final String nickname;
  final String avatarUrl;
  final int hostLevel;
  final int monthlyDiamonds;
  final String status;

  const FixtureAgencyMember({
    required this.id,
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.hostLevel,
    required this.monthlyDiamonds,
    required this.status,
  });
}

/// Authorized coin reseller profile
class FixtureCoinSeller {
  final String sellerId;
  final String sellerName;
  final String agentName;
  final String whatsappContact;
  final String verificationBadge;
  final double rating;
  final int totalOrdersCompleted;
  final List<String> paymentMethods;
  final String discountNote;

  const FixtureCoinSeller({
    required this.sellerId,
    required this.sellerName,
    required this.agentName,
    required this.whatsappContact,
    required this.verificationBadge,
    required this.rating,
    required this.totalOrdersCompleted,
    required this.paymentMethods,
    required this.discountNote,
  });

  factory FixtureCoinSeller.empty() => const FixtureCoinSeller(
        sellerId: '',
        sellerName: 'None',
        agentName: 'None',
        whatsappContact: '',
        verificationBadge: 'Unverified',
        rating: 0.0,
        totalOrdersCompleted: 0,
        paymentMethods: [],
        discountNote: '',
      );
}

/// Withdrawal payout record
class FixtureWithdrawalRecord {
  final String id;
  final int amountPoints;
  final double amountUsd;
  final int amountPkr;
  final String paymentMethod;
  final String status;
  final String timestamp;

  const FixtureWithdrawalRecord({
    required this.id,
    required this.amountPoints,
    required this.amountUsd,
    required this.amountPkr,
    required this.paymentMethod,
    required this.status,
    required this.timestamp,
  });
}

/// Help topic FAQ item
class FixtureHelpTopic {
  final String id;
  final String category;
  final String question;
  final String answer;

  const FixtureHelpTopic({
    required this.id,
    required this.category,
    required this.question,
    required this.answer,
  });
}

/// Customer support ticket model
class FixtureSupportTicket {
  final String id;
  final String ticketNumber;
  final String category;
  final String subject;
  final String status;
  final String lastUpdated;

  const FixtureSupportTicket({
    required this.id,
    required this.ticketNumber,
    required this.category,
    required this.subject,
    required this.status,
    required this.lastUpdated,
  });
}
