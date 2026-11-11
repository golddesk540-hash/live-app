import 'package:flutter/material.dart';

/// ============================================================================
/// Popo Live — Phase 7 Module 7.2: Gift Detail & Animation Preview Sheet
/// Strict rule: Read-only preview. Selecting a gift NEVER deducts coins.
/// ============================================================================

class GiftDetailSheet extends StatefulWidget {
  final Map<String, dynamic> gift;
  final int? viewerCoinBalance;
  final String apiBaseUrl;
  final bool isUrdu;
  final ValueChanged<Map<String, dynamic>>? onSelectGift;

  const GiftDetailSheet({
    Key? key,
    required this.gift,
    this.viewerCoinBalance,
    this.apiBaseUrl = 'https://kigolive.com',
    this.isUrdu = false,
    this.onSelectGift,
  }) : super(key: key);

  @override
  State<GiftDetailSheet> createState() => _GiftDetailSheetState();
}

class _GiftDetailSheetState extends State<GiftDetailSheet>
    with SingleTickerProviderStateMixin {
  static const Color _bgCard = Color(0xFF1A0B3B);
  static const Color _cardBorder = Color(0xFF472185);
  static const Color _neonPink = Color(0xFFFF1E8A);
  static const Color _goldAccent = Color(0xFFFFC83B);

  late final AnimationController _animController;
  late final Animation<double> _floatAnim;
  bool _playing = true;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
    _floatAnim = Tween<double>(begin: 0.96, end: 1.08).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  String _resolveUrl(String? rawUrl) {
    final val = (rawUrl ?? '').trim();
    if (val.isEmpty) return '${widget.apiBaseUrl}/assets/gifts/fallback_gift.png';
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    return '${widget.apiBaseUrl}$val';
  }

  void _toggleAnimation() {
    setState(() {
      _playing = !_playing;
      if (_playing) {
        _animController.repeat(reverse: true);
      } else {
        _animController.stop();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final gift = widget.gift;
    final bool ur = widget.isUrdu;
    final String name = (ur && gift['nameUr'] != null && gift['nameUr'].toString().isNotEmpty)
        ? gift['nameUr'].toString()
        : (gift['name']?.toString() ?? 'Virtual Gift');
    final String desc = (ur && gift['descriptionUr'] != null && gift['descriptionUr'].toString().isNotEmpty)
        ? gift['descriptionUr'].toString()
        : (gift['description']?.toString() ?? '');
    final String categoryName = (ur && gift['categoryNameUr'] != null && gift['categoryNameUr'].toString().isNotEmpty)
        ? gift['categoryNameUr'].toString()
        : (gift['categoryName']?.toString() ?? 'Gift');
    final int coinPrice = (gift['coinPrice'] as num?)?.toInt() ?? 0;
    final int usageCount = (gift['usageCount'] as num?)?.toInt() ?? 0;
    final String assetType = (gift['assetType']?.toString() ?? 'png').toUpperCase();
    final bool isActive = gift['isActive'] != false;
    final String imgUrl = _resolveUrl(gift['imageUrl']?.toString() ?? gift['thumbnailUrl']?.toString());
    final String fallbackUrl = _resolveUrl(gift['fallbackImageUrl']?.toString());

    final bool hasBalance = widget.viewerCoinBalance != null;
    final bool canAfford = hasBalance && widget.viewerCoinBalance! >= coinPrice;

    return Directionality(
      textDirection: ur ? TextDirection.rtl : TextDirection.ltr,
      child: Container(
        decoration: const BoxDecoration(
          color: _bgCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(top: BorderSide(color: _cardBorder, width: 1.5)),
        ),
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 14,
          bottom: 20 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.purple.shade200.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$categoryName • $assetType',
                          style: TextStyle(
                            color: Colors.purple.shade200,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: Colors.white70),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Large Animated Gift Preview Box
              ScaleTransition(
                scale: _floatAnim,
                child: Container(
                  width: 156,
                  height: 156,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        _neonPink.withOpacity(0.25),
                        Colors.deepPurple.shade900.withOpacity(0.2),
                        Colors.transparent,
                      ],
                    ),
                  ),
                  child: Center(
                    child: Image.network(
                      imgUrl,
                      width: 128,
                      height: 128,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => Image.network(
                        fallbackUrl,
                        width: 112,
                        height: 112,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.card_giftcard_rounded,
                          size: 72,
                          color: _neonPink,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // Animation Play / Asset Type Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  InkWell(
                    onTap: _toggleAnimation,
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF281054),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: _neonPink.withOpacity(0.45)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _playing ? Icons.pause_rounded : Icons.play_arrow_rounded,
                            size: 15,
                            color: Colors.pink.shade200,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _playing ? (ur ? 'روکیں' : 'Pause') : (ur ? 'چلائیں' : 'Play'),
                            style: TextStyle(color: Colors.pink.shade100, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF220D47),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _cardBorder),
                    ),
                    child: Text(
                      assetType,
                      style: TextStyle(
                        color: Colors.amber.shade300,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Price Tag Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF27104E),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: _goldAccent.withOpacity(0.55)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.monetization_on_rounded, color: _goldAccent, size: 20),
                    const SizedBox(width: 6),
                    Text(
                      '$coinPrice ${ur ? 'سکے' : 'Coins'}',
                      style: const TextStyle(
                        color: _goldAccent,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              if (desc.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  desc,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.purple.shade100.withOpacity(0.88),
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
              const SizedBox(height: 14),

              // Stats Row
              Row(
                children: [
                  Expanded(
                    child: _metaTile(
                      ur ? 'کیٹیگری' : 'Category',
                      categoryName,
                      Colors.white,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _metaTile(
                      ur ? 'مقبولیت' : 'Sends',
                      '$usageCount',
                      Colors.pink.shade200,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _metaTile(
                      ur ? 'حالت' : 'Status',
                      isActive ? (ur ? 'دستیاب' : 'Available') : (ur ? 'بند' : 'Disabled'),
                      isActive ? Colors.greenAccent.shade200 : Colors.redAccent.shade100,
                    ),
                  ),
                ],
              ),

              if (hasBalance) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                  decoration: BoxDecoration(
                    color: const Color(0xFF13062A),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _cardBorder),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${ur ? 'موجودہ سکے' : 'Your Coins'}: ${widget.viewerCoinBalance}',
                        style: const TextStyle(
                          color: _goldAccent,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        canAfford
                            ? (ur ? 'بھیجنے کے لیے کافی' : 'Ready to send')
                            : (ur ? 'مزید سکے درکار ہیں' : 'Top-up needed'),
                        style: TextStyle(
                          color: canAfford ? Colors.greenAccent : Colors.amber.shade200,
                          fontWeight: FontWeight.w600,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 10),
              Text(
                ur
                    ? 'صرف پیش نظارہ — کیٹلاگ میں کوئی سکہ منہا نہیں ہوتا'
                    : 'Preview only — selecting a gift does not deduct coins.',
                style: TextStyle(color: Colors.purple.shade300, fontSize: 11),
              ),
              const SizedBox(height: 14),

              // Select Gift Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: isActive
                      ? () {
                          Navigator.of(context).pop();
                          widget.onSelectGift?.call(gift);
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _neonPink,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                    elevation: 6,
                  ),
                  child: Text(
                    '${ur ? 'گفٹ منتخب کریں' : 'Select Gift'} — $coinPrice ${ur ? 'سکے' : 'Coins'}',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _metaTile(String label, String value, Color valueColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF13062A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _cardBorder.withOpacity(0.7)),
      ),
      child: Column(
        children: [
          Text(label, style: TextStyle(color: Colors.purple.shade300, fontSize: 10)),
          const SizedBox(height: 3),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: valueColor,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
