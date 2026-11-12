import 'package:flutter/material.dart';

class AgentEarningsScreen extends StatefulWidget {
  const AgentEarningsScreen({super.key});

  @override
  State<AgentEarningsScreen> createState() => _AgentEarningsScreenState();
}

class _AgentEarningsScreenState extends State<AgentEarningsScreen> {
  String _selectedTab = 'dashboard';
  String _datePeriod = 'This Month';
  String _statusFilter = 'All';

  final List<Map<String, dynamic>> _sampleRecords = const [
    {
      'id': 'EARN-9801',
      'title': 'Host activity share',
      'date': 'Today',
      'pts': 350,
      'status': 'Completed',
      'host': 'Ayesha Khan',
    },
    {
      'id': 'EARN-9802',
      'title': 'Host activity share',
      'date': 'Yesterday',
      'pts': 280,
      'status': 'Completed',
      'host': 'Hamza Ali',
    },
    {
      'id': 'EARN-9803',
      'title': 'Pending earning entry',
      'date': 'Today',
      'pts': 450,
      'status': 'Pending',
      'host': 'Mina Noor',
    },
    {
      'id': 'EARN-9804',
      'title': 'Agency-related activity',
      'date': 'Nov 10, 2026',
      'pts': 520,
      'status': 'Processing',
      'host': 'Sara Ali',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final visibleRecords = _sampleRecords
        .where((r) => _statusFilter == 'All' || r['status'] == _statusFilter)
        .toList();

    return Scaffold(
      backgroundColor: const Color(0xFF130822),
      appBar: AppBar(
        backgroundColor: const Color(0xFF130822),
        elevation: 0,
        title: const Text(
          'Agent Earnings',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF1D0D34),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.purpleAccent.withValues(alpha: 0.25)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'TOTAL EARNINGS',
                  style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700),
                ),
                SizedBox(height: 8),
                Text(
                  '12,450',
                  style: TextStyle(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w900),
                ),
                SizedBox(height: 4),
                Text(
                  'Sample points · Demo data',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Earning summary',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          _summaryTile('This month', '4,250 pts'),
          _summaryTile('Last month', '3,800 pts'),
          _summaryTile('Pending amount', '1,200 pts'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: ['dashboard', 'commission', 'host_activity']
                .map(
                  (t) => ChoiceChip(
                    label: Text(t),
                    selected: _selectedTab == t,
                    onSelected: (_) => setState(() => _selectedTab = t),
                    selectedColor: const Color(0xFFFF2E93),
                    backgroundColor: const Color(0xFF1A0B2E),
                    labelStyle: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: ['Today', 'This Week', 'This Month', 'Last Month']
                .map(
                  (p) => ChoiceChip(
                    label: Text(p),
                    selected: _datePeriod == p,
                    onSelected: (_) => setState(() => _datePeriod = p),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: ['All', 'Completed', 'Pending', 'Processing']
                .map(
                  (s) => ChoiceChip(
                    label: Text(s),
                    selected: _statusFilter == s,
                    onSelected: (_) => setState(() => _statusFilter = s),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 16),
          const Text(
            'Recent activity',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          ...visibleRecords.map(
            (r) => Card(
              color: const Color(0xFF1D0D34),
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                title: Text(
                  r['title'] as String,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                ),
                subtitle: Text(
                  '${r['date']} · ${r['host']} · ${r['status']}',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
                trailing: Text(
                  '+${r['pts']}',
                  style: const TextStyle(
                    color: Color(0xFF34D399),
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryTile(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1D0D34),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.purpleAccent.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          Text(
            value,
            style: const TextStyle(color: Color(0xFFFBBF24), fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}
