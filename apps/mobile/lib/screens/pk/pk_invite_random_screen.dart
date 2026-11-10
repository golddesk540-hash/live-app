import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

/// ============================================================================
/// Popo Live — Phase 6 Module 6.2: Starting a PK Battle (Invite / Random)
/// Exact 1:1 Design Reference: 06_02_starting_a_battle_invite_random.png
/// Flutter implementation for Android & iOS
/// ============================================================================

enum PKTab { invite, random }

enum RandomMatchStatus {
  idle,
  findingOpponent,
  opponentFound,
  waitingConfirmation,
  matchAccepted,
  matchCancelled,
  noOpponentAvailable,
}

class PKInviteRandomScreen extends StatefulWidget {
  final String currentHostId;
  final String roomNumber;
  final String currentNickname;
  final String apiBaseUrl;
  final VoidCallback? onBack;
  final Function(String battleId, Map<String, dynamic> opponent)? onBattleConfirmed;

  const PKInviteRandomScreen({
    Key? key,
    this.currentHostId = '00000000-0000-0000-0000-000000088201',
    this.roomNumber = '7001',
    this.currentNickname = 'Host Master',
    this.apiBaseUrl = 'https://kigolive.com',
    this.onBack,
    this.onBattleConfirmed,
  }) : super(key: key);

  @override
  State<PKInviteRandomScreen> createState() => _PKInviteRandomScreenState();
}

class _PKInviteRandomScreenState extends State<PKInviteRandomScreen> {
  PKTab _activeTab = PKTab.invite;
  bool _isUrdu = false;
  final TextEditingController _searchController = TextEditingController();

  List<dynamic> _hosts = [];
  bool _isLoadingHosts = false;
  String? _invitingHostId;

  // Active Outgoing Invitation
  Map<String, dynamic>? _activeInvite;
  Timer? _invitePollTimer;

  // Random Matchmaking state
  RandomMatchStatus _randomStatus = RandomMatchStatus.idle;
  int _elapsedSeconds = 0;
  Timer? _randomPollTimer;
  Map<String, dynamic>? _randomOpponent;
  String? _randomBattleId;

  // Colors matching 06_02 reference
  static const Color _bgTop = Color(0xFF221138);
  static const Color _bgDark = Color(0xFF130A21);
  static const Color _neonPink = Color(0xFFFF2D78);
  static const Color _tabInactive = Color(0xFF21153B);
  static const Color _searchBg = Color(0xFF1E1338);
  static const Color _watermarkPill = Color(0xFF7A1C5D);

  @override
  void initState() {
    super.initState();
    _fetchHosts();
  }

