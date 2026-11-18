import 'package:flutter/material.dart';

import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';

/// Screen 4/4 of PK Battle Flow: PK Result & Winner Declaration
/// Implemented for Phase 3 (D2) Prompt 4 according to Popo Live Complete Product Design v1.1.
/// Features:
/// - Winner and loser cards with fixture avatars and nicknames
/// - Winner indicator with golden celebration trophy and laurels
/// - Final scores comparison for both broadcaster sides
/// - Tie / Draw handling when scores are equal
/// - Battle duration presentation
/// - Return to Live Viewer button preserving original live room context
class PkResultScreen extends StatelessWidget {
  final FixtureLiveRoom hostARoom;
  final FixtureLiveRoom hostBRoom;
  final FixtureLiveRoom winnerRoom;
  final FixtureLiveRoom loserRoom;
  final int winnerScore;
  final int loserScore;
  final int scoreA;
  final int scoreB;
  final bool isTie;
  final String duration;

  const PkResultScreen({
    super.key,
    required this.hostARoom,
    required this.hostBRoom,
    required this.winnerRoom,
    required this.loserRoom,
    required this.winnerScore,
    required this.loserScore,
    required this.scoreA,
    required this.scoreB,
    this.isTie = false,
    this.duration = '03:00',
  });

  String _formatScore(int score) {
    return score.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
  }

  void _returnToLiveViewer(BuildContext context) {
    // Pop back to the Live Room Viewer, preserving current room context
    Navigator.of(context).popUntil((route) {
      return route.settings.name == 'ViewerRoom' || route.isFirst;
    });
  }

  @override
  Widget build(BuildContext context) {
    final winnerIsHostA = winnerRoom.id == hostARoom.id;

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 10),

              // Result Banner (VICTORY or DRAW)
              if (isTie) ...[
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  decoration: BoxDecoration(
                    color: PopoTheme.cyan.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                    border:
                        Border.all(color: PopoTheme.cyan.withOpacity(0.6)),
                  ),
                  child: const Text(
                    '🤝 DRAW / TIED BATTLE',
                    key: Key('pk_result_badge'),
                    style: TextStyle(
                      color: PopoTheme.cyan,
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
              ] else ...[
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFFB800), Color(0xFFFF8A00)],
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: PopoTheme.gold.withOpacity(0.4),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.emoji_events_rounded,
                          color: Colors.black, size: 22),
                      SizedBox(width: 8),
                      Text(
                        'VICTORY',
                        key: Key('pk_result_badge'),
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),

              Text(
                isTie
                    ? 'Both Broadcasters Finished Equal!'
                    : '${winnerRoom.hostNickname} Won the PK Faceoff!',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                'Battle Duration: $duration · Standard 1v1 Arena',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 24),

              // Winner Showcase Card
              if (!isTie)
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F1528),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: PopoTheme.gold,
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: PopoTheme.gold.withOpacity(0.2),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.star_rounded,
                              color: PopoTheme.gold, size: 20),
                          SizedBox(width: 6),
                          Text(
                            'PK CHAMPION',
                            style: TextStyle(
                              color: PopoTheme.gold,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.0,
                            ),
                          ),
                          SizedBox(width: 6),
                          Icon(Icons.star_rounded,
                              color: PopoTheme.gold, size: 20),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Stack(
                        alignment: Alignment.topRight,
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: PopoTheme.gold,
                            child: CircleAvatar(
                              radius: 37,
                              backgroundImage:
                                  NetworkImage(winnerRoom.hostAvatar),
                              onBackgroundImageError: (_, __) {},
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: PopoTheme.gold,
                            ),
                            child: const Icon(
                              Icons.emoji_events_rounded,
                              color: Colors.black,
                              size: 16,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        winnerRoom.hostNickname,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Winning Score: ${_formatScore(winnerScore)} pts',
                        style: const TextStyle(
                          color: PopoTheme.gold,
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 20),

              // Final Score Comparison Grid
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: PopoTheme.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: PopoTheme.borderSubtle),
                ),
                child: Column(
                  children: [
                    const Text(
                      'SCORE BREAKDOWN',
                      style: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 11,
                        letterSpacing: 0.8,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        // Host A
                        Expanded(
                          child: Column(
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundImage:
                                    NetworkImage(hostARoom.hostAvatar),
                                onBackgroundImageError: (_, __) {},
                              ),
                              const SizedBox(height: 6),
                              Text(
                                hostARoom.hostNickname,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _formatScore(scoreA),
                                style: const TextStyle(
                                  color: PopoTheme.primary,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              if (!isTie && winnerIsHostA)
                                const Text(
                                  'WINNER',
                                  style: TextStyle(
                                    color: PopoTheme.gold,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Container(
                          height: 60,
                          width: 1,
                          color: Colors.white12,
                        ),
                        // Host B
                        Expanded(
                          child: Column(
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundImage:
                                    NetworkImage(hostBRoom.hostAvatar),
                                onBackgroundImageError: (_, __) {},
                              ),
                              const SizedBox(height: 6),
                              Text(
                                hostBRoom.hostNickname,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _formatScore(scoreB),
                                style: const TextStyle(
                                  color: PopoTheme.cyan,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              if (!isTie && !winnerIsHostA)
                                const Text(
                                  'WINNER',
                                  style: TextStyle(
                                    color: PopoTheme.gold,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Safe Demonstration Disclaimer
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.verified_user_outlined,
                        color: PopoTheme.cyan, size: 16),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Fixture PK Battle Result: All battle points and results are simulated locally using Popo Live fixture engine. No real monetary transactions occurred.',
                        style: TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 11,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // Return to Live Viewer Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  key: const Key('return_to_live_viewer_button'),
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: () => _returnToLiveViewer(context),
                  child: Ink(
                    decoration: BoxDecoration(
                      gradient: PopoTheme.primaryGradient,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Container(
                      alignment: Alignment.center,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.live_tv_rounded,
                              color: Colors.white, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Return to Live Viewer',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
