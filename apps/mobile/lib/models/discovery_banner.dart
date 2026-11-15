/// Strongly typed model for Hero Promotional Banners
class DiscoveryBanner {
  final String id;
  final String title;
  final String description;
  final String? desktopImageUrl;
  final String? mobileImageUrl;
  final String destination;
  final String ctaText;
  final String badgeText;
  final int displayOrder;
  final bool isActive;

  const DiscoveryBanner({
    required this.id,
    required this.title,
    required this.description,
    this.desktopImageUrl,
    this.mobileImageUrl,
    required this.destination,
    this.ctaText = 'Explore >',
    this.badgeText = '',
    this.displayOrder = 1,
    this.isActive = true,
  });

  String? get effectiveImageUrl =>
      (mobileImageUrl != null && mobileImageUrl!.isNotEmpty)
      ? mobileImageUrl
      : desktopImageUrl;

  factory DiscoveryBanner.fromJson(Map<String, dynamic> json) {
    return DiscoveryBanner(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Campaign',
      description: json['description']?.toString() ?? '',
      desktopImageUrl: json['desktopImageUrl']?.toString(),
      mobileImageUrl: json['mobileImageUrl']?.toString(),
      destination: json['destination']?.toString() ?? '/',
      ctaText: json['ctaText']?.toString() ?? 'Explore >',
      badgeText: json['badgeText']?.toString() ?? '',
      displayOrder: int.tryParse(json['displayOrder']?.toString() ?? '1') ?? 1,
      isActive: json['isActive'] != false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'desktopImageUrl': desktopImageUrl,
    'mobileImageUrl': mobileImageUrl,
    'destination': destination,
    'ctaText': ctaText,
    'badgeText': badgeText,
    'displayOrder': displayOrder,
    'isActive': isActive,
  };
}
