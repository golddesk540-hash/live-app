import 'package:flutter/material.dart';
import '../../../models/pk/pk_models.dart';
import '../../../services/pk/pk_session_manager.dart';

/// PK Gift Bottom Sheet Modal
/// Allows live viewers and hosts to send real-time gifts supporting Host A or Host B
/// Features:
/// - Authoritative 1 Coin = 1 PK Point scoring
/// - Side-specific recipient selection (Host A Pink vs Host B Cyan)
/// - Dynamic wallet coin balance deduction
/// - Pre-configured quantity multipliers (1x, 5x, 10x, 99x)
/// - Full bilingual English/Urdu compatibility
class PkGiftSheetDialog extends StatefulWidget {
  final PkBattle battle;
  final String senderId;
  final String senderName;

  const PkGiftSheetDialog({
    Key? key,
    required this.battle,
    required this.senderId,
    required this.senderName,
  }) : super(key: key);

  static Future<bool?> show({
    required BuildContext context,
    required PkBattle battle,
    required String senderId,
    required String senderName,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => PkGiftSheetDialog(
        battle: battle,
        senderId: senderId,
        senderName: senderName,
      ),
    );
  }

  @override
  State<PkGiftSheetDialog> createState() => _PkGiftSheetDialogState();
}

class _PkGiftSheetDialogState extends State<PkGiftSheetDialog> {
  final PkSessionManager _manager = PkSessionManager.instance;

  String _selectedSide = 'host_a'; // 'host_a' or 'host_b'
  PkGiftItem? _selectedGift;
  int _selectedQuantity = 1;
  bool _isSending = false;
  bool _isUrdu = false;

