import 'package:flutter/material.dart';

class FanClubScreen extends StatefulWidget {
  const FanClubScreen({super.key});

  @override
  State<FanClubScreen> createState() => _FanClubScreenState();
}

class _FanClubScreenState extends State<FanClubScreen> {
  final Set<String> _joinedIds = {};
  final TextEditingController _searchController = TextEditingController();
  String _selectedClubId = 'club_ayesha';

  static const List<_DemoClub> _clubs = [
    _DemoClub(
      id: 'club_ayesha',
      name: "AYESHA'S FAN CLUB",
      hostName: 'Ayesha Khan',
      fansCount: 12840,
      level: 6,
      badge: 'Ayesha Star',
    ),
    _DemoClub(
      id: 'club_hamza',
      name: 'HAMZA PK LEGENDS',
      hostName: 'Hamza Ali',
      fansCount: 18420,
      level: 8,
      badge: 'PK Titan',
    ),
    _DemoClub(
      id: 'club_mina',
      name: 'MINA VIP SYMPHONY',
      hostName: 'Mina Official',
      fansCount: 24190,
      level: 9,
      badge: 'Mina Crown',
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final filtered = _clubs
        .where((c) => c.name.toLowerCase().contains(query) || c.hostName.toLowerCase().contains(query))
        .toList();
    final activeClub = _clubs.firstWhere((c) => c.id == _selectedClubId, orElse: () => _clubs.first);
    final isJoined = _joinedIds.contains(activeClub.id);

    return Scaffold(
      backgroundColor: const Color(0xFF0D041C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        title: const Text('Fan Club', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF16092D),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.purpleAccent.withValues(alpha: 0.25)),
            ),
            child: Column(
              children: [
                const CircleAvatar(
                  radius: 36,
                  backgroundColor: Color(0xFF7028B8),
                  child: Icon(Icons.auto_awesome, color: Color(0xFFFBBF24), size: 36),
                ),
                const SizedBox(height: 12),
                Text(activeClub.name, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                const SizedBox(height: 4),
                Text(
                  '${activeClub.fansCount + (isJoined ? 1 : 0)} fans · Level ${activeClub.level}',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 14),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isJoined ? Colors.teal : const Color(0xFFFF1A6C),
                    shape: const StadiumBorder(),
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                  ),
                  onPressed: () {
                    setState(() {
                      if (isJoined) {
                        _joinedIds.remove(activeClub.id);
                      } else {
                        _joinedIds.add(activeClub.id);
                      }
                    });
                  },
                  child: Text(isJoined ? 'Joined · Leave Club' : 'Join Fan Club'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _searchController,
            onChanged: (_) => setState(() {}),
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search Fan Clubs...',
              hintStyle: const TextStyle(color: Colors.white38),
              prefixIcon: const Icon(Icons.search, color: Colors.white54),
              filled: true,
              fillColor: const Color(0xFF16092D),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 12),
          ...filtered.map((club) => Card(
                color: const Color(0xFF16092D),
                child: ListTile(
                  onTap: () => setState(() => _selectedClubId = club.id),
                  title: Text(club.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: Text('${club.hostName} · Badge: ${club.badge}', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                  trailing: Chip(
                    label: Text(_joinedIds.contains(club.id) ? 'Joined' : 'Lv.${club.level}'),
                  ),
                ),
              )),
        ],
      ),
    );
  }
}

class _DemoClub {
  final String id;
  final String name;
  final String hostName;
  final int fansCount;
  final int level;
  final String badge;

  const _DemoClub({
    required this.id,
    required this.name,
    required this.hostName,
    required this.fansCount,
    required this.level,
    required this.badge,
  });
}
