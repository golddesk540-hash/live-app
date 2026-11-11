import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'vip_history_screen.dart';

/// ============================================================================
/// Popo Live — Phase 7 Module 7.7: Complete VIP Membership Screen
/// Matches Design Reference 07_07_vip.png across Flutter Android & iOS
/// All VIP prices, durations, statuses, and benefits load strictly from backend.
/// ============================================================================
class VipMembershipScreen extends StatefulWidget {
  final String apiBaseUrl;
  final String userId;
  final Map<String, String>? headers;
  final bool previewDemo;
  final bool initialUrdu;

  const VipMembershipScreen({
    super.key,
    required this.apiBaseUrl,
    this.userId = 'user_wallet_demo_701',
    this.headers,
    this.previewDemo = false,
    this.initialUrdu = false,
  });

  @override
  State<VipMembershipScreen> createState() => _VipMembershipScreenState();
}

class _VipMembershipScreenState extends State<VipMembershipScreen> {
  static const _bgTop = Color(0xFF0C071E);
  static const _bgBottom = Color(0xFF080412);
  static const _cardColor = Color(0xFF160D35);
  static const _goldAccent = Color(0xFFFBBF24);
  static const _neonPink = Color(0xFFEC248F);

  bool _loading = true;
  bool _busy = false;
  late bool _isUrdu = widget.initialUrdu;
  bool _autoRenewConsent = false;

  List<Map<String, dynamic>> _plans = [];
  List<Map<String, dynamic>> _providers = [];
  Map<String, dynamic>? _vipProfile;
  String? _selectedPlanId;
  String _selectedProviderKey = 'sandbox_verified';
  String? _bannerMsg;
  bool _bannerIsErr = false;

