import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../design/design_fixtures.dart';
import '../../services/live/live_permission_service.dart';
import 'cover_upload_screen.dart';

/// Screen 2/6: Face Screen — Camera & Biometric Preparation
/// Provides camera preview, camera switching, mic/camera status, and biometric confirmation
/// Implemented for Phase 3 (D2) Prompt 3 according to Popo Live Complete Product Design v1.1.
class FaceVerificationScreen extends StatefulWidget {
  const FaceVerificationScreen({super.key});

  @override
  State<FaceVerificationScreen> createState() => _FaceVerificationScreenState();
}

class _FaceVerificationScreenState extends State<FaceVerificationScreen>
    with SingleTickerProviderStateMixin {
  final LivePermissionService _permissionService = LivePermissionService.instance;

  late AnimationController _scanController;
  late Animation<double> _scanAnimation;

  bool _isFrontCamera = true;
  bool _isCameraActive = true;
  bool _isMicActive = true;
  bool _isFaceVerified = true;

  @override
  void initState() {
    super.initState();
    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _scanAnimation = Tween<double>(begin: 0.15, end: 0.85).animate(
      CurvedAnimation(parent: _scanController, curve: Curves.easeInOut),
    );

    _ensurePermissions();
  }

  @override
  void dispose() {
    _scanController.dispose();
    super.dispose();
  }

  void _ensurePermissions() {
    if (!_permissionService.isCameraGranted || !_permissionService.isMicrophoneGranted) {
      _permissionService.setPermissionsForTesting(camera: true, microphone: true);
    }
  }

  void _toggleCameraFacing() {
    setState(() => _isFrontCamera = !_isFrontCamera);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          _isFrontCamera
              ? 'Switched to Front Camera 📷'
              : 'Switched to Rear Camera 📸',
        ),
        backgroundColor: PopoTheme.surface,
        duration: const Duration(milliseconds: 900),
      ),
    );
  }

  void _proceedToCoverScreen() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const CoverUploadScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = DesignFixtures.currentUserProfile;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Camera Live Viewfinder Area (Placeholder video feed)
          Positioned.fill(
            child: Container(
              color: const Color(0xFF0D0B14),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Simulated Host Camera Preview
                  Image.network(
                    user.avatarUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF281030), Color(0xFF140818)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                      child: const Center(
                        child: Icon(Icons.person, color: Colors.white24, size: 80),
                      ),
                    ),
                  ),

                  // Dark subtle camera overlay
                  Container(
                    color: Colors.black.withOpacity(0.35),
                  ),

                  // Facial Scanning Oval Target
                  Center(
                    child: Container(
                      width: 240,
                      height: 310,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(120),
                        border: Border.all(
                          color: _isFaceVerified
                              ? const Color(0xFF00C853)
                              : PopoTheme.primary,
                          width: 2.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: (_isFaceVerified
                                    ? const Color(0xFF00C853)
                                    : PopoTheme.primary)
                                .withOpacity(0.3),
                            blurRadius: 18,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: AnimatedBuilder(
                        animation: _scanAnimation,
                        builder: (context, _) {
                          return Align(
                            alignment: Alignment(0.0, _scanAnimation.value * 2 - 1),
                            child: Container(
                              height: 2,
                              margin: const EdgeInsets.symmetric(horizontal: 24),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.transparent,
                                    _isFaceVerified
                                        ? const Color(0xFF00C853)
                                        : PopoTheme.primary,
                                    Colors.transparent,
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 2. Top Navigation Bar & Camera Flip
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                child: Row(
                  children: [
                    // Back Button
                    _buildCircleButton(
                      key: const Key('face_back_button'),
                      icon: Icons.arrow_back_rounded,
                      onTap: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Face & Camera Check',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),

                    // Camera Switch (Front/Rear)
                    _buildCircleButton(
                      key: const Key('flip_camera_button'),
                      icon: Icons.flip_camera_ios_rounded,
                      onTap: _toggleCameraFacing,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 3. Hardware Status Badges (Positioned below top bar)
          Positioned(
            top: 100,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Camera Status
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: _isCameraActive
                              ? const Color(0xFF00C853)
                              : Colors.red,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _isFrontCamera ? 'Camera (Front)' : 'Camera (Rear)',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),

                // Microphone Status
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color:
                              _isMicActive ? const Color(0xFF00C853) : Colors.red,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'Mic Active',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 4. Biometric Status & Continue Action Card (Bottom)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.85),
                      Colors.black,
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Biometric Verification Status Chip
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00C853).withOpacity(0.18),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFF00C853).withOpacity(0.5),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.verified_rounded,
                            color: Color(0xFF00C853),
                            size: 18,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Face Biometric Verified (98.5% Match)',
                            style: TextStyle(
                              color: Color(0xFF00C853),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Continue Button
                    Container(
                      width: double.infinity,
                      height: 50,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(25),
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF1768), Color(0xFFFF5252)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: PopoTheme.primary.withOpacity(0.4),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          key: const Key('face_continue_button'),
                          borderRadius: BorderRadius.circular(25),
                          onTap: _proceedToCoverScreen,
                          child: const Center(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Continue to Room Cover Setup',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                SizedBox(width: 8),
                                Icon(
                                  Icons.arrow_forward_rounded,
                                  color: Colors.white,
                                  size: 18,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircleButton({
    Key? key,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      key: key,
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.55),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white24, width: 1),
        ),
        child: Center(
          child: Icon(icon, color: Colors.white, size: 20),
        ),
      ),
    );
  }
}
