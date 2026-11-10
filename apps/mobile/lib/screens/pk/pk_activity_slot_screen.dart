import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 6 Module 6.7: PK Activity Slot System
/// Exact 1:1 Design Reference: 06_07_activity_slot.png
/// Flutter implementation for Android & iOS
/// ============================================================================

class PKActivitySlotScreen extends StatefulWidget {
  final String activityId;
  final String apiBaseUrl;
  final VoidCallback? onBack;
  final VoidCallback? onJoinNow;

  const PKActivitySlotScreen({
    Key? key,
    this.activityId = '00000000-0000-0000-0000-000000000607',
    this.apiBaseUrl = 'https://kigolive.com',
    this.onBack,
    this.onJoinNow,
  }) : super(key: key);

  @override
  State<PKActivitySlotScreen> createState() => _PKActivitySlotScreenState();
}

class _PKActivitySlotScreenState extends State<PKActivitySlotScreen> {
  bool _isUrdu = false;
  bool _isLoading = true;
  bool _isJoining = false;
  bool _isJoined = false;

  String _title = 'PK Activity';
  String _subtitle = 'Daily PK Challenge';
  String _description = 'Join PK battles and win rewards!';
  int _targetBattles = 3;
  int _currentBattles = 0;
  int _rewardPoints = 50;
  int _rewardCoins = 100;
  int _remainingSeconds = 79200; // 22 hours

  Timer? _countdownTimer;

  // Colors matching 06_07_activity_slot.png
  static const Color _bgDark = Color(0xFF0B071A);
  static const Color _cardBg = Color(0xFF18112C);
  static const Color _borderColor = Color(0xFF2E1D4D);
  static const Color _neonPink = Color(0xFFFF2D78);
  static const Color _watermarkPill = Color(0xFF8C1B64);

