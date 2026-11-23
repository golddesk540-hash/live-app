const fs = require('fs');

const path = 'apps/mobile/lib/design/design_fixtures.dart';
let code = fs.readFileSync(path, 'utf8');

// 1. Fix line 2562: remove const from return const [ in tasksAndRewards
code = code.replace(
  '    if (isEmpty) return const [];\n    return const [\n      FixtureTask(',
  () => '    if (isEmpty) return const [];\n    return [\n      const FixtureTask('
);

// 2. Remove duplicate Fan Club classes at end
const dupAnchor = `/// Fan Club member (R3)
class FixtureFanClubMember {
  final String userId;
  final String nickname;
  final String avatarUrl;
  final int fanLevel;
  final String fanBadge;
  final int contributionPoints;
  final bool isOnline;

  const FixtureFanClubMember({
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.fanLevel,
    required this.fanBadge,
    required this.contributionPoints,
    this.isOnline = false,
  });
}

/// Fan Club profile (R3)
class FixtureFanClub {
  final String id;
  final String name;
  final String hostName;
  final String hostAvatarUrl;
  final int fansCount;
  final int level;
  final String badge;
  final bool isJoined;
  final List<FixtureFanClubMember> members;

  const FixtureFanClub({
    required this.id,
    required this.name,
    required this.hostName,
    required this.hostAvatarUrl,
    required this.fansCount,
    required this.level,
    required this.badge,
    required this.isJoined,
    required this.members,
  });
}`;

if (code.includes(dupAnchor)) {
  code = code.replace(dupAnchor, () => '');
  console.log('Removed duplicate classes at end');
} else {
  console.log('Could not find duplicate classes anchor');
}

// 3. Update FixtureInvitationInfo to have convenience getters
const oldInvitationInfo = `class FixtureInvitationInfo {
  final String inviteCode;
  final String inviteUrl;
  final int totalInvited;
  final int totalCoinsEarned;
  final List<FixtureInvitedUser> joinedUsers;

  const FixtureInvitationInfo({
    required this.inviteCode,
    required this.inviteUrl,
    required this.totalInvited,
    required this.totalCoinsEarned,
    required this.joinedUsers,
  });
}`;

const newInvitationInfo = `class FixtureInvitationInfo {
  final String inviteCode;
  final String inviteUrl;
  final int totalInvited;
  final int totalCoinsEarned;
  final List<FixtureInvitedUser> joinedUsers;

  const FixtureInvitationInfo({
    required this.inviteCode,
    required this.inviteUrl,
    required this.totalInvited,
    required this.totalCoinsEarned,
    required this.joinedUsers,
  });

  String get invitationCode => inviteCode;
  String get shareLink => inviteUrl;
  int get totalRewardCoins => totalCoinsEarned;
}`;

if (code.includes(oldInvitationInfo)) {
  code = code.replace(oldInvitationInfo, () => newInvitationInfo);
  console.log('Updated FixtureInvitationInfo getters');
} else {
  console.log('Could not find oldInvitationInfo');
}

// 4. Update FixtureFanClub & FixtureFanClubMember at lines 4164-4215
const oldFanClubClasses = `class FixtureFanClub {
  final String clubId;
  final String clubName;
  final String badgeName;
  final String badgeColorHex;
  final int totalMembers;
  final int userClubLevel;
  final int userIntimacyPoints;
  final String announcement;
  final List<FixtureFanClubMember> topMembers;

  const FixtureFanClub({
    required this.clubId,
    required this.clubName,
    required this.badgeName,
    required this.badgeColorHex,
    required this.totalMembers,
    required this.userClubLevel,
    required this.userIntimacyPoints,
    required this.announcement,
    required this.topMembers,
  });

  factory FixtureFanClub.empty() => const FixtureFanClub(
        clubId: '',
        clubName: 'Not Joined',
        badgeName: 'FAN',
        badgeColorHex: '#CCCCCC',
        totalMembers: 0,
        userClubLevel: 0,
        userIntimacyPoints: 0,
        announcement: '',
        topMembers: [],
      );
}

/// Fan club member model
class FixtureFanClubMember {
  final String userId;
  final String nickname;
  final String avatarUrl;
  final int intimacyPoints;
  final int rank;

  const FixtureFanClubMember({
    required this.userId,
    required this.nickname,
    required this.avatarUrl,
    required this.intimacyPoints,
    required this.rank,
  });
}`;

