const fs = require('fs');

// Helper to check brackets
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

// 1. FixtureInvitedUser in design_fixtures.dart
{
  const file = 'apps/mobile/lib/design/design_fixtures.dart';
  let c = fs.readFileSync(file, 'utf8');
  const target = `class FixtureInvitedUser {
  final String userId;
  final String nickname;
  final String avatarUrl;
  final int wealthLevel;
  final int hostLevel;
  final String joinedAgo;
  final int bonusEarned;

  const FixtureInvitedUser({
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.wealthLevel,
    required this.hostLevel,
    required this.joinedAgo,
    required this.bonusEarned,
  });
}`;

  const replacement = `class FixtureInvitedUser {
  final String userId;
  final String nickname;
  final String avatarUrl;
  final int wealthLevel;
  final int hostLevel;
  final String joinedAgo;
  final int bonusEarned;

  const FixtureInvitedUser({
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.wealthLevel,
    required this.hostLevel,
    required this.joinedAgo,
    required this.bonusEarned,
  });

  String get name => nickname;
  int get level => wealthLevel;
  String get joinedAt => joinedAgo;
}`;

  c = c.replace(target, () => replacement);
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('1. Updated FixtureInvitedUser in design_fixtures.dart');
}

// 2. host_rankings_screen.dart: unused import and _formatDiamonds method
{
  const file = 'apps/mobile/lib/screens/host_rankings/host_rankings_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import '../../api/api.dart';\n", '');

  const methodTarget = '  Widget _buildEventBoardView() {';
  const methodReplacement = `  String _formatDiamonds(int count) {
    if (count >= 1000000) {
      return '\${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '\${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  Widget _buildEventBoardView() {`;

  c = c.replace(methodTarget, () => methodReplacement);
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('2. Added _formatDiamonds and removed unused import in host_rankings_screen.dart');
}

// 3. me_screen.dart: remove unused previews
{
  const file = 'apps/mobile/lib/screens/profile/me_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  const startMarker = '  // Interactive sheet preview for Coins\n  void _showCoinsPreview(int balance) {';
  const endMarker = '  // ---------------------------------------------------------------------------\n  // PROMPT 2: DESTINATIONS FOR THE 8 ICONS & LOWER SECTIONS';

  const startIndex = c.indexOf(startMarker);
  const endIndex = c.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    c = c.substring(0, startIndex) + c.substring(endIndex);
    checkBalance(file, c);
    fs.writeFileSync(file, c, 'utf8');
    console.log('3. Removed unused preview methods in me_screen.dart');
  } else {
    console.log('3. Markers not found in me_screen.dart', { startIndex, endIndex });
  }
}

// 4. fan_club_screen.dart: remove unused import
{
  const file = 'apps/mobile/lib/screens/fan_club/fan_club_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import '../../theme/popo_theme.dart';\n", '');
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('4. Removed unused import in fan_club_screen.dart');
}

// 5. daily_host_tasks_screen.dart: use _errorMessage
{
  const file = 'apps/mobile/lib/screens/daily_tasks/daily_host_tasks_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes("import '../../widgets/popo_error_state.dart';")) {
    c = c.replace("import 'package:flutter/material.dart';\n", "import 'package:flutter/material.dart';\nimport '../../widgets/popo_error_state.dart';\n");
  }
  const buildTarget = '  @override\n  Widget build(BuildContext context) {';
  const buildReplacement = `  @override
  Widget build(BuildContext context) {
    if (DesignFixtures.isError || _errorMessage != null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0D031B),
        appBar: AppBar(
          backgroundColor: const Color(0xFF120624),
          foregroundColor: Colors.white,
          title: const Text('Daily Host Tasks', style: TextStyle(fontWeight: FontWeight.w800)),
        ),
        body: Center(
          child: PopoErrorState(
            title: 'Task progress sync failed',
            message: _errorMessage ?? 'Server busy [ERR_TASK_SYNC_503]',
            retryText: 'Retry',
            onRetry: _loadBackendTasks,
          ),
        ),
      );
    }`;
  c = c.replace(buildTarget, () => buildReplacement);
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('5. Wired _errorMessage to PopoErrorState in daily_host_tasks_screen.dart');
}

// 6. store_screen.dart: remove unused imports
{
  const file = 'apps/mobile/lib/screens/store/store_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import 'dart:convert';\n", '');
  c = c.replace("import 'package:http/http.dart' as http;\n", '');
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('6. Removed unused imports in store_screen.dart');
}

// 7. vip_history_screen.dart: remove unused imports
{
  const file = 'apps/mobile/lib/screens/vip/vip_history_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import 'dart:convert';\n", '');
  c = c.replace("import 'package:http/http.dart' as http;\n", '');
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('7. Removed unused imports in vip_history_screen.dart');
}

// 8. wallet_screen.dart: remove unused imports
{
  const file = 'apps/mobile/lib/screens/wallet/wallet_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace("import 'topup_screen.dart';\n", '');
  c = c.replace("import 'transaction_details_screen.dart';\n", '');
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('8. Removed unused imports in wallet_screen.dart');
}

console.log('ALL CLEANUPS COMPLETE.');
