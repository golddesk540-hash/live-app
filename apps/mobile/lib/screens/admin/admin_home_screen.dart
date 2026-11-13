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

  // Sample Live Sessions (Module 10.3)
  final List<Map<String, String>> _liveSessions = [
    {
      'id': 'LIV-88201',
      'room': '88201',
      'username': 'Host_Lina',
      'title': 'Acoustic chill & sing-along night ✨',
      'category': 'Entertainment',
      'viewers': '12.4K',
      'duration': '1h 14m',
      'status': 'LIVE',
    },
    {
      'id': 'LIV-88202',
      'room': '88202',
      'username': 'Host_Riya',
      'title': 'Bollywood hits & piano live sessions 🎹',
      'category': 'Music',
      'viewers': '8.9K',
      'duration': '58m',
      'status': 'LIVE',
    },
    {
      'id': 'LIV-88203',
      'room': '88203',
      'username': 'Host_Emma',
      'title': 'Late night coffee & real talks ☕',
      'category': 'Chat',
      'viewers': '6.7K',
      'duration': '42m',
      'status': 'LIVE',
    },
    {
      'id': 'LIV-88021',
      'room': '88021',
      'username': 'Host_Sara',
      'title': 'Official Popo Partner Gala & PK 🏆',
      'category': 'Entertainment',
      'viewers': '15.2K',
      'duration': '1h 55m',
      'status': 'LIVE',
    },
  ];

  // Sample Reports (Module 10.4)
  final List<Map<String, String>> _reports = [
    {
      'id': '#RP98421',
      'reporter': 'User_98462',
      'reported': 'Host_Elena',
      'category': 'Unsuitable Content',
      'status': 'Pending',
      'priority': 'High',
      'time': '2m ago',
    },
    {
      'id': '#RP98420',
      'reporter': 'User_Mike',
      'reported': 'User_Tariq99',
      'category': 'Harassment & Abuse',
      'status': 'Under Review',
      'priority': 'Urgent',
      'time': '6m ago',
    },
    {
      'id': '#RP98419',
      'reporter': 'Host_Sara',
      'reported': 'User_Devon',
      'category': 'Offensive Language',
      'status': 'Pending',
      'priority': 'Medium',
      'time': '10m ago',
    },
    {
      'id': '#RP98418',
      'reporter': 'User_Mike',
      'reported': 'User_SpamBot1',
      'category': 'Spam & Promotion',
      'status': 'Pending',
      'priority': 'Low',
      'time': '16m ago',
    },
    {
      'id': '#RP98414',
      'reporter': 'Host_Sara',
      'reported': 'Host_Carlos',
      'category': 'Room Rule Violation',
      'status': 'Resolved',
      'priority': 'Low',
      'time': '2h ago',
    },
  ];

  // Sample Safety Cases (Module 10.5)
  final List<Map<String, String>> _safetyCases = [
    {
      'id': '#CS-7701',
      'user': 'User_98462',
      'category': 'Age Verification Review',
      'priority': 'Urgent',
      'status': 'Under Review',
      'time': '15m ago',
      'host': 'Host_Elena',
    },
    {
      'id': '#CS-7702',
      'user': 'User_Tariq99',
      'category': 'Inappropriate Interaction',
      'priority': 'High',
      'status': 'Under Review',
      'time': '1h ago',
      'host': 'None',
    },
    {
      'id': '#CS-7703',
      'user': 'User_Devon',
      'category': 'Underage Stream Flag',
      'priority': 'High',
      'status': 'Pending',
      'time': '1.5h ago',
      'host': 'None',
    },
    {
      'id': '#CS-7705',
      'user': 'Popo_Support_Official_Fake',
      'category': 'Grooming Prevention Alert',
      'priority': 'Urgent',
      'status': 'Escalated',
      'time': '3h ago',
      'host': 'None',
    },
    {
      'id': '#CS-7704',
      'user': 'User_SpamBot1',
      'category': 'Restricted Contact Violation',
      'priority': 'Medium',
      'status': 'Resolved',
      'time': '2.5h ago',
      'host': 'None',
    },
  ];

  // Sample Content & Economy Items (Module 10.6)
  final List<Map<String, String>> _economyGifts = [
    {
      'id': 'GFT-ROSE-01',
      'name': 'Red Velvet Rose',
      'category': 'Popular',
      'coins': '10',
      'status': 'Active',
      'usage': '452K',
    },
    {
      'id': 'GFT-LOVE-02',
      'name': 'Heart Sparkle Fireworks',
      'category': 'Romantic',
      'coins': '99',
      'status': 'Active',
      'usage': '184K',
    },
    {
      'id': 'GFT-CAR-03',
      'name': 'Cyber Sports Car',
      'category': 'Luxury',
      'coins': '2,999',
      'status': 'Active',
      'usage': '24.8K',
    },
    {
      'id': 'GFT-YACHT-04',
      'name': 'Ocean Sovereign Yacht',
      'category': 'Luxury',
      'coins': '9,999',
      'status': 'Active',
      'usage': '8.2K',
    },
    {
      'id': 'GFT-DRAGON-05',
      'name': 'Mythic Golden Dragon',
      'category': 'Special',
      'coins': '19,999',
      'status': 'Active',
      'usage': '3.4K',
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
                  'User, Host, Live, Safety, Economy & Partner Suite · 10.7',
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
          // Navigation Pills (Dashboard / Users / Hosts / Live Monitor / Reports / Child Safety / Economy / Agency / Staff / Roles)
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
                _buildFilterPill('Live Monitor', 5),
                const SizedBox(width: 8),
                _buildFilterPill('Reports', 6),
                const SizedBox(width: 8),
                _buildFilterPill('Child Safety', 7),
                const SizedBox(width: 8),
                _buildFilterPill('Content & Economy', 8),
                const SizedBox(width: 8),
                _buildFilterPill('Agency & Payouts', 9),
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

          // TAB 5: Live Monitor (Module 10.3)
          if (_activeTabIndex == 5) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Live Video Streams',
                  style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.redAccent.withOpacity(0.5)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.fiber_manual_record, color: Colors.redAccent, size: 8),
                      SizedBox(width: 4),
                      Text('1,264 LIVE', style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._liveSessions.map((s) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF160A2D),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.purple.withOpacity(0.25)),
              ),
              child: Row(
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: const Color(0xFFFF0F7B).withOpacity(0.2),
                        child: Text(
                          s['username']!.replaceAll('Host_', '').substring(0, 1),
                          style: const TextStyle(color: Color(0xFFFF0F7B), fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                      Positioned(
                        top: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              s['username']!,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFF0F7B).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                s['category']!,
                                style: const TextStyle(color: Color(0xFFFF0F7B), fontSize: 9, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          s['title']!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Room #${s['room']} · ${s['duration']}',
                          style: const TextStyle(color: Colors.white38, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0E061E),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.purple.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.remove_red_eye_outlined, color: Color(0xFFFF0F7B), size: 12),
                        const SizedBox(width: 4),
                        Text(
                          s['viewers']!,
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            )),
          ],

          // TAB 6: REPORTS QUEUE (Module 10.4)
          if (_activeTabIndex == 6) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'REPORT QUEUE · INCIDENT TRIAGE',
                  style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
                  ),
                  child: const Text('56 Active', style: TextStyle(color: Color(0xFFFCD34D), fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._reports.map((rep) {
              final isPending = rep['status'] == 'Pending';
              final isReview = rep['status'] == 'Under Review';
              final isUrgent = rep['priority'] == 'Urgent';
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF160A2D),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isUrgent ? const Color(0xFFF43F5E).withOpacity(0.5) : const Color(0xFFA855F7).withOpacity(0.2),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Report ${rep['id']}',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                        ),
                        Text(
                          rep['time']!,
                          style: const TextStyle(color: Colors.white38, fontSize: 10),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                rep['category']!,
                                style: const TextStyle(color: Color(0xFFFF0F7B), fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Target: ${rep['reported']} · By ${rep['reporter']}',
                                style: const TextStyle(color: Colors.white70, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isPending
                                ? const Color(0xFFF59E0B).withOpacity(0.2)
                                : isReview
                                    ? const Color(0xFFA855F7).withOpacity(0.2)
                                    : const Color(0xFF10B981).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isPending
                                  ? const Color(0xFFF59E0B).withOpacity(0.4)
                                  : isReview
                                      ? const Color(0xFFA855F7).withOpacity(0.4)
                                      : const Color(0xFF10B981).withOpacity(0.4),
                            ),
                          ),
                          child: Text(
                            rep['status']!,
                            style: TextStyle(
                              color: isPending
                                  ? const Color(0xFFFCD34D)
                                  : isReview
                                      ? const Color(0xFFD8B4FE)
                                      : const Color(0xFF6EE7B7),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }).toList(),
          ],

          // TAB 7: CHILD SAFETY OPERATIONS (Module 10.5)
          if (_activeTabIndex == 7) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'CHILD SAFETY OPERATIONS · TRUST & SAFETY',
                  style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF43F5E).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.4)),
                  ),
                  child: const Text('24 Cases', style: TextStyle(color: Color(0xFFFDA4AF), fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._safetyCases.map((sc) {
              final isUrgent = sc['priority'] == 'Urgent';
              final isEscalated = sc['status'] == 'Escalated';
              final isResolved = sc['status'] == 'Resolved';
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF160A2D),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isUrgent ? const Color(0xFFF43F5E).withOpacity(0.5) : const Color(0xFFA855F7).withOpacity(0.2),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Safety Case ${sc['id']}',
                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                        ),
                        Text(
                          sc['time']!,
                          style: const TextStyle(color: Colors.white38, fontSize: 10),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                sc['category']!,
                                style: const TextStyle(color: Color(0xFFFF0F7B), fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Target: ${sc['user']}',
                                style: const TextStyle(color: Colors.white70, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isUrgent || isEscalated
                                ? const Color(0xFFF43F5E).withOpacity(0.2)
                                : isResolved
                                    ? const Color(0xFF10B981).withOpacity(0.2)
                                    : const Color(0xFFA855F7).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isUrgent || isEscalated
                                  ? const Color(0xFFF43F5E).withOpacity(0.4)
                                  : isResolved
                                      ? const Color(0xFF10B981).withOpacity(0.4)
                                      : const Color(0xFFA855F7).withOpacity(0.4),
                            ),
                          ),
                          child: Text(
                            sc['status']!,
                            style: TextStyle(
                              color: isUrgent || isEscalated
                                  ? const Color(0xFFFDA4AF)
                                  : isResolved
                                      ? const Color(0xFF6EE7B7)
                                      : const Color(0xFFD8B4FE),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }).toList(),
          ],

          // TAB 8: CONTENT & ECONOMY ADMIN (Module 10.6)
          if (_activeTabIndex == 8) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'CONTENT & ECONOMY · COINS & GIFTS',
                  style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
                  ),
                  child: const Text('14.8M Coins', style: TextStyle(color: Color(0xFFFCD34D), fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Hub Cards Quick Row
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF160A2D),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFFF0F7B).withOpacity(0.3)),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.play_circle_outline, color: Color(0xFFFF0F7B), size: 20),
                        SizedBox(height: 6),
                        Text('Live Categories', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        Text('7 Active Topics', style: TextStyle(color: Colors.white54, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF160A2D),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFA855F7).withOpacity(0.3)),
                    ),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.image_outlined, color: Color(0xFFA855F7), size: 20),
                        SizedBox(height: 6),
                        Text('Banners & Promos', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        Text('21 Carousels', style: TextStyle(color: Colors.white54, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Text(
              'Interactive Virtual Gifts Catalog',
              style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            ..._economyGifts.map((g) {
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF160A2D),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.purple.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFF0F7B).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.card_giftcard, color: Color(0xFFFF0F7B), size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            g['name']!,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          Text(
                            '${g['category']} · Used ${g['usage']} times',
                            style: const TextStyle(color: Colors.white54, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0E061E),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.monetization_on_outlined, color: Color(0xFFF59E0B), size: 12),
                          const SizedBox(width: 4),
                          Text(
                            '${g['coins']} Coins',
                            style: const TextStyle(color: Color(0xFFFCD34D), fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ],

          // TAB 9: AGENCY, SELLER & PAYOUT ADMIN (Module 10.7)
          if (_activeTabIndex == 9) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'AGENCY, SELLER & PAYOUT ADMIN',
                  style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF0F7B).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFF0F7B).withOpacity(0.4)),
                  ),
                  child: const Text('22 Claims', style: TextStyle(color: Color(0xFFFF7BB0), fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Primary 4 Hub Cards matching 10_07 Reference
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF160A2D),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.blueAccent.withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            CircleAvatar(
                              radius: 14,
                              backgroundColor: Colors.blueAccent.withOpacity(0.2),
                              child: const Icon(Icons.people, color: Colors.blueAccent, size: 14),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                              decoration: BoxDecoration(color: const Color(0xFF34D399).withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                              child: const Text('Active', style: TextStyle(color: Color(0xFF34D399), fontSize: 9, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text('Agency Alpha', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        const Text('AG1001 · 48 Hosts', style: TextStyle(color: Colors.white54, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF160A2D),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.purpleAccent.withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            CircleAvatar(
                              radius: 14,
                              backgroundColor: Colors.purpleAccent.withOpacity(0.2),
                              child: const Icon(Icons.apartment, color: Colors.purpleAccent, size: 14),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                              decoration: BoxDecoration(color: const Color(0xFF34D399).withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                              child: const Text('Active', style: TextStyle(color: Color(0xFF34D399), fontSize: 9, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text('Agency Prime', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        const Text('AG1002 · 35 Hosts', style: TextStyle(color: Colors.white54, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF160A2D),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFFF0F7B).withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            CircleAvatar(
                              radius: 14,
                              backgroundColor: const Color(0xFFFF0F7B).withOpacity(0.2),
                              child: const Icon(Icons.storefront, color: Color(0xFFFF0F7B), size: 14),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                              decoration: BoxDecoration(color: const Color(0xFF34D399).withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                              child: const Text('Active', style: TextStyle(color: Color(0xFF34D399), fontSize: 9, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text('Seller_Rahul', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        const Text('SL2001 · \$14.5k Sales', style: TextStyle(color: Colors.white54, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF160A2D),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            CircleAvatar(
                              radius: 14,
                              backgroundColor: const Color(0xFFF59E0B).withOpacity(0.2),
                              child: const Icon(Icons.receipt_long, color: Color(0xFFF59E0B), size: 14),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                              decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                              child: const Text('Processing', style: TextStyle(color: Color(0xFFFCD34D), fontSize: 9, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text('Payout Request', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        const Text('#PYS-8421 · \$1,250', style: TextStyle(color: Colors.white54, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'PAYOUT REQUESTS QUEUE',
              style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF160A2D),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.purple.withOpacity(0.25)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: const Color(0xFFFF0F7B).withOpacity(0.2),
                    child: const Icon(Icons.account_balance_wallet, color: Color(0xFFFF0F7B), size: 18),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('#PYS-8421 · Seller_Rahul', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('Bank Transfer (Meezan Bank) · PK64MEZN00...1234', style: TextStyle(color: Colors.white54, fontSize: 11)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0E061E),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                    ),
                    child: const Text('\$1,250 USD', style: TextStyle(color: Color(0xFF34D399), fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
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
