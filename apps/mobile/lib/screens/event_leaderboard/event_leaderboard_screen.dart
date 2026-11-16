import 'package:flutter/material.dart';
import '../../api/api.dart';
import '../profile/public_profile_screen.dart';

/// Popo Live — Phase 4 Module 8: Event Leaderboard Screen
/// Live Campaign Rankings, Status Filtering (Active/Upcoming/Completed), and Participant Milestones.
class EventLeaderboardScreen extends StatefulWidget {
  const EventLeaderboardScreen({super.key});

  @override
  State<EventLeaderboardScreen> createState() => _EventLeaderboardScreenState();
}

class _EventLeaderboardScreenState extends State<EventLeaderboardScreen> {
  String _statusFilter = 'active';
  bool _isLoadingEvents = true;
  bool _isLoadingLeaderboard = false;
  bool _isJoining = false;
  String? _errorMessage;

  List<dynamic> _events = [];
  Map<String, dynamic>? _selectedEvent;
  List<dynamic> _participants = [];
  Map<String, dynamic>? _myRank;

  @override
  void initState() {
    super.initState();
    _fetchEvents();
  }

  Future<void> _fetchEvents() async {
    setState(() {
      _isLoadingEvents = true;
      _errorMessage = null;
    });

    try {
      final res = await EventService.instance.getEvents(status: _statusFilter == 'all' ? null : _statusFilter);
      if (!mounted) return;

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        final eventsList = (data['events'] as List<dynamic>?) ?? [];
        setState(() {
          _events = eventsList;
          _selectedEvent = eventsList.isNotEmpty ? eventsList[0] as Map<String, dynamic> : null;
          _isLoadingEvents = false;
        });

        if (_selectedEvent != null) {
          _fetchLeaderboard(_selectedEvent!['id']);
        } else {
          setState(() {
            _participants = [];
            _myRank = null;
          });
        }
      } else {
        setState(() {
          _errorMessage = res.error ?? 'Failed to load events.';
          _isLoadingEvents = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingEvents = false;
      });
    }
  }

