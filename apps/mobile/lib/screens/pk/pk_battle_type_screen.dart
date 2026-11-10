import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 6 Module 6.1: PK Battle Types
/// Exact 1:1 Design Reference: 06_01_battle_types.png
/// Flutter implementation for Android & iOS
/// ============================================================================

enum PKBattleType { oneVsOne, fourHost }

class PKBattleTypeScreen extends StatefulWidget {
  final String roomNumber;
  final String hostId;
  final String apiBaseUrl;
  final VoidCallback? onBack;
  final Function(PKBattleType selectedType)? onContinue;

  const PKBattleTypeScreen({
    Key? key,
    this.roomNumber = '7001',
    this.hostId = 'host_maria_7001',
    this.apiBaseUrl = 'https://kigolive.com',
    this.onBack,
    this.onContinue,
  }) : super(key: key);

  @override
  State<PKBattleTypeScreen> createState() => _PKBattleTypeScreenState();
}

class _PKBattleTypeScreenState extends State<PKBattleTypeScreen> {
  // Default selected type is 1v1
  PKBattleType _selectedType = PKBattleType.oneVsOne;
  bool _isUrdu = false;
  bool _isSubmitting = false;

  // Colors matching 06_01_battle_types.png
  static const Color _bgTop = Color(0xFF2D1045);
  static const Color _bgMid = Color(0xFF130A28);
  static const Color _bgBottom = Color(0xFF080516);
  static const Color _neonPink = Color(0xFFFF2D78);
  static const Color _cardBgActive = Color(0xFF1E1338);
  static const Color _cardBgLocked = Color(0xFF150F2D);
  static const Color _watermarkPill = Color(0xFF831853);

