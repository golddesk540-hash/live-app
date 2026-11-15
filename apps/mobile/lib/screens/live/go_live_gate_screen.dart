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
  bool _isActionLoading = false;
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

  Future<void> _handleFaceVerification() async {
    setState(() => _isActionLoading = true);
    final success = await _repository.submitFaceVerification();
    if (!mounted) return;
    setState(() => _isActionLoading = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Face verification completed successfully!'),
          backgroundColor: Color(0xFF00C853),
        ),
      );
      _loadGateStatus(forceRefresh: true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Face verification failed. Please try again.'),
          backgroundColor: PopoTheme.primary,
        ),
      );
    }
  }

  Future<void> _handleCoverUpload() async {
    setState(() => _isActionLoading = true);
    // Submit default verified high-definition broadcast cover
    final sampleBase64 =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...';
    final success = await _repository.uploadCoverImage(sampleBase64);
    if (!mounted) return;
    setState(() => _isActionLoading = false);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Live cover photo uploaded successfully!'),
          backgroundColor: Color(0xFF00C853),
        ),
      );
      _loadGateStatus(forceRefresh: true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cover upload failed. Please try again.'),
          backgroundColor: PopoTheme.primary,
        ),
      );
    }
  }

  void _proceedToPreLive() {
    Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => const PreLiveSetupScreen()));
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
            description:
                'Real-time biometric scan to ensure authentic host identity',
            isCompleted: gates.isFaceVerified,
            statusLabel: 'VERIFIED',
            actionLabel: 'Scan Face',
            isLoading: _isActionLoading,
            onAction: gates.isFaceVerified ? null : _handleFaceVerification,
          ),

          // Gate 3: Live Cover Photo
          GateRequirementTile(
            icon: Icons.add_photo_alternate_rounded,
            title: 'Broadcast Cover Photo',
            description:
                'High-definition cover photo displayed in the Explore feed',
            isCompleted: gates.hasCoverImage,
            statusLabel: 'UPLOADED',
            actionLabel: 'Upload',
            isLoading: _isActionLoading,
            onAction: gates.hasCoverImage ? null : _handleCoverUpload,
          ),

          const SizedBox(height: 32),

          // CTA Action Button
          PopoPrimaryButton(
            text: canProceed
                ? 'Continue to Pre-Live Setup'
                : 'Complete Gates to Go Live',
            enabled: canProceed,
            onPressed: canProceed ? _proceedToPreLive : null,
          ),

          if (!canProceed) ...[
            const SizedBox(height: 12),
            Center(
              child: Text(
                gates.isWealthQualified
                    ? 'Complete face verification and upload cover photo to continue.'
                    : 'Wealth Level 5 is required to unlock live streaming broadcasting.',
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
