import 'package:flutter/material.dart';

import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';
import '../../widgets/popo_card.dart';
import '../../widgets/popo_empty_state.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_icon_button.dart';

/// Popo Live — Section 6 (R4) Broadcast Watch History Screen
/// Displays a real list of fixture live rooms attended by the user,
/// with room title, host nickname, country, viewer count, category,
/// and elapsed time information. Supports filled, empty and error fixture states.
class WatchHistoryScreen extends StatefulWidget {
  const WatchHistoryScreen({super.key});

  @override
  State<WatchHistoryScreen> createState() => _WatchHistoryScreenState();
}

class _WatchHistoryScreenState extends State<WatchHistoryScreen> {
  List<FixtureLiveRoom> _rooms = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  void _loadHistory() {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Watch history sync failed: Server busy [ERR_HISTORY_503]',
        );
      }
      final rooms = DesignFixtures.liveRooms;
      setState(() {
        _rooms = rooms;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '')
            .replaceFirst('DesignFixtureException: ', '');
        _isLoading = false;
      });
    }
  }

  String _formatViewers(int count) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}k';
    }
    return count.toString();
  }

  @override
  Widget build(BuildContext context) {
    // 1. Error state
    if (DesignFixtures.isError || _errorMessage != null) {
      return Scaffold(
      key: const Key('me_watch_history_destination'),
        backgroundColor: PopoTheme.background,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: PopoIconButton(
            icon: Icons.arrow_back_ios_new_rounded,
            iconSize: 18,
            tooltip: 'Back',
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          title: const Text(
            'Watch History',
            style: TextStyle(
              color: PopoTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        body: Center(
          child: PopoErrorState(
            key: const Key('watch_history_error_state'),
            title: 'Failed to load history',
            message: _errorMessage ?? 'Server busy [ERR_HISTORY_503]',
            retryText: 'Retry',
            onRetry: _loadHistory,
          ),
        ),
      );
    }

    // 2. Empty state
    if (DesignFixtures.isEmpty || (_rooms.isEmpty && !_isLoading)) {
      return Scaffold(
      key: const Key('me_watch_history_destination'),
        backgroundColor: PopoTheme.background,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: PopoIconButton(
            icon: Icons.arrow_back_ios_new_rounded,
            iconSize: 18,
            tooltip: 'Back',
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          title: const Text(
            'Watch History',
            style: TextStyle(
              color: PopoTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        body: Center(
          child: PopoEmptyState(
            key: const Key('watch_history_empty_state'),
            icon: Icons.history_rounded,
            title: 'No Watch History',
            message:
                'You have not attended any live broadcast rooms or audio party lounges yet.',
            actionText: 'Refresh',
            onActionTap: _loadHistory,
          ),
        ),
      );
    }

    // 3. Normal filled state
    return Scaffold(
      key: const Key('me_watch_history_destination'),
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: PopoIconButton(
          icon: Icons.arrow_back_ios_new_rounded,
          iconSize: 18,
          tooltip: 'Back',
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: const Text(
          'Broadcast Watch History',
          key: Key('watch_history_title'),
          style: TextStyle(
            color: PopoTheme.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: PopoTheme.cyan),
            onPressed: _loadHistory,
          ),
          IconButton(
            icon: const Icon(Icons.close_rounded, color: PopoTheme.textSecondary),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: PopoTheme.primary),
            )
          : RefreshIndicator(
              onRefresh: () async => _loadHistory(),
              color: PopoTheme.primary,
              backgroundColor: PopoTheme.surface,
              child: ListView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF28114E), Color(0xFF15082C)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFFBA68C8).withOpacity(0.35),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFBA68C8).withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.history_toggle_off_rounded,
                            color: Color(0xFFBA68C8),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Recent Live Broadcasts',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Showing all attended video streaming rooms & party sessions',
                                style: TextStyle(
                                  color: Color(0xFFD8B4FE),
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Attended Rooms (${_rooms.length})',
                    style: const TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ..._rooms.map((room) => _buildRoomHistoryCard(room)),
                ],
              ),
            ),
    );
  }

  Widget _buildRoomHistoryCard(FixtureLiveRoom room) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: PopoCard(
        padding: const EdgeInsets.all(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Selected room: ${room.title} (Host: ${room.hostNickname})',
                ),
                backgroundColor: const Color(0xFF1F0E3D),
                duration: const Duration(seconds: 2),
              ),
            );
          },
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Room Cover with Live Tag
              Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      room.coverUrl,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 80,
                        height: 80,
                        color: const Color(0xFF28124D),
                        child: const Icon(
                          Icons.tv_rounded,
                          color: Colors.white38,
                          size: 32,
                        ),
                      ),
                    ),
                  ),
                  Container(
                    margin: const EdgeInsets.only(bottom: 4),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: room.isPkActive
                          ? const Color(0xFFFF1A6C)
                          : const Color(0xCC000000),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (room.isPkActive) ...[
                          const Icon(
                            Icons.local_fire_department_rounded,
                            color: Colors.white,
                            size: 9,
                          ),
                          const SizedBox(width: 2),
                          const Text(
                            'PK',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ] else ...[
                          const Icon(
                            Icons.visibility,
                            color: Colors.white70,
                            size: 9,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            _formatViewers(room.viewerCount),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),

              // Room Information
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      room.title,
                      key: Key('history_room_title_${room.id}'),
                      style: const TextStyle(
                        color: PopoTheme.textPrimary,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 9,
                          backgroundImage: room.hostAvatar.isNotEmpty
                              ? NetworkImage(room.hostAvatar)
                              : null,
                          backgroundColor: const Color(0xFF38155C),
                          child: room.hostAvatar.isEmpty
                              ? const Icon(Icons.person,
                                  size: 10, color: Colors.white)
                              : null,
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            room.hostNickname,
                            style: const TextStyle(
                              color: Color(0xFFD8B4FE),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          room.country,
                          style: const TextStyle(fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0x2200E5FF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: const Color(0x4400E5FF),
                            ),
                          ),
                          child: Text(
                            room.category,
                            style: const TextStyle(
                              color: Color(0xFF00E5FF),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          Icons.access_time_rounded,
                          size: 11,
                          color: PopoTheme.textSecondary,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          'Watched recently',
                          style: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 10.5,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: PopoTheme.textSecondary,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
