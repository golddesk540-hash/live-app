const fs = require('fs');

function checkBalance(file, code) {
  let p = 0, b = 0, k = 0;
  for (const ch of code) {
    if (ch === '(') p++;
    if (ch === ')') p--;
    if (ch === '{') b++;
    if (ch === '}') b--;
    if (ch === '[') k++;
    if (ch === ']') k--;
  }
  if (p !== 0 || b !== 0 || k !== 0) {
    throw new Error(`Imbalance in ${file}: ` + JSON.stringify({ p, b, k }));
  }
}

// 1. Update me_screen.dart
{
  const file = 'apps/mobile/lib/screens/profile/me_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Imports
  if (!c.includes("import '../new_host_pack/new_host_pack_screen.dart';")) {
    c = c.replace(
      "import '../earning_identity/earning_identity_screen.dart';",
      "import '../earning_identity/earning_identity_screen.dart';\nimport '../new_host_pack/new_host_pack_screen.dart';\nimport '../live/go_live_gate_screen.dart';\nimport '../live/watch_history_screen.dart';"
    );
  }

  // Row 4 in _openStreamerCenter
  const oldRow3 = `            Row(
              children: [
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.emoji_events_rounded,
                    label: 'Leaderboard',
                    color: const Color(0xFFF97316),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const EventLeaderboardScreen()));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.business_rounded,
                    label: 'My Agency',
                    color: const Color(0xFF29B6F6),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const AgencyManagementScreen()));
                    },
                  ),
                ),
              ],
            ),`;

  const newRows = `            Row(
              children: [
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.emoji_events_rounded,
                    label: 'Leaderboard',
                    color: const Color(0xFFF97316),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const EventLeaderboardScreen()));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.business_rounded,
                    label: 'My Agency',
                    color: const Color(0xFF29B6F6),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const AgencyManagementScreen()));
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.card_giftcard_rounded,
                    label: 'Starter Pack',
                    color: const Color(0xFF34D399),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const NewHostPackScreen()));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.videocam_rounded,
                    label: 'Go Live Studio',
                    color: const Color(0xFFFF2E74),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const GoLiveGateScreen()));
                    },
                  ),
                ),
              ],
            ),`;

  if (c.includes(oldRow3)) {
    c = c.replace(oldRow3, newRows);
    console.log('1. Added Starter Pack and Go Live Studio to Streamer Center');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

// 2. Fix _MockHttpHeaders in r4_centers_and_children_test.dart
{
  const file = 'apps/mobile/test/r4_centers_and_children_test.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(
    '  void set(String name, Object value) {}',
    '  void set(String name, Object value, {bool preserveHeaderCase = false}) {}'
  );
  fs.writeFileSync(file, c, 'utf8');
  console.log('2. Fixed _MockHttpHeaders in test');
}

console.log('STREAMER AND TEST UPDATE COMPLETE');
