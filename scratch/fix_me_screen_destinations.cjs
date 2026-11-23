const fs = require('fs');
const filePath = 'apps/mobile/lib/screens/profile/me_screen.dart';
let src = fs.readFileSync(filePath, 'utf8');

// 1. Add imports
if (!src.includes("import '../wallet/wallet_screen.dart';")) {
  src = src.replace(
    "import '../store/store_screen.dart';",
    "import '../store/store_screen.dart';\r\nimport '../wallet/wallet_screen.dart';\r\nimport '../vip/vip_screen.dart';"
  );
}

// 2. Replace _showCoinsPreview
src = src.replace(
  /void _showCoinsPreview\(int balance\) \{[\s\S]*?\n  \}/m,
  `void _showCoinsPreview(int balance) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const WalletScreen(initialTab: 'coins'),
      ),
    );
  }`
);

// 3. Replace _showPointsPreview
src = src.replace(
  /void _showPointsPreview\(int balance\) \{[\s\S]*?\n  \}/m,
  `void _showPointsPreview(int balance) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const WalletScreen(initialTab: 'points'),
      ),
    );
  }`
);

// 4. Replace _showVipPreview
src = src.replace(
  /void _showVipPreview\(FixtureUserProfile user\) \{[\s\S]*?\n  \}/m,
  `void _showVipPreview(FixtureUserProfile user) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const VipMembershipScreen(),
      ),
    );
  }`
);

fs.writeFileSync(filePath, src, 'utf8');
console.log('Successfully updated me_screen.dart with complete Wallet and VIP screen navigation');
