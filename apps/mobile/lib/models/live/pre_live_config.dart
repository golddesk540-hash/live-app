/// Strongly-typed models for Pre-Live Setup and Studio Staging
/// Corresponds to backend endpoints:
/// - GET /api/live/pre-live/config
/// - POST /api/live/pre-live/setup

class PreLiveCategory {
  final String id;
  final String name;
  final String description;
  final String iconName;

  const PreLiveCategory({
    required this.id,
    required this.name,
    required this.description,
    required this.iconName,
  });

  factory PreLiveCategory.fromJson(Map<String, dynamic> json) {
    return PreLiveCategory(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      iconName: json['iconName']?.toString() ?? 'message-circle',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'iconName': iconName,
  };
}

class PreLiveSavedSetup {
  final String title;
  final String categoryId;
  final String categoryName;
  final String? coverUrl;

  const PreLiveSavedSetup({
    required this.title,
    required this.categoryId,
    required this.categoryName,
    this.coverUrl,
  });

  factory PreLiveSavedSetup.fromJson(Map<String, dynamic> json) {
    return PreLiveSavedSetup(
      title: json['title']?.toString() ?? 'Come and chat with me 💕',
      categoryId: json['categoryId']?.toString() ?? 'live_chat',
      categoryName: json['categoryName']?.toString() ?? 'Live Chat',
      coverUrl: json['coverUrl']?.toString(),
    );
  }
}

class PreLiveConfig {
  final bool success;
  final bool isDemo;
  final String? hostNickname;
  final String? hostPoppoId;
  final int wealthLevel;
  final bool isEligible;
  final List<String> missingGates;
  final String? coverUrl;
  final PreLiveSavedSetup? savedSetup;
  final List<PreLiveCategory> categories;
  final List<String> supportedTags;

  const PreLiveConfig({
    required this.success,
    required this.isDemo,
    this.hostNickname,
    this.hostPoppoId,
    required this.wealthLevel,
    required this.isEligible,
    required this.missingGates,
    this.coverUrl,
    this.savedSetup,
    required this.categories,
    required this.supportedTags,
  });

  /// Default supported room tags according to Popo Live discovery guidelines
  static const List<String> defaultSupportedTags = [
    '#LiveChat',
    '#Music',
    '#Singing',
    '#Dance',
    '#NewHost',
    '#PKBattle',
    '#Gaming',
    '#Lifestyle',
    '#Chill',
    '#Friendly',
  ];

  factory PreLiveConfig.fromJson(Map<String, dynamic> json) {
    final userData = json['user'] as Map<String, dynamic>? ?? {};
    final gatesData = json['gates'] as Map<String, dynamic>? ?? {};
    final savedData = json['savedSetup'] as Map<String, dynamic>?;
    final catList = json['categories'] as List<dynamic>? ?? [];

    return PreLiveConfig(
      success: json['success'] == true,
      isDemo: json['isDemo'] == true,
      hostNickname: userData['nickname']?.toString(),
      hostPoppoId: userData['poppoId']?.toString(),
      wealthLevel: (userData['wealthLevel'] as num?)?.toInt() ?? 1,
      isEligible: gatesData['isEligible'] == true,
      missingGates:
          (gatesData['missingGates'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      coverUrl:
          userData['liveCoverUrl']?.toString() ??
          savedData?['coverUrl']?.toString(),
      savedSetup: savedData != null
          ? PreLiveSavedSetup.fromJson(savedData)
          : null,
      categories: catList
          .map((c) => PreLiveCategory.fromJson(c as Map<String, dynamic>))
          .toList(),
      supportedTags: defaultSupportedTags,
    );
  }

  factory PreLiveConfig.fallback() {
    return PreLiveConfig(
      success: false,
      isDemo: true,
      hostNickname: 'Host',
      hostPoppoId: '8800000',
      wealthLevel: 5,
      isEligible: true,
      missingGates: const [],
      coverUrl: null,
      savedSetup: const PreLiveSavedSetup(
        title: 'Come and chat with me 💕',
        categoryId: 'live_chat',
        categoryName: 'Live Chat',
      ),
      categories: const [
        PreLiveCategory(
          id: 'live_chat',
          name: 'Live Chat',
          description: 'Casual conversation & social talks',
          iconName: 'message-circle',
        ),
        PreLiveCategory(
          id: 'music',
          name: 'Music',
          description: 'Singing, musical instruments & live performances',
          iconName: 'music',
        ),
        PreLiveCategory(
          id: 'entertainment',
          name: 'Entertainment',
          description: 'Comedy, dance & variety shows',
          iconName: 'sparkles',
        ),
        PreLiveCategory(
          id: 'lifestyle',
          name: 'Lifestyle',
          description: 'Fashion, food, travel & life vlogs',
          iconName: 'coffee',
        ),
        PreLiveCategory(
          id: 'gaming',
          name: 'Gaming',
          description: 'Mobile & PC gaming streams',
          iconName: 'gamepad-2',
        ),
        PreLiveCategory(
          id: 'talent',
          name: 'Talent',
          description: 'Special talents & artistic performances',
          iconName: 'award',
        ),
        PreLiveCategory(
          id: 'education',
          name: 'Education',
          description: 'Learning, coaching & discussions',
          iconName: 'book-open',
        ),
      ],
      supportedTags: defaultSupportedTags,
    );
  }
}

/// Result returned from POST /api/live/pre-live/setup
class PreLiveSetupResult {
  final bool success;
  final String message;
  final String roomId;
  final String roomNumber;
  final String title;
  final String category;
  final String categoryId;
  final String? coverUrl;
  final List<String> tags;
  final String hostNickname;
  final String hostPoppoId;
  final String status;
  final String nextStep;
  final String? error;

  const PreLiveSetupResult({
    required this.success,
    required this.message,
    required this.roomId,
    required this.roomNumber,
    required this.title,
    required this.category,
    required this.categoryId,
    this.coverUrl,
    required this.tags,
    required this.hostNickname,
    required this.hostPoppoId,
    required this.status,
    required this.nextStep,
    this.error,
  });

  factory PreLiveSetupResult.fromJson(
    Map<String, dynamic> json, {
    List<String> tags = const [],
  }) {
    final session = json['session'] as Map<String, dynamic>? ?? {};

    return PreLiveSetupResult(
      success: json['success'] == true,
      message: json['message']?.toString() ?? 'Pre-live setup successful.',
      roomId: session['roomId']?.toString() ?? '',
      roomNumber: session['roomNumber']?.toString() ?? '',
      title: session['title']?.toString() ?? '',
      category: session['category']?.toString() ?? 'Live Chat',
      categoryId: session['categoryId']?.toString() ?? 'live_chat',
      coverUrl: session['coverUrl']?.toString(),
      tags: tags,
      hostNickname: session['hostNickname']?.toString() ?? 'Host',
      hostPoppoId: session['hostPoppoId']?.toString() ?? '',
      status: session['status']?.toString() ?? 'setup',
      nextStep: json['nextStep']?.toString() ?? '/live/studio',
      error: json['error']?.toString(),
    );
  }
}
