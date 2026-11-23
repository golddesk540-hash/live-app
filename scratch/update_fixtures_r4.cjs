const fs = require('fs');

const path = 'apps/mobile/lib/design/design_fixtures.dart';
let code = fs.readFileSync(path, 'utf8');

// 1. Update mutable state & reset in DesignFixtures class
const oldResetAnchor = `    _joinedFanClubIds
      ..clear()
      ..add('club_amina');
  }`;

const newResetAnchor = `    _joinedFanClubIds
      ..clear()
      ..add('club_amina');
    _isStarterPackClaimed = false;
    _withdrawalRecordsList = [
      const FixtureWithdrawalRecord(
        id: 'wd_01',
        amountPoints: 200000,
        amountUsd: 20.0,
        amountPkr: 5600,
        paymentMethod: 'Easypaisa (0300-8765432)',
        status: 'Completed',
        timestamp: 'Nov 14, 2026',
      ),
      const FixtureWithdrawalRecord(
        id: 'wd_02',
        amountPoints: 300000,
        amountUsd: 30.0,
        amountPkr: 8400,
        paymentMethod: 'Meezan Bank (PK89MEZN00018839201)',
        status: 'Processing',
        timestamp: 'Today, 09:12 AM',
      ),
    ];
    _blockedUsers = [
      const FixtureBlockedUser(
        id: 'u_spambot_01',
        nickname: 'SpamBot_99',
        avatarUrl:
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        blockedDate: 'Nov 12, 2026',
        reason: 'Unsolicited promotional messages',
      ),
      const FixtureBlockedUser(
        id: 'u_troll_user_02',
        nickname: 'TrollUser88',
        avatarUrl:
            'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
        blockedDate: 'Nov 08, 2026',
        reason: 'Disruptive chat behavior',
      ),
    ];
  }`;

if (code.includes(oldResetAnchor)) {
  code = code.replace(oldResetAnchor, () => newResetAnchor);
  console.log('1. Updated reset() in DesignFixtures');
} else {
  console.log('1. Could not find oldResetAnchor');
}

// 2. Add mutable state fields
const oldFieldsAnchor = `  static final Set<String> _joinedFanClubIds = {'club_amina'};`;
const newFieldsAnchor = `  static final Set<String> _joinedFanClubIds = {'club_amina'};
  static bool _isStarterPackClaimed = false;
  static bool get isStarterPackClaimed => _isStarterPackClaimed;
  static void claimStarterPack() {
    _isStarterPackClaimed = true;
    _mutableCoinBalance += 50;
    _mutablePointsBalance += 200;
  }

  static List<FixtureWithdrawalRecord> _withdrawalRecordsList = [
    const FixtureWithdrawalRecord(
      id: 'wd_01',
      amountPoints: 200000,
      amountUsd: 20.0,
      amountPkr: 5600,
      paymentMethod: 'Easypaisa (0300-8765432)',
      status: 'Completed',
      timestamp: 'Nov 14, 2026',
    ),
    const FixtureWithdrawalRecord(
      id: 'wd_02',
      amountPoints: 300000,
      amountUsd: 30.0,
      amountPkr: 8400,
      paymentMethod: 'Meezan Bank (PK89MEZN00018839201)',
      status: 'Processing',
      timestamp: 'Today, 09:12 AM',
    ),
  ];

  static bool submitWithdrawal({
    required int points,
    required String paymentMethod,
  }) {
    if (points <= 0 || points > _mutablePointsBalance) return false;
    final usd = points / 10000.0;
    final pkr = (usd * 280).toInt();
    _mutablePointsBalance -= points;
    final record = FixtureWithdrawalRecord(
      id: 'wd_\${DateTime.now().millisecondsSinceEpoch}',
      amountPoints: points,
      amountUsd: usd,
      amountPkr: pkr,
      paymentMethod: paymentMethod,
      status: 'Processing',
      timestamp: 'Just now',
    );
    _withdrawalRecordsList.insert(0, record);
    return true;
  }

  static List<FixtureBlockedUser> _blockedUsers = [
    const FixtureBlockedUser(
      id: 'u_spambot_01',
      nickname: 'SpamBot_99',
      avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      blockedDate: 'Nov 12, 2026',
      reason: 'Unsolicited promotional messages',
    ),
    const FixtureBlockedUser(
      id: 'u_troll_user_02',
      nickname: 'TrollUser88',
      avatarUrl:
          'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
      blockedDate: 'Nov 08, 2026',
      reason: 'Disruptive chat behavior',
    ),
  ];

  static List<FixtureBlockedUser> get blockedUsers {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Failed to query blocked users directory [ERR_BLOCKED_503]',
      );
    }
    if (isEmpty) return const [];
    return List.unmodifiable(_blockedUsers);
  }

  static bool unblockUser(String userId) {
    final initialLen = _blockedUsers.length;
    _blockedUsers.removeWhere((u) => u.id == userId);
    return _blockedUsers.length < initialLen;
  }`;

