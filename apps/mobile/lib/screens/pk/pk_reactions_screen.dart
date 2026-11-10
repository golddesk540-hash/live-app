import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 6 Module 6.8: PK Battle Reactions System
/// Exact 1:1 Design Reference: 06_08_reactions.png
/// Flutter implementation for Android & iOS
/// ============================================================================

class PKReactionsScreen extends StatefulWidget {
  final String battleId;
  final String currentUserId;
  final String currentUserName;
  final String apiBaseUrl;
  final VoidCallback? onBack;

  const PKReactionsScreen({
    Key? key,
    this.battleId = '00000000-0000-0000-0000-000000000603',
    this.currentUserId = 'user_viewer_9001',
    this.currentUserName = 'Ali',
    this.apiBaseUrl = 'https://kigolive.com',
    this.onBack,
  }) : super(key: key);

  @override
  State<PKReactionsScreen> createState() => _PKReactionsScreenState();
}

class _FloatingReaction {
  final String id;
  final String emoji;
  final String type; // 'heart', 'like', etc.
  final double x; // 0.0 to 1.0
  double progress; // 0.0 (bottom) to 1.0 (top)
  final double size;

  _FloatingReaction({
    required this.id,
    required this.emoji,
    required this.type,
    required this.x,
    required this.size,
    this.progress = 0.0,
  });
}

