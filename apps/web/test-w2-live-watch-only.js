const fs = require('fs');
const http = require('http');

function fetchPath(path, cookie = '') {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000' + path, {
      headers: { 'Cookie': cookie }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function testW2() {
  console.log('====================================================');
  console.log('POPO LIVE — W2 LIVE WATCH-ONLY VERIFICATION');
  console.log('====================================================');

  const shellSource = fs.readFileSync('apps/web/components/discovery/DiscoveryShell.tsx', 'utf8');
  const routeSource = fs.readFileSync('apps/web/app/live/[tab]/page.tsx', 'utf8');
  const flagsSource = fs.readFileSync('apps/web/lib/featureFlags.ts', 'utf8');

  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${desc}`);
    } else {
      console.error(`  [FAIL] ${desc}`);
    }
  }

  // 1. Live page HTTP status
  const liveRes = await fetchPath('/live');
  assert(liveRes.status === 200, 'GET /live returns HTTP 200');

  // 2. Explore, Following, New tabs are visible in DiscoveryShell & live render
  assert(liveRes.data.includes('Explore') || liveRes.data.includes('دریافت'), 'Explore tab is visible in render');
  assert(liveRes.data.includes('Following') || liveRes.data.includes('فالوئنگ'), 'Following tab is visible in render');
  assert(liveRes.data.includes('New Streamers') || liveRes.data.includes('نئے براڈکاسٹرز'), 'New tab is visible in render');

  // 3. Party, PK, Near tabs are absent from navigation
  const hasPartyInNav = shellSource.includes("id: 'party'");
  const hasPkInNav = shellSource.includes("id: 'pk'");
  const hasNearInNav = shellSource.includes("id: 'near'");
  assert(!hasPartyInNav, 'Party tab is absent from Discovery navigation');
  assert(!hasPkInNav, 'PK tab is absent from Discovery navigation');
  assert(!hasNearInNav, 'Near tab is absent from Discovery navigation');

  // 4. Go Live card and button are absent
  const hasGoLiveCard = shellSource.includes('Start Broadcasting') || shellSource.includes('Go Live Setup');
  const hasLiveSetupLink = shellSource.includes('/live/setup');
  assert(!hasGoLiveCard, 'Go Live card is absent from desktop sidebar');
  assert(!hasLiveSetupLink, 'Link to /live/setup is absent from DiscoveryShell');

  // 5. Fixed mobile bottom navigation is absent
  const hasMobileBottomNav = shellSource.includes('fixed bottom-0') || shellSource.includes('MOBILE BOTTOM NAVIGATION');
  assert(!hasMobileBottomNav, 'Fixed mobile bottom navigation is absent');

  // 6. Header shortcuts (/inbox, /square) are absent
  const hasInboxHeader = shellSource.includes('discovery-header-inbox-link');
  const hasSquareHeader = shellSource.includes('discovery-header-square-link');
  assert(!hasInboxHeader, 'Inbox shortcut is absent from header');
  assert(!hasSquareHeader, 'Square shortcut is absent from header');

  // 7. Platform column array removed (admin, withdrawals, etc. absent from public nav)
  const hasAdminInNav = shellSource.includes('discovery-menu-admin-operations') || shellSource.includes('/admin');
  const hasWithdrawalsInNav = shellSource.includes('discovery-menu-withdrawals');
  const hasCoinSellerInNav = shellSource.includes('discovery-menu-coin-seller');
  const hasAgentEarningsInNav = shellSource.includes('discovery-menu-agent-earnings');
  assert(!hasAdminInNav, 'Admin Operations is absent from public navigation');
  assert(!hasWithdrawalsInNav, 'Withdrawals is absent from public navigation');
  assert(!hasCoinSellerInNav, 'Coin Seller is absent from public navigation');
  assert(!hasAgentEarningsInNav, 'Agent Earnings is absent from public navigation');

  // 8. Public website services remain available in sidebar
  assert(shellSource.includes('/agency'), 'Agency Portal link (/agency) is preserved in sidebar');
  assert(shellSource.includes('/recharge'), 'Recharge Coins link (/recharge) is preserved in sidebar');
  assert(shellSource.includes('/help'), 'Help & Support link (/help) is preserved in sidebar');

  // 9. generateStaticParams verification
  assert(routeSource.includes("{ tab: 'explore' }"), "generateStaticParams includes 'explore'");
  assert(routeSource.includes("{ tab: 'following' }"), "generateStaticParams includes 'following'");
  assert(routeSource.includes("{ tab: 'new' }"), "generateStaticParams includes 'new'");
  assert(!routeSource.includes("{ tab: 'pk' }"), "generateStaticParams excludes 'pk'");
  assert(!routeSource.includes("{ tab: 'party' }"), "generateStaticParams excludes 'party'");
  assert(!routeSource.includes("{ tab: 'near' }"), "generateStaticParams excludes 'near'");

  // 10. Near feature flag
  assert(flagsSource.includes('export const NEAR_FEATURE_ENABLED = false;'), 'NEAR_FEATURE_ENABLED is strictly false');

  // 11. Live room viewing & room cards
  const roomCardSource = fs.readFileSync('apps/web/components/discovery/LiveRoomCard.tsx', 'utf8');
  assert(roomCardSource.includes('/live/room/'), 'Live room cards link to /live/room/[roomId]');

  const viewerRoomSource = fs.readFileSync('apps/web/components/live/ViewerRoomScreen.tsx', 'utf8');
  assert(viewerRoomSource.includes('/api/live/chat') || viewerRoomSource.includes('chatMessages'), 'Viewer chat functionality is preserved');
  const safetyToolsSource = fs.readFileSync('apps/web/components/live/SafetyToolsScreen.tsx', 'utf8');
  assert(safetyToolsSource.includes('/api/live/safety/report'), 'Safety report functionality is preserved in SafetyToolsScreen');
  assert(viewerRoomSource.includes('/api/live/safety/block'), 'Safety block functionality is preserved');

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} / ${total} ASSERTIONS PASSED`);
  if (passed === total) {
    console.log('W2 COMPLETE: 100% PASS');
  } else {
    console.error('W2 INCOMPLETE');
  }
  console.log('====================================================');
}

testW2();
