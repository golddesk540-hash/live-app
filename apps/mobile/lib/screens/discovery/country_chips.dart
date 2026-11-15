import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../models/models.dart';
import '../../repositories/discovery_repository.dart';
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
  final DiscoveryRepository _repository = DiscoveryRepository.instance;
  List<DiscoveryCountry> _countries = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchCountries();
  }

  Future<void> _fetchCountries() async {
    final list = await _repository.fetchPopularCountries();
    if (!mounted) return;

    setState(() {
      _countries = list;
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
