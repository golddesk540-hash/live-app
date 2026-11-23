import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../models/models.dart';
import '../../api/api_config.dart';
import '../../repositories/discovery_repository.dart';

/// Reusable horizontally scrollable country filter chips component
class CountryChips extends StatefulWidget {
  final String selectedCountryCode;
  final ValueChanged<String> onCountrySelected;
  final List<DiscoveryCountry>? countries;

  const CountryChips({
    super.key,
    required this.selectedCountryCode,
    required this.onCountrySelected,
    this.countries,
  });

  @override
  State<CountryChips> createState() => _CountryChipsState();
}

class _CountryChipsState extends State<CountryChips> {
  final DiscoveryRepository _repository = DiscoveryRepository.instance;
  List<DiscoveryCountry> _countries = [];

  static const List<DiscoveryCountry> _defaultFixtureCountries = [
    DiscoveryCountry(code: 'ALL', name: 'Popular', flag: '🔥', activeRooms: 8),
    DiscoveryCountry(code: 'PK', name: 'Pakistan', flag: '🇵🇰', activeRooms: 8),
    DiscoveryCountry(code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', activeRooms: 0),
    DiscoveryCountry(code: 'AE', name: 'UAE', flag: '🇦🇪', activeRooms: 0),
    DiscoveryCountry(code: 'TR', name: 'Turkey', flag: '🇹🇷', activeRooms: 0),
    DiscoveryCountry(code: 'US', name: 'USA', flag: '🇺🇸', activeRooms: 0),
  ];

  @override
  void initState() {
    super.initState();
    if (widget.countries != null && widget.countries!.isNotEmpty) {
      _countries = widget.countries!;
    } else {
      _countries = _defaultFixtureCountries;
      _tryFetchDynamicCountries();
    }
  }

  Future<void> _tryFetchDynamicCountries() async {
    try {
      final list = await _repository.fetchPopularCountries(refresh: true);
      if (!mounted) return;
      if (list.isNotEmpty) {
        setState(() {
          _countries = list;
        });
      }
    } catch (_) {
      if (!ApiConfig.useLiveApi) {
        // Retain default fixture countries when offline
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _countries.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final country = _countries[index];
          final isSelected = widget.selectedCountryCode == country.code;

          return GestureDetector(
            onTap: () => widget.onCountrySelected(country.code),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected
                    ? PopoTheme.primary.withOpacity(0.18)
                    : PopoTheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected
                      ? PopoTheme.primary
                      : PopoTheme.borderSubtle,
                  width: isSelected ? 1.5 : 1.0,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: PopoTheme.primary.withOpacity(0.25),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (country.flag.isNotEmpty) ...[
                    Text(country.flag, style: const TextStyle(fontSize: 13)),
                    const SizedBox(width: 6),
                  ],
                  Text(
                    country.name,
                    style: TextStyle(
                      color: isSelected
                          ? PopoTheme.textPrimary
                          : PopoTheme.textSecondary,
                      fontSize: 12,
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
