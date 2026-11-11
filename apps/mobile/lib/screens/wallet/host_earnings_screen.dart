import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 7 Module 7.5: Host Gift Share into Points System
/// Design Reference: 07_05_host_share_into_points.png
/// - 70% of eligible gift coins -> Host Points (non-cash)
/// - 30% remaining -> Platform Share
/// - Full English & Urdu RTL support + real-time backend dashboard integration
/// ============================================================================

class HostEarningsScreen extends StatefulWidget {
  final String hostUserId;
  final String apiBaseUrl;
  final String? authToken;
  final bool previewDemo;
  final bool initialUrdu;

  const HostEarningsScreen({
    Key? key,
    this.hostUserId = '00000000-0000-0000-0000-000000088201',
    this.apiBaseUrl = 'https://kigolive.com',
    this.authToken,
    this.previewDemo = true,
    this.initialUrdu = false,
  }) : super(key: key);

  @override
  State<HostEarningsScreen> createState() => _HostEarningsScreenState();
}

class _HostEarningsScreenState extends State<HostEarningsScreen> {
  static const Color _bgDeep = Color(0xFF0D0420);
  static const Color _cardDark = Color(0xFF1A0B3B);
  static const Color _neonPink = Color(0xFFFF2D78);
  static const Color _goldColor = Color(0xFFFFC83D);

  late bool _isUrdu;
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _dashboard;
  List<dynamic> _history = [];
  String _statusFilter = 'all';

  @override
  void initState() {
    super.initState();
    _isUrdu = widget.initialUrdu;
    _fetchAll();
  }

  Map<String, String> _headers() {
    final map = <String, String>{'Accept': 'application/json'};
    if (widget.authToken != null && widget.authToken!.isNotEmpty) {
      map['Authorization'] = 'Bearer ${widget.authToken}';
    }
    return map;
  }

  Future<void> _fetchAll() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final previewSuffix = widget.previewDemo ? '&preview=demo' : '';
      final dashUri = Uri.parse(
        '${widget.apiBaseUrl}/api/earnings/dashboard?hostUserId=${Uri.encodeComponent(widget.hostUserId)}&fresh=true$previewSuffix',
      );
      final histUri = Uri.parse(
        '${widget.apiBaseUrl}/api/earnings/history?hostUserId=${Uri.encodeComponent(widget.hostUserId)}&limit=15&status=$_statusFilter$previewSuffix',
      );

      final responses = await Future.wait([
        http.get(dashUri, headers: _headers()),
        http.get(histUri, headers: _headers()),
      ]);

      final dashJson = json.decode(responses[0].body) as Map<String, dynamic>;
      final histJson = json.decode(responses[1].body) as Map<String, dynamic>;

