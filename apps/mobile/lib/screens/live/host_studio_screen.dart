import 'dart:async';

import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../models/live/live_models.dart';
import '../../services/live/agora_rtc_service.dart';
import '../../services/live/live_session_manager.dart';
import '../../services/live/live_permission_service.dart';
import '../../widgets/popo_primary_button.dart';

/// Host Studio Screen — Actual Live Broadcasting Using Agora SDK
/// Implemented in Phase 2 Prompt 04/10 according to NEXT IMPLEMENTATION PLAN v1.1
/// Orchestrates camera/microphone publishing, Agora channel lifecycle,
/// real-time broadcast statistics, connection monitoring, and graceful stream termination.
class HostStudioScreen extends StatefulWidget {
  final PreLiveSetupResult setupResult;

  const HostStudioScreen({Key? key, required this.setupResult})
    : super(key: key);

  @override
  State<HostStudioScreen> createState() => _HostStudioScreenState();
}

class _HostStudioScreenState extends State<HostStudioScreen> {
  final LiveSessionManager _sessionManager = LiveSessionManager.instance;
  final AgoraRtcService _rtcService = AgoraRtcService.instance;
  final LivePermissionService _permissionService =
      LivePermissionService.instance;

  bool _isLive = false;
  bool _isConnecting = false;
  bool _isEnding = false;
  bool _isCameraOn = true;
  bool _isMicOn = true;
  bool _isFrontCamera = true;
  int _networkQuality = 1; // 1 = Excellent, 2 = Good, 3 = Poor, 4 = Bad
  String? _connectionWarning;

  // Live broadcast duration timer
  Timer? _durationTimer;
  int _elapsedSeconds = 0;

  // Periodic session synchronization timer (viewer count, status)
  Timer? _syncTimer;

  @override
  void initState() {
    super.initState();
    _isCameraOn = !_rtcService.isVideoMuted;
    _isMicOn = !_rtcService.isAudioMuted;
    _isFrontCamera = _rtcService.isFrontCamera;

    _setupAgoraListeners();
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    _syncTimer?.cancel();
    _rtcService.onConnectionStateChanged = null;
    _rtcService.onNetworkQuality = null;
    super.dispose();
  }

