import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 6 Module 6.6: PK Discovery Tab
/// Exact 1:1 Design Reference: 06_06_pk_discovery_tab.png
/// Flutter implementation for Android & iOS
/// ============================================================================

class PKDiscoveryTabScreen extends StatefulWidget {
  final String apiBaseUrl;
  final Function(String battleId)? onWatchBattle;
  final Function(String hostId)? onInviteHost;

  const PKDiscoveryTabScreen({
    Key? key,
    this.apiBaseUrl = 'https://kigolive.com',
    this.onWatchBattle,
    this.onInviteHost,
  }) : super(key: key);

  @override
  State<PKDiscoveryTabScreen> createState() => _PKDiscoveryTabScreenState();
}

class _PKDiscoveryTabScreenState extends State<PKDiscoveryTabScreen> {
  bool _isUrdu = false;
  String _activeTab = 'live'; // 'live', 'available_hosts', 'popular', 'recent', 'featured', 'all'
  String _searchQuery = '';
  bool _isLoading = true;
  bool _isRefreshing = false;

  List<dynamic> _battles = [];
  List<dynamic> _hosts = [];
  Map<String, dynamic> _counts = {
    'all': 8,
    'live': 4,
    'availableHosts': 4,
    'popular': 2,
    'recent': 1,
    'featured': 3,
  };

  String? _invitedHostId;

  // Colors matching 06_06_pk_discovery_tab.png
  static const Color _bgDark = Color(0xFF0B071A);
  static const Color _cardBg = Color(0xFF150E2C);
  static const Color _borderColor = Color(0xFF2D1C4F);
  static const Color _neonPink = Color(0xFFFF2D78);
  static const Color _watermarkPill = Color(0xFF8C1B64);

  @override
  void initState() {
    super.initState();
    _fetchDiscoveryData();
  }

