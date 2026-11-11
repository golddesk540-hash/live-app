import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 7 Module 7.9: Complete Virtual Store & Inventory Screen
/// Matches Design Reference 07_09_store.png for Android & iOS.
/// Dynamically loads configurable categories, backend-authoritative item prices,
/// durations, eligibility checks (VIP / Wealth / Shining / Honor), atomic
/// idempotent purchasing, My Inventory, and slot-exclusive Equip / Unequip.
/// ============================================================================
class StoreScreen extends StatefulWidget {
  final String apiBaseUrl;
  final String userId;
  final Map<String, String>? headers;
  final bool previewDemo;
  final bool initialUrdu;
  final String initialTab; // 'store' | 'inventory'

  const StoreScreen({
    super.key,
    required this.apiBaseUrl,
    this.userId = 'user_wallet_demo_701',
    this.headers,
    this.previewDemo = false,
    this.initialUrdu = false,
    this.initialTab = 'store',
  });

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  static const _bgTop = Color(0xFF0E0526);
  static const _bgBottom = Color(0xFF0A031B);
  static const _cardColor = Color(0xFF1A093B);
  static const _neonPink = Color(0xFFFF2E74);
  static const _goldAccent = Color(0xFFFBBF24);

  late bool _isUrdu = widget.initialUrdu;
  late String _mainTab = widget.initialTab == 'inventory' ? 'inventory' : 'store';
  String _selectedCategoryId = 'all';
  String _shelfFilter = 'all'; // all | featured | popular | new
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  bool _loading = true;
  int _walletCoins = 0;
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _items = [];
  List<Map<String, dynamic>> _inventoryItems = [];
  List<Map<String, dynamic>> _purchaseHistory = [];
  String? _busyInventoryId;
  String? _statusMessage;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Map<String, String> get _reqHeaders => {
        'Content-Type': 'application/json',
        ...(widget.headers ?? {}),
      };

