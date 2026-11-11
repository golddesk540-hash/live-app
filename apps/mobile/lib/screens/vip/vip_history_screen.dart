import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 7 Module 7.7: VIP Membership History Screen (Android & iOS)
/// ============================================================================
class VipHistoryScreen extends StatefulWidget {
  final String apiBaseUrl;
  final Map<String, String>? headers;
  final bool previewDemo;
  final bool initialUrdu;

  const VipHistoryScreen({
    super.key,
    required this.apiBaseUrl,
    this.headers,
    this.previewDemo = false,
    this.initialUrdu = false,
  });

  @override
  State<VipHistoryScreen> createState() => _VipHistoryScreenState();
}

class _VipHistoryScreenState extends State<VipHistoryScreen> {
  static const _bgTop = Color(0xFF0C071E);
  static const _bgBottom = Color(0xFF080412);
  static const _cardColor = Color(0xFF160D35);
  static const _goldAccent = Color(0xFFFBBF24);
  static const _neonPink = Color(0xFFEC248F);

  bool _loading = true;
  late bool _isUrdu = widget.initialUrdu;
  String _statusFilter = 'all';
  List<Map<String, dynamic>> _records = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final qs = StringBuffer('?status=$_statusFilter&limit=25');
      if (widget.previewDemo) qs.write('&preview=demo');

      final res = await http.get(
        Uri.parse('${widget.apiBaseUrl}/api/vip/history$qs'),
        headers: widget.headers,
      );
      final data = jsonDecode(res.body);
      if (!mounted) return;
      if (res.statusCode != 200 || data['success'] != true) {
        setState(() {
          _error = data['error']?.toString() ?? 'Failed to load VIP history';
          _loading = false;
        });
        return;
      }
      setState(() {
        _records = List<Map<String, dynamic>>.from(data['records'] ?? []);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgTop,
        appBar: AppBar(
          backgroundColor: _bgTop,
          foregroundColor: Colors.white,
          elevation: 0,
          title: Text(
            _isUrdu ? 'وی آئی پی رکنیت کی تاریخ' : 'VIP Membership History',
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
          ),
          actions: [
            IconButton(
              onPressed: () => setState(() => _isUrdu = !_isUrdu),
              icon: const Icon(Icons.translate_rounded, color: _goldAccent),
            ),
            IconButton(
              onPressed: _loadHistory,
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [_bgTop, _bgBottom],
            ),
          ),
          child: Column(
            children: [
              SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    for (final st in const ['all', 'active', 'expired', 'cancelled', 'suspended', 'refunded'])
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(st.toUpperCase(), style: const TextStyle(fontSize: 11)),
                          selected: _statusFilter == st,
                          selectedColor: _neonPink,
                          backgroundColor: _cardColor,
                          labelStyle: TextStyle(
                            color: _statusFilter == st ? Colors.white : Colors.white70,
                            fontWeight: FontWeight.w700,
                          ),
                          onSelected: (_) {
                            setState(() => _statusFilter = st);
                            _loadHistory();
                          },
                        ),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: _loading
                    ? const Center(child: CircularProgressIndicator(color: _goldAccent))
                    : _error != null
                        ? Center(
                            child: Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                          )
                        : _records.isEmpty
                            ? Center(
                                child: Text(
                                  _isUrdu ? 'کوئی ریکارڈ نہیں ملا۔' : 'No VIP membership records found.',
                                  style: const TextStyle(color: Colors.white60),
                                ),
                              )
                            : ListView.separated(
                                padding: const EdgeInsets.all(14),
                                itemCount: _records.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (_, idx) {
                                  final r = _records[idx];
                                  return Container(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: _cardColor,
                                      borderRadius: BorderRadius.circular(18),
                                      border: Border.all(color: Colors.purpleAccent.withOpacity(0.25)),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              '${r['planName'] ?? ''} (${r['badgeLabel'] ?? ''})',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w800,
                                                fontSize: 14,
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: Colors.white12,
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: Text(
                                                (r['status'] ?? '').toString().toUpperCase(),
                                                style: const TextStyle(
                                                  color: _goldAccent,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w800,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          'ID: ${r['membershipId']}  •  \$${Number.tryParse('${r['purchaseAmount'] ?? 0}')?.toStringAsFixed(2) ?? '0.00'} ${r['currency'] ?? 'USD'} (${r['paymentMethod'] ?? ''})',
                                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Activated: ${r['activationDate'] ?? '—'}  •  Expiry: ${r['expiryDate'] ?? '—'}',
                                          style: const TextStyle(color: Colors.white54, fontSize: 11),
                                        ),
                                        if (r['receiptId'] != null)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 4),
                                            child: Text(
                                              'Receipt: ${r['receiptId']}',
                                              style: const TextStyle(color: Color(0xFF34D399), fontSize: 11),
                                            ),
                                          ),
                                      ],
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
  }
}
