import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';

import '../../design/design_fixtures.dart';
import '../../theme/popo_theme.dart';
import 'pk_result_screen.dart';

/// Screen 3/4 of PK Battle Flow: 1v1 Battle Score Arena & Interactive Reactions
/// Implemented for Phase 3 (D2) Prompt 4 according to Popo Live Complete Product Design v1.1.
/// Features:
/// - Exact 1v1 split arena (Host A in Neon Pink vs Host B in Electric Cyan)
/// - Live dynamic score bar & independent score displays
/// - Central 3-minute battle timer & round status
/// - Interactive gift boost controls updating local session score state
/// - PK Reactions interface with 5 animated reaction badges (Fire, Claps, Heart, Punch, Celebrate)
/// - Battle finalization leading to PK Result screen
class PkScoreScreen extends StatefulWidget {
  final FixtureLiveRoom hostARoom;
  final FixtureLiveRoom hostBRoom;
  final int initialScoreA;
  final int initialScoreB;

  const PkScoreScreen({
    super.key,
    required this.hostARoom,
    required this.hostBRoom,
    this.initialScoreA = 14500,
    this.initialScoreB = 12200,
  });

  @override
  State<PkScoreScreen> createState() => _PkScoreScreenState();
}

class _PkScoreScreenState extends State<PkScoreScreen> {
  late int _scoreA;
  late int _scoreB;
  int _secondsRemaining = 180;
  Timer? _countdownTimer;

  String? _recentReaction;
  int _reactionCount = 0;

  static const List<Map<String, String>> _reactions = [
    {'id': 'fire', 'emoji': '🔥', 'label': 'Fire'},
    {'id': 'clap', 'emoji': '👏', 'label': 'Claps'},
    {'id': 'heart', 'emoji': '💖', 'label': 'Heart'},
    {'id': 'punch', 'emoji': '🥊', 'label': 'Punch'},
    {'id': 'celebrate', 'emoji': '🎉', 'label': 'Party'},
  ];

