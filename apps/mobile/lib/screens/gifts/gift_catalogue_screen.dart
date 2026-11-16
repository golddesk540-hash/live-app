import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/gifts/gift_models.dart';
import '../../services/gifts/gift_session_manager.dart';

/// Popo Live — M6: Complete Virtual Gift Catalogue Screen
/// Displays the actual virtual gift catalogue returned by the backend (GET /api/gifts/catalog)
/// Features:
/// - Real-time category filtering (Popular, Luxury, Love, Premium, Basic, Event, etc.)
/// - Full search support across English and Urdu names
/// - Accurate coin pricing, animated badge tags, and availability status
/// - User wallet balance indicator with top-up entry point
/// - Responsive dark grid adhering to Popo Live branding (#0D0D12 / #161622)
/// - Bilingual English/Urdu and full RTL compatibility
class GiftCatalogueScreen extends StatefulWidget {
  final String? userId;
  final ValueChanged<GiftItem>? onGiftSelected;
  final VoidCallback? onOpenWallet;

  const GiftCatalogueScreen({
    Key? key,
    this.userId,
    this.onGiftSelected,
    this.onOpenWallet,
  }) : super(key: key);

  @override
  State<GiftCatalogueScreen> createState() => _GiftCatalogueScreenState();
}

class _GiftCatalogueScreenState extends State<GiftCatalogueScreen> {
  final GiftSessionManager _manager = GiftSessionManager.instance;
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;

  bool _isUrdu = false;

  // Popo Live Branding Colors
  static const Color _bgDark = Color(0xFF0D0D12);
  static const Color _surface = Color(0xFF161622);
  static const Color _cardBg = Color(0xFF1E1E2C);
  static const Color _pink = Color(0xFFFF1768);
  static const Color _cyan = Color(0xFF00E5FF);
  static const Color _gold = Color(0xFFFFB800);

