import {
  CoinOrderRecord,
  CoinSalesRecord,
  DateFilterPeriod,
  SellerActivityItem,
  SellerDashboardMetrics,
  SellerProfileData,
} from './types';

export const SELLER_TODAY_ISO = '2026-11-12';

const BUYER_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80',
];

export const INITIAL_DEMO_COMPLETED_COINS = 41000;
export const INITIAL_AVAILABLE_DEMO_BALANCE = 8200;

export function createInitialSellerProfile(): SellerProfileData {
  return {
    sellerId: 'CS-10582',
    sellerName: 'Popo Coin Hub',
    username: '@popocoin_cs10582',
    avatar:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
    status: 'Active',
    region: 'Global Verified Desk (Demo)',
    tierLabel: 'Premier Seller Desk · Demo Tier',
    joinedDate: 'Jan 15, 2026',
    contactEmail: 'seller.cs10582@demo.popolive.local',
    contactPhone: '+1 (555) 019-5820',
    supportHandle: '@cs_10582_desk',
    accountNote:
      'Frontend showcase profile displaying demo seller allocation and sample coin package fulfillments. No live payments or wallet transfers.',
    baseDemoQuota: INITIAL_AVAILABLE_DEMO_BALANCE,
  };
}

export function formatCoinCount(value: number): string {
  return value.toLocaleString('en-US');
}