if (code.includes(oldFieldsAnchor)) {
  code = code.replace(oldFieldsAnchor, () => newFieldsAnchor);
  console.log('2. Added mutable state fields in DesignFixtures');
} else {
  console.log('2. Could not find oldFieldsAnchor');
}

// 3. Update withdrawalRecords getter to return _withdrawalRecordsList
const oldWithdrawalRecordsGetter = `  static List<FixtureWithdrawalRecord> get withdrawalRecords {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Withdrawal settlement ledger failed [ERR_PAYOUT_TIMEOUT]',
      );
    }
    if (isEmpty) return const [];
    return const [
      FixtureWithdrawalRecord(
        id: 'wd_01',
        amountPoints: 200000,
        amountUsd: 20.0,
        amountPkr: 5600,
        paymentMethod: 'Easypaisa (0300-8765432)',
        status: 'Completed',
        timestamp: 'Nov 14, 2026',
      ),
      FixtureWithdrawalRecord(
        id: 'wd_02',
        amountPoints: 300000,
        amountUsd: 30.0,
        amountPkr: 8400,
        paymentMethod: 'Meezan Bank (PK89MEZN00018839201)',
        status: 'Processing',
        timestamp: 'Today, 09:12 AM',
      ),
    ];
  }`;

const newWithdrawalRecordsGetter = `  static List<FixtureWithdrawalRecord> get withdrawalRecords {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Withdrawal settlement ledger failed [ERR_PAYOUT_TIMEOUT]',
      );
    }
    if (isEmpty) return const [];
    return List.unmodifiable(_withdrawalRecordsList);
  }

  // --------------------------------------------------------------------------
  // 17. STARTER PACK, TASK LEVEL, AND EARNING IDENTITY (R4)
  // --------------------------------------------------------------------------
  static FixtureStarterPack get starterPack {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Failed to load starter pack: Server busy [ERR_PACK_SYNC_503]',
      );
    }
    if (isEmpty) return FixtureStarterPack.empty();
    return FixtureStarterPack(
      title: 'Popo Live Host Starter Pack',
      description: 'Welcome bonus for new streaming creators',
      rewardPoints: 200,
      rewardCoins: 50,
      badgeName: 'Rising Star Host',
      isClaimed: _isStarterPackClaimed,
      guides: const [
        {
          'id': 'profile_setup',
          'title': 'Complete Profile & Avatar',
          'subtitle': 'Upload clear avatar and set up your bio & country',
          'isCompleted': true,
        },
        {
          'id': 'first_stream',
          'title': 'Host First 15-Min Live',
          'subtitle': 'Broadcast in public room with clear audio and video',
          'isCompleted': false,
        },
        {
          'id': 'join_party',
          'title': 'Join 9-Seat Party Lounge',
          'subtitle': 'Interact with other broadcasters on microphone',
          'isCompleted': false,
        },
        {
          'id': 'verify_id',
          'title': 'Submit Earning KYC',
          'subtitle': 'Clear identity verification for gift earnings payout',
          'isCompleted': true,
        },
      ],
    );
  }

  static FixtureEarningIdentity get earningIdentity {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Failed to load earning identity [ERR_KYC_SYNC_503]',
      );
    }
    if (isEmpty) return FixtureEarningIdentity.empty();
    return const FixtureEarningIdentity(
      legalName: 'Amina Noor',
      status: 'VERIFIED',
      country: 'Pakistan',
      documentType: 'national_id',
      documentNumberMasked: '42101-•••••••-8',
      earningEligible: true,
      verifiedDate: 'Nov 10, 2026',
    );
  }

  static FixtureTaskLevel get taskLevelInfo {
    if (isError) {
      throw const DesignFixtureException(
        message: 'Failed to load task level [ERR_TASK_LEVEL_503]',
      );
    }
    if (isEmpty) return FixtureTaskLevel.empty();
    return const FixtureTaskLevel(
      currentLevel: 5,
      levelName: 'Rising Star Creator',
      taskPoints: 14500,
      nextLevel: 6,
      nextLevelName: 'Established Broadcaster',
      pointsToNext: 5500,
      progressRatio: 0.725,
      benefits: [
        '70% Host Gift Share revenue tier',
        'Priority Live Room placement in Discovery',
        'Exclusive Animated Entrance Star banner',
        'Access to 9-Seat Audio Party Host seat',
      ],
      allLevels: [
        {'level': 1, 'name': 'New Creator', 'threshold': 1000},
        {'level': 2, 'name': 'Bronze Host', 'threshold': 3000},
        {'level': 3, 'name': 'Silver Broadcaster', 'threshold': 6000},
        {'level': 4, 'name': 'Gold Performer', 'threshold': 10000},
        {'level': 5, 'name': 'Rising Star Creator', 'threshold': 20000},
        {'level': 6, 'name': 'Established Broadcaster', 'threshold': 35000},
        {'level': 7, 'name': 'Elite Host', 'threshold': 55000},
        {'level': 8, 'name': 'Master Broadcaster', 'threshold': 80000},
        {'level': 9, 'name': 'Grandmaster Star', 'threshold': 120000},
        {'level': 10, 'name': 'Popo Legend', 'threshold': 200000},
      ],
    );
  }`;

