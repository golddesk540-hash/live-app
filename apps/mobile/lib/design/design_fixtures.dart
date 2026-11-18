// ==============================================================================
// POPO LIVE — MOBILE DESIGN FIXTURES (PHASE 1 - D0)
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
  }

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
    if (isEmpty) {
      return FixtureUserProfile.empty();
    }
    return _profileAminaNoor;
  }

  static List<FixtureUserProfile> get userProfiles {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Failed to query user profiles list [ERR_500]',
      );
    }
    if (isEmpty) return const [];
    return [
      _profileAminaNoor,
      _profileSanaAli,
      _profileBilalAhmed,
      _profileZainabKhan,
      _profileHamzaTariq,
      _profileHiraMalik,
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
    if (isEmpty) {
      return FixtureLiveViewer.empty();
    }
    return const FixtureLiveViewer(
      roomId: 'live_room_001',
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
          content: 'Sent a Luxury Sports Car 🏎️💨 keep rocking!',
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
        category: 'Talent',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 620,
        heatScore: 39500,
        isLive: true,
        isPkActive: true,
        tags: ['Comedy', 'Improv', 'Banter'],
      ),
      FixtureLiveRoom(
        id: 'room_006',
        roomNumber: '883906',
        title: 'Fashion, Style & Glow Up Diary 💄👗',
        hostNickname: 'Hira Malik',
        hostAvatar:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600',
        category: 'Fashion',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 890,
        heatScore: 57400,
        isLive: true,
        isPkActive: false,
        tags: ['Style', 'Trends', 'Beauty'],
      ),
      FixtureLiveRoom(
        id: 'room_007',
        roomNumber: '883907',
        title: 'Indus Waves: Live Q&A & Poetry 🌊📖',
        hostNickname: 'Faizan Sheikh',
        hostAvatar:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600',
        category: 'Literature',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 510,
        heatScore: 31200,
        isLive: true,
        isPkActive: false,
        tags: ['Poetry', 'Shayari', 'Q&A'],
      ),
      FixtureLiveRoom(
        id: 'room_008',
        roomNumber: '883908',
        title: 'Late Night Sing-Along & Requests 🎤🌙',
        hostNickname: 'Ayesha Siddiqui',
        hostAvatar:
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        coverUrl:
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
        category: 'Singing',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 1100,
        heatScore: 78000,
        isLive: true,
        isPkActive: false,
        tags: ['Songs', 'Requests', 'Melody'],
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 4. SIX (6) MULTI-SEAT PARTY ROOMS WITH SEAT FACES
  // --------------------------------------------------------------------------
  static List<FixturePartyRoom> get partyRooms {
    if (isError) {
      throw const DesignFixtureException(
        message:
            'Party rooms discovery failed: WebSocket connection lost [ERR_WS_DISCONNECTED]',
      );
    }
    if (isEmpty) return const [];
    return [
      _createPartyRoom(
        id: 'party_001',
        roomNumber: '771001',
        title: 'Karachi Nights Club 🌙 Party Lounge',
        hostNickname: 'Amina Noor',
        category: 'ChitChat',
        seats: [
          const FixturePartySeat(
              index: 1,
              userId: 'u_amina',
              nickname: 'Amina Noor',
              avatarUrl:
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
              isHost: true,
              isMuted: false,
              isSpeaking: true,
              giftPoints: 12500),
          const FixturePartySeat(
              index: 2,
              userId: 'u_sana',
              nickname: 'Sana Ali',
              avatarUrl:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: false,
              giftPoints: 8900),
          const FixturePartySeat(
              index: 3,
              userId: 'u_bilal',
              nickname: 'Bilal Ahmed',
              avatarUrl:
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: true,
              giftPoints: 6400),
          const FixturePartySeat(
              index: 4,
              userId: 'u_hamza',
              nickname: 'Hamza Tariq',
              avatarUrl:
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
              isHost: false,
              isMuted: true,
              isSpeaking: false,
              giftPoints: 4300),
          const FixturePartySeat(
              index: 5,
              userId: 'u_zainab',
              nickname: 'Zainab Khan',
              avatarUrl:
                  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: false,
              giftPoints: 3100),
          const FixturePartySeat.empty(6),
          const FixturePartySeat.empty(7),
          const FixturePartySeat.empty(8),
          const FixturePartySeat.empty(9),
        ],
      ),
      _createPartyRoom(
        id: 'party_002',
        roomNumber: '771002',
        title: 'Music Jam & Acoustic Showcase 🎸',
        hostNickname: 'Zainab Khan',
        category: 'Music',
        seats: [
          const FixturePartySeat(
              index: 1,
              userId: 'u_zainab',
              nickname: 'Zainab Khan',
              avatarUrl:
                  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
              isHost: true,
              isMuted: false,
              isSpeaking: true,
              giftPoints: 9200),
          const FixturePartySeat(
              index: 2,
              userId: 'u_faizan',
              nickname: 'Faizan Sheikh',
              avatarUrl:
                  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: false,
              giftPoints: 5400),
          const FixturePartySeat(
              index: 3,
              userId: 'u_ayesha',
              nickname: 'Ayesha Siddiqui',
              avatarUrl:
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: true,
              giftPoints: 7800),
          const FixturePartySeat.empty(4),
          const FixturePartySeat.empty(5),
          const FixturePartySeat.empty(6),
          const FixturePartySeat.empty(7),
          const FixturePartySeat.empty(8),
          const FixturePartySeat.empty(9),
        ],
      ),
      _createPartyRoom(
        id: 'party_003',
        roomNumber: '771003',
        title: 'Desi Chai & Gup Shup Circle ☕',
        hostNickname: 'Faizan Sheikh',
        category: 'ChitChat',
        seats: [
          const FixturePartySeat(
              index: 1,
              userId: 'u_faizan',
              nickname: 'Faizan Sheikh',
              avatarUrl:
                  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
              isHost: true,
              isMuted: false,
              isSpeaking: false,
              giftPoints: 4100),
          const FixturePartySeat(
              index: 2,
              userId: 'u_sana',
              nickname: 'Sana Ali',
              avatarUrl:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: true,
              giftPoints: 6700),
          const FixturePartySeat(
              index: 3,
              userId: 'u_tariq',
              nickname: 'Tariq Jamil',
              avatarUrl:
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: false,
              giftPoints: 3400),
          const FixturePartySeat(
              index: 4,
              userId: 'u_usman',
              nickname: 'Usman Raza',
              avatarUrl:
                  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
              isHost: false,
              isMuted: true,
              isSpeaking: false,
              giftPoints: 2100),
          const FixturePartySeat.empty(5),
          const FixturePartySeat.empty(6),
          const FixturePartySeat.empty(7),
          const FixturePartySeat.empty(8),
          const FixturePartySeat.empty(9),
        ],
      ),
      _createPartyRoom(
        id: 'party_004',
        roomNumber: '771004',
        title: 'Youth Talent & Poetry Open Mic 🎙️',
        hostNickname: 'Hira Malik',
        category: 'Talent',
        seats: [
          const FixturePartySeat(
              index: 1,
              userId: 'u_hira',
              nickname: 'Hira Malik',
              avatarUrl:
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
              isHost: true,
              isMuted: false,
              isSpeaking: true,
              giftPoints: 8300),
          const FixturePartySeat(
              index: 2,
              userId: 'u_amina',
              nickname: 'Amina Noor',
              avatarUrl:
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: false,
              giftPoints: 11400),
          const FixturePartySeat.empty(3),
          const FixturePartySeat.empty(4),
          const FixturePartySeat.empty(5),
          const FixturePartySeat.empty(6),
          const FixturePartySeat.empty(7),
          const FixturePartySeat.empty(8),
          const FixturePartySeat.empty(9),
        ],
      ),
      _createPartyRoom(
        id: 'party_005',
        roomNumber: '771005',
        title: 'Gamers Corner & Esports Banter 🏆',
        hostNickname: 'Usman Raza',
        category: 'Gaming',
        seats: [
          const FixturePartySeat(
              index: 1,
              userId: 'u_usman',
              nickname: 'Usman Raza',
              avatarUrl:
                  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
              isHost: true,
              isMuted: false,
              isSpeaking: true,
              giftPoints: 7200),
          const FixturePartySeat(
              index: 2,
              userId: 'u_bilal',
              nickname: 'Bilal Ahmed',
              avatarUrl:
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: false,
              giftPoints: 6100),
          const FixturePartySeat(
              index: 3,
              userId: 'u_hamza',
              nickname: 'Hamza Tariq',
              avatarUrl:
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: true,
              giftPoints: 5900),
          const FixturePartySeat.empty(4),
          const FixturePartySeat.empty(5),
          const FixturePartySeat.empty(6),
          const FixturePartySeat.empty(7),
          const FixturePartySeat.empty(8),
          const FixturePartySeat.empty(9),
        ],
      ),
      _createPartyRoom(
        id: 'party_006',
        roomNumber: '771006',
        title: 'Midnight Ghazal & Acoustic Moods 🎶',
        hostNickname: 'Sana Ali',
        category: 'Music',
        seats: [
          const FixturePartySeat(
              index: 1,
              userId: 'u_sana',
              nickname: 'Sana Ali',
              avatarUrl:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              isHost: true,
              isMuted: false,
              isSpeaking: true,
              giftPoints: 14500),
          const FixturePartySeat(
              index: 2,
              userId: 'u_amina',
              nickname: 'Amina Noor',
              avatarUrl:
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: false,
              giftPoints: 12300),
          const FixturePartySeat(
              index: 3,
              userId: 'u_zainab',
              nickname: 'Zainab Khan',
              avatarUrl:
                  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
              isHost: false,
              isMuted: false,
              isSpeaking: false,
              giftPoints: 8900),
          const FixturePartySeat.empty(4),
          const FixturePartySeat.empty(5),
          const FixturePartySeat.empty(6),
          const FixturePartySeat.empty(7),
          const FixturePartySeat.empty(8),
          const FixturePartySeat.empty(9),
        ],
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 5. TWELVE (12) DIRECT INBOX CHATS
  // --------------------------------------------------------------------------
  static List<FixtureChatThread> get chats {
    if (isError) {
      throw const DesignFixtureException(
        message:
            'Failed to retrieve inbox threads: Chat database locked [ERR_DB_LOCKED]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureChatThread(
        threadId: 'th_01',
        peerUserId: 'u_sana',
        peerNickname: 'Sana Ali',
        peerAvatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastMessage:
            'Hey Amina! Are we doing the PK battle tonight on Karachi Nights?',
        lastMessageTime: '10:42 AM',
        unreadCount: 2,
        isOnline: true,
      ),
      FixtureChatThread(
        threadId: 'th_02',
        peerUserId: 'u_bilal',
        peerNickname: 'Bilal Ahmed',
        peerAvatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        lastMessage:
            'Thanks for sending the lion gift on my gaming stream! 🦁🔥',
        lastMessageTime: '09:15 AM',
        unreadCount: 0,
        isOnline: true,
      ),
      FixtureChatThread(
        threadId: 'th_03',
        peerUserId: 'u_zainab',
        peerNickname: 'Zainab Khan',
        peerAvatar:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
        lastMessage:
            'Loved your acoustic cover yesterday! The guitar tone was perfect.',
        lastMessageTime: 'Yesterday',
        unreadCount: 1,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_04',
        peerUserId: 'u_hamza',
        peerNickname: 'Hamza Tariq',
        peerAvatar:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        lastMessage: 'Party room slot booked for 10 PM PKT. See you there!',
        lastMessageTime: 'Yesterday',
        unreadCount: 0,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_05',
        peerUserId: 'u_hira',
        peerNickname: 'Hira Malik',
        peerAvatar:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        lastMessage: 'Let us collaborate on the weekend live stream event.',
        lastMessageTime: 'Nov 16',
        unreadCount: 0,
        isOnline: true,
      ),
      FixtureChatThread(
        threadId: 'th_06',
        peerUserId: 'u_faizan',
        peerNickname: 'Faizan Sheikh',
        peerAvatar:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        lastMessage: 'Best of luck with the weekly agency rankings table!',
        lastMessageTime: 'Nov 15',
        unreadCount: 0,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_07',
        peerUserId: 'u_ayesha',
        peerNickname: 'Ayesha Siddiqui',
        peerAvatar:
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        lastMessage: 'Sent you the new song chords on WhatsApp too.',
        lastMessageTime: 'Nov 14',
        unreadCount: 0,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_08',
        peerUserId: 'u_usman',
        peerNickname: 'Usman Raza',
        peerAvatar:
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        lastMessage: 'Are you joining the 9-seat party tonight with the team?',
        lastMessageTime: 'Nov 13',
        unreadCount: 0,
        isOnline: true,
      ),
      FixtureChatThread(
        threadId: 'th_09',
        peerUserId: 'u_danish',
        peerNickname: 'Danish Qureshi',
        peerAvatar:
            'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        lastMessage: 'Welcome to the Popo Live creator community!',
        lastMessageTime: 'Nov 12',
        unreadCount: 0,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_10',
        peerUserId: 'u_maryam',
        peerNickname: 'Maryam Noor',
        peerAvatar:
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        lastMessage:
            'Can you share your microphone settings for acoustic singing?',
        lastMessageTime: 'Nov 11',
        unreadCount: 0,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_11',
        peerUserId: 'u_tariq',
        peerNickname: 'Tariq Jamil',
        peerAvatar:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        lastMessage: 'Congratulations on reaching Level 12 host status!',
        lastMessageTime: 'Nov 10',
        unreadCount: 0,
        isOnline: false,
      ),
      FixtureChatThread(
        threadId: 'th_12',
        peerUserId: 'u_sara',
        peerNickname: 'Sara Khan',
        peerAvatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastMessage: 'See you in the upcoming talent hunt event on Saturday!',
        lastMessageTime: 'Nov 09',
        unreadCount: 0,
        isOnline: true,
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 6. FOUR (4) OFFICIAL SYSTEM MESSAGE ROWS
  // --------------------------------------------------------------------------
  static List<FixtureOfficialNotice> get officialMessages {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Official notices service unavailable [ERR_NOTICE_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureOfficialNotice(
        id: 'notice_01',
        category: 'Security',
        badgeLabel: 'Important',
        title: 'New Sign-in Detected',
        preview:
            'A new sign-in was detected on your account from Android Pixel device (Karachi, PK).',
        timestamp: '10 mins ago',
        isRead: false,
        isUrgent: true,
      ),
      FixtureOfficialNotice(
        id: 'notice_02',
        category: 'Wallet',
        badgeLabel: 'Finance',
        title: 'Weekly Settlement Credited',
        preview:
            'Your host earnings of 420,000 points have been converted and credited to your wallet balance.',
        timestamp: '2 hours ago',
        isRead: true,
        isUrgent: false,
      ),
      FixtureOfficialNotice(
        id: 'notice_03',
        category: 'Activity',
        badgeLabel: 'Event',
        title: 'Grand Super PK Tournament Open',
        preview:
            'Registration for the regional Super PK Tournament is now live! Sign up before Friday.',
        timestamp: '1 day ago',
        isRead: true,
        isUrgent: false,
      ),
      FixtureOfficialNotice(
        id: 'notice_04',
        category: 'System',
        badgeLabel: 'Policy',
        title: 'Streaming Guidelines & Safety Update',
        preview:
            'Please review our updated community guidelines regarding background music and fair play.',
        timestamp: '3 days ago',
        isRead: true,
        isUrgent: false,
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 7. COINS AND POINTS WALLET
  // --------------------------------------------------------------------------
  static FixtureWallet get wallet {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Failed to synchronize wallet balance [ERR_LEDGER_TIMEOUT]',
      );
    }
    if (isEmpty) {
      return FixtureWallet.empty();
    }
    return const FixtureWallet(
      coinBalance: 154200,
      pointsBalance: 420500,
      withdrawableUsd: 42.05,
      diamondValue: 420500,
      currencySymbol: '🪙',
      exchangeRateFormatted: '10,000 Points = \$1.00 USD',
      recentTransactions: [
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
          description: 'Sent Luxury Sports Car to Bilal Ahmed',
          amount: '-15,000 coins',
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

  // --------------------------------------------------------------------------
  // 8. ACTIVE VIP PLAN
  // --------------------------------------------------------------------------
  static FixtureVipPlan get vipPlan {
    if (isError) {
      throw const DesignFixtureException(
        message: 'VIP membership service unavailable [ERR_VIP_TIMEOUT]',
      );
    }
    if (isEmpty) {
      return FixtureVipPlan.inactive();
    }
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

  // --------------------------------------------------------------------------
  // 9. EIGHT (8) MEDALS
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
        iconEmoji: '✅',
        description: 'Official Popo Live identity-verified creator badge',
        isUnlocked: true,
        unlockedDate: '2026-08-14',
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 10. FAN CLUB
  // --------------------------------------------------------------------------
  static FixtureFanClub get fanClub {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Fan club repository unavailable [ERR_FANCLUB_TIMEOUT]',
      );
    }
    if (isEmpty) {
      return FixtureFanClub.empty();
    }
    return const FixtureFanClub(
      id: 'fc_amina_noor',
      clubName: 'Noor Fam',
      hostNickname: 'Amina Noor',
      hostAvatar:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      badgeTag: '🌟 NoorFam',
      clubLevel: 8,
      memberCount: 432,
      dailyIntimacyPoints: 18450,
      description:
          'The official family for Amina Noor acoustic sessions & Karachi Nights!',
      topMembers: [
        FixtureFanClubMember(
          userId: 'u_bilal',
          nickname: 'Bilal Ahmed',
          avatarUrl:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          intimacyLevel: 18,
          rank: 1,
          joinedDaysAgo: 120,
        ),
        FixtureFanClubMember(
          userId: 'u_sana',
          nickname: 'Sana Ali',
          avatarUrl:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          intimacyLevel: 15,
          rank: 2,
          joinedDaysAgo: 95,
        ),
        FixtureFanClubMember(
          userId: 'u_faizan',
          nickname: 'Faizan Sheikh',
          avatarUrl:
              'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
          intimacyLevel: 12,
          rank: 3,
          joinedDaysAgo: 60,
        ),
      ],
    );
  }

  // --------------------------------------------------------------------------
  // 11. THREE (3) GUARDIANS
  // --------------------------------------------------------------------------
  static List<FixtureGuardian> get guardians {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Guardian roster lookup failed [ERR_GUARDIAN_503]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureGuardian(
        id: 'guard_01',
        rank: 1,
        tierName: 'Gold Dragon Guardian',
        guardianNickname: 'Bilal Ahmed',
        guardianAvatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        shieldIconEmoji: '🐉',
        contributionPoints: 250000,
        daysRemaining: 28,
        privilegeSummary:
            'Custom dragon entrance banner, seat lock immunity, priority chat voice',
      ),
      FixtureGuardian(
        id: 'guard_02',
        rank: 2,
        tierName: 'Silver Phoenix Guardian',
        guardianNickname: 'Faizan Sheikh',
        guardianAvatar:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        shieldIconEmoji: '🦅',
        contributionPoints: 120000,
        daysRemaining: 14,
        privilegeSummary:
            'Phoenix aura glow, silver seat shield, exclusive guardian badge',
      ),
      FixtureGuardian(
        id: 'guard_03',
        rank: 3,
        tierName: 'Bronze Lion Guardian',
        guardianNickname: 'Tariq Jamil',
        guardianAvatar:
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        shieldIconEmoji: '🦁',
        contributionPoints: 60000,
        daysRemaining: 7,
        privilegeSummary:
            'Bronze lion badge, special entrance notification, fan club multiplier',
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 12. SUCCESSFUL AND INVALID REDEEM CODES
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

  // --------------------------------------------------------------------------
  // 13. TASKS AND REWARDS
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

  // --------------------------------------------------------------------------
  // 14. HOST RANKINGS
  // --------------------------------------------------------------------------
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
        hostNickname: 'Bilal Ahmed',
        avatarUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        diamondsEarned: 380000,
        country: 'Pakistan',
        countryFlag: '🇵🇰',
        level: 22,
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 15. STORE ITEMS
  // --------------------------------------------------------------------------
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
        isHot: false,
      ),
    ];
  }

  // --------------------------------------------------------------------------
  // 16. BAG ITEMS
  // --------------------------------------------------------------------------
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
  // 17. AGENCY INFORMATION
  // --------------------------------------------------------------------------
  static FixtureAgency get agencyInfo {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Agency management portal error [ERR_AGENCY_PORTAL_403]',
      );
    }
    if (isEmpty) {
      return FixtureAgency.empty();
    }
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

  // --------------------------------------------------------------------------
  // 18. HELP TOPICS
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

  // --------------------------------------------------------------------------
  // INTERNAL PROFILES
  // --------------------------------------------------------------------------
  static const _profileAminaNoor = FixtureUserProfile(
    userId: 'u_amina_noor',
    poppoId: '8839201',
    nickname: 'Amina Noor',
    avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    bio:
        'Singer & acoustic guitarist from Karachi 🎸🎶 Welcome to Karachi Nights!',
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
  );

  static const _profileSanaAli = FixtureUserProfile(
    userId: 'u_sana_ali',
    poppoId: '8839202',
    nickname: 'Sana Ali',
    avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
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
  );

  static const _profileBilalAhmed = FixtureUserProfile(
    userId: 'u_bilal_ahmed',
    poppoId: '8839203',
    nickname: 'Bilal Ahmed',
    avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
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
  );

  static const _profileZainabKhan = FixtureUserProfile(
    userId: 'u_zainab_khan',
    poppoId: '8839204',
    nickname: 'Zainab Khan',
    avatarUrl:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
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
  );

  static const _profileHamzaTariq = FixtureUserProfile(
    userId: 'u_hamza_tariq',
    poppoId: '8839205',
    nickname: 'Hamza Tariq',
    avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
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
  );

  static const _profileHiraMalik = FixtureUserProfile(
    userId: 'u_hira_malik',
    poppoId: '8839206',
    nickname: 'Hira Malik',
    avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
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
  );

  static const _profileFaizanSheikh = FixtureUserProfile(
    userId: 'u_faizan_sheikh',
    poppoId: '8839207',
    nickname: 'Faizan Sheikh',
    avatarUrl:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
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
  );

  static const _profileTariqJamil = FixtureUserProfile(
    userId: 'u_tariq_jamil',
    poppoId: '8839208',
    nickname: 'Tariq Jamil',
    avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
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
  );

  static FixturePartyRoom _createPartyRoom({
    required String id,
    required String roomNumber,
    required String title,
    required String hostNickname,
    required String category,
    required List<FixturePartySeat> seats,
  }) {
    final activeCount = seats.where((s) => s.isOccupied).length;
    return FixturePartyRoom(
      id: id,
      roomNumber: roomNumber,
      title: title,
      hostNickname: hostNickname,
      category: category,
      country: 'Pakistan',
      countryCode: 'PK',
      flagEmoji: '🇵🇰',
      maxSeats: 9,
      occupiedSeatCount: activeCount,
      seats: seats,
    );
  }
}

// ============================================================================
// STRONG-TYPED FIXTURE DATA MODELS
// ============================================================================

/// User profile fixture model
class FixtureUserProfile {
  final String userId;
  final String poppoId;
  final String nickname;
  final String avatarUrl;
  final String bio;
  final String gender;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final int wealthLevel;
  final int hostLevel;
  final int vipLevel;
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
    required this.avatarUrl,
    required this.bio,
    required this.gender,
    required this.country,
    required this.countryCode,
    required this.flagEmoji,
    required this.wealthLevel,
    required this.hostLevel,
    required this.vipLevel,
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
      );

  Map<String, dynamic> toMap() => {
        'id': userId,
        'poppoId': poppoId,
        'nickname': nickname,
        'avatarUrl': avatarUrl,
        'bio': bio,
        'gender': gender,
        'country': country,
        'countryCode': countryCode,
        'flagEmoji': flagEmoji,
        'wealthLevel': wealthLevel,
        'hostLevel': hostLevel,
        'vipLevel': vipLevel,
        'followingCount': followingCount,
        'followersCount': followersCount,
        'friendsCount': friendsCount,
        'visitorCount': visitorCount,
        'isHostEligible': isHostEligible,
        'isLiveNow': isLiveNow,
        'currentLiveRoomId': currentLiveRoomId,
      };
}

/// Live Viewer experience model
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
        title: 'Stream Offline',
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
  final String category;
  final String country;
  final String countryCode;
  final String flagEmoji;
  final int maxSeats;
  final int occupiedSeatCount;
  final List<FixturePartySeat> seats;

  const FixturePartyRoom({
    required this.id,
    required this.roomNumber,
    required this.title,
    required this.hostNickname,
    required this.category,
    required this.country,
    required this.countryCode,
    required this.flagEmoji,
    required this.maxSeats,
    required this.occupiedSeatCount,
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

  const FixturePartySeat({
    required this.index,
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.isHost,
    required this.isMuted,
    required this.isSpeaking,
    required this.giftPoints,
  }) : isOccupied = true;

  const FixturePartySeat.empty(this.index)
      : userId = null,
        nickname = null,
        avatarUrl = null,
        isHost = false,
        isMuted = false,
        isSpeaking = false,
        giftPoints = 0,
        isOccupied = false;
}

/// Inbox chat thread model
class FixtureChatThread {
  final String threadId;
  final String peerUserId;
  final String peerNickname;
  final String peerAvatar;
  final String lastMessage;
  final String lastMessageTime;
  final int unreadCount;
  final bool isOnline;

  const FixtureChatThread({
    required this.threadId,
    required this.peerUserId,
    required this.peerNickname,
    required this.peerAvatar,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.unreadCount,
    required this.isOnline,
  });
}

/// Official message / notice model
class FixtureOfficialNotice {
  final String id;
  final String category;
  final String badgeLabel;
  final String title;
  final String preview;
  final String timestamp;
  final bool isRead;
  final bool isUrgent;

  const FixtureOfficialNotice({
    required this.id,
    required this.category,
    required this.badgeLabel,
    required this.title,
    required this.preview,
    required this.timestamp,
    required this.isRead,
    required this.isUrgent,
  });
}

/// Wallet balance and ledger model
class FixtureWallet {
  final int coinBalance;
  final int pointsBalance;
  final double withdrawableUsd;
  final int diamondValue;
  final String currencySymbol;
  final String exchangeRateFormatted;
  final List<FixtureWalletTransaction> recentTransactions;

  const FixtureWallet({
    required this.coinBalance,
    required this.pointsBalance,
    required this.withdrawableUsd,
    required this.diamondValue,
    required this.currencySymbol,
    required this.exchangeRateFormatted,
    required this.recentTransactions,
  });

  factory FixtureWallet.empty() => const FixtureWallet(
        coinBalance: 0,
        pointsBalance: 0,
        withdrawableUsd: 0.0,
        diamondValue: 0,
        currencySymbol: '🪙',
        exchangeRateFormatted: '10,000 Points = \$1.00 USD',
        recentTransactions: [],
      );
}

/// Wallet transaction ledger entry
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
        tierName: 'Standard Member',
        isActive: false,
        expiryDate: 'None',
        daysRemaining: 0,
        progressPercentage: 0.0,
        pointsToNextTier: 10000,
        badgeAsset: 'assets/vip/vip_tier_none.png',
        privileges: [],
      );
}

/// VIP privilege descriptor
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

/// Medal / recognition badge model
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

/// Fan club structure
class FixtureFanClub {
  final String id;
  final String clubName;
  final String hostNickname;
  final String hostAvatar;
  final String badgeTag;
  final int clubLevel;
  final int memberCount;
  final int dailyIntimacyPoints;
  final String description;
  final List<FixtureFanClubMember> topMembers;

  const FixtureFanClub({
    required this.id,
    required this.clubName,
    required this.hostNickname,
    required this.hostAvatar,
    required this.badgeTag,
    required this.clubLevel,
    required this.memberCount,
    required this.dailyIntimacyPoints,
    required this.description,
    required this.topMembers,
  });

  factory FixtureFanClub.empty() => const FixtureFanClub(
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
      );
}

/// Fan club member
class FixtureFanClubMember {
  final String userId;
  final String nickname;
  final String avatarUrl;
  final int intimacyLevel;
  final int rank;
  final int joinedDaysAgo;

  const FixtureFanClubMember({
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.intimacyLevel,
    required this.rank,
    required this.joinedDaysAgo,
  });
}

/// Host Guardian model
class FixtureGuardian {
  final String id;
  final int rank;
  final String tierName;
  final String guardianNickname;
  final String guardianAvatar;
  final String shieldIconEmoji;
  final int contributionPoints;
  final int daysRemaining;
  final String privilegeSummary;

  const FixtureGuardian({
    required this.id,
    required this.rank,
    required this.tierName,
    required this.guardianNickname,
    required this.guardianAvatar,
    required this.shieldIconEmoji,
    required this.contributionPoints,
    required this.daysRemaining,
    required this.privilegeSummary,
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

/// Host Ranking item
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

/// Store item model
class FixtureStoreItem {
  final String id;
  final String title;
  final String category;
  final int priceCoins;
  final int validityDays;
  final String previewImage;
  final bool isHot;

  const FixtureStoreItem({
    required this.id,
    required this.title,
    required this.category,
    required this.priceCoins,
    required this.validityDays,
    required this.previewImage,
    required this.isHot,
  });
}

/// Inventory bag item model
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
