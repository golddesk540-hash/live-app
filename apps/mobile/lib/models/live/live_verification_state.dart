import 'package:flutter/material.dart';

import '../../theme/popo_theme.dart';

/// Reusable verification states supported by backend
enum GateVerificationState {
  notStarted,
  inProgress,
  pending,
  approved,
  rejected,
  failed,
}

extension GateVerificationStateExtension on GateVerificationState {
  String get code {
    switch (this) {
      case GateVerificationState.notStarted:
        return 'not_started';
      case GateVerificationState.inProgress:
        return 'in_progress';
      case GateVerificationState.pending:
        return 'pending';
      case GateVerificationState.approved:
        return 'verified';
      case GateVerificationState.rejected:
        return 'rejected';
      case GateVerificationState.failed:
        return 'failed';
    }
  }

  String get label {
    switch (this) {
      case GateVerificationState.notStarted:
        return 'Not Started';
      case GateVerificationState.inProgress:
        return 'In Progress';
      case GateVerificationState.pending:
        return 'Pending Review';
      case GateVerificationState.approved:
        return 'Verified';
      case GateVerificationState.rejected:
        return 'Rejected';
      case GateVerificationState.failed:
        return 'Failed';
    }
  }

  Color get color {
    switch (this) {
      case GateVerificationState.approved:
        return PopoTheme.cyan;
      case GateVerificationState.inProgress:
      case GateVerificationState.pending:
        return PopoTheme.gold;
      case GateVerificationState.rejected:
      case GateVerificationState.failed:
        return PopoTheme.primary;
      case GateVerificationState.notStarted:
        return PopoTheme.textSecondary;
    }
  }

  IconData get icon {
    switch (this) {
      case GateVerificationState.approved:
        return Icons.check_circle_rounded;
      case GateVerificationState.inProgress:
      case GateVerificationState.pending:
        return Icons.hourglass_top_rounded;
      case GateVerificationState.rejected:
      case GateVerificationState.failed:
        return Icons.error_rounded;
      case GateVerificationState.notStarted:
        return Icons.radio_button_unchecked_rounded;
    }
  }

  static GateVerificationState fromString(String? raw) {
    if (raw == null) return GateVerificationState.notStarted;
    final normalized = raw.trim().toLowerCase();
    switch (normalized) {
      case 'verified':
      case 'approved':
        return GateVerificationState.approved;
      case 'in_progress':
        return GateVerificationState.inProgress;
      case 'pending':
        return GateVerificationState.pending;
      case 'rejected':
        return GateVerificationState.rejected;
      case 'failed':
        return GateVerificationState.failed;
      default:
        return GateVerificationState.notStarted;
    }
  }
}
