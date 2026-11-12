export type WithdrawalStatus = 'Pending' | 'Processing' | 'Approved' | 'Rejected' | 'Completed';

export type WithdrawalTab =
  | 'dashboard'
  | 'request_form'
  | 'payment_methods'
  | 'account_details'
  | 'review'
  | 'confirmation'
  | 'history';

export type WithdrawalDateFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month';

export type WithdrawalEmptyKind =
  | 'no_requests'
  | 'no_pending'
  | 'no_completed'
  | 'no_rejected'
  | 'no_search_results'
  | 'no_payment_methods';

export interface WithdrawalUserProfile {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  unitLabel: 'pts';
  baseAvailableDemoBalance: number;
}

export interface DemoPaymentMethod {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  extraFieldLabel: string;
  extraFieldPlaceholder: string;
  iconKey: 'bank' | 'wallet' | 'card';
  isPlaceholder: true;
}

export interface SavedAccountDetails {
  methodId: string;
  accountHolderName: string;
  rawAccountIdentifier: string;
  extraField: string;
  additionalNote: string;
  updatedAtLabel: string;
}

export interface WithdrawalTimelineStep {
  step: string;
  title: string;
  description: string;
  timestampLabel: string;
  state: 'done' | 'current' | 'rejected' | 'upcoming';
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  amount: number;
  unitLabel: 'pts';
  paymentMethodId: string;
  paymentMethodName: string;
  maskedAccountDetails: string;
  accountHolderName: string;
  requestDateLabel: string;
  requestDateIso: string;
  requestTimeLabel: string;
  status: WithdrawalStatus;
  demoTxRef: string;
  note: string;
  timeline: WithdrawalTimelineStep[];
}

export interface WithdrawalDraft {
  amountInput: string;
  methodId: string;
  accountHolderName: string;
  accountIdentifier: string;
  extraField: string;
  additionalNote: string;
}

export interface WithdrawalSummaryMetrics {
  availableDemoBalance: number;
  pendingAmount: number;
  processingAmount: number;
  approvedAmount: number;
  completedAmount: number;
  rejectedAmount: number;
  totalRequestsCount: number;
  pendingCount: number;
  processingCount: number;
  approvedCount: number;
  rejectedCount: number;
  completedCount: number;
}
