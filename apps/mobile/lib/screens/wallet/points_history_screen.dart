import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 7 Module 7.1: Host Points History (Flutter Mobile)
/// Strict Points Ledger view: 70% Gift Earnings, Admin Adjustments, Reversals.
/// ============================================================================

class PointsHistoryScreen extends StatefulWidget {
  final String userId;
  final String apiBaseUrl;
  final String? authToken;
  final bool previewDemo;
  final bool initialUrdu;

  const PointsHistoryScreen({
    Key? key,
    this.userId = 'user_wallet_demo_701',
    this.apiBaseUrl = 'https://kigolive.com',
    this.authToken,
    this.previewDemo = true,
    this.initialUrdu = false,
  }) : super(key: key);

  @override
  State<PointsHistoryScreen> createState() => _PointsHistoryScreenState();
}

class _PointsHistoryScreenState extends State<PointsHistoryScreen> {
  static const Color _bgDeep = Color(0xFF0B061D);
  static const Color _cardDark = Color(0xFF211746);
  static const Color _blueAccent = Color(0xFF42B8FF);
  static const Color _neonPink = Color(0xFFFF2D78);

  late bool _isUrdu;
  String _statusFilter = 'all';
  bool _loading = true;
  bool _loadingMore = false;
  int _page = 1;
  int _totalPages = 1;
  int _currentPoints = 0;
  final int _limit = 20;
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() {
    super.initState();
    _isUrdu = widget.initialUrdu;
    _loadHistory(reset: true);
  }

  Map<String, String> _headers() {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (widget.authToken != null && widget.authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer ${widget.authToken}';
    }
    return headers;
  }

  Future<void> _loadHistory({bool reset = false}) async {
    if (!mounted) return;
    final nextPage = reset ? 1 : _page + 1;
    if (reset) {
      setState(() {
        _loading = true;
      });
    } else {
      setState(() => _loadingMore = true);
    }

    try {
      final statusParam = _statusFilter == 'all' ? '' : '&status=$_statusFilter';
      final previewParam = widget.previewDemo ? '&preview=demo' : '';
      final uri = Uri.parse(
        '${widget.apiBaseUrl}/api/wallet/points/history?userId=${Uri.encodeComponent(widget.userId)}&page=$nextPage&limit=$_limit$statusParam$previewParam',
      );
      final res = await http.get(uri, headers: _headers()).timeout(const Duration(seconds: 12));
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      if (res.statusCode == 200 && data['success'] == true) {
        final fetched = ((data['transactions'] as List?) ?? [])
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        final pagination = data['pagination'] as Map<String, dynamic>?;
        if (!mounted) return;
        setState(() {
          _currentPoints = (data['currentPoints'] as num?)?.toInt() ?? _currentPoints;
          _totalPages = (pagination?['totalPages'] as num?)?.toInt() ?? 1;
          _page = nextPage;
          if (reset) {
            _items = fetched;
          } else {
            _items.addAll(fetched);
          }
        });
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

  @override
  Widget build(BuildContext context) {
    final filters = ['all', 'completed', 'reversed'];
    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgDeep,
        appBar: AppBar(
          backgroundColor: const Color(0xFF150E32),
          elevation: 0,
          title: Text(
            _isUrdu ? 'پوائنٹس کی تاریخ' : 'Points History',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
          ),
          actions: [
            TextButton(
              onPressed: () => setState(() => _isUrdu = !_isUrdu),
              child: Text(_isUrdu ? 'EN' : 'اردو', style: const TextStyle(color: Colors.white70)),
            ),
          ],
        ),
        body: Column(
          children: [
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(14),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: _cardDark,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: _blueAccent.withOpacity(0.35)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _isUrdu ? 'موجودہ کمائی پوائنٹس' : 'Available Earnings Points',
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  Text(
                    '$_currentPoints Pts',
                    style: const TextStyle(color: _blueAccent, fontWeight: FontWeight.w900, fontSize: 18),
                  ),
                ],
              ),
            ),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              child: Row(
                children: filters.map((f) {
                  final active = _statusFilter == f;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(f.toUpperCase()),
                      selected: active,
                      selectedColor: _blueAccent,
                      backgroundColor: _cardDark,
                      labelStyle: TextStyle(
                        color: active ? Colors.white : Colors.white60,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                      onSelected: (_) {
                        setState(() => _statusFilter = f);
                        _loadHistory(reset: true);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: _neonPink))
                  : RefreshIndicator(
                      color: _blueAccent,
                      onRefresh: () => _loadHistory(reset: true),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(14),
                        itemCount: _items.length + (_page < _totalPages ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index >= _items.length) {
                            return TextButton(
                              onPressed: _loadingMore ? null : () => _loadHistory(reset: false),
                              child: _loadingMore
                                  ? const CircularProgressIndicator(color: _blueAccent)
                                  : Text(_isUrdu ? 'مزید لوڈ کریں' : 'Load More'),
                            );
                          }
                          final tx = _items[index];
                          final rawPts = (tx['pointsAmount'] as num?)?.toInt() ?? 0;
                          final dir = (tx['direction'] ?? 'credit').toString();
                          final pts = dir == 'debit' ? -rawPts : rawPts;
                          final giftCoins = (tx['sourceGiftCoins'] as num?)?.toInt();
                          final sharePct = (tx['sharePercentageApplied'] as num?)?.toDouble();
                          final prevPts = (tx['previousBalance'] as num?)?.toInt() ?? 0;
                          final newPts = (tx['newBalance'] as num?)?.toInt() ?? 0;
                          final status = (tx['status'] ?? 'completed').toString();
                          final desc = (tx['description'] ?? tx['giftSource'] ?? tx['transactionType'] ?? '').toString();

                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: _cardDark,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.white.withOpacity(0.08)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        desc,
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                                      ),
                                    ),
                                    Text(
                                      '${pts >= 0 ? '+' : ''}$pts Pts',
                                      style: TextStyle(
                                        color: pts >= 0 ? _blueAccent : Colors.amberAccent,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'ID: ${tx['transactionId']} • $prevPts → $newPts • ${status.toUpperCase()}',
                                  style: const TextStyle(color: Colors.white54, fontSize: 11),
                                ),
                                if (giftCoins != null && giftCoins > 0 && sharePct != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 5),
                                    child: Text(
                                      'Gift: $giftCoins Coins × ${sharePct.toStringAsFixed(0)}% Host Share',
                                      style: const TextStyle(color: Color(0xFF4ADE80), fontSize: 11),
                                    ),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
