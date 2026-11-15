import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../api/api.dart';
import '../../widgets/popo_loading_indicator.dart';

/// Reusable horizontally scrollable country filter chips component
class CountryChips extends StatefulWidget {
  final String selectedCountryCode;
  final ValueChanged<String> onCountrySelected;

  const CountryChips({
    Key? key,
    required this.selectedCountryCode,
    required this.onCountrySelected,
  }) : super(key: key);

  @override
  State<CountryChips> createState() => _CountryChipsState();
}

class _CountryChipsState extends State<CountryChips> {
  final CountryService _countryService = CountryService();
  List<Map<String, dynamic>> _countries = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchCountries();
  }

  Future<void> _fetchCountries() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final response = await _countryService.getPopularCountries();
    if (!mounted) return;

    if (response.isSuccess && response.data is Map) {
      final list = response.data['popular'] as List?;
      if (list != null) {
        setState(() {
          _countries = list
              .map((item) => Map<String, dynamic>.from(item as Map))
              .toList();
          _isLoading = false;
        });
        return;
      }
    }

    // Fallback default list if backend list unavailable
    setState(() {
      _countries = [
        {'code': 'ALL', 'name': 'Popular', 'flag': '🔥', 'activeRooms': 0},
        {'code': 'PK', 'name': 'Pakistan', 'flag': '🇵🇰', 'activeRooms': 0},
        {'code': 'IN', 'name': 'India', 'flag': '🇮🇳', 'activeRooms': 0},
        {'code': 'PH', 'name': 'Philippines', 'flag': '🇵🇭', 'activeRooms': 0},
        {
          'code': 'US',
          'name': 'United States',
          'flag': '🇺🇸',
          'activeRooms': 0,
        },
      ];
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const SizedBox(
        height: 40,
        child: Center(
          child: PopoLoadingIndicator(size: 20, color: PopoTheme.cyan),
        ),
      );
    }

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
          final code = country['code']?.toString() ?? 'ALL';
          final name = country['name']?.toString() ?? code;
          final flag = country['flag']?.toString() ?? '';
          final isSelected = widget.selectedCountryCode == code;

          return GestureDetector(
            onTap: () => widget.onCountrySelected(code),
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
                  if (flag.isNotEmpty) ...[
                    Text(flag, style: const TextStyle(fontSize: 13)),
                    const SizedBox(width: 6),
                  ],
                  Text(
                    name,
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
