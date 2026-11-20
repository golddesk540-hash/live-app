import 'package:flutter/material.dart';

import '../../api/api_config.dart';
import '../../api/services/party_api_service.dart';
import '../../design/design_fixtures.dart';
import '../../l10n/strings.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import 'create_party_screen.dart';
import 'party_room_screen.dart';

/// 9-Seat Party Room Discovery Screen (Tab 1 of App Shell)
/// Implements Popo Live Complete Product Design v1.1 - Phase 4 (D3)
///
/// Features:
/// - Following & Party 2-tab navigation
/// - Horizontal country filtering chips (ALL, PK, AE, GB, TR)
/// - Exactly 6 fixture party rooms with 9-seat faces and occupancy metrics
/// - Prominent orange PARTY button opening local Create Party interface
/// - Error, empty, and filled design state support
class PartyDiscoveryScreen extends StatefulWidget {
  const PartyDiscoveryScreen({super.key});

  @override
  State<PartyDiscoveryScreen> createState() => _PartyDiscoveryScreenState();
}

class _PartyDiscoveryScreenState extends State<PartyDiscoveryScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String _selectedCountryCode = 'ALL';
  List<FixturePartyRoom> _apiRooms = [];
  bool _isLoadingApi = false;

  static const List<Map<String, String>> _countryChips = [
    {'code': 'ALL', 'label': 'All', 'emoji': '🌍'},
    {'code': 'PK', 'label': 'Pakistan', 'emoji': '🇵🇰'},
    {'code': 'AE', 'label': 'UAE', 'emoji': '🇦🇪'},
    {'code': 'GB', 'label': 'UK', 'emoji': '🇬🇧'},
    {'code': 'TR', 'label': 'Turkey', 'emoji': '🇹🇷'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this, initialIndex: 1);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {});
        if (ApiConfig.usePartyApi) _fetchLivePartyRooms();
      }
    });
    if (ApiConfig.usePartyApi) {
      _fetchLivePartyRooms();
    }
  }

  Future<void> _fetchLivePartyRooms() async {
    setState(() => _isLoadingApi = true);
    try {
      final tab = _tabController.index == 0 ? 'following' : 'party';
      final res = await PartyApiService().getPartyRooms(
        country: _selectedCountryCode == 'ALL' ? null : _selectedCountryCode,
        tab: tab,
      );
      if (res.isSuccess && res.data != null) {
        final list = (res.data['rooms'] as List?) ?? [];
        setState(() {
          _apiRooms = list.map<FixturePartyRoom>((r) {
            final occupied = (r['currentMembers'] as num?)?.toInt() ?? 1;
            final maxS = (r['maxSeats'] as num?)?.toInt() ?? 9;
            return FixturePartyRoom(
              id: r['id']?.toString() ?? '',
              roomNumber: r['roomNumber']?.toString() ?? '',
              title: r['title']?.toString() ?? 'Party Room',
              hostNickname: r['hostNickname']?.toString() ?? 'Host',
              hostAvatar: r['hostAvatar']?.toString() ?? '',
              hostUserId: r['hostUserId']?.toString() ?? '',
              coverUrl: r['collageUrl']?.toString() ?? '',
              category: r['category']?.toString() ?? 'Party',
              country: r['country']?.toString() ?? 'Pakistan',
              countryCode: r['countryCode']?.toString() ?? 'PK',
              flagEmoji: r['flagEmoji']?.toString() ?? '🎉',
              viewerCount: (r['viewerCount'] as num?)?.toInt() ?? occupied,
              maxSeats: maxS,
              occupiedSeatCount: occupied,
              joinStatus: 'open',
              seats: List.generate(
                9,
                (i) => FixturePartySeat(
                  index: i + 1,
                  userId: i == 0 ? r['hostUserId']?.toString() : null,
                  nickname: i == 0 ? r['hostNickname']?.toString() : null,
                  avatarUrl: i == 0 ? r['hostAvatar']?.toString() : null,
                  isHost: i == 0,
                  isMuted: false,
                  isSpeaking: false,
                  giftPoints: 0,
                  isOccupied: i < occupied,
                  isLocked: false,
                  canJoin: i > 0,
                  joinRequestStatus: 'none',
                ),
              ),
            );
          }).toList();
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoadingApi = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onCountrySelected(String code) {
    if (_selectedCountryCode == code) return;
    setState(() {
      _selectedCountryCode = code;
    });
    if (ApiConfig.usePartyApi) {
      _fetchLivePartyRooms();
    }
  }

  void _openCreatePartyScreen() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CreatePartyScreen(
          onRoomCreated: (newRoom) {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => PartyRoomScreen(room: newRoom),
              ),
            );
          },
        ),
      ),
    );
  }

  void _openPartyRoom(FixturePartyRoom room) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PartyRoomScreen(room: room),
      ),
    );
  }

  List<FixturePartyRoom> _getAllRooms() {
    if (ApiConfig.usePartyApi && _apiRooms.isNotEmpty) {
      return _apiRooms;
    }
    if (DesignFixtures.isError || DesignFixtures.isEmpty) {
      return const [];
    }
    try {
      return DesignFixtures.partyRooms;
    } catch (_) {
      return const [];
    }
  }

  List<FixturePartyRoom> _getFilteredPartyRooms() {
    final allRooms = _getAllRooms();
    if (_selectedCountryCode == 'ALL') {
      return allRooms;
    }
    return allRooms
        .where((r) =>
            r.countryCode.toUpperCase() == _selectedCountryCode.toUpperCase())
        .toList();
  }

  List<FixturePartyRoom> _getFollowingRooms() {
    final allRooms = _getAllRooms();
    // Followed hosts in fixture dataset: Amina Noor (party_001), Zainab Khan (party_002), Bilal Ahmed (party_004)
    return allRooms
        .where((r) => ['party_001', 'party_002', 'party_004'].contains(r.id))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: PopoStrings.currentLanguage,
      builder: (context, lang, _) {
        final isUrdu = lang == 'ur';
        return Directionality(
          textDirection: isUrdu ? TextDirection.rtl : TextDirection.ltr,
          child: Scaffold(
            backgroundColor: PopoTheme.background,
            floatingActionButton: _buildOrangePartyButton(),
            floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
            body: SafeArea(
              child: Column(
                children: [
                  _buildTopHeader(),
                  _buildTabBar(),
                  if (_tabController.index == 1) _buildCountryChips(),
                  Expanded(child: _buildBody()),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildTopHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF9800), Color(0xFFFF5722)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFF9800).withOpacity(0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.celebration_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    Strings.get(context, 'party_discovery_title'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const Text(
                    '9-Seat Audio Lounges',
                    style: TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const Row(
            children: [
              IconButton(
                key: Key('party_language_button'),
                icon: Icon(
                  Icons.translate_rounded,
                  color: PopoTheme.cyan,
                  size: 20,
                ),
                tooltip: 'Switch Language',
                onPressed: PopoStrings.toggleLanguage,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: PopoTheme.borderSubtle, width: 1),
      ),
      child: TabBar(
        key: const Key('party_tab_bar'),
        controller: _tabController,
        indicator: BoxDecoration(
          color: PopoTheme.primary,
          borderRadius: BorderRadius.circular(25),
          boxShadow: [
            BoxShadow(
              color: PopoTheme.primary.withOpacity(0.4),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        labelColor: Colors.white,
        unselectedLabelColor: PopoTheme.textSecondary,
        labelStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.3,
        ),
        unselectedLabelStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        tabs: const [
          Tab(
            key: Key('party_tab_following'),
            text: 'Following',
          ),
          Tab(
            key: Key('party_tab_party'),
            text: 'Party',
          ),
        ],
      ),
    );
  }

  Widget _buildCountryChips() {
    return Container(
      height: 42,
      margin: const EdgeInsets.only(top: 4, bottom: 8),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _countryChips.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final chip = _countryChips[index];
          final code = chip['code']!;
          final isSelected = _selectedCountryCode == code;

          return InkWell(
            key: Key('party_country_chip_$code'),
            onTap: () => _onCountrySelected(code),
            borderRadius: BorderRadius.circular(20),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                gradient: isSelected ? PopoTheme.primaryGradient : null,
                color: isSelected ? null : PopoTheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color:
                      isSelected ? Colors.transparent : PopoTheme.borderSubtle,
                  width: 1,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: PopoTheme.primary.withOpacity(0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        )
                      ]
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(chip['emoji']!, style: const TextStyle(fontSize: 13)),
                  const SizedBox(width: 6),
                  Text(
                    chip['label']!,
                    style: TextStyle(
                      color:
                          isSelected ? Colors.white : PopoTheme.textSecondary,
                      fontSize: 12,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBody() {
    // 1. Error state check
    if (DesignFixtures.isError) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: PopoErrorState(
            key: const Key('party_error_state'),
            message:
                'Failed to connect to party room audio cluster. 9-seat rooms cannot be displayed right now.',
            onRetry: () => setState(() {}),
          ),
        ),
      );
    }

    // 2. Empty state check
    if (DesignFixtures.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: PopoEmptyState(
            key: const Key('party_empty_state'),
            icon: Icons.celebration_outlined,
            iconColor: const Color(0xFFFF9800),
            title: 'No Party Rooms Available',
            message:
                'All party lounges are currently quiet. Open a 9-seat room to invite your friends!',
            actionText: 'Create Party Room',
            onActionTap: _openCreatePartyScreen,
          ),
        ),
      );
    }

    return TabBarView(
      controller: _tabController,
      children: [
        _buildFollowingTab(),
        _buildPartyTab(),
      ],
    );
  }

  Widget _buildFollowingTab() {
    final rooms = _getFollowingRooms();

    if (rooms.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: PopoEmptyState(
            key: const Key('party_empty_following_state'),
            icon: Icons.people_outline_rounded,
            iconColor: PopoTheme.cyan,
            title: 'No Followed Party Lounges',
            message:
                'Follow your favorite creator hosts to join their 9-seat audio lounges here!',
            actionText: 'Explore All Lounges',
            onActionTap: () => _tabController.animateTo(1),
          ),
        ),
      );
    }

    return _buildRoomGrid(rooms);
  }

  Widget _buildPartyTab() {
    final rooms = _getFilteredPartyRooms();

    if (rooms.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: PopoEmptyState(
            key: const Key('party_empty_country_state'),
            icon: Icons.travel_explore_rounded,
            iconColor: PopoTheme.primary,
            title: 'No Party Lounges Found',
            message:
                'No 9-seat rooms active in this region. Be the first to start a party!',
            actionText: 'Show All Countries',
            onActionTap: () => _onCountrySelected('ALL'),
          ),
        ),
      );
    }

    return _buildRoomGrid(rooms);
  }

  Widget _buildRoomGrid(List<FixturePartyRoom> rooms) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 88),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.72,
      ),
      itemCount: rooms.length,
      itemBuilder: (context, index) {
        final room = rooms[index];
        return _buildPartyRoomCard(room);
      },
    );
  }

  Widget _buildPartyRoomCard(FixturePartyRoom room) {
    final occupiedSeats = room.seats.where((s) => s.isOccupied).toList();

    return InkWell(
      key: Key('party_room_card_${room.id}'),
      onTap: () => _openPartyRoom(room),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: PopoTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: PopoTheme.borderSubtle, width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Cover Area with Badges
            Expanded(
              flex: 5,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    room.coverUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF2A1B40), Color(0xFF161626)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.celebration_rounded,
                          color: Color(0xFFFF9800),
                          size: 38,
                        ),
                      ),
                    ),
                  ),
                  // Dark Vignette Gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.black.withOpacity(0.55),
                          Colors.transparent,
                          Colors.black.withOpacity(0.75),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  // Top Left: LIVE AUDIO badge
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2.5),
                      decoration: BoxDecoration(
                        gradient: PopoTheme.primaryGradient,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.fiber_manual_record_rounded,
                            color: Colors.white,
                            size: 7,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'LIVE AUDIO',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Top Right: 9-Seat Occupancy Pill
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: const Color(0xFFFF9800).withOpacity(0.8),
                          width: 0.8,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.airline_seat_recline_normal_rounded,
                            color: Color(0xFFFF9800),
                            size: 11,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            '${room.occupiedSeatCount}/${room.maxSeats} Seats',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Bottom on cover: Seat Face Avatars
                  Positioned(
                    bottom: 6,
                    left: 8,
                    right: 8,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Seat Faces Row
                        Row(
                          children: [
                            for (int i = 0;
                                i < occupiedSeats.take(4).length;
                                i++)
                              Align(
                                widthFactor: 0.72,
                                child: Container(
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: i == 0
                                          ? PopoTheme.gold
                                          : Colors.white,
                                      width: 1.2,
                                    ),
                                  ),
                                  child: CircleAvatar(
                                    radius: 10,
                                    backgroundImage: NetworkImage(
                                      occupiedSeats[i].avatarUrl ??
                                          room.hostAvatar,
                                    ),
                                    backgroundColor: const Color(0xFF33334D),
                                  ),
                                ),
                              ),
                            if (occupiedSeats.length > 4)
                              Container(
                                margin: const EdgeInsets.only(left: 4),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 4, vertical: 1),
                                decoration: BoxDecoration(
                                  color: Colors.black87,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '+${occupiedSeats.length - 4}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 8,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        // Viewer Count
                        Row(
                          children: [
                            const Icon(
                              Icons.remove_red_eye_rounded,
                              color: Colors.white70,
                              size: 11,
                            ),
                            const SizedBox(width: 3),
                            Text(
                              '${room.viewerCount}',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Bottom Information Area
            Expanded(
              flex: 4,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Room Title
                    Text(
                      room.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        height: 1.2,
                      ),
                    ),

                    // Status Line / Category Tag
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 5, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF9800).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            room.category,
                            style: const TextStyle(
                              color: Color(0xFFFF9800),
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          room.flagEmoji,
                          style: const TextStyle(fontSize: 11),
                        ),
                      ],
                    ),

                    // Host Row
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 8,
                          backgroundImage: NetworkImage(room.hostAvatar),
                          backgroundColor: const Color(0xFF33334D),
                        ),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            room.hostNickname,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrangePartyButton() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF9800), Color(0xFFFF5722)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF9800).withOpacity(0.45),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          key: const Key('orange_party_button'),
          onTap: _openCreatePartyScreen,
          borderRadius: BorderRadius.circular(30),
          child: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.celebration_rounded,
                  color: Colors.white,
                  size: 20,
                ),
                SizedBox(width: 8),
                Text(
                  'PARTY',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.0,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