  // Fallback canonical catalog if network delay occurs
  final List<PkGiftItem> _fallbackCatalog = const [
    PkGiftItem(
      id: 'gift_rose_01',
      name: 'Rose',
      nameUr: 'گلاب',
      coinPrice: 10,
      currencyIcon: '🪙',
      imageUrl: '',
      animationName: 'rose_cascade',
      category: 'popular',
      displayOrder: 1,
    ),
    PkGiftItem(
      id: 'gift_heart_02',
      name: 'Love Heart',
      nameUr: 'دل',
      coinPrice: 50,
      currencyIcon: '🪙',
      imageUrl: '',
      animationName: 'heart_pulse',
      category: 'popular',
      displayOrder: 2,
    ),
    PkGiftItem(
      id: 'gift_diamond_ring_03',
      name: 'Diamond Ring',
      nameUr: 'ہیرے کی انگوٹھی',
      coinPrice: 100,
      currencyIcon: '🪙',
      imageUrl: '',
      animationName: 'ring_sparkle',
      category: 'exclusive',
      displayOrder: 3,
    ),
    PkGiftItem(
      id: 'gift_crown_04',
      name: 'Golden Crown',
      nameUr: 'سنہری تاج',
      coinPrice: 500,
      currencyIcon: '🪙',
      imageUrl: '',
      animationName: 'crown_burst',
      category: 'luxury',
      displayOrder: 4,
    ),
    PkGiftItem(
      id: 'gift_rocket_05',
      name: 'Galaxy Rocket',
      nameUr: 'خلائی راکٹ',
      coinPrice: 1200,
      currencyIcon: '🪙',
      imageUrl: '',
      animationName: 'rocket_launch',
      category: 'epic',
      displayOrder: 5,
    ),
    PkGiftItem(
      id: 'gift_dragon_06',
      name: 'Popo Dragon',
      nameUr: 'پوپو ڈریگن',
      coinPrice: 3000,
      currencyIcon: '🪙',
      imageUrl: '',
      animationName: 'dragon_roar',
      category: 'mythic',
      displayOrder: 6,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    await Future.wait([
      _manager.loadGiftCatalog(widget.battle.id),
      _manager.loadWallet(battleId: widget.battle.id, userId: widget.senderId),
    ]);

    if (mounted) {
      final catalog = _manager.giftCatalog.isNotEmpty
          ? _manager.giftCatalog
          : _fallbackCatalog;
      setState(() {
        if (_selectedGift == null && catalog.isNotEmpty) {
          _selectedGift = catalog[0];
        }
      });
    }
  }

  Future<void> _sendGift() async {
    if (_selectedGift == null || _isSending) return;

    final totalCoins = _selectedGift!.coinPrice * _selectedQuantity;
    final currentCoins = _manager.wallet?.coins ?? 0;

    if (currentCoins < totalCoins) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isUrdu
                ? 'سکے ناکافی ہیں! براہ کرم اپنا والیٹ ریچارج کریں۔'
                : 'Insufficient coins! Please recharge your wallet.',
          ),
          backgroundColor: const Color(0xFFFF1768),
        ),
      );
      return;
    }

    setState(() => _isSending = true);

    final success = await _manager.sendGiftToHost(
      receiverSide: _selectedSide,
      gift: _selectedGift!,
      quantity: _selectedQuantity,
      senderId: widget.senderId,
      senderName: widget.senderName,
    );

    if (mounted) {
      setState(() => _isSending = false);
      if (success) {
        final recipient = _selectedSide == 'host_a'
            ? widget.battle.hostA.nickname
            : widget.battle.hostB.nickname;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isUrdu
                  ? 'تحفہ $recipient کو بھیج دیا گیا! +$totalCoins پوائنٹس'
                  : 'Sent ${_selectedGift!.name} x$_selectedQuantity to $recipient! +$totalCoins pts',
            ),
            backgroundColor: const Color(0xFF161622),
            duration: const Duration(seconds: 2),
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isUrdu ? 'تحفہ بھیجنے میں ناکامی' : 'Failed to send gift. Battle may have ended.',
            ),
            backgroundColor: const Color(0xFFFF1768),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final catalog = _manager.giftCatalog.isNotEmpty
        ? _manager.giftCatalog
        : _fallbackCatalog;

    final coins = _manager.wallet?.coins ?? 3600;
    final hostA = widget.battle.hostA;
    final hostB = widget.battle.hostB;

    final selectedTotalCoins =
        (_selectedGift?.coinPrice ?? 0) * _selectedQuantity;

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
            // 1. Header: Recipient Selector & Wallet Coins
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Recipient Toggle
                Row(
                  children: [
                    _buildRecipientButton(
                      side: 'host_a',
                      label: hostA.nickname,
                      accentColor: const Color(0xFFFF1768),
                      avatarUrl: hostA.avatar,
                    ),
                    const SizedBox(width: 8),
                    _buildRecipientButton(
                      side: 'host_b',
                      label: hostB.nickname,
                      accentColor: const Color(0xFF00E5FF),
                      avatarUrl: hostB.avatar,
                    ),
                  ],
                ),

                // Language Toggle & Wallet Balance
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
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF251F38),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFFB800).withOpacity(0.4)),
                      ),
                      child: Row(
                        children: [
                          const Text('🪙', style: TextStyle(fontSize: 14)),
                          const SizedBox(width: 4),
                          Text(
                            '$coins',
                            style: const TextStyle(
                              color: Color(0xFFFFB800),
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 16),

            // 2. Gift Items Grid (Horizontal scroll or wrapped grid)
            SizedBox(
              height: 130,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: catalog.length,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (ctx, index) {
                  final gift = catalog[index];
                  final isSelected = _selectedGift?.id == gift.id;

                  return GestureDetector(
                    onTap: () => setState(() => _selectedGift = gift),
                    child: Container(
                      width: 95,
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
                          width: isSelected ? 1.5 : 1,
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
                          // Graphic / Icon
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

            const SizedBox(height: 16),

            // 3. Quantity Multipliers (1x, 5x, 10x, 99x)
            Row(
              children: [
                Text(
                  _isUrdu ? 'تعداد:' : 'Quantity:',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(width: 12),
                ...[1, 5, 10, 99].map((q) {
                  final isSel = _selectedQuantity == q;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedQuantity = q),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSel
                              ? const Color(0xFFFFB800)
                              : const Color(0xFF1E1E2C),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${q}x',
                          style: TextStyle(
                            color: isSel ? Colors.black : Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ],
            ),

            const SizedBox(height: 20),

            // 4. Send Gift Action Button
            SizedBox(
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _selectedSide == 'host_a'
                      ? const Color(0xFFFF1768)
                      : const Color(0xFF00E5FF),
                  foregroundColor: _selectedSide == 'host_a' ? Colors.white : Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                  elevation: 6,
                ),
                onPressed: _isSending ? null : _sendGift,
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
                          Icon(
                            Icons.volunteer_activism_rounded,
                            size: 18,
                            color: _selectedSide == 'host_a' ? Colors.white : Colors.black,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _isUrdu
                                ? 'تحفہ بھیجیں ($selectedTotalCoins سکے / +$selectedTotalCoins پوائنٹس)'
                                : 'Send Gift ($selectedTotalCoins Coins / +$selectedTotalCoins Pts)',
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecipientButton({
    required String side,
    required String label,
    required Color accentColor,
    required String avatarUrl,
  }) {
    final isSelected = _selectedSide == side;

    return GestureDetector(
      onTap: () => setState(() => _selectedSide = side),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? accentColor.withOpacity(0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? accentColor : Colors.white24,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 10,
              backgroundImage: avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
              child: avatarUrl.isEmpty
                  ? Text(label.isNotEmpty ? label[0].toUpperCase() : 'H',
                      style: TextStyle(fontSize: 8, color: accentColor))
                  : null,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? accentColor : Colors.white70,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGiftIcon(String giftName) {
    if (giftName.contains('Crown')) {
      return const Icon(Icons.workspace_premium, color: Color(0xFFFFB800), size: 36);
    } else if (giftName.contains('Rocket')) {
      return const Icon(Icons.rocket_launch, color: Color(0xFF00E5FF), size: 36);
    } else if (giftName.contains('Rose')) {
      return const Icon(Icons.favorite, color: Color(0xFFFF1768), size: 36);
    } else if (giftName.contains('Ring')) {
      return const Icon(Icons.diamond_rounded, color: Color(0xFF90CAF9), size: 36);
    } else if (giftName.contains('Dragon')) {
      return const Icon(Icons.auto_awesome, color: Color(0xFFFF9100), size: 36);
    }
    return const Icon(Icons.card_giftcard, color: Color(0xFFFFB800), size: 36);
  }
}
