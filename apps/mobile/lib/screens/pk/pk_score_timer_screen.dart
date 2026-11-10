import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 6 Module 6.3: PK Battle Score and Timer
/// Exact 1:1 Design Reference: 06_03_score_and_timer.png
/// Flutter implementation for Android & iOS
/// ============================================================================

class PKScoreTimerScreen extends StatefulWidget {
  final String battleId;
  final String currentUserId;
  final String currentUserName;
  final String apiBaseUrl;
  final VoidCallback? onBack;

  const PKScoreTimerScreen({
    Key? key,
    this.battleId = '00000000-0000-0000-0000-000000000603',
    this.currentUserId = 'user_viewer_9001',
    this.currentUserName = 'Ali',
    this.apiBaseUrl = 'https://kigolive.com',
    this.onBack,
  }) : super(key: key);

  @override
  State<PKScoreTimerScreen> createState() => _PKScoreTimerScreenState();
}

class _PKScoreTimerScreenState extends State<PKScoreTimerScreen>
    with SingleTickerProviderStateMixin {
  bool _isUrdu = false;
  bool _isConnected = true;
  int _remainingSeconds = 298; // 04:58 default matching reference picture
  int _scoreA = 12430;
  int _scoreB = 9870;
  double _ratioA = 0.557;
  double _ratioB = 0.443;
  String _leadingSide = 'host_a';

  Timer? _localClockTimer;
  Timer? _syncPollTimer;
  final TextEditingController _commentController = TextEditingController();

  final List<Map<String, String>> _comments = [
    {'user': 'Ali', 'text': 'Go Sara! 🔥'},
    {'user': 'Raza', 'text': 'Nice battle!'},
    {'user': 'Sana', 'text': '💕💕'},
  ];

  final List<Map<String, dynamic>> _floatingDeltas = [];

  // Colors matching 06_03_score_and_timer.png
  static const Color _bgDark = Color(0xFF0D091A);
  static const Color _neonPink = Color(0xFFFF2D78);
  static const Color _neonCyan = Color(0xFF00AAFF);
  static const Color _watermarkPill = Color(0xFF8C1B64);
  static const Color _pillNavy = Color(0xFF1B1339);

  @override
  void initState() {
    super.initState();
    _fetchServerBattleState();

    // 1-second authoritative local tick
    _localClockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_remainingSeconds > 0) {
            _remainingSeconds--;
          }
        });
      }
    });

    // 4-second server resync to prevent any drift
    _syncPollTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      _fetchServerBattleState();
    });
  }

  @override
  void dispose() {
    _localClockTimer?.cancel();
    _syncPollTimer?.cancel();
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _fetchServerBattleState() async {
    try {
      final url = Uri.parse('${widget.apiBaseUrl}/api/pk/battle/${widget.battleId}/score-timer');
      final res = await http.get(url).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && mounted) {
          setState(() {
            _isConnected = true;
            _remainingSeconds = data['timer']['remainingSeconds'] ?? _remainingSeconds;
            _scoreA = data['hostA']['score'] ?? _scoreA;
            _scoreB = data['hostB']['score'] ?? _scoreB;
            _ratioA = (data['ratioA'] ?? 55.7) / 100.0;
            _ratioB = (data['ratioB'] ?? 44.3) / 100.0;
            _leadingSide = data['leadingSide'] ?? 'tie';
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isConnected = false);
      }
    }
  }

  String _formatTime(int seconds) {
    if (seconds <= 0) return '00:00';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  void _triggerFloatingScore(String side, int points) {
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    setState(() {
      _floatingDeltas.add({'id': id, 'side': side, 'points': points});
    });
    Future.delayed(const Duration(milliseconds: 1800), () {
      if (mounted) {
        setState(() {
          _floatingDeltas.removeWhere((item) => item['id'] == id);
        });
      }
    });
  }

  Future<void> _sendPoints(String side, int points, String giftName) async {
    if (_remainingSeconds <= 0) {
      _showToast(_isUrdu ? 'مقابلہ ختم ہو چکا ہے!' : 'Battle time expired!');
      return;
    }

    final idempotencyKey = 'pk_mobile_${widget.battleId}_${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(99999)}';
    try {
      final url = Uri.parse('${widget.apiBaseUrl}/api/pk/battle/${widget.battleId}/score/send');
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'hostSide': side,
          'targetHostId': side == 'host_a'
              ? '00000000-0000-0000-0000-000000088201'
              : '00000000-0000-0000-0000-000000088202',
          'senderId': widget.currentUserId,
          'senderName': widget.currentUserName,
          'points': points,
          'giftName': giftName,
          'idempotencyKey': idempotencyKey,
        }),
      );

      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _scoreA = data['scoreA'];
          _scoreB = data['scoreB'];
          _ratioA = (data['ratioA'] ?? 50.0) / 100.0;
          _ratioB = (data['ratioB'] ?? 50.0) / 100.0;
          _leadingSide = data['leadingSide'];
        });
        _triggerFloatingScore(side, points);
        _showToast(_isUrdu ? '+$points پوائنٹس شامل ہو گئے!' : '+$points points added!');
      } else {
        _showToast(data['error'] ?? 'Scoring error');
      }
    } catch (_) {
      _showToast('Network error');
    }
  }

  void _showToast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white, fontSize: 13)),
        backgroundColor: const Color(0xFF251B42),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showGiftBottomSheet() {
    String selectedSide = 'host_a';
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF18112C),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _isUrdu ? 'پوائنٹس بھیجیں' : 'Send Battle Points',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(Icons.close, color: Colors.white54, size: 20),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => selectedSide = 'host_a'),
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: selectedSide == 'host_a' ? _neonPink.withOpacity(0.2) : const Color(0xFF21183C),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.parse(
                                selectedSide == 'host_a'
                                    ? BorderSide(color: _neonPink, width: 2)
                                    : const BorderSide(color: Colors.white10),
                              ),
                            ),
                            child: Row(
                              children: [
                                const CircleAvatar(
                                  radius: 16,
                                  backgroundImage: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'),
                                ),
                                const SizedBox(width: 8),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Sara Live', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                    Text('$_scoreA pts', style: const TextStyle(color: _neonPink, fontSize: 10)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => selectedSide = 'host_b'),
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: selectedSide == 'host_b' ? _neonCyan.withOpacity(0.2) : const Color(0xFF21183C),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.parse(
                                selectedSide == 'host_b'
                                    ? BorderSide(color: _neonCyan, width: 2)
                                    : const BorderSide(color: Colors.white10),
                              ),
                            ),
                            child: Row(
                              children: [
                                const CircleAvatar(
                                  radius: 16,
                                  backgroundImage: NetworkImage('https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100'),
                                ),
                                const SizedBox(width: 8),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Ayesha', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                    Text('$_scoreB pts', style: const TextStyle(color: _neonCyan, fontSize: 10)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _buildGiftTile(ctx, selectedSide, 100, 'Rose', '🌹'),
                      const SizedBox(width: 8),
                      _buildGiftTile(ctx, selectedSide, 500, 'Diamond Star', '⭐'),
                      const SizedBox(width: 8),
                      _buildGiftTile(ctx, selectedSide, 1000, 'Super Rocket', '🚀'),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildGiftTile(BuildContext ctx, String side, int points, String name, String emoji) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          Navigator.pop(ctx);
          _sendPoints(side, points, name);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFF231B40),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white12),
          ),
          child: Column(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 24)),
              const SizedBox(height: 4),
              Text('+$points', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              Text(name, style: const TextStyle(color: Colors.white38, fontSize: 10)),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isUrgent = _remainingSeconds <= 10;
    final isWarning = _remainingSeconds <= 60 && !isUrgent;

    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgDark,
        body: SafeArea(
          child: Stack(
            children: [
              Column(
                children: [
                  // 1. TOP HEADER (Sara Live vs Ayesha + Follow + Lang)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Left Host: Sara Live
                        Row(
                          children: [
                            if (widget.onBack != null)
                              IconButton(
                                icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
                                onPressed: widget.onBack,
                              ),
                            Stack(
                              clipBehavior: Clip.none,
                              children: [
                                Container(
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: const Color(0xFFA855F7), width: 2),
                                  ),
                                  child: const CircleAvatar(
                                    radius: 20,
                                    backgroundImage: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'),
                                  ),
                                ),
                                Positioned(
                                  bottom: -2,
                                  right: -2,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                    decoration: BoxDecoration(
                                      color: _neonPink,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text('PK', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 8)),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _isUrdu ? 'سارہ لائیو' : 'Sara Live',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                Row(
                                  children: [
                                    Container(width: 6, height: 6, decoration: const BoxDecoration(color: _neonPink, shape: BoxShape.circle)),
                                    const SizedBox(width: 4),
                                    const Text('32.5K', style: TextStyle(color: Colors.white70, fontSize: 11)),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),

                        // Right Host: Ayesha + Plus Follow Button
                        Row(
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  _isUrdu ? 'عائشہ' : 'Ayesha',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                Row(
                                  children: [
                                    Container(width: 6, height: 6, decoration: const BoxDecoration(color: _neonPink, shape: BoxShape.circle)),
                                    const SizedBox(width: 4),
                                    const Text('28.7K', style: TextStyle(color: Colors.white70, fontSize: 11)),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(width: 10),
                            Container(
                              width: 32,
                              height: 32,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(colors: [_neonPink, Color(0xFFFF5388)]),
                              ),
                              child: const Icon(Icons.add, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 8),
                            // Language switch
                            GestureDetector(
                              onTap: () => setState(() => _isUrdu = !_isUrdu),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white10,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(_isUrdu ? 'EN' : 'اردو', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // 2. VIDEO SPLIT AREA WITH TIMER PILL
                  Expanded(
                    child: Column(
                      children: [
                        Stack(
                          alignment: Alignment.topCenter,
                          children: [
                            // Split Video Frames
                            Container(
                              height: 250,
                              decoration: BoxDecoration(
                                border: Border.symmetric(
                                  horizontal: BorderSide(color: const Color(0xFF302450)),
                                ),
                              ),
                              child: Row(
                                children: [
                                  // Left Half (Sara)
                                  Expanded(
                                    child: Container(
                                      decoration: const BoxDecoration(
                                        image: DecorationImage(
                                          image: NetworkImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800'),
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),
                                  ),
                                  Container(width: 1.5, color: Colors.white24),
                                  // Right Half (Ayesha)
                                  Expanded(
                                    child: Container(
                                      decoration: const BoxDecoration(
                                        image: DecorationImage(
                                          image: NetworkImage('https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800'),
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // PK Timer Capsule Pill
                            Positioned(
                              top: 8,
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 10)],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isUrgent ? Colors.red : (isWarning ? Colors.orange : _neonPink),
                                        borderRadius: const BorderRadius.horizontal(left: Radius.circular(20)),
                                      ),
                                      child: const Text('PK', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isUrgent ? const Color(0xFF3B0707) : _pillNavy,
                                        borderRadius: const BorderRadius.horizontal(right: Radius.circular(20)),
                                      ),
                                      child: Text(
                                        _formatTime(_remainingSeconds),
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),

                        // 3. SCORE COMPARISON BAR
                        Container(
                          height: 42,
                          color: Colors.black,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              Row(
                                children: [
                                  // Host A side
                                  Expanded(
                                    flex: (_ratioA * 1000).toInt(),
                                    child: Container(
                                      padding: const EdgeInsets.only(left: 16),
                                      alignment: Alignment.centerLeft,
                                      color: _neonPink,
                                      child: Text(
                                        '$_scoreA',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 17),
                                      ),
                                    ),
                                  ),
                                  // Host B side
                                  Expanded(
                                    flex: (_ratioB * 1000).toInt(),
                                    child: Container(
                                      padding: const EdgeInsets.only(right: 16),
                                      alignment: Alignment.centerRight,
                                      color: _neonCyan,
                                      child: Text(
                                        '$_scoreB',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 17),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              // Vs Badge
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(colors: [_neonPink, _neonCyan]),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFF120822), width: 2),
                                ),
                                child: const Text(
                                  'Vs',
                                  style: TextStyle(color: Colors.white, fontStyle: FontStyle.italic, fontWeight: FontWeight.w900, fontSize: 11),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // 4. LIVE COMMENTS
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            itemCount: _comments.length,
                            itemBuilder: (ctx, idx) {
                              final c = _comments[idx];
                              return Align(
                                alignment: Alignment.centerLeft,
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.4),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white10),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      CircleAvatar(
                                        radius: 8,
                                        backgroundColor: const Color(0xFFA855F7),
                                        child: Text(c['user']![0], style: const TextStyle(color: Colors.white, fontSize: 8)),
                                      ),
                                      const SizedBox(width: 6),
                                      Text('${c['user']}: ', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                                      Text(c['text']!, style: const TextStyle(color: Colors.white70, fontSize: 11)),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),

                  // 5. BOTTOM ACTION BAR (Chat + Gift Box + Heart)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 38,
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E1738),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white12),
                            ),
                            child: TextField(
                              controller: _commentController,
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                              decoration: InputDecoration(
                                hintText: _isUrdu ? 'کچھ کہیں...' : 'Say something...',
                                hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                                border: InputBorder.none,
                              ),
                              onSubmitted: (val) {
                                if (val.trim().isNotEmpty) {
                                  setState(() {
                                    _comments.add({'user': widget.currentUserName, 'text': val.trim()});
                                  });
                                  _commentController.clear();
                                }
                              },
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: _showGiftBottomSheet,
                          child: Container(
                            width: 38,
                            height: 38,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(colors: [_neonPink, Color(0xFFFF5388)]),
                            ),
                            child: const Icon(Icons.card_giftcard, color: Colors.white, size: 20),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF1E1738),
                            border: Border.all(color: Colors.white12),
                          ),
                          child: const Icon(Icons.favorite, color: _neonPink, size: 20),
                        ),
                      ],
                    ),
                  ),

                  // 6. BOTTOM WATERMARK BADGE
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _watermarkPill,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _isUrdu ? '6.3 اسکور اور ٹائمر' : '6.3 Score and Timer',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                  ),
                ],
              ),

              // Reconnecting banner if network drops
              if (!_isConnected)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    color: Colors.amber.shade700,
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: const Text(
                      'Reconnecting to battle server...',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