  Future<void> _fetchDiscoveryData({bool isRefresh = false}) async {
    if (isRefresh) {
      setState(() => _isRefreshing = true);
    } else {
      setState(() => _isLoading = true);
    }

    try {
      final uri = Uri.parse('${widget.apiBaseUrl}/api/pk/discovery').replace(queryParameters: {
        'tab': _activeTab,
        if (_searchQuery.trim().isNotEmpty) 'search': _searchQuery.trim(),
      });

      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && mounted) {
          setState(() {
            _battles = data['battles'] ?? [];
            _hosts = data['hosts'] ?? [];
            if (data['counts'] != null) {
              _counts = Map<String, dynamic>.from(data['counts']);
            }
          });
        }
      }
    } catch (e) {
      // Handle network / fallback
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isRefreshing = false;
        });
      }
    }
  }

  Future<void> _handleInvite(String hostId) async {
    setState(() => _invitedHostId = hostId);
    try {
      final res = await http.post(
        Uri.parse('${widget.apiBaseUrl}/api/pk/invitation/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'receiverHostId': hostId, 'battleType': '1v1'}),
      );
      if (res.statusCode == 200 && mounted) {
        Timer(const Duration(seconds: 3), () {
          if (mounted) setState(() => _invitedHostId = null);
        });
      }
    } catch (_) {
      if (mounted) setState(() => _invitedHostId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgDark,
        body: SafeArea(
          child: Column(
            children: [
              _buildTopNavBar(),
              _buildHeadingAndSearch(),
              _buildCategoryChips(),
              Expanded(
                child: _isLoading
                    ? const Center(
                        child: CircularProgressIndicator(color: _neonPink),
                      )
                    : RefreshIndicator(
                        color: _neonPink,
                        backgroundColor: _cardBg,
                        onRefresh: () => _fetchDiscoveryData(isRefresh: true),
                        child: _activeTab == 'available_hosts'
                            ? _buildAvailableHostsList()
                            : _buildBattlesList(),
                      ),
              ),
              _buildBottomWatermark(),
            ],
          ),
        ),
      ),
    );
  }

  // TOP NAVIGATION BAR (Live | Party | PK | Square)
  Widget _buildTopNavBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: const Color(0xFF100A26),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Text(
                _isUrdu ? 'لائیو' : 'Live',
                style: const TextStyle(color: Colors.white54, fontSize: 15, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 18),
              Text(
                _isUrdu ? 'پارٹی' : 'Party',
                style: const TextStyle(color: Colors.white54, fontSize: 15, fontWeight: FontWeight.bold),
              ),
              const SizedBox(width: 18),
              // PK Active Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF2D78), Color(0xFFEC4899)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: _neonPink.withOpacity(0.5),
                      blurRadius: 10,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: Text(
                  _isUrdu ? 'پی کے' : 'PK',
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900),
                ),
              ),
              const SizedBox(width: 18),
              Text(
                _isUrdu ? 'اسکوائر' : 'Square',
                style: const TextStyle(color: Colors.white54, fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          // Language Switcher
          GestureDetector(
            onTap: () => setState(() => _isUrdu = !_isUrdu),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.language, size: 13, color: _neonPink),
                  const SizedBox(width: 4),
                  Text(
                    _isUrdu ? 'EN' : 'اردو',
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // HEADING & SEARCH BAR
  Widget _buildHeadingAndSearch() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _isUrdu ? 'پی کے مقابلے' : 'PK Battles',
                style: const TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w900),
              ),
              IconButton(
                icon: const Icon(Icons.refresh, color: Colors.white70, size: 20),
                onPressed: () => _fetchDiscoveryData(isRefresh: true),
              ),
            ],
          ),
          const SizedBox(height: 6),
          // Search Input
          Container(
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFF17102E),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF2B1F4C)),
            ),
            child: TextField(
              onChanged: (val) {
                _searchQuery = val;
                _fetchDiscoveryData();
              },
              style: const TextStyle(color: Colors.white, fontSize: 12),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search, size: 16, color: Colors.white38),
                hintText: _isUrdu ? 'میزبان کا نام، آئی ڈی یا ملک تلاش کریں...' : 'Search nickname, Host ID or country...',
                hintStyle: const TextStyle(color: Colors.white38, fontSize: 11),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // CATEGORY FILTER CHIPS
  Widget _buildCategoryChips() {
    final chips = [
      {'id': 'live', 'en': 'Live PK', 'ur': 'براہ راست', 'count': _counts['live']},
      {'id': 'available_hosts', 'en': 'Available Hosts', 'ur': 'دستیاب میزبان', 'count': _counts['availableHosts']},
      {'id': 'popular', 'en': 'Popular PK', 'ur': 'مقبول', 'count': _counts['popular']},
      {'id': 'recent', 'en': 'Recent PK', 'ur': 'حالیہ', 'count': _counts['recent']},
      {'id': 'featured', 'en': 'Featured', 'ur': 'نمایاں', 'count': _counts['featured']},
      {'id': 'all', 'en': 'All', 'ur': 'تمام', 'count': _counts['all']},
    ];

    return Container(
      height: 42,
      margin: const EdgeInsets.only(bottom: 6),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: chips.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final c = chips[i];
          final isSelected = _activeTab == c['id'];
          return GestureDetector(
            onTap: () {
              setState(() => _activeTab = c['id'] as String);
              _fetchDiscoveryData();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: isSelected ? _neonPink : const Color(0xFF1B1236),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isSelected ? _neonPink : Colors.white10),
                boxShadow: isSelected
                    ? [BoxShadow(color: _neonPink.withOpacity(0.4), blurRadius: 8, spreadRadius: 1)]
                    : null,
              ),
              child: Row(
                children: [
                  Text(
                    _isUrdu ? (c['ur'] as String) : (c['en'] as String),
                    style: TextStyle(
                      color: isSelected ? Colors.white : Colors.white70,
                      fontSize: 11,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    ),
                  ),
                  if (c['count'] != null && (c['count'] as int) > 0) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: isSelected ? Colors.black26 : Colors.white12,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${c['count']}',
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.white60,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // BATTLES LIST (Matching 06_06_pk_discovery_tab.png)
  Widget _buildBattlesList() {
    if (_battles.isEmpty) {
      return Center(
        child: Text(
          _isUrdu ? 'کوئی پی کے مقابلہ نہیں ملا' : 'No PK battles match the criteria',
          style: const TextStyle(color: Colors.white38, fontSize: 13),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      itemCount: _battles.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final b = _battles[i];
        final hostA = b['hostA'] ?? {};
        final hostB = b['hostB'] ?? {};

        return Container(
          height: 104,
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _borderColor),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              // LEFT: Split Host Images with VS Badge (Matching reference image)
              Container(
                width: 100,
                height: 88,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white12),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Image.network(
                              hostA['avatarUrl'] ?? '',
                              fit: BoxFit.cover,
                              height: 88,
                              errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade900),
                            ),
                          ),
                          Expanded(
                            child: Image.network(
                              hostB['avatarUrl'] ?? '',
                              fit: BoxFit.cover,
                              height: 88,
                              errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade900),
                            ),
                          ),
                        ],
                      ),
                      // Fiery VS Badge
                      Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFFF4500), Color(0xFFFF2D78)],
                            ),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.white70, width: 1),
                            boxShadow: [
                              BoxShadow(
                                color: _neonPink.withOpacity(0.8),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          child: const Text(
                            'VS',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(width: 12),

              // RIGHT: Matchup info, Viewers, Live Badge & Watch Button
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Host nickname & PK Live pill
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            hostA['nickname'] ?? 'Host A',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        if (b['status'] == 'active')
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFFF2D78), Color(0xFFEC4899)],
                              ),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.whatshot, size: 10, color: Colors.yellowAccent),
                                SizedBox(width: 2),
                                Text(
                                  'PK Live',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),

                    // Matchup Subtitle
                    Text(
                      '${hostA['nickname'] ?? ''} vs ${hostB['nickname'] ?? ''}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),

                    // Viewers count & timer
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          b['viewersFormatted'] ?? '',
                          style: const TextStyle(
                            color: Color(0xFFC084FC),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (b['status'] == 'active')
                          Row(
                            children: [
                              const Icon(Icons.timer_outlined, size: 11, color: _neonPink),
                              const SizedBox(width: 3),
                              Text(
                                b['formattedTimer'] ?? '',
                                style: const TextStyle(color: Colors.white70, fontSize: 10),
                              ),
                            ],
                          ),
                      ],
                    ),

                    // Watch Button
                    Align(
                      alignment: _isUrdu ? Alignment.centerLeft : Alignment.centerRight,
                      child: GestureDetector(
                        onTap: () {
                          if (widget.onWatchBattle != null) {
                            widget.onWatchBattle!(b['id']);
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white24),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.visibility, size: 11, color: Colors.white),
                              const SizedBox(width: 4),
                              Text(
                                _isUrdu ? 'دیکھیں' : 'Watch',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // AVAILABLE HOSTS LIST
  Widget _buildAvailableHostsList() {
    if (_hosts.isEmpty) {
      return Center(
        child: Text(
          _isUrdu ? 'کوئی دستیاب میزبان نہیں ملا' : 'No available hosts found for PK',
          style: const TextStyle(color: Colors.white38, fontSize: 13),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      itemCount: _hosts.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, i) {
        final h = _hosts[i];
        final isInvited = _invitedHostId == h['id'];

        return Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF140D29),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF2B1B4A)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundImage: NetworkImage(h['avatarUrl'] ?? ''),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          h['nickname'] ?? '',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 6),
                        Text(h['flagEmoji'] ?? '', style: const TextStyle(fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'ID: ${h['poppoId']} • ${h['viewersFormatted']}',
                      style: const TextStyle(color: Colors.white54, fontSize: 10),
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: () => _handleInvite(h['id']),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: isInvited
                        ? null
                        : const LinearGradient(colors: [_neonPink, Color(0xFFEC4899)]),
                    color: isInvited ? const Color(0xFF059669) : null,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    isInvited
                        ? (_isUrdu ? 'دعوت بھیجی گئی' : 'Invited')
                        : (_isUrdu ? 'دعوت دیں' : 'Invite'),
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // BOTTOM WATERMARK (6.6 PK Discovery Tab)
  Widget _buildBottomWatermark() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      alignment: Alignment.center,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        decoration: BoxDecoration(
          color: _watermarkPill,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.pink.withOpacity(0.3),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Text(
          _isUrdu ? '6.6 پی کے ڈسکوری ٹیب' : '6.6 PK Discovery Tab',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}
