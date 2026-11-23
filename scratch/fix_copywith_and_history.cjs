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

// 1. Fix FixtureUserProfile copyWith in design_fixtures.dart
{
  const file = 'apps/mobile/lib/design/design_fixtures.dart';
  let c = fs.readFileSync(file, 'utf8');
  const target = '  Map<String, dynamic> toMap() => {';
  const copyWithMethod = `  FixtureUserProfile copyWith({
    String? userId,
    String? poppoId,
    String? nickname,
    String? username,
    String? avatarUrl,
    String? bio,
    String? gender,
    String? country,
    String? countryCode,
    String? flagEmoji,
    int? wealthLevel,
    int? hostLevel,
    int? honorLevel,
    int? vipLevel,
    String? vipStatus,
    int? coinBalance,
    int? pointsBalance,
    int? followingCount,
    int? followersCount,
    int? friendsCount,
    int? visitorCount,
    bool? isHostEligible,
    bool? isLiveNow,
    String? currentLiveRoomId,
  }) =>
      FixtureUserProfile(
        userId: userId ?? this.userId,
        poppoId: poppoId ?? this.poppoId,
        nickname: nickname ?? this.nickname,
        username: username ?? this.username,
        avatarUrl: avatarUrl ?? this.avatarUrl,
        bio: bio ?? this.bio,
        gender: gender ?? this.gender,
        country: country ?? this.country,
        countryCode: countryCode ?? this.countryCode,
        flagEmoji: flagEmoji ?? this.flagEmoji,
        wealthLevel: wealthLevel ?? this.wealthLevel,
        hostLevel: hostLevel ?? this.hostLevel,
        honorLevel: honorLevel ?? this.honorLevel,
        vipLevel: vipLevel ?? this.vipLevel,
        vipStatus: vipStatus ?? this.vipStatus,
        coinBalance: coinBalance ?? this.coinBalance,
        pointsBalance: pointsBalance ?? this.pointsBalance,
        followingCount: followingCount ?? this.followingCount,
        followersCount: followersCount ?? this.followersCount,
        friendsCount: friendsCount ?? this.friendsCount,
        visitorCount: visitorCount ?? this.visitorCount,
        isHostEligible: isHostEligible ?? this.isHostEligible,
        isLiveNow: isLiveNow ?? this.isLiveNow,
        currentLiveRoomId: currentLiveRoomId ?? this.currentLiveRoomId,
      );

  Map<String, dynamic> toMap() => {`;

  if (c.includes(target) && !c.includes('FixtureUserProfile copyWith(')) {
    c = c.replace(target, copyWithMethod);
    checkBalance(file, c);
    fs.writeFileSync(file, c, 'utf8');
    console.log('1. Added copyWith to FixtureUserProfile');
  }
}

// 2. Fix watch_history_screen.dart
{
  const file = 'apps/mobile/lib/screens/live/watch_history_screen.dart';
  let c = fs.readFileSync(file, 'utf8');
  c = c.replaceAll('room.roomId', 'room.id');
  c = c.replaceAll('Watched ${room.startedAgo}', 'Watched recently');
  c = c.replaceAll('return Scaffold(', "return Scaffold(\n      key: const Key('me_watch_history_destination'),");
  
  // Also add close_rounded button to action
  const oldActions = `actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: PopoTheme.cyan),
            onPressed: _loadHistory,
          ),
          const SizedBox(width: 8),
        ],`;
  const newActions = `actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: PopoTheme.cyan),
            onPressed: _loadHistory,
          ),
          IconButton(
            icon: const Icon(Icons.close_rounded, color: PopoTheme.textSecondary),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          const SizedBox(width: 8),
        ],`;
  if (c.includes(oldActions)) {
    c = c.replace(oldActions, newActions);
  }
  checkBalance(file, c);
  fs.writeFileSync(file, c, 'utf8');
  console.log('2. Fixed watch_history_screen.dart');
}
