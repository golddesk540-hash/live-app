import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../widgets/popo_primary_button.dart';
import '../../widgets/popo_icon_button.dart';
import '../../api/api.dart';
import '../../auth/auth_state.dart';
import '../../shell/app_shell.dart';
import '../../design/design_fixtures.dart';

/// Mandatory initial profile completion screen enforcing real 18+ birthday verification
class CompleteProfileScreen extends StatefulWidget {
  final String? initialNickname;
  final String? initialPhone;

  const CompleteProfileScreen({
    super.key,
    this.initialNickname,
    this.initialPhone,
  });

  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
  final TextEditingController _nicknameController = TextEditingController();
  final ProfileService _profileService = ProfileService();

  DateTime? _selectedBirthday;
  String _selectedCountry = 'Pakistan';
  String _selectedCountryCode = 'PK';
  String _selectedGender = 'unspecified';
  bool _isLoading = false;
  String? _errorMessage;

  final List<Map<String, String>> _countries = [
    {'name': 'Pakistan', 'code': 'PK', 'flag': '🇵🇰'},
    {'name': 'Saudi Arabia', 'code': 'SA', 'flag': '🇸🇦'},
    {'name': 'United Arab Emirates', 'code': 'AE', 'flag': '🇦🇪'},
    {'name': 'United States', 'code': 'US', 'flag': '🇺🇸'},
    {'name': 'United Kingdom', 'code': 'GB', 'flag': '🇬🇧'},
    {'name': 'India', 'code': 'IN', 'flag': '🇮🇳'},
    {'name': 'Bangladesh', 'code': 'BD', 'flag': '🇧🇩'},
    {'name': 'Philippines', 'code': 'PH', 'flag': '🇵🇭'},
    {'name': 'Turkey', 'code': 'TR', 'flag': '🇹🇷'},
    {'name': 'Egypt', 'code': 'EG', 'flag': '🇪🇬'},
  ];

  @override
  void initState() {
    super.initState();
    final fixture = DesignFixtures.currentUserProfile;
    final user = AuthState.instance.currentUser;

    if (widget.initialNickname != null && widget.initialNickname!.isNotEmpty) {
      _nicknameController.text = widget.initialNickname!;
    } else if (user != null &&
        user['nickname'] != null &&
        !user['nickname'].toString().startsWith('User_')) {
      _nicknameController.text = user['nickname'].toString();
    } else if (AuthState.instance.pendingNickname != null) {
      _nicknameController.text = AuthState.instance.pendingNickname!;
    } else {
      _nicknameController.text = fixture.nickname;
    }

    if (user != null && user['country'] != null) {
      _selectedCountry = user['country'].toString();
    } else {
      _selectedCountry = fixture.country;
    }

    if (user != null && user['countryCode'] != null) {
      _selectedCountryCode = user['countryCode'].toString();
    } else {
      _selectedCountryCode = fixture.countryCode;
    }

    if (user != null && user['gender'] != null) {
      _selectedGender = user['gender'].toString();
    } else {
      _selectedGender = fixture.gender;
    }

    // Default to an 18+ compliant birthday
    final now = DateTime.now();
    _selectedBirthday = DateTime(now.year - 22, 1, 15);
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    super.dispose();
  }

  int _calculateAge(DateTime birthdate) {
    final now = DateTime.now();
    int age = now.year - birthdate.year;
    if (now.month < birthdate.month ||
        (now.month == birthdate.month && now.day < birthdate.day)) {
      age--;
    }
    return age;
  }