export function createInitialCoinOrders(): CoinOrderRecord[] {
  const raw: Array<
    Omit<CoinOrderRecord, 'salesId' | 'buyerAvatar' | 'demoOrderValue'> & { avatarIdx: number }
  > = [
    // Today (2026-11-12): 18 Orders Today = 15 Completed (12,500 coins) + 2 Pending + 1 Processing
    {
      id: 'ORD-9028',
      buyerId: 'USR-44102',
      buyerUsername: '@mina_starlight',
      avatarIdx: 0,
      coinPackage: '2,000 Demo Coins Pack',
      coinQuantity: 2000,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '16:45',
      status: 'Processing',
      transactionRef: 'DEMO-TX-902841',
      periodTag: 'today',
      note: 'Demo coin package queued for status confirmation.',
    },
    {
      id: 'ORD-9027',
      buyerId: 'USR-38911',
      buyerUsername: '@kairo_beats',
      avatarIdx: 1,
      coinPackage: '1,500 Demo Coins Pack',
      coinQuantity: 1500,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '16:20',
      status: 'Pending',
      transactionRef: 'DEMO-TX-902739',
      periodTag: 'today',
      note: 'Awaiting local demo verification step.',
    },
    {
      id: 'ORD-9026',
      buyerId: 'USR-51204',
      buyerUsername: '@noor_melody',
      avatarIdx: 2,
      coinPackage: '1,000 Demo Coins Pack',
      coinQuantity: 1000,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '15:52',
      status: 'Pending',
      transactionRef: 'DEMO-TX-902614',
      periodTag: 'today',
      note: 'Pending sample order ready for seller review.',
    },
    {
      id: 'ORD-9025',
      buyerId: 'USR-20933',
      buyerUsername: '@leo_streamz',
      avatarIdx: 3,
      coinPackage: '2,000 Demo Coins Pack',
      coinQuantity: 2000,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '15:18',
      status: 'Completed',
      transactionRef: 'DEMO-TX-902508',
      periodTag: 'today',
      note: 'Sample coin package marked completed in demo log.',
    },
    {
      id: 'ORD-9024',
      buyerId: 'USR-61820',
      buyerUsername: '@hana_vibe',
      avatarIdx: 4,
      coinPackage: '1,500 Demo Coins Pack',
      coinQuantity: 1500,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '14:40',
      status: 'Completed',
      transactionRef: 'DEMO-TX-902492',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9023',
      buyerId: 'USR-72315',
      buyerUsername: '@aria_glow',
      avatarIdx: 5,
      coinPackage: '1,200 Demo Coins Pack',
      coinQuantity: 1200,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '14:05',
      status: 'Completed',
      transactionRef: 'DEMO-TX-902377',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9022',
      buyerId: 'USR-88401',
      buyerUsername: '@devon_sky',
      avatarIdx: 6,
      coinPackage: '1,000 Demo Coins Pack',
      coinQuantity: 1000,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '13:32',
      status: 'Completed',
      transactionRef: 'DEMO-TX-902265',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9021',
      buyerId: 'USR-91244',
      buyerUsername: '@sara_nova',
      avatarIdx: 7,
      coinPackage: '1,000 Demo Coins Pack',
      coinQuantity: 1000,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '13:10',
      status: 'Completed',
      transactionRef: 'DEMO-TX-902154',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9020',
      buyerId: 'USR-15092',
      buyerUsername: '@tariq_wave',
      avatarIdx: 1,
      coinPackage: '800 Demo Coins Pack',
      coinQuantity: 800,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '12:44',
      status: 'Completed',
      transactionRef: 'DEMO-TX-902043',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9019',
      buyerId: 'USR-30481',
      buyerUsername: '@chloe_spark',
      avatarIdx: 0,
      coinPackage: '800 Demo Coins Pack',
      coinQuantity: 800,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '12:12',
      status: 'Completed',
      transactionRef: 'DEMO-TX-901932',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9018',
      buyerId: 'USR-44903',
      buyerUsername: '@omar_zen',
      avatarIdx: 3,
      coinPackage: '700 Demo Coins Pack',
      coinQuantity: 700,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '11:48',
      status: 'Completed',
      transactionRef: 'DEMO-TX-901821',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9017',
      buyerId: 'USR-58219',
      buyerUsername: '@yuna_dream',
      avatarIdx: 2,
      coinPackage: '700 Demo Coins Pack',
      coinQuantity: 700,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '11:15',
      status: 'Completed',
      transactionRef: 'DEMO-TX-901710',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9016',
      buyerId: 'USR-64310',
      buyerUsername: '@lucas_pulse',
      avatarIdx: 6,
      coinPackage: '600 Demo Coins Pack',
      coinQuantity: 600,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '10:50',
      status: 'Completed',
      transactionRef: 'DEMO-TX-901609',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9015',
      buyerId: 'USR-71904',
      buyerUsername: '@maya_prism',
      avatarIdx: 4,
      coinPackage: '600 Demo Coins Pack',
      coinQuantity: 600,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '10:22',
      status: 'Completed',
      transactionRef: 'DEMO-TX-901598',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9014',
      buyerId: 'USR-80342',
      buyerUsername: '@zayd_echo',
      avatarIdx: 1,
      coinPackage: '500 Demo Coins Pack',
      coinQuantity: 500,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '09:58',
      status: 'Completed',
      transactionRef: 'DEMO-TX-901487',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9013',
      buyerId: 'USR-87122',
      buyerUsername: '@elena_aura',
      avatarIdx: 5,
      coinPackage: '500 Demo Coins Pack',
      coinQuantity: 500,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '09:30',
      status: 'Completed',
      transactionRef: 'DEMO-TX-901376',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9012',
      buyerId: 'USR-93208',
      buyerUsername: '@noah_crest',
      avatarIdx: 3,
      coinPackage: '300 Demo Coins Pack',
      coinQuantity: 300,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '09:05',
      status: 'Completed',
      transactionRef: 'DEMO-TX-901265',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },
    {
      id: 'ORD-9011',
      buyerId: 'USR-99514',
      buyerUsername: '@sana_bloom',
      avatarIdx: 7,
      coinPackage: '300 Demo Coins Pack',
      coinQuantity: 300,
      orderDateLabel: 'Today · Nov 12, 2026',
      orderDateIso: '2026-11-12',
      orderTimeLabel: '08:40',
      status: 'Completed',
      transactionRef: 'DEMO-TX-901154',
      periodTag: 'today',
      note: 'Completed demo seller order record.',
    },

    // Earlier This Week (2026-11-09..11): +1 Pending (makes 3 Pending total), +6,500 Completed, +1 Cancelled
    {
      id: 'ORD-9010',
      buyerId: 'USR-41290',
      buyerUsername: '@felix_lunar',
      avatarIdx: 6,
      coinPackage: '3,000 Demo Coins Pack',
      coinQuantity: 3000,
      orderDateLabel: 'Yesterday · Nov 11, 2026',
      orderDateIso: '2026-11-11',
      orderTimeLabel: '20:15',
      status: 'Pending',
      transactionRef: 'DEMO-TX-901043',
      periodTag: 'this_week',
      note: 'Awaiting seller status confirmation in local queue.',
    },
    {
      id: 'ORD-9009',
      buyerId: 'USR-52874',
      buyerUsername: '@iva_velvet',
      avatarIdx: 0,
      coinPackage: '4,000 Demo Coins Pack',
      coinQuantity: 4000,
      orderDateLabel: 'Yesterday · Nov 11, 2026',
      orderDateIso: '2026-11-11',
      orderTimeLabel: '18:05',
      status: 'Completed',
      transactionRef: 'DEMO-TX-900932',
      periodTag: 'this_week',
      note: 'Weekly demo coin package delivered.',
    },
    {
      id: 'ORD-9008',
      buyerId: 'USR-63918',
      buyerUsername: '@rami_pixel',
      avatarIdx: 1,
      coinPackage: '2,500 Demo Coins Pack',
      coinQuantity: 2500,
      orderDateLabel: 'Nov 10, 2026',
      orderDateIso: '2026-11-10',
      orderTimeLabel: '15:42',
      status: 'Completed',
      transactionRef: 'DEMO-TX-900821',
      periodTag: 'this_week',
      note: 'Weekly demo coin package delivered.',
    },
    {
      id: 'ORD-9007',
      buyerId: 'USR-74520',
      buyerUsername: '@talia_rush',
      avatarIdx: 2,
      coinPackage: '1,000 Demo Coins Pack',
      coinQuantity: 1000,
      orderDateLabel: 'Nov 09, 2026',
      orderDateIso: '2026-11-09',
      orderTimeLabel: '12:18',
      status: 'Cancelled',
      transactionRef: 'DEMO-TX-900710',
      periodTag: 'this_week',
      note: 'Demo order cancelled at buyer request; zero live debit.',
    },

    // Earlier This Month (2026-11-01..08): +8,500 Completed, +1 Cancelled
    {
      id: 'ORD-9006',
      buyerId: 'USR-85103',
      buyerUsername: '@jules_neon',
      avatarIdx: 4,
      coinPackage: '5,000 Demo Coins Pack',
      coinQuantity: 5000,
      orderDateLabel: 'Nov 06, 2026',
      orderDateIso: '2026-11-06',
      orderTimeLabel: '19:30',
      status: 'Completed',
      transactionRef: 'DEMO-TX-900609',
      periodTag: 'this_month',
      note: 'Monthly high-tier demo package record.',
    },
    {
      id: 'ORD-9005',
      buyerId: 'USR-96215',
      buyerUsername: '@amir_tempo',
      avatarIdx: 3,
      coinPackage: '3,500 Demo Coins Pack',
      coinQuantity: 3500,
      orderDateLabel: 'Nov 03, 2026',
      orderDateIso: '2026-11-03',
      orderTimeLabel: '14:12',
      status: 'Completed',
      transactionRef: 'DEMO-TX-900598',
      periodTag: 'this_month',
      note: 'Monthly demo sales record.',
    },
    {
      id: 'ORD-9004',
      buyerId: 'USR-17822',
      buyerUsername: '@clea_frost',
      avatarIdx: 5,
      coinPackage: '1,500 Demo Coins Pack',
      coinQuantity: 1500,
      orderDateLabel: 'Nov 02, 2026',
      orderDateIso: '2026-11-02',
      orderTimeLabel: '11:04',
      status: 'Cancelled',
      transactionRef: 'DEMO-TX-900487',
      periodTag: 'this_month',
      note: 'Demo timeout cancellation sample.',
    },

    // Last Month (2026-10-01..31): +13,500 Completed
    {
      id: 'ORD-9003',
      buyerId: 'USR-28490',
      buyerUsername: '@kenji_drift',
      avatarIdx: 6,
      coinPackage: '6,000 Demo Coins Pack',
      coinQuantity: 6000,
      orderDateLabel: 'Oct 27, 2026',
      orderDateIso: '2026-10-27',
      orderTimeLabel: '17:55',
      status: 'Completed',
      transactionRef: 'DEMO-TX-900376',
      periodTag: 'last_month',
      note: 'Last month completed demo package.',
    },
    {
      id: 'ORD-9002',
      buyerId: 'USR-39501',
      buyerUsername: '@nadia_haze',
      avatarIdx: 7,
      coinPackage: '4,500 Demo Coins Pack',
      coinQuantity: 4500,
      orderDateLabel: 'Oct 19, 2026',
      orderDateIso: '2026-10-19',
      orderTimeLabel: '13:20',
      status: 'Completed',
      transactionRef: 'DEMO-TX-900265',
      periodTag: 'last_month',
      note: 'Last month completed demo package.',
    },
    {
      id: 'ORD-9001',
      buyerId: 'USR-40612',
      buyerUsername: '@marco_glint',
      avatarIdx: 1,
      coinPackage: '3,000 Demo Coins Pack',
      coinQuantity: 3000,
      orderDateLabel: 'Oct 10, 2026',
      orderDateIso: '2026-10-10',
      orderTimeLabel: '10:08',
      status: 'Completed',
      transactionRef: 'DEMO-TX-900154',
      periodTag: 'last_month',
      note: 'Last month completed demo package.',
    },
  ];

  return raw.map((item, idx) => {
    const suffixNumber = 5028 - idx;
    return {
      id: item.id,
      salesId: `SL-${suffixNumber}`,
      buyerId: item.buyerId,
      buyerUsername: item.buyerUsername,
      buyerAvatar: BUYER_AVATARS[item.avatarIdx % BUYER_AVATARS.length],
      coinPackage: item.coinPackage,
      coinQuantity: item.coinQuantity,
      orderDateLabel: item.orderDateLabel,
      orderDateIso: item.orderDateIso,
      orderTimeLabel: item.orderTimeLabel,
      status: item.status,
      demoOrderValue: `${formatCoinCount(item.coinQuantity)} Demo Coins (Sample Tier)`,
      transactionRef: item.transactionRef,
      periodTag: item.periodTag,
      note: item.note,
    };
  });
}

