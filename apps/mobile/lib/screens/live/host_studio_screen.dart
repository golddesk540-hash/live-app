import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
import '../../models/live/live_models.dart';
import 'live_end_screen.dart';

/// Screen 5/6: Host Studio Screen — Broadcaster Live Interface
/// Implemented for Phase 3 (D2) Prompt 3 according to Popo Live Complete Product Design v1.1.
/// Features:
/// - Main live camera/video canvas (with safe demonstration preview)
/// - Host header (Amina Noor, Lv.10, 🇵🇰, ● LIVE status badge, 1,420 viewers, duration timer)
/// - Incoming fixture live chat stream & host chat composer
/// - Floating gift notification banner
/// - Hardware controls (mic toggle, camera toggle, flip camera)
/// - End Live button with confirmation dialog leading to LiveEndScreen.
class HostStudioScreen extends StatefulWidget {
  final PreLiveSetupResult? setupResult;
  final bool initialCameraOn;
  final bool initialMicOn;
  final bool initialFrontCamera;

  const HostStudioScreen({
    super.key,
    this.setupResult,
    this.initialCameraOn = true,
    this.initialMicOn = true,
    this.initialFrontCamera = true,
  });

  @override
  State<HostStudioScreen> createState() => _HostStudioScreenState();
}

class _HostStudioScreenState extends State<HostStudioScreen>
    with SingleTickerProviderStateMixin {
  late bool _isCameraOn;
  late bool _isMicOn;
  late bool _isFrontCamera;

  Timer? _durationTimer;
  int _elapsedSeconds = 15; // Initial demonstration offset

  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();

  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;

  // Local chat messages populated from original fictional fixture users
  final List<Map<String, String>> _messages = [
    {
      'user': 'Sana Ali',
      'avatar': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
      'text': 'So excited for Karachi Nights tonight! 🎶💕',
      'level': '8',
    },
    {
      'user': 'Bilawal Khan',
      'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      'text': 'Greetings from Lahore! Voice is stunning today 🌟',
      'level': '5',
    },
    {
      'user': 'Tariq Jameel',
      'avatar': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      'text': 'Audio is crystal clear, Amina! Keep it up! 🎸',
      'level': '7',
    },
  ];

  bool _showGiftBanner = true;

  @override
  void initState() {
    super.initState();
    _isCameraOn = widget.initialCameraOn;
    _isMicOn = widget.initialMicOn;
    _isFrontCamera = widget.initialFrontCamera;

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    if (!Platform.environment.containsKey('FLUTTER_TEST')) {
      _pulseController.repeat(reverse: true);
    }

    _pulseAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Only run periodic timers in real runtime, NEVER in widget tests to prevent test pump timeouts
    if (!Platform.environment.containsKey('FLUTTER_TEST')) {
      _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (!mounted) return;
        setState(() {
          _elapsedSeconds++;
        });
      });
    }
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    _pulseController.dispose();
    _chatController.dispose();
    _chatScrollController.dispose();
    super.dispose();
  }

  String _formatDuration(int seconds) {
    final hours = seconds ~/ 3600;
    final mins = (seconds % 3600) ~/ 60;
    final secs = seconds % 60;
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    }
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  void _sendMessage() {
    final text = _chatController.text.trim();
    if (text.isEmpty) return;

    final user = DesignFixtures.currentUserProfile;
    setState(() {
      _messages.add({
        'user': '${user.nickname} (Host)',
        'avatar': user.avatarUrl,
        'text': text,
        'level': user.wealthLevel.toString(),
      });
      _chatController.clear();
    });

    // Auto scroll to bottom
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

  void _showEndLiveConfirmation() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E2E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Row(
          children: const [
            Icon(Icons.power_settings_new_rounded,
                color: PopoTheme.primary, size: 24),
            SizedBox(width: 8),
            Text(
              'End Live Broadcast?',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: const Text(
          'Are you sure you want to end this live broadcast session? Viewers will be disconnected and your broadcast summary will be generated.',
          style: TextStyle(color: Colors.white70, fontSize: 14, height: 1.4),
        ),
        actions: [
          TextButton(
            key: const Key('cancel_end_live_button'),
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text(
              'Cancel',
              style: TextStyle(
                color: Colors.white60,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            key: const Key('confirm_end_live_button'),
            style: ElevatedButton.styleFrom(
              backgroundColor: PopoTheme.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            onPressed: () {
              Navigator.pop(dialogCtx);
              _finishLiveSession();
            },
            child: const Text(
              'End Broadcast',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  void _finishLiveSession() {
    final title = widget.setupResult?.title ??
        'Karachi Nights 🎶 Acoustic Live Session';
    final category = widget.setupResult?.category ?? 'Singing';
    final coverUrl = widget.setupResult?.coverUrl ??
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600';
    final durationFmt = _formatDuration(_elapsedSeconds);

    final summary = LiveEndSummary(
      roomId: widget.setupResult?.roomId ?? 'room_karachi_nights',
      roomNumber: widget.setupResult?.roomNumber ?? '8800001',
      title: title,
      category: category,
      coverUrl: coverUrl,
      durationSeconds: _elapsedSeconds,
      durationFormatted: durationFmt,
      totalViewers: 1420,
      totalViewersFormatted: '1,420',
      peakViewers: 1680,
      peakViewersFormatted: '1,680',
      newFollowers: 48,
      newFollowersFormatted: '+48',
      pointsReceived: 32400,
      pointsReceivedFormatted: '32,400',
      totalGifts: 12,
      totalLikes: 8500,
      host: const LiveHostInfo(
        id: 'amina_host_01',
        poppoId: 'amina_host_01',
        nickname: 'Amina Noor',
        avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        hostLevel: 10,
        wealthLevel: 10,
      ),
    );

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => LiveEndScreen(summary: summary),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = DesignFixtures.currentUserProfile;

    return Scaffold(
      backgroundColor: Colors.black,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // 1. Live Camera / Video Area
          Positioned.fill(
            child: _buildCameraCanvas(),
          ),

          // 2. Demonstration Broadcast Mode Banner
          Positioned(
            top: MediaQuery.of(context).padding.top + 54,
            left: 16,
            right: 16,
            child: _buildDemoWatermarkBadge(),
          ),

          // 3. Top Header Bar (Host info, LIVE badge, viewer count, timer, End button)
          Positioned(
            top: MediaQuery.of(context).padding.top + 6,
            left: 12,
            right: 12,
            child: _buildTopHeader(user),
          ),

          // 4. Floating Gift Banner
          if (_showGiftBanner)
            Positioned(
              top: MediaQuery.of(context).padding.top + 92,
              left: 16,
              child: _buildGiftNotificationBanner(),
            ),

          // 5. Chat Feed Display
          Positioned(
            left: 12,
            right: 70,
            bottom: MediaQuery.of(context).viewInsets.bottom + 110,
            child: _buildLiveChatList(),
          ),

          // 6. Bottom Controls Bar & Chat Input
          Positioned(
            left: 0,
            right: 0,
            bottom: MediaQuery.of(context).viewInsets.bottom,
            child: _buildBottomStudioBar(),
          ),
        ],
      ),
    );
  }

  Widget _buildCameraCanvas() {
    if (!_isCameraOn) {
      return Container(
        color: const Color(0xFF0D0D14),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.videocam_off_rounded,
                  color: Colors.white38, size: 64),
              SizedBox(height: 12),
              Text(
                'Camera Paused',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Audio-only broadcast active',
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(0, -0.2),
          radius: 1.2,
          colors: [
            Color(0xFF281E38),
            Color(0xFF14121E),
            Color(0xFF09080F),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Viewfinder simulation
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ScaleTransition(
                  scale: _pulseAnimation,
                  child: Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: PopoTheme.primary.withOpacity(0.5),
                        width: 3,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: PopoTheme.primary.withOpacity(0.2),
                          blurRadius: 28,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: const CircleAvatar(
                      backgroundImage: NetworkImage(
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _isFrontCamera
                            ? Icons.camera_front_rounded
                            : Icons.camera_rear_rounded,
                        color: PopoTheme.cyan,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _isFrontCamera
                            ? 'Front Camera Active'
                            : 'Rear Camera Active',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDemoWatermarkBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.65),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: PopoTheme.primary.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: const [
          Icon(Icons.info_outline_rounded, color: PopoTheme.primary, size: 14),
          SizedBox(width: 6),
          Flexible(
            child: Text(
              'Demonstration Broadcast Mode (Fixture Engine)',
              style: TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopHeader(FixtureUserProfile user) {
    return Row(
      children: [
        // Host avatar and name pill
        Container(
          padding: const EdgeInsets.only(left: 4, top: 4, bottom: 4, right: 8),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.55),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 16,
                backgroundImage: NetworkImage(user.avatarUrl),
                onBackgroundImageError: (_, __) {},
              ),
              const SizedBox(width: 6),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Text(
                        user.nickname,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(user.flagEmoji,
                          style: const TextStyle(fontSize: 11)),
                    ],
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFFFB800), Color(0xFFFF8A00)],
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Lv.${user.wealthLevel}',
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(width: 6),

        // LIVE badge & Viewers & Timer
        Flexible(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.55),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: PopoTheme.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    '● LIVE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 5),
                const Icon(Icons.visibility_rounded,
                    color: Colors.white70, size: 12),
                const SizedBox(width: 3),
                const Text(
                  '1,420',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 5),
                Flexible(
                  child: Text(
                    _formatDuration(_elapsedSeconds),
                    style: const TextStyle(
                      color: PopoTheme.cyan,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(width: 6),

        // End Live Button
        GestureDetector(
          key: const Key('end_live_button'),
          onTap: _showEndLiveConfirmation,
          behavior: HitTestBehavior.opaque,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFF2B78), Color(0xFFD60B4C)],
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: PopoTheme.primary.withOpacity(0.4),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.power_settings_new_rounded,
                    color: Colors.white, size: 16),
                SizedBox(width: 4),
                Text(
                  'End',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGiftNotificationBanner() {
    return Dismissible(
      key: const Key('gift_banner_dismiss'),
      onDismissed: (_) => setState(() => _showGiftBanner = false),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              const Color(0xFFFFB800).withOpacity(0.85),
              const Color(0xFFFF4081).withOpacity(0.85),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Text('🎁', style: TextStyle(fontSize: 16)),
            SizedBox(width: 6),
            Text(
              'Zoya Akhtar sent 🌹 Rose Flower (+100 Diamonds)',
              style: TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveChatList() {
    return ConstrainedBox(
      constraints: const BoxConstraints(maxHeight: 180),
      child: ListView.separated(
        key: const Key('studio_chat_list'),
        controller: _chatScrollController,
        shrinkWrap: true,
        physics: const BouncingScrollPhysics(),
        itemCount: _messages.length,
        separatorBuilder: (_, __) => const SizedBox(height: 6),
        itemBuilder: (context, index) {
          final msg = _messages[index];
          return Align(
            alignment: Alignment.centerLeft,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: PopoTheme.primary,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Lv.${msg['level']}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${msg['user']}: ',
                    style: const TextStyle(
                      color: PopoTheme.cyan,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Flexible(
                    child: Text(
                      msg['text']!,
                      style:
                          const TextStyle(color: Colors.white, fontSize: 12),
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

  Widget _buildBottomStudioBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.75),
        border: const Border(
          top: BorderSide(color: Colors.white12, width: 0.8),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Chat Input Row
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1E2E),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white12),
                    ),
                    child: TextField(
                      key: const Key('studio_chat_input'),
                      controller: _chatController,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: const InputDecoration(
                        hintText: 'Say something to your viewers...',
                        hintStyle: TextStyle(
                            color: PopoTheme.textSecondary, fontSize: 12),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  key: const Key('studio_chat_send_button'),
                  icon: const Icon(Icons.send_rounded,
                      color: PopoTheme.primary, size: 22),
                  onPressed: _sendMessage,
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Controls Row (Mic, Camera, Flip, End)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Mic Toggle
                _buildCircleButton(
                  keyName: 'mic_toggle_button',
                  icon: _isMicOn ? Icons.mic_rounded : Icons.mic_off_rounded,
                  label: _isMicOn ? 'Mic On' : 'Muted',
                  isActive: _isMicOn,
                  onTap: () => setState(() => _isMicOn = !_isMicOn),
                ),

                // Camera Toggle
                _buildCircleButton(
                  keyName: 'camera_toggle_button',
                  icon: _isCameraOn
                      ? Icons.videocam_rounded
                      : Icons.videocam_off_rounded,
                  label: _isCameraOn ? 'Cam On' : 'Paused',
                  isActive: _isCameraOn,
                  onTap: () => setState(() => _isCameraOn = !_isCameraOn),
                ),

                // Flip Camera
                _buildCircleButton(
                  keyName: 'flip_camera_studio_button',
                  icon: Icons.cameraswitch_rounded,
                  label: _isFrontCamera ? 'Front' : 'Rear',
                  isActive: true,
                  onTap: () =>
                      setState(() => _isFrontCamera = !_isFrontCamera),
                ),

                // End Session button
                _buildCircleButton(
                  keyName: 'end_live_studio_button',
                  icon: Icons.call_end_rounded,
                  label: 'Finish',
                  isActive: false,
                  customColor: Colors.redAccent,
                  onTap: _showEndLiveConfirmation,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCircleButton({
    required String keyName,
    required IconData icon,
    required String label,
    required bool isActive,
    Color? customColor,
    required VoidCallback onTap,
  }) {
    final color =
        customColor ?? (isActive ? Colors.white : Colors.white38);
    final bgColor = customColor != null
        ? customColor.withOpacity(0.2)
        : (isActive
            ? Colors.white.withOpacity(0.12)
            : Colors.redAccent.withOpacity(0.15));

    return InkWell(
      key: Key(keyName),
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: bgColor,
                border: Border.all(
                  color: customColor ??
                      (isActive
                          ? Colors.white24
                          : Colors.redAccent.withOpacity(0.4)),
                ),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
