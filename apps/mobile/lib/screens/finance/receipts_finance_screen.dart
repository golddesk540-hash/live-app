import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 7 Module 7.10: Complete Receipts & Finance Screen
/// Matches Design Reference 07_10_receipts_and_finance_export.png
/// Dark purple theme, neon pink highlights, gold coin accents, EN + Urdu RTL.
/// Strictly separates Cash Payments, Coins, Bonus Coins, Host Points (Non-Cash),
/// and Platform Share (30%). Never creates receipts for failed/cancelled records.
/// ============================================================================

class ReceiptsFinanceScreen extends StatefulWidget {
  final String apiBaseUrl;
  final String userId;
  final Map<String, String>? headers;
  final bool previewDemo;
  final bool initialUrdu;

  const ReceiptsFinanceScreen({
    super.key,
    required this.apiBaseUrl,
    required this.userId,
    this.headers,
    this.previewDemo = false,
    this.initialUrdu = false,
  });

  @override
  State<ReceiptsFinanceScreen> createState() => _ReceiptsFinanceScreenState();
}

class _ReceiptsFinanceScreenState extends State<ReceiptsFinanceScreen> {
  static const _bgDeep = Color(0xFF0C041C);
  static const _cardBg = Color(0xFF1A0F35);
  static const _neonPink = Color(0xFFFF2D78);
  static const _gold = Color(0xFFFBBF24);

  late bool _isUrdu;
  String _mode = 'receipts'; // 'receipts' | 'export'
  String _category = 'all';
  String _statusFilter = 'all';
  String _searchQuery = '';
  bool _loading = true;
  String? _error;

  List<dynamic> _historyItems = [];
  List<dynamic> _receipts = [];
  Map<String, dynamic>? _summary;

  @override
  void initState() {
    super.initState();
    _isUrdu = widget.initialUrdu;
    _fetchRecords();
  }

