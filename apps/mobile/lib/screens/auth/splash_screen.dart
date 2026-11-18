import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../auth/auth_state.dart';
import '../../shell/app_shell.dart';
import '../profile/complete_profile_screen.dart';
import 'age_gate_screen.dart';
import 'login_screen.dart';

/// Premium Popo Live Splash Screen with authentic branding and session resolution
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeIn,
    );

    _scaleAnimation = Tween<double>(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );

    _animController.forward();
    _resolveInitialRoute();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _resolveInitialRoute() async {
    // Artificial minimum delay for smooth visual transition (800ms)
    await Future.wait([
      AuthState.instance.initialize(),
      Future.delayed(const Duration(milliseconds: 800)),
    ]);

    if (!mounted) return;

    final status = AuthState.instance.status;

    if (status == AuthStatus.termsRequired) {
      // Must accept 18+ Terms of Service before accessing any features
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const AgeGateScreen()),
      );
    } else if (status == AuthStatus.authenticated) {
      // Valid session restored: route based on profile completion
      final isCompleted =
          AuthState.instance.currentUser?['isProfileCompleted'] == true;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => isCompleted
              ? const AppShell(initialIndex: 1)
              : const CompleteProfileScreen(),
        ),
      );
    } else {
      // 18+ accepted, but unauthenticated -> proceed to Login
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(flex: 2),
              ScaleTransition(
                scale: _scaleAnimation,
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Column(
                    children: [
                      // Branded Glowing Logo Emblem
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          gradient: PopoTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(26),
                          boxShadow: [
                            BoxShadow(
                              color: PopoTheme.primary.withOpacity(0.45),
                              blurRadius: 28,
                              spreadRadius: 3,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'PL',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 38,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        PopoStrings.appName,
                        style: const TextStyle(
                          color: PopoTheme.textPrimary,
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Live Streams • Multi-Seat Party • PK Battles',
                        style: TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 12,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(flex: 2),
              const PopoLoadingIndicator(size: 32),
              const SizedBox(height: 48),
            ],
          ),
        ),
      ),
    );
  }
}
