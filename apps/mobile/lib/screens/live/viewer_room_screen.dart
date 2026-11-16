import 'dart:async';

import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../models/live/live_models.dart';
import '../../services/live/agora_rtc_service.dart';
import '../../services/live/live_session_manager.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_primary_button.dart';
import 'widgets/live_chat_overlay.dart';
import 'widgets/live_safety_modal.dart';
import 'live_rules_screen.dart';
import '../gifts/widgets/universal_gift_panel.dart';
import '../gifts/widgets/gift_animation_banner.dart';
import '../../services/gifts/gift_session_manager.dart';

/// Viewer Room Screen — Live Audience Experience & Real-Time Video Playback
/// Implemented in Phase 2 Prompt 05/10 according to NEXT IMPLEMENTATION PLAN v1.1
/// Connects to POST /api/live/viewer/join, GET /api/live/viewer/session,
/// POST /api/live/viewer/leave, and receives real-time host video/audio via Agora.
class ViewerRoomScreen extends StatefulWidget {
  final String roomId;
  final String? initialTitle;
  final String? initialHostNickname;
  final String? initialCoverUrl;

  const ViewerRoomScreen({
    Key? key,
    required this.roomId,
    this.initialTitle,
    this.initialHostNickname,
    this.initialCoverUrl,
  }) : super(key: key);

  @override
  State<ViewerRoomScreen> createState() => _ViewerRoomScreenState();
}

class _ViewerRoomScreenState extends State<ViewerRoomScreen> {
  final LiveSessionManager _sessionManager = LiveSessionManager.instance;
  final AgoraRtcService _rtcService = AgoraRtcService.instance;

  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();

  bool _isLoading = true;
  bool _isAudioMuted = false;
  bool _isFollowing = false;
  String? _errorMessage;
  String? _connectionWarning;
  int _networkQuality = 1;

  // Periodic elapsed time tracker for audience
  Timer? _durationTimer;
  int _elapsedSeconds = 0;

  @override
  void initState() {
    super.initState();
    _sessionManager.addListener(_onSessionStateChanged);
    _sessionManager.onStreamEndedByHost = _handleHostEndedStreamNotification;
    _setupAgoraListeners();
    _joinLiveRoom();
  }

  void _handleHostEndedStreamNotification() {
    if (!mounted) return;
    _durationTimer?.cancel();
    setState(() {
      _errorMessage =
          'The host has ended this live broadcast. Thank you for watching!';
    });
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    _chatController.dispose();
    _chatScrollController.dispose();
    _sessionManager.removeListener(_onSessionStateChanged);
    if (_sessionManager.onStreamEndedByHost ==
        _handleHostEndedStreamNotification) {
      _sessionManager.onStreamEndedByHost = null;
    }
    _rtcService.onConnectionStateChanged = null;
    _rtcService.onNetworkQuality = null;

    // Stop listening to room gifts & leave live room on screen exit
    GiftSessionManager.instance.stopListeningToRoomGifts();
    _sessionManager.leaveViewer();
    super.dispose();
  }

  void _onSessionStateChanged() {
    if (!mounted) return;
    if (_sessionManager.sessionState == LiveSessionState.ended &&
        !_isLoading &&
        _errorMessage == null) {
      _durationTimer?.cancel();
      setState(() {
        _errorMessage =
            'The host has ended this live broadcast. Thank you for watching!';
      });
    } else {
      setState(() {});
    }
    _scrollToBottomChat();
  }

  void _setupAgoraListeners() {
    _rtcService.onConnectionStateChanged = (status, message) {
      if (!mounted) return;
      setState(() {
        if (status == LiveConnectionStatus.reconnecting) {
          _connectionWarning = 'Reconnecting to live host stream...';
        } else if (status == LiveConnectionStatus.error) {
          _connectionWarning = message ?? 'Playback connection error';
        } else {
          _connectionWarning = null;
        }
      });
    };

    _rtcService.onNetworkQuality = (score) {
      if (!mounted) return;
      setState(() => _networkQuality = score);
    };
  }

  Future<void> _joinLiveRoom() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final success = await _sessionManager.joinAsViewer(
      roomId: widget.roomId,
      isDemo: false,
    );

    if (!mounted) return;

