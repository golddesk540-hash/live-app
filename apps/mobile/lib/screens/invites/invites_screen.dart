import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Popo Live — Module 8.8 Invites (Flutter parity view)
/// Frontend demo only: displays personal demo invite code/link, editable message,
/// share channels (no external referral tracking/rewards), and demo invitation history.
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

  @override
  void initState() {
    super.initState();
    _messageController = TextEditingController(text: defaultMessage);
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
            onPressed: () => setState(() => _selectedTab = 2),
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
              segments: const [
                ButtonSegment(value: 0, label: Text('Invite')),
                ButtonSegment(value: 1, label: Text('Contacts')),
                ButtonSegment(value: 2, label: Text('History')),
              ],
              selected: {_selectedTab},
              onSelectionChanged: (v) => setState(() => _selectedTab = v.first),
            ),
            const SizedBox(height: 16),
            Container(
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
            ),
          ],
        ),
      ),
    );
  }
}
