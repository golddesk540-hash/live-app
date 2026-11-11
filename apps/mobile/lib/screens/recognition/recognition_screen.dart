import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 7 Module 7.8: Wealth, Shining and Honor System Screen
/// Matches Design Reference 07_08_wealth_shining_and_honor.png on Android & iOS.
/// Uses strictly separate backend calculations & leaderboards for Wealth,
/// Shining, and Honor. VIP membership remains independent.
/// ============================================================================
class RecognitionScreen extends StatefulWidget {
  final String apiBaseUrl;
  final String userId;
  final Map<String, String>? headers;
  final bool previewDemo;
  final bool initialUrdu;
  final String initialCategory;

  const RecognitionScreen({
    super.key,
    required this.apiBaseUrl,
    this.userId = 'user_wallet_demo_701',
    this.headers,
    this.previewDemo = false,
    this.initialUrdu = false,
    this.initialCategory = 'wealth',
  });

  @override
  State<RecognitionScreen> createState() => _RecognitionScreenState();
}

class _RecognitionScreenState extends State<RecognitionScreen> {
  static const _bgTop = Color(0xFF0E0526);
  static const _bgBottom = Color(0xFF0A031B);
  static const _cardColor = Color(0xFF17093B);
  static const _neonPink = Color(0xFFFF2E74);
  static const _goldAccent = Color(0xFFFBBF24);

  late String _category =
      (['wealth', 'shining', 'honor'].contains(widget.initialCategory))
          ? widget.initialCategory
          : 'wealth';
  late bool _isUrdu = widget.initialUrdu;
  String _subTab = 'overview'; // overview | leaderboard | history

  bool _loading = true;
  bool _submittingHonor = false;
  Map<String, dynamic>? _summary;
  List<Map<String, dynamic>> _leaderboard = [];
  List<Map<String, dynamic>> _levelHistory = [];
  List<Map<String, dynamic>> _honorFactors = [];
  final TextEditingController _evidenceCtrl = TextEditingController();
  String _selectedFactor = 'account_achievements';
  String? _statusBanner;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  @override
  void dispose() {
    _evidenceCtrl.dispose();
    super.dispose();
  }

  Map<String, String> get _reqHeaders => {
        'Content-Type': 'application/json',
        if (widget.headers != null) ...widget.headers!,
      };

