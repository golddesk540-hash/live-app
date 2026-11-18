import 'dart:async';

import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../models/models.dart';
import '../../repositories/discovery_repository.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_empty_state.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_icon_button.dart';
import '../profile/public_profile_screen.dart';
import 'room_preview_screen.dart';
import 'room_card.dart';

/// Full Search Screen supporting Host ID, Username, and Room Tags
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final DiscoveryRepository _repository = DiscoveryRepository.instance;
  Timer? _debounceTimer;

  String _currentQuery = '';
  String _selectedType = 'all'; // 'all', 'users', 'rooms'
  bool _isLoading = false;
  String? _errorMessage;

  List<SearchUser> _users = [];
  List<DiscoveryRoom> _rooms = [];

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onQueryChanged(String query) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 350), () {
      final trimmed = query.trim();
      if (trimmed == _currentQuery) return;
      setState(() {
        _currentQuery = trimmed;
      });
      _performSearch();
    });
  }

  Future<void> _performSearch() async {
    if (_currentQuery.isEmpty) {
      setState(() {
        _users = [];
        _rooms = [];
        _isLoading = false;
        _errorMessage = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _repository.search(
        _currentQuery,
        type: _selectedType,
        limit: 20,
      );

      if (!mounted) return;

      setState(() {
        _users = result.users;
        _rooms = result.rooms;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() {
      _currentQuery = '';
      _users = [];
      _rooms = [];
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        leading: PopoIconButton(
          icon: Icons.arrow_back_rounded,
          onPressed: () => Navigator.of(context).pop(),
        ),
        titleSpacing: 0,
        title: Padding(
          padding: const EdgeInsets.only(right: 16),
          child: Container(
            height: 42,
            decoration: BoxDecoration(
              color: PopoTheme.surfaceLight,
              borderRadius: BorderRadius.circular(21),
              border: Border.all(color: PopoTheme.borderSubtle),
            ),
            child: TextField(
              controller: _searchController,
              autofocus: true,
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 13,
              ),
              decoration: InputDecoration(
                hintText: PopoStrings.get('search_hint'),
                hintStyle: const TextStyle(
                  color: PopoTheme.textTertiary,
                  fontSize: 12,
                ),
                prefixIcon: const Icon(
                  Icons.search_rounded,
                  color: PopoTheme.cyan,
                  size: 20,
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(
                          Icons.clear_rounded,
                          size: 18,
                          color: PopoTheme.textSecondary,
                        ),
                        onPressed: _clearSearch,
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 11),
              ),
              onChanged: (val) {
                setState(() {});
                _onQueryChanged(val);
              },
            ),
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(44),
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            decoration: const BoxDecoration(
              color: PopoTheme.surface,
              border: Border(
                bottom: BorderSide(color: PopoTheme.borderSubtle, width: 0.5),
              ),
            ),
            child: Row(
              children: [
                _buildFilterChip('all', 'All'),
                const SizedBox(width: 8),
                _buildFilterChip('users', PopoStrings.get('search_users')),
                const SizedBox(width: 8),
                _buildFilterChip('rooms', PopoStrings.get('search_rooms')),
              ],
            ),
          ),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildFilterChip(String type, String label) {
    final isSelected = _selectedType == type;
    return GestureDetector(
      onTap: () {
        if (_selectedType == type) return;
        setState(() {
          _selectedType = type;
        });
        _performSearch();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? PopoTheme.primary.withOpacity(0.18)
              : PopoTheme.surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? PopoTheme.primary : PopoTheme.borderSubtle,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? PopoTheme.primary : PopoTheme.textSecondary,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: PopoLoadingIndicator(color: PopoTheme.cyan));
    }

    if (_errorMessage != null) {
      return PopoErrorState(message: _errorMessage, onRetry: _performSearch);
    }

    if (_currentQuery.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_rounded,
              size: 56,
              color: PopoTheme.cyan.withOpacity(0.3),
            ),
            const SizedBox(height: 12),
            Text(
              PopoStrings.get('search_hint'),
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
        ),
      );
    }

    final hasUsers = _users.isNotEmpty;
    final hasRooms = _rooms.isNotEmpty;

    if (!hasUsers && !hasRooms) {
      return PopoEmptyState(
        title: PopoStrings.get('no_results_found'),
        subtitle: 'No hosts or live streams matched "$_currentQuery"',
        icon: Icons.search_off_rounded,
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(vertical: 16),
      children: [
        // Users Section
        if (hasUsers &&
            (_selectedType == 'all' || _selectedType == 'users')) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Text(
              PopoStrings.get('search_users'),
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ..._users.map((u) => _buildUserRow(u)),
          const SizedBox(height: 16),
        ],

        // Rooms Section
        if (hasRooms &&
            (_selectedType == 'all' || _selectedType == 'rooms')) ...[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Text(
              PopoStrings.get('search_rooms'),
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 3 / 4,
              ),
              itemCount: _rooms.length,
              itemBuilder: (context, index) {
                final room = _rooms[index];
                return RoomCard(
                  room: room,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => RoomPreviewScreen(
                          roomId: room.roomId,
                          initialRoom: room,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildUserRow(SearchUser user) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: PopoTheme.surfaceLight,
            backgroundImage:
                user.avatarUrl.isNotEmpty &&
                    !user.avatarUrl.contains('default.png') &&
                    user.avatarUrl.startsWith('http')
                ? NetworkImage(user.avatarUrl)
                : null,
            child:
                (user.avatarUrl.isEmpty ||
                    user.avatarUrl.contains('default.png') ||
                    !user.avatarUrl.startsWith('http'))
                ? Text(
                    user.nickname.isNotEmpty
                        ? user.nickname[0].toUpperCase()
                        : 'P',
                    style: const TextStyle(
                      color: PopoTheme.cyan,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
          ),
          if (user.isLive)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: PopoTheme.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: PopoTheme.background, width: 1.5),
                ),
              ),
            ),
        ],
      ),
      title: Row(
        children: [
          Flexible(
            child: Text(
              user.nickname,
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: PopoTheme.gold.withOpacity(0.18),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              'Lv.${user.hostLevel}',
              style: const TextStyle(
                color: PopoTheme.gold,
                fontSize: 9,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      subtitle: Text(
        'ID: ${user.poppoId}',
        style: const TextStyle(color: PopoTheme.textSecondary, fontSize: 11),
      ),
      trailing: user.isLive && user.liveRoomId != null
          ? ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => RoomPreviewScreen(roomId: user.liveRoomId!),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: PopoTheme.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
              ),
              child: const Text(
                'WATCH',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
              ),
            )
          : null,
      onTap: () {
        final userId = user.id.isNotEmpty ? user.id : user.poppoId;
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => PublicProfileScreen(userId: userId),
          ),
        );
      },
    );
  }
}