  Future<void> _fetchRecords() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final params = <String, String>{
        'limit': '30',
        if (widget.previewDemo) 'preview': 'demo',
        if (_category != 'all') 'category': _category,
        if (_statusFilter != 'all') 'status': _statusFilter,
        if (_searchQuery.trim().isNotEmpty) 'search': _searchQuery.trim(),
      };
      final endpoint = _mode == 'receipts' ? '/api/finance/history' : '/api/finance/receipts';
      final uri = Uri.parse('${widget.apiBaseUrl}$endpoint').replace(queryParameters: params);
      final res = await http.get(uri, headers: widget.headers ?? {});
      final data = jsonDecode(res.body);
      if (res.statusCode >= 400 || data['success'] != true) {
        setState(() {
          _error = data['error']?.toString() ?? 'Failed to load financial records.';
          _loading = false;
        });
        return;
      }
      setState(() {
        if (_mode == 'receipts') {
          _historyItems = data['items'] ?? [];
          _summary = data['summary'];
        } else {
          _receipts = data['receipts'] ?? [];
        }
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _openReceiptModal(String receiptOrTxId) async {
    try {
      final qs = widget.previewDemo ? '?preview=demo' : '';
      final uri = Uri.parse('${widget.apiBaseUrl}/api/finance/receipts/${Uri.encodeComponent(receiptOrTxId)}$qs');
      final res = await http.get(uri, headers: widget.headers ?? {});
      final data = jsonDecode(res.body);
      if (!mounted) return;
      if (res.statusCode >= 400 || data['success'] != true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['error']?.toString() ?? 'Receipt unavailable')),
        );
        return;
      }
      final r = data['receipt'] as Map<String, dynamic>;
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: const Color(0xFF140A2A),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (ctx) => Directionality(
          textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'POPO LIVE • ${_isUrdu ? 'مستند رسید' : 'OFFICIAL RECEIPT'}',
                            style: const TextStyle(color: _neonPink, fontWeight: FontWeight.w900, fontSize: 13),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            r['receiptNumber']?.toString() ?? '',
                            style: const TextStyle(color: _gold, fontWeight: FontWeight.w800, fontSize: 15),
                          ),
                        ],
                      ),
                      Chip(
                        backgroundColor: Colors.white10,
                        label: Text(
                          (r['status']?.toString() ?? 'successful').toUpperCase(),
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const Divider(color: Colors.white24, height: 22),
                  _detailRow(_isUrdu ? 'ٹرانزیکشن آئی ڈی' : 'Transaction ID', r['transactionId']?.toString() ?? ''),
                  _detailRow(_isUrdu ? 'قسم' : 'Category', (r['txCategory']?.toString() ?? '').toUpperCase()),
                  _detailRow(_isUrdu ? 'تفصیل' : 'Description', r['description']?.toString() ?? ''),
                  _detailRow(
                    _isUrdu ? 'ادائیگی کی رقم' : 'Cash Payment',
                    ((r['paymentAmount'] ?? 0) > 0 && r['currency'] != 'NONE')
                        ? '${r['currency']} ${r['paymentAmount']}'
                        : '0.00 (Virtual)',
                  ),
                  _detailRow(_isUrdu ? 'سکے' : 'Coins Quantity', '${r['coinQuantity'] ?? 0} Coins'),
                  _detailRow(_isUrdu ? 'بونس سکے' : 'Bonus Coins', '${r['bonusCoinQuantity'] ?? 0} Bonus'),
                  _detailRow(_isUrdu ? 'ہوسٹ پوائنٹس (نان کیش)' : 'Host Points (Non-Cash)', '${r['pointsQuantity'] ?? 0} Pts'),
                  _detailRow(_isUrdu ? 'پلیٹ فارم حصہ' : 'Platform Share (30%)', '${r['platformShareCoins'] ?? 0} Coins'),
                  _detailRow(_isUrdu ? 'طریقہ' : 'Payment Method', r['paymentMethod']?.toString() ?? 'Wallet'),
                  _detailRow(_isUrdu ? 'حوالہ' : 'Provider Reference', r['providerReferenceMasked']?.toString() ?? 'Internal'),
                  _detailRow(_isUrdu ? 'تاریخ' : 'Issued At', r['issuedAt']?.toString() ?? ''),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _neonPink,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                      ),
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: '${r['receiptNumber']} | ${r['transactionId']}'));
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(_isUrdu ? 'رسید نمبر کاپی ہو گیا' : 'Receipt reference copied')),
                        );
                      },
                      icon: const Icon(Icons.copy_rounded, size: 18),
                      label: Text(_isUrdu ? 'رسید کاپی کریں' : 'Copy Official Receipt Reference'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Widget _detailRow(String k, String v) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(k, style: const TextStyle(color: Colors.white60, fontSize: 12)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              v,
              textAlign: TextAlign.end,
              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgDeep,
        appBar: AppBar(
          backgroundColor: _bgDeep,
          elevation: 0,
          title: Text(
            _isUrdu ? 'رسیدیں اور مالیات' : 'Receipts & Finance',
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.white),
          ),
          actions: [
            TextButton(
              onPressed: () => setState(() => _isUrdu = !_isUrdu),
              child: Text(
                _isUrdu ? 'EN' : 'اردو',
                style: const TextStyle(color: _gold, fontWeight: FontWeight.w900),
              ),
            ),
          ],
        ),
        body: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Column(
            children: [
              // Glowing Pink Toggle Bar ("Receipts" | "Export")
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFF180C33),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.purpleAccent.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    _modeButton('receipts', _isUrdu ? 'رسیدیں' : 'Receipts'),
                    _modeButton('export', _isUrdu ? 'پی ڈی ایف / ایکسپورٹ' : 'Export'),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Search input
              TextField(
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: _isUrdu ? 'آئی ڈی یا رسید تلاش کریں...' : 'Search Transaction ID or Receipt #...',
                  hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                  prefixIcon: const Icon(Icons.search_rounded, color: Colors.white54),
                  filled: true,
                  fillColor: const Color(0xFF160A2E),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: Colors.purpleAccent.withOpacity(0.25)),
                  ),
                ),
                onChanged: (v) {
                  _searchQuery = v;
                  _fetchRecords();
                },
              ),
              const SizedBox(height: 10),

              // Filter Chips
              SizedBox(
                height: 36,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _catChip('all', _isUrdu ? 'سب' : 'All'),
                    _catChip('topup', _isUrdu ? 'ٹاپ اپ' : 'Top-ups'),
                    _catChip('gift_sent', _isUrdu ? 'تحائف' : 'Gifts'),
                    _catChip('earnings', _isUrdu ? 'ہوسٹ کمائی' : 'Host Earnings'),
                    _catChip('vip', 'VIP'),
                    _catChip('store_purchase', _isUrdu ? 'اسٹور' : 'Store'),
                    _catChip('refunds', _isUrdu ? 'واپسی' : 'Refunds'),
                  ],
                ),
              ),
              const SizedBox(height: 10),

              if (_summary != null && _mode == 'receipts') ...[
                Row(
                  children: [
                    _miniMetric(_isUrdu ? 'ٹاپ اپ سکے' : 'Top-up Coins', '${_summary!['totalTopupCoinsReceived'] ?? 0}', _gold),
                    const SizedBox(width: 8),
                    _miniMetric(_isUrdu ? 'ہوسٹ پوائنٹس' : 'Host Points', '${_summary!['totalHostPointsCredited'] ?? 0}', _neonPink),
                  ],
                ),
                const SizedBox(height: 10),
              ],

              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator(color: _neonPink))
                    : _error != null
                        ? Center(child: Text(_error!, style: const TextStyle(color: Colors.redAccent)))
                        : (_mode == 'receipts' ? _historyItems : _receipts).isEmpty
                            ? Center(
                                child: Text(
                                  _isUrdu ? 'کوئی ریکارڈ نہیں ملا' : 'No records found',
                                  style: const TextStyle(color: Colors.white54),
                                ),
                              )
                            : RefreshIndicator(
                                onRefresh: _fetchRecords,
                                child: ListView.builder(
                                  itemCount: _mode == 'receipts' ? _historyItems.length : _receipts.length,
                                  itemBuilder: (ctx, idx) {
                                    final item = (_mode == 'receipts' ? _historyItems : _receipts)[idx];
                                    final eligible = _mode == 'export' || item['receiptEligible'] == true;
                                    final recId = item['receiptId']?.toString() ?? item['recordId']?.toString() ?? '';
                                    return Card(
                                      color: _cardBg,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        side: BorderSide(color: Colors.purpleAccent.withOpacity(0.22)),
                                      ),
                                      margin: const EdgeInsets.only(bottom: 10),
                                      child: ListTile(
                                        onTap: eligible ? () => _openReceiptModal(recId) : null,
                                        leading: CircleAvatar(
                                          backgroundColor: _neonPink.withOpacity(0.18),
                                          child: Icon(
                                            item['txCategory'] == 'host_earning'
                                                ? Icons.star_rounded
                                                : item['txCategory'] == 'gift_sent'
                                                    ? Icons.card_giftcard_rounded
                                                    : Icons.monetization_on_rounded,
                                            color: _gold,
                                          ),
                                        ),
                                        title: Text(
                                          (_isUrdu ? item['titleUr'] : item['title'])?.toString() ?? '',
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                                        ),
                                        subtitle: Text(
                                          '${item['status']?.toString().toUpperCase()} • ${item['receiptNumber'] ?? 'Status Only'}',
                                          style: const TextStyle(color: Colors.white54, fontSize: 11),
                                        ),
                                        trailing: eligible
                                            ? const Icon(Icons.chevron_right_rounded, color: Colors.white70)
                                            : null,
                                      ),
                                    );
                                  },
                                ),
                              ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _modeButton(String modeKey, String label) {
    final active = _mode == modeKey;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _mode = modeKey);
          _fetchRecords();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: active
                ? const LinearGradient(colors: [_neonPink, Color(0xFFFF5E9C)])
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              color: active ? Colors.white : Colors.white60,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Widget _catChip(String id, String label) {
    final active = _category == id;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        selected: active,
        label: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
        selectedColor: _neonPink.withOpacity(0.28),
        backgroundColor: const Color(0xFF160A2E),
        labelStyle: TextStyle(color: active ? Colors.white : Colors.white60),
        onSelected: (_) {
          setState(() => _category = id);
          _fetchRecords();
        },
      ),
    );
  }

  Widget _miniMetric(String label, String val, Color accent) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFF150A2C),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.purpleAccent.withOpacity(0.22)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(val, style: TextStyle(color: accent, fontSize: 15, fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }
}
