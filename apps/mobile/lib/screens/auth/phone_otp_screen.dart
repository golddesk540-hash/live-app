import 'dart:async';

import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../widgets/popo_primary_button.dart';
import '../../widgets/popo_secondary_button.dart';
import '../../widgets/popo_icon_button.dart';
import '../../widgets/popo_card.dart';
import '../../auth/auth_state.dart';
import '../../shell/app_shell.dart';
import '../profile/complete_profile_screen.dart';

/// Supported country dial code model
class CountryDialCode {
  final String name;
  final String flag;
  final String dialCode;
  final String code;

  const CountryDialCode({
    required this.name,
    required this.flag,
    required this.dialCode,
    required this.code,
  });
}

const List<CountryDialCode> _kPopularDialCodes = [
  CountryDialCode(name: 'Pakistan', flag: '🇵🇰', dialCode: '+92', code: 'PK'),
  CountryDialCode(
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    dialCode: '+971',
    code: 'AE',
  ),
  CountryDialCode(
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    dialCode: '+966',
    code: 'SA',
  ),
  CountryDialCode(
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    code: 'US',
  ),
  CountryDialCode(
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    code: 'GB',
  ),
  CountryDialCode(name: 'India', flag: '🇮🇳', dialCode: '+91', code: 'IN'),
  CountryDialCode(
    name: 'Bangladesh',
    flag: '🇧🇩',
    dialCode: '+880',
    code: 'BD',
  ),
  CountryDialCode(
    name: 'Philippines',
    flag: '🇵🇭',
    dialCode: '+63',
    code: 'PH',
  ),
  CountryDialCode(name: 'Turkey', flag: '🇹🇷', dialCode: '+90', code: 'TR'),
  CountryDialCode(name: 'Egypt', flag: '🇪🇬', dialCode: '+20', code: 'EG'),
];

/// Premium Phone Number & OTP Verification Screen
class PhoneOtpScreen extends StatefulWidget {
  const PhoneOtpScreen({Key? key}) : super(key: key);

  @override
  State<PhoneOtpScreen> createState() => _PhoneOtpScreenState();
}