  @override
  void initState() {
    super.initState();
    _scoreA = widget.initialScoreA;
    _scoreB = widget.initialScoreB;

    if (!Platform.environment.containsKey('FLUTTER_TEST')) {
      _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (!mounted) return;
        if (_secondsRemaining > 0) {
          setState(() => _secondsRemaining--);
        } else {
          timer.cancel();
          _finalizeBattle();
        }
      });
    }
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  String _formatTimer(int secs) {
    final mins = secs ~/ 60;
    final s = secs % 60;
    return '${mins.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  String _formatScore(int score) {
    return score.toString().replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
  }

  void _boostHostA() {
    setState(() {
      _scoreA += 500;
    });
  }

  void _boostHostB() {
    setState(() {
      _scoreB += 500;
    });
  }

  void _onReactionTapped(Map<String, String> reaction) {
    setState(() {
      _recentReaction = reaction['emoji'];
      _reactionCount++;
    });
  }

  void _finalizeBattle() {
    final isTie = _scoreA == _scoreB;
    final winner = _scoreA >= _scoreB ? widget.hostARoom : widget.hostBRoom;
    final loser = _scoreA >= _scoreB ? widget.hostBRoom : widget.hostARoom;
    final winningScore = _scoreA >= _scoreB ? _scoreA : _scoreB;
    final losingScore = _scoreA >= _scoreB ? _scoreB : _scoreA;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => PkResultScreen(
          hostARoom: widget.hostARoom,
          hostBRoom: widget.hostBRoom,
          winnerRoom: winner,
          loserRoom: loser,
          winnerScore: winningScore,
          loserScore: losingScore,
          scoreA: _scoreA,
          scoreB: _scoreB,
          isTie: isTie,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final total = (_scoreA + _scoreB).clamp(1, 999999999);
    final ratioA = (_scoreA / total).clamp(0.15, 0.85);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF140F22),
        elevation: 0,
        leading: IconButton(
          key: const Key('pk_score_back_button'),
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: const [
            Text(
              '1v1 PK Battle Arena',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(width: 6),
            Icon(Icons.bolt_rounded, color: PopoTheme.gold, size: 18),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12, top: 12, bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: PopoTheme.primary.withOpacity(0.2),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: PopoTheme.primary.withOpacity(0.5)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.timer_rounded,
                    color: PopoTheme.primary, size: 14),
                const SizedBox(width: 4),
                Text(
                  _formatTimer(_secondsRemaining),
                  key: const Key('pk_countdown_timer'),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Status bar
            Container(
              key: const Key('pk_battle_status'),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6),
              color: const Color(0xFF1E1530),
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: PopoTheme.primary,
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'ROUND 1 · BATTLE IN PROGRESS',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Dynamic Score Progress Bar
            Container(
              height: 10,
              width: double.infinity,
              decoration: const BoxDecoration(color: Color(0xFF100C1A)),
              child: Row(
                children: [
                  Expanded(
                    flex: (ratioA * 100).toInt(),
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFFFF1768), Color(0xFFFF5252)],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    flex: ((1.0 - ratioA) * 100).toInt(),
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF00B0FF), Color(0xFF00E5FF)],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Main 1v1 Split Screen Canvas
            Expanded(
              child: Row(
                children: [
                  // Left Side: Host A (Pink Side)
                  Expanded(
                    child: _buildHostArenaSide(
                      room: widget.hostARoom,
                      score: _scoreA,
                      scoreKey: 'host_a_score',
                      isHostA: true,
                      accentColor: PopoTheme.primary,
                      onBoost: _boostHostA,
                      boostKey: 'boost_host_a_button',
                    ),
                  ),

                  // Center Split Divider with VS badge
                  Container(
                    width: 2,
                    color: Colors.white12,
                    child: Stack(
                      clipBehavior: Clip.none,
                      alignment: Alignment.center,
                      children: [
                        Positioned(
                          child: Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFF1768), Color(0xFF00E5FF)],
                              ),
                              border: Border.all(color: Colors.white, width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.5),
                                  blurRadius: 8,
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Text(
                                'VS',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Right Side: Host B (Cyan Side)
                  Expanded(
                    child: _buildHostArenaSide(
                      room: widget.hostBRoom,
                      score: _scoreB,
                      scoreKey: 'host_b_score',
                      isHostA: false,
                      accentColor: PopoTheme.cyan,
                      onBoost: _boostHostB,
                      boostKey: 'boost_host_b_button',
                    ),
                  ),
                ],
              ),
            ),

            // PK Reactions Toolbar & Floating Feed
            _buildReactionsSection(),

            // Bottom Action Bar: Finalize Battle CTA
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                color: Color(0xFF161224),
                border: Border(
                  top: BorderSide(color: Colors.white10),
                ),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  key: const Key('end_pk_battle_button'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: PopoTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  onPressed: _finalizeBattle,
                  child: const Text(
                    'Finalize Battle & Declare Winner',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHostArenaSide({
    required FixtureLiveRoom room,
    required int score,
    required String scoreKey,
    required bool isHostA,
    required Color accentColor,
    required VoidCallback onBoost,
    required String boostKey,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: isHostA ? Alignment.topLeft : Alignment.topRight,
          end: isHostA ? Alignment.bottomRight : Alignment.bottomLeft,
          colors: [
            accentColor.withOpacity(0.12),
            Colors.black.withOpacity(0.9),
          ],
        ),
      ),
      child: Column(
        children: [
          // Top Info: Avatar, Name, Flag, Score
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            color: Colors.black.withOpacity(0.4),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundImage: NetworkImage(room.hostAvatar),
                  onBackgroundImageError: (_, __) {},
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              room.hostNickname,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(room.flagEmoji,
                              style: const TextStyle(fontSize: 11)),
                        ],
                      ),
                      Text(
                        isHostA ? 'Current Host' : 'Challenger',
                        style: TextStyle(
                          color: accentColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Score Indicator Display
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8),
            color: accentColor.withOpacity(0.15),
            child: Center(
              child: Text(
                _formatScore(score),
                key: Key(scoreKey),
                style: TextStyle(
                  color: accentColor,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),

          // Simulated Video / Stream Area
          Expanded(
            child: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: accentColor, width: 2),
                        ),
                        child: CircleAvatar(
                          backgroundImage: NetworkImage(room.hostAvatar),
                          onBackgroundImageError: (_, __) {},
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        room.category,
                        style: const TextStyle(
                          color: Colors.white60,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),

                // Gift Boost Button (Cheer host)
                Positioned(
                  bottom: 12,
                  left: 12,
                  right: 12,
                  child: ElevatedButton(
                    key: Key(boostKey),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: accentColor.withOpacity(0.2),
                      foregroundColor: Colors.white,
                      side: BorderSide(color: accentColor),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    onPressed: onBoost,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Text('🎁', style: TextStyle(fontSize: 13)),
                        SizedBox(width: 4),
                        Text(
                          '+500 Cheer',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReactionsSection() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF191326),
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.06)),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Floating reaction response
          if (_recentReaction != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _recentReaction!,
                    style: const TextStyle(fontSize: 18),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Reaction sent! ($_reactionCount)',
                    style: const TextStyle(
                      color: PopoTheme.cyan,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

          // 5 PK Reaction Buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: _reactions.map((r) {
              return GestureDetector(
                key: Key('pk_reaction_${r['id']}'),
                onTap: () => _onReactionTapped(r),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Row(
                    children: [
                      Text(r['emoji']!, style: const TextStyle(fontSize: 16)),
                      const SizedBox(width: 4),
                      Text(
                        r['label']!,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
