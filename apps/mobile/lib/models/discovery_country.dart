/// Strongly typed model for Country Filter Chips
class DiscoveryCountry {
  final String code;
  final String name;
  final String flag;
  final int activeRooms;

  const DiscoveryCountry({
    required this.code,
    required this.name,
    required this.flag,
    this.activeRooms = 0,
  });

  bool get isPopular => code == 'ALL';

  factory DiscoveryCountry.fromJson(Map<String, dynamic> json) {
    return DiscoveryCountry(
      code: json['code']?.toString().toUpperCase() ?? 'ALL',
      name: json['name']?.toString() ?? 'Popular',
      flag: json['flag']?.toString() ?? (json['code'] == 'ALL' ? '🔥' : '🌐'),
      activeRooms: int.tryParse(json['activeRooms']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'code': code,
    'name': name,
    'flag': flag,
    'activeRooms': activeRooms,
  };
}
