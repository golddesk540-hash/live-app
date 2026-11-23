const fs = require('fs');
const path = 'apps/mobile/lib/screens/profile/me_screen.dart';

let content = fs.readFileSync(path, 'utf8');

// Ensure imports
if (!content.includes("import '../wallet/wallet_screen.dart';")) {
  content = content.replace(
    "import 'user_relation_list_screen.dart';",
    "import 'user_relation_list_screen.dart';\nimport '../wallet/wallet_screen.dart';\nimport '../vip/vip_screen.dart';"
  );
}

// Replace _showCoinsPreview
content = content.replace(
  /\s*\/\/ Interactive sheet preview for Coins\s*void _showCoinsPreview\(int balance\) \{[\s\S]*?\n  \}/,
  `\n  // Interactive destination for Coins\n  void _showCoinsPreview(int balance) {\n    Navigator.of(context).push(\n      MaterialPageRoute(\n        builder: (_) => const WalletScreen(initialTab: 'coins'),\n      ),\n    );\n  }`
);

// Replace _showPointsPreview
content = content.replace(
  /\s*\/\/ Interactive sheet preview for Points\s*void _showPointsPreview\(int balance\) \{[\s\S]*?\n  \}/,
  `\n  // Interactive destination for Points\n  void _showPointsPreview(int balance) {\n    Navigator.of(context).push(\n      MaterialPageRoute(\n        builder: (_) => const WalletScreen(initialTab: 'points'),\n      ),\n    );\n  }`
);

// Replace _showVipPreview
content = content.replace(
  /\s*\/\/ Interactive sheet preview for VIP\s*void _showVipPreview\(FixtureUserProfile user\) \{[\s\S]*?\n  \}/,
  `\n  // Interactive destination for VIP\n  void _showVipPreview(FixtureUserProfile user) {\n    Navigator.of(context).push(\n      MaterialPageRoute(\n        builder: (_) => const VipMembershipScreen(),\n      ),\n    );\n  }`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated Coins, Points, VIP navigations in me_screen.dart');
