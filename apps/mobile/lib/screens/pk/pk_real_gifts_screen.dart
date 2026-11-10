import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 6 Module 6.10: PK Battle Hand-off to Real Gifts
/// Exact 1:1 Design Reference: 06_10_hand_off_to_real_gifts.png
/// Flutter implementation for Android & iOS
/// ============================================================================

class PKRealGiftsScreen extends StatefulWidget {
  final String battleId;
  final String currentUserId;
  final String currentUserName;
  final String apiBaseUrl;
  final VoidCallback? onBack;

  const PKRealGiftsScreen({
    Key? key,
    this.battleId = '00000000-0000-0000-0000-000000000603',
    this.currentUserId = 'user_viewer_9001',
    this.currentUserName = 'Ali',
    this.apiBaseUrl = 'https://kigolive.com',
    this.onBack,
  }) : super(key: key);

  @override
  State<PKRealGiftsScreen> createState() => _PKRealGiftsScreenState();
}

class _PKRealGiftsScreenState extends State<PKRealGiftsScreen> {
  bool _isUrdu = false;
  String _selectedGiftId = 'rose';
  String _selectedHostSide = 'host_a'; // 'host_a' or 'host_b'
  int _viewerCoins = 3600; // 3,600 coins matching 06_10 reference
  bool _isSending = false;
  String? _statusMessage;
  bool _isSuccess = false;

  // Active animation burst
  Map<String, dynamic>? _activeAnimation;

  // Colors matching 06_10_hand_off_to_real_gifts.png
  static const Color _bgDark = Color(0xFF0A0618);
  static const Color _cardBg = Color(0xFF150F28);
  static const Color _borderColor = Color(0xFF2B1B47);
  static const Color _neonPink = Color(0xFFFF2D78);