  void _setupAgoraListeners() {
    _rtcService.onConnectionStateChanged = (status, message) {
      if (!mounted) return;
      setState(() {
        if (status == LiveConnectionStatus.reconnecting) {
          _connectionWarning = 'Reconnecting to live channel...';
        } else if (status == LiveConnectionStatus.error) {
          _connectionWarning = message ?? 'Live connection error';
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

  String get _formattedDuration {
    final hours = _elapsedSeconds ~/ 3600;
    final minutes = (_elapsedSeconds % 3600) ~/ 60;
    final seconds = _elapsedSeconds % 60;

    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _startBroadcasting() async {
    setState(() => _isConnecting = true);

    final success = await _sessionManager.startBroadcast(
      roomId: widget.setupResult.roomId,
      title: widget.setupResult.title,
      category: widget.setupResult.category,
      coverUrl: widget.setupResult.coverUrl,
    );

    if (!mounted) return;
    setState(() => _isConnecting = false);

    if (success) {
      setState(() {
        _isLive = true;
        _elapsedSeconds = 0;
      });

      // Start elapsed broadcast timer
      _durationTimer?.cancel();
      _durationTimer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted && _isLive) {
          setState(() => _elapsedSeconds++);
        }
      });

      // Start periodic viewer sync
      _syncTimer?.cancel();
      _syncTimer = Timer.periodic(const Duration(seconds: 12), (_) {
        if (mounted && _isLive) {
          _sessionManager.refreshStudioSession(
            roomId: widget.setupResult.roomId,
          );
        }
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You are now LIVE on Popo Live! 🚀'),
          backgroundColor: Color(0xFF00C853),
          duration: Duration(seconds: 2),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _sessionManager.errorMessage ?? 'Failed to start live broadcast.',
          ),
          backgroundColor: PopoTheme.primary,
        ),
      );
    }
  }

  Future<void> _toggleCamera() async {
    final nextState = !_isCameraOn;
    await _sessionManager.muteVideo(!nextState);
    if (!mounted) return;
    setState(() => _isCameraOn = nextState);
  }

  Future<void> _toggleMic() async {
    final nextState = !_isMicOn;
    await _sessionManager.muteAudio(!nextState);
    if (!mounted) return;
    setState(() => _isMicOn = nextState);
  }

  Future<void> _flipCamera() async {
    await _sessionManager.switchCamera();
    if (!mounted) return;
    setState(() => _isFrontCamera = _rtcService.isFrontCamera);
  }

  void _confirmEndLive() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Row(
          children: const [
            Icon(
              Icons.warning_amber_rounded,
              color: PopoTheme.primary,
              size: 24,
            ),
            SizedBox(width: 10),
            Text(
              'End Broadcast?',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        content: Text(
          _isLive
              ? 'Are you sure you want to end your live stream? Viewers will be notified and your session stats will be calculated.'
              : 'Leave Host Studio? Your staged configuration is saved.',
          style: const TextStyle(
            color: PopoTheme.textSecondary,
            fontSize: 14,
            height: 1.35,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Cancel',
              style: TextStyle(color: PopoTheme.textSecondary),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: PopoTheme.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              if (_isLive) {
                _executeEndLive();
              } else {
                Navigator.pop(context);
              }
            },
            child: Text(
              _isLive ? 'End Stream' : 'Exit Studio',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _executeEndLive() async {
    setState(() => _isEnding = true);
    _durationTimer?.cancel();
    _syncTimer?.cancel();

    final summary = await _sessionManager.endBroadcast();

    if (!mounted) return;
    setState(() {
      _isEnding = false;
      _isLive = false;
    });

    if (summary != null) {
      _showSummaryDialog(summary);
    } else {
      Navigator.pop(context);
    }
  }

  void _showSummaryDialog(LiveEndSummary summary) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: PopoTheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: PopoTheme.gold.withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.emoji_events_rounded,
                color: PopoTheme.gold,
                size: 36,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Broadcast Summary',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Stream ended successfully',
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1B1B28),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: PopoTheme.borderSubtle, width: 1),
              ),
              child: Column(
                children: [
                  _buildSummaryMetricRow(
                    icon: Icons.timer_outlined,
                    label: 'Stream Duration',
                    value: summary.durationFormatted.isNotEmpty
                        ? summary.durationFormatted
                        : _formattedDuration,
                    valueColor: Colors.white,
                  ),
                  const Divider(color: PopoTheme.borderSubtle, height: 18),
                  _buildSummaryMetricRow(
                    icon: Icons.people_outline_rounded,
                    label: 'Peak Viewers',
                    value: summary.peakViewersFormatted.isNotEmpty
                        ? summary.peakViewersFormatted
                        : '${summary.peakViewers}',
                    valueColor: PopoTheme.cyan,
                  ),
                  const Divider(color: PopoTheme.borderSubtle, height: 18),
                  _buildSummaryMetricRow(
                    icon: Icons.diamond_outlined,
                    label: 'Diamonds Earned',
                    value: '+${summary.pointsReceivedFormatted}',
                    valueColor: PopoTheme.gold,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            PopoPrimaryButton(
              text: 'Back to Home',
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryMetricRow({
    required IconData icon,
    required String label,
    required String value,
    required Color valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, color: PopoTheme.textSecondary, size: 18),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 13,
              ),
            ),
          ],
        ),
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final session = widget.setupResult;
    final liveSession = _sessionManager.currentSession;
    final viewerCountStr = liveSession?.viewerDisplay ?? '1.8K';

    return WillPopScope(
      onWillPop: () async {
        _confirmEndLive();
        return false;
      },
      child: Scaffold(
        backgroundColor: PopoTheme.background,
        body: Stack(
          children: [
            // 1. Camera Viewfinder Canvas
            Positioned.fill(child: _buildCameraPreviewArea()),

            // 2. Top Protection Gradient
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 180,
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

            // 3. Bottom Protection Gradient
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              height: 260,
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
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Host Profile Badge
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: PopoTheme.surface.withOpacity(0.85),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: _isLive
                              ? PopoTheme.primary
                              : PopoTheme.gold.withOpacity(0.5),
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: PopoTheme.primary,
                            child: Text(
                              session.hostNickname.isNotEmpty
                                  ? session.hostNickname[0].toUpperCase()
                                  : 'H',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                session.hostNickname,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
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
                                    child: const Text(
                                      'Lv.5',
                                      style: TextStyle(
                                        color: Colors.black,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'ID: ${session.roomNumber.isNotEmpty ? session.roomNumber : "880219"}',
                                    style: const TextStyle(
                                      color: PopoTheme.textSecondary,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(width: 10),
                        ],
                      ),
                    ),
                    const Spacer(),

                    // Live Badge / Duration / Viewers
                    if (_isLive) ...[
                      // Pulsating LIVE Pill
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE50914),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFE50914).withOpacity(0.4),
                              blurRadius: 8,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              _formattedDuration,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Viewer Count
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.55),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.15),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.remove_red_eye_rounded,
                              color: Colors.white,
                              size: 14,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              viewerCountStr,
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

                      // Network Quality Indicator
                      _buildNetworkQualityIndicator(),
                    ] else ...[
                      // Pre-Live Preview Pill
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
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
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFF00C853),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Text(
                              'PREVIEW',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(width: 8),

                    // End Live / Exit Button
                    Container(
                      decoration: BoxDecoration(
                        color: _isLive
                            ? PopoTheme.primary
                            : Colors.black.withOpacity(0.4),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: Icon(
                          _isLive
                              ? Icons.call_end_rounded
                              : Icons.close_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                        onPressed: _confirmEndLive,
                        tooltip: _isLive ? 'End Broadcast' : 'Exit Studio',
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 6. Right Media Control Toolbar
            Positioned(
              right: 16,
              top: 130,
              child: Column(
                children: [
                  _buildToolButton(
                    icon: _isFrontCamera
                        ? Icons.flip_camera_ios_rounded
                        : Icons.flip_camera_android_rounded,
                    label: 'Flip',
                    onTap: _flipCamera,
                  ),
                  const SizedBox(height: 16),
                  _buildToolButton(
                    icon: _isCameraOn
                        ? Icons.videocam_rounded
                        : Icons.videocam_off_rounded,
                    label: _isCameraOn ? 'Cam On' : 'Cam Off',
                    isActive: _isCameraOn,
                    onTap: _toggleCamera,
                  ),
                  const SizedBox(height: 16),
                  _buildToolButton(
                    icon: _isMicOn ? Icons.mic_rounded : Icons.mic_off_rounded,
                    label: _isMicOn ? 'Mic On' : 'Muted',
                    isActive: _isMicOn,
                    onTap: _toggleMic,
                  ),
                  const SizedBox(height: 16),
                  _buildToolButton(
                    icon: Icons.auto_awesome_rounded,
                    label: 'Beauty',
                    isActive: true,
                    activeColor: PopoTheme.gold,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Beauty filters active (Level 3 natural)',
                          ),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            // 7. Bottom Broadcast Details & Action
            Positioned(
              left: 16,
              right: 16,
              bottom: 24,
              child: SafeArea(
                top: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Stream Details Pill
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: PopoTheme.surface.withOpacity(0.85),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: PopoTheme.borderSubtle,
                          width: 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: PopoTheme.primary.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: PopoTheme.primary,
                                    width: 0.8,
                                  ),
                                ),
                                child: Text(
                                  session.category,
                                  style: const TextStyle(
                                    color: PopoTheme.primary,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _isLive ? 'BROADCASTING' : 'READY TO GO LIVE',
                                style: TextStyle(
                                  color: _isLive
                                      ? const Color(0xFF00C853)
                                      : PopoTheme.textSecondary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            session.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (session.tags.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 6,
                              children: session.tags
                                  .map(
                                    (tag) => Text(
                                      tag,
                                      style: const TextStyle(
                                        color: PopoTheme.cyan,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Primary Action: Start Live (if not live) or End Live (if live)
                    if (!_isLive)
                      PopoPrimaryButton(
                        text: 'Go Live Now',
                        isLoading: _isConnecting,
                        onPressed: _startBroadcasting,
                      )
                    else
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE50914),
                          foregroundColor: Colors.white,
                          minimumSize: const Size.fromHeight(50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 4,
                        ),
                        onPressed: _isEnding ? null : _confirmEndLive,
                        icon: _isEnding
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Icon(Icons.call_end_rounded, size: 20),
                        label: Text(
                          _isEnding ? 'Ending Broadcast...' : 'End Live Stream',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
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

  Widget _buildNetworkQualityIndicator() {
    Color barColor;
    int activeBars;
    switch (_networkQuality) {
      case 1:
        barColor = const Color(0xFF00C853); // Green
        activeBars = 3;
        break;
      case 2:
        barColor = PopoTheme.gold; // Yellow
        activeBars = 2;
        break;
      default:
        barColor = PopoTheme.primary; // Red
        activeBars = 1;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.55),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: List.generate(3, (index) {
          final isBarActive = index < activeBars;
          return Container(
            width: 3,
            height: (index + 1) * 3.5,
            margin: const EdgeInsets.symmetric(horizontal: 1),
            decoration: BoxDecoration(
              color: isBarActive ? barColor : Colors.white24,
              borderRadius: BorderRadius.circular(1),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildCameraPreviewArea() {
    if (!_isCameraOn) {
      return Container(
        color: const Color(0xFF101018),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(
                Icons.videocam_off_rounded,
                color: PopoTheme.textSecondary,
                size: 56,
              ),
              SizedBox(height: 12),
              Text(
                'Camera is Muted',
                style: TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Tap the camera icon on the right to turn video back on',
                style: TextStyle(color: PopoTheme.textSecondary, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E1E2E), Color(0xFF12121C), Color(0xFF0A0A10)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: PopoTheme.surface.withOpacity(0.6),
                shape: BoxShape.circle,
                border: Border.all(
                  color: _isLive
                      ? PopoTheme.primary
                      : PopoTheme.cyan.withOpacity(0.4),
                  width: 2,
                ),
              ),
              child: Icon(
                _isFrontCamera
                    ? Icons.camera_front_rounded
                    : Icons.camera_rear_rounded,
                color: _isLive ? PopoTheme.primary : PopoTheme.cyan,
                size: 48,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _isLive
                  ? 'Live Camera Stream Active'
                  : (_isFrontCamera
                        ? 'Front Camera Preview'
                        : 'Rear Camera Preview'),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _isLive
                  ? 'Broadcasting video track @ 720p 30fps'
                  : 'Hardware video capture preview active',
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToolButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isActive = true,
    Color? activeColor,
  }) {
    final color = isActive
        ? (activeColor ?? PopoTheme.cyan)
        : PopoTheme.textSecondary;

    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.6),
              shape: BoxShape.circle,
              border: Border.all(color: color.withOpacity(0.6), width: 1.5),
            ),
            child: Icon(icon, color: color, size: 22),
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
    );
  }
}
