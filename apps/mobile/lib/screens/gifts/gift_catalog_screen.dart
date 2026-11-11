import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'gift_detail_sheet.dart';
import 'live_gift_demo_screen.dart';

/// ============================================================================
/// Popo Live — Phase 7 Module 7.2: Complete Virtual Gift Catalog Screen
/// Matches design reference 07_02_gift_catalog.png with live backend APIs.
/// Strict rule: No coin deduction occurs during catalog browsing or selection.
/// ============================================================================

class GiftCatalogScreen extends StatefulWidget {
  final String userId;
  final String apiBaseUrl;
  final String? authToken;
  final bool previewDemo;
  final ValueChanged<Map<String, dynamic>>? onGiftSelected;
  final VoidCallback? onOpenWallet;

  const GiftCatalogScreen({
    Key? key,
    this.userId = 'user_wallet_demo_701',
    this.apiBaseUrl = 'https://kigolive.com',
    this.authToken,
    this.previewDemo = true,
    this.onGiftSelected,
    this.onOpenWallet,
  }) : super(key: key);

  @override
  State<GiftCatalogScreen> createState() => _GiftCatalogScreenState();
}

class _GiftCatalogScreenState extends State<GiftCatalogScreen> {
  static const Color _bgDeep = Color(0xFF0B051D);
  static const Color _cardDark = Color(0xFF1C0C3C);
  static const Color _cardBorder = Color(0xFF3E1E73);
  static const Color _neonPink = Color(0xFFFF007F);
  static const Color _goldAccent = Color(0xFFFFC83B);

  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;

  bool _isUrdu = false;
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;

  String _selectedCategorySlug = 'all';
  String _searchQuery = '';
  int _page = 1;
  int _totalPages = 1;
  int? _viewerCoinBalance;

  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _gifts = [];
  List<Map<String, dynamic>> _popularGifts = [];
  List<Map<String, dynamic>> _newGifts = [];
  String? _selectedGiftId;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Map<String, String> _headers() {
    final headers = <String, String>{'Accept': 'application/json'};
    if (widget.authToken != null && widget.authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer ${widget.authToken}';
    }
    return headers;
  }

  String _identityQuerySuffix() {
    final parts = <String>[];
    if (widget.userId.isNotEmpty) {
      parts.add('userId=${Uri.encodeQueryComponent(widget.userId)}');
    }
    if (widget.previewDemo) {
      parts.add('preview=demo');
    }
    return parts.join('&');
  }

  String _resolveImageUrl(String? rawUrl) {
    final val = (rawUrl ?? '').trim();
    if (val.isEmpty) return '${widget.apiBaseUrl}/assets/gifts/fallback_gift.png';
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    return '${widget.apiBaseUrl}$val';
  }