  @override
  void initState() {
    super.initState();
    _manager.loadCatalog(userId: widget.userId, previewDemo: true);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 300), () {
      _manager.setSearchQuery(query);
    });
  }

  void _showGiftDetailModal(GiftItem gift) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Directionality(
        textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: _surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            border: Border(top: BorderSide(color: Color(0xFF2A2A3E), width: 1.5)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: _cardBg,
                      shape: BoxShape.circle,
                      border: Border.all(color: _gold.withOpacity(0.5), width: 1.5),
                    ),
                    child: Center(child: _buildGiftIcon(gift.name, size: 36)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isUrdu ? gift.nameUr : gift.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 18,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Text('🪙', style: TextStyle(fontSize: 14)),
                            const SizedBox(width: 4),
                            Text(
                              '${gift.coinPrice} Coins',
                              style: const TextStyle(
                                color: _gold,
                                fontWeight: FontWeight.w900,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (gift.hasAnimation)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: _cyan.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'ANIMATED',
                                  style: TextStyle(
                                    color: _cyan,
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                _isUrdu && gift.descriptionUr.isNotEmpty ? gift.descriptionUr : gift.description,
                style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _pink,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  widget.onGiftSelected?.call(gift);
                },
                child: Text(
                  _isUrdu ? 'اس تحفے کو منتخب کریں' : 'Select This Gift',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _manager,
      builder: (context, _) {
        final gifts = _manager.filteredGifts;
        final categories = _manager.categories;

        return Directionality(
          textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
          child: Scaffold(
            backgroundColor: _bgDark,
            appBar: AppBar(
              backgroundColor: _surface,
              elevation: 0,
              title: Text(
                _isUrdu ? 'ورچوئل گفٹ کیٹلاگ' : 'Virtual Gift Catalogue',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 18,
                  letterSpacing: 0.5,
                ),
              ),
              actions: [
                // Language Toggle (English / Urdu)
                Center(
                  child: GestureDetector(
                    onTap: () => setState(() => _isUrdu = !_isUrdu),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white10,
                        borderRadius: BorderRadius.circular(14),
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
                ),

                // Wallet Coin Balance Pill
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(right: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF251F38),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: _gold.withOpacity(0.4)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('🪙', style: TextStyle(fontSize: 13)),
                        const SizedBox(width: 4),
                        Text(
                          '${_manager.availableCoins}',
                          style: const TextStyle(
                            color: _gold,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            body: RefreshIndicator(
              color: _pink,
              backgroundColor: _surface,
              onRefresh: () => _manager.loadCatalog(userId: widget.userId, previewDemo: true),
              child: Column(
                children: [
                  // 1. Search Bar
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: Container(
                      height: 42,
                      decoration: BoxDecoration(
                        color: _surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white12),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        children: [
                          const Icon(Icons.search_rounded, color: Colors.white38, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _searchController,
                              style: const TextStyle(color: Colors.white, fontSize: 13),
                              decoration: InputDecoration(
                                hintText: _isUrdu ? 'تحفے تلاش کریں...' : 'Search virtual gifts...',
                                hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
                                border: InputBorder.none,
                                isDense: true,
                              ),
                              onChanged: _onSearchChanged,
                            ),
                          ),
                          if (_searchController.text.isNotEmpty)
                            GestureDetector(
                              onTap: () {
                                _searchController.clear();
                                _manager.setSearchQuery('');
                              },
                              child: const Icon(Icons.close_rounded, color: Colors.white54, size: 18),
                            ),
                        ],
                      ),
                    ),
                  ),

                  // 2. Category Filter Chips (Dynamic from backend)
                  if (categories.isNotEmpty)
                    SizedBox(
                      height: 40,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        itemCount: categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (ctx, index) {
                          final cat = categories[index];
                          final isSelected = _manager.selectedCategorySlug == cat.slug;

                          return GestureDetector(
                            onTap: () => _manager.selectCategory(cat.slug),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: isSelected ? _pink : _surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isSelected ? _pink : Colors.white12,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _isUrdu ? cat.shortNameUr : cat.shortName,
                                    style: TextStyle(
                                      color: isSelected ? Colors.white : Colors.white70,
                                      fontSize: 12,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                    ),
                                  ),
                                  if (cat.giftCount > 0) ...[
                                    const SizedBox(width: 4),
                                    Text(
                                      '(${cat.giftCount})',
                                      style: TextStyle(
                                        color: isSelected ? Colors.white70 : Colors.white38,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                  const SizedBox(height: 8),

                  // 3. Responsive Gift Grid
                  Expanded(
                    child: _manager.isLoading
                        ? const Center(
                            child: CircularProgressIndicator(color: _pink),
                          )
                        : gifts.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.card_giftcard_rounded, color: Colors.white24, size: 54),
                                    const SizedBox(height: 12),
                                    Text(
                                      _isUrdu ? 'کوئی تحائف نہیں ملے' : 'No gifts found',
                                      style: const TextStyle(color: Colors.white54, fontSize: 14),
                                    ),
                                  ],
                                ),
                              )
                            : GridView.builder(
                                padding: const EdgeInsets.all(16),
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 3,
                                  childAspectRatio: 0.82,
                                  crossAxisSpacing: 12,
                                  mainAxisSpacing: 12,
                                ),
                                itemCount: gifts.length,
                                itemBuilder: (ctx, index) {
                                  final gift = gifts[index];

                                  return GestureDetector(
                                    onTap: () => _showGiftDetailModal(gift),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: _cardBg,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: Colors.white12),
                                      ),
                                      padding: const EdgeInsets.all(8),
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          // Animated Tag or Popular Ribbon
                                          if (gift.hasAnimation)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                              decoration: BoxDecoration(
                                                color: _cyan.withOpacity(0.2),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Text(
                                                'ANIMATED',
                                                style: TextStyle(
                                                  color: _cyan,
                                                  fontSize: 8,
                                                  fontWeight: FontWeight.w900,
                                                ),
                                              ),
                                            )
                                          else if (gift.isPopular)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                              decoration: BoxDecoration(
                                                color: _pink.withOpacity(0.2),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Text(
                                                'POPULAR',
                                                style: TextStyle(
                                                  color: _pink,
                                                  fontSize: 8,
                                                  fontWeight: FontWeight.w900,
                                                ),
                                              ),
                                            )
                                          else
                                            const SizedBox(height: 14),

                                          const SizedBox(height: 6),
                                          _buildGiftIcon(gift.name, size: 42),
                                          const SizedBox(height: 8),

                                          // Gift Name
                                          Text(
                                            _isUrdu ? gift.nameUr : gift.name,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            textAlign: TextAlign.center,
                                          ),
                                          const SizedBox(height: 4),

                                          // Coin Price
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              const Text('🪙', style: TextStyle(fontSize: 11)),
                                              const SizedBox(width: 3),
                                              Text(
                                                '${gift.coinPrice}',
                                                style: const TextStyle(
                                                  color: _gold,
                                                  fontSize: 12,
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
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildGiftIcon(String giftName, {double size = 32}) {
    final lower = giftName.toLowerCase();
    if (lower.contains('crown')) {
      return Icon(Icons.workspace_premium, color: _gold, size: size);
    } else if (lower.contains('rocket') || lower.contains('car')) {
      return Icon(Icons.rocket_launch, color: _cyan, size: size);
    } else if (lower.contains('rose') || lower.contains('heart')) {
      return Icon(Icons.favorite, color: _pink, size: size);
    } else if (lower.contains('teddy') || lower.contains('ring')) {
      return Icon(Icons.diamond_rounded, color: const Color(0xFF90CAF9), size: size);
    } else if (lower.contains('castle') || lower.contains('dragon')) {
      return Icon(Icons.auto_awesome, color: const Color(0xFFFF9100), size: size);
    }
    return Icon(Icons.card_giftcard, color: _gold, size: size);
  }
}