      if (responses[0].statusCode == 200 && dashJson['success'] == true) {
        setState(() {
          _dashboard = dashJson['dashboard'] as Map<String, dynamic>;
          _history = (histJson['items'] as List<dynamic>?) ?? [];
        });
      } else {
        setState(() {
          _error = (dashJson['error'] ?? 'Failed to load earnings').toString();
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Network error: $e';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = _dashboard;
    final showcase = (d?['latestBreakdown'] as Map<String, dynamic>?) ??
        {
          'giftName': 'Rose',
          'giftQuantity': 10,
          'originalCoinAmount': 100,
          'hostSharePercentage': 70,
          'pointsCredited': 70,
          'platformSharePercentage': 30,
          'platformShareAmount': 30,
        };

    final sharePct = (d?['hostSharePercentage'] ?? 70);
    final platPct = (d?['platformSharePercentage'] ?? 30);

    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgDeep,
        appBar: AppBar(
          backgroundColor: _bgDeep,
          elevation: 0,
          title: Text(
            _isUrdu ? 'ہوسٹ پوائنٹس شیئر' : 'Host Points Share',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.translate_rounded, color: _neonPink),
              onPressed: () => setState(() => _isUrdu = !_isUrdu),
            ),
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Colors.white),
              onPressed: _fetchAll,
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: _neonPink))
            : RefreshIndicator(
                color: _neonPink,
                onRefresh: _fetchAll,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_error != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.redAccent.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.redAccent),
                        ),
                        child: Text(_error!, style: const TextStyle(color: Colors.white)),
                      ),

                    // Hero 1:1 Share Conversion Card
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: _cardDark,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.purpleAccent.withOpacity(0.35)),
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.purpleAccent.withOpacity(0.18),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _isUrdu ? 'تحفہ موصول ہوا' : 'Gift Received',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            '${showcase['giftName']} x${showcase['giftQuantity']}',
                            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.monetization_on_rounded, color: _goldColor, size: 18),
                              const SizedBox(width: 6),
                              Text(
                                '${showcase['originalCoinAmount']} ${_isUrdu ? 'سکے' : 'Coins'}',
                                style: const TextStyle(color: _goldColor, fontWeight: FontWeight.w900, fontSize: 16),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Container(
                            width: 34,
                            height: 34,
                            decoration: const BoxDecoration(color: _neonPink, shape: BoxShape.circle),
                            child: const Icon(Icons.arrow_downward_rounded, color: Colors.white, size: 20),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _isUrdu ? 'ہوسٹ شیئر ($sharePct%)' : 'Host Share ($sharePct%)',
                            style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star_rounded, color: _goldColor, size: 24),
                              const SizedBox(width: 6),
                              Text(
                                '${showcase['pointsCredited']} ${_isUrdu ? 'پوائنٹس' : 'Points'}',
                                style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Breakdown Strip
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF150830),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: Colors.white12),
                      ),
                      child: Column(
                        children: [
                          _kvRow(_isUrdu ? 'کل سکے' : 'Total Coins', '${showcase['originalCoinAmount']}', _goldColor),
                          const SizedBox(height: 6),
                          _kvRow(
                            _isUrdu ? 'ہوسٹ شیئر ($sharePct%)' : 'Host Share ($sharePct%)',
                            '${showcase['pointsCredited']} ${_isUrdu ? 'پوائنٹس' : 'Points'}',
                            Colors.greenAccent,
                          ),
                          const Divider(color: Colors.white12, height: 16),
                          _kvRow(
                            _isUrdu ? 'پلیٹ فارم شیئر ($platPct%)' : 'Platform Share ($platPct%)',
                            '${showcase['platformShareAmount']}',
                            _neonPink,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // KPI Stats Grid
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: 2.0,
                      children: [
                        _kpiTile(_isUrdu ? 'موجودہ پوائنٹس' : 'Current Balance', '${d?['currentPointsBalance'] ?? 0}'),
                        _kpiTile(_isUrdu ? 'آج کی کمائی' : "Today's Points", '${d?['todayEarnedPoints'] ?? 0}'),
                        _kpiTile(_isUrdu ? 'ہفتہ وار کمائی' : 'Weekly Points', '${d?['weeklyEarnedPoints'] ?? 0}'),
                        _kpiTile(_isUrdu ? 'ماہانہ کمائی' : 'Monthly Points', '${d?['monthlyEarnedPoints'] ?? 0}'),
                      ],
                    ),

                    const SizedBox(height: 18),

                    // Filter Chips + History List
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _isUrdu ? 'حالیہ کمائی' : 'Recent Gift Earnings',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
                        ),
                        DropdownButton<String>(
                          value: _statusFilter,
                          dropdownColor: _cardDark,
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                          underline: const SizedBox.shrink(),
                          items: const [
                            DropdownMenuItem(value: 'all', child: Text('All')),
                            DropdownMenuItem(value: 'credited', child: Text('Credited')),
                            DropdownMenuItem(value: 'reversed', child: Text('Reversed')),
                          ],
                          onChanged: (v) {
                            if (v != null) {
                              setState(() => _statusFilter = v);
                              _fetchAll();
                            }
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    if (_history.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(24),
                        alignment: Alignment.center,
                        child: Text(
                          _isUrdu ? 'ابھی تک کوئی تحفہ ریکارڈ نہیں' : 'No gift earnings recorded yet.',
                          style: const TextStyle(color: Colors.white54),
                        ),
                      )
                    else
                      ..._history.map((item) {
                        final row = item as Map<String, dynamic>;
                        final isRev = row['status'] == 'reversed';
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: _cardDark,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isRev ? Colors.redAccent.withOpacity(0.4) : Colors.white12,
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${row['giftName']} x${row['giftQuantity']} (${row['status']})',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      'From ${row['senderNickname']} • ${row['originalCoinAmount']} coins',
                                      style: const TextStyle(color: Colors.white60, fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '+${row['pointsCredited']} pts',
                                    style: TextStyle(
                                      color: isRev ? Colors.redAccent : _goldColor,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 14,
                                    ),
                                  ),
                                  Text(
                                    'Plat: ${row['platformShareAmount']}',
                                    style: const TextStyle(color: Colors.white54, fontSize: 10),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      }),

                    const SizedBox(height: 16),
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                        decoration: BoxDecoration(
                          color: _neonPink,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'P7.5 • ${_isUrdu ? 'تحائف سے پوائنٹس کا حصہ' : 'Host Share into Points'}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _kvRow(String label, String value, Color valColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 13)),
        Text(value, style: TextStyle(color: valColor, fontWeight: FontWeight.w800, fontSize: 13)),
      ],
    );
  }

  Widget _kpiTile(String title, String val) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _cardDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(title, style: const TextStyle(color: Colors.white60, fontSize: 11)),
          const SizedBox(height: 4),
          Text(val, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
        ],
      ),
    );
  }
}
