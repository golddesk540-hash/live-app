import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_empty_state.dart';
import '../pk/pk_battle_type_screen.dart';

/// Professional Live Room Viewer Screen for Audience Experience
/// Built for Phase 3 (D2) Prompt 2 according to Popo Live Product Design v1.1.
/// Features:
/// - Dynamic room resolution from DesignFixtures (not hardcoded)
/// - Comprehensive live header with host avatar, name, Lv.10 pill, ID, toggleable Follow,
///   viewer count pill, and close button
/// - Full-screen video canvas display with category and room title pill
/// - Rich live chat overlay loaded from fixture messages with functional composer
/// - Modal Gift Sheet with fixture gifts, real-time coin deduction, and insufficient funds protection
/// - Viewers / Top Contributors bottom sheet with rank badges and coin counts
class ViewerRoomScreen extends StatefulWidget {
  final String roomId;
  final String? initialTitle;
  final String? initialHostNickname;
  final String? initialCoverUrl;

  const ViewerRoomScreen({
    super.key,
    required this.roomId,
    this.initialTitle,
    this.initialHostNickname,
    this.initialCoverUrl,
  });

  @override
  State<ViewerRoomScreen> createState() => _ViewerRoomScreenState();
}

class _ViewerRoomScreenState extends State<ViewerRoomScreen>
    with SingleTickerProviderStateMixin {
  late FixtureLiveRoom _room;
  late List<FixtureLiveChatMessage> _chatMessages;
  late List<FixtureUserProfile> _topContributors;

  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();

  bool _isFollowing = false;
  bool _isAudioMuted = false;
  bool _isError = false;
  bool _isEmpty = false;

  Timer? _durationTimer;
  int _elapsedSeconds = 0;

  // Floating gift animation banner state
  FixtureGift? _activeFloatingGift;
  int _activeFloatingGiftQty = 1;
  Timer? _floatingGiftTimer;

  @override
  void initState() {
    super.initState();
    _initializeRoomData();

    // Elapsed live watch timer (disabled in automated flutter test environment)
    if (!Platform.environment.containsKey('FLUTTER_TEST')) {
      _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) {
          setState(() => _elapsedSeconds++);
        }
      });
    }
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    _floatingGiftTimer?.cancel();
    _chatController.dispose();
    _chatScrollController.dispose();
    super.dispose();
  }

  void _initializeRoomData() {
    if (DesignFixtures.isError) {
      _isError = true;
      return;
    }
    if (DesignFixtures.isEmpty) {
      _isEmpty = true;
      return;
    }

    // Dynamic room resolution from D0 fixtures
    FixtureLiveRoom matchedRoom;
    try {
      final rooms = DesignFixtures.liveRooms;
      matchedRoom = rooms.firstWhere(
        (r) => r.id == widget.roomId,
        orElse: () => rooms.first,
      );
    } catch (_) {
      matchedRoom = FixtureLiveRoom(
        id: widget.roomId,
        roomNumber: '883901',
        title: widget.initialTitle ?? 'Karachi Nights 🎶 Acoustic Live Session',
        hostNickname: widget.initialHostNickname ?? 'Amina Noor',
        hostAvatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
        coverUrl: widget.initialCoverUrl ??
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
        category: 'Singing',
        country: 'Pakistan',
        countryCode: 'PK',
        flagEmoji: '🇵🇰',
        viewerCount: 1420,
        heatScore: 98000,
        isLive: true,
        isPkActive: false,
        tags: const ['Music', 'Acoustic'],
      );
    }
    _room = matchedRoom;

    // Load recent chat messages from fixture
    try {
      _chatMessages = List.from(DesignFixtures.liveViewer.recentChatMessages);
    } catch (_) {
      _chatMessages = [];
    }

    // Load top contributors from fixture
    try {
      _topContributors = List.from(DesignFixtures.liveViewer.topContributors);
    } catch (_) {
      _topContributors = [];
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_chatScrollController.hasClients) {
        _chatScrollController.animateTo(
          _chatScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _toggleFollow() {
    setState(() => _isFollowing = !_isFollowing);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isFollowing
              ? 'Following ${_room.hostNickname}! ❤️'
              : 'Unfollowed ${_room.hostNickname}',
        ),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(milliseconds: 1200),
      ),
    );
  }

  void _toggleAudioMute() {
    setState(() => _isAudioMuted = !_isAudioMuted);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isAudioMuted ? 'Host audio muted 🔇' : 'Host audio playing 🔊',
        ),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(milliseconds: 900),
      ),
    );
  }

  void _handleSendChatMessage() {
    final text = _chatController.text.trim();
    if (text.isEmpty) return;

    final user = DesignFixtures.currentUserProfile;
    final newMsg = FixtureLiveChatMessage(
      id: 'lmsg_${DateTime.now().millisecondsSinceEpoch}',
      senderNickname: user.nickname,
      senderAvatar: user.avatarUrl,
      senderLevel: user.wealthLevel,
      isVip: user.vipLevel > 0,
      content: text,
      timestamp: 'Just now',
    );

    setState(() {
      _chatMessages.add(newMsg);
    });
    _chatController.clear();
    _scrollToBottom();
  }

  void _insertEmoji(String emoji) {
    _chatController.text = '${_chatController.text}$emoji';
    _chatController.selection = TextSelection.fromPosition(
      TextPosition(offset: _chatController.text.length),
    );
  }

  void _showViewersSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _buildViewersSheet(ctx),
    );
  }

  void _openPkFlow() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PkBattleTypeScreen(room: _room),
      ),
    );
  }

  void _showGiftSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (sheetCtx) => _buildGiftSheet(sheetCtx),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    }
    if (number >= 1000) {
      return number.toString().replaceAllMapped(
            RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
            (Match m) => '${m[1]},',
          );
    }
    return number.toString();
  }

  String get _formattedDuration {
    final minutes = _elapsedSeconds ~/ 60;
    final seconds = _elapsedSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_isError) {
      const err = DesignFixtures.liveRoomsError;
      return Scaffold(
        backgroundColor: PopoTheme.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: PopoErrorState(
              title: err.title,
              message: err.message,
              retryText: err.actionLabel,
              onRetry: () {
                setState(() {
                  _isError = false;
                  _initializeRoomData();
                });
              },
            ),
          ),
        ),
      );
    }

    if (_isEmpty) {
      const emp = DesignFixtures.liveRoomsEmpty;
      return Scaffold(
        backgroundColor: PopoTheme.background,
        body: Center(
          child: PopoEmptyState(
            title: emp.title,
            subtitle: emp.message,
            icon: Icons.live_tv_rounded,
            actionText: 'Return to Explore',
            onActionTap: () => Navigator.pop(context),
          ),
        ),
      );
    }

    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor: PopoTheme.background,
        resizeToAvoidBottomInset: true,
        body: Stack(
          children: [
            // 1. Full-Screen Video Background Canvas
            Positioned.fill(child: _buildVideoCanvas()),

            // 2. Top Vignette Gradient
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 200,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withOpacity(0.85),
                      Colors.black.withOpacity(0.0),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ),

            // 3. Bottom Vignette Gradient
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              height: 380,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withOpacity(0.0),
                      Colors.black.withOpacity(0.92),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ),

            // 4. Room Title & Stream Status Pill (Positioned below header)
            Positioned(
              left: 14,
              top: 104,
              child: _buildRoomDetailsPill(),
            ),

            // 5. Floating Gift Animation Banner Overlay
            if (_activeFloatingGift != null)
              Positioned(
                top: 160,
                left: 16,
                right: 16,
                child: _buildFloatingGiftBanner(),
              ),

            // 6. Live Chat Stream & Action Overlay
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: SafeArea(
                top: false,
                child: _buildLiveChatOverlay(),
              ),
            ),

            // 7. Live Viewer Header (Placed on top of all stack layers)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: _buildHeader(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================================================
  // 1. VIDEO CANVAS BACKGROUND
  // ==========================================================================
  Widget _buildVideoCanvas() {
    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (_room.coverUrl.isNotEmpty)
            Image.network(
              _room.coverUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _buildCanvasPlaceholder(),
            )
          else
            _buildCanvasPlaceholder(),

          // Central Video Feed Badge
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              constraints: const BoxConstraints(maxWidth: 240),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.4),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Colors.white.withOpacity(0.12),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.live_tv_rounded,
                    color: Color(0xFF00C853),
                    size: 14,
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      'Live 720p · $_formattedDuration',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCanvasPlaceholder() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFF281030),
            Color(0xFF160D20),
            Color(0xFF0B0610),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.videocam_rounded,
          color: Colors.white24,
          size: 64,
        ),
      ),
    );
  }

  // ==========================================================================
  // 2. LIVE VIEWER HEADER
  // ==========================================================================
  Widget _buildHeader() {
    return Row(
      children: [
        // Host Info Card Pill
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.55),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: PopoTheme.primary.withOpacity(0.5),
                width: 1.0,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Host Avatar
                CircleAvatar(
                  radius: 16,
                  backgroundColor: PopoTheme.primary,
                  backgroundImage: _room.hostAvatar.isNotEmpty
                      ? NetworkImage(_room.hostAvatar)
                      : null,
                  child: _room.hostAvatar.isEmpty
                      ? Text(
                          _room.hostNickname.isNotEmpty
                              ? _room.hostNickname[0].toUpperCase()
                              : 'H',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 5),

                // Host Nickname, Country, Level & ID
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              _room.hostNickname,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11.5,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 3),
                          Text(
                            _room.flagEmoji,
                            style: const TextStyle(fontSize: 10),
                          ),
                        ],
                      ),
                      const SizedBox(height: 1),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 3,
                              vertical: 1,
                            ),
                            decoration: BoxDecoration(
                              color: PopoTheme.gold,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'Lv.10',
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          const SizedBox(width: 3),
                          Flexible(
                            child: Text(
                              'ID: ${_room.roomNumber}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: PopoTheme.textSecondary,
                                fontSize: 9,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 4),

                // Follow Toggle Button
                GestureDetector(
                  key: const Key('follow_host_button'),
                  onTap: _toggleFollow,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _isFollowing ? Colors.white24 : PopoTheme.primary,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: _isFollowing
                          ? null
                          : [
                              BoxShadow(
                                color: PopoTheme.primary.withOpacity(0.4),
                                blurRadius: 4,
                              ),
                            ],
                    ),
                    child: Text(
                      _isFollowing ? 'Following' : '+ Follow',
                      style: TextStyle(
                        color: _isFollowing ? Colors.white70 : Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 2),
              ],
            ),
          ),
        ),
        const SizedBox(width: 6),

        // Viewer Count Pill (Tapping opens Viewers List)
        GestureDetector(
          key: const Key('viewer_count_pill'),
          onTap: _showViewersSheet,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.55),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFF00C853).withOpacity(0.6),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 5,
                  height: 5,
                  decoration: const BoxDecoration(
                    color: Color(0xFF00C853),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  _formatNumber(_room.viewerCount),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 3),
                const Icon(
                  Icons.people_outline_rounded,
                  color: Colors.white70,
                  size: 12,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 5),

        // Audio Mute/Unmute
        _buildHeaderIconButton(
          icon: _isAudioMuted
              ? Icons.volume_off_rounded
              : Icons.volume_up_rounded,
          onTap: _toggleAudioMute,
        ),
        const SizedBox(width: 5),

        // Close / Exit Button
        _buildHeaderIconButton(
          key: const Key('close_viewer_button'),
          icon: Icons.close_rounded,
          onTap: () => Navigator.pop(context),
        ),
      ],
    );
  }

  Widget _buildHeaderIconButton({
    Key? key,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      key: key,
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.55),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withOpacity(0.15), width: 1),
        ),
        child: Center(
          child: Icon(icon, color: Colors.white, size: 17),
        ),
      ),
    );
  }

  // ==========================================================================
  // 3. ROOM DETAILS PILL
  // ==========================================================================
  Widget _buildRoomDetailsPill() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.white.withOpacity(0.12),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: PopoTheme.primary,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              _room.category,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 200),
            child: Text(
              _room.title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================================
  // 4. FLOATING GIFT ANIMATION BANNER
  // ==========================================================================
  Widget _buildFloatingGiftBanner() {
    final gift = _activeFloatingGift!;
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2B0A42), Color(0xFFFF1768)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: PopoTheme.gold, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: PopoTheme.primary.withOpacity(0.5),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.black26,
              backgroundImage: NetworkImage(gift.iconUrl),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${DesignFixtures.currentUserProfile.nickname} sent',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 10,
                  ),
                ),
                Text(
                  '${gift.name} x$_activeFloatingGiftQty',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 8),
            const Text(
              '🎁✨',
              style: TextStyle(fontSize: 18),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================================================
  // 5. LIVE CHAT OVERLAY & COMPOSER
  // ==========================================================================
  Widget _buildLiveChatOverlay() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Live Chat Feed
        SizedBox(
          height: 220,
          child: ShaderMask(
            shaderCallback: (Rect bounds) {
              return const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.black],
                stops: [0.0, 0.22],
              ).createShader(bounds);
            },
            blendMode: BlendMode.dstIn,
            child: ListView.builder(
              key: const Key('live_chat_list'),
              controller: _chatScrollController,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              itemCount: _chatMessages.length,
              itemBuilder: (ctx, idx) =>
                  _buildChatMessageItem(_chatMessages[idx]),
            ),
          ),
        ),

        const SizedBox(height: 6),

        // Quick Emoji Selector Bar
        Container(
          height: 32,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _buildEmojiChip('❤️'),
              _buildEmojiChip('👏'),
              _buildEmojiChip('🔥'),
              _buildEmojiChip('🌹'),
              _buildEmojiChip('😍'),
              _buildEmojiChip('🎉'),
              _buildEmojiChip('👋'),
            ],
          ),
        ),

        const SizedBox(height: 6),

        // Bottom Chat Input Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 4, 14, 10),
          child: Row(
            children: [
              // Chat text field
              Expanded(
                child: Container(
                  height: 42,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.55),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.12),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      const SizedBox(width: 14),
                      Expanded(
                        child: TextField(
                          key: const Key('live_chat_input'),
                          controller: _chatController,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                          ),
                          maxLength: 300,
                          buildCounter: (
                            _, {
                            required int currentLength,
                            required bool isFocused,
                            int? maxLength,
                          }) =>
                              null,
                          decoration: const InputDecoration(
                            hintText: 'Say something nice...',
                            hintStyle: TextStyle(
                              color: Colors.white38,
                              fontSize: 13,
                            ),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                          onSubmitted: (_) => _handleSendChatMessage(),
                        ),
                      ),
                      IconButton(
                        key: const Key('live_chat_send_button'),
                        icon: const Icon(
                          Icons.send_rounded,
                          color: PopoTheme.primary,
                          size: 20,
                        ),
                        onPressed: _handleSendChatMessage,
                      ),
                    ],
                  ),
                ),
              ),

              // Heart reaction button
              const SizedBox(width: 8),
              GestureDetector(
                key: const Key('heart_reaction_button'),
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Sent love to broadcaster! ❤️'),
                      duration: Duration(milliseconds: 700),
                      backgroundColor: PopoTheme.surface,
                    ),
                  );
                },
                child: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.55),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: PopoTheme.primary.withOpacity(0.35),
                    ),
                  ),
                  child: const Icon(
                    Icons.favorite_rounded,
                    color: PopoTheme.primary,
                    size: 20,
                  ),
                ),
              ),

              // Gift Bottom Sheet Trigger
              const SizedBox(width: 8),
              GestureDetector(
                key: const Key('open_gift_sheet_button'),
                onTap: _showGiftSheet,
                child: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFF251F38),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFFFB800).withOpacity(0.7),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFFB800).withOpacity(0.25),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.card_giftcard_rounded,
                    color: Color(0xFFFFB800),
                    size: 20,
                  ),
                ),
              ),

              // PK Battle Entry Point Trigger
              const SizedBox(width: 8),
              GestureDetector(
                key: const Key('pk_entry_button'),
                onTap: _openPkFlow,
                child: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF1768), Color(0xFF00E5FF)],
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: PopoTheme.primary.withOpacity(0.35),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'PK',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildChatMessageItem(FixtureLiveChatMessage msg) {
    final isGiftAnnouncement = msg.content.contains('🎁');

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isGiftAnnouncement
            ? const Color(0xFF381028).withOpacity(0.75)
            : Colors.black.withOpacity(0.48),
        borderRadius: BorderRadius.circular(12),
        border: isGiftAnnouncement
            ? Border.all(color: PopoTheme.primary.withOpacity(0.6), width: 1)
            : null,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // VIP Badge
          if (msg.isVip)
            Container(
              margin: const EdgeInsets.only(right: 5, top: 2),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFFB800), Color(0xFFFF6B00)],
                ),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'VIP',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 8,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),

          // Wealth Level Badge
          Container(
            margin: const EdgeInsets.only(right: 6, top: 2),
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
            decoration: BoxDecoration(
              color: PopoTheme.gold.withOpacity(0.2),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: PopoTheme.gold.withOpacity(0.4)),
            ),
            child: Text(
              'Lv.${msg.senderLevel}',
              style: const TextStyle(
                color: PopoTheme.gold,
                fontSize: 8.5,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          // Nickname & Content
          Flexible(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: '${msg.senderNickname}: ',
                    style: const TextStyle(
                      color: PopoTheme.cyan,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextSpan(
                    text: msg.content,
                    style: TextStyle(
                      color: isGiftAnnouncement
                          ? const Color(0xFFFFE082)
                          : Colors.white,
                      fontSize: 12,
                      fontWeight: isGiftAnnouncement
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(width: 6),
          Text(
            msg.timestamp,
            style: const TextStyle(
              color: Colors.white30,
              fontSize: 9.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmojiChip(String emoji) {
    return GestureDetector(
      onTap: () => _insertEmoji(emoji),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.4),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white12),
        ),
        child: Center(
          child: Text(
            emoji,
            style: const TextStyle(fontSize: 14),
          ),
        ),
      ),
    );
  }

  // ==========================================================================
  // 6. GIFT BOTTOM SHEET MODAL
  // ==========================================================================
  Widget _buildGiftSheet(BuildContext sheetCtx) {
    int selectedGiftIndex = 0;
    int selectedQuantity = 1;
    final gifts = DesignFixtures.gifts;

    return StatefulBuilder(
      builder: (ctx, setSheetState) {
        final currentBal = DesignFixtures.currentCoinBalance;
        final selectedGift = gifts.isNotEmpty ? gifts[selectedGiftIndex] : null;
        final totalCost =
            selectedGift != null ? selectedGift.priceCoins * selectedQuantity : 0;

        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF161622),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Grab handle
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),

              // Sheet Header: Title, Coin Balance, Close
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Send Gifts',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  // User Coin Balance
                  Container(
                    key: const Key('gift_sheet_coin_balance'),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF201D30),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFFFFB800).withOpacity(0.4),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('🪙', style: TextStyle(fontSize: 12)),
                        const SizedBox(width: 5),
                        Text(
                          _formatNumber(currentBal),
                          style: const TextStyle(
                            color: Color(0xFFFFB800),
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Close button
                  GestureDetector(
                    onTap: () => Navigator.pop(sheetCtx),
                    child: const Icon(
                      Icons.close_rounded,
                      color: Colors.white54,
                      size: 20,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Gift Grid
              SizedBox(
                height: 220,
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 4,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 0.78,
                  ),
                  itemCount: gifts.length,
                  itemBuilder: (context, idx) {
                    final gift = gifts[idx];
                    final isSelected = idx == selectedGiftIndex;

                    return GestureDetector(
                      key: Key('gift_tile_${gift.id}'),
                      onTap: () {
                        setSheetState(() => selectedGiftIndex = idx);
                      },
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFF381028)
                              : const Color(0xFF1F1E2E),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected
                                ? PopoTheme.primary
                                : Colors.white.withOpacity(0.08),
                            width: isSelected ? 1.8 : 1,
                          ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: PopoTheme.primary.withOpacity(0.35),
                                    blurRadius: 8,
                                  ),
                                ]
                              : null,
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Expanded(
                              child: Image.network(
                                gift.iconUrl,
                                fit: BoxFit.contain,
                                errorBuilder: (_, __, ___) => const Center(
                                  child: Text('🎁', style: TextStyle(fontSize: 26)),
                                ),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              gift.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: isSelected ? Colors.white : Colors.white70,
                                fontSize: 10,
                                fontWeight: isSelected
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text('🪙', style: TextStyle(fontSize: 9)),
                                const SizedBox(width: 3),
                                Text(
                                  _formatNumber(gift.priceCoins),
                                  style: const TextStyle(
                                    color: Color(0xFFFFB800),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 12),

              // Quantity Selector Row
              Row(
                children: [
                  const Text(
                    'Quantity:',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [1, 5, 10, 66, 99].map((q) {
                        final isQtySelected = selectedQuantity == q;
                        return GestureDetector(
                          onTap: () {
                            setSheetState(() => selectedQuantity = q);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: isQtySelected
                                  ? PopoTheme.primary
                                  : const Color(0xFF252438),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${q}x',
                              style: TextStyle(
                                color: isQtySelected
                                    ? Colors.white
                                    : Colors.white70,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Action Row: Total Cost & Send Button
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Total Cost',
                          style: TextStyle(
                            color: Colors.white54,
                            fontSize: 11,
                          ),
                        ),
                        Row(
                          children: [
                            const Text('🪙', style: TextStyle(fontSize: 14)),
                            const SizedBox(width: 4),
                            Text(
                              _formatNumber(totalCost),
                              style: const TextStyle(
                                color: Color(0xFFFFB800),
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Send Gift CTA
                  Expanded(
                    flex: 2,
                    child: Container(
                      key: const Key('send_gift_button'),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF1768), Color(0xFFFF5252)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: PopoTheme.primary.withOpacity(0.4),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(24),
                          onTap: () {
                            if (selectedGift == null) return;

                            // 1. Check if sufficient coins exist
                            if (currentBal < totalCost) {
                              // Insufficient coins error: keeps sheet open
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Insufficient coins! You need ${_formatNumber(totalCost - currentBal)} more coins.',
                                  ),
                                  backgroundColor: const Color(0xFFFF1768),
                                  duration: const Duration(seconds: 2),
                                ),
                              );
                              return;
                            }

                            // 2. Sufficient coins: deduct from fixture
                            final success = DesignFixtures.deductCoins(totalCost);
                            if (success) {
                              setSheetState(() {});

                              // 3. Update main room state
                              setState(() {
                                // Trigger floating banner
                                _activeFloatingGift = selectedGift;
                                _activeFloatingGiftQty = selectedQuantity;
                                _floatingGiftTimer?.cancel();
                                _floatingGiftTimer = Timer(
                                  const Duration(milliseconds: 2800),
                                  () {
                                    if (mounted) {
                                      setState(() => _activeFloatingGift = null);
                                    }
                                  },
                                );

                                // Add special gift message to live chat
                                _chatMessages.add(
                                  FixtureLiveChatMessage(
                                    id: 'lmsg_gift_${DateTime.now().millisecondsSinceEpoch}',
                                    senderNickname:
                                        DesignFixtures.currentUserProfile.nickname,
                                    senderAvatar:
                                        DesignFixtures.currentUserProfile.avatarUrl,
                                    senderLevel:
                                        DesignFixtures.currentUserProfile.wealthLevel,
                                    isVip: true,
                                    content:
                                        'Sent ${selectedGift.name} x$selectedQuantity 🎁✨',
                                    timestamp: 'Just now',
                                  ),
                                );
                              });
                              _scrollToBottom();

                              // 4. Confirmation toast
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Sent ${selectedGift.name} x$selectedQuantity to ${_room.hostNickname}! 🎁',
                                  ),
                                  backgroundColor: const Color(0xFF161622),
                                  duration: const Duration(seconds: 2),
                                ),
                              );

                              // Dismiss sheet upon successful sending
                              Navigator.pop(sheetCtx);
                            }
                          },
                          child: const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Center(
                              child: Text(
                                'Send Gift',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // ==========================================================================
  // 7. VIEWERS / TOP CONTRIBUTORS BOTTOM SHEET
  // ==========================================================================
  Widget _buildViewersSheet(BuildContext ctx) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF161622),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Grab handle
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Audience & Contributors',
                    key: Key('viewers_sheet_title'),
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    '${_formatNumber(_room.viewerCount)} Viewers Online',
                    style: const TextStyle(
                      color: PopoTheme.textSecondary,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => Navigator.pop(ctx),
                child: const Icon(
                  Icons.close_rounded,
                  color: Colors.white54,
                  size: 20,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Contributors List
          if (_topContributors.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'No contributors yet. Send a gift to take the #1 spot!',
                style: TextStyle(color: Colors.white60, fontSize: 12),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _topContributors.length,
              separatorBuilder: (_, __) => const Divider(
                color: Colors.white10,
                height: 12,
              ),
              itemBuilder: (context, idx) {
                final user = _topContributors[idx];
                final rank = idx + 1;
                final rankColor = rank == 1
                    ? PopoTheme.gold
                    : rank == 2
                        ? const Color(0xFFC0C0C0)
                        : const Color(0xFFCD7F32);

                final simulatedCoins = rank == 1
                    ? 150000
                    : rank == 2
                        ? 98500
                        : 64200;

                return Row(
                  children: [
                    // Rank Badge
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: rankColor.withOpacity(0.2),
                        shape: BoxShape.circle,
                        border: Border.all(color: rankColor, width: 1),
                      ),
                      child: Center(
                        child: Text(
                          '#$rank',
                          style: TextStyle(
                            color: rankColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Avatar
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: PopoTheme.surface,
                      backgroundImage: user.avatarUrl.isNotEmpty
                          ? NetworkImage(user.avatarUrl)
                          : null,
                      child: user.avatarUrl.isEmpty
                          ? Text(
                              user.nickname.isNotEmpty ? user.nickname[0] : 'U',
                              style: const TextStyle(color: Colors.white),
                            )
                          : null,
                    ),
                    const SizedBox(width: 10),

                    // Nickname & Level
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  user.nickname,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                user.flagEmoji,
                                style: const TextStyle(fontSize: 11),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 1,
                            ),
                            decoration: BoxDecoration(
                              color: PopoTheme.gold.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Lv.${user.wealthLevel}',
                              style: const TextStyle(
                                color: PopoTheme.gold,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Contribution Coins
                    Row(
                      children: [
                        const Text('🪙', style: TextStyle(fontSize: 12)),
                        const SizedBox(width: 4),
                        Text(
                          _formatNumber(simulatedCoins),
                          style: const TextStyle(
                            color: Color(0xFFFFB800),
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }
}
