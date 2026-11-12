export type SellerAccountStatus = 'Active' | 'Pending' | 'Inactive' | 'Suspended';

export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';

export type SalesRecordStatus = 'Completed' | 'Pending' | 'Processing' | 'Cancelled';

export type DateFilterPeriod = 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom';

export type SalesSortMode = 'date_desc' | 'date_asc' | 'coins_desc' | 'coins_asc';

export type CoinSellerTab =
  | 'dashboard'
  | 'profile'
  | 'sales_overview'
  | 'orders'
  | 'sales_history'
  | 'activity';

export type SellerEmptyKind =
  | 'no_sales'
  | 'no_orders'
  | 'no_pending_orders'
  | 'no_completed_orders'
  | 'no_cancelled_orders'
  | 'no_search_results'
  | 'no_seller_activity';

export interface SellerProfileData {
  sellerId: string;
  sellerName: string;
  username: string;
  avatar: string;
  status: SellerAccountStatus;
  region: string;
  tierLabel: string;
  joinedDate: string;
  contactEmail: string;
  contactPhone: string;
  supportHandle: string;
  accountNote: string;
  baseDemoQuota: number;
}

export interface CoinOrderRecord {
  id: string;
  salesId: string;
  buyerId: string;
  buyerUsername: string;
  buyerAvatar: string;
  coinPackage: string;
  coinQuantity: number;
  orderDateLabel: string;
  orderDateIso: string;
  orderTimeLabel: string;
  status: OrderStatus;
  demoOrderValue: string;
  transactionRef: string;
  periodTag: 'today' | 'this_week' | 'this_month' | 'last_month';
  note: string;
}

export interface CoinSalesRecord {
  id: string;
  orderId: string;
  buyerId: string;
  buyerUsername: string;
  buyerAvatar: string;
  coinPackage: string;
  coinQuantity: number;
  salesDateLabel: string;
  salesDateIso: string;
  salesTimeLabel: string;
  status: SalesRecordStatus;
  transactionRef: string;
  demoOrderValue: string;
  periodTag: 'today' | 'this_week' | 'this_month' | 'last_month';
}

export interface SellerActivityItem {
  id: string;
  kind: 'new_order' | 'completed_order' | 'cancelled_order' | 'record_update';
  title: string;
  description: string;
  dateLabel: string;
  dateIso: string;
  timeLabel: string;
  status: OrderStatus | 'Updated';
  orderId: string;
  coinQuantity: number;
}

export interface SellerDashboardMetrics {
  todayCoinSales: number;
  weeklyCoinSales: number;
  monthlyCoinSales: number;
  totalCoinSales: number;
  todayOrdersCount: number;
  totalOrdersCount: number;
  pendingOrdersCount: number;
  processingOrdersCount: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
  salesRecordsCount: number;
  availableDemoBalance: number;
}
