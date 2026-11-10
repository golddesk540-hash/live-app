import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 6 Module 6.5: PK Winner Boost System
/// Exact 1:1 Design Reference: 06_05_winner_boost.png
/// Flutter implementation for Android & iOS
/// ============================================================================

class PKWinnerBoostScreen extends StatefulWidget {
  final String battleId;
  final String apiBaseUrl;
  final VoidCallback? onBack;

  const PKWinnerBoostScreen({
    Key? key,
    this.battleId = '00000000-0000-0000-0000-000000000604',
    this.apiBaseUrl = 'https://kigolive.com',
    this.onBack,
  }) : super(key: key);

  @override
  State<PKWinnerBoostScreen> createState() => _PKWinnerBoostScreenState();
}

class _PKWinnerBoostScreenState extends State<PKWinnerBoostScreen> {
  bool _isUrdu = false;
  int _remainingSeconds = 1799; // 29:59 matching reference picture
  String _boostTitle = 'Winner Boost Active';
  String _boostDescription = '+ 20% points for next 30 minutes';
  String _status = 'active';
  Timer? _countdownTimer;

  // Theme colors matching 06_05_winner_boost.png
  static const Color _bgDark = Color(0xFF0D081E);
  static const Color _neonPink = Color(0xFFFF2D78);
  static const Color _cardBg = Color(0xFF18112C);
  static const Color _watermarkPill = Color(0xFF8C1B64);

  @override
  void initState() {
    super.initState();
    _fetchBoostData();

    // 1-second local tick
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_remainingSeconds > 0) {
            _remainingSeconds--;
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchBoostData() async {
    try {
      final url = Uri.parse('${widget.apiBaseUrl}/api/pk/boost/${widget.battleId}');
      final res = await http.get(url).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['boost'] != null && mounted) {
          final b = data['boost'];
          setState(() {
            _remainingSeconds = b['remainingSeconds'] ?? _remainingSeconds;
            _boostTitle = b['boostTitle'] ?? _boostTitle;
            _boostDescription = b['boostDescription'] ?? _boostDescription;
            _status = b['status'] ?? _status;
          });
        }
      }
    } catch (_) {}
  }

  String _formatTime(int seconds) {
    if (seconds <= 0) return '00:00';
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgDark,
        body: SafeArea(
          child: Column(
            children: [
              // 1. TOP HEADER (Winner Boost + Lang toggle)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (widget.onBack != null)
                      IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
                        onPressed: widget.onBack,
                      )
                    else
                      const SizedBox(width: 40),

                    Text(
                      _isUrdu ? 'ونر بوسٹ' : 'Winner Boost',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),

                    GestureDetector(
                      onTap: () => setState(() => _isUrdu = !_isUrdu),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white12,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: Text(
                          _isUrdu ? 'EN' : 'اردو',
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // 2. MAIN CENTER HERO (Rocket + Title + Description + Timer Card)
              Expanded(
                child: Center(
                  child: SingleChildScrollView(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Glowing Circular Rocket Frame matching 06_05_winner_boost.png
                          Stack(
                            alignment: Alignment.center,
                            children: [
                              // Radial Pink Glow
                              Container(
                                width: 220,
                                height: 220,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: RadialGradient(
                                    colors: [
                                      _neonPink.withOpacity(0.3),
                                      Colors.purple.withOpacity(0.15),
                                      Colors.transparent,
                                    ],
                                  ),
                                ),
                              ),

                              // Neon Pink Circular Ring
                              Container(
                                width: 170,
                                height: 170,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: const Color(0xFF130926),
                                  border: Border.all(color: _neonPink, width: 4),
                                  boxShadow: [
                                    BoxShadow(
                                      color: _neonPink.withOpacity(0.5),
                                      blurRadius: 30,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                ),
                                child: Center(
                                  // Rocket Graphic
                                  child: Transform.rotate(
                                    angle: -0.2,
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: const [
                                        Icon(Icons.rocket_launch, color: Colors.white, size: 76),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 32),

                          // Winner Boost Active Title
                          Text(
                            _isUrdu ? 'ونر بوسٹ فعال ہے' : 'Winner Boost Active',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 24,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Description
                          Text(
                            _isUrdu ? 'اگلے 30 منٹ کے لیے +20% پوائنٹس' : '+ 20% points for next 30 minutes',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),

                          const SizedBox(height: 28),

                          // Countdown Timer Card (29:59)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                            decoration: BoxDecoration(
                              color: _cardBg,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFF3B2B5F)),
                              boxShadow: const [
                                BoxShadow(color: Colors.black45, blurRadius: 10, offset: Offset(0, 4)),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // Clock icon with pink outline
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: _neonPink, width: 2),
                                  ),
                                  child: const Icon(Icons.access_time_filled, color: _neonPink, size: 16),
                                ),
                                const SizedBox(width: 14),
                                Text(
                                  _formatTime(_remainingSeconds),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 28,
                                    letterSpacing: 2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // 3. BOTTOM WATERMARK BADGE
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: _watermarkPill,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _isUrdu ? '6.5 ونر بوسٹ' : '6.5 Winner Boost',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
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