  Future<void> _fetchLeaderboard(String eventId) async {
    setState(() {
      _isLoadingLeaderboard = true;
    });

    try {
      final res = await EventService.instance.getEventLeaderboard(eventId);
      if (!mounted) return;

      if (res.isSuccess && res.data != null) {
        final data = res.data as Map<String, dynamic>;
        setState(() {
          _participants = (data['participants'] as List<dynamic>?) ?? [];
          _myRank = data['myRank'] as Map<String, dynamic>?;
          _isLoadingLeaderboard = false;
        });
      } else {
        setState(() {
          _isLoadingLeaderboard = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingLeaderboard = false);
      }
    }
  }

  Future<void> _handleJoinEvent() async {
    if (_selectedEvent == null) return;
    setState(() => _isJoining = true);

    try {
      final res = await EventService.instance.joinEvent(_selectedEvent!['id']);
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.data?['message']?.toString() ?? 'Joined event successfully!'),
          backgroundColor: const Color(0xFF34D399),
        ),
      );
      _fetchLeaderboard(_selectedEvent!['id']);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: const Color(0xFFFF1A6C),
        ),
      );
    } finally {
      if (mounted) setState(() => _isJoining = false);
    }
  }

  void _openProfile(String userId) {
    if (userId.isEmpty) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => PublicProfileScreen(userId: userId)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Event Leaderboard',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchEvents,
        color: const Color(0xFFFF1A6C),
        backgroundColor: const Color(0xFF160830),
        child: Column(
          children: [
            // Filter Pills (Active / Upcoming / Completed)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: const Color(0xFF120624),
              child: Row(
                children: [
                  _statusTab('ACTIVE', 'active'),
                  const SizedBox(width: 8),
                  _statusTab('UPCOMING', 'upcoming'),
                  const SizedBox(width: 8),
                  _statusTab('COMPLETED', 'completed'),
                  const SizedBox(width: 8),
                  _statusTab('ALL', 'all'),
                ],
              ),
            ),

            // Main Content Area
            Expanded(
              child: _buildBody(),
            ),

            // Pinned User Position Bar
            if (_myRank != null && _selectedEvent != null) _buildMyRankFooter(),
          ],
        ),
      ),
    );
  }

  Widget _statusTab(String label, String value) {
    final bool active = _statusFilter == value;
    return Expanded(
      child: InkWell(
        onTap: () {
          if (_statusFilter == value) return;
          setState(() => _statusFilter = value);
          _fetchEvents();
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: active ? const Color(0xFFFF1A6C) : const Color(0xFF1C0D36),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: active ? const Color(0xFFFF1A6C) : const Color(0x33A855F7),
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: active ? Colors.white : const Color(0xFFBBA9D6),
                fontSize: 10,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoadingEvents) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFFF1A6C)),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: Color(0xFFFF1A6C), size: 48),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 13),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF1A6C),
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                ),
                onPressed: _fetchEvents,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_events.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            Icon(Icons.emoji_events_outlined, color: Colors.white30, size: 54),
            SizedBox(height: 12),
            Text(
              'No campaigns found for this filter.',
              style: TextStyle(color: Color(0xFFBBA9D6), fontSize: 13),
            ),
          ],
        ),
      );
    }

    final ev = _selectedEvent ?? {};
    final title = ev['title'] ?? 'Campaign';
    final titleUrdu = ev['titleUrdu'] ?? '';
    final description = ev['description'] ?? '';
    final status = ev['status']?.toString().toUpperCase() ?? 'ACTIVE';
    final prizePool = ev['prizePool'] ?? 'Exclusive Badges & Coins';
    final isParticipating = _myRank?['isParticipating'] == true;

    Color statusColor = const Color(0xFF34D399);
    if (status == 'UPCOMING') statusColor = const Color(0xFFFFD166);
    if (status == 'COMPLETED') statusColor = const Color(0xFFBBA9D6);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Horizontal Event Switcher Pills (if multiple events exist)
        if (_events.length > 1) ...[
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _events.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (ctx, idx) {
                final item = _events[idx];
                final isSelected = item['id'] == _selectedEvent?['id'];
                return ChoiceChip(
                  label: Text(item['title'] ?? 'Event'),
                  selected: isSelected,
                  selectedColor: const Color(0xFFFF1A6C),
                  backgroundColor: const Color(0xFF180A31),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : const Color(0xFFBBA9D6),
                    fontWeight: FontWeight.w700,
                    fontSize: 11,
                  ),
                  onSelected: (_) {
                    setState(() => _selectedEvent = item);
                    _fetchLeaderboard(item['id']);
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 14),
        ],

        // Event Hero Header Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF2C104F), Color(0xFF16082E)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Colors.purpleAccent.withOpacity(0.3)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: statusColor.withOpacity(0.5)),
                    ),
                    child: Text(
                      status,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  if (status == 'ACTIVE' && !isParticipating)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF1A6C),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        shape: const StadiumBorder(),
                        minimumSize: Size.zero,
                      ),
                      onPressed: _isJoining ? null : _handleJoinEvent,
                      child: _isJoining
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('Join Event', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                ),
              ),
              if (titleUrdu.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  titleUrdu,
                  style: const TextStyle(color: Color(0xFFFF85B3), fontSize: 13),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                description,
                style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 12),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.card_giftcard_rounded, color: Color(0xFFFFC107), size: 16),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Prize Pool: $prizePool',
                      style: const TextStyle(
                        color: Color(0xFFFFC107),
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Participant Rankings
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Leaderboard Standings',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
            ),
            if (_isLoadingLeaderboard)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFFF1A6C)),
              ),
          ],
        ),
        const SizedBox(height: 12),

        if (_participants.isEmpty && !_isLoadingLeaderboard)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF130728),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Text(
                'No participants registered yet. Be the first to join!',
                style: TextStyle(color: Color(0xFFBBA9D6), fontSize: 12),
              ),
            ),
          )
        else
          ..._participants.map((p) {
            final int rank = p['rank'] ?? 0;
            final String name = p['nickname'] ?? 'Creator';
            final String avatar = p['avatarUrl'] ?? '';
            final String scoreFormatted = p['scoreFormatted']?.toString() ?? '0';

            Color rankColor = const Color(0xFFBBA9D6);
            if (rank == 1) rankColor = const Color(0xFFFFC107);
            if (rank == 2) rankColor = const Color(0xFFE2E8F0);
            if (rank == 3) rankColor = const Color(0xFFF97316);

            return InkWell(
              onTap: () => _openProfile(p['userId'] ?? ''),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF16082E),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: rank <= 3 ? rankColor.withOpacity(0.35) : Colors.purpleAccent.withOpacity(0.15),
                  ),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 28,
                      child: Text(
                        '$rank',
                        style: TextStyle(
                          color: rankColor,
                          fontWeight: FontWeight.w900,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: const Color(0xFF281347),
                      backgroundImage: avatar.startsWith('http') ? NetworkImage(avatar) : null,
                      child: !avatar.startsWith('http')
                          ? const Icon(Icons.person, color: Colors.white70, size: 18)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    Text(
                      '$scoreFormatted pts',
                      style: TextStyle(
                        color: rankColor,
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildMyRankFooter() {
    final rank = _myRank?['rank'];
    final score = _myRank?['score'] ?? 0;
    final isPart = _myRank?['isParticipating'] == true;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E0C3E),
        border: const Border(top: BorderSide(color: Color(0xFFFF1A6C), width: 1.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isPart ? const Color(0xFFFF1A6C) : const Color(0xFF2E174A),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  rank != null ? '#$rank' : (isPart ? 'Unranked' : 'Not Joined'),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12),
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'My Event Rank',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ],
          ),
          Text(
            '$score pts',
            style: const TextStyle(color: Color(0xFFFCD34D), fontWeight: FontWeight.w900, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
