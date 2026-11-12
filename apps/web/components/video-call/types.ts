export const ONE_TO_ONE_VIDEO_CALL_FEATURE = {
  enabled: false,
  defaultState: 'OFF' as const,
  requiresClientApproval: true,
  featureStatusLabel: 'Disabled',
  releaseStageLabel: 'Post-Launch / Future Phase (Approval Pending)',
  approvalRequirementLabel: 'Client Sign-Off Required',
  permissionsStatusLabel: 'None requested (Camera & Mic remain inactive)',
} as const;
