import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'coin_history_screen.dart';
import 'points_history_screen.dart';
import 'host_earnings_screen.dart';
import 'topup_screen.dart';
import '../vip/vip_screen.dart';
import '../gifts/gift_catalog_screen.dart';

/// ============================================================================
/// Popo Live — Phase 7 Module 7.1: Coins and Points System
/// Exact 1:1 Design Reference: 07_01_coins_and_points.png
/// Strict separation of Coins (viewer spendable) and Points (host earnings).
/// ============================================================================

class WalletScreen extends StatefulWidget {
  final String userId;
  final String apiBaseUrl;
  final String? authToken;
  final bool previewDemo;
  final VoidCallback? onTopupPressed;
  final VoidCallback? onBack;

  const WalletScreen({
    Key? key,
    this.userId = 'user_wallet_demo_701',
    this.apiBaseUrl = 'https://kigolive.com',
    this.authToken,
    this.previewDemo = true,
    this.onTopupPressed,
    this.onBack,
  }) : super(key: key);

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  static const Color _bgDeep = Color(0xFF0B061D);
  static const Color _bgMid = Color(0xFF160E35);
  static const Color _cardDark = Color(0xFF211746);
  static const Color _cardBorder = Color(0xFF392B6E);
  static const Color _neonPink = Color(0xFFFF2D78);
  static const Color _goldAccent = Color(0xFFFFC83B);
  static const Color _blueAccent = Color(0xFF42B8FF);

  bool _isUrdu = false;
  String _activeTab = 'coins'; // 'coins' or 'points'
  bool _loading = true;
  bool _refreshing = false;
  String? _error;

  int _coinBalance = 12500;
  int _pointsBalance = 8420;
  double _hostGiftSharePercent = 70.0;
  bool _isFrozen = false;
  List<Map<String, dynamic>> _recentCoinTxns = [];
  List<Map<String, dynamic>> _recentPointsTxns = [];

  @override
  void initState() {
    super.initState();
    _fetchWalletState();
  }

