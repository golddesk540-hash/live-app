import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

class TopupReceiptSheet extends StatefulWidget {
  final String apiBaseUrl;
  final String receiptId;
  final Map<String, String>? headers;
  final bool previewDemo;
  final bool isUrdu;

  const TopupReceiptSheet({
    super.key,
    required this.apiBaseUrl,
    required this.receiptId,
    this.headers,
    this.previewDemo = false,
    this.isUrdu = false,
  });

  @override
  State<TopupReceiptSheet> createState() => _TopupReceiptSheetState();
}

class _TopupReceiptSheetState extends State<TopupReceiptSheet> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _receipt;

  @override
  void initState() {
    super.initState();
    _loadReceipt();
  }

  Future<void> _loadReceipt() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final qs = widget.previewDemo ? '?preview=demo' : '';
      final uri = Uri.parse(
        '${widget.apiBaseUrl}/api/topup/receipts/${Uri.encodeComponent(widget.receiptId)}$qs',
      );
      final res = await http.get(uri, headers: widget.headers);
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _receipt = Map<String, dynamic>.from(data['receipt']);
          _loading = false;
        });
      } else {
        setState(() {
          _error = data['error']?.toString() ?? 'Unable to load receipt.';
          _loading = false;
        });
      }
    } catch (_) {
      setState(() {
        _error = 'Network error loading receipt.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRtl = widget.isUrdu;
    return Directionality(
      textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF280B4F), Color(0xFF130428)],
          ),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        child: _loading
            ? const SizedBox(
                height: 220,
                child: Center(
                  child: CircularProgressIndicator(color: Color(0xFFFF2E83)),
                ),
              )
            : _error != null
                ? Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, color: Color(0xFFFB7185), size: 36),
                      const SizedBox(height: 8),
                      Text(_error!, style: const TextStyle(color: Colors.white70)),
                      const SizedBox(height: 16),
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: Text(isRtl ? 'بند کریں' : 'Close'),
                      ),
                    ],
                  )
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.verified_rounded, color: Color(0xFFFACC15)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              isRtl ? 'سرکاری ٹاپ اپ رسید' : 'Official Top-up Receipt',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            icon: const Icon(Icons.close, color: Colors.white70),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.35),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: Colors.amberAccent.withOpacity(0.3)),
                        ),
                        child: Column(
                          children: [
                            _row(isRtl ? 'رسید آئی ڈی' : 'Receipt ID', _receipt!['receiptId'].toString(), highlight: true),
                            _row(isRtl ? 'آرڈر آئی ڈی' : 'Order ID', _receipt!['orderId'].toString()),
                            _row(isRtl ? 'پیکیج' : 'Package', _receipt!['packageName'].toString()),
                            _row(isRtl ? 'بنیادی سکے' : 'Base Coins', '${_receipt!['baseCoins']}'),
                            _row(isRtl ? 'بونس سکے' : 'Bonus Coins', '+${_receipt!['bonusCoins']}'),
                            const Divider(color: Colors.white24, height: 18),
                            _row(
                              isRtl ? 'کل سکے' : 'Total Credited',
                              '+${_receipt!['totalCoins']} Coins',
                              highlight: true,
                            ),
                            _row(
                              isRtl ? 'رقم' : 'Amount Charged',
                              '${_receipt!['currency']} ${(_receipt!['amount'] as num).toStringAsFixed(2)}',
                            ),
                            _row(isRtl ? 'حالت' : 'Status', _receipt!['status'].toString().toUpperCase()),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF2E83),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 13),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: _receipt!['receiptId'].toString()));
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                isRtl ? 'رسید آئی ڈی کاپی ہو گئی' : 'Receipt ID copied to clipboard',
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.copy_rounded, size: 18),
                        label: Text(isRtl ? 'رسید آئی ڈی کاپی کریں' : 'Copy Receipt ID'),
                      ),
                    ],
                  ),
      ),
    );
  }

  Widget _row(String k, String v, {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(k, style: const TextStyle(color: Colors.white60, fontSize: 12)),
          Flexible(
            child: Text(
              v,
              textAlign: TextAlign.end,
              style: TextStyle(
                color: highlight ? const Color(0xFFFACC15) : Colors.white,
                fontSize: 12,
                fontWeight: highlight ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
