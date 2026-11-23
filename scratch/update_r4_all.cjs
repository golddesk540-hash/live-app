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

// 1. Update DesignFixtures for currentUserProfile mutation
{
  const file = 'apps/mobile/lib/design/design_fixtures.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Add _currentProfile and updateCurrentUserProfile
  const oldUserProp = `  static FixtureUserProfile get currentUserProfile {
    if (isError) {
      throw const DesignFixtureException(
        message:
            'Failed to load user profile: Service temporarily unavailable.',
        code: 'ERR_USER_PROFILE_503',
        module: 'userProfile',
      );
    }
    if (isEmpty) return FixtureUserProfile.empty();
    return _profileAminaNoor;
  }`;

  const newUserProp = `  static FixtureUserProfile _currentProfile = _profileAminaNoor;

  static FixtureUserProfile get currentUserProfile {
    if (isError) {
      throw const DesignFixtureException(
        message:
            'Failed to load user profile: Service temporarily unavailable.',
        code: 'ERR_USER_PROFILE_503',
        module: 'userProfile',
      );
    }
    if (isEmpty) return FixtureUserProfile.empty();
    return _currentProfile;
  }

  static void updateCurrentUserProfile({
    String? nickname,
    String? bio,
    String? country,
    String? avatarUrl,
  }) {
    _currentProfile = _currentProfile.copyWith(
      nickname: nickname,
      bio: bio,
      country: country,
      avatarUrl: avatarUrl,
    );
  }`;

  if (c.includes(oldUserProp)) {
    c = c.replace(oldUserProp, () => newUserProp);
    c = c.replace('_isStarterPackClaimed = false;\n', '_isStarterPackClaimed = false;\n    _currentProfile = _profileAminaNoor;\n');
    checkBalance(file, c);
    fs.writeFileSync(file, c, 'utf8');
    console.log('1. Updated currentUserProfile mutation in design_fixtures.dart');
  }
}

// 2. Update me_screen.dart (Streamer Center tools and Watch History link)
{
  const file = 'apps/mobile/lib/screens/profile/me_screen.dart';
  let c = fs.readFileSync(file, 'utf8');

  // Add imports
  if (!c.includes("import '../new_host_pack/new_host_pack_screen.dart';")) {
    c = c.replace(
      "import '../earning_identity/earning_identity_screen.dart';",
      "import '../earning_identity/earning_identity_screen.dart';\nimport '../new_host_pack/new_host_pack_screen.dart';\nimport '../live/go_live_gate_screen.dart';\nimport '../live/watch_history_screen.dart';"
    );
  }

  // Update _openStreamerCenter to include all required children: Daily Tasks, Task Level, Starter Pack, Earning KYC, Go Live, Rankings
  const oldStreamerRows = `            Row(
              children: [
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.checklist_rounded,
                    label: 'Daily Tasks',
                    color: PopoTheme.primary,
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const DailyHostTasksScreen()));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.trending_up_rounded,
                    label: 'Task Level',
                    color: const Color(0xFFFFC107),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const TaskLevelScreen()));
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

  const newStreamerRows = `            Row(
              children: [
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.checklist_rounded,
                    label: 'Daily Tasks',
                    color: PopoTheme.primary,
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const DailyHostTasksScreen()));
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildCenterToolTile(
                    icon: Icons.trending_up_rounded,
                    label: 'Task Level',
                    color: const Color(0xFFFFC107),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const TaskLevelScreen()));
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
                    color: const Color(0xFFFF2E74),
                    onTap: () {
                      Navigator.of(ctx).pop();
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => const GoLiveGateScreen()));
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
            ),`;

  if (c.includes(oldStreamerRows)) {
    c = c.replace(oldStreamerRows, () => newStreamerRows);
    console.log('2a. Updated Streamer Center tool rows in me_screen.dart');
  } else {
    console.log('2a. Could not find oldStreamerRows');
  }

  // Update _openWatchHistory and lower row 12
  const oldWatchHistoryCall = `          // 12. Watch History
          _buildLowerModuleRow(
            key: const Key('me_lower_watch_history'),
            icon: Icons.history_rounded,
            iconColor: const Color(0xFFBA68C8),
            title: 'Watch History',
            subtitle: 'Past broadcast rooms and audio party sessions',
            onTap: () => _openWatchHistory(context),
          ),`;

  const newWatchHistoryCall = `          // 12. Watch History
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

  if (c.includes(oldWatchHistoryCall)) {
    c = c.replace(oldWatchHistoryCall, () => newWatchHistoryCall);
    console.log('2b. Updated Watch History row navigation in me_screen.dart');
  }

  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
}

console.log('STEP 1 & 2 COMPLETE');