  @override
  void initState() {
    super.initState();
    _fetchActivity();

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted && _remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchActivity() async {
    try {
      final url = Uri.parse('${widget.apiBaseUrl}/api/pk/activities/${widget.activityId}');
      final res = await http.get(url).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['activity'] != null && mounted) {
          final a = data['activity'];
          setState(() {
            _title = _isUrdu ? (a['titleUr'] ?? a['title']) : a['title'];
            _subtitle = _isUrdu ? (a['subtitleUr'] ?? a['subtitle']) : a['subtitle'];
            _description = _isUrdu ? (a['descriptionUr'] ?? a['description']) : a['description'];
            _targetBattles = a['targetBattles'] ?? _targetBattles;
            _currentBattles = a['currentBattles'] ?? _currentBattles;
            _rewardPoints = a['rewardPoints'] ?? _rewardPoints;
            _rewardCoins = a['rewardCoins'] ?? _rewardCoins;
            _remainingSeconds = a['remainingSeconds'] ?? _remainingSeconds;
          });
        }
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleJoinNow() async {
    setState(() => _isJoining = true);
    try {
      final res = await http.post(
        Uri.parse('${widget.apiBaseUrl}/api/pk/activities/progress'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'activityId': widget.activityId,
          'incrementBy': 1,
        }),
      );
      if (res.statusCode == 200 && mounted) {
        final data = jsonDecode(res.body);
        setState(() {
          _currentBattles = data['completedBattles'] ?? (_currentBattles + 1);
          _isJoined = true;
        });

        Timer(const Duration(milliseconds: 1200), () {
          if (widget.onJoinNow != null) {
            widget.onJoinNow!();
          }
        });
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isJoining = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final progressFraction = _targetBattles > 0 ? (_currentBattles / _targetBattles).clamp(0.0, 1.0) : 0.0;

    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgDark,
        body: SafeArea(
          child: Column(
            children: [
              // TOP HEADER
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () {
                        if (widget.onBack != null) widget.onBack!();
                        else Navigator.of(context).maybePop();
                      },
                      child: const Icon(Icons.arrow_back, color: Colors.white70, size: 22),
                    ),
                    // Language Switcher
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _isUrdu = !_isUrdu;
                          _fetchActivity();
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.language, size: 13, color: _neonPink),
                            const SizedBox(width: 4),
                            Text(
                              _isUrdu ? 'EN' : 'اردو',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // MAIN CONTENT SECTION (Matching 06_07_activity_slot.png)
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: _neonPink))
                    : SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            // Golden Trophy Graphic with ambient radiant rays
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                // Ambient Purple Glow
                                Container(
                                  width: 180,
                                  height: 180,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.purple.withOpacity(0.35),
                                        blurRadius: 40,
                                        spreadRadius: 10,
                                      ),
                                    ],
                                  ),
                                ),

                                Column(
                                  children: [
                                    // Soft Watermark Background Text
                                    Text(
                                      'PK Activity',
                                      style: TextStyle(
                                        color: Colors.purple.shade200.withOpacity(0.35),
                                        fontSize: 22,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 2.0,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    // Golden Trophy Container
                                    Container(
                                      width: 88,
                                      height: 88,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        gradient: const LinearGradient(
                                          colors: [Color(0xFFD97706), Color(0xFFFBBF24), Color(0xFFFDE68A)],
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.amber.withOpacity(0.5),
                                            blurRadius: 20,
                                          ),
                                        ],
                                      ),
                                      padding: const EdgeInsets.all(3),
                                      child: Container(
                                        decoration: const BoxDecoration(
                                          shape: BoxShape.circle,
                                          gradient: LinearGradient(
                                            colors: [Color(0xFF3B0764), Color(0xFF1E0734)],
                                          ),
                                        ),
                                        child: const Center(
                                          child: Icon(
                                            Icons.emoji_events,
                                            size: 52,
                                            color: Color(0xFFFBBF24),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),

                            const SizedBox(height: 18),

                            // Title & Subtitle
                            Text(
                              _title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _subtitle,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _description,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white60,
                                fontSize: 12,
                                fontWeight: FontWeight.w400,
                              ),
                            ),

                            const SizedBox(height: 22),

                            // Progress Bar: 0 / 3 Battles
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Text(
                                  _isUrdu
                                      ? '$_targetBattles / $_currentBattles مقابلے'
                                      : '$_currentBattles / $_targetBattles Battles',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  height: 12,
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: FractionallySizedBox(
                                      alignment: Alignment.centerLeft,
                                      widthFactor: progressFraction > 0 ? progressFraction : 0.06,
                                      child: Container(
                                        decoration: const BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [_neonPink, Color(0xFFEC4899)],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 28),

                            // REWARDS SECTION
                            Text(
                              _isUrdu ? 'انعامات' : 'Rewards',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),

                            const SizedBox(height: 12),

                            Row(
                              children: [
                                // Card 1: +50 Points
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    decoration: BoxDecoration(
                                      color: _cardBg,
                                      borderRadius: BorderRadius.circular(18),
                                      border: Border.all(color: _borderColor),
                                    ),
                                    child: Column(
                                      children: [
                                        Container(
                                          width: 48,
                                          height: 48,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: _neonPink.withOpacity(0.15),
                                          ),
                                          child: const Icon(Icons.card_giftcard, color: _neonPink, size: 26),
                                        ),
                                        const SizedBox(height: 10),
                                        Text(
                                          _isUrdu ? '+$_rewardPoints پوائنٹس' : '+$_rewardPoints Points',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                // Card 2: +100 Coins
                                Expanded(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    decoration: BoxDecoration(
                                      color: _cardBg,
                                      borderRadius: BorderRadius.circular(18),
                                      border: Border.all(color: _borderColor),
                                    ),
                                    child: Column(
                                      children: [
                                        Container(
                                          width: 48,
                                          height: 48,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: Colors.amber.withOpacity(0.15),
                                          ),
                                          child: const Icon(Icons.monetization_on, color: Colors.amber, size: 26),
                                        ),
                                        const SizedBox(height: 10),
                                        Text(
                                          _isUrdu ? '+$_rewardCoins سکے' : '+$_rewardCoins Coins',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w900,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 32),

                            // CTA BUTTON: Join Now
                            SizedBox(
                              width: double.infinity,
                              height: 50,
                              child: ElevatedButton(
                                onPressed: _isJoining ? null : _handleJoinNow,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _isJoined ? const Color(0xFF059669) : _neonPink,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(26),
                                  ),
                                  elevation: 8,
                                  shadowColor: _neonPink.withOpacity(0.5),
                                ),
                                child: _isJoining
                                    ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5)
                                    : Text(
                                        _isJoined
                                            ? (_isUrdu ? 'شامل ہو گئے!' : 'Joined Successfully!')
                                            : (_isUrdu ? 'ابھی شامل ہوں' : 'Join Now'),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),
              ),

              // BOTTOM WATERMARK: 6.7 Activity Slot
              Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                alignment: Alignment.center,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  decoration: BoxDecoration(
                    color: _watermarkPill,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.pink.withOpacity(0.35),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Text(
                    _isUrdu ? '6.7 ایکٹیویٹی سلاٹ' : '6.7 Activity Slot',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
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
