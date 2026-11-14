export type AdminStatus = 'Active' | 'Inactive' | 'Suspended' | 'Pending';

export type AdminRoleName =
  | 'Super Admin'
  | 'Admin'
  | 'Moderator'
  | 'Support Agent'
  | 'Finance Manager'
  | 'Content Manager';

export type PermissionGroupKey =
  | 'user_management'
  | 'host_management'
  | 'live_monitoring'
  | 'reports'
  | 'content_management'
  | 'finance';

export type AdminNavSection =
  | 'dashboard'
  | 'users'
  | 'hosts'
  | 'live_monitor'
  | 'reports'
  | 'safety'
  | 'economy'
  | 'agency'
  | 'content'
  | 'news'
  | 'release'
  | 'settings'
  | 'admins'
  | 'roles'
  | 'permissions'
  | 'activity';

export type AdminEmptyKind =
  | 'no_search_results'
  | 'no_admins_filtered'
  | 'no_roles_filtered'
  | 'no_activity_logged';

export interface AdminRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: AdminRoleName;
  status: AdminStatus;
  createdAt: string;
  lastActive: string;
  department: string;
  phoneMasked: string;
}

export interface PermissionItem {
  id: string;
  label: string;
  description: string;
  sensitive?: boolean;
}

export interface PermissionGroup {
  key: PermissionGroupKey;
  title: string;
  description: string;
  permissions: PermissionItem[];
}

export interface RoleDefinition {
  id: string;
  name: AdminRoleName;
  description: string;
  assignedAdminCount: number;
  isSystemProtected: boolean;
  status: 'Active' | 'Draft';
  permissionIds: string[];
}

export interface AdminActivityItem {
  id: string;
  adminName: string;
  adminRole: AdminRoleName;
  adminAvatar: string;
  actionTitle: string;
  details: string;
  dateLabel: string;
  timeLabel: string;
  category: 'profile' | 'roles' | 'permissions' | 'status' | 'dashboard' | 'security';
  status: 'Completed' | 'Logged' | 'Simulated';
}

export interface PlatformStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  inactiveUsers: number;
  totalHosts: number;
  activeLiveHosts: number;
  pendingHosts: number;
  suspendedHosts: number;
  currentLiveSessions: number;
  totalLiveViewers: number;
  totalReports: number;
  pendingReports: number;
  reviewedReports: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  formattedValue: string;
}

export interface AdminProfileData {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: AdminRoleName;
  status: AdminStatus;
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  auditLoggingEnabled: boolean;
}
