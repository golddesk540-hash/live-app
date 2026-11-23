const fs = require('fs');

const file = 'apps/mobile/lib/screens/profile/me_screen.dart';
let c = fs.readFileSync(file, 'utf8');

// Normalize line endings for replacement
const hasCrlf = c.includes('\r\n');
if (hasCrlf) {
  c = c.replace(/\r\n/g, '\n');
}

if (!c.includes("import '../new_host_pack/new_host_pack_screen.dart';")) {
  c = c.replace(
    "import '../earning_identity/earning_identity_screen.dart';",
    "import '../earning_identity/earning_identity_screen.dart';\nimport '../new_host_pack/new_host_pack_screen.dart';\nimport '../live/go_live_gate_screen.dart';\nimport '../live/watch_history_screen.dart';"
  );
}

const targetEnd = `            const SizedBox(height: 18),
          ],
        ),
      ),
    );
  }`;

const addition = `            const SizedBox(height: 10),
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
            ),
            const SizedBox(height: 18),
          ],
        ),
      ),
    );
  }`;

if (c.includes(targetEnd)) {
  c = c.replace(targetEnd, addition);
  console.log('Successfully inserted Starter Pack and Go Live Studio into Streamer Center!');
} else {
  console.log('targetEnd not found in normalized content');
}

// Convert back to CRLF if originally CRLF
if (hasCrlf) {
  c = c.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, c, 'utf8');
