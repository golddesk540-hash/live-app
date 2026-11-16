import 'package:flutter/material.dart';
import '../../../models/gifts/gift_models.dart';
import '../../../services/gifts/gift_session_manager.dart';
import '../../wallet/coin_packages_screen.dart';

/// Universal Gift Sending Bottom Sheet Panel
/// Integrates with Solo Live, Party Rooms, and PK Battles
/// Features:
/// - Real-time user coin balance & Top-Up entry point
/// - Dynamic category filtering loaded from backend
/// - Responsive gift grid with coin prices
/// - Quantity multipliers (1x, 5x, 10x, 66x, 99x)
/// - Server-authoritative pre-send quote validation
/// - 70% host earnings calculation
/// - Idempotent atomic backend transaction submission
class UniversalGiftPanel extends StatefulWidget {
  final String recipientHostId;
  final String recipientNickname;
  final String? recipientAvatarUrl;
  final String? liveRoomId;
  final String? pkBattleId;
  final String? senderUserId;
  final String? senderNickname;

  const UniversalGiftPanel({
    Key? key,
    required this.recipientHostId,
    required this.recipientNickname,
    this.recipientAvatarUrl,
    this.liveRoomId,
    this.pkBattleId,
    this.senderUserId,
    this.senderNickname,
  }) : super(key: key);

  static Future<GiftTransactionResult?> show({
    required BuildContext context,
    required String recipientHostId,
    required String recipientNickname,
    String? recipientAvatarUrl,
    String? liveRoomId,
    String? pkBattleId,
    String? senderUserId,
    String? senderNickname,
  }) {
    return showModalBottomSheet<GiftTransactionResult>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => UniversalGiftPanel(
        recipientHostId: recipientHostId,
        recipientNickname: recipientNickname,
        recipientAvatarUrl: recipientAvatarUrl,
        liveRoomId: liveRoomId,
        pkBattleId: pkBattleId,
        senderUserId: senderUserId,
        senderNickname: senderNickname,
      ),
    );
  }

  @override
  State<UniversalGiftPanel> createState() => _UniversalGiftPanelState();
}

class _UniversalGiftPanelState extends State<UniversalGiftPanel> {
  final GiftSessionManager _manager = GiftSessionManager.instance;

