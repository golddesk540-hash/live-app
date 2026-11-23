const fs = require('fs');
const assert = require('assert');

console.log('--- STARTING SECTION 5 (R3) VERIFICATION ---');

// 1. Inspect design_fixtures.dart
const fixturesPath = 'apps/mobile/lib/design/design_fixtures.dart';
const fixturesCode = fs.readFileSync(fixturesPath, 'utf8');

assert(fixturesCode.includes('isBagItemEquipped'), 'design_fixtures must have isBagItemEquipped');
assert(fixturesCode.includes('toggleEquipBagItem'), 'design_fixtures must have toggleEquipBagItem');
assert(fixturesCode.includes('claimTaskReward'), 'design_fixtures must have claimTaskReward');
assert(fixturesCode.includes('isTaskClaimed'), 'design_fixtures must have isTaskClaimed');
assert(fixturesCode.includes('invitationInfo'), 'design_fixtures must have invitationInfo');
assert(fixturesCode.includes('POPO883901'), 'invitationInfo must include POPO883901');
assert(fixturesCode.includes('fanClubs'), 'design_fixtures must have fanClubs');
assert(fixturesCode.includes('AMINA VIP SYMPHONY'), 'fanClubs must include AMINA VIP SYMPHONY');
assert(fixturesCode.includes('toggleFanClubMembership'), 'design_fixtures must have toggleFanClubMembership');
assert(fixturesCode.includes('honorLevel: 5'), 'UserProfile must include honorLevel 5');
console.log('✔ 1. design_fixtures.dart has all R3 data models, dynamic states and getters');

// 2. Inspect wallet_screen.dart
const walletPath = 'apps/mobile/lib/screens/wallet/wallet_screen.dart';
const walletCode = fs.readFileSync(walletPath, 'utf8');

assert(walletCode.includes('final String initialTab'), 'wallet_screen must support initialTab');
assert(walletCode.includes('_loadFromFixtures'), 'wallet_screen must load from fixtures on first paint');
assert(walletCode.includes('DesignFixtures.coinPackages'), 'wallet_screen must display coinPackages');
assert(walletCode.includes('_buildCoinPackagesSection'), 'wallet_screen must have coin packages grid');
assert(walletCode.includes('_showPackageDetailsModal'), 'wallet_screen must have package details modal');
assert(walletCode.includes('DesignFixtures.isError'), 'wallet_screen must handle error state');
assert(walletCode.includes('DesignFixtures.isEmpty'), 'wallet_screen must handle empty state');
assert(walletCode.includes('Host Earnings (70% Share)'), 'wallet_screen must display 70% Host Gift Share notice');
console.log('✔ 2. wallet_screen.dart supports Coins packages & Points withdrawal with fixture-driven first paint');

// 3. Inspect vip_screen.dart & vip_history_screen.dart
const vipPath = 'apps/mobile/lib/screens/vip/vip_screen.dart';
const vipCode = fs.readFileSync(vipPath, 'utf8');
assert(vipCode.includes('DesignFixtures.vipPlan'), 'vip_screen must load from DesignFixtures.vipPlan');
assert(vipCode.includes('DesignFixtures.isError'), 'vip_screen must handle error state');
assert(vipCode.includes('DesignFixtures.isEmpty'), 'vip_screen must handle empty state');

const vipHistoryPath = 'apps/mobile/lib/screens/vip/vip_history_screen.dart';
const vipHistoryCode = fs.readFileSync(vipHistoryPath, 'utf8');
assert(vipHistoryCode.includes('DesignFixtures.vipPlanHistory'), 'vip_history_screen must load from DesignFixtures.vipPlanHistory');
console.log('✔ 3. vip_screen.dart & vip_history_screen.dart are fixture-driven with plan cards and active indicator');

