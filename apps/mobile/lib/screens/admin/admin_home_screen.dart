import 'package:flutter/material.dart';

/// Popo Live — Module 10.1 Admin Home and Roles (Frontend Preview Scaffold)
/// Strictly frontend demo values and local UI state.
/// No backend services, real admin authentication, or real role authorization.
class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int _activeTabIndex = 0;

  // Platform metrics
  final Map<String, dynamic> _stats = {
    'totalUsers': '1,245,320',
    'liveHosts': '8,420',
    'todayLive': '1,264',
    'reports': '56',
  };

  // Sample admin list
  final List<Map<String, String>> _admins = [
    {
      'id': 'ADM-001',
      'name': 'Ayesha Noor',
      'role': 'Super Admin',
      'status': 'Active',
      'email': 'ayesha.noor@admin.popolive.local',
    },
    {
      'id': 'ADM-002',
      'name': 'Tariq Vance',
      'role': 'Super Admin',
      'status': 'Active',
      'email': 'tariq.vance@admin.popolive.local',
    },
    {
      'id': 'ADM-003',
      'name': 'Mina Chen',
      'role': 'Admin',
      'status': 'Active',
      'email': 'mina.chen@admin.popolive.local',
    },
    {
      'id': 'ADM-004',
      'name': 'David Miller',
      'role': 'Moderator',
      'status': 'Active',
      'email': 'david.miller@admin.popolive.local',
    },
    {
      'id': 'ADM-005',
      'name': 'Sarah Al-Mansoor',
      'role': 'Finance Manager',
      'status': 'Active',
      'email': 'sarah.almansoor@admin.popolive.local',
    },
  ];

  // 6 Predefined Roles
  final List<Map<String, dynamic>> _roles = [
    {
      'name': 'Super Admin',
      'desc': 'Unrestricted platform root privileges across all systems.',
      'count': 2,
      'protected': true,
    },
    {
      'name': 'Admin',
      'desc': 'User and host operations, live room policing, and content curation.',
      'count': 2,
      'protected': false,
    },
    {
      'name': 'Moderator',
      'desc': 'Live stream safety, community queue reports, and chat violations.',
      'count': 2,
      'protected': false,
    },
    {
      'name': 'Support Agent',
      'desc': 'Customer support, host onboarding, and identity verification.',
      'count': 2,
      'protected': false,
    },
    {
      'name': 'Finance Manager',
      'desc': 'Coin economics, seller quotas, and host earnings reconciliation.',
      'count': 1,
      'protected': false,
    },
    {
      'name': 'Content Manager',
      'desc': 'Discovery banners, app notices, and event leaderboards.',
      'count': 1,
      'protected': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0516),
      appBar: AppBar(
        backgroundColor: const Color(0xFF160A2D),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFFF0F7B).withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.shield_outlined, color: Color(0xFFFF0F7B), size: 20),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Popo Live Admin',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Operations & Roles Suite',
                  style: TextStyle(color: Colors.white54, fontSize: 10),
                ),
              ],
            ),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Hero Stats 4-Grid
          const Text(
            'PLATFORM OVERVIEW',
            style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildStatCard('Total Users', _stats['totalUsers'], Icons.people_outline, const Color(0xFFFF0F7B)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildStatCard('Live Hosts', _stats['liveHosts'], Icons.mic_none, const Color(0xFFA855F7)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _buildStatCard('Today Live', _stats['todayLive'], Icons.sensors, const Color(0xFF38BDF8)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildStatCard('Reports Queue', _stats['reports'], Icons.flag_outlined, const Color(0xFFFB7185)),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Navigation Pills (Dashboard / Admins / Roles)
          Row(
            children: [
              _buildFilterPill('Dashboard', 0),
              const SizedBox(width: 8),
              _buildFilterPill('Admin Staff', 1),
              const SizedBox(width: 8),
              _buildFilterPill('Roles Hierarchy', 2),
            ],
          ),

          const SizedBox(height: 18),

          // Tab Content
          if (_activeTabIndex == 0 || _activeTabIndex == 1) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Staff Administrator Directory',
                  style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                ),
                Text(
                  '${_admins.length} Staff',
                  style: const TextStyle(color: Color(0xFFFF0F7B), fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ..._admins.map((adm) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF160A2D),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.purple.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: const Color(0xFFFF0F7B).withOpacity(0.2),
                    child: Text(
                      adm['name']!.substring(0, 1),
                      style: const TextStyle(color: Color(0xFFFF0F7B), fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              adm['name']!,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.purple.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                adm['role']!,
                                style: const TextStyle(color: Colors.purpleAccent, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${adm['id']} · ${adm['email']}',
                          style: const TextStyle(color: Colors.white54, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF34D399).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'Active',
                      style: TextStyle(color: Color(0xFF34D399), fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            )),
          ],

          if (_activeTabIndex == 2) ...[
            const Text(
              '6 Standard Platform Roles',
              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            ..._roles.map((r) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF160A2D),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: r['protected'] == true
                      ? const Color(0xFFFF0F7B).withOpacity(0.4)
                      : Colors.purple.withOpacity(0.2),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        r['name'],
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      if (r['protected'] == true)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF0F7B).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            'PROTECTED',
                            style: TextStyle(color: Color(0xFFFF0F7B), fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    r['desc'],
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${r['count']} assigned administrators',
                    style: const TextStyle(color: Colors.white38, fontSize: 11),
                  ),
                ],
              ),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color accent) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF160A2D),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: accent.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label.toUpperCase(),
                style: const TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold),
              ),
              Icon(icon, color: accent, size: 16),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(color: accent, fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterPill(String title, int index) {
    final bool isSelected = _activeTabIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _activeTabIndex = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFFF0F7B) : const Color(0xFF160A2D),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? const Color(0xFFFF0F7B) : Colors.purple.withOpacity(0.25),
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.white70,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
