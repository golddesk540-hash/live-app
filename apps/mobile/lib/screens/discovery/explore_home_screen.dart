import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../design/design_fixtures.dart';
import '../../widgets/popo_empty_state.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_icon_button.dart';
import 'country_chips.dart';
import 'room_card.dart';
import 'search_screen.dart';
import 'rankings_bottom_sheet.dart';
import '../recognition/recognition_screen.dart';
import '../live/go_live_gate_screen.dart';
import '../live/viewer_room_screen.dart';

/// Complete Explore Home Screen (Phase 3 - D2 Prompt 1)
/// Fully wired with Popo Live D0 Fixture Data, 3 Discovery Tabs, Country Chips,
/// Honor Tile, Activity Center Tile, PK Ranking Banner, 8 Live Rooms, and Pink LIVE Button.
class ExploreHomeScreen extends StatefulWidget {
  const ExploreHomeScreen({super.key});

  @override
  State<ExploreHomeScreen> createState() => _ExploreHomeScreenState();
}

class _ExploreHomeScreenState extends State<ExploreHomeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();

  String _selectedCountry = 'ALL';

  @override
  void initState() {
    super.initState();
    // Exactly 3 Discovery Tabs: 0: Following, 1: Explore (DEFAULT), 2: For You
    _tabController = TabController(length: 3, vsync: this, initialIndex: 1);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  // ==========================================
  // NAVIGATION ACTIONS
  // ==========================================
  void _openLiveViewer(FixtureLiveRoom room) {
    Navigator.of(context).push(
      MaterialPageRoute(
        settings: const RouteSettings(name: 'ViewerRoom'),
        builder: (_) => ViewerRoomScreen(
          roomId: room.id,
          initialTitle: room.title,
          initialHostNickname: room.hostNickname,
          initialCoverUrl: room.coverUrl,
        ),
      ),
    );
  }

  void _openGoLiveGate() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const GoLiveGateScreen(),
      ),
    );
  }

  void _openHonorScreen() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const RecognitionScreen(
          apiBaseUrl: '',
          previewDemo: true,
          initialCategory: 'honor',
        ),
      ),
    );
  }

  void _openActivityCenter() {
    RankingsBottomSheet.show(context);
  }

  void _openSearchScreen() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const SearchScreen()),
    );
  }

  void _onCountrySelected(String code) {
    if (_selectedCountry == code) return;
    setState(() {
      _selectedCountry = code;
    });
  }

  // ==========================================
  // FIXTURE DATA PROVIDERS
  // ==========================================
  List<FixtureLiveRoom> _getFilteredExploreRooms() {
    if (DesignFixtures.isError || DesignFixtures.isEmpty) {
      return const [];
    }
    final allRooms = DesignFixtures.liveRooms;
    if (_selectedCountry == 'ALL') {
      return allRooms;
    }
    return allRooms
        .where((r) => r.countryCode.toUpperCase() == _selectedCountry.toUpperCase())
        .toList();
  }

  List<FixtureLiveRoom> _getFollowingRooms() {
    if (DesignFixtures.isError || DesignFixtures.isEmpty) {
      return const [];
    }
    final allRooms = DesignFixtures.liveRooms;
    // Followed creators in fixture: Sana Ali (room_002), Bilal Ahmed (room_003), Zainab Khan (room_004)
    return allRooms.where((r) => ['room_002', 'room_003', 'room_004'].contains(r.id)).toList();
  }

  List<FixtureLiveRoom> _getForYouRooms() {
    if (DesignFixtures.isError || DesignFixtures.isEmpty) {
      return const [];
    }
    final allRooms = List<FixtureLiveRoom>.from(DesignFixtures.liveRooms);
    // Sort by heatScore descending for curated recommendations
    allRooms.sort((a, b) => b.heatScore.compareTo(a.heatScore));
    return allRooms;
  }

  // ==========================================
  // BUILD METHOD
  // ==========================================
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
            appBar: AppBar(
              backgroundColor: PopoTheme.surface,
              elevation: 0,
              titleSpacing: 16,
              title: Row(
                children: [
                  Text(
                    PopoStrings.get('app_name'),
                    style: const TextStyle(
                      color: PopoTheme.primary,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              actions: [
                // Language Switcher
                const PopoIconButton(
                  icon: Icons.translate_rounded,
                  color: PopoTheme.cyan,
                  tooltip: 'Switch Language (English / اردو)',
                  onPressed: PopoStrings.toggleLanguage,
                ),

                // Search Icon
                PopoIconButton(
                  icon: Icons.search_rounded,
                  color: PopoTheme.cyan,
                  tooltip: PopoStrings.get('search_title'),
                  onPressed: _openSearchScreen,
                ),

                // Trophy / Rankings Icon
                PopoIconButton(
                  icon: Icons.emoji_events_rounded,
                  color: PopoTheme.gold,
                  tooltip: PopoStrings.get('rankings_title'),
                  onPressed: _openActivityCenter,
                ),
                const SizedBox(width: 8),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(44),
                child: Container(
                  height: 44,
                  decoration: const BoxDecoration(
                    color: PopoTheme.surface,
                    border: Border(
                      bottom: BorderSide(
                        color: PopoTheme.borderSubtle,
                        width: 0.5,
                      ),
                    ),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    isScrollable: false,
                    indicatorColor: PopoTheme.primary,
                    indicatorWeight: 3.0,
                    indicatorSize: TabBarIndicatorSize.label,
                    labelColor: PopoTheme.primary,
                    unselectedLabelColor: PopoTheme.textSecondary,
                    labelStyle: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                    unselectedLabelStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                    tabs: [
                      Tab(text: PopoStrings.get('tab_follow')),
                      Tab(text: PopoStrings.get('tab_explore')),
                      Tab(text: PopoStrings.get('tab_for_you')),
                    ],
                  ),
                ),
              ),
            ),
            body: TabBarView(
              controller: _tabController,
              children: [
                // 1. Following Tab
                _buildFollowingTab(),

                // 2. Explore Tab (Default)
                _buildExploreTab(),

                // 3. For You Tab
                _buildForYouTab(),
              ],
            ),
            floatingActionButton: _buildPinkLiveButton(),
            floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
          ),
        );
      },
    );
  }

  // ==========================================
  // TAB 1: FOLLOWING
  // ==========================================
  Widget _buildFollowingTab() {
    if (DesignFixtures.isError) {
      return _buildErrorState();
    }
    if (DesignFixtures.isEmpty) {
      return _buildEmptyState();
    }

    final followingRooms = _getFollowingRooms();
    if (followingRooms.isEmpty) {
      return PopoEmptyState(
        title: 'No Followed Broadcasters Live',
        subtitle: 'Follow your favorite creators to see them appear here!',
        icon: Icons.favorite_border_rounded,
        actionText: 'Discover Creators',
        onActionTap: () => _tabController.animateTo(1),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => setState(() {}),
      color: PopoTheme.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
              child: Row(
                children: [
                  const Icon(Icons.favorite_rounded, color: PopoTheme.primary, size: 16),
                  const SizedBox(width: 6),
                  Text(
                    'Followed Creators (${followingRooms.length} Live)',
                    style: const TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 3 / 4,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final room = followingRooms[index];
                  return RoomCard.fromFixture(
                    fixture: room,
                    onTap: () => _openLiveViewer(room),
                  );
                },
                childCount: followingRooms.length,
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 2: EXPLORE (DEFAULT)
  // ==========================================
  Widget _buildExploreTab() {
    if (DesignFixtures.isError) {
      return _buildErrorState();
    }
    if (DesignFixtures.isEmpty) {
      return _buildEmptyState();
    }

    final filteredRooms = _getFilteredExploreRooms();

    return RefreshIndicator(
      onRefresh: () async => setState(() {}),
      color: PopoTheme.primary,
      child: CustomScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          // 1. Two Feature Tiles: Honor Tile & Activity Center Tile
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  // Honor Tile
                  Expanded(child: _buildHonorTile()),
                  const SizedBox(width: 10),
                  // Activity Center Tile
                  Expanded(child: _buildActivityCenterTile()),
                ],
              ),
            ),
          ),

          // 2. PK Ranking Banner
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: _buildPkRankingBanner(),
            ),
          ),

          // 3. Country Selection Chips
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: CountryChips(
                selectedCountryCode: _selectedCountry,
                onCountrySelected: _onCountrySelected,
              ),
            ),
          ),

          // 4. Live Room Grid or Filtered Empty State
          if (filteredRooms.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: PopoEmptyState(
                title: 'No Live Streams Found',
                subtitle: 'No broadcasters live right now in this selected country.',
                icon: Icons.public_off_rounded,
                actionText: 'Show All Rooms',
                onActionTap: () => _onCountrySelected('ALL'),
              ),
            )
          else ...[
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 3 / 4,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final room = filteredRooms[index];
                    return RoomCard.fromFixture(
                      fixture: room,
                      onTap: () => _openLiveViewer(room),
                    );
                  },
                  childCount: filteredRooms.length,
                ),
              ),
            ),
          ],

          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 3: FOR YOU
  // ==========================================
  Widget _buildForYouTab() {
    if (DesignFixtures.isError) {
      return _buildErrorState();
    }
    if (DesignFixtures.isEmpty) {
      return _buildEmptyState();
    }

    final forYouRooms = _getForYouRooms();

    return RefreshIndicator(
      onRefresh: () async => setState(() {}),
      color: PopoTheme.primary,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 14, 16, 8),
              child: Row(
                children: [
                  Icon(Icons.auto_awesome_rounded, color: PopoTheme.gold, size: 16),
                  SizedBox(width: 6),
                  Text(
                    'Recommended For You',
                    style: TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 3 / 4,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final room = forYouRooms[index];
                  return RoomCard.fromFixture(
                    fixture: room,
                    onTap: () => _openLiveViewer(room),
                  );
                },
                childCount: forYouRooms.length,
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }

  // ==========================================
  // FEATURE TILE: HONOR
  // ==========================================
  Widget _buildHonorTile() {
    return GestureDetector(
      onTap: _openHonorScreen,
      child: Container(
        height: 74,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: const LinearGradient(
            colors: [Color(0xFF22163E), Color(0xFF130D26)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: PopoTheme.gold.withOpacity(0.35),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFFFFD700), Color(0xFFFF9100)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: PopoTheme.gold.withOpacity(0.4),
                    blurRadius: 6,
                  ),
                ],
              ),
              child: const Icon(
                Icons.military_tech_rounded,
                color: Colors.black87,
                size: 24,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          PopoStrings.get('honor_title'),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: PopoTheme.gold.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: PopoTheme.gold, width: 0.5),
                        ),
                        child: const Text(
                          'Lv.10',
                          style: TextStyle(
                            color: PopoTheme.gold,
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Wealth & Shining',
                    style: TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // FEATURE TILE: ACTIVITY CENTER
  // ==========================================
  Widget _buildActivityCenterTile() {
    return GestureDetector(
      onTap: _openActivityCenter,
      child: Container(
        height: 74,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: const LinearGradient(
            colors: [Color(0xFF381028), Color(0xFF1B0715)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(
            color: PopoTheme.primary.withOpacity(0.4),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFFFF1768), Color(0xFFFF5252)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: PopoTheme.primary.withOpacity(0.4),
                    blurRadius: 6,
                  ),
                ],
              ),
              child: const Icon(
                Icons.local_fire_department_rounded,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          PopoStrings.get('activity_center'),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: PopoTheme.primary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: PopoTheme.primary, width: 0.5),
                        ),
                        child: const Text(
                          'HOT',
                          style: TextStyle(
                            color: PopoTheme.primary,
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Star Hunt 2026',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // PK RANKING BANNER
  // ==========================================
  Widget _buildPkRankingBanner() {
    final eventRankings = DesignFixtures.eventRankings;
    final r1 = eventRankings.isNotEmpty
        ? eventRankings[0]
        : const FixtureEventRanking(
            rank: 1,
            eventName: 'Karachi Nights Star Hunt 2026',
            hostNickname: 'Amina Noor',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            eventPoints: 2450000,
            badgeTitle: 'Grand Champion',
          );
    final r2 = eventRankings.length > 1
        ? eventRankings[1]
        : const FixtureEventRanking(
            rank: 2,
            eventName: 'Karachi Nights Star Hunt 2026',
            hostNickname: 'Sana Ali',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            eventPoints: 1920000,
            badgeTitle: '1st Runner Up',
          );

    return GestureDetector(
      onTap: _openActivityCenter,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            colors: [Color(0xFF2B0A42), Color(0xFF450D2E)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          border: Border.all(
            color: const Color(0xFF8B5CF6).withOpacity(0.4),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.35),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            // Header line
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(
                        Icons.flash_on_rounded,
                        color: PopoTheme.gold,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        PopoStrings.get('pk_ranking_title'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black38,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            r1.eventName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: PopoTheme.cyan,
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Rankings',
                      style: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Icon(
                      Icons.chevron_right_rounded,
                      color: PopoTheme.textSecondary,
                      size: 16,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Contenders Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                // Contender 1 (Rank 1)
                _buildContenderItem(
                  rank: 1,
                  nickname: r1.hostNickname,
                  avatarUrl: r1.avatarUrl,
                  pointsFormatted: '2.45M',
                  accentColor: PopoTheme.gold,
                ),

                // Center VS Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF1768), Color(0xFF8B5CF6)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: PopoTheme.primary.withOpacity(0.5),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: const Text(
                    'VS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),

                // Contender 2 (Rank 2)
                _buildContenderItem(
                  rank: 2,
                  nickname: r2.hostNickname,
                  avatarUrl: r2.avatarUrl,
                  pointsFormatted: '1.92M',
                  accentColor: const Color(0xFFC0C0C0),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContenderItem({
    required int rank,
    required String nickname,
    required String avatarUrl,
    required String pointsFormatted,
    required Color accentColor,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            CircleAvatar(
              radius: 17,
              backgroundColor: accentColor.withOpacity(0.5),
              child: CircleAvatar(
                radius: 15,
                backgroundImage: NetworkImage(avatarUrl),
                backgroundColor: PopoTheme.surface,
              ),
            ),
            Positioned(
              bottom: -4,
              right: -4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                decoration: BoxDecoration(
                  color: accentColor,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '#$rank',
                  style: const TextStyle(
                    color: Colors.black87,
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              nickname,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              '$pointsFormatted pts',
              style: TextStyle(
                color: accentColor,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ==========================================
  // PINK LIVE BUTTON
  // ==========================================
  Widget _buildPinkLiveButton() {
    return Container(
      key: const Key('pink_live_button'),
      margin: const EdgeInsets.only(bottom: 8, right: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        gradient: const LinearGradient(
          colors: [Color(0xFFFF1768), Color(0xFFFF5252)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF1768).withOpacity(0.45),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(30),
          onTap: _openGoLiveGate,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.videocam_rounded,
                  color: Colors.white,
                  size: 22,
                ),
                const SizedBox(width: 8),
                Text(
                  PopoStrings.get('go_live_btn'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ==========================================
  // EMPTY & ERROR STATES
  // ==========================================
  Widget _buildEmptyState() {
    const emptyInfo = DesignFixtures.liveRoomsEmpty;
    return PopoEmptyState(
      title: emptyInfo.title,
      subtitle: emptyInfo.message,
      icon: Icons.live_tv_rounded,
      actionText: emptyInfo.actionLabel,
      onActionTap: _openGoLiveGate,
    );
  }

  Widget _buildErrorState() {
    const errorInfo = DesignFixtures.liveRoomsError;
    return PopoErrorState(
      title: errorInfo.title,
      message: errorInfo.message,
      retryText: errorInfo.actionLabel,
      onRetry: () => setState(() {}),
    );
  }
}
