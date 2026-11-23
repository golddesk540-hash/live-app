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

// 1. Add pointsBalance & coinBalance getters to DesignFixtures
{
  const file = 'apps/mobile/lib/design/design_fixtures.dart';
  let c = fs.readFileSync(file, 'utf8');

  if (!c.includes('static int get pointsBalance => _mutablePointsBalance;')) {
    c = c.replace(
      '  static int _mutablePointsBalance = 420500;',
      '  static int _mutablePointsBalance = 420500;\n  static int get pointsBalance => _mutablePointsBalance;\n  static int get coinBalance => _mutableCoinBalance;'
    );
    checkBalance(file, c);
    fs.writeFileSync(file, c, 'utf8');
    console.log('1. Added pointsBalance getter to DesignFixtures');
  }
}

// 2. Fix settings_screen.dart
{
  const file = 'apps/mobile/lib/screens/profile/settings_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replaceAll('DesignFixtures.currentUserProfile.popoId', 'DesignFixtures.currentUserProfile.poppoId');
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('2. Fixed poppoId in SettingsScreen');
}

// 3. Fix withdrawal_screen.dart
{
  const file = 'apps/mobile/lib/screens/agency_management/withdrawal_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace('DesignFixtures.points.points', 'DesignFixtures.pointsBalance');
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('3. Fixed pointsBalance in WithdrawalScreen');
}

// 4. Fix public_profile_screen.dart
{
  const file = 'apps/mobile/lib/screens/profile/public_profile_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replaceAll('matchRelation.countryCode', "'PK'");
  c = c.replaceAll('DesignFixtures.isFollowing', 'DesignFixtures.isUserFollowed');
  c = c.replaceAll('DesignFixtures.toggleFollowUser', 'DesignFixtures.toggleFollow');
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('4. Fixed public_profile_screen.dart');
}

// 5. Fix me_screen.dart unused _openWatchHistory
{
  const file = 'apps/mobile/lib/screens/profile/me_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  // Make lower module row 12 call _openWatchHistory(context)
  const oldRow12 = `          // 12. Watch History
          _buildLowerModuleRow(
            key: const Key('me_lower_watch_history'),
            icon: Icons.history_rounded,
            iconColor: const Color(0xFFBA68C8),
            title: 'Watch History',
            subtitle: 'Past broadcast rooms and audio party sessions',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const WatchHistoryScreen()),
              );
            },
          ),`;

  const newRow12 = `          // 12. Watch History
          _buildLowerModuleRow(
            key: const Key('me_lower_watch_history'),
            icon: Icons.history_rounded,
            iconColor: const Color(0xFFBA68C8),
            title: 'Watch History',
            subtitle: 'Past broadcast rooms and audio party sessions',
            onTap: () => _openWatchHistory(context),
          ),`;

  if (c.includes(oldRow12)) {
    c = c.replace(oldRow12, newRow12);
  }

  // Update _openWatchHistory implementation to navigate to WatchHistoryScreen
  const oldOpenHist = `  void _openWatchHistory(BuildContext context) {
    final rooms = DesignFixtures.liveRooms;

    showModalBottomSheet<void>(`;

  const newOpenHist = `  void _openWatchHistory(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const WatchHistoryScreen()),
    );
  }

  void _unusedLegacyOpenWatchHistory(BuildContext context) {
    final rooms = DesignFixtures.liveRooms;

    showModalBottomSheet<void>(`;

  if (c.includes(oldOpenHist)) {
    c = c.replace(oldOpenHist, newOpenHist);
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('5. Fixed me_screen.dart _openWatchHistory');
}

console.log('ALL ANALYZE FIXES APPLIED');