  String get _platformName {
    if (kIsWeb) return 'web';
    try {
      if (Platform.isIOS) return 'ios';
      if (Platform.isAndroid) return 'android';
    } catch (_) {}
    return 'android';
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
      final res = await Future.wait([
        http.get(
          Uri.parse('${widget.apiBaseUrl}/api/vip/plans?platform=$_platformName'),
          headers: widget.headers,
        ),
        http.get(
          Uri.parse('${widget.apiBaseUrl}/api/vip/status$_qs'),
          headers: widget.headers,
        ),
      ]);
      final plansJson = jsonDecode(res[0].body);
      final statusJson = jsonDecode(res[1].body);
      if (!mounted) return;
      setState(() {
        if (plansJson['success'] == true) {
          _plans = List<Map<String, dynamic>>.from(plansJson['plans'] ?? []);
          _providers = List<Map<String, dynamic>>.from(plansJson['providers'] ?? []);
          if (_selectedPlanId == null && _plans.isNotEmpty) {
            final popular = _plans.firstWhere(
              (p) => p['isPopular'] == true,
              orElse: () => _plans.first,
            );
            _selectedPlanId = popular['planId'].toString();
          }
        }
        if (statusJson['success'] == true) {
          _vipProfile = Map<String, dynamic>.from(statusJson['vip'] ?? {});
        }
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _bannerMsg = e.toString();
        _bannerIsErr = true;
        _loading = false;
      });
    }
  }

  Map<String, dynamic>? get _selectedPlan {
    for (final p in _plans) {
      if (p['planId'] == _selectedPlanId) return p;
    }
    return _plans.isNotEmpty ? _plans.first : null;
  }

  Future<void> _startPurchase(String orderType) async {
    final plan = _selectedPlan;
    if (plan == null) return;
    setState(() {
      _busy = true;
      _bannerMsg = null;
    });
    try {
      final path = orderType == 'renewal' ? '/api/vip/renew' : '/api/vip/purchase';
      final res = await http.post(
        Uri.parse('${widget.apiBaseUrl}$path$_qs'),
        headers: {'Content-Type': 'application/json', ...?widget.headers},
        body: jsonEncode({
          'planId': plan['planId'],
          'providerKey': _selectedProviderKey,
          'platform': _platformName,
          'membershipId': orderType == 'renewal' ? _vipProfile?['membershipId'] : null,
          'autoRenewConsent': _autoRenewConsent,
          'idempotencyKey': 'mob_vip_${DateTime.now().millisecondsSinceEpoch}',
        }),
      );
      final data = jsonDecode(res.body);
      if (!mounted) return;
      if (res.statusCode >= 400 || data['success'] != true) {
        setState(() {
          _bannerIsErr = true;
          _bannerMsg = '${data['errorCode'] ?? 'ERROR'}: ${data['error'] ?? 'Checkout failed'}';
          _busy = false;
        });
        return;
      }

      if (data['activatedImmediately'] == true) {
        setState(() {
          _bannerIsErr = false;
          _bannerMsg = data['message']?.toString() ?? 'VIP activated!';
          _busy = false;
        });
        await _loadData();
        return;
      }

      final order = data['order'];
      if (order != null && _selectedProviderKey == 'sandbox_verified') {
        await _showSandboxConfirmDialog(order['orderId'].toString(), plan['planName'].toString());
      }
      setState(() => _busy = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _bannerIsErr = true;
        _bannerMsg = e.toString();
        _busy = false;
      });
    }
  }

  Future<void> _showSandboxConfirmDialog(String orderId, String planName) async {
    final outcome = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _cardColor,
        title: Text(
          _isUrdu ? 'تصدیق شدہ VIP ادائیگی' : 'Verify VIP Sandbox Checkout',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
        ),
        content: Text(
          'Order: $orderId\nPlan: $planName\nPending orders grant ZERO active VIP perks until verified.',
          style: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop('fail'),
            child: const Text('Simulate Fail', style: TextStyle(color: Colors.redAccent)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: _goldAccent, foregroundColor: Colors.black),
            onPressed: () => Navigator.of(ctx).pop('succeed'),
            child: const Text('Verify & Activate', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
    if (outcome == null) return;

    final res = await http.post(
      Uri.parse('${widget.apiBaseUrl}/api/vip/sandbox/complete$_qs'),
      headers: {'Content-Type': 'application/json', ...?widget.headers},
      body: jsonEncode({'orderId': orderId, 'outcome': outcome}),
    );
    final data = jsonDecode(res.body);
    if (!mounted) return;
    setState(() {
      _bannerIsErr = outcome == 'fail' || data['success'] != true;
      _bannerMsg = data['message']?.toString() ?? data['error']?.toString() ?? 'Completed';
    });
    await _loadData();
  }

  @override
  Widget build(BuildContext context) {
    final plan = _selectedPlan;
    final hasActiveVip = _vipProfile?['hasActiveVip'] == true;
    final benefits = List<Map<String, dynamic>>.from(plan?['benefits'] ?? []);

    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgTop,
        appBar: AppBar(
          backgroundColor: _bgTop,
          foregroundColor: Colors.white,
          elevation: 0,
          title: const Text('Popo Live', style: TextStyle(fontWeight: FontWeight.w900)),
          actions: [
            IconButton(
              onPressed: () => setState(() => _isUrdu = !_isUrdu),
              icon: const Icon(Icons.translate_rounded, color: _goldAccent),
            ),
            IconButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => VipHistoryScreen(
                    apiBaseUrl: widget.apiBaseUrl,
                    headers: widget.headers,
                    previewDemo: widget.previewDemo,
                    initialUrdu: _isUrdu,
                  ),
                ),
              ),
              icon: const Icon(Icons.history_rounded),
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: _goldAccent))
            : Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [_bgTop, _bgBottom],
                  ),
                ),
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Center(
                      child: Column(
                        children: [
                          Container(
                            width: 92,
                            height: 92,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _cardColor,
                              border: Border.all(color: _goldAccent, width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: _goldAccent.withOpacity(0.38),
                                  blurRadius: 24,
                                ),
                              ],
                            ),
                            child: const Icon(Icons.workspace_premium_rounded, color: _goldAccent, size: 48),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _isUrdu ? 'وی آئی پی بنیں' : 'Become a VIP',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 24,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            hasActiveVip
                                ? '${_vipProfile?['planName']} (${_vipProfile?['badgeLabel']}) • Exp ${_vipProfile?['expiryDate']?.toString().split('T').first ?? ''}'
                                : 'Status: ${(_vipProfile?['status'] ?? 'Standard').toString().toUpperCase()}',
                            style: const TextStyle(color: _goldAccent, fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (_bannerMsg != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: (_bannerIsErr ? Colors.redAccent : const Color(0xFF34D399)).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: _bannerIsErr ? Colors.redAccent : const Color(0xFF34D399),
                          ),
                        ),
                        child: Text(
                          _bannerMsg!,
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ),
                    SizedBox(
                      height: 108,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _plans.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (_, i) {
                          final p = _plans[i];
                          final selected = p['planId'] == plan?['planId'];
                          return GestureDetector(
                            onTap: () => setState(() => _selectedPlanId = p['planId'].toString()),
                            child: Container(
                              width: 142,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: selected ? const Color(0xFF2B155D) : _cardColor,
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: selected ? _goldAccent : Colors.purpleAccent.withOpacity(0.25),
                                  width: selected ? 2 : 1,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${p['badgeLabel']} • ${p['durationDays']}d',
                                    style: const TextStyle(
                                      color: _goldAccent,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  Text(
                                    _isUrdu ? (p['planNameUr'] ?? p['planName']).toString() : p['planName'].toString(),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 13,
                                    ),
                                  ),
                                  Text(
                                    '\$${Number.tryParse('${p['priceAmount'] ?? 0}')?.toStringAsFixed(2) ?? '0.00'} ${p['currency'] ?? 'USD'}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 15,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _cardColor,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: Colors.purpleAccent.withOpacity(0.28)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          for (final b in benefits.take(6))
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              child: Row(
                                children: [
                                  const Icon(Icons.star_rounded, color: _goldAccent, size: 22),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      _isUrdu ? (b['titleUr'] ?? b['title']).toString() : b['title'].toString(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    for (final prov in _providers)
                      Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: _cardColor,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: _selectedProviderKey == prov['providerKey']
                                ? _neonPink
                                : Colors.white12,
                          ),
                        ),
                        child: ListTile(
                          dense: true,
                          onTap: () => setState(
                            () => _selectedProviderKey = prov['providerKey'].toString(),
                          ),
                          title: Text(
                            prov['displayName'].toString(),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                          trailing: Text(
                            prov['isReadyForPayment'] == true ? 'READY' : 'PENDING KEY',
                            style: TextStyle(
                              color: prov['isReadyForPayment'] == true
                                  ? const Color(0xFF34D399)
                                  : _goldAccent,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                    CheckboxListTile(
                      value: _autoRenewConsent,
                      onChanged: (v) => setState(() => _autoRenewConsent = v ?? false),
                      activeColor: _neonPink,
                      title: Text(
                        _isUrdu ? 'تجدید کی اختیاری رضامندی' : 'Optional auto-renewal consent',
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _busy ? null : () => _startPurchase('purchase'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _goldAccent,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                      ),
                      child: Text(
                        _busy
                            ? 'Processing...'
                            : _isUrdu
                            ? 'وی آئی پی اپ گریڈ کریں'
                            : 'Upgrade VIP',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                      ),
                    ),
                    if (_vipProfile?['membershipId'] != null) ...[
                      const SizedBox(height: 10),
                      OutlinedButton(
                        onPressed: _busy ? null : () => _startPurchase('renewal'),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: _neonPink),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                        child: Text(_isUrdu ? 'VIP تجدید کریں' : 'Renew Membership'),
                      ),
                    ],
                    const SizedBox(height: 18),
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 5),
                        decoration: BoxDecoration(
                          color: _neonPink,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'P7.7  •  VIP',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
