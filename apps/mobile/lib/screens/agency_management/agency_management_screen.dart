import 'package:flutter/material.dart';

class AgencyManagementScreen extends StatefulWidget {
  const AgencyManagementScreen({super.key});

  @override
  State<AgencyManagementScreen> createState() => _AgencyManagementScreenState();
}

class _AgencyManagementScreenState extends State<AgencyManagementScreen> {
  String _agencyName = 'Star Creators Agency';
  String _agencyDescription =
      'Creator-focused talent collective supporting live streaming hosts and community showcases.';
  String _selectedTab = 'dashboard';
  String _statusFilter = 'All';
  String _searchQuery = '';
  bool _isEditing = false;

  final List<Map<String, String>> _hosts = const [
    {'id': 'PL-88401', 'name': 'Ayesha Khan', 'handle': '@ayesha.live', 'status': 'Active'},
    {'id': 'PL-88402', 'name': 'Hamza Ali', 'handle': '@hamza.stage', 'status': 'Active'},
    {'id': 'PL-88403', 'name': 'Mina Noor', 'handle': '@mina.noor', 'status': 'Active'},
    {'id': 'PL-88411', 'name': 'Nadia Shah', 'handle': '@nadia.stage', 'status': 'Pending'},
    {'id': 'PL-88415', 'name': 'Zainab Tariq', 'handle': '@zainab.art', 'status': 'Inactive'},
    {'id': 'PL-88417', 'name': 'Ali Raza', 'handle': '@ali.demo', 'status': 'Suspended'},
  ];

  @override
  Widget build(BuildContext context) {
    final activeCount = _hosts.where((h) => h['status'] == 'Active').length;
    final pendingCount = _hosts.where((h) => h['status'] == 'Pending').length;
    final filteredHosts = _hosts.where((h) {
      final matchesStatus = _statusFilter == 'All' || h['status'] == _statusFilter;
      final q = _searchQuery.trim().toLowerCase();
      final matchesQuery = q.isEmpty ||
          h['name']!.toLowerCase().contains(q) ||
          h['id']!.toLowerCase().contains(q);
      return matchesStatus && matchesQuery;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFF130822),
      appBar: AppBar(
        backgroundColor: const Color(0xFF130822),
        elevation: 0,
        title: const Text(
          'Agency',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1D0D34),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.purpleAccent.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFFBBF24), width: 4),
                    color: const Color(0xFF2A124C),
                  ),
                  child: const Center(
                    child: CircleAvatar(radius: 6, backgroundColor: Colors.white),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _agencyName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Agency ID: AG-2048',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Active agency',
                        style: TextStyle(
                          color: Color(0xFF34D399),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _statCard('${_hosts.length}', 'Hosts'),
              const SizedBox(width: 8),
              _statCard('$activeCount', 'Active'),
              const SizedBox(width: 8),
              _statCard('$pendingCount', 'Pending'),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            children: ['dashboard', 'hosts', 'profile', 'performance', 'support']
                .map(
                  (tab) => ChoiceChip(
                    label: Text(tab),
                    selected: _selectedTab == tab,
                    onSelected: (_) => setState(() => _selectedTab = tab),
                    selectedColor: const Color(0xFFFF2E93),
                    backgroundColor: const Color(0xFF1A0B2E),
                    labelStyle: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 16),
          if (_selectedTab == 'dashboard') ...[
            _navTile('Host Management', 'View and manage agency hosts', () {
              setState(() => _selectedTab = 'hosts');
            }),
            _navTile('Agency Details', 'Profile and agency information', () {
              setState(() => _selectedTab = 'profile');
            }),
            _navTile('Performance', 'Review agency activity', () {
              setState(() => _selectedTab = 'performance');
            }),
            _navTile('Support', 'Agency help and information', () {
              setState(() => _selectedTab = 'support');
            }),
          ] else if (_selectedTab == 'hosts') ...[
            TextField(
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Search hosts by name or ID...',
                hintStyle: TextStyle(color: Colors.white54),
              ),
              onChanged: (v) => setState(() => _searchQuery = v),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              children: ['All', 'Active', 'Pending', 'Inactive', 'Suspended']
                  .map(
                    (status) => ChoiceChip(
                      label: Text(status),
                      selected: _statusFilter == status,
                      onSelected: (_) => setState(() => _statusFilter = status),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 10),
            ...filteredHosts.map(
              (h) => Card(
                color: const Color(0xFF1A0B2E),
                child: ListTile(
                  title: Text(
                    h['name']!,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    '${h['handle']} · ${h['id']}',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  trailing: Text(
                    h['status']!,
                    style: const TextStyle(color: Color(0xFFFF6BA3), fontSize: 12),
                  ),
                ),
              ),
            ),
          ] else if (_selectedTab == 'profile') ...[
            Card(
              color: const Color(0xFF1A0B2E),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _agencyName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(_agencyDescription, style: const TextStyle(color: Colors.white70)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => setState(() => _isEditing = !_isEditing),
                      child: Text(_isEditing ? 'Cancel' : 'Edit Profile'),
                    ),
                  ],
                ),
              ),
            ),
          ] else if (_selectedTab == 'performance') ...[
            const Card(
              color: Color(0xFF1A0B2E),
              child: ListTile(
                title: Text(
                  'Weekly Sample Activity: 42 Sessions · 93.0 hrs',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                ),
                subtitle: Text(
                  'Sample host participation metrics only (non-financial).',
                  style: TextStyle(color: Colors.white70),
                ),
              ),
            ),
          ] else ...[
            const Card(
              color: Color(0xFF1A0B2E),
              child: ListTile(
                title: Text(
                  'Agency Support & Guidance',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                ),
                subtitle: Text(
                  'Demo FAQs, onboarding tips, and sample support preview.',
                  style: TextStyle(color: Colors.white70),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _statCard(String count, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF1A0B2E),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Colors.purpleAccent.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Text(
              count,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _navTile(String title, String subtitle, VoidCallback onTap) {
    return Card(
      color: const Color(0xFF1D0D34),
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: onTap,
        title: Text(
          title,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
        ),
        subtitle: Text(subtitle, style: const TextStyle(color: Colors.white70, fontSize: 12)),
        trailing: const Icon(Icons.chevron_right, color: Colors.white70),
      ),
    );
  }
}