  String get _demoQ => widget.previewDemo ? '?preview=demo' : '';

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    try {
      final base = widget.apiBaseUrl.replaceAll(RegExp(r'/$'), '');
      final responses = await Future.wait([
        http.get(Uri.parse('$base/api/recognition/status$_demoQ'), headers: _reqHeaders),
        http.get(Uri.parse('$base/api/recognition/catalog'), headers: _reqHeaders),
        http.get(Uri.parse('$base/api/recognition/history$_demoQ'), headers: _reqHeaders),
        http.get(
          Uri.parse('$base/api/recognition/leaderboard?category=$_category&page=1&limit=20'),
          headers: _reqHeaders,
        ),
      ]);

      if (!mounted) return;
      final stData = jsonDecode(responses[0].body);
      final catData = jsonDecode(responses[1].body);
      final hisData = jsonDecode(responses[2].body);
      final lbData = jsonDecode(responses[3].body);

      setState(() {
        _summary = stData['summary'] as Map<String, dynamic>?;
        _honorFactors = List<Map<String, dynamic>>.from(catData['honorFactors'] ?? const []);
        _levelHistory = List<Map<String, dynamic>>.from(hisData['levelHistory'] ?? const []);
        _leaderboard = List<Map<String, dynamic>>.from(lbData['entries'] ?? const []);
      });
    } catch (_) {
      if (mounted) {
        setState(() => _statusBanner = _isUrdu ? 'ڈیٹا لوڈ کرنے میں خرابی' : 'Unable to sync recognition data.');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _switchCategory(String cat) async {
    setState(() {
      _category = cat;
      _loading = true;
    });
    try {
      final base = widget.apiBaseUrl.replaceAll(RegExp(r'/$'), '');
      final res = await http.get(
        Uri.parse('$base/api/recognition/leaderboard?category=$cat&page=1&limit=20'),
        headers: _reqHeaders,
      );
      if (!mounted) return;
      final lbData = jsonDecode(res.body);
      setState(() {
        _leaderboard = List<Map<String, dynamic>>.from(lbData['entries'] ?? const []);
      });
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitHonorRequest() async {
    final text = _evidenceCtrl.text.trim();
    if (text.length < 8) {
      setState(() => _statusBanner = _isUrdu ? 'کم از کم 8 حروف کی تفصیل درج کریں۔' : 'Enter at least 8 characters.');
      return;
    }
    setState(() => _submittingHonor = true);
    try {
      final base = widget.apiBaseUrl.replaceAll(RegExp(r'/$'), '');
      final res = await http.post(
        Uri.parse('$base/api/recognition/honor/request'),
        headers: _reqHeaders,
        body: jsonEncode({
          'factorKey': _selectedFactor,
          'evidenceSummary': text,
        }),
      );
      final json = jsonDecode(res.body);
      if (res.statusCode >= 200 && res.statusCode < 300 && json['success'] == true) {
        _evidenceCtrl.clear();
        setState(() {
          _statusBanner = _isUrdu
              ? 'اعزاز کی درخواست ایڈمن کی تصدیق کے لیے بھیج دی گئی۔'
              : 'Honor request submitted for admin review.';
        });
        await _loadAll();
      } else {
        setState(() => _statusBanner = (json['error'] ?? 'Request failed').toString());
      }
    } finally {
      if (mounted) setState(() => _submittingHonor = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final catMap = (_summary?[_category] as Map<String, dynamic>?) ?? {};
    final levelNum = (catMap['currentLevelNumber'] as num?)?.toInt() ?? 1;
    final levelName = _isUrdu
        ? (catMap['currentLevelNameUr'] ?? catMap['currentLevelName'] ?? 'Level 1').toString()
        : (catMap['currentLevelName'] ?? 'Level 1').toString();
    final score = (catMap['currentScore'] as num?)?.toInt() ?? 0;
    final pct = ((catMap['progressPercent'] as num?)?.toDouble() ?? 0.0).clamp(0.0, 100.0);
    final nextNum = catMap['nextLevelNumber'];
    final nextThresh = catMap['nextThreshold'];
    final tiers = List<Map<String, dynamic>>.from(catMap['allTiers'] ?? const []);
    final benefits = List<Map<String, dynamic>>.from(catMap['approvedBenefits'] ?? const []);

    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgBottom,
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [_bgTop, Color(0xFF17093B), _bgBottom],
            ),
          ),
          child: SafeArea(
            child: Column(
              children: [
                _buildTopBar(),
                if (_statusBanner != null)
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: _neonPink.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _neonPink.withOpacity(0.45)),
                    ),
                    child: Text(
                      _statusBanner!,
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                _buildCategoryTabs(),
                Expanded(
                  child: _loading && _summary == null
                      ? const Center(child: CircularProgressIndicator(color: _neonPink))
                      : RefreshIndicator(
                          onRefresh: _loadAll,
                          color: _neonPink,
                          child: ListView(
                            padding: const EdgeInsets.all(16),
                            children: [
                              _buildShowcaseCard(levelNum),
                              const SizedBox(height: 12),
                              _buildProgressCard(levelNum, levelName, score, pct, nextNum, nextThresh),
                              const SizedBox(height: 12),
                              _buildSubTabs(),
                              const SizedBox(height: 12),
                              if (_subTab == 'overview') ...[
                                _buildBenefitsCard(benefits),
                                if (_category == 'honor' && !widget.previewDemo) ...[
                                  const SizedBox(height: 12),
                                  _buildHonorRequestCard(),
                                ],
                                const SizedBox(height: 12),
                                _buildTiersCard(tiers, score),
                              ] else if (_subTab == 'leaderboard')
                                _buildLeaderboardCard()
                              else
                                _buildHistoryCard(),
                              const SizedBox(height: 20),
                              _buildFooterWatermark(),
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
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
              ),
              const Text(
                'Popo Live',
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
              ),
            ],
          ),
          Row(
            children: [
              GestureDetector(
                onTap: () => setState(() => _isUrdu = !_isUrdu),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _isUrdu ? 'EN' : 'اردو',
                    style: const TextStyle(color: _goldAccent, fontWeight: FontWeight.w800, fontSize: 11),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              IconButton(
                onPressed: _loadAll,
                icon: const Icon(Icons.refresh_rounded, color: Colors.white70, size: 20),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs() {
    final items = [
      {'id': 'wealth', 'en': 'Wealth', 'ur': 'دولت'},
      {'id': 'shining', 'en': 'Shining', 'ur': 'شائننگ'},
      {'id': 'honor', 'en': 'Honor', 'ur': 'اعزاز'},
    ];
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1042),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.purpleAccent.withOpacity(0.28)),
      ),
      child: Row(
        children: items.map((it) {
          final active = _category == it['id'];
          return Expanded(
            child: GestureDetector(
              onTap: () => _switchCategory(it['id']!),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  gradient: active
                      ? const LinearGradient(colors: [_neonPink, Color(0xFFEC4899)])
                      : null,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Center(
                  child: Text(
                    _isUrdu ? it['ur']! : it['en']!,
                    style: TextStyle(
                      color: active ? Colors.white : Colors.white70,
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildShowcaseCard(int userLevel) {
    final showcase = [
      {'lv': 80, 'color': _goldAccent, 'title': 'Lv.80'},
      {'lv': 70, 'color': const Color(0xFF60A5FA), 'title': 'Lv.70'},
      {'lv': 60, 'color': const Color(0xFFFB7185), 'title': 'Lv.60'},
    ];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
      decoration: BoxDecoration(
        color: _cardColor.withOpacity(0.95),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.purpleAccent.withOpacity(0.25)),
      ),
      child: Column(
        children: showcase.map((s) {
          final c = s['color'] as Color;
          final unlocked = userLevel >= (s['lv'] as int);
          return Container(
            margin: const EdgeInsets.symmetric(vertical: 6),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.25),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: c.withOpacity(unlocked ? 0.85 : 0.35)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.auto_awesome_rounded, color: c, size: 22),
                const SizedBox(width: 10),
                CircleAvatar(
                  radius: 20,
                  backgroundColor: c.withOpacity(0.22),
                  child: Icon(Icons.shield_moon_rounded, color: c),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: c.withOpacity(0.22),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: c),
                  ),
                  child: Text(
                    s['title'] as String,
                    style: TextStyle(color: c, fontWeight: FontWeight.w900, fontSize: 12),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildProgressCard(int levelNum, String levelName, int score, double pct, dynamic nextNum, dynamic nextThresh) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _neonPink.withOpacity(0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isUrdu ? 'تصدیق شدہ درجہ' : 'Verified Backend Status',
                      style: const TextStyle(color: Colors.pinkAccent, fontSize: 10, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Lv.$levelNum • $levelName',
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: _goldAccent.withOpacity(0.16),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$score pts',
                  style: const TextStyle(color: _goldAccent, fontWeight: FontWeight.w900, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: pct / 100.0,
              minHeight: 10,
              backgroundColor: const Color(0xFF0C041E),
              valueColor: const AlwaysStoppedAnimation<Color>(_neonPink),
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${pct.toStringAsFixed(1)}%', style: const TextStyle(color: Colors.pinkAccent, fontSize: 11, fontWeight: FontWeight.w800)),
              Text(
                nextNum != null
                    ? (_isUrdu ? 'اگلا: Lv.$nextNum ($nextThresh)' : 'Next: Lv.$nextNum ($nextThresh)')
                    : (_isUrdu ? 'اعلیٰ ترین درجہ' : 'Max Tier Reached'),
                style: const TextStyle(color: Colors.white54, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSubTabs() {
    final tabs = [
      {'id': 'overview', 'en': 'Progress & Benefits', 'ur': 'مراعات'},
      {'id': 'leaderboard', 'en': 'Rankings', 'ur': 'لیڈر بورڈ'},
      {'id': 'history', 'en': 'History', 'ur': 'ریکارڈ'},
    ];
    return Row(
      children: tabs.map((t) {
        final active = _subTab == t['id'];
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _subTab = t['id']!),
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 3),
              padding: const EdgeInsets.symmetric(vertical: 9),
              decoration: BoxDecoration(
                color: active ? const Color(0xFF2C155E) : const Color(0xFF12072D),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: active ? _neonPink.withOpacity(0.5) : Colors.white10),
              ),
              child: Center(
                child: Text(
                  _isUrdu ? t['ur']! : t['en']!,
                  style: TextStyle(color: active ? Colors.white : Colors.white60, fontWeight: FontWeight.w800, fontSize: 11.5),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildBenefitsCard(List<Map<String, dynamic>> benefits) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _isUrdu ? 'منظور شدہ غیر مالی مراعات' : 'Approved Visual & Platform Benefits',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
          ),
          const SizedBox(height: 8),
          ...benefits.map((b) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, color: Color(0xFF34D399), size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _isUrdu ? (b['titleUr'] ?? b['title'] ?? '').toString() : (b['title'] ?? '').toString(),
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildHonorRequestCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF34D399).withOpacity(0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _isUrdu ? 'اعزازی درخواست جمع کروائیں' : 'Submit Honor Verification Request',
            style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.w800, fontSize: 13),
          ),
          const SizedBox(height: 8),
          if (_honorFactors.isNotEmpty)
            DropdownButtonFormField<String>(
              value: _selectedFactor,
              dropdownColor: _cardColor,
              style: const TextStyle(color: Colors.white, fontSize: 12),
              items: _honorFactors
                  .map((f) => DropdownMenuItem<String>(
                        value: f['factorKey'].toString(),
                        child: Text((_isUrdu ? f['titleUr'] : f['title']).toString()),
                      ))
                  .toList(),
              onChanged: (v) {
                if (v != null) setState(() => _selectedFactor = v);
              },
            ),
          const SizedBox(height: 8),
          TextField(
            controller: _evidenceCtrl,
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(
              hintText: _isUrdu ? 'تصدیق شدہ تفصیل لکھیں...' : 'Verified achievement details...',
              hintStyle: const TextStyle(color: Colors.white38),
              filled: true,
              fillColor: const Color(0xFF0D0422),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _submittingHonor ? null : _submitHonorRequest,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
              child: Text(_submittingHonor ? 'Submitting...' : (_isUrdu ? 'ایڈمن کے لیے بھیجیں' : 'Submit for Admin Review')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTiersCard(List<Map<String, dynamic>> tiers, int score) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _isUrdu ? 'درجات کی ترتیب' : 'Configured Level Tiers',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
          ),
          const SizedBox(height: 8),
          ...tiers.map((t) {
            final thresh = (t['requiredThreshold'] as num?)?.toInt() ?? 0;
            final unlocked = score >= thresh;
            return ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                radius: 15,
                backgroundColor: unlocked ? _neonPink : Colors.white12,
                child: Text('${t['levelNumber']}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900)),
              ),
              title: Text(
                (_isUrdu ? (t['levelNameUr'] ?? t['levelName']) : t['levelName']).toString(),
                style: const TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w700),
              ),
              trailing: Text('$thresh pts', style: TextStyle(color: unlocked ? const Color(0xFF34D399) : Colors.white54, fontSize: 11)),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildLeaderboardCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: _cardColor, borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: _leaderboard.isEmpty
            ? [Text(_isUrdu ? 'کوئی ریکارڈ نہیں' : 'No ranking entries yet.', style: const TextStyle(color: Colors.white54))]
            : _leaderboard
                .map((r) => ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        radius: 14,
                        backgroundColor: _goldAccent.withOpacity(0.2),
                        child: Text('#${r['rank']}', style: const TextStyle(color: _goldAccent, fontSize: 11, fontWeight: FontWeight.w900)),
                      ),
                      title: Text((r['nickname'] ?? 'User').toString(), style: const TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w700)),
                      subtitle: Text('Lv.${r['levelNumber']} • ${r['levelName']}', style: const TextStyle(color: Colors.white54, fontSize: 11)),
                      trailing: Text('${r['score']} pts', style: const TextStyle(color: _goldAccent, fontWeight: FontWeight.w800, fontSize: 12)),
                    ))
                .toList(),
      ),
    );
  }

  Widget _buildHistoryCard() {
    final filtered = _levelHistory.where((h) => h['category'] == _category).toList();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: _cardColor, borderRadius: BorderRadius.circular(18)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: filtered.isEmpty
            ? [Text(_isUrdu ? 'کوئی تبدیلی نہیں' : 'No level transitions yet.', style: const TextStyle(color: Colors.white54))]
            : filtered
                .map((h) => ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: Text('Lv.${h['previousLevelNumber']} → Lv.${h['newLevelNumber']} (${h['newLevelName']})',
                          style: const TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w700)),
                      subtitle: Text((h['changeReason'] ?? '').toString(), style: const TextStyle(color: Colors.white54, fontSize: 11)),
                      trailing: Text('${h['scoreAtChange']} pts', style: const TextStyle(color: Colors.pinkAccent, fontSize: 11)),
                    ))
                .toList(),
      ),
    );
  }

  Widget _buildFooterWatermark() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [_neonPink, Color(0xFFD946EF)]),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Text('P7.8', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
        ),
        const SizedBox(height: 6),
        Text(
          _isUrdu ? 'دولت، شائننگ اور اعزاز' : 'Wealth, Shining and Honor',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16),
        ),
      ],
    );
  }
}