  Map<String, String> _buildHeaders() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (widget.authToken != null && widget.authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer ${widget.authToken}';
    }
    return headers;
  }

  String _previewSuffix() {
    return widget.previewDemo ? '&preview=demo' : '';
  }

  Future<void> _fetchWalletState({bool forceFresh = false}) async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final freshParam = forceFresh ? '&fresh=true' : '';
      final balanceUri = Uri.parse(
        '${widget.apiBaseUrl}/api/wallet/balance?userId=${Uri.encodeComponent(widget.userId)}$freshParam${_previewSuffix()}',
      );
      final coinHistUri = Uri.parse(
        '${widget.apiBaseUrl}/api/wallet/coins/history?userId=${Uri.encodeComponent(widget.userId)}&page=1&limit=5${_previewSuffix()}',
      );
      final pointsHistUri = Uri.parse(
        '${widget.apiBaseUrl}/api/wallet/points/history?userId=${Uri.encodeComponent(widget.userId)}&page=1&limit=5${_previewSuffix()}',
      );

      final responses = await Future.wait([
        http.get(balanceUri, headers: _buildHeaders()).timeout(const Duration(seconds: 12)),
        http.get(coinHistUri, headers: _buildHeaders()).timeout(const Duration(seconds: 12)),
        http.get(pointsHistUri, headers: _buildHeaders()).timeout(const Duration(seconds: 12)),
      ]);

      final balanceData = jsonDecode(responses[0].body) as Map<String, dynamic>;
      if (responses[0].statusCode != 200 || balanceData['success'] != true) {
        throw Exception(balanceData['error'] ?? 'Failed to load wallet balance');
      }

      final wallet = balanceData['wallet'] as Map<String, dynamic>;
      final coinHistData = jsonDecode(responses[1].body) as Map<String, dynamic>;
      final pointsHistData = jsonDecode(responses[2].body) as Map<String, dynamic>;

      if (!mounted) return;
      setState(() {
        _coinBalance = (wallet['coins'] as num?)?.toInt() ?? 0;
        _pointsBalance =
            (wallet['points'] as num?)?.toInt() ??
            (wallet['earningsPoints'] as num?)?.toInt() ??
            0;
        _isFrozen = wallet['isFrozen'] == true;
        _hostGiftSharePercent =
            (wallet['hostSharePercentage'] as num?)?.toDouble() ?? 70.0;
        _recentCoinTxns = ((coinHistData['transactions'] as List?) ?? [])
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        _recentPointsTxns = ((pointsHistData['transactions'] as List?) ?? [])
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _handleRefresh() async {
    if (_refreshing) return;
    setState(() => _refreshing = true);
    try {
      final uri = Uri.parse(
        '${widget.apiBaseUrl}/api/wallet/refresh${widget.previewDemo ? '?preview=demo' : ''}',
      );
      final res = await http
          .post(
            uri,
            headers: _buildHeaders(),
            body: jsonEncode({'userId': widget.userId}),
          )
          .timeout(const Duration(seconds: 12));
      if (res.statusCode == 200) {
        await _fetchWalletState(forceFresh: true);
      }
    } finally {
      if (mounted) {
        setState(() => _refreshing = false);
      }
    }
  }

  String _formatNumber(int value) {
    final neg = value < 0;
    final str = value.abs().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      final posFromRight = str.length - i;
      buffer.write(str[i]);
      if (posFromRight > 1 && posFromRight % 3 == 1) {
        buffer.write(',');
      }
    }
    return neg ? '-${buffer.toString()}' : buffer.toString();
  }

  void _openCoinHistory() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CoinHistoryScreen(
          userId: widget.userId,
          apiBaseUrl: widget.apiBaseUrl,
          authToken: widget.authToken,
          previewDemo: widget.previewDemo,
          initialUrdu: _isUrdu,
        ),
      ),
    );
  }

  void _openPointsHistory() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PointsHistoryScreen(
          userId: widget.userId,
          apiBaseUrl: widget.apiBaseUrl,
          authToken: widget.authToken,
          previewDemo: widget.previewDemo,
          initialUrdu: _isUrdu,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeList = _activeTab == 'coins' ? _recentCoinTxns : _recentPointsTxns;

    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgDeep,
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [_bgDeep, _bgMid, Color(0xFF0E0824)],
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                _buildTopBar(),
                Expanded(
                  child: RefreshIndicator(
                    color: _neonPink,
                    backgroundColor: _cardDark,
                    onRefresh: _handleRefresh,
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                      children: [
                        Text(
                          _isUrdu ? 'والٹ' : 'Wallet',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 14),
                        _buildCurrencyToggle(),
                        const SizedBox(height: 16),
                        if (_error != null) _buildErrorBanner(),
                        if (_isFrozen) _buildFrozenBanner(),
                        _buildMainBalanceCard(),
                        const SizedBox(height: 14),
                        _buildHistoryNavigationCard(),
                        const SizedBox(height: 14),
                        _buildRuleNoticeCard(),
                        const SizedBox(height: 16),
                        _buildRecentSection(activeList),
                        const SizedBox(height: 22),
                        _buildWatermarkFooter(),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          if (widget.onBack != null || Navigator.of(context).canPop())
            GestureDetector(
              onTap: widget.onBack ?? () => Navigator.of(context).maybePop(),
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.06),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_ios_new, color: Colors.white70, size: 16),
              ),
            )
          else
            const SizedBox(width: 38),
          const Spacer(),
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: [_neonPink, Color(0xFF9E44FF)]),
                ),
                child: const Center(
                  child: Text(
                    'P',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Popo Live',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 17),
              ),
            ],
          ),
          const Spacer(),
          Row(
            children: [
              GestureDetector(
                onTap: () => setState(() => _isUrdu = !_isUrdu),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.07),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.12)),
                  ),
                  child: Text(
                    _isUrdu ? 'EN' : 'اردو',
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              GestureDetector(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => GiftCatalogScreen(
                        userId: widget.userId,
                        apiBaseUrl: widget.apiBaseUrl,
                        authToken: widget.authToken,
                        previewDemo: widget.previewDemo,
                      ),
                    ),
                  );
                },
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.07),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.card_giftcard_rounded, color: _neonPink, size: 18),
                ),
              ),
              const SizedBox(width: 6),
              GestureDetector(
                onTap: _handleRefresh,
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.07),
                    shape: BoxShape.circle,
                  ),
                  child: _refreshing
                      ? const Padding(
                          padding: EdgeInsets.all(9),
                          child: CircularProgressIndicator(strokeWidth: 2, color: _neonPink),
                        )
                      : const Icon(Icons.refresh_rounded, color: Colors.white70, size: 18),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCurrencyToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFF281D4D),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _cardBorder),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _activeTab = 'coins'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  gradient: _activeTab == 'coins'
                      ? const LinearGradient(colors: [Color(0xFF39276A), Color(0xFF532872)])
                      : null,
                  borderRadius: BorderRadius.circular(14),
                  border: _activeTab == 'coins' ? Border.all(color: _neonPink, width: 1.4) : null,
                ),
                child: Center(
                  child: Text(
                    _isUrdu ? 'کوائنز' : 'Coins',
                    style: TextStyle(
                      color: _activeTab == 'coins' ? Colors.white : Colors.white54,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _activeTab = 'points'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  gradient: _activeTab == 'points'
                      ? const LinearGradient(colors: [Color(0xFF252E69), Color(0xFF2D4B8C)])
                      : null,
                  borderRadius: BorderRadius.circular(14),
                  border: _activeTab == 'points' ? Border.all(color: _blueAccent, width: 1.4) : null,
                ),
                child: Center(
                  child: Text(
                    _isUrdu ? 'پوائنٹس' : 'Points',
                    style: TextStyle(
                      color: _activeTab == 'points' ? Colors.white : Colors.white54,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainBalanceCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF2D215B), Color(0xFF1D143D)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.12)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.35), blurRadius: 18, offset: const Offset(0, 8)),
        ],
      ),
      child: _loading
          ? const SizedBox(
              height: 150,
              child: Center(child: CircularProgressIndicator(color: _neonPink)),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isUrdu ? 'دستیاب کوائنز' : 'Available Coins (Spendable)',
                            style: const TextStyle(color: Colors.white60, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: LinearGradient(colors: [Color(0xFFFFD84D), Color(0xFFFF8C00)]),
                                ),
                                child: const Center(
                                  child: Text('¢', style: TextStyle(color: Color(0xFF3E2200), fontWeight: FontWeight.w900, fontSize: 18)),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                _formatNumber(_coinBalance),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 34,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.8,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        if (widget.onTopupPressed != null) {
                          widget.onTopupPressed!();
                        } else {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => TopupScreen(
                                apiBaseUrl: widget.apiBaseUrl,
                                userId: widget.userId,
                                headers: widget.authToken != null
                                    ? {'Authorization': 'Bearer ${widget.authToken}'}
                                    : null,
                                previewDemo: widget.previewDemo,
                              ),
                            ),
                          );
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [_neonPink, Color(0xFFD91E63)]),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(color: _neonPink.withOpacity(0.45), blurRadius: 14, offset: const Offset(0, 4)),
                          ],
                        ),
                        child: Text(
                          _isUrdu ? 'ٹاپ اپ' : 'Top-up',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                        ),
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Divider(color: Colors.white.withOpacity(0.1), height: 1),
                ),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isUrdu ? 'ہوسٹ کمائی کے پوائنٹس' : 'Earnings Points',
                            style: const TextStyle(color: Colors.white60, fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: _blueAccent.withOpacity(0.16),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: _blueAccent.withOpacity(0.45)),
                                ),
                                child: const Icon(Icons.star_rounded, color: _blueAccent, size: 20),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                _formatNumber(_pointsBalance),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 30,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: _blueAccent.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _blueAccent.withOpacity(0.35)),
                      ),
                      child: Text(
                        _isUrdu
                            ? 'گفٹ کا ${_hostGiftSharePercent.toStringAsFixed(0)}%'
                            : '${_hostGiftSharePercent.toStringAsFixed(0)}% Gift Share',
                        style: const TextStyle(color: _blueAccent, fontSize: 11, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ],
            ),
    );
  }

  Widget _buildHistoryNavigationCard() {
    return Container(
      decoration: BoxDecoration(
        color: _cardDark,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(
        children: [
          ListTile(
            onTap: _openCoinHistory,
            leading: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(color: _goldAccent.withOpacity(0.14), shape: BoxShape.circle),
              child: const Icon(Icons.monetization_on_rounded, color: _goldAccent, size: 19),
            ),
            title: Text(
              _isUrdu ? 'کوائنز کی تاریخ' : 'Coin History',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
            ),
            subtitle: Text(
              _isUrdu ? 'ٹاپ اپ، گفٹ کٹوتی اور ریورس' : 'Top-ups, gift deductions & reversals',
              style: const TextStyle(color: Colors.white54, fontSize: 11),
            ),
            trailing: const Icon(Icons.chevron_right_rounded, color: Colors.white54),
          ),
          Divider(color: Colors.white.withOpacity(0.08), height: 1, indent: 16, endIndent: 16),
          ListTile(
            onTap: _openPointsHistory,
            leading: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(color: _blueAccent.withOpacity(0.14), shape: BoxShape.circle),
              child: const Icon(Icons.star_rounded, color: _blueAccent, size: 20),
            ),
            title: Text(
              _isUrdu ? 'پوائنٹس کی تاریخ' : 'Points History',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
            ),
            subtitle: Text(
              _isUrdu ? 'ہوسٹ کی 70% گفٹ کمائی' : 'Host 70% gift earnings & reversals',
              style: const TextStyle(color: Colors.white54, fontSize: 11),
            ),
            trailing: const Icon(Icons.chevron_right_rounded, color: Colors.white54),
          ),
          Divider(color: Colors.white.withOpacity(0.08), height: 1, indent: 16, endIndent: 16),
          ListTile(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => HostEarningsScreen(
                    hostUserId: widget.userId,
                    apiBaseUrl: widget.apiBaseUrl,
                    authToken: widget.authToken,
                    previewDemo: widget.previewDemo,
                    initialUrdu: _isUrdu,
                  ),
                ),
              );
            },
            leading: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(color: _neonPink.withOpacity(0.16), shape: BoxShape.circle),
              child: const Icon(Icons.pie_chart_rounded, color: _neonPink, size: 20),
            ),
            title: Text(
              _isUrdu ? 'ہوسٹ کمائی ڈیش بورڈ' : 'Host Earnings (70% Share)',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
            ),
            subtitle: Text(
              _isUrdu ? 'یومیہ/ہفتہ وار/ماہانہ پوائنٹس اور 30% پلیٹ فارم شیئر' : 'Daily/weekly/monthly stats & 70/30 split',
              style: const TextStyle(color: Colors.white54, fontSize: 11),
            ),
            trailing: const Icon(Icons.chevron_right_rounded, color: Colors.white54),
          ),
          Divider(color: Colors.white.withOpacity(0.08), height: 1, indent: 16, endIndent: 16),
          ListTile(
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => VipMembershipScreen(
                    apiBaseUrl: widget.apiBaseUrl,
                    userId: widget.userId,
                    headers: widget.authToken != null ? {'Authorization': 'Bearer ${widget.authToken}'} : null,
                    previewDemo: widget.previewDemo,
                    initialUrdu: _isUrdu,
                  ),
                ),
              );
            },
            leading: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(color: _goldAccent.withOpacity(0.16), shape: BoxShape.circle),
              child: const Icon(Icons.workspace_premium_rounded, color: _goldAccent, size: 20),
            ),
            title: Text(
              _isUrdu ? 'وی آئی پی رکنیت (7.7)' : 'VIP Membership & Benefits',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
            ),
            subtitle: Text(
              _isUrdu ? 'وی آئی پی بیج، فریم اور شاہی آمد' : 'VIP Crown Badge, Frame & Entrances',
              style: const TextStyle(color: Colors.white54, fontSize: 11),
            ),
            trailing: const Icon(Icons.chevron_right_rounded, color: Colors.white54),
          ),
        ],
      ),
    );
  }

  Widget _buildRuleNoticeCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.04),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        children: [
          const Icon(Icons.verified_user_rounded, color: _goldAccent, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              _isUrdu
                  ? 'کوائنز اور پوائنٹس الگ الگ کرنسیاں ہیں۔ گفٹ بھیجنے پر ${_hostGiftSharePercent.toStringAsFixed(0)}% کوائنز ہوسٹ کے پوائنٹس بنتے ہیں۔'
                  : 'Coins & Points are separate balances. ${_hostGiftSharePercent.toStringAsFixed(0)}% of gift coins convert to Host Earnings Points.',
              style: const TextStyle(color: Colors.white70, fontSize: 11.5, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentSection(List<Map<String, dynamic>> txns) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              _activeTab == 'coins'
                  ? (_isUrdu ? 'حالیہ کوائن لین دین' : 'Recent Coin Transactions')
                  : (_isUrdu ? 'حالیہ پوائنٹس کمائی' : 'Recent Points Earnings'),
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
            ),
            GestureDetector(
              onTap: _activeTab == 'coins' ? _openCoinHistory : _openPointsHistory,
              child: Text(
                _isUrdu ? 'سب دیکھیں' : 'View All',
                style: const TextStyle(color: _neonPink, fontWeight: FontWeight.w700, fontSize: 12.5),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (txns.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: _cardDark.withOpacity(0.7),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.06)),
            ),
            child: Center(
              child: Text(
                _isUrdu ? 'ابھی تک کوئی لین دین موجود نہیں' : 'No transactions yet',
                style: const TextStyle(color: Colors.white54, fontSize: 13),
              ),
            ),
          )
        else
          ...txns.map((tx) {
            final isCoins = _activeTab == 'coins';
            final direction = (tx['direction'] ?? 'credit').toString();
            final absAmount = isCoins
                ? ((tx['coinAmount'] as num?)?.toInt() ?? 0)
                : ((tx['pointsAmount'] as num?)?.toInt() ?? 0);
            final signedAmount = direction == 'debit' ? -absAmount : absAmount;
            final status = (tx['status'] ?? 'completed').toString();
            final txType = (tx['transactionType'] ?? tx['giftSource'] ?? '').toString();
            final title = (tx['description'] ?? txType).toString();
            final sign = signedAmount >= 0 ? '+' : '';
            final Color amountColor = status == 'failed'
                ? Colors.redAccent
                : status == 'reversed'
                    ? Colors.amber
                    : (signedAmount >= 0 ? const Color(0xFF4ADE80) : Colors.pinkAccent);

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: _cardDark,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.06)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13.5),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: status == 'failed'
                                    ? Colors.red.withOpacity(0.2)
                                    : status == 'reversed'
                                        ? Colors.amber.withOpacity(0.2)
                                        : Colors.green.withOpacity(0.18),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                status.toUpperCase(),
                                style: TextStyle(
                                  color: status == 'failed'
                                      ? Colors.redAccent
                                      : status == 'reversed'
                                          ? Colors.amber
                                          : const Color(0xFF4ADE80),
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              txType.toUpperCase(),
                              style: const TextStyle(color: Colors.white38, fontSize: 10),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Text(
                    '$sign${_formatNumber(signedAmount)} ${isCoins ? 'Coins' : 'Pts'}',
                    style: TextStyle(color: amountColor, fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _buildErrorBanner() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.15),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.redAccent.withOpacity(0.45)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(_error!, style: const TextStyle(color: Colors.white, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildFrozenBanner() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(0.16),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.amberAccent.withOpacity(0.45)),
      ),
      child: Row(
        children: [
          const Icon(Icons.lock_outline, color: Colors.amberAccent, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _isUrdu
                  ? 'یہ والٹ عارضی طور پر منجمد ہے'
                  : 'This wallet is currently frozen by Finance Admin',
              style: const TextStyle(color: Colors.amberAccent, fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWatermarkFooter() {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF281D4D),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.15)),
            ),
            child: const Text(
              'P7.1',
              style: TextStyle(color: _goldAccent, fontWeight: FontWeight.w900, fontSize: 12),
            ),
          ),
          const SizedBox(width: 8),
          const Text(
            'Coins and Points',
            style: TextStyle(color: Colors.white54, fontWeight: FontWeight.w600, fontSize: 13),
          ),
        ],
      ),
    );
  }
}