  // 6 Approved Gifts from 06_10_hand_off_to_real_gifts.png
  final List<Map<String, dynamic>> _gifts = [
    {
      'id': 'rose',
      'name': 'Rose',
      'nameUr': 'گلاب',
      'price': 1,
      'currency': 'heart',
      'emoji': '🌹',
    },
    {
      'id': 'heart',
      'name': 'Heart',
      'nameUr': 'دل',
      'price': 10,
      'currency': 'heart',
      'emoji': '💖',
    },
    {
      'id': 'crown',
      'name': 'Crown',
      'nameUr': 'تاج',
      'price': 50,
      'currency': 'coin',
      'emoji': '👑',
    },
    {
      'id': 'car',
      'name': 'Sports Car',
      'nameUr': 'اسپورٹس کار',
      'price': 200,
      'currency': 'coin',
      'emoji': '🚗',
    },
    {
      'id': 'castle',
      'name': 'Magic Castle',
      'nameUr': 'جادوئی محل',
      'price': 500,
      'currency': 'coin',
      'emoji': '🏰',
    },
    {
      'id': 'rocket',
      'name': 'Space Rocket',
      'nameUr': 'خلائی راکٹ',
      'price': 1000,
      'currency': 'diamond',
      'emoji': '🚀',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchWallet();
  }

  Future<void> _fetchWallet() async {
    try {
      final url = Uri.parse(
          '${widget.apiBaseUrl}/api/pk/battle/${widget.battleId}/gifts/wallet?userId=${widget.currentUserId}');
      final res = await http.get(url).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['wallet'] != null && mounted) {
          setState(() {
            _viewerCoins = data['wallet']['coins'] ?? 3600;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _sendGift() async {
    final gift = _gifts.firstWhere((g) => g['id'] == _selectedGiftId);
    final price = gift['price'] as int;

    if (_viewerCoins < price) {
      setState(() {
        _statusMessage = _isUrdu
            ? 'سکے ناکافی ہیں۔ براہ کرم ریچارج کریں۔'
            : 'Insufficient coins. Please recharge.';
        _isSuccess = false;
      });
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) setState(() => _statusMessage = null);
      });
      return;
    }

    setState(() {
      _isSending = true;
      _statusMessage = null;
    });

    try {
      final url = Uri.parse(
          '${widget.apiBaseUrl}/api/pk/battle/${widget.battleId}/gifts/send');
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'battleId': widget.battleId,
          'senderId': widget.currentUserId,
          'senderName': widget.currentUserName,
          'receiverSide': _selectedHostSide,
          'giftId': gift['id'],
          'quantity': 1,
        }),
      ).timeout(const Duration(seconds: 4));

      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _viewerCoins = data['sender']['remainingCoins'] ?? (_viewerCoins - price);
          _isSuccess = true;
          _statusMessage = _isUrdu
              ? '${gift['nameUr']} کامیابی سے بھیج دیا گیا!'
              : 'Sent ${gift['name']} successfully!';
          _activeAnimation = {
            'emoji': gift['emoji'],
            'name': gift['name'],
            'points': price,
          };
        });

        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) setState(() => _activeAnimation = null);
        });
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) setState(() => _statusMessage = null);
        });
      } else {
        setState(() {
          _isSuccess = false;
          _statusMessage = data['error'] ?? 'Gift send failed';
        });
      }
    } catch (_) {
      setState(() {
        _isSuccess = false;
        _statusMessage = 'Network error sending gift';
      });
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
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
              Column(
                children: [
                  // 1. Top Header
                  _buildHeader(),

                  // 2. Recipient Selector
                  _buildRecipientSelector(),

                  // 3. 2x3 Gift Grid
                  Expanded(child: _buildGiftGrid()),

                  // Status Notice
                  if (_statusMessage != null) _buildStatusBanner(),

                  // 4. Bottom Coin Bar + Send Button
                  _buildBottomBar(),

                  // 5. Watermark Pill
                  _buildWatermark(),
                ],
              ),

              // Gift Burst Animation
              if (_activeAnimation != null) _buildBurstAnimation(),
            ],
          ),
        ),
      ),
    );
  }

  // --- 1. Top Header ---
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          GestureDetector(
            onTap: widget.onBack ?? () => Navigator.of(context).maybePop(),
            child: Icon(
              _isUrdu ? Icons.arrow_forward_ios : Icons.arrow_back_ios_new,
              color: Colors.white70,
              size: 18,
            ),
          ),
          Text(
            _isUrdu ? 'تحفہ بھیجیں' : 'Send Gift',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 18,
              letterSpacing: 0.5,
            ),
          ),
          GestureDetector(
            onTap: () => setState(() => _isUrdu = !_isUrdu),
            child: const Icon(Icons.language, color: _neonPink, size: 20),
          ),
        ],
      ),
    );
  }

  // --- 2. Recipient Selector ---
  Widget _buildRecipientSelector() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: const Color(0xFF140E29),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF2E1D4D)),
        ),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedHostSide = 'host_a'),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    gradient: _selectedHostSide == 'host_a'
                        ? const LinearGradient(
                            colors: [_neonPink, Color(0xFFEC4899)],
                          )
                        : null,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      'Sara Live (A)',
                      style: TextStyle(
                        color: _selectedHostSide == 'host_a'
                            ? Colors.white
                            : Colors.white54,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedHostSide = 'host_b'),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    gradient: _selectedHostSide == 'host_b'
                        ? const LinearGradient(
                            colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
                          )
                        : null,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      'Ayesha (B)',
                      style: TextStyle(
                        color: _selectedHostSide == 'host_b'
                            ? Colors.white
                            : Colors.white54,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
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

  // --- 3. 2x3 Gift Grid (Exact Match to 06_10) ---
  Widget _buildGiftGrid() {
    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 0.95,
      ),
      itemCount: _gifts.length,
      itemBuilder: (context, index) {
        final gift = _gifts[index];
        final isSelected = _selectedGiftId == gift['id'];

        return GestureDetector(
          onTap: () => setState(() => _selectedGiftId = gift['id']),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF1E1338) : _cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isSelected ? _neonPink : _borderColor,
                width: isSelected ? 2 : 1,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: _neonPink.withOpacity(0.4),
                        blurRadius: 12,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  gift['emoji'],
                  style: const TextStyle(fontSize: 38),
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      gift['currency'] == 'heart'
                          ? '💗'
                          : gift['currency'] == 'diamond'
                              ? '💎'
                              : '🪙',
                      style: const TextStyle(fontSize: 10),
                    ),
                    const SizedBox(width: 3),
                    Text(
                      '${gift['price']}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: _isSuccess
            ? Colors.green.withOpacity(0.2)
            : Colors.red.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _isSuccess ? Colors.green : Colors.red,
          width: 0.8,
        ),
      ),
      child: Text(
        _statusMessage!,
        style: TextStyle(
          color: _isSuccess ? Colors.greenAccent : Colors.redAccent,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  // --- 4. Bottom Coin Bar + Send Button ---
  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Coin Circle & Balance (3,600)
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Color(0xFFF59E0B), Color(0xFFFDE047)],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.amber,
                      blurRadius: 8,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: const Center(
                  child: Text('🪙', style: TextStyle(fontSize: 16)),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '$_viewerCoins',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 18,
                ),
              ),
            ],
          ),

          // Neon Pink Send Button
          ElevatedButton(
            onPressed: _isSending ? null : _sendGift,
            style: ElevatedButton.styleFrom(
              backgroundColor: _neonPink,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(22),
              ),
              elevation: 6,
            ),
            child: Text(
              _isSending
                  ? (_isUrdu ? 'بھیج رہا ہے...' : 'Sending...')
                  : (_isUrdu ? 'بھیجیں' : 'Send'),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 14,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // --- 5. Bottom Watermark ("6.10 Hand-off to Real Gifts") ---
  Widget _buildWatermark() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      alignment: Alignment.center,
      child: Container(
        width: 250,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF831843), Color(0xFF881337), Color(0xFF9F1239)],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: _neonPink.withOpacity(0.4)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF9F1239).withOpacity(0.5),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Text(
          _isUrdu ? '6.10 اصلی تحائف پر منتقلی' : '6.10 Hand-off to Real Gifts',
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 13,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }

  // --- Floating Gift Burst ---
  Widget _buildBurstAnimation() {
    return Positioned.fill(
      child: IgnorePointer(
        child: Container(
          color: Colors.black.withOpacity(0.5),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _activeAnimation!['emoji'],
                  style: const TextStyle(fontSize: 72),
                ),
                const SizedBox(height: 8),
                Text(
                  '+${_activeAnimation!['points']} PK Points!',
                  style: const TextStyle(
                    color: _neonPink,
                    fontWeight: FontWeight.w900,
                    fontSize: 20,
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