  String _qs([Map<String, String>? extra]) {
    final map = <String, String>{};
    if (widget.previewDemo) map['preview'] = 'demo';
    if (extra != null) map.addAll(extra);
    if (map.isEmpty) return '';
    return '?${map.entries.map((e) => '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}').join('&')}';
  }

  String _absAssetUrl(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    return '${widget.apiBaseUrl}$raw';
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    await Future.wait([_loadCatalog(), _loadInventory()]);
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _loadCatalog() async {
    try {
      final params = <String, String>{};
      if (_selectedCategoryId != 'all') params['categoryId'] = _selectedCategoryId;
      if (_shelfFilter != 'all') params['filter'] = _shelfFilter;
      if (_searchQuery.trim().isNotEmpty) params['search'] = _searchQuery.trim();

      final res = await http.get(
        Uri.parse('${widget.apiBaseUrl}/api/store/catalog${_qs(params)}'),
        headers: _reqHeaders,
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted && data['success'] == true) {
          setState(() {
            _categories = List<Map<String, dynamic>>.from(data['categories'] ?? []);
            _items = List<Map<String, dynamic>>.from(data['items'] ?? []);
            if (data['wallet'] != null && data['wallet']['coins'] != null) {
              _walletCoins = int.tryParse('${data['wallet']['coins']}') ?? _walletCoins;
            }
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _loadInventory() async {
    try {
      final res = await http.get(
        Uri.parse('${widget.apiBaseUrl}/api/store/inventory${_qs()}'),
        headers: _reqHeaders,
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted && data['success'] == true) {
          setState(() {
            _inventoryItems = List<Map<String, dynamic>>.from(data['items'] ?? []);
            _purchaseHistory = List<Map<String, dynamic>>.from(data['purchaseHistory'] ?? []);
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _purchaseItem(Map<String, dynamic> item, bool autoEquip) async {
    final itemId = '${item['itemId']}';
    final idempKey = 'fl_pur_${itemId}_${DateTime.now().millisecondsSinceEpoch}';
    try {
      final res = await http.post(
        Uri.parse('${widget.apiBaseUrl}/api/store/purchase${_qs()}'),
        headers: {
          ..._reqHeaders,
          'x-idempotency-key': idempKey,
        },
        body: jsonEncode({
          'itemId': itemId,
          'quantity': 1,
          'idempotencyKey': idempKey,
          'autoEquip': autoEquip,
        }),
      );
      final data = jsonDecode(res.body);
      if (mounted) {
        if (res.statusCode >= 200 && res.statusCode < 300 && data['success'] == true) {
          setState(() {
            _statusMessage = _isUrdu
                ? 'آئٹم کامیابی سے خریدا اور انوینٹری میں شامل کر دیا گیا!'
                : 'Purchased cleanly & added to inventory!';
          });
          await _loadAll();
        } else {
          setState(() {
            _statusMessage = data['error']?.toString() ?? 'Purchase rejected.';
          });
        }
      }
    } catch (e) {
      if (mounted) setState(() => _statusMessage = 'Network error during purchase.');
    }
  }

  Future<void> _equipOrUnequip(Map<String, dynamic> inv, bool equip) async {
    final invId = '${inv['inventoryId']}';
    setState(() => _busyInventoryId = invId);
    try {
      final endpoint = equip ? '/api/store/equip' : '/api/store/unequip';
      final res = await http.post(
        Uri.parse('${widget.apiBaseUrl}$endpoint${_qs()}'),
        headers: _reqHeaders,
        body: jsonEncode({'inventoryId': invId}),
      );
      final data = jsonDecode(res.body);
      if (mounted) {
        if (res.statusCode >= 200 && res.statusCode < 300 && data['success'] == true) {
          setState(() {
            _statusMessage = equip
                ? (_isUrdu ? 'آئٹم پروفائل پر فعال کر دیا گیا!' : 'Item equipped!')
                : (_isUrdu ? 'آئٹم ہٹا دیا گیا!' : 'Item unequipped!');
          });
          await _loadInventory();
        } else {
          setState(() => _statusMessage = data['error']?.toString() ?? 'Action failed.');
        }
      }
    } finally {
      if (mounted) setState(() => _busyInventoryId = null);
    }
  }

  void _openItemDetailSheet(Map<String, dynamic> item) {
    bool previewActive = false;
    bool autoEquip = true;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF190A36),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            final name = _isUrdu && '${item['nameUr'] ?? ''}'.isNotEmpty ? '${item['nameUr']}' : '${item['name']}';
            final desc = _isUrdu && '${item['descriptionUr'] ?? ''}'.isNotEmpty ? '${item['descriptionUr']}' : '${item['description']}';
            final dur = _isUrdu && '${item['durationLabelUr'] ?? ''}'.isNotEmpty ? '${item['durationLabelUr']}' : '${item['durationLabel']}';
            final coinPrice = int.tryParse('${item['coinPrice'] ?? 0}') ?? 0;
            final elig = item['userEligibility'] as Map<String, dynamic>?;
            final eligible = elig == null || elig['eligible'] == true;
            final thumb = previewActive && '${item['animationAssetUrl'] ?? ''}'.isNotEmpty
                ? _absAssetUrl('${item['animationAssetUrl']}')
                : _absAssetUrl('${item['previewImageUrl'] ?? item['thumbnailUrl']}');

            return Directionality(
              textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 18, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(
                        width: 44,
                        height: 4,
                        decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(4)),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      height: 150,
                      decoration: BoxDecoration(
                        color: const Color(0xFF100425),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: previewActive ? _neonPink : Colors.white12, width: 1.5),
                      ),
                      child: Center(
                        child: thumb.isNotEmpty
                            ? Image.network(thumb, width: 110, height: 110, fit: BoxFit.contain)
                            : const Icon(Icons.auto_awesome, color: _neonPink, size: 54),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Center(
                      child: TextButton.icon(
                        onPressed: () => setSheetState(() => previewActive = !previewActive),
                        icon: Icon(previewActive ? Icons.pause_circle : Icons.play_circle, color: _neonPink, size: 18),
                        label: Text(
                          previewActive
                              ? (_isUrdu ? 'مفت پریویو روکیں' : 'Stop Free Preview')
                              : (_isUrdu ? 'مفت پریویو دیکھیں (0 سکے)' : 'Preview Effect (0 Coins)'),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
                        ),
                      ),
                    ),
                    Text(name, style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 4),
                    Text(desc, style: const TextStyle(color: Colors.white70, fontSize: 12.5)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.monetization_on_rounded, color: _goldAccent, size: 18),
                            const SizedBox(width: 5),
                            Text('$coinPrice Coins', style: const TextStyle(color: _goldAccent, fontWeight: FontWeight.w900, fontSize: 15)),
                          ],
                        ),
                        Text(dur, style: const TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.w700, fontSize: 12)),
                      ],
                    ),
                    if (!eligible && elig['reasons'] is List && (elig['reasons'] as List).isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        '${(elig['reasons'] as List).first}',
                        style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w700, fontSize: 12),
                      ),
                    ],
                    if (item['isEquippable'] == true && '${item['equipSlot']}' != 'none') ...[
                      const SizedBox(height: 8),
                      CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        activeColor: _neonPink,
                        value: autoEquip,
                        onChanged: (v) => setSheetState(() => autoEquip = v ?? true),
                        title: Text(
                          _isUrdu ? 'خریدنے کے بعد فوراً فعال کریں' : 'Equip automatically after purchase',
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: (!eligible || _walletCoins < coinPrice)
                          ? null
                          : () async {
                              Navigator.of(ctx).pop();
                              await _purchaseItem(item, autoEquip);
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _neonPink,
                        disabledBackgroundColor: Colors.white12,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      ),
                      child: Text(
                        _walletCoins < coinPrice
                            ? (_isUrdu ? 'ناکافی سکے' : 'Insufficient Coins')
                            : (_isUrdu ? '$coinPrice سکوں میں خریدیں' : 'Purchase • $coinPrice Coins'),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgTop,
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [_bgTop, _bgBottom],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                _buildBalanceAndModeSwitch(),
                if (_statusMessage != null)
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: _neonPink.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _neonPink.withOpacity(0.5)),
                    ),
                    child: Text(_statusMessage!, style: const TextStyle(color: Colors.white, fontSize: 12)),
                  ),
                Expanded(
                  child: _loading
                      ? const Center(child: CircularProgressIndicator(color: _neonPink))
                      : _mainTab == 'inventory'
                          ? _buildInventoryBody()
                          : _buildStoreBody(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 19),
              ),
              Text(
                _isUrdu ? 'پوپو لائیو اسٹور' : 'Store',
                style: const TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w900),
              ),
            ],
          ),
          Row(
            children: [
              TextButton.icon(
                onPressed: () => setState(() => _isUrdu = !_isUrdu),
                icon: const Icon(Icons.language_rounded, color: _neonPink, size: 17),
                label: Text(_isUrdu ? 'EN' : 'اردو', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              ),
              GestureDetector(
                onTap: () => setState(() => _mainTab = _mainTab == 'store' ? 'inventory' : 'store'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _mainTab == 'inventory' ? _neonPink : Colors.white10,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _isUrdu ? 'انوینٹری' : 'Inventory (${_inventoryItems.where((i) => i['status'] == 'active').length})',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceAndModeSwitch() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.purpleAccent.withOpacity(0.25)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.monetization_on_rounded, color: _goldAccent, size: 22),
              const SizedBox(width: 8),
              Text(
                '$_walletCoins Coins',
                style: const TextStyle(color: _goldAccent, fontWeight: FontWeight.w900, fontSize: 16),
              ),
            ],
          ),
          Row(
            children: [
              _pillButton(_isUrdu ? 'اسٹور' : 'Store', _mainTab == 'store', () => setState(() => _mainTab = 'store')),
              const SizedBox(width: 6),
              _pillButton(_isUrdu ? 'انوینٹری' : 'My Inventory', _mainTab == 'inventory', () => setState(() => _mainTab = 'inventory')),
            ],
          ),
        ],
      ),
    );
  }

  Widget _pillButton(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: active ? _neonPink : Colors.white10,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.w800)),
      ),
    );
  }

  Widget _buildStoreBody() {
    return RefreshIndicator(
      color: _neonPink,
      onRefresh: _loadAll,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(14, 8, 14, 24),
        children: [
          // Search Bar
          TextField(
            controller: _searchCtrl,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: _isUrdu ? 'آئٹمز تلاش کریں...' : 'Search store items...',
              hintStyle: const TextStyle(color: Colors.white38, fontSize: 13),
              prefixIcon: const Icon(Icons.search_rounded, color: Colors.white54),
              filled: true,
              fillColor: _cardColor,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            ),
            onSubmitted: (val) {
              _searchQuery = val;
              _loadCatalog();
            },
            onChanged: (val) {
              _searchQuery = val;
              _loadCatalog();
            },
          ),
          const SizedBox(height: 10),
          // Dynamic Backend Category Strip
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _catChip('all', _isUrdu ? 'سب' : 'All'),
                ..._categories.map((cat) {
                  final label = _isUrdu ? '${cat['shortLabelUr'] ?? cat['nameUr']}' : '${cat['shortLabel'] ?? cat['name']}';
                  return _catChip('${cat['categoryId']}', label);
                }),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Shelf filter row
          Row(
            children: [
              _shelfChip('all', _isUrdu ? 'تمام' : 'All'),
              _shelfChip('featured', _isUrdu ? 'نمایاں' : 'Featured'),
              _shelfChip('popular', _isUrdu ? 'مقبول' : 'Popular'),
              _shelfChip('new', _isUrdu ? 'نئے' : 'New'),
            ],
          ),
          const SizedBox(height: 12),
          // 2-Column Store Item Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.78,
            ),
            itemCount: _items.length,
            itemBuilder: (_, idx) {
              final item = _items[idx];
              final name = _isUrdu && '${item['nameUr'] ?? ''}'.isNotEmpty ? '${item['nameUr']}' : '${item['name']}';
              final imgUrl = _absAssetUrl('${item['thumbnailUrl']}');
              final price = item['coinPrice'] ?? 0;

              return GestureDetector(
                onTap: () => _openItemDetailSheet(item),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _cardColor,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: Colors.purpleAccent.withOpacity(0.25)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF100425),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(
                            child: imgUrl.isNotEmpty
                                ? Image.network(imgUrl, width: 78, height: 78, fit: BoxFit.contain)
                                : const Icon(Icons.auto_awesome, color: _neonPink, size: 42),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.monetization_on_rounded, color: _goldAccent, size: 15),
                          const SizedBox(width: 4),
                          Text('$price', style: const TextStyle(color: _goldAccent, fontWeight: FontWeight.w900, fontSize: 14)),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _catChip(String id, String label) {
    final active = _selectedCategoryId == id;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedCategoryId = id);
        _loadCatalog();
      },
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
        decoration: BoxDecoration(
          gradient: active ? const LinearGradient(colors: [_neonPink, Color(0xFFEC4899)]) : null,
          color: active ? null : Colors.white10,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12)),
      ),
    );
  }

  Widget _shelfChip(String id, String label) {
    final active = _shelfFilter == id;
    return GestureDetector(
      onTap: () {
        setState(() => _shelfFilter = id);
        _loadCatalog();
      },
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: active ? _neonPink.withOpacity(0.22) : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: active ? _neonPink : Colors.white12),
        ),
        child: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11)),
      ),
    );
  }

  Widget _buildInventoryBody() {
    if (_inventoryItems.isEmpty && _purchaseHistory.isEmpty) {
      return Center(
        child: Text(
          _isUrdu ? 'انوینٹری خالی ہے' : 'Your inventory is empty.',
          style: const TextStyle(color: Colors.white60, fontSize: 14),
        ),
      );
    }

    return RefreshIndicator(
      color: _neonPink,
      onRefresh: _loadAll,
      child: ListView.builder(
        padding: const EdgeInsets.all(14),
        itemCount: _inventoryItems.length,
        itemBuilder: (_, idx) {
          final inv = _inventoryItems[idx];
          final active = inv['status'] == 'active';
          final equipped = inv['isEquipped'] == true;
          final busy = _busyInventoryId == inv['inventoryId'];
          final name = _isUrdu && '${inv['itemNameUr'] ?? ''}'.isNotEmpty ? '${inv['itemNameUr']}' : '${inv['itemName']}';
          final imgUrl = _absAssetUrl('${inv['thumbnailUrl']}');

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _cardColor,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: equipped && active ? _neonPink : Colors.white12),
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(color: const Color(0xFF100425), borderRadius: BorderRadius.circular(14)),
                  child: imgUrl.isNotEmpty
                      ? Image.network(imgUrl, fit: BoxFit.contain)
                      : const Icon(Icons.layers, color: _neonPink),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14)),
                      Text(
                        '${inv['status']} • ${inv['equipSlot']} • Qty ${inv['quantity']}',
                        style: const TextStyle(color: Colors.white54, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                if (active && inv['isEquippable'] == true && '${inv['equipSlot']}' != 'none')
                  ElevatedButton(
                    onPressed: busy ? null : () => _equipOrUnequip(inv, !equipped),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: equipped ? Colors.white12 : _neonPink,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      busy ? '...' : (equipped ? (_isUrdu ? 'ہٹائیں' : 'Unequip') : (_isUrdu ? 'فعال' : 'Equip')),
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
