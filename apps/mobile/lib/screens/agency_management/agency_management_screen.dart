import 'package:flutter/material.dart';
import '../../api/api.dart';
import 'agent_earnings_screen.dart';
import 'coin_seller_screen.dart';
import 'withdrawal_screen.dart';
import '../../design/design_fixtures.dart';
import '../live/watch_history_screen.dart';
import '../../widgets/popo_error_state.dart';

/// Popo Live — Phase 4 Module 8: Agency Management Screen
/// Guild & Agency Administration, Member Host Management, Approval Workflow, and Agency Registration.
class AgencyManagementScreen extends StatefulWidget {
  const AgencyManagementScreen({super.key});

  @override
  State<AgencyManagementScreen> createState() => _AgencyManagementScreenState();
}

class _AgencyManagementScreenState extends State<AgencyManagementScreen> {
  bool _isLoading = true;
  String? _errorMessage;

  Map<String, dynamic>? _agency;
  String _roleInAgency = 'none'; // 'admin', 'member', 'pending', 'none'
  String _selectedTab = 'dashboard';
  String _statusFilter = 'All';
  String _searchQuery = '';

  List<dynamic> _hosts = [];
  bool _isLoadingHosts = false;

  @override
  void initState() {
    super.initState();
    _fetchAgencyInfo();
  }

  Future<void> _fetchAgencyInfo() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (DesignFixtures.isError) {
        throw const DesignFixtureException(
          message: 'Agency management portal error [ERR_AGENCY_PORTAL_403]',
        );
      }

      if (DesignFixtures.isEmpty) {
        setState(() {
          _agency = null;
          _roleInAgency = 'none';
          _hosts = [];
          _isLoading = false;
        });
        return;
      }

      final fixtureAgency = DesignFixtures.agencyInfo;
      final fixtureMembers = DesignFixtures.agencyMembers;

      final agencyMap = {
        'id': fixtureAgency.agencyId,
        'agencyCode': fixtureAgency.agencyCode,
        'name': fixtureAgency.agencyName,
        'status': fixtureAgency.settlementStatus.contains('Active') ? 'ACTIVE' : 'PENDING',
        'adminNickname': fixtureAgency.agentLeader,
        'totalHosts': fixtureAgency.totalActiveHosts,
        'activeHosts': fixtureAgency.totalActiveHosts,
        'pendingHosts': 2,
        'announcement': fixtureAgency.announcement,
      };

      final hostsList = fixtureMembers.map((m) => {
        'id': m.id,
        'userId': m.userId,
        'nickname': m.nickname,
        'avatarUrl': m.avatarUrl,
        'hostLevel': m.hostLevel,
        'monthlyDiamonds': m.monthlyDiamonds,
        'status': m.status,
      }).toList();

