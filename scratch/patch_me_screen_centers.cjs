const fs = require('fs');
const path = 'apps/mobile/lib/screens/profile/me_screen.dart';

let content = fs.readFileSync(path, 'utf8');

// 1. Ensure required imports exist
const requiredImports = [
  "import '../new_host_pack/new_host_pack_screen.dart';",
  "import '../live/go_live_gate_screen.dart';",
  "import '../recognition/recognition_screen.dart';",
];

for (const imp of requiredImports) {
  if (!content.includes(imp)) {
    content = content.replace(
      "import 'user_relation_list_screen.dart';",
      "import 'user_relation_list_screen.dart';\n" + imp
    );
  }
}

// 2. Update me_feature_honor_level to open RecognitionScreen
content = content.replace(
  /'key': const Key\('me_feature_honor_level'\),[\s\S]*?'onTap': \(\) \{[\s\S]*?Navigator\.of\(context\)\.push\([\s\S]*?builder: \(_\) => const TaskLevelScreen\(\),[\s\S]*?\);[\s\S]*?\},/,
  `'key': const Key('me_feature_honor_level'),
        'title': 'Honor Level',
        'icon': Icons.military_tech_rounded,
        'color': const Color(0xFFE040FB),
        'onTap': () {
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const RecognitionScreen()),
          );
        },`
);

// 3. Update me_lower_level to open RecognitionScreen
content = content.replace(
  /key: const Key\('me_lower_level'\),[\s\S]*?title: 'Level',[\s\S]*?onTap: \(\) \{[\s\S]*?Navigator\.of\(context\)\.push\([\s\S]*?builder: \(_\) => const TaskLevelScreen\(\),[\s\S]*?\);[\s\S]*?\},/,
  `key: const Key('me_lower_level'),
            icon: Icons.military_tech_rounded,
            iconColor: const Color(0xFFFFD700),
            title: 'Level',
            subtitle:
                'Wealth Level (Lv.\${user.wealthLevel}) & Shining Host Level (Lv.\${user.hostLevel})',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const RecognitionScreen()),
              );
            },`
);

// 4. Update Streamer Center destination tool tiles
const oldStreamerCenterTiles = `            Row(
              children: [
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.verified_user_rounded,
                    label: 'Earning KYC',
                    color: const Color(0xFF00E5FF),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const EarningIdentityScreen()));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.leaderboard_rounded,
                    label: 'Rankings',
                    color: const Color(0xFFFFD166),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const HostRankingsScreen()));
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

const newStreamerCenterTiles = `            Row(
              children: [
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.card_giftcard_rounded,
                    label: 'Starter Pack',
                    color: const Color(0xFFFF5252),
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
                    icon: Icons.verified_user_rounded,
                    label: 'Earning KYC',
                    color: const Color(0xFF00E5FF),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const EarningIdentityScreen()));
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
                    icon: Icons.videocam_rounded,
                    label: 'Go Live Studio',
                    color: const Color(0xFF4CAF50),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const GoLiveGateScreen()));
                    },
                  ),
                ),
              ],
            ),`;

const isCRLF = content.includes('\r\n');
let normContent = content.replace(/\r\n/g, '\n');
const normOld = oldStreamerCenterTiles.replace(/\r\n/g, '\n');
const normNew = newStreamerCenterTiles.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  normContent = normContent.replace(normOld, normNew);
  console.log('Replaced Streamer Center tiles');
} else {
  console.log('Could not find old Streamer Center tiles');
}

if (isCRLF) {
  normContent = normContent.replace(/\n/g, '\r\n');
}

fs.writeFileSync(path, normContent, 'utf8');
console.log('Successfully updated me_screen.dart with centers and recognition screen');