  void _showNotice(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(color: Colors.white, fontSize: 13),
        ),
        backgroundColor: const Color(0xFF3B0764),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _handleContinue() async {
    if (_selectedType != PKBattleType.oneVsOne) {
      _showNotice(
        _isUrdu
            ? 'صرف 1 بمقابلہ 1 کا انتخاب دستیاب ہے۔'
            : 'Only 1v1 Battle is currently available.',
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final response = await http.post(
        Uri.parse('${widget.apiBaseUrl}/api/pk/battle-types/select'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'roomNumber': widget.roomNumber,
          'hostId': widget.hostId,
          'battleType': '1v1',
          'language': _isUrdu ? 'ur' : 'en',
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        final successMsg = _isUrdu
            ? (data['messageUr'] ?? '1 بمقابلہ 1 منتخب کر لیا گیا!')
            : (data['message'] ?? '1v1 PK Battle selected successfully!');
        _showNotice(successMsg);

        if (widget.onContinue != null) {
          widget.onContinue!(_selectedType);
        } else {
          Navigator.of(context).pop(_selectedType);
        }
      } else {
        _showNotice(data['error'] ?? 'Failed to select battle type');
      }
    } catch (e) {
      _showNotice('Connection error: $e');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: RadialGradient(
              center: Alignment(0, -0.75),
              radius: 1.2,
              colors: [_bgTop, _bgMid, _bgBottom],
            ),
          ),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top Header Section
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // App Bar
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            icon: const Icon(
                              Icons.arrow_back_ios_new,
                              color: Colors.white,
                              size: 20,
                            ),
                            onPressed: () {
                              if (widget.onBack != null) {
                                widget.onBack!();
                              } else {
                                Navigator.of(context).pop();
                              }
                            },
                          ),
                          Text(
                            _isUrdu ? 'پی کے جنگ' : 'PK Battle',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => setState(() => _isUrdu = !_isUrdu),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.parse(
                                  '1px solid rgba(255, 45, 120, 0.4)',
                                ),
                              ),
                              child: Text(
                                _isUrdu ? 'EN' : 'اردو',
                                style: const TextStyle(
                                  color: Color(0xFFF472B6),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Section Heading: "Select Battle Type"
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                      child: Text(
                        _isUrdu
                            ? 'جنگ کی قسم منتخب کریں'
                            : 'Select Battle Type',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),

                    // Card 1: 1 vs 1 PK Battle (Active & Selected)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 8,
                      ),
                      child: GestureDetector(
                        onTap: () {
                          setState(() => _selectedType = PKBattleType.oneVsOne);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: _cardBgActive,
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(
                              color: _selectedType == PKBattleType.oneVsOne
                                  ? _neonPink
                                  : Colors.white12,
                              width: _selectedType == PKBattleType.oneVsOne
                                  ? 2.0
                                  : 1.0,
                            ),
                            boxShadow: _selectedType == PKBattleType.oneVsOne
                                ? [
                                    BoxShadow(
                                      color: _neonPink.withOpacity(0.35),
                                      blurRadius: 16,
                                      spreadRadius: 1,
                                    ),
                                  ]
                                : [],
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _isUrdu ? '1 بمقابلہ 1' : '1 vs 1',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _isUrdu
                                        ? 'دو میزبان الگ الگ اسکور کے ساتھ آمنے سامنے'
                                        : 'Two hosts compete in real-time',
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.6),
                                      fontSize: 11.5,
                                    ),
                                  ),
                                ],
                              ),
                              // Stylized 2 Hosts Silhouette Graphic
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: const Color(0xFF8B5CF6),
                                    child: const Icon(
                                      Icons.person,
                                      size: 20,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const Padding(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 6,
                                    ),
                                    child: Text(
                                      'VS',
                                      style: TextStyle(
                                        color: _neonPink,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w900,
                                        fontStyle: FontStyle.italic,
                                      ),
                                    ),
                                  ),
                                  CircleAvatar(
                                    radius: 18,
                                    backgroundColor: const Color(0xFFEC4899),
                                    child: const Icon(
                                      Icons.person,
                                      size: 20,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Card 2: 4-Host Battle (Locked & Disabled)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 8,
                      ),
                      child: GestureDetector(
                        onTap: () {
                          _showNotice(
                            _isUrdu
                                ? '4 میزبان جنگ فی الوقت مقفل ہے۔ آئندہ اپڈیٹ میں دستیاب ہوگی۔'
                                : '4-Host Battle is locked. Available in a future release.',
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: _cardBgLocked.withOpacity(0.85),
                            borderRadius: BorderRadius.circular(22),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.06),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _isUrdu ? '4 میزبان جنگ' : '4-Host Battle',
                                    style: TextStyle(
                                      color: Colors.white.withOpacity(0.9),
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  // 4 Avatar Silhouettes
                                  Row(
                                    children: List.generate(
                                      4,
                                      (i) => Padding(
                                        padding: const EdgeInsets.only(
                                          right: 6,
                                        ),
                                        child: CircleAvatar(
                                          radius: 11,
                                          backgroundColor: Colors.white
                                              .withOpacity(0.12),
                                          child: const Icon(
                                            Icons.person,
                                            size: 13,
                                            color: Colors.white54,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              // Closed Padlock Icon matching reference PNG
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.06),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.1),
                                  ),
                                ),
                                child: const Icon(
                                  Icons.lock_rounded,
                                  color: Color(0xFFF472B6),
                                  size: 20,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                // Bottom Section: Continue Button & Watermark Pill
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                  child: Column(
                    children: [
                      // Continue Button
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : _handleContinue,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _neonPink,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 8,
                            shadowColor: _neonPink.withOpacity(0.5),
                          ),
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  _isUrdu ? 'جاری رکھیں' : 'Continue',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Watermark Badge Pill matching reference PNG
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _watermarkPill,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.pinkAccent.withOpacity(0.4),
                          ),
                        ),
                        child: Column(
                          children: const [
                            Text(
                              '6.1 Battle Types',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11.5,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '(1v1, optional 4-host)',
                              style: TextStyle(
                                color: Color(0xFFFBCFE8),
                                fontSize: 10.5,
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
          ),
        ),
      ),
    );
  }
}