class _PhoneOtpScreenState extends State<PhoneOtpScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();

  CountryDialCode _selectedCountry = _kPopularDialCodes[0];
  bool _codeSent = false;
  bool _isLoading = false;
  String? _errorMessage;

  // Countdown timer state
  Timer? _countdownTimer;
  int _secondsRemaining = 0;

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  void _startCountdown([int seconds = 60]) {
    _countdownTimer?.cancel();
    setState(() {
      _secondsRemaining = seconds;
    });

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 1) {
        setState(() {
          _secondsRemaining--;
        });
      } else {
        timer.cancel();
        setState(() {
          _secondsRemaining = 0;
        });
      }
    });
  }

  String get _formattedFullPhone {
    String raw = _phoneController.text.trim();
    if (raw.startsWith('0')) {
      raw = raw.substring(1);
    }
    return '${_selectedCountry.dialCode}$raw';
  }

  Future<void> _handleSendOtp() async {
    final rawPhone = _phoneController.text.trim();
    if (rawPhone.length < 7) {
      setState(() {
        _errorMessage = PopoStrings.get('err_invalid_phone');
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final fullPhone = _formattedFullPhone;
    final result = await AuthState.instance.sendPhoneOtp(fullPhone);

    if (!mounted) return;

    if (result['success'] == true) {
      setState(() {
        _isLoading = false;
        _codeSent = true;
      });
      _startCountdown(result['cooldown'] ?? 60);

      // If development OTP returned, notify user
      if (result['devOtp'] != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Popo Live OTP: ${result['devOtp']}'),
            backgroundColor: PopoTheme.surface,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage =
            result['message'] ?? 'Failed to dispatch verification code.';
      });
    }
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      setState(() {
        _errorMessage = PopoStrings.get('err_invalid_otp');
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final success = await AuthState.instance.verifyPhoneOtp(
      phone: _formattedFullPhone,
      otp: otp,
    );

    if (!mounted) return;

    if (success) {
      final isCompleted =
          AuthState.instance.currentUser?['isProfileCompleted'] == true;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) =>
              isCompleted ? const AppShell() : const CompleteProfileScreen(),
        ),
        (route) => false,
      );
    } else {
      setState(() {
        _isLoading = false;
        _errorMessage =
            AuthState.instance.errorMessage ?? 'Invalid verification code.';
      });
    }
  }

  void _showCountrySelector() {
    showModalBottomSheet(
      context: context,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  PopoStrings.get('select_country'),
                  style: const TextStyle(
                    color: PopoTheme.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Divider(color: PopoTheme.borderSubtle),
              Expanded(
                child: ListView.separated(
                  itemCount: _kPopularDialCodes.length,
                  separatorBuilder: (_, __) =>
                      const Divider(color: PopoTheme.borderSubtle, height: 1),
                  itemBuilder: (ctx, index) {
                    final item = _kPopularDialCodes[index];
                    final isSelected =
                        item.dialCode == _selectedCountry.dialCode;
                    return ListTile(
                      leading: Text(
                        item.flag,
                        style: const TextStyle(fontSize: 24),
                      ),
                      title: Text(
                        item.name,
                        style: TextStyle(
                          color: isSelected
                              ? PopoTheme.primary
                              : PopoTheme.textPrimary,
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.normal,
                          fontSize: 14,
                        ),
                      ),
                      trailing: Text(
                        item.dialCode,
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      onTap: () {
                        setState(() {
                          _selectedCountry = item;
                        });
                        Navigator.of(ctx).pop();
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
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
              onPressed: () {
                if (_codeSent) {
                  setState(() {
                    _codeSent = false;
                    _errorMessage = null;
                  });
                } else {
                  Navigator.of(context).maybePop();
                }
              },
            ),
            actions: [
              PopoIconButton(
                icon: Icons.translate_rounded,
                color: PopoTheme.cyan,
                tooltip: 'Switch Language (English / اردو)',
                onPressed: PopoStrings.toggleLanguage,
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24.0,
                  vertical: 12.0,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header Icon
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
                          child: Icon(
                            _codeSent
                                ? Icons.mark_email_read_rounded
                                : Icons.phone_android_rounded,
                            color: PopoTheme.primary,
                            size: 32,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      Text(
                        _codeSent
                            ? PopoStrings.get('enter_code')
                            : PopoStrings.get('phone_otp_title'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _codeSent
                            ? '${PopoStrings.get('code_sent_to')} $_formattedFullPhone'
                            : PopoStrings.get('phone_otp_subtitle'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 32),

                      if (!_codeSent) ...[
                        // Phone Number Input with Country Code Selector
                        PopoCard(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          child: Row(
                            children: [
                              InkWell(
                                onTap: _showCountrySelector,
                                borderRadius: BorderRadius.circular(8),
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 8,
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        _selectedCountry.flag,
                                        style: const TextStyle(fontSize: 20),
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        _selectedCountry.dialCode,
                                        style: const TextStyle(
                                          color: PopoTheme.textPrimary,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                      const Icon(
                                        Icons.arrow_drop_down,
                                        color: PopoTheme.textSecondary,
                                        size: 20,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(
                                height: 28,
                                child: VerticalDivider(
                                  color: PopoTheme.borderSubtle,
                                  thickness: 1,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: TextField(
                                  controller: _phoneController,
                                  keyboardType: TextInputType.phone,
                                  style: const TextStyle(
                                    color: PopoTheme.textPrimary,
                                    fontSize: 15,
                                  ),
                                  decoration: InputDecoration(
                                    hintText: PopoStrings.get('phone_hint'),
                                    hintStyle: const TextStyle(
                                      color: Colors.white24,
                                      fontSize: 14,
                                    ),
                                    border: InputBorder.none,
                                    isDense: true,
                                    contentPadding: const EdgeInsets.symmetric(
                                      vertical: 10,
                                    ),
                                  ),
                                  onSubmitted: (_) => _handleSendOtp(),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        PopoPrimaryButton(
                          text: PopoStrings.get('send_code'),
                          isLoading: _isLoading,
                          onPressed: _isLoading ? null : _handleSendOtp,
                          icon: Icons.send_rounded,
                        ),
                      ] else ...[
                        // 6-Digit OTP Field
                        TextField(
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: PopoTheme.textPrimary,
                            fontSize: 24,
                            letterSpacing: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          decoration: InputDecoration(
                            counterText: '',
                            filled: true,
                            fillColor: PopoTheme.surface,
                            hintText: '••••••',
                            hintStyle: const TextStyle(
                              color: Colors.white24,
                              letterSpacing: 8,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(
                                color: PopoTheme.borderSubtle,
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(
                                color: PopoTheme.borderSubtle,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(
                                color: PopoTheme.primary,
                                width: 2,
                              ),
                            ),
                          ),
                          onSubmitted: (_) => _handleVerifyOtp(),
                        ),
                        const SizedBox(height: 14),

                        // Resend Countdown Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _codeSent = false;
                                  _otpController.clear();
                                  _errorMessage = null;
                                });
                              },
                              child: Text(
                                PopoStrings.get('change_number'),
                                style: const TextStyle(
                                  color: PopoTheme.cyan,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            if (_secondsRemaining > 0)
                              Text(
                                '${PopoStrings.get('resend_in')} ${_secondsRemaining}${PopoStrings.get('seconds')}',
                                style: const TextStyle(
                                  color: PopoTheme.textSecondary,
                                  fontSize: 12,
                                ),
                              )
                            else
                              TextButton(
                                onPressed: _isLoading ? null : _handleSendOtp,
                                child: Text(
                                  PopoStrings.get('resend_code'),
                                  style: const TextStyle(
                                    color: PopoTheme.primary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Verify Button
                        PopoPrimaryButton(
                          text: PopoStrings.get('verify_and_login'),
                          isLoading: _isLoading,
                          onPressed: _isLoading ? null : _handleVerifyOtp,
                          icon: Icons.verified_rounded,
                        ),
                      ],

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
