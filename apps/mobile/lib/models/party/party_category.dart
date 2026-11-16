/// Canonical party room category model
/// Corresponds to endpoint: GET /api/party/categories
class PartyCategory {
  final String id;
  final String name;
  final String? icon;
  final int displayOrder;

  const PartyCategory({
    required this.id,
    required this.name,
    this.icon,
    this.displayOrder = 0,
  });

  factory PartyCategory.fromJson(Map<String, dynamic> json) {
    return PartyCategory(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Category',
      icon: json['icon']?.toString(),
      displayOrder:
          (json['displayOrder'] as num?)?.toInt() ??
          (json['display_order'] as num?)?.toInt() ??
          0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'icon': icon,
    'displayOrder': displayOrder,
  };
}
