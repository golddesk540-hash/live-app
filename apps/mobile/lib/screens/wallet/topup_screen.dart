import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'topup_receipt_sheet.dart';

class TopupScreen extends StatefulWidget {
  final String apiBaseUrl;
  final String userId;
  final Map<String, String>? headers;
  final bool previewDemo;

  const TopupScreen({
    super.key,
    required this.apiBaseUrl,
    required this.userId,
    this.headers,
    this.previewDemo = false,
  });

  @override
  State<TopupScreen> createState() => _TopupScreenState();
}

class _TopupScreenState extends State<TopupScreen> {
  bool _loading = true;
  bool _processing = false;
  bool _isUrdu = false;

  int _coinBalance = 0;
  List<Map<String, dynamic>> _packages = [];
  List<Map<String, dynamic>> _providers = [];
  List<Map<String, dynamic>> _history = [];

  String? _selectedPkgId;
  String _selectedProviderKey = 'sandbox_verified';
  String? _statusMessage;
  bool _statusIsError = false;

  String get _platformName {
    if (kIsWeb) return 'web';
    try {
      if (Platform.isIOS) return 'ios';
      if (Platform.isAndroid) return 'android';
    } catch (_) {}
    return 'web';
  }

  String get _qs => widget.previewDemo ? '?preview=demo' : '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final pkgUri = Uri.parse('${widget.apiBaseUrl}/api/topup/packages');
      final provUri = Uri.parse('${widget.apiBaseUrl}/api/topup/methods?platform=$_platformName');
      final balUri = Uri.parse(
        '${widget.apiBaseUrl}/api/wallet/balance$_qs${_qs.isEmpty ? '?' : '&'}fresh=true',
      );
      final histUri = Uri.parse(
        '${widget.apiBaseUrl}/api/topup/history$_qs${_qs.isEmpty ? '?' : '&'}limit=15',
      );

      final responses = await Future.wait([
        http.get(pkgUri, headers: widget.headers),
        http.get(provUri, headers: widget.headers),
        http.get(balUri, headers: widget.headers),
        http.get(histUri, headers: widget.headers),
      ]);

      final pkgJson = jsonDecode(responses[0].body);
      final provJson = jsonDecode(responses[1].body);
      final balJson = jsonDecode(responses[2].body);
      final histJson = jsonDecode(responses[3].body);

