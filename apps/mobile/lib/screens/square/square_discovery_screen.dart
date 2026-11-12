import 'package:flutter/material.dart';

/// Popo Live — Module 8.10 Square Discovery (Flutter parity view)
/// Mirrors Square Discovery featured posts, popular hashtags, search, and creator suggestions.
class SquareDiscoveryScreen extends StatefulWidget {
  const SquareDiscoveryScreen({super.key});

  @override
  State<SquareDiscoveryScreen> createState() => _SquareDiscoveryScreenState();
}

class _SquareDiscoveryScreenState extends State<SquareDiscoveryScreen> {
  String _searchQuery = '';
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        title: const Text(
          'Square Discovery',
          style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search posts, creators, or #hashtags...',
              hintStyle: const TextStyle(color: Color(0xFFD8B4FE)),
              prefixIcon: const Icon(Icons.search, color: Color(0xFFFF4D8D)),
              filled: true,
              fillColor: const Color(0xFF170931),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(18),
                borderSide: BorderSide.none,
              ),
            ),
            onChanged: (val) => setState(() => _searchQuery = val),
          ),
          const SizedBox(height: 16),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 0, label: Text('For You')),
              ButtonSegment(value: 1, label: Text('Popular')),
              ButtonSegment(value: 2, label: Text('Following')),
            ],
            selected: {_selectedTab},
            onSelectionChanged: (v) => setState(() => _selectedTab = v.first),
          ),
          const SizedBox(height: 16),
          if (_searchQuery.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                'Filtering discovery for "$_searchQuery"',
                style: const TextStyle(color: Color(0xFFFF4D8D), fontSize: 12),
              ),
            ),
          const Text(
            'Featured & Popular Posts',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF170931),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.purpleAccent.withValues(alpha: 0.2)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ayesha Khan · #PartyLounge',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                ),
                SizedBox(height: 6),
                Text(
                  'Golden hour before our Friday PK room opens! Who is joining tonight?',
                  style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
