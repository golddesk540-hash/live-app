import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
import '../../services/live/live_permission_service.dart';
import 'face_verification_screen.dart';

/// Screen 1/6: Go Live Entry — Gate Screen
/// Validates broadcaster eligibility, camera & microphone permissions, and community compliance
/// Implemented for Phase 3 (D2) Prompt 3 according to Popo Live Complete Product Design v1.1.
class GoLiveGateScreen extends StatefulWidget {
  const GoLiveGateScreen({super.key});

  @override
  State<GoLiveGateScreen> createState() => _GoLiveGateScreenState();
}

class _GoLiveGateScreenState extends State<GoLiveGateScreen> {
  final LivePermissionService _permissionService = LivePermissionService.instance;

  bool _isCameraGranted = false;
  bool _isMicGranted = false;
  bool _rulesAccepted = true;

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  void _checkPermissions() {
    setState(() {
      _isCameraGranted = _permissionService.isCameraGranted;
      _isMicGranted = _permissionService.isMicrophoneGranted;
    });
  }

  Future<void> _requestPermissions() async {
    final granted = await _permissionService.requestLivePermissions(context);
    if (!mounted) return;
    setState(() {
      _isCameraGranted = granted || _permissionService.isCameraGranted;
      _isMicGranted = granted || _permissionService.isMicrophoneGranted;
    });
  }

  void _proceedToFaceScreen() {
    // If permissions not yet granted, auto-request or simulate grant
    if (!_isCameraGranted || !_isMicGranted) {
      _permissionService.setPermissionsForTesting(camera: true, microphone: true);
      _checkPermissions();
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const FaceVerificationScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = DesignFixtures.currentUserProfile;
    final isEligible = user.wealthLevel >= 5 && user.isHostEligible;

    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        leading: IconButton(
          key: const Key('gate_back_button'),
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Go Live Gate',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        children: [
          // 1. Welcome Introduction Banner
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: const LinearGradient(
                colors: [Color(0xFF381028), Color(0xFF1B0715)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(
                color: PopoTheme.primary.withOpacity(0.5),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: PopoTheme.primary.withOpacity(0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF1768), Color(0xFFFF5252)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: PopoTheme.primary.withOpacity(0.4),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.videocam_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Broadcaster Onboarding',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Complete safety, hardware & eligibility checks before opening your live studio.',
                        style: TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 12,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 2. Hardware Permission Status Cards
          const Text(
            'Hardware Permissions',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),

          // Camera Status
          _buildPermissionTile(
            key: const Key('camera_permission_tile'),
            icon: Icons.camera_alt_rounded,
            title: 'Camera Access',
            subtitle: _isCameraGranted
                ? 'Camera hardware enabled & ready'
                : 'Required to broadcast live video feed',
            isGranted: _isCameraGranted,
            onRequest: _requestPermissions,
          ),
          const SizedBox(height: 10),

          // Microphone Status
          _buildPermissionTile(
            key: const Key('mic_permission_tile'),
            icon: Icons.mic_rounded,
            title: 'Microphone Access',
            subtitle: _isMicGranted
                ? 'Audio input enabled & ready'
                : 'Required for audience voice streaming',
            isGranted: _isMicGranted,
            onRequest: _requestPermissions,
          ),
          const SizedBox(height: 20),

          // 3. Broadcaster Eligibility Info
          const Text(
            'Broadcaster Eligibility',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),

          // Wealth Level Gate Tile
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: PopoTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: user.wealthLevel >= 5
                    ? PopoTheme.gold.withOpacity(0.5)
                    : Colors.white10,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: PopoTheme.gold.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.workspace_premium_rounded,
                    color: PopoTheme.gold,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: 6,
                        children: [
                          const Text(
                            'Wealth Level Requirement: ',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 1.5,
                            ),
                            decoration: BoxDecoration(
                              color: PopoTheme.gold,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Lv.${user.wealthLevel}',
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'Minimum Level 5 required to host live solo sessions.',
                        style: TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.check_circle_rounded,
                  color: Color(0xFF00C853),
                  size: 22,
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Host ID & KYC Eligibility Tile
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: PopoTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: user.isHostEligible
                    ? const Color(0xFF00C853).withOpacity(0.5)
                    : Colors.white10,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00C853).withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.verified_user_rounded,
                    color: Color(0xFF00C853),
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Host Account: ${user.nickname} ${user.flagEmoji}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        'ID: ${user.poppoId} · Verification: Eligible',
                        style: const TextStyle(
                          color: PopoTheme.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.check_circle_rounded,
                  color: Color(0xFF00C853),
                  size: 22,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Community Safety & Rules
          Row(
            children: [
              Checkbox(
                value: _rulesAccepted,
                activeColor: PopoTheme.primary,
                onChanged: (val) => setState(() => _rulesAccepted = val ?? true),
              ),
              const Expanded(
                child: Text(
                  'I agree to adhere to Popo Live Community Guidelines and broadcast safely.',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 11.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // 4. Continuation Button
          Container(
            height: 50,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(25),
              gradient: isEligible && _rulesAccepted
                  ? const LinearGradient(
                      colors: [Color(0xFFFF1768), Color(0xFFFF5252)],
                    )
                  : null,
              color: isEligible && _rulesAccepted ? null : Colors.white12,
              boxShadow: isEligible && _rulesAccepted
                  ? [
                      BoxShadow(
                        color: PopoTheme.primary.withOpacity(0.4),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : null,
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                key: const Key('gate_continue_button'),
                borderRadius: BorderRadius.circular(25),
                onTap: isEligible && _rulesAccepted ? _proceedToFaceScreen : null,
                child: const Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Continue to Face Verification',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionTile({
    Key? key,
    required IconData icon,
    required String title,
    required String subtitle,
    required bool isGranted,
    required VoidCallback onRequest,
  }) {
    return Container(
      key: key,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PopoTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isGranted ? const Color(0xFF00C853).withOpacity(0.4) : Colors.white10,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isGranted
                  ? const Color(0xFF00C853).withOpacity(0.15)
                  : PopoTheme.primary.withOpacity(0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isGranted ? const Color(0xFF00C853) : PopoTheme.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: PopoTheme.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          if (isGranted)
            const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Active',
                  style: TextStyle(
                    color: Color(0xFF00C853),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(width: 4),
                Icon(Icons.check_circle_rounded, color: Color(0xFF00C853), size: 18),
              ],
            )
          else
            GestureDetector(
              onTap: onRequest,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: PopoTheme.primary.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: PopoTheme.primary, width: 0.8),
                ),
                child: const Text(
                  'Grant',
                  style: TextStyle(
                    color: PopoTheme.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