export function deriveSalesRecordsFromOrders(orders: CoinOrderRecord[]): CoinSalesRecord[] {
  return orders.map((order) => ({
    id: order.salesId,
    orderId: order.id,
    buyerId: order.buyerId,
    buyerUsername: order.buyerUsername,
    buyerAvatar: order.buyerAvatar,
    coinPackage: order.coinPackage,
    coinQuantity: order.coinQuantity,
    salesDateLabel: order.orderDateLabel,
    salesDateIso: order.orderDateIso,
    salesTimeLabel: order.orderTimeLabel,
    status: order.status,
    transactionRef: order.transactionRef,
    demoOrderValue: order.demoOrderValue,
    periodTag: order.periodTag,
  }));
}

export function computeSellerMetrics(
  orders: CoinOrderRecord[],
  baseQuota: number = INITIAL_AVAILABLE_DEMO_BALANCE
): SellerDashboardMetrics {
  let todayCoinSales = 0;
  let weeklyCoinSales = 0;
  let monthlyCoinSales = 0;
  let totalCoinSales = 0;
  let todayOrdersCount = 0;
  let pendingOrdersCount = 0;
  let processingOrdersCount = 0;
  let completedOrdersCount = 0;
  let cancelledOrdersCount = 0;

  for (const order of orders) {
    if (order.periodTag === 'today') {
      todayOrdersCount += 1;
    }
    if (order.status === 'Pending') pendingOrdersCount += 1;
    if (order.status === 'Processing') processingOrdersCount += 1;
    if (order.status === 'Completed') {
      completedOrdersCount += 1;
      totalCoinSales += order.coinQuantity;
      if (order.periodTag === 'today') {
        todayCoinSales += order.coinQuantity;
        weeklyCoinSales += order.coinQuantity;
        monthlyCoinSales += order.coinQuantity;
      } else if (order.periodTag === 'this_week') {
        weeklyCoinSales += order.coinQuantity;
        monthlyCoinSales += order.coinQuantity;
      } else if (order.periodTag === 'this_month') {
        monthlyCoinSales += order.coinQuantity;
      }
    }
    if (order.status === 'Cancelled') cancelledOrdersCount += 1;
  }

  const netAdditionalCompletedCoins = totalCoinSales - INITIAL_DEMO_COMPLETED_COINS;
  const availableDemoBalance = Math.max(0, baseQuota - netAdditionalCompletedCoins);

  return {
    todayCoinSales,
    weeklyCoinSales,
    monthlyCoinSales,
    totalCoinSales,
    todayOrdersCount,
    totalOrdersCount: orders.length,
    pendingOrdersCount,
    processingOrdersCount,
    completedOrdersCount,
    cancelledOrdersCount,
    salesRecordsCount: orders.length,
    availableDemoBalance,
  };
}