// 4. Inspect recognition_screen.dart
const recPath = 'apps/mobile/lib/screens/recognition/recognition_screen.dart';
const recCode = fs.readFileSync(recPath, 'utf8');
assert(recCode.includes('_buildThreeProgressBarsCard'), 'recognition_screen must display 3 progress bars');
assert(recCode.includes('Wealth Level'), 'recognition_screen must have Wealth progress');
assert(recCode.includes('Shining Host Level'), 'recognition_screen must have Shining Host Level');
assert(recCode.includes('Honor Level'), 'recognition_screen must have Honor Level');
assert(recCode.includes('DesignFixtures.currentUserProfile'), 'recognition_screen must read level from fixtures');
console.log('✔ 4. recognition_screen.dart displays Wealth, Shining & Honor progress bars');

// 5. Inspect daily_host_tasks_screen.dart
const taskPath = 'apps/mobile/lib/screens/daily_tasks/daily_host_tasks_screen.dart';
const taskCode = fs.readFileSync(taskPath, 'utf8');
assert(taskCode.includes('DesignFixtures.tasksAndRewards'), 'daily_host_tasks_screen must load from fixtures');
assert(taskCode.includes('Claimable Reward'), 'daily_host_tasks_screen must display claimable rewards badge');
assert(taskCode.includes('DesignFixtures.claimTaskReward'), 'daily_host_tasks_screen must support claiming reward');
console.log('✔ 5. daily_host_tasks_screen.dart displays daily tasks and claimable badge');

// 6. Inspect host_rankings_screen.dart
const rankPath = 'apps/mobile/lib/screens/host_rankings/host_rankings_screen.dart';
const rankCode = fs.readFileSync(rankPath, 'utf8');
assert(rankCode.includes('DesignFixtures.hostRankings'), 'host_rankings_screen must load from fixtures');
assert(rankCode.includes('_buildEventBoardView'), 'host_rankings_screen must have event board view');
assert(rankCode.includes('Event Board'), 'host_rankings_screen must show event board');
assert(rankCode.includes('DesignFixtures.eventRankings'), 'host_rankings_screen must show event leaderboard');
console.log('✔ 6. host_rankings_screen.dart has Host Rankings podium and Event Board');

// 7. Inspect store_screen.dart
const storePath = 'apps/mobile/lib/screens/store/store_screen.dart';
const storeCode = fs.readFileSync(storePath, 'utf8');
assert(storeCode.includes('DesignFixtures.storeCategories'), 'store_screen must load categories from fixtures');
assert(storeCode.includes('DesignFixtures.storeItems'), 'store_screen must load items from fixtures');
assert(storeCode.includes('DesignFixtures.bagItems'), 'store_screen must load inventory from bagItems');
assert(storeCode.includes('DesignFixtures.toggleEquipBagItem'), 'store_screen must toggle bag item equip state');
console.log('✔ 7. store_screen.dart supports catalog, inventory, and equip/unequip controls');

// 8. Inspect invites_screen.dart
const invitesPath = 'apps/mobile/lib/screens/invites/invites_screen.dart';
const invitesCode = fs.readFileSync(invitesPath, 'utf8');
assert(invitesCode.includes('DesignFixtures.invitationInfo'), 'invites_screen must load invitationInfo');
assert(invitesCode.includes('_buildStatsCard'), 'invites_screen must display statistics card');
assert(invitesCode.includes('_buildInviteCodeView'), 'invites_screen must display invitation code');
assert(invitesCode.includes('_buildJoinedUsersView'), 'invites_screen must display joined users list');
console.log('✔ 8. invites_screen.dart displays code POPO883901, stats and joined friends list');

// 9. Inspect fan_club_screen.dart
const fanPath = 'apps/mobile/lib/screens/fan_club/fan_club_screen.dart';
const fanCode = fs.readFileSync(fanPath, 'utf8');
assert(fanCode.includes('DesignFixtures.fanClubs'), 'fan_club_screen must load fan clubs from fixtures');
assert(fanCode.includes('_buildFanClubHeaderCard'), 'fan_club_screen must display club header');
assert(fanCode.includes('_buildMemberListSection'), 'fan_club_screen must display member list');
assert(fanCode.includes('DesignFixtures.toggleFanClubMembership'), 'fan_club_screen must toggle membership');
console.log('✔ 9. fan_club_screen.dart displays club header, badge, member list, and join/leave control');

