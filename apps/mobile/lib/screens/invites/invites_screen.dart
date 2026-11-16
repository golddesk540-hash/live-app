import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/square/square_service.dart';

/// Popo Live — Module 8.8 Invites (Flutter parity view)
/// Displays personal invite code/link, editable message,
/// and live Fan Club invitations with accept/reject responses.
class InvitesScreen extends StatefulWidget {
  const InvitesScreen({super.key});

  @override
  State<InvitesScreen> createState() => _InvitesScreenState();
}

class _InvitesScreenState extends State<InvitesScreen> {
  static const String demoCode = 'AB82K';
  static const String demoLink = 'https://popolive.app/invite/AB82K';
  static const String defaultMessage =
      'Join me on Popo Live!\n\nWatch live streams, meet new people, enjoy party rooms and connect with friends.\n\nJoin using my invitation link:\nhttps://popolive.app/invite/AB82K';

  late final TextEditingController _messageController;
  int _selectedTab = 0;
  List<Map<String, dynamic>> _invites = [];
  bool _isLoadingInvites = false;

  @override
  void initState() {
    super.initState();
    _messageController = TextEditingController(text: defaultMessage);
    _loadInvites();
  }

  Future<void> _loadInvites() async {
    setState(() => _isLoadingInvites = true);
    try {
      final list = await SquareService.instance.fetchInvites();
      if (mounted) {
        setState(() {
          _invites = list;
          _isLoadingInvites = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingInvites = false);
    }
  }

  Future<void> _respondToInvite(String inviteId, String action) async {
    try {
      await SquareService.instance.respondToInvite(inviteId, action: action);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(action == 'accept' ? 'Fan Club invitation accepted!' : 'Invitation declined'),
          backgroundColor: const Color(0xFF1F0E3D),
        ),
      );
      _loadInvites();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _copyText(String value, String label) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied!'),
        backgroundColor: const Color(0xFF1F0E3D),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D031B),
      appBar: AppBar(
        backgroundColor: const Color(0xFF120624),
        title: const Text(
          'Invite Friends',
          style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() => _selectedTab = 2);
              _loadInvites();
            },
            child: const Text(
              'History',
              style: TextStyle(color: Color(0xFFFF4D8D), fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [
            const Text(
              'Grow your Popo Live circle',
              style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 13),
            ),
            const SizedBox(height: 12),
            SegmentedButton<int>(
              style: SegmentedButton.styleFrom(
                backgroundColor: const Color(0xFF180A33),
                selectedBackgroundColor: const Color(0xFFFF1A6C),
                selectedForegroundColor: Colors.white,
                foregroundColor: const Color(0xFFD8B4FE),
              ),
              segments: const [
                ButtonSegment(value: 0, label: Text('Invite')),
                ButtonSegment(value: 1, label: Text('Contacts')),
                ButtonSegment(value: 2, label: Text('History')),
              ],
              selected: {_selectedTab},
              onSelectionChanged: (v) {
                setState(() => _selectedTab = v.first);
                if (v.first == 2) _loadInvites();
              },
            ),
            const SizedBox(height: 16),
            if (_selectedTab == 2)
              _buildHistoryView()
            else
              _buildInviteEditorView(),
          ],
        ),
      ),
    );
  }

  Widget _buildInviteEditorView() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF180A33),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.purpleAccent.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Good times are better together',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Demo Code: $demoCode',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
              TextButton(
                onPressed: () => _copyText(demoCode, 'Invite code'),
                child: const Text('Copy Code'),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  'popolive.app/invite/$demoCode',
                  style: TextStyle(color: Color(0xFFFF4D8D)),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              ElevatedButton(
                onPressed: () => _copyText(demoLink, 'Invite link'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF1A6C),
                ),
                child: const Text('Copy Link'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _messageController,
            maxLines: 4,
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: const InputDecoration(
              labelText: 'Invite Message',
              labelStyle: TextStyle(color: Color(0xFFD8B4FE)),
              border: OutlineInputBorder(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryView() {
    if (_isLoadingInvites) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(color: Color(0xFFFF1A6C)),
        ),
      );
    }

    if (_invites.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF180A33),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Column(
          children: [
            Icon(Icons.mark_email_read_outlined, color: Color(0xFFD8B4FE), size: 40),
            SizedBox(height: 12),
            Text(
              'No Fan Club invitations yet',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 4),
            Text(
              'When hosts invite you to join their VIP Fan Club, alerts will appear here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
            ),
          ],
        ),
      );
    }

    return Column(
      children: _invites.map((inv) {
        final isPending = inv['status'] == 'pending';
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF180A33),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.purpleAccent.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const CircleAvatar(
                    radius: 16,
                    backgroundColor: Color(0xFFFF1A6C),
                    child: Icon(Icons.star, color: Colors.white, size: 16),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          inv['clubName']?.toString() ?? 'Fan Club',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        Text(
                          'Invited by ${inv['inviterName'] ?? 'Host'} · Badge: ${inv['badgeLabel'] ?? 'VIP'}',
                          style: const TextStyle(color: Color(0xFFD8B4FE), fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isPending ? const Color(0xFF28124D) : Colors.green.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      inv['status']?.toString().toUpperCase() ?? 'PENDING',
                      style: TextStyle(
                        color: isPending ? const Color(0xFFFF4D8D) : Colors.greenAccent,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              if (isPending) ...[
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => _respondToInvite(inv['id'].toString(), 'reject'),
                      child: const Text('Decline', style: TextStyle(color: Colors.white60)),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF1A6C),
                        shape: const StadiumBorder(),
                      ),
                      onPressed: () => _respondToInvite(inv['id'].toString(), 'accept'),
                      child: const Text('Accept & Join', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }
}