export function createInitialSellerActivity(): SellerActivityItem[] {
  return [
    {
      id: 'ACT-701',
      kind: 'record_update',
      title: 'Processing Demo Order',
      description: 'Order ORD-9028 moved to Processing for @mina_starlight (2,000 coins)',
      dateLabel: 'Today · Nov 12, 2026',
      dateIso: '2026-11-12',
      timeLabel: '16:45',
      status: 'Processing',
      orderId: 'ORD-9028',
      coinQuantity: 2000,
    },
    {
      id: 'ACT-702',
      kind: 'new_order',
      title: 'New Demo Order Queued',
      description: 'Order ORD-9027 submitted by @kairo_beats for 1,500 demo coins',
      dateLabel: 'Today · Nov 12, 2026',
      dateIso: '2026-11-12',
      timeLabel: '16:20',
      status: 'Pending',
      orderId: 'ORD-9027',
      coinQuantity: 1500,
    },
    {
      id: 'ACT-703',
      kind: 'new_order',
      title: 'New Demo Order Queued',
      description: 'Order ORD-9026 submitted by @noor_melody for 1,000 demo coins',
      dateLabel: 'Today · Nov 12, 2026',
      dateIso: '2026-11-12',
      timeLabel: '15:52',
      status: 'Pending',
      orderId: 'ORD-9026',
      coinQuantity: 1000,
    },
    {
      id: 'ACT-704',
      kind: 'completed_order',
      title: 'Completed Demo Order',
      description: 'Sales record SL-5025 finalized for @leo_streamz (2,000 coins)',
      dateLabel: 'Today · Nov 12, 2026',
      dateIso: '2026-11-12',
      timeLabel: '15:18',
      status: 'Completed',
      orderId: 'ORD-9025',
      coinQuantity: 2000,
    },
    {
      id: 'ACT-705',
      kind: 'completed_order',
      title: 'Completed Demo Order',
      description: 'Sales record SL-5024 finalized for @hana_vibe (1,500 coins)',
      dateLabel: 'Today · Nov 12, 2026',
      dateIso: '2026-11-12',
      timeLabel: '14:40',
      status: 'Completed',
      orderId: 'ORD-9024',
      coinQuantity: 1500,
    },
    {
      id: 'ACT-706',
      kind: 'cancelled_order',
      title: 'Cancelled Demo Order',
      description: 'Order ORD-9007 cancelled in demo queue (@talia_rush · 1,000 coins)',
      dateLabel: 'Nov 09, 2026',
      dateIso: '2026-11-09',
      timeLabel: '12:18',
      status: 'Cancelled',
      orderId: 'ORD-9007',
      coinQuantity: 1000,
    },
    {
      id: 'ACT-707',
      kind: 'completed_order',
      title: 'Monthly Milestone Pack',
      description: 'Sales record SL-5006 completed for @jules_neon (5,000 coins)',
      dateLabel: 'Nov 06, 2026',
      dateIso: '2026-11-06',
      timeLabel: '19:30',
      status: 'Completed',
      orderId: 'ORD-9006',
      coinQuantity: 5000,
    },
  ];
}

export function matchesSellerDatePeriod(
  dateIso: string,
  period: DateFilterPeriod | 'all',
  customStart: string,
  customEnd: string
): boolean {
  if (period === 'all') return true;
  if (period === 'today') return dateIso === SELLER_TODAY_ISO;
  if (period === 'this_week') return dateIso >= '2026-11-06' && dateIso <= SELLER_TODAY_ISO;
  if (period === 'this_month') return dateIso >= '2026-11-01' && dateIso <= '2026-11-30';
  if (period === 'last_month') return dateIso >= '2026-10-01' && dateIso <= '2026-10-31';
  if (period === 'custom') {
    if (customStart && dateIso < customStart) return false;
    if (customEnd && dateIso > customEnd) return false;
    return true;
  }
  return true;
}
