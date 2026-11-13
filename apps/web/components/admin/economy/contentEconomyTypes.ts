export type ContentStatus = 'Active' | 'Draft' | 'Pending Review' | 'Inactive';
export type GiftStatus = 'Active' | 'Draft' | 'Inactive';
export type CoinPackageStatus = 'Active' | 'Inactive';
export type VirtualItemStatus = 'Active' | 'Inactive' | 'Draft';
export type CategoryStatus = 'Active' | 'Inactive';

export type ContentType = 'Banner' | 'Live Category' | 'Event' | 'Announcement' | 'Promo';
export type GiftCategory = 'Popular' | 'Premium' | 'Seasonal' | 'Special' | 'Luxury' | 'Romantic' | 'Other';
export type VirtualItemCategory = 'profile_frame' | 'entrance_effect' | 'chat_decoration' | 'name_decoration' | 'special_badge' | 'theme';
export type EconomyActivityType =
  | 'gift_added'
  | 'gift_updated'
  | 'coin_package_edited'
  | 'virtual_item_updated'
  | 'category_changed'
  | 'store_item_status_changed'
  | 'economy_setting_updated';

export type EconomyPeriod = 'daily' | 'weekly' | 'monthly';

export type ContentEconomyNavTab =
  | 'dashboard'
  | 'content'
  | 'gifts'
  | 'packages'
  | 'overview'
  | 'virtual_items'
  | 'categories'
  | 'store'
  | 'activity'
  | 'settings';

export interface ContentRecord {
  id: string;
  title: string;
  titleUr?: string;
  thumbnailUrl: string;
  category: string;
  type: ContentType;
  description: string;
  targetUrl?: string;
  createdDate: string;
  updatedDate: string;
  status: ContentStatus;
  viewsCount: number;
  clicksCount: number;
  priorityOrder: number;
  isFeatured?: boolean;
}

export interface GiftRecord {
  id: string;
  name: string;
  nameUr?: string;
  imageUrl: string;
  thumbnailUrl: string;
  animationUrl?: string;
  category: GiftCategory;
  coinValue: number;
  description: string;
  status: GiftStatus;
  isPopular?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  soundEffect?: string;
  createdDate: string;
  updatedDate: string;
  usageCount: number;
}

export interface CoinPackageRecord {
  id: string;
  name: string;
  nameUr?: string;
  coinQuantity: number;
  bonusCoins: number;
  totalCoins: number;
  demoPriceUsd: number;
  demoPricePkr: number;
  category: 'Starter' | 'Popular' | 'High Roller' | 'VIP Exclusive';
  status: CoinPackageStatus;
  isFeatured: boolean;
  isBestValue?: boolean;
  badgeLabel?: string;
  createdDate: string;
  salesCount: number;
}

export interface VirtualItemRecord {
  id: string;
  name: string;
  nameUr?: string;
  imageUrl: string;
  category: VirtualItemCategory;
  categoryLabel: string;
  coinValue: number;
  status: VirtualItemStatus;
  durationLabel: string;
  slotKey: string;
  isFeatured?: boolean;
  isVipOnly?: boolean;
  minVipLevel?: number;
  createdDate: string;
  soldCount: number;
  description: string;
}

export interface ContentCategoryRecord {
  id: string;
  name: string;
  nameUr?: string;
  icon: string;
  description: string;
  itemsCount: number;
  status: CategoryStatus;
  displayOrder: number;
  createdDate: string;
}

export interface StoreContentRecord {
  id: string;
  name: string;
  nameUr?: string;
  imageUrl: string;
  type: string;
  category: VirtualItemCategory;
  coinPrice: number;
  status: VirtualItemStatus;
  isFeatured: boolean;
  duration: string;
  soldCount: number;
  stockLimit?: number;
  createdDate: string;
  description: string;
}

export interface EconomyActivityLog {
  id: string;
  title: string;
  adminName: string;
  activityType: EconomyActivityType;
  date: string;
  relativeTime: string;
  relatedItemId: string;
  description: string;
}

export interface EconomyMetrics {
  totalContentItems: number;
  activeGifts: number;
  totalGiftCategories: number;
  availableCoinPackages: number;
  virtualItemsCount: number;
  contentPendingReview: number;
  totalCoinCirculation: number;
  dailyCoinVolume: number;
  weeklyCoinVolume: number;
  monthlyCoinVolume: number;
  activeStoreItems: number;
}

export interface EconomyChartDataPoint {
  label: string;
  coinsCirculation: number;
  giftVolume: number;
  storeVolume: number;
  purchasesCount: number;
}

export interface EconomySettingsConfig {
  hostCommissionPercentage: number;
  platformCommissionPercentage: number;
  minGiftCoinPrice: number;
  maxGiftCoinPrice: number;
  dailyGiftSendingCeiling: number;
  cashoutConversionRate: number; // coins to 1 USD demo
  minimumCashoutCoins: number;
  isRechargeBonusActive: boolean;
  rechargeBonusPercentage: number;
}