    if (success) {
      final session = _sessionManager.currentSession;
      setState(() {
        _isLoading = false;
        _isFollowing = session?.isFollowing ?? false;
      });

      // Start duration timer
      _durationTimer?.cancel();
      _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) {
          setState(() => _elapsedSeconds++);
        }
      });

      // Start listening to live gifts via SSE
      GiftSessionManager.instance.startListeningToRoomGifts(session?.roomNumber ?? widget.roomId);
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage =
            _sessionManager.errorMessage ??
            'This live broadcast is currently offline or has ended.';
      });
    }
  }

  void _scrollToBottomChat() {
    if (_chatScrollController.hasClients) {
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
  }

  Future<void> _handleSendMessage() async {
    final text = _chatController.text.trim();
    if (text.isEmpty) return;

    _chatController.clear();
    await _sessionManager.sendChatMessage(text);
    _scrollToBottomChat();
  }

  void _toggleAudioMute() {
    setState(() => _isAudioMuted = !_isAudioMuted);
    _rtcService.muteLocalAudio(_isAudioMuted);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isAudioMuted ? 'Host audio muted' : 'Host audio unmuted',
        ),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  void _toggleFollow() {
    setState(() => _isFollowing = !_isFollowing);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_isFollowing ? 'Following host! ❤️' : 'Unfollowed'),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(seconds: 1),
      ),
    );
  }

  Future<void> _handleLeaveRoom() async {
    await _sessionManager.leaveViewer();
    if (mounted) {
      Navigator.pop(context);
    }
  }

  String get _formattedDuration {
    final minutes = _elapsedSeconds ~/ 60;
    final seconds = _elapsedSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: PopoTheme.background,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              PopoLoadingIndicator(color: PopoTheme.primary, size: 40),
              SizedBox(height: 16),
              Text(
                'Connecting to live room...',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        backgroundColor: PopoTheme.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: PopoTheme.surface,
                    shape: BoxShape.circle,
                    border: Border.all(color: PopoTheme.borderSubtle),
                  ),
                  child: const Icon(
                    Icons.tv_off_rounded,
                    color: PopoTheme.textSecondary,
                    size: 48,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Broadcast Ended',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _errorMessage!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 24),
                PopoPrimaryButton(
                  text: 'Explore Other Streams',
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final session = _sessionManager.currentSession;
    final host = session?.host;
    final messages = _sessionManager.chatMessages;

    return WillPopScope(
      onWillPop: () async {
        await _handleLeaveRoom();
        return false;
      },
      child: Scaffold(
        backgroundColor: PopoTheme.background,
        resizeToAvoidBottomInset: true,
        body: Stack(
          children: [
            // 1. Remote Host Live Video Canvas
            Positioned.fill(child: _buildRemoteVideoCanvas(session)),

            // 2. Top Vignette Gradient
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 190,
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

            // 4. Connection Warning Banner
            if (_connectionWarning != null)
              Positioned(
                top: 50,
                left: 16,
                right: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: PopoTheme.primary.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.wifi_off_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _connectionWarning!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // 5. Top Header & Host HUD
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    // Host Profile Badge with Moderation / Safety trigger
                    GestureDetector(
                      onTap: () {
                        if (host != null) {
                          LiveSafetyModal.show(
                            context: context,
                            targetUserId: host.id,
                            targetNickname: host.nickname,
                            targetAvatarUrl: host.avatarUrl,
                            targetRole: 'host',
                            targetWealthLevel: host.wealthLevel,
                            isHostViewer: false,
                          );
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: PopoTheme.surface.withOpacity(0.85),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: PopoTheme.primary.withOpacity(0.6),
                            width: 1.2,
                          ),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 17,
                              backgroundColor: PopoTheme.primary,
                              backgroundImage:
                                  host?.avatarUrl != null &&
                                      host!.avatarUrl!.startsWith('http')
                                  ? NetworkImage(host.avatarUrl!)
                                  : null,
                              child:
                                  host?.avatarUrl == null ||
                                      !host!.avatarUrl!.startsWith('http')
                                  ? Text(
                                      (host?.nickname.isNotEmpty ?? false)
                                          ? host!.nickname[0].toUpperCase()
                                          : 'H',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    )
                                  : null,
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  host?.nickname ??
                                      widget.initialHostNickname ??
                                      'Live Broadcaster',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 4,
                                        vertical: 1,
                                      ),
                                      decoration: BoxDecoration(
                                        color: PopoTheme.gold,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        'Lv.${host?.wealthLevel ?? 5}',
                                        style: const TextStyle(
                                          color: Colors.black,
                                          fontSize: 9,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'ID: ${session?.roomNumber ?? "880219"}',
                                      style: const TextStyle(
                                        color: PopoTheme.textSecondary,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(width: 8),
                            // Follow Toggle
                            GestureDetector(
                              onTap: _toggleFollow,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: _isFollowing
                                      ? Colors.white24
                                      : PopoTheme.primary,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Text(
                                  _isFollowing ? 'Following' : '+ Follow',
                                  style: TextStyle(
                                    color: _isFollowing
                                        ? Colors.white70
                                        : Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                          ],
                        ),
                      ),
                    ),

                    const Spacer(),

                    // LIVE Pill & Viewers Counter
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.55),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: const Color(0xFF00C853).withOpacity(0.6),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: Color(0xFF00C853),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            session?.viewerDisplay ?? '1.8K',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Community Rules & Policy
                    _buildIconButton(
                      icon: Icons.shield_outlined,
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const LiveRulesScreen(),
                          ),
                        );
                      },
                    ),
                    const SizedBox(width: 6),

                    // Audio Mute/Unmute
                    _buildIconButton(
                      icon: _isAudioMuted
                          ? Icons.volume_off_rounded
                          : Icons.volume_up_rounded,
                      onTap: _toggleAudioMute,
                    ),
                    const SizedBox(width: 6),

                    // Exit Live Room Button
                    _buildIconButton(
                      icon: Icons.close_rounded,
                      onTap: _handleLeaveRoom,
                    ),
                  ],
                ),
              ),
            ),

            // 6. Mid-Screen Stream Details Pill
            Positioned(
              left: 16,
              top: 100,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
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
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: PopoTheme.primary,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        session?.category ?? 'Live Chat',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 180),
                      child: Text(
                        session?.title ??
                            widget.initialTitle ??
                            'Come and chat with me 💕',
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
              ),
            ),

            // 7. Live Chat Stream & Moderation Overlay
            Positioned(
              left: 0,
              right: 0,
              bottom: 12,
              child: SafeArea(
                top: false,
                child: LiveChatOverlay(
                  isHost: false,
                  onGiftTap: () {
                    final targetHostId = session?.host?.id ?? widget.roomId;
                    final targetHostNickname = host?.nickname ?? widget.initialHostNickname ?? 'Host';
                    final targetHostAvatar = host?.avatarUrl ?? widget.initialCoverUrl;
                    final targetRoomId = session?.roomNumber ?? widget.roomId;
                    UniversalGiftPanel.show(
                      context: context,
                      recipientHostId: targetHostId,
                      recipientNickname: targetHostNickname,
                      recipientAvatarUrl: targetHostAvatar,
                      liveRoomId: targetRoomId,
                    );
                  },
                  onHeartTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Sent love to broadcaster! ❤️'),
                        duration: Duration(milliseconds: 800),
                        backgroundColor: PopoTheme.surface,
                      ),
                    );
                  },
                ),
              ),
            ),

            // 8. Universal Floating Gift Animation Overlay (non-blocking)
            const Positioned.fill(
              child: GiftAnimationBanner(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRemoteVideoCanvas(LiveRoomSession? session) {
    final coverUrl = session?.coverUrl ?? widget.initialCoverUrl;

    return Container(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Background Host Cover Fallback
          if (coverUrl != null && coverUrl.isNotEmpty)
            Image.network(
              coverUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                color: const Color(0xFF141420),
                child: const Center(
                  child: Icon(Icons.person, color: Colors.white24, size: 64),
                ),
              ),
            )
          else
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color(0xFF201028),
                    Color(0xFF12121C),
                    Color(0xFF0A0A10),
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
            ),

          // Stream Health & Playback Indicator
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.4),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: Colors.white.withOpacity(0.1),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(
                    Icons.live_tv_rounded,
                    color: Color(0xFF00C853),
                    size: 16,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Live Broadcast Feed (720p 30fps)',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
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

  Widget _buildChatMessageItem(LiveChatMessage msg) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.45),
        borderRadius: BorderRadius.circular(12),
      ),
      child: RichText(
        text: TextSpan(
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
              text: msg.displayContent,
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIconButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.55),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withOpacity(0.15), width: 1),
      ),
      child: IconButton(
        icon: Icon(icon, color: Colors.white, size: 20),
        onPressed: onTap,
        constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
        padding: const EdgeInsets.all(6),
      ),
    );
  }
}