      setState(() {
        _agency = agencyMap;
        _roleInAgency = 'admin';
        _hosts = hostsList;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e
            .toString()
            .replaceFirst('Exception: ', '')
            .replaceFirst('DesignFixtureException: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchHosts(String agencyId) async {
    setState(() => _isLoadingHosts = true);
    try {
      var filtered = DesignFixtures.agencyMembers;
      if (_statusFilter != 'All') {
        filtered = filtered
            .where((m) => m.status.toLowerCase() == _statusFilter.toLowerCase())
            .toList();
      }
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        filtered = filtered
            .where((m) =>
                m.nickname.toLowerCase().contains(q) ||
                m.userId.toLowerCase().contains(q))
            .toList();
      }
      if (!mounted) return;
      setState(() {
        _hosts = filtered
            .map((m) => {
                  'id': m.id,
                  'userId': m.userId,
                  'nickname': m.nickname,
                  'avatarUrl': m.avatarUrl,
                  'hostLevel': m.hostLevel,
                  'monthlyDiamonds': m.monthlyDiamonds,
                  'status': m.status,
                })
            .toList();
        _isLoadingHosts = false;
      });
    } catch (_) {
      if (mounted) setState(() => _isLoadingHosts = false);
    }
  }

  Future<void> _handleApproveHost(String memberId) async {
    if (_agency == null) return;
    try {
      final res = await AgencyService.instance.approveMember(
        agencyId: _agency!['id'],
        memberId: memberId,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.data?['message']?.toString() ?? 'Host approved successfully!'),
          backgroundColor: const Color(0xFF34D399),
        ),
      );
      _fetchAgencyInfo();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: const Color(0xFFFF1A6C),
        ),
      );
    }
  }

  Future<void> _handleRejectHost(String memberId) async {
    if (_agency == null) return;
    try {
      final res = await AgencyService.instance.rejectMember(
        agencyId: _agency!['id'],
        memberId: memberId,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.data?['message']?.toString() ?? 'Host request rejected.'),
          backgroundColor: const Color(0xFFFFD166),
        ),
      );
      _fetchAgencyInfo();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: const Color(0xFFFF1A6C),
        ),
      );
    }
  }

  Future<void> _handleRemoveHost(String memberId) async {
    if (_agency == null) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B0C35),
        title: const Text('Remove Host', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: const Text(
          'Are you sure you want to remove this host from the agency?',
          style: TextStyle(color: Color(0xFFBBA9D6)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF1A6C)),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      final res = await AgencyService.instance.removeMember(
        agencyId: _agency!['id'],
        memberId: memberId,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.data?['message']?.toString() ?? 'Host removed.'),
          backgroundColor: const Color(0xFFFF1A6C),
        ),
      );
      _fetchAgencyInfo();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: const Color(0xFFFF1A6C),
        ),
      );
    }
  }

  Future<void> _showRegisterAgencyDialog() async {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();

    final registered = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B0C35),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text(
          'Register New Agency',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Agency Name *',
                  labelStyle: TextStyle(color: Color(0xFFBBA9D6)),
                  hintText: 'e.g. Apex Talent Collective',
                  hintStyle: TextStyle(color: Colors.white24),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: descCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Agency Description',
                  labelStyle: TextStyle(color: Color(0xFFBBA9D6)),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: emailCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Business Email',
                  labelStyle: TextStyle(color: Color(0xFFBBA9D6)),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: phoneCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Contact Phone',
                  labelStyle: TextStyle(color: Color(0xFFBBA9D6)),
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Note: New agency registrations are reviewed and approved by platform administrators.',
                style: TextStyle(color: Color(0xFFFFD166), fontSize: 11),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF1A6C)),
            onPressed: () {
              if (nameCtrl.text.trim().length < 3) return;
              Navigator.pop(ctx, true);
            },
            child: const Text('Submit Application', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (registered == true) {
      try {
        final res = await AgencyService.instance.registerAgency(
          name: nameCtrl.text.trim(),
          description: descCtrl.text.trim(),
          contactEmail: emailCtrl.text.trim(),
          contactPhone: phoneCtrl.text.trim(),
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.data?['message']?.toString() ?? 'Agency registered! Status is pending approval.'),
            backgroundColor: const Color(0xFF34D399),
          ),
        );
        _fetchAgencyInfo();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: const Color(0xFFFF1A6C),
          ),
        );
      }
    }
  }

  Future<void> _showJoinAgencyDialog() async {
    final codeCtrl = TextEditingController();

    final joined = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B0C35),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Join an Agency', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: codeCtrl,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Agency Code or ID',
                labelStyle: TextStyle(color: Color(0xFFBBA9D6)),
                hintText: 'e.g. AG-2048',
                hintStyle: TextStyle(color: Colors.white24),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF1A6C)),
            onPressed: () {
              if (codeCtrl.text.trim().isEmpty) return;
              Navigator.pop(ctx, true);
            },
            child: const Text('Send Join Request', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (joined == true) {
      try {
        final res = await AgencyService.instance.requestJoinAgency(codeCtrl.text.trim());
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.data?['message']?.toString() ?? 'Join request submitted!'),
            backgroundColor: const Color(0xFF34D399),
          ),
        );
        _fetchAgencyInfo();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: const Color(0xFFFF1A6C),
          ),
        );
      }
    }
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
          'Agency Management',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchAgencyInfo,
        color: const Color(0xFFFF1A6C),
        backgroundColor: const Color(0xFF160830),
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFFF1A6C)),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: PopoErrorState(
          key: const Key('agency_error_state'),
          title: 'Agency Directory Unavailable',
          message: _errorMessage!,
          retryText: 'Retry',
          onRetry: _fetchAgencyInfo,
        ),
      );
    }

    // If user does not belong to any agency
    if (_agency == null) {
      return ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF260D4A), Color(0xFF140728)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.purpleAccent.withOpacity(0.3)),
            ),
            child: Column(
              children: [
                const Icon(Icons.shield_outlined, color: Color(0xFF00E5FF), size: 54),
                const SizedBox(height: 14),
                const Text(
                  'Join or Register an Agency',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Agencies support creators with professional growth, streaming advice, and exclusive event invitations.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFFBBA9D6), fontSize: 13),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFF1A6C),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: const StadiumBorder(),
                    ),
                    onPressed: _showJoinAgencyDialog,
                    icon: const Icon(Icons.group_add_rounded),
                    label: const Text('Join an Agency', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF00E5FF),
                      side: const BorderSide(color: Color(0xFF00E5FF)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: const StadiumBorder(),
                    ),
                    onPressed: _showRegisterAgencyDialog,
                    icon: const Icon(Icons.add_business_rounded),
                    label: const Text('Apply to Register Agency', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    final agency = _agency!;
    final name = agency['name'] ?? 'Agency';
    final code = agency['agencyCode'] ?? 'AG-0000';
    final status = agency['status']?.toString().toUpperCase() ?? 'PENDING';
    final adminName = agency['adminNickname'] ?? 'Administrator';
    final totalHosts = agency['totalHosts'] ?? 0;
    final activeHosts = agency['activeHosts'] ?? 0;
    final pendingHosts = agency['pendingHosts'] ?? 0;
    final announcement = agency['announcement'] ?? 'No platform announcements yet.';
    final isAdmin = _roleInAgency == 'admin';

    Color statusColor = const Color(0xFF34D399);
    if (status == 'PENDING') statusColor = const Color(0xFFFFD166);
    if (status == 'SUSPENDED' || status == 'REJECTED') statusColor = const Color(0xFFFF1A6C);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Agency Hero Card
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF260D4A), Color(0xFF140728)],
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
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFFFC107), width: 3),
                      color: const Color(0xFF2A124C),
                    ),
                    child: const Icon(Icons.business_rounded, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Agency ID: $code · Admin: $adminName',
                          style: const TextStyle(color: Color(0xFFBBA9D6), fontSize: 11),
                        ),
                        const SizedBox(height: 6),
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
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Metrics Row
        Row(
          children: [
            _statCard('$totalHosts', 'Total Hosts', const Color(0xFF00E5FF)),
            const SizedBox(width: 8),
            _statCard('$activeHosts', 'Active', const Color(0xFF34D399)),
            const SizedBox(width: 8),
            _statCard('$pendingHosts', 'Pending', const Color(0xFFFFD166)),
          ],
        ),

        const SizedBox(height: 16),

        // Navigation Tabs
        Wrap(
          spacing: 8,
          children: ['dashboard', 'hosts', 'profile', 'support'].map((tab) {
            final active = _selectedTab == tab;
            return ChoiceChip(
              label: Text(tab.toUpperCase()),
              selected: active,
              selectedColor: const Color(0xFFFF1A6C),
              backgroundColor: const Color(0xFF180A31),
              labelStyle: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
              onSelected: (_) => setState(() => _selectedTab = tab),
            );
          }).toList(),
        ),

        const SizedBox(height: 16),

        if (_selectedTab == 'dashboard') ...[
          // Announcement Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF16082E),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.purpleAccent.withOpacity(0.2)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.campaign_rounded, color: Color(0xFFFFC107), size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Agency Bulletin',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  announcement,
                  style: const TextStyle(color: Color(0xFFCBB9E6), fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          _navTile('Host Management', 'View and manage registered hosts', () {
            setState(() => _selectedTab = 'hosts');
          }),
          _navTile('Agent Earnings & Commission', 'View earnings, balance, and commission breakdown', () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AgentEarningsScreen()),
            );
          }),
          _navTile('Coin Seller Portal', 'Manage coin inventory and transfer coins to users', () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CoinSellerScreen()),
            );
          }),
          _navTile('Earnings Withdrawal', 'Manage payout methods and submit withdrawal requests', () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const WithdrawalScreen()),
            );
          }),
          _navTile('Broadcast Watch History', 'Past live broadcast rooms and host sessions', () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const WatchHistoryScreen()),
            );
          }),
          _navTile('Agency Profile', 'View contract details and contact info', () {
            setState(() => _selectedTab = 'profile');
          }),
        ] else if (_selectedTab == 'hosts') ...[
          // Search & Filter
          TextField(
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search hosts by nickname or ID...',
              hintStyle: const TextStyle(color: Colors.white38),
              prefixIcon: const Icon(Icons.search, color: Colors.white38),
              filled: true,
              fillColor: const Color(0xFF16082E),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
            ),
            onChanged: (v) {
              _searchQuery = v;
              _fetchHosts(agency['id']);
            },
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            children: ['All', 'Active', 'Pending'].map((st) {
              final active = _statusFilter == st;
              return ChoiceChip(
                label: Text(st),
                selected: active,
                selectedColor: const Color(0xFFFF1A6C),
                backgroundColor: const Color(0xFF16082E),
                labelStyle: const TextStyle(color: Colors.white, fontSize: 11),
                onSelected: (_) {
                  setState(() => _statusFilter = st);
                  _fetchHosts(agency['id']);
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 14),

          if (_isLoadingHosts)
            const Center(child: CircularProgressIndicator(color: Color(0xFFFF1A6C)))
          else if (_hosts.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF130728),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Center(
                child: Text('No hosts found in this filter.', style: TextStyle(color: Color(0xFFBBA9D6))),
              ),
            )
          else
            ..._hosts.map((h) {
              final String memberId = h['id'] ?? '';
              final String name = h['nickname'] ?? 'Host';
              final String poppoId = h['poppoId'] ?? '';
              final String memberStatus = h['status']?.toString().toUpperCase() ?? 'ACTIVE';
              final bool isPending = memberStatus == 'PENDING';
              final String avatar = h['avatarUrl'] ?? '';

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF16082E),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.purpleAccent.withOpacity(0.18)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: const Color(0xFF281347),
                      backgroundImage: avatar.startsWith('http') ? NetworkImage(avatar) : null,
                      child: !avatar.startsWith('http') ? const Icon(Icons.person, color: Colors.white) : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          Text('ID: $poppoId', style: const TextStyle(color: Color(0xFFBBA9D6), fontSize: 11)),
                        ],
                      ),
                    ),
                    if (isAdmin && isPending) ...[
                      IconButton(
                        icon: const Icon(Icons.check_circle_rounded, color: Color(0xFF34D399)),
                        onPressed: () => _handleApproveHost(memberId),
                        tooltip: 'Approve',
                      ),
                      IconButton(
                        icon: const Icon(Icons.cancel_rounded, color: Color(0xFFFF1A6C)),
                        onPressed: () => _handleRejectHost(memberId),
                        tooltip: 'Reject',
                      ),
                    ] else if (isAdmin) ...[
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, color: Colors.white38),
                        onPressed: () => _handleRemoveHost(memberId),
                        tooltip: 'Remove',
                      ),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white12,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          memberStatus,
                          style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ],
                ),
              );
            }),
        ] else if (_selectedTab == 'profile') ...[
          _profileRow('Agency Code', code),
          _profileRow('Administrator', adminName),
          _profileRow('Contact Email', agency['contactEmail'] ?? 'management@starcreators.agency'),
          _profileRow('Contact Phone', agency['contactPhone'] ?? '+92 300 1234567'),
          _profileRow('Revenue Commission', '${agency['commissionRate'] ?? 10}%'),
        ] else if (_selectedTab == 'support') ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF16082E),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text(
              'For agency inquiries, dispute resolutions, and partner certifications, please contact Popo Live Creator Support.',
              style: TextStyle(color: Color(0xFFCBB9E6), fontSize: 13),
            ),
          ),
        ],
      ],
    );
  }

  Widget _statCard(String value, String label, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF16082E),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(color: Color(0xFFBBA9D6), fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _navTile(String title, String subtitle, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF16082E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.purpleAccent.withOpacity(0.18)),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: ListTile(
          title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
          subtitle: Text(subtitle, style: const TextStyle(color: Color(0xFFBBA9D6), fontSize: 11)),
          trailing: const Icon(Icons.chevron_right, color: Colors.white54),
          onTap: onTap,
        ),
      ),
    );
  }

  Widget _profileRow(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF16082E),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFFBBA9D6), fontSize: 12)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
  }
}
