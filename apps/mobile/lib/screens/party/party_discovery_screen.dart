import 'package:flutter/material.dart';

import '../../api/api.dart';
import '../../l10n/strings.dart';
import '../../models/party/party_models.dart';
import '../../theme/theme.dart';
import '../../widgets/widgets.dart';
import 'create_party_screen.dart';
import 'party_room_screen.dart';

/// 9-Seat Party Room Discovery Screen (Tab 1 of App Shell)
/// Connects to verified Next.js backend endpoints:
/// - GET /api/discovery/party
/// - GET /api/party/categories
class PartyDiscoveryScreen extends StatefulWidget {
  const PartyDiscoveryScreen({super.key});

  @override
  State<PartyDiscoveryScreen> createState() => _PartyDiscoveryScreenState();
}

class _PartyDiscoveryScreenState extends State<PartyDiscoveryScreen> {
  final PartyApiService _apiService = PartyApiService();

  List<PartyCategory> _categories = [];
  String _selectedCategoryId = 'all';

  List<PartyRoom> _rooms = [];
  bool _isLoading = true;
  String? _errorMessage;

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    await Future.wait([_fetchCategories(), _fetchRooms()]);
  }

  Future<void> _fetchCategories() async {
    try {
      final res = await _apiService.getCategories();
      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final rawCats = data['categories'] as List<dynamic>? ?? [];
        if (mounted) {
          setState(() {
            _categories = rawCats
                .whereType<Map<String, dynamic>>()
                .map((c) => PartyCategory.fromJson(c))
                .toList();
          });
        }
      }
    } catch (e) {
      debugPrint('[PartyDiscoveryScreen] Error loading categories: $e');
    }
  }

  Future<void> _fetchRooms() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final categoryParam = _selectedCategoryId == 'all'
          ? null
          : _selectedCategoryId;
      final searchParam = _searchController.text.trim().isEmpty
          ? null
          : _searchController.text.trim();

      final res = await _apiService.getPartyRooms(
        category: categoryParam,
        search: searchParam,
      );

      if (!mounted) return;

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final rawRooms = data['rooms'] as List<dynamic>? ?? [];
        setState(() {
          _rooms = rawRooms
              .whereType<Map<String, dynamic>>()
              .map((r) => PartyRoom.fromJson(r))
              .toList();
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage =
              res.errorMessage ?? Strings.get(context, 'error_unknown');
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Error loading party rooms: $e';
        _isLoading = false;
      });
    }
  }

  void _onCategorySelected(String categoryId) {
    if (_selectedCategoryId == categoryId) return;
    setState(() {
      _selectedCategoryId = categoryId;
    });
    _fetchRooms();
  }

  void _navigateToCreateRoom() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CreatePartyScreen(
          categories: _categories,
          onRoomCreated: (PartyRoom newRoom) {
            _fetchRooms();
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PartyRoomScreen(
                  roomId: newRoom.roomNumber.isNotEmpty
                      ? newRoom.roomNumber
                      : newRoom.id,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _navigateToRoom(PartyRoom room) {
    final roomId = room.roomNumber.isNotEmpty ? room.roomNumber : room.id;
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => PartyRoomScreen(roomId: roomId)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadInitialData,
          color: PopoTheme.primary,
          backgroundColor: PopoTheme.surface,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // Top Bar with Title, Language Switcher & Create Button
              SliverToBoxAdapter(child: _buildHeader()),

              // Category Filter Chips
              SliverToBoxAdapter(child: _buildCategoryBar()),

              // Room Grid or Loading / Error / Empty states
              _buildContentSliver(),

              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: PopoTheme.primary.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.celebration_rounded,
                  color: PopoTheme.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                Strings.get(context, 'party_discovery_title'),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
          Row(
            children: [
              // Language Switcher
              IconButton(
                icon: const Icon(
                  Icons.translate_rounded,
                  color: PopoTheme.cyan,
                  size: 20,
                ),
                tooltip: 'Switch Language',
                onPressed: PopoStrings.toggleLanguage,
              ),
              const SizedBox(width: 4),

              // Create Party Room Button
              InkWell(
                onTap: _navigateToCreateRoom,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    gradient: PopoTheme.primaryGradient,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: PopoTheme.primary.withOpacity(0.35),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.add_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        Strings.get(context, 'create_party_room'),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryBar() {
    return Container(
      height: 44,
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _buildCategoryChip(id: 'all', label: 'All', icon: '🎉'),
          ..._categories.map((cat) {
            return _buildCategoryChip(
              id: cat.id,
              label: cat.name,
              icon: cat.icon ?? '✨',
            );
          }),
        ],
      ),
    );
  }

  Widget _buildCategoryChip({
    required String id,
    required String label,
    required String icon,
  }) {
    final isSelected = _selectedCategoryId == id;

    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(icon, style: const TextStyle(fontSize: 13)),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : PopoTheme.textSecondary,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              ),
            ),
          ],
        ),
        selected: isSelected,
        selectedColor: PopoTheme.primary,
        backgroundColor: PopoTheme.surface,
        showCheckmark: false,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(
            color: isSelected ? PopoTheme.primary : PopoTheme.borderSubtle,
            width: 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        onSelected: (_) => _onCategorySelected(id),
      ),
    );
  }

  Widget _buildContentSliver() {
    if (_isLoading) {
      return const SliverFillRemaining(
        child: Center(
          child: PopoLoadingIndicator(color: PopoTheme.primary, size: 40),
        ),
      );
    }

    if (_errorMessage != null) {
      return SliverFillRemaining(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: PopoErrorState(
              message: _errorMessage!,
              onRetry: _fetchRooms,
            ),
          ),
        ),
      );
    }

    if (_rooms.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: PopoEmptyState(
              icon: Icons.celebration_outlined,
              iconColor: PopoTheme.cyan,
              title: Strings.get(context, 'no_party_rooms'),
              message:
                  'Be the first host to start a 9-seat party in this category!',
            ),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.82,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => _buildRoomCard(_rooms[index]),
          childCount: _rooms.length,
        ),
      ),
    );
  }

  Widget _buildRoomCard(PartyRoom room) {
    return InkWell(
      onTap: () => _navigateToRoom(room),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: PopoTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: PopoTheme.borderSubtle, width: 1),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Artwork Area with Status Pills
            Expanded(
              flex: 5,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Fallback Gradient / Artwork
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [const Color(0xFF2B1F4A), PopoTheme.surface],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Center(
                      child: Icon(
                        Icons.group_work_rounded,
                        color: PopoTheme.primary.withOpacity(0.4),
                        size: 48,
                      ),
                    ),
                  ),

                  // Top Overlay Badges
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: PopoTheme.primary,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.fiber_manual_record_rounded,
                            color: Colors.white,
                            size: 8,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'LIVE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // 9-Seats Pill
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.65),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: PopoTheme.cyan.withOpacity(0.6),
                          width: 0.8,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.weekend_rounded,
                            color: PopoTheme.cyan,
                            size: 10,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            room.seatCountFormatted,
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
                ],
              ),
            ),

            // Bottom Information Area
            Expanded(
              flex: 4,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Title
                    Text(
                      room.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    // Category & Room Type tag
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 5,
                            vertical: 1.5,
                          ),
                          decoration: BoxDecoration(
                            color: PopoTheme.primary.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            room.category,
                            style: const TextStyle(
                              color: PopoTheme.primary,
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        if (room.isPrivate) ...[
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.lock_rounded,
                            color: PopoTheme.gold,
                            size: 10,
                          ),
                        ],
                      ],
                    ),

                    // Host Row
                    Row(
                      children: [
                        Container(
                          width: 18,
                          height: 18,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFF33334D),
                          ),
                          child: const Icon(
                            Icons.person_rounded,
                            color: Colors.white70,
                            size: 12,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            room.hostNickname,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: PopoTheme.textSecondary,
                              fontSize: 11,
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
}