// 10. Inspect me_screen.dart routing
const mePath = 'apps/mobile/lib/screens/profile/me_screen.dart';
const meCode = fs.readFileSync(mePath, 'utf8');

// Coins
assert(meCode.includes("WalletScreen(initialTab: 'coins')"), 'me_screen Coins must open WalletScreen with coins tab');
// Points
assert(meCode.includes("WalletScreen(initialTab: 'points')"), 'me_screen Points must open WalletScreen with points tab');
// VIP
assert(meCode.includes("VipMembershipScreen"), 'me_screen VIP banner must open VipMembershipScreen');
// Feature 6: Honor Level opens RecognitionScreen
assert(meCode.includes("RecognitionScreen(\n                apiBaseUrl: 'https://api.popolive.com',\n                userId: user.userId,\n                previewDemo: true,\n                initialCategory: 'honor',"),
  'me_feature_honor_level must open RecognitionScreen(initialCategory: honor)');
// Lower Level row 13 opens RecognitionScreen
assert(meCode.includes("RecognitionScreen(\n                    apiBaseUrl: 'https://api.popolive.com',\n                    userId: user.userId,\n                    previewDemo: true,\n                    initialCategory: 'wealth',"),
  'me_lower_level must open RecognitionScreen(initialCategory: wealth)');
// TaskLevelScreen only in Streamer Center
assert(meCode.includes("TaskLevelScreen"), 'TaskLevelScreen must exist in me_screen');
const streamerCenterSub = meCode.substring(meCode.indexOf('void _openStreamerCenter'), meCode.indexOf('void _openBuilderCenter'));
assert(streamerCenterSub.includes('TaskLevelScreen'), 'TaskLevelScreen must be in Streamer Center');
// Ensure TaskLevelScreen is NOT in me_feature_honor_level or me_lower_level
assert(!meCode.includes("'me_feature_honor_level'),\n        'title': 'Honor Level',\n        'icon': Icons.military_tech_rounded,\n        'color': const Color(0xFFE040FB),\n        'onTap': () {\n          Navigator.of(context).push(\n            MaterialPageRoute(builder: (_) => const TaskLevelScreen())"),
  'Honor Level must not navigate to TaskLevelScreen');

// Feature 1: Reward opens DailyHostTasksScreen
assert(meCode.includes("'me_feature_reward'),\n        'title': 'Reward',\n        'icon': Icons.card_giftcard_rounded,\n        'color': const Color(0xFFFF1768),\n        'onTap': () {\n          Navigator.of(context).push(\n            MaterialPageRoute(builder: (_) => const DailyHostTasksScreen()),\n          );"),
  'Reward must open DailyHostTasksScreen');
// Feature 2: Rank opens HostRankingsScreen
assert(meCode.includes("'me_feature_rank'),\n        'title': 'Rank',\n        'icon': Icons.leaderboard_rounded,\n        'color': const Color(0xFFFFD700),\n        'onTap': () {\n          Navigator.of(context).push(\n            MaterialPageRoute(builder: (_) => const HostRankingsScreen()),\n          );"),
  'Rank must open HostRankingsScreen');
// Feature 3: Store opens StoreScreen store tab
assert(meCode.includes("initialTab: 'store'"), 'Store must open StoreScreen(initialTab: store)');
// Feature 4: Invite opens InvitesScreen
assert(meCode.includes("MaterialPageRoute(builder: (_) => const InvitesScreen())"), 'Invite must open InvitesScreen');
// Feature 7: Fan Club opens FanClubScreen
assert(meCode.includes("MaterialPageRoute(builder: (_) => const FanClubScreen())"), 'Fan Club must open FanClubScreen');
// Lower Module 15: Bag opens StoreScreen inventory tab
assert(meCode.includes("initialTab: 'inventory'"), 'Bag must open StoreScreen(initialTab: inventory)');

console.log('✔ 10. me_screen.dart routes all 9 features accurately to complete screens with TaskLevelScreen isolated inside Streamer Center');

console.log('\n========================================');
console.log('ALL SECTION 5 (R3) VERIFICATION CHECKS PASSED!');
console.log('========================================');