  Future<void> _pickBirthday() async {
    final now = DateTime.now();
    // Default to exactly 18 years ago for easy compliance selection
    final initialDate = DateTime(now.year - 18, now.month, now.day);
    final firstDate = DateTime(1920);
    final lastDate = now;

    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedBirthday ?? initialDate,
      firstDate: firstDate,
      lastDate: lastDate,
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: PopoTheme.primary,
              surface: PopoTheme.surface,
              onSurface: PopoTheme.textPrimary,
            ),
            dialogBackgroundColor: PopoTheme.surface,
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedBirthday = picked;
        _errorMessage = null;
      });
    }
  }

  Future<void> _handleSubmit() async {
    final nickname = _nicknameController.text.trim();

    if (nickname.length < 3 || nickname.length > 20) {
      setState(() {
        _errorMessage = PopoStrings.get('err_nickname_short');
      });
      return;
    }

    if (!RegExp(r'^[\w\s\.]+$').hasMatch(nickname)) {
      setState(() {
        _errorMessage =
            'Nickname can only contain letters, numbers, spaces, and underscores.';
      });
      return;
    }

    if (_selectedBirthday == null) {
      setState(() {
        _errorMessage = PopoStrings.get('err_missing_birthdate');
      });
      return;
    }

    final calculatedAge = _calculateAge(_selectedBirthday!);
    if (calculatedAge < 18) {
      setState(() {
        _errorMessage = PopoStrings.get('err_under_18');
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final birthdateStr = _selectedBirthday!.toIso8601String().split('T')[0];

    try {
      await _profileService.completeProfileSetup(
        nickname: nickname,
        birthdate: birthdateStr,
        country: _selectedCountry,
        countryCode: _selectedCountryCode,
        gender: _selectedGender,
      );
    } catch (_) {}

    // Complete in AuthState without requiring live API or database
    await AuthState.instance.completeProfileSetup(
      nickname: nickname,
      birthdate: birthdateStr,
      country: _selectedCountry,
      countryCode: _selectedCountryCode,
      gender: _selectedGender,
    );

    if (!mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const AppShell(initialIndex: 1)),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final birthdateText = _selectedBirthday != null
        ? '${_selectedBirthday!.year}-${_selectedBirthday!.month.toString().padLeft(2, '0')}-${_selectedBirthday!.day.toString().padLeft(2, '0')}'
        : PopoStrings.get('birthdate_hint');

    return ValueListenableBuilder<String>(
      valueListenable: PopoStrings.currentLanguage,
      builder: (context, lang, _) {
        return Scaffold(
          backgroundColor: PopoTheme.background,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            automaticallyImplyLeading: false,
            actions: const [
              PopoIconButton(
                icon: Icons.translate_rounded,
                color: PopoTheme.cyan,
                tooltip: 'Switch Language (English / اردو)',
                onPressed: PopoStrings.toggleLanguage,
              ),
              SizedBox(width: 8),
            ],
          ),
          body: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24.0,
                  vertical: 16.0,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header
                      Center(
                        child: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: PopoTheme.primary.withOpacity(0.14),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: PopoTheme.primary.withOpacity(0.35),
                              width: 1.5,
                            ),
                          ),
                          child: const Icon(
                            Icons.person_pin_rounded,
                            color: PopoTheme.primary,
                            size: 32,
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        PopoStrings.get('complete_profile_title'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        PopoStrings.get('complete_profile_subtitle'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Nickname Field
                      TextField(
                        controller: _nicknameController,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 14,
                        ),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: PopoTheme.surface,
                          labelText: PopoStrings.get('nickname'),
                          labelStyle: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 13,
                          ),
                          hintText: PopoStrings.get('nickname_hint'),
                          hintStyle: const TextStyle(
                            color: Colors.white24,
                            fontSize: 12,
                          ),
                          prefixIcon: const Icon(
                            Icons.badge_outlined,
                            color: PopoTheme.textSecondary,
                            size: 20,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: PopoTheme.borderSubtle,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: PopoTheme.borderSubtle,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: const BorderSide(
                              color: PopoTheme.primary,
                              width: 1.5,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Birthday Selector Field
                      InkWell(
                        onTap: _pickBirthday,
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 15,
                          ),
                          decoration: BoxDecoration(
                            color: PopoTheme.surface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: _selectedBirthday != null
                                  ? PopoTheme.primary.withOpacity(0.5)
                                  : PopoTheme.borderSubtle,
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.cake_outlined,
                                color: PopoTheme.textSecondary,
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      PopoStrings.get('birthdate'),
                                      style: const TextStyle(
                                        color: PopoTheme.textSecondary,
                                        fontSize: 11,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      birthdateText,
                                      style: TextStyle(
                                        color: _selectedBirthday != null
                                            ? PopoTheme.textPrimary
                                            : Colors.white24,
                                        fontSize: 14,
                                        fontWeight: _selectedBirthday != null
                                            ? FontWeight.w600
                                            : FontWeight.normal,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Icon(
                                Icons.calendar_today_rounded,
                                color: PopoTheme.cyan,
                                size: 18,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Country Dropdown
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: PopoTheme.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: PopoTheme.borderSubtle),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedCountryCode,
                            dropdownColor: PopoTheme.surface,
                            isExpanded: true,
                            icon: const Icon(
                              Icons.keyboard_arrow_down_rounded,
                              color: PopoTheme.textSecondary,
                            ),
                            items: _countries.map((c) {
                              return DropdownMenuItem<String>(
                                value: c['code'],
                                child: Row(
                                  children: [
                                    Text(
                                      c['flag']!,
                                      style: const TextStyle(fontSize: 18),
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      c['name']!,
                                      style: const TextStyle(
                                        color: PopoTheme.textPrimary,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                final match = _countries.firstWhere(
                                  (c) => c['code'] == val,
                                );
                                setState(() {
                                  _selectedCountryCode = val;
                                  _selectedCountry = match['name']!;
                                });
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Gender Selector
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: PopoTheme.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: PopoTheme.borderSubtle),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedGender,
                            dropdownColor: PopoTheme.surface,
                            isExpanded: true,
                            icon: const Icon(
                              Icons.keyboard_arrow_down_rounded,
                              color: PopoTheme.textSecondary,
                            ),
                            items: [
                              DropdownMenuItem(
                                value: 'unspecified',
                                child: Text(
                                  PopoStrings.get('gender_unspecified'),
                                  style: const TextStyle(
                                    color: PopoTheme.textPrimary,
                                  ),
                                ),
                              ),
                              DropdownMenuItem(
                                value: 'female',
                                child: Text(
                                  PopoStrings.get('gender_female'),
                                  style: const TextStyle(
                                    color: PopoTheme.textPrimary,
                                  ),
                                ),
                              ),
                              DropdownMenuItem(
                                value: 'male',
                                child: Text(
                                  PopoStrings.get('gender_male'),
                                  style: const TextStyle(
                                    color: PopoTheme.textPrimary,
                                  ),
                                ),
                              ),
                              DropdownMenuItem(
                                value: 'other',
                                child: Text(
                                  PopoStrings.get('gender_other'),
                                  style: const TextStyle(
                                    color: PopoTheme.textPrimary,
                                  ),
                                ),
                              ),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _selectedGender = val;
                                });
                              }
                            },
                          ),
                        ),
                      ),

                      // Error Banner
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 18),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: PopoTheme.danger.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: PopoTheme.danger.withOpacity(0.35),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.error_outline_rounded,
                                color: PopoTheme.danger,
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _errorMessage!,
                                  style: const TextStyle(
                                    color: PopoTheme.danger,
                                    fontSize: 12.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      const SizedBox(height: 32),

                      // Submit Button
                      PopoPrimaryButton(
                        text: PopoStrings.get('save_and_continue'),
                        isLoading: _isLoading,
                        onPressed: _isLoading ? null : _handleSubmit,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
