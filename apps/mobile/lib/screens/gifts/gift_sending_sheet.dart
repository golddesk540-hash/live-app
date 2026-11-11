import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 7 Module 7.3: Real-Time Virtual Gift Sending Bottom Sheet
/// Matches design reference 07_03_sending_a_gift.png with real Module 7.1 Wallet,
/// Module 7.2 Catalog, Live Rooms, and PK Battle host recipients.
/// ============================================================================

class GiftSendingSheet extends StatefulWidget {
  final String userId;
  final String apiBaseUrl;
  final String? authToken;
  final String? roomId;
  final String? pkBattleId;
  final String? initialGiftId;
  final bool previewDemo;
  final bool isUrdu;
  final bool lowEndMode;
  final VoidCallback? onOpenWallet;
  final ValueChanged<Map<String, dynamic>>? onGiftSent;

  const GiftSendingSheet({
    Key? key,
    this.userId = 'user_wallet_demo_701',
    this.apiBaseUrl = 'https://kigolive.com',
    this.authToken,
    this.roomId,
    this.pkBattleId,
    this.initialGiftId,
    this.previewDemo = true,
    this.isUrdu = false,
    this.lowEndMode = false,
    this.onOpenWallet,
    this.onGiftSent,
  }) : super(key: key);

  @override
  State<GiftSendingSheet> createState() => _GiftSendingSheetState();
}

class _GiftSendingSheetState extends State<GiftSendingSheet> {
  static const Color _bgPanel = Color(0xFF14072A);
  static const Color _cardDark = Color(0xFF1E0D3D);
  static const Color _neonPink = Color(0xFFFF2E83);
  static const Color _goldCoin = Color(0xFFFFC83B);

  bool _loading = true;
  bool _sending = false;
  bool _isUrdu = false;
  bool _lowEndMode = false;
  String? _errorMsg;
  bool _showTopUpAction = false;

  String _activeCategoryId = 'all';
  String _selectedGiftId = 'gift_rose';
  String _selectedHostId = '';
  int _quantity = 1;

  int _availableCoins = 0;
  int _globalMinQty = 1;
  int _globalMaxQty = 99;
  bool _isRoomLive = true;

  List<Map<String, dynamic>> _hosts = [];
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _gifts = [];

  @override
  void initState() {
    super.initState();
    _isUrdu = widget.isUrdu;
    _lowEndMode = widget.lowEndMode;
    if (widget.initialGiftId != null && widget.initialGiftId!.isNotEmpty) {
      _selectedGiftId = widget.initialGiftId!;
    }
    _fetchContext();
  }

  Map<String, String> _headers() {
    final h = <String, String>{'Content-Type': 'application/json'};
    if (widget.authToken != null && widget.authToken!.isNotEmpty) {
      h['Authorization'] = 'Bearer ${widget.authToken}';
    } else if (widget.userId.isNotEmpty) {
      h['x-viewer-id'] = widget.userId;
    }
    return h;
  }

