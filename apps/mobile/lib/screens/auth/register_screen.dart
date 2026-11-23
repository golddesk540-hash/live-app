import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../widgets/popo_primary_button.dart';
import '../../widgets/popo_icon_button.dart';
import '../../auth/auth_state.dart';
import 'phone_otp_screen.dart';

/// Premium Popo Live User Registration Screen
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController _nicknameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _termsAccepted = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nicknameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    final nickname = _nicknameController.text.trim();
    final email = _emailController.text.trim().toLowerCase();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    // Client-side validations
    if (nickname.isNotEmpty && (nickname.length < 3 || nickname.length > 20)) {
      setState(() {
        _errorMessage = PopoStrings.get('err_nickname_short');
      });
      return;
    }

    if (email.isEmpty ||
        !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      setState(() {
        _errorMessage = PopoStrings.get('err_invalid_email');
      });
      return;
    }

    if (password.length < 8) {
      setState(() {
        _errorMessage = PopoStrings.get('err_password_short');
      });
      return;
    }

    if (password != confirmPassword) {
      setState(() {
        _errorMessage = PopoStrings.get('err_password_mismatch');
      });
      return;
    }

    if (!_termsAccepted) {
      setState(() {
        _errorMessage = PopoStrings.get('err_terms_required');
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final success = await AuthState.instance.register(
      nickname: nickname.isNotEmpty ? nickname : 'Amina Noor',
      email: email,
      password: password,
    );

    if (!mounted) return;
    setState(() {
      _isLoading = false;
    });

    if (success) {
      // Proceed to Phone OTP step according to registration lifecycle
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => PhoneOtpScreen(
            initialPhone: email.contains('@') ? '3001234567' : email,
            nickname: nickname.isNotEmpty ? nickname : 'Amina Noor',
          ),
        ),
      );
    } else {
      setState(() {
        _errorMessage = AuthState.instance.errorMessage ??
            'Registration failed. Please check your information and try again.';
      });
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
                  vertical: 12.0,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header Titles
                      Text(
                        PopoStrings.get('register_title'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        PopoStrings.get('register_subtitle'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Nickname Input
                      TextField(
                        controller: _nicknameController,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 14,
                        ),
                        textInputAction: TextInputAction.next,
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

                      // Email Input
                      TextField(
                        controller: _emailController,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 14,
                        ),
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: PopoTheme.surface,
                          labelText: PopoStrings.get('email'),
                          labelStyle: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 13,
                          ),
                          prefixIcon: const Icon(
                            Icons.mail_outline_rounded,
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

                      // Password Input
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 14,
                        ),
                        textInputAction: TextInputAction.next,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: PopoTheme.surface,
                          labelText: PopoStrings.get('password'),
                          labelStyle: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 13,
                          ),
                          prefixIcon: const Icon(
                            Icons.lock_outline_rounded,
                            color: PopoTheme.textSecondary,
                            size: 20,
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_off_rounded
                                  : Icons.visibility_rounded,
                              color: PopoTheme.textSecondary,
                              size: 20,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
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

                      // Confirm Password Input
                      TextField(
                        controller: _confirmPasswordController,
                        obscureText: _obscureConfirmPassword,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 14,
                        ),
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _handleRegister(),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: PopoTheme.surface,
                          labelText: PopoStrings.get('confirm_password'),
                          labelStyle: const TextStyle(
                            color: PopoTheme.textSecondary,
                            fontSize: 13,
                          ),
                          prefixIcon: const Icon(
                            Icons.lock_reset_rounded,
                            color: PopoTheme.textSecondary,
                            size: 20,
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureConfirmPassword
                                  ? Icons.visibility_off_rounded
                                  : Icons.visibility_rounded,
                              color: PopoTheme.textSecondary,
                              size: 20,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscureConfirmPassword =
                                    !_obscureConfirmPassword;
                              });
                            },
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

                      // Terms & 18+ Checkbox
                      InkWell(
                        onTap: () {
                          setState(() {
                            _termsAccepted = !_termsAccepted;
                          });
                        },
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 24,
                              height: 24,
                              child: Checkbox(
                                value: _termsAccepted,
                                onChanged: (val) {
                                  setState(() {
                                    _termsAccepted = val ?? true;
                                  });
                                },
                                activeColor: PopoTheme.primary,
                                checkColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                PopoStrings.get('age_gate_checkbox'),
                                style: const TextStyle(
                                  color: PopoTheme.textSecondary,
                                  fontSize: 11.5,
                                  height: 1.35,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Error Banner
                      if (_errorMessage != null) ...[
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
                        const SizedBox(height: 16),
                      ],

                      // Register Button
                      PopoPrimaryButton(
                        text: PopoStrings.get('register_btn'),
                        isLoading: _isLoading,
                        onPressed: _isLoading ? null : _handleRegister,
                      ),
                      const SizedBox(height: 24),

                      // Login Redirect
                      Center(
                        child: TextButton(
                          onPressed: () => Navigator.of(context).maybePop(),
                          child: Text(
                            PopoStrings.get('already_have_account'),
                            style: const TextStyle(
                              color: PopoTheme.textPrimary,
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
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