  int _quantity = 1;
  bool _isUrdu = false;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _manager.loadCatalog(userId: widget.senderUserId, previewDemo: true);
  }

  Future<void> _handleSendGift() async {
    final gift = _manager.selectedGift;
    if (gift == null || _isSending) return;

    final totalCoins = gift.coinPrice * _quantity;
    if (_manager.availableCoins < totalCoins) {
      _showInsufficientBalanceDialog(totalCoins);
      return;
    }

    setState(() => _isSending = true);

    final quote = await _manager.previewQuote(
      giftId: gift.giftId,
      quantity: _quantity,
      recipientHostId: widget.recipientHostId,
      liveRoomId: widget.liveRoomId,
      pkBattleId: widget.pkBattleId,
      userId: widget.senderUserId,
      previewDemo: true,
    );

    if (quote != null && quote.insufficientBalance) {
      setState(() => _isSending = false);
      _showInsufficientBalanceDialog(totalCoins);
      return;
    }

    final result = await _manager.sendGift(
      giftId: gift.giftId,
      quantity: _quantity,
      recipientHostId: widget.recipientHostId,
      liveRoomId: widget.liveRoomId,
      pkBattleId: widget.pkBattleId,
      senderUserId: widget.senderUserId,
      senderNickname: widget.senderNickname,
      previewDemo: true,
    );

    if (!mounted) return;
    setState(() => _isSending = false);

    if (result != null && result.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isUrdu
                ? '${gift.nameUr} x$_quantity کامیابی کے ساتھ ${widget.recipientNickname} کو بھیج دیا گیا! (+${result.hostPointsCredited} ہوسٹ پوائنٹس)'
                : 'Sent ${gift.name} x$_quantity to ${widget.recipientNickname}! (+${result.hostPointsCredited} host points · 70%)',
          ),
          backgroundColor: const Color(0xFF161622),
          duration: const Duration(seconds: 2),
        ),
      );
      Navigator.pop(context, result);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _manager.errorMessage ?? (_isUrdu ? 'تحفہ بھیجنے میں ناکامی' : 'Failed to send gift.'),
          ),
          backgroundColor: const Color(0xFFFF1768),
        ),
      );
    }
  }

  void _showInsufficientBalanceDialog(int requiredCoins) {
    final shortfall = requiredCoins - _manager.availableCoins;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF161622),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.account_balance_wallet_rounded, color: Color(0xFFFFB800), size: 24),
            const SizedBox(width: 10),
            Text(
              _isUrdu ? 'سکے ناکافی ہیں' : 'Insufficient Coins',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isUrdu
                  ? 'آپ کے پاس اس تحفے کو بھیجنے کے لیے کافی سکے نہیں ہیں۔'
                  : 'You do not have enough coins to complete this gift transaction.',
              style: const TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF22163A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFFB800).withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(_isUrdu ? 'مطلوبہ کمی:' : 'Shortfall:', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                  Text(
                    '$shortfall Coins',
                    style: const TextStyle(color: Color(0xFFFFB800), fontWeight: FontWeight.w900, fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(_isUrdu ? 'منسوخ' : 'Cancel', style: const TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFFB800),
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const CoinPackagesScreen(
                    userId: 'user_wallet_demo_701',
                    isSandbox: true,
                  ),
                ),
              );
              // Revalidate balance after returning from Top-Up
              await _manager.loadCatalog(previewDemo: true);
            },
            child: Text(
              _isUrdu ? 'ابھی ریچارج کریں' : 'Top Up Now',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _manager,
      builder: (context, _) {
        final gifts = _manager.filteredGifts;
        final selectedGift = _manager.selectedGift;
        final totalCoins = (selectedGift?.coinPrice ?? 0) * _quantity;
        final hostEarn = (totalCoins * 0.70).floor();

        return Directionality(
          textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
          child: Container(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            decoration: const BoxDecoration(
              color: Color(0xFF14141F),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              border: Border(top: BorderSide(color: Color(0xFF2A2A3E), width: 1.5)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Header: Recipient Host, Balance & Language Toggle
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Recipient Indicator
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 14,
                          backgroundImage: widget.recipientAvatarUrl != null &&
                                  widget.recipientAvatarUrl!.isNotEmpty
                              ? NetworkImage(widget.recipientAvatarUrl!)
                              : null,
                          backgroundColor: const Color(0xFFFF1768).withOpacity(0.2),
                          child: widget.recipientAvatarUrl == null ||
                                  widget.recipientAvatarUrl!.isEmpty
                              ? Text(
                                  widget.recipientNickname.isNotEmpty
                                      ? widget.recipientNickname[0].toUpperCase()
                                      : 'H',
                                  style: const TextStyle(fontSize: 10, color: Color(0xFFFF1768)),
                                )
                              : null,
                        ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isUrdu ? 'تحفہ وصول کنندہ:' : 'Sending to:',
                              style: const TextStyle(color: Colors.white54, fontSize: 10),
                            ),
                            Text(
                              widget.recipientNickname,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    // Coin Balance Pill & Lang Toggle
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => setState(() => _isUrdu = !_isUrdu),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white10,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white24),
                            ),
                            child: Text(
                              _isUrdu ? 'EN' : 'اردو',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        GestureDetector(
                          onTap: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const CoinPackagesScreen(
                                  userId: 'user_wallet_demo_701',
                                  isSandbox: true,
                                ),
                              ),
                            );
                            await _manager.loadCatalog(previewDemo: true);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFF251F38),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFFFB800).withOpacity(0.4)),
                            ),
                            child: Row(
                              children: [
                                const Text('🪙', style: TextStyle(fontSize: 13)),
                                const SizedBox(width: 4),
                                Text(
                                  '${_manager.availableCoins}',
                                  style: const TextStyle(
                                    color: Color(0xFFFFB800),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(Icons.add_circle_rounded, color: Color(0xFFFFB800), size: 14),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // 2. Category Filter Tabs
                SizedBox(
                  height: 34,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _manager.categories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final cat = _manager.categories[index];
                      final isSelected = _manager.selectedCategorySlug == cat.slug;

                      return GestureDetector(
                        onTap: () => _manager.selectCategory(cat.slug),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFFFF1768)
                                : const Color(0xFF1F1F2E),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected ? const Color(0xFFFF1768) : Colors.white12,
                            ),
                          ),
                          child: Text(
                            _isUrdu ? cat.shortNameUr : cat.shortName,
                            style: TextStyle(
                              color: isSelected ? Colors.white : Colors.white70,
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 14),

                // 3. Responsive Gift Grid
                SizedBox(
                  height: 140,
                  child: _manager.isLoading
                      ? const Center(
                          child: CircularProgressIndicator(color: Color(0xFFFF1768)),
                        )
                      : gifts.isEmpty
                          ? Center(
                              child: Text(
                                _isUrdu ? 'اس زمرے میں کوئی تحفہ دستیاب نہیں' : 'No gifts available in this category',
                                style: const TextStyle(color: Colors.white54, fontSize: 12),
                              ),
                            )
                          : ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: gifts.length,
                              separatorBuilder: (_, __) => const SizedBox(width: 10),
                              itemBuilder: (ctx, index) {
                                final gift = gifts[index];
                                final isSelected = selectedGift?.giftId == gift.giftId;

                                return GestureDetector(
                                  onTap: () {
                                    _manager.selectGift(gift);
                                    if (!gift.allowedQuantities.contains(_quantity)) {
                                      setState(() => _quantity = 1);
                                    }
                                  },
                                  child: Container(
                                    width: 100,
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? const Color(0xFF2B223F)
                                          : const Color(0xFF1E1E2C),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                        color: isSelected
                                            ? const Color(0xFFFFB800)
                                            : Colors.white12,
                                        width: isSelected ? 1.8 : 1,
                                      ),
                                      boxShadow: isSelected
                                          ? [
                                              BoxShadow(
                                                color: const Color(0xFFFFB800).withOpacity(0.3),
                                                blurRadius: 10,
                                              ),
                                            ]
                                          : null,
                                    ),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        // Animation Tag
                                        if (gift.hasAnimation)
                                          Container(
                                            margin: const EdgeInsets.only(bottom: 2),
                                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF00E5FF).withOpacity(0.2),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: const Text(
                                              'ANIMATED',
                                              style: TextStyle(
                                                color: Color(0xFF00E5FF),
                                                fontSize: 7.5,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),

                                        // Gift Graphic / Icon
                                        _buildGiftIcon(gift.name),
                                        const SizedBox(height: 6),

                                        // Name
                                        Text(
                                          _isUrdu ? gift.nameUr : gift.name,
                                          style: TextStyle(
                                            color: isSelected ? Colors.white : Colors.white70,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          textAlign: TextAlign.center,
                                        ),
                                        const SizedBox(height: 4),

                                        // Price
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            const Text('🪙', style: TextStyle(fontSize: 10)),
                                            const SizedBox(width: 2),
                                            Text(
                                              '${gift.coinPrice}',
                                              style: const TextStyle(
                                                color: Color(0xFFFFB800),
                                                fontSize: 11,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                ),

                const SizedBox(height: 14),

                // 4. Quantity Multipliers (Allowed: 1x, 5x, 10x, 66x, 99x)
                Row(
                  children: [
                    Text(
                      _isUrdu ? 'تعداد:' : 'Quantity:',
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                    const SizedBox(width: 10),
                    ...((selectedGift?.allowedQuantities ?? [1, 5, 10, 66, 99])).map((q) {
                      final isSel = _quantity == q;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: GestureDetector(
                          onTap: () => setState(() => _quantity = q),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: isSel
                                  ? const Color(0xFFFFB800)
                                  : const Color(0xFF1E1E2C),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSel ? const Color(0xFFFFB800) : Colors.white12,
                              ),
                            ),
                            child: Text(
                              '${q}x',
                              style: TextStyle(
                                color: isSel ? Colors.black : Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ],
                ),

                const SizedBox(height: 18),

                // 5. Send Action Button with Total Cost & 70% Host Points Display
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF1768),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                      elevation: 6,
                    ),
                    onPressed: _isSending || selectedGift == null ? null : _handleSendGift,
                    child: _isSending
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.volunteer_activism_rounded, size: 18, color: Colors.white),
                              const SizedBox(width: 8),
                              Text(
                                _isUrdu
                                    ? 'تحفہ بھیجیں ($totalCoins سکے · ہوسٹ کو +$hostEarn پوائنٹس 70%)'
                                    : 'Send Gift ($totalCoins Coins · Host gets +$hostEarn Pts 70%)',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5),
                              ),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildGiftIcon(String giftName) {
    final lower = giftName.toLowerCase();
    if (lower.contains('crown')) {
      return const Icon(Icons.workspace_premium, color: Color(0xFFFFB800), size: 34);
    } else if (lower.contains('rocket') || lower.contains('car')) {
      return const Icon(Icons.rocket_launch, color: Color(0xFF00E5FF), size: 34);
    } else if (lower.contains('rose') || lower.contains('heart')) {
      return const Icon(Icons.favorite, color: Color(0xFFFF1768), size: 34);
    } else if (lower.contains('teddy') || lower.contains('ring')) {
      return const Icon(Icons.diamond_rounded, color: Color(0xFF90CAF9), size: 34);
    }
    return const Icon(Icons.card_giftcard, color: Color(0xFFFFB800), size: 34);
  }
}