  @override
  void dispose() {
    _invitePollTimer?.cancel();
    _randomPollTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _showNotice(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white, fontSize: 13)),
        backgroundColor: isError ? const Color(0xFF881337) : const Color(0xFF4C1D95),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _fetchHosts([String query = '']) async {
    setState(() => _isLoadingHosts = true);
    try {
      final uri = Uri.parse(
        '${widget.apiBaseUrl}/api/pk/hosts?search=${Uri.encodeComponent(query)}&excludeHostId=${widget.currentHostId}',
      );
      final res = await http.get(uri);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          setState(() => _hosts = data['hosts'] ?? []);
        }
      }
    } catch (e) {
      debugPrint('Error fetching hosts: $e');
    } finally {
      if (mounted) setState(() => _isLoadingHosts = false);
    }
  }

  Future<void> _sendInvite(dynamic host) async {
    setState(() => _invitingHostId = host['id']);
    try {
      final res = await http.post(
        Uri.parse('${widget.apiBaseUrl}/api/pk/invitation/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'senderHostId': widget.currentHostId,
          'senderRoomNumber': widget.roomNumber,
          'receiverHostId': host['id'],
          'battleType': '1v1',
          'language': _isUrdu ? 'ur' : 'en',
        }),
      );

      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        setState(() {
          _activeInvite = data['invitation'];
        });
        _startInvitePolling(data['invitation']['id']);
        _showNotice(_isUrdu ? 'دعوت بھیج دی گئی ہے!' : 'Invitation sent!');
      } else {
        _showNotice(data['error'] ?? 'Failed to send invitation', isError: true);
      }
    } catch (e) {
      _showNotice('Network error', isError: true);
    } finally {
      if (mounted) setState(() => _invitingHostId = null);
    }
  }

  void _startInvitePolling(String inviteId) {
    _invitePollTimer?.cancel();
    _invitePollTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      try {
        final res = await http.get(
          Uri.parse('${widget.apiBaseUrl}/api/pk/invitation/status?invitationId=$inviteId'),
        );
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data['success'] == true && data['invitation'] != null) {
            final status = data['invitation']['status'];
            if (status == 'accepted') {
              timer.cancel();
              setState(() => _activeInvite = null);
              _showNotice(_isUrdu ? 'دعوت قبول ہو گئی!' : 'Invitation accepted!');
              if (widget.onBattleConfirmed != null && data['battle'] != null) {
                widget.onBattleConfirmed!(data['battle']['id'], data['battle']);
              }
            } else if (status == 'rejected' || status == 'expired' || status == 'cancelled') {
              timer.cancel();
              setState(() => _activeInvite = null);
              _showNotice(
                status == 'rejected'
                    ? (_isUrdu ? 'دعوت مسترد کر دی گئی' : 'Invitation declined')
                    : (_isUrdu ? 'دعوت کی میعاد ختم ہو گئی' : 'Invitation expired'),
                isError: true,
              );
            } else {
              setState(() {
                _activeInvite = data['invitation'];
              });
            }
          }
        }
      } catch (_) {}
    });
  }

  Future<void> _cancelInvite() async {
    if (_activeInvite == null) return;
    try {
      await http.post(
        Uri.parse('${widget.apiBaseUrl}/api/pk/invitation/cancel'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'invitationId': _activeInvite!['id'],
          'senderHostId': widget.currentHostId,
        }),
      );
    } catch (_) {}
    _invitePollTimer?.cancel();
    setState(() => _activeInvite = null);
    _showNotice(_isUrdu ? 'دعوت منسوخ کر دی گئی' : 'Invitation cancelled');
  }

  Future<void> _startRandomMatchmaking() async {
    setState(() {
      _randomStatus = RandomMatchStatus.findingOpponent;
      _elapsedSeconds = 0;
      _randomOpponent = null;
      _randomBattleId = null;
    });

    try {
      final res = await http.post(
        Uri.parse('${widget.apiBaseUrl}/api/pk/matchmaking/start'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'hostId': widget.currentHostId,
          'roomNumber': widget.roomNumber,
          'battleType': '1v1',
          'language': _isUrdu ? 'ur' : 'en',
        }),
      );

      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success'] == true) {
        if (data['status'] == 'match_accepted') {
          setState(() {
            _randomStatus = RandomMatchStatus.matchAccepted;
            _randomOpponent = data['opponent'];
            _randomBattleId = data['battleId'];
          });
          _showNotice(_isUrdu ? 'مخالف مل گیا!' : 'Opponent found!');
          if (widget.onBattleConfirmed != null && data['battleId'] != null) {
            widget.onBattleConfirmed!(data['battleId'], data['opponent']);
          }
        } else {
          _pollRandomMatchmaking();
        }
      } else {
        setState(() => _randomStatus = RandomMatchStatus.noOpponentAvailable);
        _showNotice(data['error'] ?? 'Matchmaking error', isError: true);
      }
    } catch (e) {
      setState(() => _randomStatus = RandomMatchStatus.noOpponentAvailable);
    }
  }

  void _pollRandomMatchmaking() {
    _randomPollTimer?.cancel();
    _randomPollTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      setState(() => _elapsedSeconds += 2);
      try {
        final res = await http.get(
          Uri.parse('${widget.apiBaseUrl}/api/pk/matchmaking/status?hostId=${widget.currentHostId}'),
        );
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data['success'] == true) {
            final st = data['status'];
            if (st == 'match_accepted' || st == 'opponent_found') {
              timer.cancel();
              setState(() {
                _randomStatus = RandomMatchStatus.matchAccepted;
                _randomOpponent = data['opponent'];
                _randomBattleId = data['battleId'];
              });
              _showNotice(_isUrdu ? 'مخالف مل گیا!' : 'Opponent found!');
              if (widget.onBattleConfirmed != null && data['battleId'] != null) {
                widget.onBattleConfirmed!(data['battleId'], data['opponent']);
              }
            } else if (st == 'no_opponent_available') {
              timer.cancel();
              setState(() => _randomStatus = RandomMatchStatus.noOpponentAvailable);
            }
          }
        }
      } catch (_) {}
    });
  }

  Future<void> _cancelRandomMatchmaking() async {
    _randomPollTimer?.cancel();
    try {
      await http.post(
        Uri.parse('${widget.apiBaseUrl}/api/pk/matchmaking/cancel'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'hostId': widget.currentHostId}),
      );
    } catch (_) {}
    setState(() => _randomStatus = RandomMatchStatus.matchCancelled);
    _showNotice(_isUrdu ? 'تلاش منسوخ کر دی گئی' : 'Search cancelled');
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _isUrdu ? TextDirection.rtl : TextDirection.ltr,
      child: Scaffold(
        backgroundColor: _bgDark,
        body: SafeArea(
          child: Stack(
            children: [
              Column(
                children: [
                  _buildHeader(),
                  _buildTabSwitcher(),
                  Expanded(
                    child: _activeTab == PKTab.invite
                        ? _buildInviteTab()
                        : _buildRandomTab(),
                  ),
                  _buildWatermark(),
                ],
              ),
              if (_activeInvite != null) _buildOutgoingModal(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: widget.onBack ?? () => Navigator.of(context).maybePop(),
            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          ),
          Text(
            _isUrdu ? 'پی کے جنگ' : 'PK Battle',
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          InkWell(
            onTap: () => setState(() => _isUrdu = !_isUrdu),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: _tabInactive,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.purple.withOpacity(0.3)),
              ),
              child: Text(
                _isUrdu ? 'EN' : 'اردو',
                style: const TextStyle(color: _neonPink, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabSwitcher() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: _tabInactive,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _activeTab = PKTab.invite),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: _activeTab == PKTab.invite ? _neonPink : Colors.transparent,
                  borderRadius: BorderRadius.circular(26),
                  boxShadow: _activeTab == PKTab.invite
                      ? [BoxShadow(color: _neonPink.withOpacity(0.4), blurRadius: 10)]
                      : null,
                ),
                alignment: Alignment.center,
                child: Text(
                  _isUrdu ? 'دعوت' : 'Invite',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: _activeTab == PKTab.invite ? FontWeight.bold : FontWeight.normal,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _activeTab = PKTab.random),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: _activeTab == PKTab.random ? _neonPink : Colors.transparent,
                  borderRadius: BorderRadius.circular(26),
                  boxShadow: _activeTab == PKTab.random
                      ? [BoxShadow(color: _neonPink.withOpacity(0.4), blurRadius: 10)]
                      : null,
                ),
                alignment: Alignment.center,
                child: Text(
                  _isUrdu ? 'رینڈم' : 'Random',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: _activeTab == PKTab.random ? FontWeight.bold : FontWeight.normal,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInviteTab() {
    return Column(
      children: [
        // Search field matching 06_02 reference
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: _searchBg,
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: Colors.white.withOpacity(0.06)),
          ),
          child: TextField(
            controller: _searchController,
            onChanged: (val) => _fetchHosts(val),
            style: const TextStyle(color: Colors.white, fontSize: 14),
            decoration: InputDecoration(
              icon: const Icon(Icons.search, color: Colors.grey, size: 20),
              hintText: _isUrdu ? 'میزبان یا آئی ڈی تلاش کریں' : 'Search host or ID',
              hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
              border: InputBorder.none,
            ),
          ),
        ),

        // Host list matching 06_02 reference rows
        Expanded(
          child: _isLoadingHosts
              ? const Center(child: CircularProgressIndicator(color: _neonPink))
              : _hosts.isEmpty
                  ? Center(
                      child: Text(
                        _isUrdu ? 'کوئی میزبان نہیں ملا' : 'No live hosts found',
                        style: const TextStyle(color: Colors.grey),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: _hosts.length,
                      itemBuilder: (ctx, i) {
                        final host = _hosts[i];
                        final isInviting = _invitingHostId == host['id'];
                        return Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(color: Colors.purple.withOpacity(0.1)),
                            ),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundImage: NetworkImage(
                                  host['avatarUrl'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      host['nickname'] ?? 'Host',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Row(
                                      children: [
                                        Container(
                                          width: 7,
                                          height: 7,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFF10B981),
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          _isUrdu ? 'آن لائن' : 'Online',
                                          style: const TextStyle(color: Colors.grey, fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              ElevatedButton(
                                onPressed: isInviting ? null : () => _sendInvite(host),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _neonPink,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 8),
                                  elevation: 4,
                                ),
                                child: isInviting
                                    ? const SizedBox(
                                        width: 14,
                                        height: 14,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                      )
                                    : Text(
                                        _isUrdu ? 'دعوت دیں' : 'Invite',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  Widget _buildRandomTab() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 130,
            height: 130,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(colors: [_neonPink, Color(0xFF7928CA)]),
              boxShadow: [BoxShadow(color: _neonPink.withOpacity(0.5), blurRadius: 30)],
            ),
            child: Center(
              child: Icon(
                _randomStatus == RandomMatchStatus.findingOpponent
                    ? Icons.shuffle
                    : _randomStatus == RandomMatchStatus.matchAccepted
                        ? Icons.check_circle
                        : Icons.group,
                color: Colors.white,
                size: 54,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            _randomStatus == RandomMatchStatus.findingOpponent
                ? (_isUrdu ? 'مخالف کی تلاش جاری ہے...' : 'Finding Opponent...')
                : _randomStatus == RandomMatchStatus.matchAccepted
                    ? (_isUrdu ? 'میچ کی تصدیق ہو گئی!' : 'Match Accepted!')
                    : (_isUrdu ? 'رینڈم میچ میکنگ' : 'Random Matchmaking'),
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            _randomStatus == RandomMatchStatus.findingOpponent
                ? '($_elapsedSeconds s)'
                : (_isUrdu
                    ? '1v1 مقابلے کے لیے کسی بھی دستیاب میزبان کو تلاش کریں'
                    : 'Find an available live host for 1v1 battle'),
            style: const TextStyle(color: Colors.grey, fontSize: 13),
          ),
          const SizedBox(height: 32),
          if (_randomStatus == RandomMatchStatus.findingOpponent)
            ElevatedButton(
              onPressed: _cancelRandomMatchmaking,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2A1B47),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 12),
              ),
              child: Text(
                _isUrdu ? 'تلاش منسوخ کریں' : 'Cancel Search',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            )
          else
            ElevatedButton(
              onPressed: _startRandomMatchmaking,
              style: ElevatedButton.styleFrom(
                backgroundColor: _neonPink,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 14),
                elevation: 6,
              ),
              child: Text(
                _isUrdu ? 'رینڈم میچ تلاش کریں' : 'Start Random Match',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOutgoingModal() {
    return Container(
      color: Colors.black.withOpacity(0.85),
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(28),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1E1338),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: _neonPink.withOpacity(0.5)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 40,
                backgroundImage: NetworkImage(_activeInvite?['receiverAvatar'] ?? ''),
              ),
              const SizedBox(height: 16),
              Text(
                _isUrdu ? 'پی کے جنگ کی دعوت بھیج دی گئی' : 'PK Battle Invitation Sent',
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Text(
                _activeInvite?['receiverNickname'] ?? '',
                style: const TextStyle(color: _neonPink, fontSize: 15, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _cancelInvite,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF27153F),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 10),
                ),
                child: Text(
                  _isUrdu ? 'دعوت منسوخ کریں' : 'Cancel Invitation',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWatermark() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12, top: 6),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      decoration: BoxDecoration(
        color: _watermarkPill,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: _neonPink.withOpacity(0.4)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: const [
          Text(
            '6.2 Starting a Battle',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
          ),
          Text(
            '(Invite / Random)',
            style: TextStyle(color: Color(0xFFFBCFE8), fontSize: 11),
          ),
        ],
      ),
    );
  }
}