if (code.includes(oldWithdrawalRecordsGetter)) {
  code = code.replace(oldWithdrawalRecordsGetter, () => newWithdrawalRecordsGetter);
  console.log('3. Updated withdrawalRecordsGetter and added R4 getters');
} else {
  console.log('3. Could not find oldWithdrawalRecordsGetter');
}

// 4. Append models at the end of file
const newModels = `
/// Blocked user model (R4)
class FixtureBlockedUser {
  final String id;
  final String nickname;
  final String avatarUrl;
  final String blockedDate;
  final String reason;

  const FixtureBlockedUser({
    required this.id,
    required this.nickname,
    required this.avatarUrl,
    required this.blockedDate,
    required this.reason,
  });
}

/// Host Starter Pack Model (R4)
class FixtureStarterPack {
  final String title;
  final String description;
  final int rewardPoints;
  final int rewardCoins;
  final String badgeName;
  final bool isClaimed;
  final List<Map<String, dynamic>> guides;

  const FixtureStarterPack({
    required this.title,
    required this.description,
    required this.rewardPoints,
    required this.rewardCoins,
    required this.badgeName,
    required this.isClaimed,
    required this.guides,
  });

  factory FixtureStarterPack.empty() => const FixtureStarterPack(
        title: '',
        description: '',
        rewardPoints: 0,
        rewardCoins: 0,
        badgeName: '',
        isClaimed: false,
        guides: [],
      );

  Map<String, dynamic> toMap() => {
        'title': title,
        'description': description,
        'rewardPoints': rewardPoints,
        'rewardCoins': rewardCoins,
        'badgeName': badgeName,
        'isClaimed': isClaimed,
        'guides': guides,
      };
}

/// Earning KYC Identity Model (R4)
class FixtureEarningIdentity {
  final String legalName;
  final String status;
  final String country;
  final String documentType;
  final String documentNumberMasked;
  final bool earningEligible;
  final String verifiedDate;

  const FixtureEarningIdentity({
    required this.legalName,
    required this.status,
    required this.country,
    required this.documentType,
    required this.documentNumberMasked,
    required this.earningEligible,
    required this.verifiedDate,
  });

  factory FixtureEarningIdentity.empty() => const FixtureEarningIdentity(
        legalName: '',
        status: 'UNVERIFIED',
        country: '',
        documentType: 'none',
        documentNumberMasked: '',
        earningEligible: false,
        verifiedDate: '',
      );

  Map<String, dynamic> toMap() => {
        'legalName': legalName,
        'status': status,
        'country': country,
        'documentType': documentType,
        'documentNumberMasked': documentNumberMasked,
        'earningEligible': earningEligible,
        'verifiedDate': verifiedDate,
      };
}

/// Task Level Milestone Model (R4)
class FixtureTaskLevel {
  final int currentLevel;
  final String levelName;
  final int taskPoints;
  final int nextLevel;
  final String nextLevelName;
  final int pointsToNext;
  final double progressRatio;
  final List<String> benefits;
  final List<Map<String, dynamic>> allLevels;

  const FixtureTaskLevel({
    required this.currentLevel,
    required this.levelName,
    required this.taskPoints,
    required this.nextLevel,
    required this.nextLevelName,
    required this.pointsToNext,
    required this.progressRatio,
    required this.benefits,
    required this.allLevels,
  });

  factory FixtureTaskLevel.empty() => const FixtureTaskLevel(
        currentLevel: 1,
        levelName: 'New Creator',
        taskPoints: 0,
        nextLevel: 2,
        nextLevelName: 'Bronze Host',
        pointsToNext: 1000,
        progressRatio: 0.0,
        benefits: [],
        allLevels: [],
      );

  Map<String, dynamic> toMap() => {
        'currentLevel': currentLevel,
        'levelName': levelName,
        'taskPoints': taskPoints,
        'nextLevel': nextLevel,
        'nextLevelName': nextLevelName,
        'pointsToNext': pointsToNext,
        'progressRatio': progressRatio,
        'benefits': benefits,
        'allLevels': allLevels,
      };
}
`;

code = code.trimEnd() + '\n' + newModels;

// Check balance
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
  console.log('Successfully updated design_fixtures.dart with R4 models and methods!');
} else {
  console.error('Bracket imbalance! Aborting write.');
}
