import 'package:flutter/material.dart';
import '../../../models/pk/pk_models.dart';
import '../../../services/pk/pk_session_manager.dart';
import '../../../theme/popo_theme.dart';

/// 1v1 Split-Screen PK Battle Interface
/// Strictly implements ONE HOST VS ONE HOST
/// Four-host PK remains completely disabled and unexposed.
class PkBattleLayoutWidget extends StatelessWidget {
  final PkBattle battle;
  final String currentHostId;
  final Widget? localVideoView;
  final Widget? remoteVideoView;
  final VoidCallback? onExitBattle;

  const PkBattleLayoutWidget({
    Key? key,
    required this.battle,
    required this.currentHostId,
    this.localVideoView,
    this.remoteVideoView,
    this.onExitBattle,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Determine whether local host is Host A or Host B
    final isHostA = battle.isHostA(currentHostId);
    final hostA = battle.hostA;
    final hostB = battle.hostB;

    // Local host view goes to their respective side
    final hostAWidget = isHostA ? localVideoView : remoteVideoView;
    final hostBWidget = isHostA ? remoteVideoView : localVideoView;

    return AnimatedBuilder(
      animation: PkSessionManager.instance,
      builder: (context, _) {
        final isPreparing = PkSessionManager.instance.state == PkState.preparing;
        final prepSeconds = PkSessionManager.instance.prepSecondsRemaining;

        return Stack(
          children: [
            // 1. Two-Host Split Screen Layout (Left: Host A, Right: Host B)
            Row(
              children: [
                // Host A Viewport (Primary Pink Side)
                Expanded(
                  child: _buildHostViewport(
                    context: context,
                    participant: hostA,
                    isLocal: isHostA,
                    accentColor: PopoTheme.primary,
                    sideLabel: 'HOST A',
                    videoWidget: hostAWidget,
                  ),
                ),

                // Vertical Divider
                Container(
                  width: 2,
                  color: Colors.black.withOpacity(0.6),
                ),

                // Host B Viewport (Electric Cyan Side)
                Expanded(
                  child: _buildHostViewport(
                    context: context,
                    participant: hostB,
                    isLocal: !isHostA,
                    accentColor: PopoTheme.cyan,
                    sideLabel: 'HOST B',
                    videoWidget: hostBWidget,
                  ),
                ),
              ],
            ),

            // 2. Central Glowing "VS" Crest
            Center(
              child: _buildVsCrest(isPreparing: isPreparing),
            ),

            // 3. Top PK Battle Preparation / Status Header
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: PopoTheme.background.withOpacity(0.85),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isPreparing ? PopoTheme.gold : PopoTheme.primary,
                      width: 1.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: (isPreparing ? PopoTheme.gold : PopoTheme.primary).withOpacity(0.2),
                        blurRadius: 12,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          gradient: isPreparing
                              ? const LinearGradient(colors: [PopoTheme.gold, Colors.deepOrange])
                              : PopoTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          isPreparing ? 'PREPARATION' : '1v1 BATTLE',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          isPreparing
                              ? 'Battle Starts in 00:0$prepSeconds'
                              : '1v1 PK Active • Send Gifts to Support!',
                          style: TextStyle(
                            color: isPreparing ? PopoTheme.gold : Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (onExitBattle != null)
                        InkWell(
                          onTap: onExitBattle,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close_rounded,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),

            // 4. Initial Balanced Score Bar (50/50 Initial State)
            Positioned(
              top: 85,
              left: 20,
              right: 20,
              child: _buildInitialScoreBar(hostA: hostA, hostB: hostB),
            ),
          ],
        );
      },
    );
  }

  /// Builds individual host video viewport with HUD overlays
  Widget _buildHostViewport({
    required BuildContext context,
    required PkParticipant participant,
    required bool isLocal,
    required Color accentColor,
    required String sideLabel,
    required Widget? videoWidget,
  }) {
    return Container(
      color: PopoTheme.background,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video Layer (or Placeholder Avatar if stream loading)
          if (videoWidget != null)
            videoWidget
          else
            _buildVideoPlaceholder(participant: participant, accentColor: accentColor),

          // Gradient overlay for bottom text contrast
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 120,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withOpacity(0.0),
                    Colors.black.withOpacity(0.85),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),

          // Side Label Badge (Top-left / Top-right)
          Positioned(
            top: 50,
            left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: accentColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: accentColor, width: 0.8),
              ),
              child: Text(
                sideLabel,
                style: TextStyle(
                  color: accentColor,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),

          // Bottom Host Info (Nickname, Room, Score)
          Positioned(
            left: 10,
            right: 10,
            bottom: 12,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Score Box
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: accentColor, width: 1),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.diamond_rounded, color: PopoTheme.gold, size: 13),
                      const SizedBox(width: 4),
                      Text(
                        '${participant.score}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),

                // Host Nickname & Local Badge
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        participant.nickname,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isLocal) ...[
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: PopoTheme.primary,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'YOU',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  'Room #${participant.roomNumber}',
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Placeholder when video stream is connecting
  Widget _buildVideoPlaceholder({
    required PkParticipant participant,
    required Color accentColor,
  }) {
    return Container(
      color: PopoTheme.surface,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: accentColor, width: 2),
              ),
              child: CircleAvatar(
                radius: 36,
                backgroundColor: PopoTheme.surfaceLight,
                backgroundImage: participant.avatar.isNotEmpty
                    ? NetworkImage(participant.avatar)
                    : null,
                child: participant.avatar.isEmpty
                    ? Text(
                        participant.nickname.isNotEmpty
                            ? participant.nickname[0].toUpperCase()
                            : 'H',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : null,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              participant.nickname,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 10,
                  height: 10,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    color: accentColor,
                  ),
                ),
                const SizedBox(width: 6),
                const Text(
                  'Connecting Stream...',
                  style: TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Animated central VS crest
  Widget _buildVsCrest({required bool isPreparing}) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [PopoTheme.primary, Color(0xFF7B1FA2), PopoTheme.cyan],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: PopoTheme.primary.withOpacity(0.5),
            blurRadius: 16,
            spreadRadius: 2,
          ),
        ],
        border: Border.all(color: Colors.white, width: 2),
      ),
      child: const Center(
        child: Text(
          'VS',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w900,
            fontStyle: FontStyle.italic,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }

  /// Initial balanced 50/50 score bar
  Widget _buildInitialScoreBar({
    required PkParticipant hostA,
    required PkParticipant hostB,
  }) {
    return Container(
      height: 18,
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withOpacity(0.15), width: 1),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Row(
          children: [
            // Left Half: Host A Score (Pink)
            Expanded(
              child: Container(
                color: PopoTheme.primary,
                alignment: Alignment.centerLeft,
                padding: const EdgeInsets.only(left: 8),
                child: Text(
                  '${hostA.score}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            // Right Half: Host B Score (Cyan)
            Expanded(
              child: Container(
                color: PopoTheme.cyan,
                alignment: Alignment.centerRight,
                padding: const EdgeInsets.only(right: 8),
                child: Text(
                  '${hostB.score}',
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 10,
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
}
