import 'package:flutter/material.dart';

/// Popo Live — Module 10.1 & 10.2 Admin Home, Roles, User and Host Admin
/// Strictly frontend demo values and local UI state.
/// No backend services, real admin authentication, or real role authorization.
class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int _activeTabIndex = 0; // 0: Dashboard, 1: Users, 2: Hosts, 3: Staff Admins, 4: Roles
  String _userSearchQuery = '';
  String _hostSearchQuery = '';

  // Platform metrics
  final Map<String, dynamic> _stats = {
    'totalUsers': '1,245,320',
    'liveHosts': '8,420',
    'todayLive': '1,264',
    'reports': '56',
  };

  // Sample Users (Module 10.2)
  final List<Map<String, String>> _users = [
    {
      'id': 'U10298462',
      'username': 'User_98462',
      'nickname': 'Amina Live',
      'country': 'Pakistan',
      'status': 'Active',
      'email': 'amina.98462@example.com',
      'wealth': 'Lv.14',
    },
    {
      'id': 'U10298311',
      'username': 'User_Mike',
      'nickname': 'Mike Vance',
      'country': 'United States',
      'status': 'Suspended',
      'email': 'mike.vance@example.com',
      'wealth': 'Lv.8',
    },
    {
      'id': 'U10298715',
      'username': 'Host_Sara',
      'nickname': 'Sara Khan',
      'country': 'United Arab Emirates',
      'status': 'Active',
      'email': 'sara.khan@popohost.local',
      'wealth': 'Lv.22',
    },
    {
      'id': 'U10298721',
      'username': 'Host_Maya',
      'nickname': 'Maya Lin',
      'country': 'Singapore',
      'status': 'Pending',
      'email': 'maya.lin@example.com',
      'wealth': 'Lv.4',
    },
    {
      'id': 'U10298005',
      'username': 'User_Rashid',
      'nickname': 'Rashid Ali',
      'country': 'Saudi Arabia',
      'status': 'Active',
      'email': 'rashid.ali@example.com',
      'wealth': 'Lv.18',
    },
  ];

  // Sample Hosts (Module 10.2)
  final List<Map<String, String>> _hosts = [
    {
      'id': 'H3007542',
      'username': 'Host_Sara',
      'nickname': 'Sara Khan',
      'country': 'United Arab Emirates',
      'hostStatus': 'Active',
      'activityStatus': 'Live Now',
      'tier': 'Tier S',
      'agency': 'Gulf Star Creators',
    },
    {
      'id': 'H3008721',
      'username': 'Host_Maya',
      'nickname': 'Maya Lin',
      'country': 'Singapore',
      'hostStatus': 'Pending',
      'activityStatus': 'Idle',
      'tier': 'Tier C',
      'agency': 'Asia Talent Guild',
    },
    {
      'id': 'H3007612',
      'username': 'Host_Elena',
      'nickname': 'Elena Rostova',
      'country': 'United Kingdom',
      'hostStatus': 'Active',
      'activityStatus': 'In Party Room',
      'tier': 'Tier A',
      'agency': 'Crown Management UK',
    },
    {
      'id': 'H3007890',
      'username': 'Host_Fatima',
      'nickname': 'Fatima Zahra',
      'country': 'Turkey',
      'hostStatus': 'Active',
      'activityStatus': 'Offline',
      'tier': 'Tier B',
      'agency': 'Bosphorus Media',
    },
    {
      'id': 'H3009001',
      'username': 'Host_Bilal',
      'nickname': 'Bilal Khan',
      'country': 'Pakistan',
      'hostStatus': 'Active',
      'activityStatus': 'Live Now',
      'tier': 'Tier S',
      'agency': 'Lahore Rising Stars',
    },
  ];

  // Sample admin list (Module 10.1)
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
                  'User & Host Operations Suite · 10.2',
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
          // Navigation Pills (Dashboard / Users / Hosts / Staff / Roles)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterPill('Dashboard', 0),
                const SizedBox(width: 8),
                _buildFilterPill('Users', 1),
                const SizedBox(width: 8),
                _buildFilterPill('Hosts', 2),
                const SizedBox(width: 8),
                _buildFilterPill('Staff Admins', 3),
                const SizedBox(width: 8),
                _buildFilterPill('Roles', 4),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // TAB 0: Dashboard Overview
          if (_activeTabIndex == 0) ...[
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
          ],

          // TAB 1: User Management (Module 10.2)
          if (_activeTabIndex == 1) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'User Directory',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  '${_users.length} Users',
                  style: const TextStyle(color: Color(0xFFFF0F7B), fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              onChanged: (val) => setState(() => _userSearchQuery = val),
              style: const TextStyle(color: Colors.white, fontSize: 12),
              decoration: InputDecoration(
                hintText: 'Search by ID, username...',
                hintStyle: const TextStyle(color: Colors.white38),
                prefixIcon: const Icon(Icons.search, color: Colors.white38, size: 18),
                filled: true,
                fillColor: const Color(0xFF160A2D),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: Colors.purple.withOpacity(0.3)),
                ),
              ),
            ),
            const SizedBox(height: 14),
            ..._users
                .filterUsers(_userSearchQuery)
                .map((u) => _buildUserCard(u)),
          ],

          // TAB 2: Host Management (Module 10.2)
          if (_activeTabIndex == 2) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Host & Creator Directory',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  '${_hosts.length} Creators',
                  style: const TextStyle(color: Color(0xFFA855F7), fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              onChanged: (val) => setState(() => _hostSearchQuery = val),
              style: const TextStyle(color: Colors.white, fontSize: 12),
              decoration: InputDecoration(
                hintText: 'Search by host ID, username, agency...',
                hintStyle: const TextStyle(color: Colors.white38),
                prefixIcon: const Icon(Icons.search, color: Colors.white38, size: 18),
                filled: true,
                fillColor: const Color(0xFF160A2D),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: Colors.purple.withOpacity(0.3)),
                ),
              ),
            ),
            const SizedBox(height: 14),
            ..._hosts
                .filterHosts(_hostSearchQuery)
                .map((h) => _buildHostCard(h)),
          ],

          // TAB 3: Staff Admins (Module 10.1)
          if (_activeTabIndex == 3) ...[
            const Text(
              'Staff Administrator Directory',
              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
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
                        Text(
                          adm['name']!,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        Text(
                          '${adm['role']} · ${adm['email']}',
                          style: const TextStyle(color: Colors.white54, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )),
          ],

          // TAB 4: Roles (Module 10.1)
          if (_activeTabIndex == 4) ...[
            const Text(
              'Platform Roles Hierarchy',
              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            ..._roles.map((r) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF160A2D),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.purple.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    r['name'],
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    r['desc'],
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildUserCard(Map<String, String> u) {
    final statusColor = u['status'] == 'Active'
        ? const Color(0xFF34D399)
        : u['status'] == 'Suspended'
        ? const Color(0xFFF43F5E)
        : const Color(0xFFFBBF24);

    return Container(
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
              u['username']!.substring(0, 1),
              style: const TextStyle(color: Color(0xFFFF0F7B), fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  u['username']!,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
                Text(
                  '${u['id']} · ${u['country']} · ${u['wealth']}',
                  style: const TextStyle(color: Colors.white54, fontSize: 11),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              u['status']!,
              style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHostCard(Map<String, String> h) {
    final statusColor = h['hostStatus'] == 'Active'
        ? const Color(0xFF34D399)
        : h['hostStatus'] == 'Suspended'
        ? const Color(0xFFF43F5E)
        : const Color(0xFFFBBF24);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF160A2D),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.purple.withOpacity(0.25)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: const Color(0xFFA855F7).withOpacity(0.2),
            child: Text(
              h['username']!.substring(0, 1),
              style: const TextStyle(color: Color(0xFFA855F7), fontWeight: FontWeight.bold),
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
                      h['username']!,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: Colors.purple.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        h['tier']!,
                        style: const TextStyle(color: Colors.purpleAccent, fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                Text(
                  '${h['id']} · ${h['agency']} · ${h['activityStatus']}',
                  style: const TextStyle(color: Colors.white54, fontSize: 11),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              h['hostStatus']!,
              style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ),
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

extension UserFilterExt on List<Map<String, String>> {
  List<Map<String, String>> filterUsers(String query) {
    if (query.trim().isEmpty) return this;
    final q = query.toLowerCase().trim();
    return where((u) =>
      u['username']!.toLowerCase().contains(q) ||
      u['id']!.toLowerCase().contains(q) ||
      u['email']!.toLowerCase().contains(q)
    ).toList();
  }
}

extension HostFilterExt on List<Map<String, String>> {
  List<Map<String, String>> filterHosts(String query) {
    if (query.trim().isEmpty) return this;
    final q = query.toLowerCase().trim();
    return where((h) =>
      h['username']!.toLowerCase().contains(q) ||
      h['id']!.toLowerCase().contains(q) ||
      h['agency']!.toLowerCase().contains(q)
    ).toList();
  }
}