  Future<void> _loadInitialData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    await Future.wait([
      _fetchCategoriesAndSections(),
      _fetchCatalog(page: 1, append: false),
    ]);
  }

  Future<void> _fetchCategoriesAndSections() async {
    try {
      final suffix = _identityQuerySuffix();
      final q = suffix.isNotEmpty ? '?$suffix' : '';

      final responses = await Future.wait([
        http.get(Uri.parse('${widget.apiBaseUrl}/api/gifts/categories'), headers: _headers()),
        http.get(Uri.parse('${widget.apiBaseUrl}/api/gifts/popular?limit=6'), headers: _headers()),
        http.get(Uri.parse('${widget.apiBaseUrl}/api/gifts/new?limit=6'), headers: _headers()),
        http.get(Uri.parse('${widget.apiBaseUrl}/api/wallet/balance$q'), headers: _headers()),
      ]);

      if (!mounted) return;
      setState(() {
        if (responses[0].statusCode == 200) {
          final data = jsonDecode(responses[0].body) as Map<String, dynamic>;
          _categories = List<Map<String, dynamic>>.from(data['categories'] ?? []);
        }
        if (responses[1].statusCode == 200) {
          final data = jsonDecode(responses[1].body) as Map<String, dynamic>;
          _popularGifts = List<Map<String, dynamic>>.from(data['gifts'] ?? []);
        }
        if (responses[2].statusCode == 200) {
          final data = jsonDecode(responses[2].body) as Map<String, dynamic>;
          _newGifts = List<Map<String, dynamic>>.from(data['gifts'] ?? []);
        }
        if (responses[3].statusCode == 200) {
          final data = jsonDecode(responses[3].body) as Map<String, dynamic>;
          final wallet = data['wallet'] as Map<String, dynamic>?;
          final coinVal = wallet?['coins'] ?? wallet?['coinBalance'];
          if (coinVal is num) {
            _viewerCoinBalance = coinVal.toInt();
          }
        }
      });
    } catch (_) {
      // Handled by main catalog error banner if primary call fails
    }
  }

  Future<void> _fetchCatalog({required int page, required bool append}) async {
    if (append) {
      setState(() => _loadingMore = true);
    } else {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final params = <String, String>{
        'page': '$page',
        'limit': '12',
      };
      if (_selectedCategorySlug != 'all') {
        params['category'] = _selectedCategorySlug;
      }
      if (_searchQuery.isNotEmpty) {
        params['search'] = _searchQuery;
      }
      if (widget.userId.isNotEmpty) {
        params['userId'] = widget.userId;
      }
      if (widget.previewDemo) {
        params['preview'] = 'demo';
      }

      final path = (_searchQuery.isNotEmpty && _selectedCategorySlug == 'all')
          ? '/api/gifts/search'
          : '/api/gifts/catalog';
      final uri = Uri.parse('${widget.apiBaseUrl}$path').replace(queryParameters: params);
      final res = await http.get(uri, headers: _headers());
      final body = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode != 200 || body['success'] != true) {
        throw Exception(body['message']?.toString() ?? 'Failed to load gift catalog');
      }

      final incoming = List<Map<String, dynamic>>.from(body['gifts'] ?? []);
      final pagination = (body['pagination'] as Map<String, dynamic>?) ?? {};

      if (!mounted) return;
      setState(() {
        if (append) {
          final existingIds = _gifts.map((g) => g['giftId']).toSet();
          for (final item in incoming) {
            if (!existingIds.contains(item['giftId'])) {
              _gifts.add(item);
            }
          }
        } else {
          _gifts = incoming;
        }
        _page = (pagination['page'] as num?)?.toInt() ?? page;
        _totalPages = (pagination['totalPages'] as num?)?.toInt() ?? 1;
        if (body['viewerCoinBalance'] != null) {
          _viewerCoinBalance = (body['viewerCoinBalance'] as num).toInt();
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _loadingMore = false;
        });
      }
    }
  }

  void _onSearchChanged(String val) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 240), () {
      if (!mounted) return;
      setState(() => _searchQuery = val.trim());
      _fetchCatalog(page: 1, append: false);
    });
  }

  Future<void> _openGiftDetail(Map<String, dynamic> gift) async {
    Map<String, dynamic> latestGift = gift;
    int? latestBalance = _viewerCoinBalance;

    try {
      final suffix = _identityQuerySuffix();
      final q = suffix.isNotEmpty ? '?$suffix' : '';
      final giftId = Uri.encodeComponent(gift['giftId'].toString());
      final res = await http.get(
        Uri.parse('${widget.apiBaseUrl}/api/gifts/$giftId$q'),
        headers: _headers(),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        if (data['gift'] is Map<String, dynamic>) {
          latestGift = data['gift'] as Map<String, dynamic>;
        }
        if (data['viewerCoinBalance'] != null) {
          latestBalance = (data['viewerCoinBalance'] as num).toInt();
        }
      }
    } catch (_) {
      // Fallback to already-fetched item
    }

    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => GiftDetailSheet(
        gift: latestGift,
        viewerCoinBalance: latestBalance,
        apiBaseUrl: widget.apiBaseUrl,
        isUrdu: _isUrdu,
        onSelectGift: (selected) {
          setState(() => _selectedGiftId = selected['giftId']?.toString());
          if (widget.onGiftSelected != null) {
            widget.onGiftSelected!.call(selected);
          } else {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => LiveGiftDemoScreen(
                  userId: widget.userId,
                  apiBaseUrl: widget.apiBaseUrl,
                  authToken: widget.authToken,
                  initialGiftId: selected['giftId']?.toString(),
                  previewDemo: widget.previewDemo,
                  onOpenWallet: widget.onOpenWallet,
                ),
              ),
            );
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF1F0C42),
              content: Text(
                _isUrdu
                    ? '${selected['nameUr'] ?? selected['name']} منتخب ہو گیا (کوئی سکہ منہا نہیں ہوا)'
                    : '${selected['name']} selected — no coins deducted',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bool ur = _isUrdu;

    return Directionality(
      textDirection: ur ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgDeep,
        body: SafeArea(
          child: RefreshIndicator(
            color: _neonPink,
            onRefresh: _loadInitialData,
            child: Column(
              children: [
                // Top Header Bar (Popo Live + Coins + Language)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [_neonPink, Color(0xFF7C3AED)],
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.card_giftcard_rounded, color: Colors.white, size: 18),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        ur ? 'پوپو لائیو' : 'Popo Live',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const Spacer(),
                      InkWell(
                        onTap: () => setState(() => _isUrdu = !_isUrdu),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E0D40),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: _cardBorder),
                          ),
                          child: Text(
                            ur ? 'EN' : 'اردو',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: widget.onOpenWallet,
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E0D40),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: _goldAccent.withOpacity(0.4)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.monetization_on_rounded, color: _goldAccent, size: 15),
                              const SizedBox(width: 4),
                              Text(
                                _viewerCoinBalance != null
                                    ? '$_viewerCoinBalance'
                                    : (ur ? 'والٹ' : 'Wallet'),
                                style: const TextStyle(
                                  color: _goldAccent,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Main Scrollable Content
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    children: [
                      // Heading Row: Gift Catalog >
                      Row(
                        children: [
                          Text(
                            ur ? 'گفٹ کیٹلاگ' : 'Gift Catalog',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 21,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            ur ? Icons.chevron_left_rounded : Icons.chevron_right_rounded,
                            color: Colors.purple.shade200,
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Search Bar
                      TextField(
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: InputDecoration(
                          hintText: ur ? 'گفٹ تلاش کریں...' : 'Search gifts by name or type...',
                          hintStyle: TextStyle(color: Colors.purple.shade300, fontSize: 13),
                          prefixIcon: Icon(Icons.search_rounded, color: Colors.purple.shade200, size: 20),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.close_rounded, color: Colors.pinkAccent, size: 18),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                    _fetchCatalog(page: 1, append: false);
                                  },
                                )
                              : null,
                          filled: true,
                          fillColor: const Color(0xFF170933),
                          contentPadding: const EdgeInsets.symmetric(vertical: 10),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: _cardBorder),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: _neonPink),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Category Horizontal Neon Pills
                      SizedBox(
                        height: 36,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _categories.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (_, idx) {
                            final cat = _categories[idx];
                            final slug = cat['slug']?.toString() ?? 'all';
                            final active = slug == _selectedCategorySlug;
                            final label = (ur && cat['shortNameUr'] != null)
                                ? cat['shortNameUr'].toString()
                                : (cat['shortName']?.toString() ?? cat['name']?.toString() ?? slug);

                            return GestureDetector(
                              onTap: () {
                                setState(() => _selectedCategorySlug = slug);
                                _fetchCatalog(page: 1, append: false);
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                                decoration: BoxDecoration(
                                  color: active ? _neonPink : const Color(0xFF1A0B38),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: active ? _neonPink : _cardBorder,
                                  ),
                                ),
                                child: Text(
                                  label,
                                  style: TextStyle(
                                    color: active ? Colors.white : Colors.purple.shade100,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 14),

                      // 3-Column Gift Grid matching 07_02_gift_catalog.png
                      if (_loading)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 48),
                          child: Center(
                            child: CircularProgressIndicator(color: _neonPink),
                          ),
                        )
                      else if (_error != null)
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: _cardDark,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.redAccent),
                          ),
                          child: Column(
                            children: [
                              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                              const SizedBox(height: 8),
                              ElevatedButton(
                                onPressed: _loadInitialData,
                                style: ElevatedButton.styleFrom(backgroundColor: _neonPink),
                                child: Text(ur ? 'دوبارہ کوشش' : 'Retry'),
                              ),
                            ],
                          ),
                        )
                      else if (_gifts.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: _cardDark,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: _cardBorder),
                          ),
                          child: Center(
                            child: Text(
                              ur ? 'کوئی گفٹ نہیں ملا' : 'No matching gifts found.',
                              style: TextStyle(color: Colors.purple.shade200),
                            ),
                          ),
                        )
                      else
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
                            childAspectRatio: 0.78,
                          ),
                          itemCount: _gifts.length,
                          itemBuilder: (_, idx) => _buildGiftCard(_gifts[idx], ur),
                        ),

                      if (_page < _totalPages) ...[
                        const SizedBox(height: 12),
                        Center(
                          child: OutlinedButton(
                            onPressed: _loadingMore
                                ? null
                                : () => _fetchCatalog(page: _page + 1, append: true),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.pink.shade200,
                              side: BorderSide(color: _neonPink.withOpacity(0.6)),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                            ),
                            child: Text(
                              _loadingMore
                                  ? (ur ? 'لوڈ ہو رہا ہے...' : 'Loading...')
                                  : (ur ? 'مزید لوڈ کریں' : 'Load More Gifts'),
                            ),
                          ),
                        ),
                      ],

                      if (_selectedCategorySlug == 'all' &&
                          _searchQuery.isEmpty &&
                          _popularGifts.isNotEmpty) ...[
                        const SizedBox(height: 18),
                        _buildHorizontalStrip(
                          title: ur ? 'مقبول تحائف' : 'Popular Gifts',
                          items: _popularGifts,
                          isUrdu: ur,
                        ),
                      ],
                      if (_selectedCategorySlug == 'all' &&
                          _searchQuery.isEmpty &&
                          _newGifts.isNotEmpty) ...[
                        const SizedBox(height: 14),
                        _buildHorizontalStrip(
                          title: ur ? 'نئے تحائف' : 'New Arrivals',
                          items: _newGifts,
                          isUrdu: ur,
                        ),
                      ],

                      // Bottom P7.2 Gift Catalog Badge
                      const SizedBox(height: 22),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: _neonPink,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'P7.2',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            ur ? 'گفٹ کیٹلاگ' : 'Gift Catalog',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
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

  Widget _buildGiftCard(Map<String, dynamic> gift, bool ur) {
    final String giftId = gift['giftId']?.toString() ?? '';
    final bool isSelected = _selectedGiftId == giftId;
    final String name = (ur && gift['nameUr'] != null && gift['nameUr'].toString().isNotEmpty)
        ? gift['nameUr'].toString()
        : (gift['name']?.toString() ?? '');
    final int price = (gift['coinPrice'] as num?)?.toInt() ?? 0;
    final String thumbUrl = _resolveImageUrl(
      gift['thumbnailUrl']?.toString() ?? gift['imageUrl']?.toString(),
    );
    final String fallbackUrl = _resolveImageUrl(gift['fallbackImageUrl']?.toString());

    return GestureDetector(
      onTap: () => _openGiftDetail(gift),
      child: Container(
        decoration: BoxDecoration(
          color: _cardDark,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? _neonPink : _cardBorder,
            width: isSelected ? 1.6 : 1.0,
          ),
        ),
        padding: const EdgeInsets.all(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Expanded(
              child: Image.network(
                thumbUrl,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => Image.network(
                  fallbackUrl,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Icon(
                    Icons.card_giftcard_rounded,
                    color: _neonPink,
                    size: 36,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 3),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.monetization_on_rounded, color: _goldAccent, size: 13),
                const SizedBox(width: 3),
                Text(
                  '$price',
                  style: const TextStyle(
                    color: _goldAccent,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHorizontalStrip({
    required String title,
    required List<Map<String, dynamic>> items,
    required bool isUrdu,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 112,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, idx) => SizedBox(
              width: 96,
              child: _buildGiftCard(items[idx], isUrdu),
            ),
          ),
        ),
      ],
    );
  }
}
