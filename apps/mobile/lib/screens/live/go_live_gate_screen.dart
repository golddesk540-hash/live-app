import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';
import '../../l10n/strings.dart';
import '../../models/live/live_models.dart';
import '../../repositories/live/live_repository.dart';
import '../../widgets/popo_loading_indicator.dart';
import '../../widgets/popo_error_state.dart';
import '../../widgets/popo_primary_button.dart';
import 'widgets/wealth_level_gate_card.dart';
import 'widgets/gate_requirement_tile.dart';
import 'face_verification_screen.dart';
import 'cover_upload_screen.dart';
import 'pre_live_setup_screen.dart';

/// Go-Live Eligibility Gate Screen
/// Strictly enforces Wealth Level 5, Biometric Face Verification, and Live Cover Photo
class GoLiveGateScreen extends StatefulWidget {
  const GoLiveGateScreen({Key? key}) : super(key: key);

  @override
  State<GoLiveGateScreen> createState() => _GoLiveGateScreenState();
}

class _GoLiveGateScreenState extends State<GoLiveGateScreen> {
  final LiveRepository _repository = LiveRepository.instance;

  LiveGatesStatus? _gatesStatus;
  bool _isLoading = true;
  bool _isVerifyingServer = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadGateStatus();
  }

  Future<void> _loadGateStatus({bool forceRefresh = false}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final status = await _repository.fetchGatesStatus(
        forceRefresh: forceRefresh,
      );
      if (!mounted) return;
      setState(() {
        _gatesStatus = status;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  /// Navigates to Face Verification screen with real-time biometric scanning
  Future<void> _handleFaceVerification() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const FaceVerificationScreen()),
    );

    // Refresh gate status whether verified or dismissed
    if (mounted) {
      await _loadGateStatus(forceRefresh: true);
      if (result == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Biometric face verification completed!'),
            backgroundColor: Color(0xFF00C853),
          ),
        );
      }
    }
  }

  /// Navigates to Cover Photo Upload screen
  Future<void> _handleCoverUpload() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CoverUploadScreen(
          currentCoverUrl: _gatesStatus?.coverImage.coverUrl,
        ),
      ),
    );

    // Refresh gate status
    if (mounted) {
      await _loadGateStatus(forceRefresh: true);
      if (result == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Broadcast cover photo saved successfully!'),
            backgroundColor: Color(0xFF00C853),
          ),
        );
      }
    }
  }

  /// Validates all 3 Go-Live gates directly on the backend before unlocking studio
  Future<void> _proceedToPreLive() async {
    setState(() => _isVerifyingServer = true);

    try {
      final result = await _repository.verifyEligibilityOnServer();
      if (!mounted) return;
      setState(() => _isVerifyingServer = false);

      if (result['eligible'] == true) {
        Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const PreLiveSetupScreen()));
      } else {
        final reasons =
            (result['reasons'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [];
        final missingGates =
            (result['missingGates'] as List<dynamic>?)
                ?.map((e) => e.toString())
                .toList() ??
            [];
        _showIneligibleBottomSheet(
          reasons: reasons,
          missingGates: missingGates,
          error:
              result['error']?.toString() ??
              'Server rejected broadcast eligibility.',
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _isVerifyingServer = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Verification check failed: $e'),
          backgroundColor: PopoTheme.primary,
        ),
      );
    }
  }

  /// Shows detailed bottom sheet when backend rejects broadcast eligibility
  void _showIneligibleBottomSheet({
    required List<String> reasons,
    required List<String> missingGates,
    required String error,
  }) {
    showModalBottomSheet(
      context: context,
      backgroundColor: PopoTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: PopoTheme.primary.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.warning_amber_rounded,
                    color: PopoTheme.primary,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Go-Live Requirements Incomplete',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              error,
              style: const TextStyle(
                color: PopoTheme.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            ...reasons.map(
              (r) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.close_rounded,
                      color: PopoTheme.primary,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        r,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                if (missingGates.contains('face_check'))
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: PopoTheme.cyan,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _handleFaceVerification();
                        },
                        icon: const Icon(Icons.face_rounded, size: 18),
                        label: const Text(
                          'Scan Face',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                if (missingGates.contains('cover_image'))
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: PopoTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _handleCoverUpload();
                        },
                        icon: const Icon(Icons.photo_camera_rounded, size: 18),
                        label: const Text(
                          'Upload Cover',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Center(
              child: TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text(
                  'Dismiss',
                  style: TextStyle(color: PopoTheme.textSecondary),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PopoTheme.background,
      appBar: AppBar(
        backgroundColor: PopoTheme.surface,
        elevation: 0,
        title: Text(
          PopoStrings.get('tab_go_live'),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: PopoTheme.cyan),
            onPressed: () => _loadGateStatus(forceRefresh: true),
            tooltip: 'Refresh Status',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: PopoLoadingIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: PopoErrorState(
          title: 'Gate Verification Failed',
          message: _errorMessage!,
          onRetry: () => _loadGateStatus(forceRefresh: true),
        ),
      );
    }

    final gates = _gatesStatus ?? LiveGatesStatus.initial();
    final canProceed = gates.canGoLive;

    return RefreshIndicator(
      onRefresh: () => _loadGateStatus(forceRefresh: true),
      color: PopoTheme.primary,
      backgroundColor: PopoTheme.surface,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Header Banner
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: PopoTheme.primary.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.videocam_rounded,
                  color: PopoTheme.primary,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Host Go-Live Eligibility',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Complete all 3 verification gates to broadcast',
                      style: TextStyle(
                        color: PopoTheme.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Gate 1: Wealth Level 5 Gate Card (Mandatory Rule)
          WealthLevelGateCard(gate: gates.wealthLevel),

          const SizedBox(height: 12),
          const Text(
            'Identity & Media Verification',
            style: TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),

          // Gate 2: Biometric Face KYC
          GateRequirementTile(
            icon: Icons.face_rounded,
            title: 'Biometric Face Verification',
            description: gates.isFaceVerified
                ? 'Identity verified via official KYC facial scanner'
                : 'Real-time biometric scan to ensure authentic host identity',
            isCompleted: gates.isFaceVerified,
            statusLabel: 'VERIFIED',
            actionLabel: 'Scan Face',
            onAction: _handleFaceVerification,
            onTap: _handleFaceVerification,
          ),

          // Gate 3: Live Cover Photo
          GateRequirementTile(
            icon: Icons.add_photo_alternate_rounded,
            title: 'Broadcast Cover Photo',
            description: gates.hasCoverImage
                ? 'High-definition cover photo active in Explore feed'
                : 'High-definition cover photo displayed in the Explore feed',
            isCompleted: gates.hasCoverImage,
            statusLabel: 'UPLOADED',
            actionLabel: gates.hasCoverImage ? 'Change' : 'Upload',
            onAction: _handleCoverUpload,
            onTap: _handleCoverUpload,
          ),

          const SizedBox(height: 32),

          // CTA Action Button with Server Validation
          PopoPrimaryButton(
            text: canProceed
                ? 'Continue to Pre-Live Setup'
                : 'Complete Gates to Go Live',
            enabled: canProceed && !_isVerifyingServer,
            isLoading: _isVerifyingServer,
            onPressed: canProceed ? _proceedToPreLive : null,
          ),

          if (!canProceed) ...[
            const SizedBox(height: 12),
            Center(
              child: Text(
                !gates.isWealthQualified
                    ? 'Wealth Level 5 is strictly required to unlock live streaming broadcasting.'
                    : !gates.isFaceVerified
                    ? 'Biometric face verification is required to verify host authenticity.'
                    : 'A live broadcast cover photo is required before going live.',
                style: const TextStyle(
                  color: PopoTheme.textSecondary,
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