  String _resolveAssetUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.isEmpty) {
      return '${widget.apiBaseUrl}/assets/gifts/fallback_gift.png';
    }
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    final cleanBase = widget.apiBaseUrl.endsWith('/')
        ? widget.apiBaseUrl.substring(0, widget.apiBaseUrl.length - 1)
        : widget.apiBaseUrl;
    final cleanPath = rawUrl.startsWith('/') ? rawUrl : '/$rawUrl';
    return '$cleanBase$cleanPath';
  }

  String _generateIdempotencyKey() {
    final rand = Random();
    final suffix = List.generate(8, (_) => rand.nextInt(16).toRadixString(16)).join();
    return 'mob_gft_${DateTime.now().millisecondsSinceEpoch}_$suffix';
  }

  Future<void> _fetchContext() async {
    setState(() {
      _loading = true;
      _errorMsg = null;
    });

    try {
      final params = <String, String>{};
      if (widget.pkBattleId != null && widget.pkBattleId!.isNotEmpty) {
        params['pkBattleId'] = widget.pkBattleId!;
      } else if (widget.roomId != null && widget.roomId!.isNotEmpty) {
        params['roomId'] = widget.roomId!;
      }
      if (widget.previewDemo) params['preview'] = 'demo';

      final uri = Uri.parse('${widget.apiBaseUrl}/api/gifts/send/context')
          .replace(queryParameters: params);
      final res = await http.get(uri, headers: _headers());
      final body = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode == 200 && body['success'] == true) {
        final hostsList = ((body['hosts'] as List?) ?? []).cast<Map<String, dynamic>>();
        final catsList = ((body['categories'] as List?) ?? []).cast<Map<String, dynamic>>();
        final giftsList = ((body['gifts'] as List?) ?? []).cast<Map<String, dynamic>>();
        final walletMap = (body['senderWallet'] as Map<String, dynamic>?) ?? {};
        final rulesMap = (body['quantityRules'] as Map<String, dynamic>?) ?? {};

        setState(() {
          _hosts = hostsList;
          _categories = catsList;
          _gifts = giftsList;
          _availableCoins = (walletMap['availableCoins'] as num?)?.toInt() ?? 0;
          _globalMinQty = (rulesMap['minQuantity'] as num?)?.toInt() ?? 1;
          _globalMaxQty = (rulesMap['maxQuantity'] as num?)?.toInt() ?? 99;
          _isRoomLive = body['isLive'] == true;
          if (_selectedHostId.isEmpty && hostsList.isNotEmpty) {
            _selectedHostId = hostsList.first['hostId'].toString();
          }
          if (giftsList.isNotEmpty &&
              !giftsList.any((g) => g['giftId'] == _selectedGiftId)) {
            _selectedGiftId = giftsList.first['giftId'].toString();
          }
          _loading = false;
        });
      } else {
        setState(() {
          _errorMsg = body['error']?.toString() ?? 'Failed to load gift context';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMsg = e.toString();
        _loading = false;
      });
    }
  }

  Map<String, dynamic>? get _selectedGift {
    for (final g in _gifts) {
      if (g['giftId'] == _selectedGiftId) return g;
    }
    return _gifts.isNotEmpty ? _gifts.first : null;
  }

  Map<String, dynamic>? get _selectedHost {
    for (final h in _hosts) {
      if (h['hostId'] == _selectedHostId) return h;
    }
    return _hosts.isNotEmpty ? _hosts.first : null;
  }

  List<Map<String, dynamic>> get _filteredGifts {
    if (_activeCategoryId == 'all') return _gifts;
    return _gifts.where((g) {
      if (_activeCategoryId == 'popular') {
        return g['isPopular'] == true || ((g['usageCount'] as num?)?.toInt() ?? 0) >= 5000;
      }
      return g['categoryId'] == _activeCategoryId;
    }).toList();
  }

  Future<void> _openConfirmAndSend() async {
    final gift = _selectedGift;
    final host = _selectedHost;
    if (gift == null || host == null || _sending || !_isRoomLive) return;

    setState(() {
      _errorMsg = null;
      _showTopUpAction = false;
    });

    final idempotencyKey = _generateIdempotencyKey();

    try {
      final prevRes = await http.post(
        Uri.parse('${widget.apiBaseUrl}/api/gifts/send/preview'),
        headers: _headers(),
        body: jsonEncode({
          'giftId': gift['giftId'],
          'quantity': _quantity,
          'recipientHostId': host['hostId'],
          'liveRoomId': widget.roomId,
          'pkBattleId': widget.pkBattleId,
          if (widget.previewDemo) 'preview': 'demo',
        }),
      );

      final prevData = jsonDecode(prevRes.body) as Map<String, dynamic>;
      if (prevRes.statusCode != 200 || prevData['success'] != true) {
        setState(() {
          _errorMsg = prevData['error']?.toString() ?? 'Could not preview gift';
        });
        return;
      }

      final quote = prevData['preview'] as Map<String, dynamic>;
      if (!mounted) return;

      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => Directionality(
          textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
          child: AlertDialog(
            backgroundColor: const Color(0xFF1B0936),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(color: _neonPink.withOpacity(0.55)),
            ),
            title: Text(
              _isUrdu ? 'تحفے کی تصدیق کریں' : 'Confirm Virtual Gift',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_isUrdu ? (quote['giftNameUr'] ?? quote['giftName']) : quote['giftName']} x${quote['quantity']}',
                  style: const TextStyle(color: _neonPink, fontWeight: FontWeight.w800, fontSize: 15),
                ),
                const SizedBox(height: 6),
                Text(
                  '${_isUrdu ? 'وصول کنندہ:' : 'Recipient:'} ${quote['recipientNickname']}',
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(height: 12),
                _quoteRow(_isUrdu ? 'کل لاگت' : 'Total Cost', '${quote['totalCoinAmount']} Coins', _goldCoin),
                const SizedBox(height: 4),
                _quoteRow(_isUrdu ? 'موجودہ بیلنس' : 'Current Balance', '${quote['currentCoinBalance']} Coins', Colors.white),
                const SizedBox(height: 4),
                _quoteRow(
                  _isUrdu ? 'باقی بیلنس' : 'Remaining Balance',
                  quote['insufficientBalance'] == true
                      ? '-${quote['shortfallCoins']} Coins'
                      : '${quote['remainingCoinBalance']} Coins',
                  quote['insufficientBalance'] == true ? Colors.redAccent : Colors.greenAccent,
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: Text(_isUrdu ? 'منسوخ' : 'Cancel', style: const TextStyle(color: Colors.white70)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: quote['insufficientBalance'] == true ? _goldCoin : _neonPink,
                  foregroundColor: quote['insufficientBalance'] == true ? Colors.black : Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => Navigator.of(ctx).pop(true),
                child: Text(
                  quote['insufficientBalance'] == true
                      ? (_isUrdu ? 'سکے ری چارج کریں' : 'Top-up')
                      : (_isUrdu ? 'تصدیق اور ارسال' : 'Confirm Send'),
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
        ),
      );

      if (confirmed != true) return;
      if (quote['insufficientBalance'] == true) {
        widget.onOpenWallet?.call();
        return;
      }

      await _executeSend(idempotencyKey);
    } catch (e) {
      setState(() => _errorMsg = e.toString());
    }
  }

  Widget _quoteRow(String label, String val, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 12)),
        Text(val, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12)),
      ],
    );
  }

  Future<void> _executeSend(String idempotencyKey) async {
    final gift = _selectedGift;
    final host = _selectedHost;
    if (gift == null || host == null) return;

    setState(() {
      _sending = true;
      _errorMsg = null;
      _showTopUpAction = false;
    });

    try {
      final res = await http.post(
        Uri.parse('${widget.apiBaseUrl}/api/gifts/send'),
        headers: _headers(),
        body: jsonEncode({
          'giftId': gift['giftId'],
          'quantity': _quantity,
          'recipientHostId': host['hostId'],
          'liveRoomId': widget.roomId,
          'pkBattleId': widget.pkBattleId,
          'idempotencyKey': idempotencyKey,
          if (widget.previewDemo) 'preview': 'demo',
        }),
      );

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && data['success'] == true) {
        final updatedWallet = (data['updatedSenderWallet'] as Map<String, dynamic>?) ?? {};
        setState(() {
          if (updatedWallet['availableCoins'] != null) {
            _availableCoins = (updatedWallet['availableCoins'] as num).toInt();
          }
          _sending = false;
        });
        widget.onGiftSent?.call(data);
      } else {
        setState(() {
          _errorMsg = data['error']?.toString() ?? 'Gift sending failed';
          _showTopUpAction = data['topUpRecommended'] == true;
          _sending = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMsg = e.toString();
        _sending = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final gift = _selectedGift;
    final int giftMaxQty = gift != null
        ? min(_globalMaxQty, (gift['maxQuantity'] as num?)?.toInt() ?? 99)
        : _globalMaxQty;
    final List<int> presets = gift != null && gift['allowedQuantities'] is List
        ? (gift['allowedQuantities'] as List)
            .map((e) => (e as num).toInt())
            .where((q) => q >= _globalMinQty && q <= giftMaxQty)
            .toList()
        : [1, 5, 10, 66, 99];
    final int coinPrice = gift != null ? ((gift['coinPrice'] as num?)?.toInt() ?? 0) : 0;
    final int totalCoins = coinPrice * _quantity;

    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Container(
        decoration: const BoxDecoration(
          color: _bgPanel,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 16),
        child: _loading
            ? const SizedBox(
                height: 260,
                child: Center(child: CircularProgressIndicator(color: _neonPink)),
              )
            : Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Text(
                        _isUrdu ? 'تحفہ بھیجیں' : 'Send Gift to',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _cardDark,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: _goldCoin.withOpacity(0.4)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.monetization_on_rounded, color: _goldCoin, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '$_availableCoins',
                              style: const TextStyle(color: _goldCoin, fontWeight: FontWeight.w800, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      InkWell(
                        onTap: () => setState(() => _lowEndMode = !_lowEndMode),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _cardDark,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Text(
                            _lowEndMode ? 'Lite' : 'Full FX',
                            style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: _hosts.map((host) {
                      final isSelected = host['hostId'] == _selectedHostId;
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: InkWell(
                            onTap: () => setState(() => _selectedHostId = host['hostId'].toString()),
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFF2B104B) : _cardDark,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isSelected ? _neonPink : Colors.white12,
                                  width: isSelected ? 1.5 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: const Color(0xFF3A1A66),
                                    backgroundImage: NetworkImage(_resolveAssetUrl(host['avatarUrl']?.toString())),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      '${host['nickname']} (${host['badge']})',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 30,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 6),
                      itemBuilder: (_, idx) {
                        final cat = _categories[idx];
                        final active = cat['categoryId'] == _activeCategoryId;
                        return InkWell(
                          onTap: () => setState(() => _activeCategoryId = cat['categoryId'].toString()),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                            decoration: BoxDecoration(
                              color: active ? _neonPink : _cardDark,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Text(
                              _isUrdu
                                  ? (cat['shortNameUr'] ?? cat['nameUr']).toString()
                                  : (cat['shortName'] ?? cat['name']).toString(),
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 168,
                    child: GridView.builder(
                      itemCount: _filteredGifts.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                        childAspectRatio: 0.85,
                      ),
                      itemBuilder: (_, idx) {
                        final item = _filteredGifts[idx];
                        final selected = item['giftId'] == _selectedGiftId;
                        return InkWell(
                          onTap: () {
                            setState(() {
                              _selectedGiftId = item['giftId'].toString();
                              final cap = min(_globalMaxQty, (item['maxQuantity'] as num?)?.toInt() ?? 99);
                              if (_quantity > cap) _quantity = cap;
                            });
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: _cardDark,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: selected ? _neonPink : Colors.white10),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Image.network(
                                  _resolveAssetUrl(item['thumbnailUrl']?.toString()),
                                  height: 36,
                                  width: 36,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) => const Icon(Icons.card_giftcard, color: _neonPink, size: 30),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _isUrdu ? item['nameUr'].toString() : item['name'].toString(),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                                ),
                                Text(
                                  '${item['coinPrice']}',
                                  style: const TextStyle(color: _goldCoin, fontSize: 10, fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  if (_errorMsg != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withOpacity(0.18),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              _errorMsg!,
                              style: const TextStyle(color: Colors.white, fontSize: 11),
                            ),
                          ),
                          if (_showTopUpAction && widget.onOpenWallet != null)
                            TextButton(
                              onPressed: widget.onOpenWallet,
                              child: Text(_isUrdu ? 'ری چارج' : 'Top-up', style: const TextStyle(color: _goldCoin)),
                            ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      if (gift != null)
                        Expanded(
                          child: Text(
                            '${_isUrdu ? gift['nameUr'] : gift['name']} x$_quantity • $totalCoins ${_isUrdu ? 'سکے' : 'Coins'}',
                            style: const TextStyle(color: _goldCoin, fontWeight: FontWeight.w800, fontSize: 12),
                          ),
                        ),
                      IconButton(
                        onPressed: _quantity > _globalMinQty ? () => setState(() => _quantity--) : null,
                        icon: const Icon(Icons.remove_circle_outline, color: Colors.white70, size: 20),
                      ),
                      Text('$_quantity', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                      IconButton(
                        onPressed: _quantity < giftMaxQty ? () => setState(() => _quantity++) : null,
                        icon: const Icon(Icons.add_circle_outline, color: Colors.white70, size: 20),
                      ),
                    ],
                  ),
                  Wrap(
                    spacing: 6,
                    children: presets.map((p) {
                      final active = _quantity == p;
                      return ChoiceChip(
                        label: Text('x$p', style: TextStyle(color: active ? Colors.white : Colors.white70, fontSize: 11)),
                        selected: active,
                        selectedColor: _neonPink,
                        backgroundColor: _cardDark,
                        onSelected: (_) => setState(() => _quantity = p),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 10),
                  ElevatedButton(
                    onPressed: (_isRoomLive && !_sending && gift != null) ? _openConfirmAndSend : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _neonPink,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    ),
                    child: Text(
                      _sending ? (_isUrdu ? 'بھیجا جا رہا ہے...' : 'Sending...') : (_isUrdu ? 'تحفہ بھیجیں' : 'Send Gift'),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