      if (!mounted) return;
      setState(() {
        if (pkgJson['success'] == true) {
          _packages = List<Map<String, dynamic>>.from(pkgJson['packages'] ?? []);
          if (_selectedPkgId == null && _packages.isNotEmpty) {
            final popular = _packages.firstWhere(
              (p) => p['isPopular'] == true,
              orElse: () => _packages.first,
            );
            _selectedPkgId = popular['packageId'].toString();
          }
        }
        if (provJson['success'] == true) {
          _providers = List<Map<String, dynamic>>.from(provJson['providers'] ?? []);
        }
        if (balJson['success'] == true && balJson['wallet'] != null) {
          _coinBalance = (balJson['wallet']['coins'] as num?)?.toInt() ?? 0;
        }
        if (histJson['success'] == true) {
          _history = List<Map<String, dynamic>>.from(histJson['items'] ?? []);
        }
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _statusIsError = true;
        _statusMessage = _isUrdu ? 'ڈیٹا لوڈ کرنے میں ناکامی' : 'Failed to load coin packages.';
      });
    }
  }

  Future<void> _initiatePurchase() async {
    if (_selectedPkgId == null) return;
    final provider = _providers.firstWhere(
      (p) => p['providerKey'] == _selectedProviderKey,
      orElse: () => <String, dynamic>{},
    );

    if (provider['isReadyForPayment'] != true) {
      setState(() {
        _statusIsError = true;
        _statusMessage =
            '${provider['displayName'] ?? _selectedProviderKey}: Credentials Pending. Select Verified Payment Sandbox to test.';
      });
      return;
    }

    setState(() {
      _processing = true;
      _statusMessage = null;
    });

    try {
      final orderUri = Uri.parse('${widget.apiBaseUrl}/api/topup/orders$_qs');
      final orderRes = await http.post(
        orderUri,
        headers: {
          'Content-Type': 'application/json',
          ...?widget.headers,
        },
        body: jsonEncode({
          'packageId': _selectedPkgId,
          'providerKey': _selectedProviderKey,
          'platform': _platformName,
          'idempotencyKey': 'FLUTTER_ORD_${_selectedPkgId}_${DateTime.now().millisecondsSinceEpoch}',
        }),
      );
      final orderJson = jsonDecode(orderRes.body);
      if (orderRes.statusCode >= 400 || orderJson['success'] != true) {
        setState(() {
          _processing = false;
          _statusIsError = true;
          _statusMessage = orderJson['error']?.toString() ?? 'Order creation rejected.';
        });
        return;
      }

      final order = Map<String, dynamic>.from(orderJson['order']);
      setState(() => _processing = false);
      if (!mounted) return;
      await _showSandboxConfirmDialog(order);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _processing = false;
        _statusIsError = true;
        _statusMessage = 'Network error creating top-up order.';
      });
    }
  }

  Future<void> _showSandboxConfirmDialog(Map<String, dynamic> order) async {
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
        child: AlertDialog(
          backgroundColor: const Color(0xFF210842),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Text(
            _isUrdu ? 'محفوظ ادائیگی کی تصدیق' : 'Verified Payment Checkout',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.teal.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _isUrdu
                      ? 'سینڈ باکس ٹیسٹ موڈ: اصل رقم نہیں کاٹی جائے گی۔'
                      : 'Sandbox Verification Mode — cryptographically signed webhook test (no real charge).',
                  style: const TextStyle(color: Colors.greenAccent, fontSize: 11),
                ),
              ),
              const SizedBox(height: 12),
              Text('Order: ${order['orderId']}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
              const SizedBox(height: 4),
              Text(
                '${order['totalCoins']} Coins • \$${(order['amount'] as num).toStringAsFixed(2)} ${order['currency']}',
                style: const TextStyle(color: Color(0xFFFACC15), fontWeight: FontWeight.w800),
              ),
            ],
          ),
            actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, 'failed'),
              child: Text(
                _isUrdu ? 'ناکام' : 'Simulate Fail',
                style: const TextStyle(color: Color(0xFFFB7185)),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, 'pending'),
              child: Text(_isUrdu ? 'زیر التواء' : 'Keep Pending'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
              onPressed: () => Navigator.pop(ctx, 'succeeded'),
              child: Text(_isUrdu ? 'تصدیق کریں' : 'Confirm Verified Pay'),
            ),
          ],
        ),
      ),
    );

    if (result == null || result == 'pending') {
      await _loadData();
      return;
    }

    final compUri = Uri.parse('${widget.apiBaseUrl}/api/topup/sandbox/complete$_qs');
    final compRes = await http.post(
      compUri,
      headers: {
        'Content-Type': 'application/json',
        ...?widget.headers,
      },
      body: jsonEncode({
        'orderId': order['orderId'],
        'outcome': result,
      }),
    );
    final compJson = jsonDecode(compRes.body);
    await _loadData();

    if (!mounted) return;
    if (result == 'succeeded' && compJson['success'] == true) {
      setState(() {
        _statusIsError = false;
        _statusMessage = 'Credited +${order['totalCoins']} coins cleanly.';
      });
      final receipt = compJson['receipt'];
      if (receipt != null && receipt['receiptId'] != null) {
        _openReceiptSheet(receipt['receiptId'].toString());
      }
    } else {
      setState(() {
        _statusIsError = true;
        _statusMessage = 'Payment $result — zero coins added.';
      });
    }
  }

  void _openReceiptSheet(String receiptId) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => TopupReceiptSheet(
        apiBaseUrl: widget.apiBaseUrl,
        receiptId: receiptId,
        headers: widget.headers,
        previewDemo: widget.previewDemo,
        isUrdu: _isUrdu,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: const Color(0xFF0C0219),
        appBar: AppBar(
          backgroundColor: const Color(0xFF190633),
          foregroundColor: Colors.white,
          title: Text(_isUrdu ? 'سکے ٹاپ اپ' : 'Top-up Coins'),
          actions: [
            IconButton(
              onPressed: () => setState(() => _isUrdu = !_isUrdu),
              icon: const Icon(Icons.language_rounded),
              tooltip: _isUrdu ? 'English' : 'اردو',
            ),
            IconButton(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFFF2E83)))
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [Color(0xFF280B4E), Color(0xFF1A0635)]),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.amberAccent.withOpacity(0.35)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isUrdu ? 'موجودہ سکے' : 'Current Coin Balance',
                              style: const TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$_coinBalance ${_isUrdu ? 'سکے' : 'Coins'}',
                              style: const TextStyle(
                                color: Color(0xFFFACC15),
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF2E83),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Text(
                            'P7.6',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (_statusMessage != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: (_statusIsError ? Colors.red : Colors.green).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _statusIsError ? const Color(0xFFFB7185) : const Color(0xFF34D399),
                        ),
                      ),
                      child: Text(
                        _statusMessage!,
                        style: TextStyle(
                          color: _statusIsError ? const Color(0xFFFB7185) : Colors.greenAccent,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  ..._packages.map((pkg) {
                    final selected = pkg['packageId'] == _selectedPkgId;
                    final bonus = (pkg['bonusCoins'] as num?)?.toInt() ?? 0;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedPkgId = pkg['packageId'].toString()),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1F083E),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: selected ? const Color(0xFFFACC15) : Colors.purple.withOpacity(0.25),
                            width: selected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const CircleAvatar(
                                  backgroundColor: Color(0xFFFACC15),
                                  child: Icon(Icons.monetization_on, color: Color(0xFF3A1600)),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${pkg['baseCoins']} Coins',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                    if (bonus > 0)
                                      Text(
                                        '+$bonus Bonus (${pkg['totalCoins']} Total)',
                                        style: const TextStyle(color: Color(0xFFFACC15), fontSize: 11),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFF2E83),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '\$${(pkg['priceAmount'] as num).toStringAsFixed(2)}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 12),
                  Text(
                    _isUrdu ? 'ادائیگی کا طریقہ' : 'Payment Methods',
                    style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _providers.map((p) {
                      final key = p['providerKey'].toString();
                      final active = key == _selectedProviderKey;
                      return ChoiceChip(
                        selected: active,
                        selectedColor: const Color(0xFFFF2E83),
                        backgroundColor: const Color(0xFF210A40),
                        label: Text(
                          '${p['displayName']}${p['isReadyForPayment'] == true ? '' : ' (Pending Creds)'}',
                          style: const TextStyle(color: Colors.white, fontSize: 11),
                        ),
                        onSelected: (_) => setState(() => _selectedProviderKey = key),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 18),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF2E83),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    ),
                    onPressed: _processing ? null : _initiatePurchase,
                    child: Text(
                      _processing
                          ? (_isUrdu ? 'جاری ہے...' : 'Processing...')
                          : (_isUrdu ? 'ریچارج جاری رکھیں' : 'Continue to Recharge'),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    _isUrdu ? 'حالیہ ٹاپ اپ تاریخ' : 'Recent Top-up History',
                    style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  ..._history.map(
                    (h) => Card(
                      color: const Color(0xFF190633),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      child: ListTile(
                        title: Text(
                          '${h['packageName']} (+${h['totalCoins']} Coins)',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
                        ),
                        subtitle: Text(
                          '${h['orderId']} • ${h['status']}',
                          style: const TextStyle(color: Colors.white60, fontSize: 11),
                        ),
                        trailing: h['receiptId'] != null
                            ? TextButton(
                                onPressed: () => _openReceiptSheet(h['receiptId'].toString()),
                                child: Text(_isUrdu ? 'رسید' : 'Receipt'),
                              )
                            : null,
                      ),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
