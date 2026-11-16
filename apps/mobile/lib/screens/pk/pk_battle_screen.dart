import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/pk/pk_models.dart';
import '../../services/live/agora_rtc_service.dart';
import '../../services/pk/pk_session_manager.dart';
import '../../theme/popo_theme.dart';
import '../../widgets/widgets.dart';
import 'widgets/pk_gift_sheet_dialog.dart';
import 'widgets/pk_gift_animation_overlay.dart';
import 'pk_result_screen.dart';
import '../gifts/widgets/gift_animation_banner.dart';

/// 1v1 PK Battle Screen
/// Implements Section 10 of Phase 3 Prompt 02/08
/// Features:
/// - Exact 1v1 two-host split-screen layout (Pink #FF1768 vs Cyan #00E5FF)
/// - Server-authoritative live countdown timer with warning states
/// - Real-time score synchronization & dynamic 15%-85% progress bar
/// - Live Agora video streams & connection/reconnection recovery
/// - Voluntary surrender and exit confirmation workflows
/// - Full bilingual English/Urdu and RTL compatibility
class PkBattleScreen extends StatefulWidget {
  final PkBattle battle;
  final String currentHostId;
  final Widget? localVideoView;
  final VoidCallback? onExitBattle;

  const PkBattleScreen({
    Key? key,
    required this.battle,
    required this.currentHostId,
    this.localVideoView,
    this.onExitBattle,
  }) : super(key: key);

  @override
  State<PkBattleScreen> createState() => _PkBattleScreenState();
}