const newFanClubClasses = `class FixtureFanClub {
  final String clubId;
  final String clubName;
  final String badgeName;
  final String badgeColorHex;
  final int totalMembers;
  final int userClubLevel;
  final int userIntimacyPoints;
  final String announcement;
  final List<FixtureFanClubMember> topMembers;
  final String hostName;
  final String hostAvatarUrl;
  final bool isJoined;

  const FixtureFanClub({
    String? id,
    String? name,
    String? clubId,
    String? clubName,
    String? badge,
    String? badgeName,
    this.badgeColorHex = '#FFB800',
    int? fansCount,
    int? totalMembers,
    int? level,
    int? userClubLevel,
    this.userIntimacyPoints = 14200,
    this.announcement = '',
    List<FixtureFanClubMember>? members,
    List<FixtureFanClubMember>? topMembers,
    this.hostName = 'Amina Noor',
    this.hostAvatarUrl =
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    this.isJoined = true,
  })  : clubId = clubId ?? id ?? 'fc_001',
        clubName = clubName ?? name ?? 'Amina Star Club',
        badgeName = badgeName ?? badge ?? 'STAR',
        totalMembers = totalMembers ?? fansCount ?? 1840,
        userClubLevel = userClubLevel ?? level ?? 7,
        topMembers = topMembers ?? members ?? const [];

  String get id => clubId;
  String get name => clubName;
  int get fansCount => totalMembers;
  int get level => userClubLevel;
  String get badge => badgeName;
  String get hostAvatar => hostAvatarUrl;
  List<FixtureFanClubMember> get members => topMembers;

  factory FixtureFanClub.empty() => const FixtureFanClub(
        clubId: '',
        clubName: 'Not Joined',
        badgeName: 'FAN',
        badgeColorHex: '#CCCCCC',
        totalMembers: 0,
        userClubLevel: 0,
        userIntimacyPoints: 0,
        announcement: '',
        topMembers: [],
        isJoined: false,
      );
}

/// Fan club member model
class FixtureFanClubMember {
  final String userId;
  final String nickname;
  final String avatarUrl;
  final int intimacyPoints;
  final int rank;
  final int fanLevel;
  final String fanBadge;
  final bool isOnline;
  final String joinedDate;

  const FixtureFanClubMember({
    required this.userId,
    String? nickname,
    String? name,
    required this.avatarUrl,
    int? intimacyPoints,
    int? contributionPoints,
    int? rank,
    this.fanLevel = 5,
    this.fanBadge = 'Super Fan',
    this.isOnline = true,
    this.joinedDate = 'Joined 2 weeks ago',
  })  : nickname = nickname ?? name ?? 'Member',
        intimacyPoints = intimacyPoints ?? contributionPoints ?? 10000,
        rank = rank ?? 1;

  String get id => userId;
  String get name => nickname;
  int get contributionScore => intimacyPoints;
}`;

if (code.includes(oldFanClubClasses)) {
  code = code.replace(oldFanClubClasses, () => newFanClubClasses);
  console.log('Replaced unified FixtureFanClub classes');
} else {
  console.log('Could not find oldFanClubClasses');
}

// 5. Verify bracket balance
let p = 0, b = 0, k = 0;
for (const ch of code) {
  if (ch === '(') p++;
  if (ch === ')') p--;
  if (ch === '{') b++;
  if (ch === '}') b--;
  if (ch === '[') k++;
  if (ch === ']') k--;
}
console.log('Bracket balance check:', { p, b, k });

if (p === 0 && b === 0 && k === 0) {
  fs.writeFileSync(path, code, 'utf8');
  console.log('Successfully updated design_fixtures.dart!');
} else {
  console.error('Bracket imbalance! Aborting write.');
}
