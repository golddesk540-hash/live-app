import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../models/models.dart';
import '../../repositories/discovery_repository.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_empty_state.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_icon_button.dart';
import 'country_chips.dart';
import 'banners_carousel.dart';
import 'room_card.dart';
import 'room_preview_screen.dart';
import 'search_screen.dart';
import 'rankings_bottom_sheet.dart';

/// Premium Explore Home Screen with 4 Discovery Tabs: Follow, Explore (Default), New, PK
/// Powered by DiscoveryRepository with pagination, caching, and pull-to-refresh
class ExploreHomeScreen extends StatefulWidget {
  const ExploreHomeScreen({Key? key}) : super(key: key);

  @override
  State<ExploreHomeScreen> createState() => _ExploreHomeScreenState();
}

class _ExploreHomeScreenState extends State<ExploreHomeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final DiscoveryRepository _repository = DiscoveryRepository.instance;
  final ScrollController _exploreScrollController = ScrollController();

  // Tab State Collections
  List<DiscoveryRoom> _exploreRooms = [];
  bool _isLoadingExplore = true;
  bool _isLoadingMoreExplore = false;
  String? _exploreError;
  String _selectedCountry = 'ALL';

  List<DiscoveryRoom> _followingRooms = [];
  bool _isLoadingFollowing = true;
  String? _followingError;

  List<DiscoveryRoom> _newCreators = [];
  bool _isLoadingNew = true;
  String? _newError;

  List<DiscoveryRoom> _pkBattles = [];
  bool _isLoadingPk = true;
  String? _pkError;

  @override
  void initState() {
    super.initState();
    // 4 Top Tabs: 0: Follow, 1: Explore (DEFAULT), 2: New, 3: PK
    _tabController = TabController(length: 4, vsync: this, initialIndex: 1);
    _tabController.addListener(_handleTabChange);
    _exploreScrollController.addListener(_onExploreScroll);

    // Initial load
    _fetchExploreFeed();
    _fetchFollowingFeed();
    _fetchNewFeed();
    _fetchPkFeed();
  }

  @override
  void dispose() {
    _exploreScrollController.removeListener(_onExploreScroll);
    _exploreScrollController.dispose();
    _tabController.removeListener(_handleTabChange);
    _tabController.dispose();
    super.dispose();
  }

  void _handleTabChange() {
    if (_tabController.indexIsChanging) return;
    setState(() {});
  }

  void _onExploreScroll() {
    if (!_exploreScrollController.hasClients) return;
    final maxScroll = _exploreScrollController.position.maxScrollExtent;
    final currentScroll = _exploreScrollController.position.pixels;

    if (currentScroll >= (maxScroll - 250) &&
        _repository.hasMoreExplore &&
        !_isLoadingMoreExplore &&
        !_isLoadingExplore) {
      _loadMoreExplore();
    }
  }

  // ==========================================
  // DATA FETCHING & PAGINATION
  // ==========================================
  Future<void> _fetchExploreFeed({bool refresh = false}) async {
    setState(() {
      _isLoadingExplore = true;
      _exploreError = null;
    });

    try {
      final rooms = await _repository.fetchExplore(
        refresh: refresh,
        countryCode: _selectedCountry,
      );
      if (!mounted) return;
      setState(() {
        _exploreRooms = rooms;
        _isLoadingExplore = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingExplore = false;
        _exploreError = e.toString();
      });
    }
  }

  Future<void> _loadMoreExplore() async {
    setState(() {
      _isLoadingMoreExplore = true;
    });

    try {
      final rooms = await _repository.loadMoreExplore();
      if (!mounted) return;
      setState(() {
        _exploreRooms = rooms;
        _isLoadingMoreExplore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoadingMoreExplore = false;
      });
    }
  }

  Future<void> _fetchFollowingFeed({bool refresh = false}) async {
    setState(() {
      _isLoadingFollowing = true;
      _followingError = null;
    });

    try {
      final rooms = await _repository.fetchFollowing(refresh: refresh);
      if (!mounted) return;
      setState(() {
        _followingRooms = rooms;
        _isLoadingFollowing = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingFollowing = false;
        _followingError = e.toString();
      });
    }
  }

  Future<void> _fetchNewFeed({bool refresh = false}) async {
    setState(() {
      _isLoadingNew = true;
      _newError = null;
    });

    try {
      final rooms = await _repository.fetchNewCreators(refresh: refresh);
      if (!mounted) return;
      setState(() {
        _newCreators = rooms;
        _isLoadingNew = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingNew = false;
        _newError = e.toString();
      });
    }
  }

  Future<void> _fetchPkFeed({bool refresh = false}) async {
    setState(() {
      _isLoadingPk = true;
      _pkError = null;
    });

    try {
      final rooms = await _repository.fetchPkBattles(refresh: refresh);
      if (!mounted) return;
      setState(() {
        _pkBattles = rooms;
        _isLoadingPk = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingPk = false;
        _pkError = e.toString();
      });
    }
  }

  void _onCountryFilterChanged(String code) {
    if (_selectedCountry == code) return;
    setState(() {
      _selectedCountry = code;
    });
    _fetchExploreFeed(refresh: true);
  }

  void _openRoomPreview(DiscoveryRoom room) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            RoomPreviewScreen(roomId: room.roomId, initialRoom: room),
      ),
    );
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
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
              actions: [
                // Search Icon
                PopoIconButton(
                  icon: Icons.search_rounded,
                  color: PopoTheme.cyan,
                  tooltip: PopoStrings.get('search_title'),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const SearchScreen()),
                    );
                  },
                ),

                // Trophy / Rankings Icon
                PopoIconButton(
                  icon: Icons.emoji_events_rounded,
                  color: PopoTheme.gold,
                  tooltip: PopoStrings.get('rankings_title'),
                  onPressed: () {
                    RankingsBottomSheet.show(context);
                  },
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
                      Tab(text: PopoStrings.get('tab_new')),
                      Tab(text: PopoStrings.get('tab_pk')),
                    ],
                  ),
                ),
              ),
            ),
            body: TabBarView(
              controller: _tabController,
              children: [
                // 1. Follow Tab
                _buildFollowingTab(),

                // 2. Explore Tab (Default)
                _buildExploreTab(),

                // 3. New Tab
                _buildNewTab(),

                // 4. PK Tab
                _buildPkTab(),
              ],
            ),
          ),
        );
      },
    );
  }

  // ==========================================
  // TAB 1: FOLLOW
  // ==========================================
  Widget _buildFollowingTab() {
    if (_isLoadingFollowing) {
      return const Center(
        child: PopoLoadingIndicator(color: PopoTheme.primary),
      );
    }

    if (_followingError != null) {
      return PopoErrorState(
        message: _followingError,
        onRetry: () => _fetchFollowingFeed(refresh: true),
      );
    }

    if (_followingRooms.isEmpty) {
      return RefreshIndicator(
        onRefresh: () => _fetchFollowingFeed(refresh: true),
        color: PopoTheme.primary,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.2),
            PopoEmptyState(
              title: 'No Followed Broadcasters Live',
              subtitle:
                  'Follow your favorite creators to see them appear here!',
              icon: Icons.favorite_border_rounded,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _fetchFollowingFeed(refresh: true),
      color: PopoTheme.primary,
      child: _buildRoomGrid(_followingRooms),
    );
  }

  // ==========================================
  // TAB 2: EXPLORE (DEFAULT)
  // ==========================================
  Widget _buildExploreTab() {
    return RefreshIndicator(
      onRefresh: () => _fetchExploreFeed(refresh: true),
      color: PopoTheme.primary,
      child: CustomScrollView(
        controller: _exploreScrollController,
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
          // 1. Hero Banners Carousel
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.only(top: 12),
              child: BannersCarousel(),
            ),
          ),

          // 2. Horizontally Scrollable Country Filter Chips
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: CountryChips(
                selectedCountryCode: _selectedCountry,
                onCountrySelected: _onCountryFilterChanged,
              ),
            ),
          ),

          // 3. Live Room Feed Grid or Empty/Loading State
          if (_isLoadingExplore)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: PopoLoadingIndicator(color: PopoTheme.primary),
              ),
            )
          else if (_exploreError != null)
            SliverFillRemaining(
              hasScrollBody: false,
              child: PopoErrorState(
                message: _exploreError,
                onRetry: () => _fetchExploreFeed(refresh: true),
              ),
            )
          else if (_exploreRooms.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: PopoEmptyState(
                title: PopoStrings.get('no_live_rooms'),
                subtitle: 'Check back soon or select another region filter.',
                icon: Icons.live_tv_rounded,
              ),
            )
          else ...[
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 3 / 4,
                ),
                delegate: SliverChildBuilderDelegate((context, index) {
                  final room = _exploreRooms[index];
                  return RoomCard(
                    room: room,
                    onTap: () => _openRoomPreview(room),
                  );
                }, childCount: _exploreRooms.length),
              ),
            ),

            // Pagination Loading Indicator
            if (_isLoadingMoreExplore)
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Center(
                    child: PopoLoadingIndicator(
                      size: 24,
                      color: PopoTheme.primary,
                    ),
                  ),
                ),
              ),
          ],

          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 3: NEW CREATORS
  // ==========================================
  Widget _buildNewTab() {
    if (_isLoadingNew) {
      return const Center(child: PopoLoadingIndicator(color: PopoTheme.cyan));
    }

    if (_newError != null) {
      return PopoErrorState(
        message: _newError,
        onRetry: () => _fetchNewFeed(refresh: true),
      );
    }

    if (_newCreators.isEmpty) {
      return RefreshIndicator(
        onRefresh: () => _fetchNewFeed(refresh: true),
        color: PopoTheme.cyan,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.2),
            PopoEmptyState(
              title: 'No New Broadcasters',
              subtitle: 'Newly registered streamers will be featured here.',
              icon: Icons.person_add_alt_1_rounded,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _fetchNewFeed(refresh: true),
      color: PopoTheme.cyan,
      child: _buildRoomGrid(_newCreators),
    );
  }

  // ==========================================
  // TAB 4: PK ARENA
  // ==========================================
  Widget _buildPkTab() {
    if (_isLoadingPk) {
      return const Center(
        child: PopoLoadingIndicator(color: Color(0xFF8B5CF6)),
      );
    }

    if (_pkError != null) {
      return PopoErrorState(
        message: _pkError,
        onRetry: () => _fetchPkFeed(refresh: true),
      );
    }

    if (_pkBattles.isEmpty) {
      return RefreshIndicator(
        onRefresh: () => _fetchPkFeed(refresh: true),
        color: const Color(0xFF8B5CF6),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.2),
            PopoEmptyState(
              title: 'No Active PK Battles',
              subtitle: 'Live competitive battles will appear here.',
              icon: Icons.sports_mma_rounded,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _fetchPkFeed(refresh: true),
      color: const Color(0xFF8B5CF6),
      child: _buildRoomGrid(_pkBattles),
    );
  }

  Widget _buildRoomGrid(List<DiscoveryRoom> rooms) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 3 / 4,
      ),
      itemCount: rooms.length,
      itemBuilder: (context, index) {
        final room = rooms[index];
        return RoomCard(room: room, onTap: () => _openRoomPreview(room));
      },
    );
  }
}