class _PKReactionsScreenState extends State<PKReactionsScreen>
    with SingleTickerProviderStateMixin {
  bool _isUrdu = false;
  int _remainingSeconds = 298; // 04:58 matching reference picture
  int _scoreA = 12430;
  int _scoreB = 9870;
  bool _showReactionPanel = false;
  String _selectedTarget = 'both'; // 'both', 'host_a', 'host_b'

  int _totalReactions = 1256;
  int _hostAReactions = 684;
  int _hostBReactions = 572;

  Timer? _countdownTimer;
  Timer? _ambientReactionsTimer;
  Timer? _animationLoopTimer;

  final TextEditingController _commentController = TextEditingController();
  final List<Map<String, String>> _comments = [
    {'user': 'Ali', 'text': 'Go Sara! 🔥'},
    {'user': 'Raza', 'text': 'Nice battle!'},
    {'user': 'Sana', 'text': '💖💖'},
  ];

  final List<_FloatingReaction> _floatingReactions = [];
  final Random _random = Random();

  // Colors matching 06_08_reactions.png
  static const Color _bgDark = Color(0xFF070414);
  static const Color _neonPink = Color(0xFFFF2D78);
  static const Color _neonBlue = Color(0xFF2563EB);
  static const Color _watermarkPill = Color(0xFF8C1B64);

  // 10 Approved PK Reactions
  static const List<Map<String, String>> _approvedReactions = [
    {'id': 'heart', 'emoji': '❤️', 'label': 'Heart', 'labelUr': 'دل'},
    {'id': 'like', 'emoji': '👍', 'label': 'Like', 'labelUr': 'پسند'},
    {'id': 'fire', 'emoji': '🔥', 'label': 'Fire', 'labelUr': 'آگ'},
    {'id': 'clap', 'emoji': '👏', 'label': 'Clap', 'labelUr': 'تالیاں'},
    {'id': 'love', 'emoji': '😍', 'label': 'Love', 'labelUr': 'پیار'},
    {'id': 'laugh', 'emoji': '😂', 'label': 'Laugh', 'labelUr': 'ہنسی'},
    {'id': 'wow', 'emoji': '😮', 'label': 'Wow', 'labelUr': 'واہ'},
    {'id': 'party', 'emoji': '🎉', 'label': 'Party', 'labelUr': 'پارٹی'},
    {'id': 'strong', 'emoji': '💪', 'label': 'Strong', 'labelUr': 'طاقت'},
    {'id': 'cry', 'emoji': '😭', 'label': 'Cry', 'labelUr': 'رونا'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchCounters();

    // 1. Countdown timer
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted && _remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      }
    });

    // 2. Ambient spontaneous reactions (matches 06_08_reactions.png floating thumbs and hearts)
    _ambientReactionsTimer = Timer.periodic(const Duration(milliseconds: 1400), (timer) {
      if (!mounted) return;
      final ambientList = [
        {'emoji': '❤️', 'type': 'heart'},
        {'emoji': '👍', 'type': 'like'},
        {'emoji': '💖', 'type': 'heart'},
        {'emoji': '💕', 'type': 'heart'},
      ];
      final pick = ambientList[_random.nextInt(ambientList.length)];
      _spawnReaction(pick['emoji']!, pick['type']!, 0.65 + _random.nextDouble() * 0.25);
    });

    // 3. Animation loop for moving floating reactions upward
    _animationLoopTimer = Timer.periodic(const Duration(milliseconds: 33), (timer) {
      if (!mounted || _floatingReactions.isEmpty) return;
      setState(() {
        for (var i = _floatingReactions.length - 1; i >= 0; i--) {
          _floatingReactions[i].progress += 0.016;
          if (_floatingReactions[i].progress >= 1.0) {
            _floatingReactions.removeAt(i);
          }
        }
      });
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _ambientReactionsTimer?.cancel();
    _animationLoopTimer?.cancel();
    _commentController.dispose();
    super.dispose();
  }

  void _spawnReaction(String emoji, String type, [double? targetX]) {
    final x = targetX ?? (0.2 + _random.nextDouble() * 0.6);
    final reaction = _FloatingReaction(
      id: '${DateTime.now().millisecondsSinceEpoch}_${_random.nextInt(9999)}',
      emoji: emoji,
      type: type,
      x: x,
      size: 26.0 + _random.nextDouble() * 10.0,
    );
    setState(() {
      _floatingReactions.add(reaction);
      if (_floatingReactions.length > 30) {
        _floatingReactions.removeAt(0);
      }
    });
  }

  Future<void> _fetchCounters() async {
    try {
      final url = Uri.parse(
          '${widget.apiBaseUrl}/api/pk/battle/${widget.battleId}/reaction/counters');
      final res = await http.get(url).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['counters'] != null && mounted) {
          setState(() {
            _totalReactions = data['counters']['total'] ?? _totalReactions;
            _hostAReactions = data['counters']['hostA'] ?? _hostAReactions;
            _hostBReactions = data['counters']['hostB'] ?? _hostBReactions;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _sendReaction(String reactionType, String emoji) async {
    // 1. Optimistic animation
    final targetX = _selectedTarget == 'host_a'
        ? (0.15 + _random.nextDouble() * 0.25)
        : _selectedTarget == 'host_b'
            ? (0.60 + _random.nextDouble() * 0.25)
            : (0.35 + _random.nextDouble() * 0.30);
    _spawnReaction(emoji, reactionType, targetX);

    // 2. Optimistic counter update
    setState(() {
      _totalReactions++;
      if (_selectedTarget == 'host_a' || _selectedTarget == 'both') _hostAReactions++;
      if (_selectedTarget == 'host_b' || _selectedTarget == 'both') _hostBReactions++;
    });

    // 3. Dispatch to API
    try {
      final url = Uri.parse(
          '${widget.apiBaseUrl}/api/pk/battle/${widget.battleId}/reaction/send');
      await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'reactionType': reactionType,
          'targetHostSide': _selectedTarget,
          'userId': widget.currentUserId,
          'userNickname': widget.currentUserName,
        }),
      ).timeout(const Duration(seconds: 3));
    } catch (_) {}
  }

  String _formatTime(int sec) {
    final m = (sec ~/ 60).toString().padLeft(2, '0');
    final s = (sec % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final textDirection = _isUrdu ? TextDirection.rtl : TextDirection.ltr;

    return Directionality(
      textDirection: textDirection,
      child: Scaffold(
        backgroundColor: _bgDark,
        body: SafeArea(
          bottom: true,
          child: Stack(
            children: [
              // 1. MAIN COLUMN CONTENT
              Column(
                children: [
                  _buildHeader(),
                  Expanded(
                    child: Stack(
                      children: [
                        _buildSplitVideoStream(),
                        _buildCommentsOverlay(),
                        _buildFloatingReactionsOverlay(),
                      ],
                    ),
                  ),
                  _buildBottomBar(),
                  _buildWatermark(),
                ],
              ),

              // 2. REACTION POPUP PANEL (Animated Bottom Sheet)
              if (_showReactionPanel) _buildReactionPanel(),
            ],
          ),
        ),
      ),
    );
  }

  // --- 1. Top Header ---
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF140B2B), Colors.transparent],
        ),
      ),
      child: Row(
        children: [
          // Host A
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: _neonPink, width: 2),
              image: const DecorationImage(
                image: NetworkImage(
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'),
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Sara Live',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: _neonPink,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    '32.5K',
                    style: TextStyle(
                      color: Color(0xFFF472B6),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const Spacer(),

          // Host B
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Ayesha',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: Colors.cyanAccent,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    '28.7K',
                    style: TextStyle(
                      color: Colors.cyanAccent,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(width: 8),
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.cyanAccent, width: 2),
              image: const DecorationImage(
                image: NetworkImage(
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80'),
                fit: BoxFit.cover,
              ),
            ),
          ),

          const SizedBox(width: 8),

          // Follow Plus Button
          GestureDetector(
            onTap: () {},
            child: Container(
              width: 26,
              height: 26,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [_neonPink, Color(0xFFEC4899)],
                ),
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 16),
            ),
          ),

          const SizedBox(width: 8),

          // Urdu Language Switcher
          GestureDetector(
            onTap: () => setState(() => _isUrdu = !_isUrdu),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.language, color: _neonPink, size: 16),
            ),
          ),
        ],
      ),
    );
  }

  // --- 2. Split Video Stream with Scores & PK Timer ---
  Widget _buildSplitVideoStream() {
    return Column(
      children: [
        Expanded(
          child: Stack(
            children: [
              // Video Split
              Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.black,
                        image: DecorationImage(
                          image: NetworkImage(
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                  Container(width: 1.5, color: _neonPink.withOpacity(0.4)),
                  Expanded(
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.black,
                        image: DecorationImage(
                          image: NetworkImage(
                              'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                ],
              ),

              // Top Center PK Timer: PK 04:58
              Align(
                alignment: Alignment.topCenter,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF180A29).withOpacity(0.9),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withOpacity(0.2)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'PK',
                          style: TextStyle(
                            color: _neonPink,
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _formatTime(_remainingSeconds),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Bottom Score Bar (12,430 VS 9,870)
              Align(
                alignment: Alignment.bottomCenter,
                child: Container(
                  height: 36,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              alignment: Alignment.centerLeft,
                              padding: const EdgeInsets.only(left: 12),
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [_neonPink, Color(0xFFEC4899)],
                                ),
                              ),
                              child: Text(
                                '$_scoreA',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 12),
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [_neonBlue, Color(0xFF06B6D4)],
                                ),
                              ),
                              child: Text(
                                '$_scoreB',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      // Central VS Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFFF4500), _neonPink],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                        child: const Text(
                          'VS',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 11,
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
      ],
    );
  }

  // --- 3. Comments Overlay ---
  Widget _buildCommentsOverlay() {
    return Positioned(
      left: 12,
      bottom: 12,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: _comments.map((c) {
          return Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.45),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${c['user']}: ',
                  style: const TextStyle(
                    color: Color(0xFFC084FC),
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
                Text(
                  c['text']!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  // --- 4. Floating Reactions Animation Overlay (Exact Match to 06_08) ---
  Widget _buildFloatingReactionsOverlay() {
    final size = MediaQuery.of(context).size;
    final totalHeight = size.height * 0.55;

    return IgnorePointer(
      child: Stack(
        children: _floatingReactions.map((r) {
          final topPos = totalHeight * (1.0 - r.progress);
          final opacity = (r.progress < 0.15)
              ? (r.progress / 0.15)
              : (r.progress > 0.8)
                  ? ((1.0 - r.progress) / 0.2)
                  : 1.0;

          return Positioned(
            left: r.x * (size.width - 60),
            top: topPos,
            child: Opacity(
              opacity: opacity.clamp(0.0, 1.0),
              child: r.type == 'like'
                  ? Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.blue.withOpacity(0.4),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.thumb_up,
                        color: Colors.white,
                        size: 20,
                      ),
                    )
                  : Text(
                      r.emoji,
                      style: TextStyle(
                        fontSize: r.size,
                        shadows: const [
                          Shadow(color: Colors.black45, blurRadius: 4),
                        ],
                      ),
                    ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // --- 5. Bottom Interaction Bar ---
  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0F0722).withOpacity(0.95),
        border: const Border(
          top: BorderSide(color: Color(0xFF23173D)),
        ),
      ),
      child: Row(
        children: [
          // Text Input Field
          Expanded(
            child: Container(
              height: 36,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF1B1035),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFF2E1D4D)),
              ),
              child: TextField(
                controller: _commentController,
                style: const TextStyle(color: Colors.white, fontSize: 12),
                decoration: InputDecoration(
                  hintText: _isUrdu ? 'کچھ کہئے...' : 'Say something...',
                  hintStyle: TextStyle(
                    color: Colors.white.withOpacity(0.4),
                    fontSize: 12,
                  ),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 9),
                ),
                onSubmitted: (text) {
                  if (text.trim().isNotEmpty) {
                    setState(() {
                      _comments.add({
                        'user': widget.currentUserName,
                        'text': text.trim(),
                      });
                      _commentController.clear();
                    });
                  }
                },
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Gift Button
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [_neonPink, Color(0xFFEC4899)],
              ),
            ),
            child: const Icon(Icons.card_giftcard, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 8),

          // Reaction Panel Toggle
          GestureDetector(
            onTap: () => setState(() => _showReactionPanel = !_showReactionPanel),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _showReactionPanel ? _neonPink : Colors.white.withOpacity(0.12),
              ),
              child: const Icon(Icons.more_horiz, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }

  // --- 6. Popup Emoji Reaction Panel ---
  Widget _buildReactionPanel() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 60,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF150D2B),
          border: Border.all(color: const Color(0xFF351B54)),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
          boxShadow: const [
            BoxShadow(
              color: Colors.black54,
              blurRadius: 16,
              offset: Offset(0, -4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Target Selector Header
            Row(
              children: [
                Text(
                  _isUrdu ? 'ہدف:' : 'Target:',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.6),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                _buildTargetChip('both', _isUrdu ? 'دونوں' : 'Both'),
                const SizedBox(width: 6),
                _buildTargetChip('host_a', 'Sara'),
                const SizedBox(width: 6),
                _buildTargetChip('host_b', 'Ayesha'),
                const Spacer(),
                GestureDetector(
                  onTap: () => setState(() => _showReactionPanel = false),
                  child: const Icon(Icons.close, color: Colors.white54, size: 18),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // 10 Reactions Grid
            GridView.count(
              crossAxisCount: 5,
              shrinkWrap: true,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              physics: const NeverScrollableScrollPhysics(),
              children: _approvedReactions.map((r) {
                return GestureDetector(
                  onTap: () => _sendReaction(r['id']!, r['emoji']!),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.06),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.08)),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          r['emoji']!,
                          style: const TextStyle(fontSize: 22),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _isUrdu ? r['labelUr']! : r['label']!,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.6),
                            fontSize: 9,
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
      ),
    );
  }

  Widget _buildTargetChip(String target, String label) {
    final isSelected = _selectedTarget == target;
    return GestureDetector(
      onTap: () => setState(() => _selectedTarget = target),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        decoration: BoxDecoration(
          color: isSelected ? _neonPink : Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  // --- 7. Watermark Badge (Exact Match: 06_08_reactions.png) ---
  Widget _buildWatermark() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      alignment: Alignment.center,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 7),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF831843), Color(0xFF9D174D), Color(0xFFBE185D)],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: _neonPink.withOpacity(0.4)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFBE185D).withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Text(
          _isUrdu ? '6.8 ری ایکشنز' : '6.8 Reactions',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 12,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }
}