class _PkBattleScreenState extends State<PkBattleScreen>
    with SingleTickerProviderStateMixin {
  final PkSessionManager _manager = PkSessionManager.instance;
  final AgoraRtcService _rtcService = AgoraRtcService.instance;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  bool _isUrdu = false;
  bool _isCameraMuted = false;
  bool _isMicMuted = false;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _isCameraMuted = _rtcService.isVideoMuted;
    _isMicMuted = _rtcService.isAudioMuted;

    // Attach manager listener
    _manager.addListener(_handleManagerUpdate);

    // Initial score/timer sync
    _manager.syncScoreTimer(widget.battle.id);

    // Initial gift catalog & wallet balance
    _manager.loadGiftCatalog(widget.battle.id);
    _manager.loadWallet(battleId: widget.battle.id, userId: widget.currentHostId);
  }

  @override
  void dispose() {
    _manager.removeListener(_handleManagerUpdate);
    _pulseController.dispose();
    super.dispose();
  }

  void _handleManagerUpdate() {
    if (!mounted) return;
    setState(() {});

    // Check if battle finalized and result available
    if (_manager.battleResult != null) {
      _showBattleResultModal(_manager.battleResult!);
    }
  }

  Future<void> _toggleMic() async {
    final next = !_isMicMuted;
    await _rtcService.muteLocalAudio(next);
    if (!mounted) return;
    setState(() => _isMicMuted = next);
  }

  Future<void> _toggleCamera() async {
    final next = !_isCameraMuted;
    await _rtcService.muteLocalVideo(next);
    if (!mounted) return;
    setState(() => _isCameraMuted = next);
  }

  Future<void> _flipCamera() async {
    await _rtcService.switchCamera();
  }

  Future<void> _confirmSurrender() async {
    final isUrdu = _isUrdu;
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF161622),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.flag_rounded, color: Color(0xFFFFB800), size: 24),
            const SizedBox(width: 10),
            Text(
              isUrdu ? 'کیا آپ ہتھیار ڈالنا چاہتے ہیں؟' : 'Surrender PK Battle?',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        content: Text(
          isUrdu
              ? 'ہتھیار ڈالنے سے موجودہ اسکور پر مقابلہ ختم ہو جائے گا اور حریف کو فاتح قرار دیا جائے گا۔'
              : 'Surrendering will end the PK battle at the current scores and declare your opponent the winner.',
          style: const TextStyle(
            color: Color(0xFF9E9EB2),
            fontSize: 14,
            height: 1.4,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              isUrdu ? 'منسوخ کریں' : 'Cancel',
              style: const TextStyle(color: Color(0xFF9E9EB2), fontWeight: FontWeight.w600),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF1768),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              isUrdu ? 'ہتھیار ڈالیں' : 'Surrender',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final ok = await _manager.surrenderBattle();
      if (ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isUrdu ? 'پی کے مقابلہ ختم ہو گیا۔' : 'PK battle ended via surrender.'),
            backgroundColor: const Color(0xFF161622),
          ),
        );
        if (widget.onExitBattle != null) {
          widget.onExitBattle!();
        } else {
          Navigator.of(context).pop();
        }
      }
    }
  }

  void _showBattleResultModal(PkBattleResult result) {
    final isHostA = widget.battle.isHostA(widget.currentHostId);
    final myHostId = widget.currentHostId;
    final isWinner = result.isWinner(myHostId);
    final isDraw = result.isDraw();

    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Color(0xFF161622),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          boxShadow: [
            BoxShadow(
              color: Colors.black87,
              blurRadius: 30,
              spreadRadius: 10,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Winner Emblem
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: isDraw
                      ? [const Color(0xFF9E9EB2), const Color(0xFF6B6B80)]
                      : isWinner
                          ? [const Color(0xFFFFB800), const Color(0xFFFF8C00)]
                          : [const Color(0xFFFF1768), const Color(0xFFB00020)],
                ),
              ),
              child: Icon(
                isDraw
                    ? Icons.balance_rounded
                    : isWinner
                        ? Icons.emoji_events_rounded
                        : Icons.sentiment_dissatisfied_rounded,
                color: Colors.white,
                size: 40,
              ),
            ),
            const SizedBox(height: 16),

            // Result Title
            Text(
              isDraw
                  ? (_isUrdu ? 'مقابلہ برابر رہا! 🤝' : 'IT\'S A TIE! 🤝')
                  : isWinner
                      ? (_isUrdu ? 'مبارک ہو! آپ جیت گئے! 🏆' : 'VICTORY! YOU WON! 🏆')
                      : (_isUrdu ? 'آپ ہار گئے! اگلی بار بہتر ہوگا 💔' : 'DEFEAT! BETTER LUCK NEXT TIME 💔'),
              style: TextStyle(
                color: isWinner ? const Color(0xFFFFB800) : Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),

            // Scores Summary Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0D0D12),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white12, width: 1),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  // Host A Side
                  Column(
                    children: [
                      Text(
                        result.hostANickname,
                        style: const TextStyle(
                          color: Color(0xFFFF1768),
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${result.hostAScore}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const Text(
                    'VS',
                    style: TextStyle(
                      color: Color(0xFFFFB800),
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  // Host B Side
                  Column(
                    children: [
                      Text(
                        result.hostBNickname,
                        style: const TextStyle(
                          color: Color(0xFF00E5FF),
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${result.hostBScore}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // View Detailed Result Screen
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFFFB800),
                  side: const BorderSide(color: Color(0xFFFFB800), width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PKResultScreen(
                        battleId: widget.battle.id,
                        initialResult: result,
                        onClose: () {
                          Navigator.pop(context);
                          if (widget.onExitBattle != null) {
                            widget.onExitBattle!();
                          } else {
                            Navigator.of(context).pop();
                          }
                        },
                      ),
                    ),
                  );
                },
                child: Text(
                  _isUrdu ? 'تفصیلی نتیجہ دیکھیں 🏅' : 'View Full Result 🏅',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Exit Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF1768),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  _manager.cleanupBattle();
                  if (widget.onExitBattle != null) {
                    widget.onExitBattle!();
                  } else {
                    Navigator.of(context).pop();
                  }
                },
                child: Text(
                  _isUrdu ? 'واپس براڈکاسٹ پر جائیں' : 'Return to Broadcaster',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isHostA = widget.battle.isHostA(widget.currentHostId);
    final hostA = widget.battle.hostA;
    final hostB = widget.battle.hostB;

    final scoreA = _manager.scoreA;
    final scoreB = _manager.scoreB;
    final ratioA = _manager.ratioA;
    final ratioB = _manager.ratioB;
    final formattedTime = _manager.battleFormattedTime;
    final timerStatus = _manager.timerStatus;
    final isWarning = timerStatus == 'warning_60s' || timerStatus == 'warning_10s';

    // Local vs remote video assignment
    final hostAWidget = isHostA ? widget.localVideoView : _buildRemoteVideoViewport(hostA);
    final hostBWidget = isHostA ? _buildRemoteVideoViewport(hostB) : widget.localVideoView;

    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFF0D0D12),
        body: Stack(
          children: [
            // 1. Two-Host 50/50 Split Viewport
            Row(
              children: [
                // Host A Viewport (Pink Side)
                Expanded(
                  child: _buildHostViewport(
                    participant: hostA,
                    isLocal: isHostA,
                    accentColor: const Color(0xFFFF1768),
                    sideLabel: 'HOST A',
                    score: scoreA,
                    videoWidget: hostAWidget,
                  ),
                ),

                // Vertical Divider
                Container(
                  width: 2,
                  color: Colors.black.withOpacity(0.6),
                ),

                // Host B Viewport (Cyan Side)
                Expanded(
                  child: _buildHostViewport(
                    participant: hostB,
                    isLocal: !isHostA,
                    accentColor: const Color(0xFF00E5FF),
                    sideLabel: 'HOST B',
                    score: scoreB,
                    videoWidget: hostBWidget,
                  ),
                ),
              ],
            ),

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
              height: 160,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withOpacity(0.0),
                      Colors.black.withOpacity(0.9),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
            ),

            // 4. Center Glowing "VS" Crest
            Center(
              child: ScaleTransition(
                scale: _pulseAnimation,
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF1768), Color(0xFF00E5FF)],
                    ),
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF1768).withOpacity(0.6),
                        blurRadius: 16,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'VS',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // 5. Top Header HUD: Score Progress Bar & Server-Authoritative Timer
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Top Bar: Back/Surrender, Title, Language Toggle
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white, size: 20),
                          onPressed: _confirmSurrender,
                          tooltip: 'Surrender / Exit',
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF1768).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFFF1768), width: 0.8),
                          ),
                          child: const Text(
                            '1v1 PK',
                            style: TextStyle(
                              color: Color(0xFFFF1768),
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        const Spacer(),

                        // Reconnection Indicator
                        if (_manager.isReconnecting)
                          Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.8),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: const [
                                SizedBox(
                                  width: 10,
                                  height: 10,
                                  child: CircularProgressIndicator(strokeWidth: 1.5, color: Colors.white),
                                ),
                                SizedBox(width: 5),
                                Text(
                                  'Syncing...',
                                  style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),

                        // Urdu Toggle Pill
                        GestureDetector(
                          onTap: () => setState(() => _isUrdu = !_isUrdu),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white12,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              _isUrdu ? 'EN' : 'اردو',
                              style: const TextStyle(
                                color: Color(0xFFFFB800),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 8),

                    // Synchronized Countdown Timer Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                      decoration: BoxDecoration(
                        color: isWarning
                            ? (timerStatus == 'warning_10s' ? const Color(0xFFFF1768) : const Color(0xFFFFB800))
                            : Colors.black.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: isWarning ? Colors.white : const Color(0xFFFFB800).withOpacity(0.5),
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.timer_outlined,
                            size: 14,
                            color: isWarning ? Colors.white : const Color(0xFFFFB800),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            formattedTime,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Dynamic 15%-85% Score Comparison Bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        height: 24,
                        decoration: BoxDecoration(
                          color: const Color(0xFF161622),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            // Host A Ratio Fill (Pink)
                            Expanded(
                              flex: ratioA.toInt(),
                              child: Container(
                                color: const Color(0xFFFF1768),
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  '$scoreA',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ),

                            // Host B Ratio Fill (Cyan)
                            Expanded(
                              flex: ratioB.toInt(),
                              child: Container(
                                color: const Color(0xFF00E5FF),
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                alignment: Alignment.centerRight,
                                child: Text(
                                  '$scoreB',
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w900,
                                  ),
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
            ),

            // 6. Real-Time Floating Gift Animation Overlay (Non-blocking)
            const Positioned.fill(
              child: PkGiftAnimationOverlay(),
            ),
            const Positioned.fill(
              child: GiftAnimationBanner(),
            ),

            // 7. Bottom Controls Toolbar
            Positioned(
              left: 16,
              right: 16,
              bottom: 24,
              child: SafeArea(
                top: false,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // Mute Mic Button
                    _buildRoundButton(
                      icon: _isMicMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
                      label: _isMicMuted ? 'Muted' : 'Mic',
                      color: _isMicMuted ? const Color(0xFFFF1768) : const Color(0xFF00E5FF),
                      onTap: _toggleMic,
                    ),

                    // Mute Camera Button
                    _buildRoundButton(
                      icon: _isCameraMuted ? Icons.videocam_off_rounded : Icons.videocam_rounded,
                      label: _isCameraMuted ? 'Cam Off' : 'Cam',
                      color: _isCameraMuted ? const Color(0xFFFF1768) : const Color(0xFF00E5FF),
                      onTap: _toggleCamera,
                    ),

                    // Send Gift Button
                    _buildRoundButton(
                      icon: Icons.volunteer_activism_rounded,
                      label: _isUrdu ? 'تحفہ' : 'Gift',
                      color: const Color(0xFFFFB800),
                      onTap: () => PkGiftSheetDialog.show(
                        context: context,
                        battle: widget.battle,
                        senderId: widget.currentHostId,
                        senderName: widget.battle.isHostA(widget.currentHostId)
                            ? widget.battle.hostA.nickname
                            : widget.battle.hostB.nickname,
                      ),
                    ),

                    // Flip Camera
                    _buildRoundButton(
                      icon: Icons.flip_camera_ios_rounded,
                      label: 'Flip',
                      color: Colors.white,
                      onTap: _flipCamera,
                    ),

                    // Surrender Action
                    _buildRoundButton(
                      icon: Icons.flag_rounded,
                      label: _isUrdu ? 'ہتھیار' : 'Surrender',
                      color: const Color(0xFFFF1768),
                      onTap: _confirmSurrender,
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

  Widget _buildHostViewport({
    required PkParticipant participant,
    required bool isLocal,
    required Color accentColor,
    required String sideLabel,
    required int score,
    required Widget? videoWidget,
  }) {
    return Stack(
      children: [
        // Background Video Viewport
        Positioned.fill(
          child: videoWidget ??
              Container(
                color: const Color(0xFF101018),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircleAvatar(
                        radius: 36,
                        backgroundColor: accentColor.withOpacity(0.2),
                        backgroundImage: participant.avatar.isNotEmpty
                            ? NetworkImage(participant.avatar)
                            : null,
                        child: participant.avatar.isEmpty
                            ? Text(
                                participant.nickname.isNotEmpty
                                    ? participant.nickname[0].toUpperCase()
                                    : 'H',
                                style: TextStyle(
                                  color: accentColor,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        participant.nickname,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
        ),

        // Side Badge & Host Details Header
        Positioned(
          top: 130,
          left: 8,
          right: 8,
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.85),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  sideLabel,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  participant.nickname,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    shadows: [Shadow(color: Colors.black87, blurRadius: 4)],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRemoteVideoViewport(PkParticipant opponent) {
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
            CircleAvatar(
              radius: 40,
              backgroundColor: const Color(0xFF00E5FF).withOpacity(0.2),
              backgroundImage: opponent.avatar.isNotEmpty
                  ? NetworkImage(opponent.avatar)
                  : null,
              child: opponent.avatar.isEmpty
                  ? Text(
                      opponent.nickname.isNotEmpty
                          ? opponent.nickname[0].toUpperCase()
                          : 'O',
                      style: const TextStyle(
                        color: Color(0xFF00E5FF),
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  : null,
            ),
            const SizedBox(height: 12),
            Text(
              opponent.nickname,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
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
                const Text(
                  'Agora RTC Stream Active',
                  style: TextStyle(color: Color(0xFF00C853), fontSize: 11),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoundButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.6),
              shape: BoxShape.circle,
              border: Border.all(color: color.withOpacity(0.6), width: 1.5),
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
    );
  }
}
