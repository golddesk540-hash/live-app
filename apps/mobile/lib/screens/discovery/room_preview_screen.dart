import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../models/models.dart';
import '../../repositories/discovery_repository.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_primary_button.dart';
import '../../widgets/popo_icon_button.dart';
import '../../widgets/popo_card.dart';

/// Room Preview Screen (Sprint 1: M2 Room Metadata Preview)
/// Displays host, room tags, audience count, and PK details.
/// Video playback activates in Sprint 2 (M3).
class RoomPreviewScreen extends StatefulWidget {
  final String roomId;
  final DiscoveryRoom? initialRoom;

  const RoomPreviewScreen({Key? key, required this.roomId, this.initialRoom})
    : super(key: key);

  factory RoomPreviewScreen.fromMap({
    Key? key,
    required String roomId,
    Map<String, dynamic>? initialRoomData,
  }) {
    return RoomPreviewScreen(
      key: key,
      roomId: roomId,
      initialRoom: initialRoomData != null
          ? DiscoveryRoom.fromJson(initialRoomData)
          : null,
    );
  }

  @override
  State<RoomPreviewScreen> createState() => _RoomPreviewScreenState();
}

class _RoomPreviewScreenState extends State<RoomPreviewScreen> {
  final DiscoveryRepository _repository = DiscoveryRepository.instance;
  DiscoveryRoom? _room;
  bool _isLoading = true;
  String? _errorMessage;
  bool _isFollowing = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialRoom != null) {
      _room = widget.initialRoom;
      _isFollowing = _room!.isFollowing;
      _isLoading = false;
    }
    _fetchRoomDetails();
  }

  Future<void> _fetchRoomDetails() async {
    final room = await _repository.fetchRoomDetails(widget.roomId);
    if (!mounted) return;

    if (room != null) {
      setState(() {
        _room = room;
        _isFollowing = room.isFollowing;
        _isLoading = false;
      });
      return;
    }

    if (_room == null) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Live room is currently offline or unavailable.';
      });
    }
  }

  void _handleFollowToggle() {
    setState(() {
      _isFollowing = !_isFollowing;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_isFollowing ? 'Followed broadcaster!' : 'Unfollowed'),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      body: _isLoading
          ? const Center(child: PopoLoadingIndicator(color: PopoTheme.primary))
          : _errorMessage != null && _room == null
          ? _buildErrorView()
          : _buildContentView(),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline_rounded,
              size: 48,
              color: PopoTheme.danger,
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'Room unavailable',
              textAlign: TextAlign.center,
              style: const TextStyle(color: PopoTheme.textSecondary),
            ),
            const SizedBox(height: 24),
            PopoPrimaryButton(
              text: 'Go Back',
              onPressed: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentView() {
    final room = _room!;
    final host = room.host;
    final pkBattle = room.pkBattle;

    return Stack(
      children: [
        // 1. Background Cover with Dark Overlay
        Positioned.fill(
          child: room.coverUrl.isNotEmpty
              ? Image.network(
                  room.coverUrl.startsWith('http')
                      ? room.coverUrl
                      : 'https://kigolive.com${room.coverUrl}',
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _buildFallbackCover(),
                )
              : _buildFallbackCover(),
        ),

        Positioned.fill(
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.black.withOpacity(0.65),
                  Colors.black.withOpacity(0.4),
                  Colors.black.withOpacity(0.92),
                ],
                stops: const [0.0, 0.4, 1.0],
              ),
            ),
          ),
        ),

        // 2. Main Content
        SafeArea(
          child: Column(
            children: [
              // Header Controls (Close & Room ID)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    PopoIconButton(
                      icon: Icons.close_rounded,
                      onPressed: () => Navigator.of(context).pop(),
                      backgroundColor: Colors.black45,
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Room #${room.roomNumber}',
                          style: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: PopoTheme.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              PopoStrings.get('live_now'),
                              style: const TextStyle(
                                color: PopoTheme.primary,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: PopoTheme.borderSubtle),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.remove_red_eye_rounded,
                            size: 13,
                            color: Colors.white70,
                          ),
                          const SizedBox(width: 5),
                          Text(
                            '${room.viewersFormatted} ${PopoStrings.get('viewers')}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // Sprint 2 Live Video Roadmap Notice Banner
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 20),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: PopoTheme.surface.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: PopoTheme.cyan.withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.info_outline_rounded,
                      color: PopoTheme.cyan,
                      size: 20,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        PopoStrings.get('room_preview_note'),
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 11,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Host & Room Information Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: PopoCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Host Row
                      Row(
                        children: [
                          _buildAvatar(host.avatarUrl, host.nickname),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        host.nickname,
                                        style: const TextStyle(
                                          color: PopoTheme.textPrimary,
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    if (room.flagEmoji.isNotEmpty) ...[
                                      const SizedBox(width: 6),
                                      Text(
                                        room.flagEmoji,
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  'ID: ${host.poppoId}',
                                  style: const TextStyle(
                                    color: PopoTheme.textSecondary,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Follow Button
                          ElevatedButton(
                            onPressed: _handleFollowToggle,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _isFollowing
                                  ? PopoTheme.surface
                                  : PopoTheme.primary,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                                side: BorderSide(
                                  color: _isFollowing
                                      ? PopoTheme.borderSubtle
                                      : PopoTheme.primary,
                                ),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                            ),
                            child: Text(
                              _isFollowing ? 'Following' : '+ Follow',
                              style: TextStyle(
                                color: _isFollowing
                                    ? PopoTheme.textSecondary
                                    : Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),
                      const Divider(color: PopoTheme.borderSubtle, height: 1),
                      const SizedBox(height: 12),

                      // Room Title
                      Text(
                        room.title,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),

                      const SizedBox(height: 10),

                      // Badges Row (Host Lv, Wealth Lv, Country, Coins)
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          _buildBadge(
                            'Host Lv.${host.hostLevel}',
                            const Color(0xFFF59E0B),
                          ),
                          _buildBadge(
                            'Wealth Lv.${host.wealthLevel}',
                            PopoTheme.primary,
                          ),
                          if (room.country.isNotEmpty)
                            _buildBadge(room.country, PopoTheme.cyan),
                          _buildBadge(
                            '🪙 ${room.coinsFormatted} Coins',
                            const Color(0xFFFFD700),
                          ),
                          if (room.isPk)
                            _buildBadge(
                              '⚔️ PK Active',
                              const Color(0xFF8B5CF6),
                            ),
                        ],
                      ),

                      // PK Opponent Preview (if PK active)
                      if (pkBattle != null && pkBattle.opponent != null) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.black38,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: const Color(0xFF8B5CF6).withOpacity(0.4),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Text(
                                '⚔️ VS',
                                style: TextStyle(
                                  color: Color(0xFFEC4899),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  'Opponent: ${pkBattle.opponent!.nickname}',
                                  style: const TextStyle(
                                    color: PopoTheme.textPrimary,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAvatar(String? avatarUrl, String nickname) {
    final initials = nickname.isNotEmpty ? nickname[0].toUpperCase() : 'P';
    if (avatarUrl != null &&
        avatarUrl.isNotEmpty &&
        !avatarUrl.contains('default.png') &&
        avatarUrl.startsWith('http')) {
      return CircleAvatar(radius: 22, backgroundImage: NetworkImage(avatarUrl));
    }
    return CircleAvatar(
      radius: 22,
      backgroundColor: PopoTheme.primary.withOpacity(0.3),
      child: Text(
        initials,
        style: const TextStyle(
          color: PopoTheme.primary,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildFallbackCover() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2E1035), Color(0xFF0D0D12)],
        ),
      ),
    );
  }
}
