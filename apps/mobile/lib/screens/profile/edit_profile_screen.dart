import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
import '../../l10n/strings.dart';
import '../../widgets/popo_primary_button.dart';
import '../../widgets/popo_icon_button.dart';
import '../../widgets/popo_card.dart';
import '../../api/api.dart';
import '../../auth/auth_state.dart';

/// Screen allowing users to update their nickname, country, gender, and bio
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({Key? key}) : super(key: key);

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final TextEditingController _nicknameController = TextEditingController();
  final TextEditingController _bioController = TextEditingController();
  final ProfileService _profileService = ProfileService();

  String _selectedCountry = 'Pakistan';
  String _selectedCountryCode = 'PK';
  String _selectedGender = 'unspecified';
  String _birthdate = '';
  String? _avatarUrl;
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
    _populateCurrentData();
  }

  void _populateCurrentData() {
    final fixtureUser = DesignFixtures.currentUserProfile;
    final user = AuthState.instance.currentUser;

    _nicknameController.text =
        (user?['nickname']?.toString().isNotEmpty == true)
            ? user!['nickname'].toString()
            : fixtureUser.nickname;
    _bioController.text = (user?['bio']?.toString().isNotEmpty == true)
        ? user!['bio'].toString()
        : fixtureUser.bio;
    _selectedCountry = (user?['country']?.toString().isNotEmpty == true)
        ? user!['country'].toString()
        : fixtureUser.country;
    _selectedCountryCode =
        (user?['countryCode']?.toString().isNotEmpty == true)
            ? user!['countryCode'].toString()
            : fixtureUser.countryCode;
    _selectedGender = (user?['gender']?.toString().isNotEmpty == true)
        ? user!['gender'].toString()
        : fixtureUser.gender;
    _birthdate = user?['birthdate']?.toString() ?? '1998-05-14';
    _avatarUrl = user?['avatarUrl']?.toString() ?? fixtureUser.avatarUrl;
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    final nickname = _nicknameController.text.trim();
    final bio = _bioController.text.trim();

    if (nickname.length < 3 || nickname.length > 20) {
      setState(() {
        _errorMessage = PopoStrings.get('err_nickname_short');
      });
      return;
    }

    if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(nickname)) {
      setState(() {
        _errorMessage =
            'Nickname can only contain letters, numbers, and underscores.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    DesignFixtures.updateCurrentUserProfile(
      nickname: nickname,
      bio: bio,
      country: _selectedCountry,
      avatarUrl: _avatarUrl,
    );

    if (ApiConfig.useLiveApi) {
      try {
        await _profileService.updateProfile(
          nickname: nickname,
          bio: bio,
          country: _selectedCountry,
          countryCode: _selectedCountryCode,
          gender: _selectedGender,
        );
        await AuthState.instance.restoreSession();
      } catch (e) {
        if (!mounted) return;
        setState(() { _isLoading = false; });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: ' + e.toString()),
            backgroundColor: Colors.redAccent,
            duration: const Duration(seconds: 3),
          ),
        );
        return;
      }
    }

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(PopoStrings.get('profile_updated_success')),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(seconds: 2),
      ),
    );
    setState(() { _isLoading = false; });
    if (Navigator.of(context).canPop()) {
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: PopoStrings.currentLanguage,
      builder: (context, lang, _) {
        return Scaffold(
          backgroundColor: PopoTheme.background,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: PopoIconButton(
              icon: Icons.arrow_back_ios_new_rounded,
              iconSize: 18,
              tooltip: 'Back',
              onPressed: () => Navigator.of(context).maybePop(),
            ),
            title: Text(
              PopoStrings.get('edit_profile'),
              style: const TextStyle(
                color: PopoTheme.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                horizontal: 20.0,
                vertical: 12.0,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Avatar Header
                  Center(
                    child: Stack(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            gradient: PopoTheme.primaryGradient,
                            shape: BoxShape.circle,
                          ),
                          child: CircleAvatar(
                            radius: 44,
                            backgroundColor: PopoTheme.surface,
                            backgroundImage:
                                (_avatarUrl != null &&
                                    _avatarUrl!.startsWith('http'))
                                ? NetworkImage(_avatarUrl!)
                                : null,
                            child:
                                (_avatarUrl == null ||
                                    !_avatarUrl!.startsWith('http'))
                                ? const Icon(
                                    Icons.person,
                                    color: PopoTheme.textSecondary,
                                    size: 44,
                                  )
                                : null,
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: PopoTheme.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.camera_alt_rounded,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ),
                      ],
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

                  // Bio Field
                  TextField(
                    controller: _bioController,
                    maxLines: 3,
                    style: const TextStyle(
                      color: PopoTheme.textPrimary,
                      fontSize: 14,
                    ),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: PopoTheme.surface,
                      labelText: PopoStrings.get('bio'),
                      labelStyle: const TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 13,
                      ),
                      hintText: PopoStrings.get('bio_hint'),
                      hintStyle: const TextStyle(
                        color: Colors.white24,
                        fontSize: 12,
                      ),
                      alignLabelWithHint: true,
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
                  const SizedBox(height: 16),

                  // Birthday Lock Info Card (Compliant with backend restrictions)
                  PopoCard(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.lock_outline_rounded,
                          color: PopoTheme.textSecondary,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${PopoStrings.get('birthdate')}: ${_birthdate.isNotEmpty ? _birthdate : 'Verified'}',
                                style: const TextStyle(
                                  color: PopoTheme.textPrimary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                PopoStrings.get('birthday_locked_notice'),
                                style: const TextStyle(
                                  color: PopoTheme.textSecondary,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
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

                  const SizedBox(height: 28),

                  PopoPrimaryButton(
                    text: PopoStrings.get('save_changes'),
                    isLoading: _isLoading,
                    onPressed: _isLoading ? null : _handleSave,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
