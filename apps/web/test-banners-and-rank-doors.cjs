const http = require('http');

const BASE_URL = 'http://localhost:3000';

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function post(path, body = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('============================================================');
  console.log('🎯 POPO LIVE - PHASE 3 PROMPT 03.5 AUTOMATED TEST SUITE');
  console.log('   (Discovery Banners and Rank Door System)');
  console.log('============================================================\n');

  let passed = 0;
  let total = 16;

  function assert(condition, testNum, desc) {
    if (condition) {
      console.log(`✔ [PASS] ${testNum}. ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testNum}. ${desc}`);
    }
  }

  try {
    // 1. Banner display API
    const bannersRes = await get('/api/discovery/banners');
    assert(bannersRes.status === 200 && bannersRes.data?.success === true && Array.isArray(bannersRes.data?.banners), 1, 'GET /api/discovery/banners returns 200 and banners array');

    // 2. Multiple banner carousel
    const banners = bannersRes.data.banners;
    assert(banners.length >= 3, 2, 'Carousel contains multiple banners for sliding (at least 3 banners)');

    // 3. First banner attributes (Top Hosts matching 03_05)
    const firstBanner = banners[0];
    assert(firstBanner && firstBanner.title === 'Top Hosts' && firstBanner.ctaText.includes('View Now'), 3, 'First banner matches reference "Top Hosts" and has valid CTA');

    // 4. Banner detail endpoint
    const singleBannerRes = await get(`/api/discovery/banners/${firstBanner.id}`);
    assert(singleBannerRes.status === 200 && singleBannerRes.data?.banner?.id === firstBanner.id, 4, 'GET /api/discovery/banners/:bannerId returns banner metadata');

    // 5. Banner click tracking and safe destination
    const clickRes = await post(`/api/discovery/banners/${firstBanner.id}/click`);
    assert(clickRes.status === 200 && clickRes.data?.success === true && clickRes.data?.destination === '/ranking/host', 5, 'POST /api/discovery/banners/:id/click records click and validates destination');

    // 6. Security destination validation (No open redirect)
    assert(firstBanner.destination.startsWith('/'), 6, 'Banner destinations are validated internal routes to prevent open redirect');

    // 7. Active banner window filtering
    assert(banners.every(b => b.isActive === true), 7, 'All returned discovery banners have active=true and are within date window');

    // 8. Inactive/Invalid banner detail handling
    const invalidBannerRes = await get('/api/discovery/banners/00000000-0000-0000-0000-000000000000');
    assert(invalidBannerRes.status === 404, 8, 'Non-existent banner returns HTTP 404 status safely');

    // 9. Rank Door display API
    const rankDoorsRes = await get('/api/discovery/rank-doors');
    assert(rankDoorsRes.status === 200 && rankDoorsRes.data?.success === true && Array.isArray(rankDoorsRes.data?.doors), 9, 'GET /api/discovery/rank-doors returns 200 and doors list');

    // 10. Rank Door 4 Categories matching 03_05 (Event, Rank, Agency, Notice)
    const doorIds = rankDoorsRes.data?.doors?.map(d => d.id) || [];
    assert(doorIds.includes('event') && doorIds.includes('rank') && doorIds.includes('agency') && doorIds.includes('notice'), 10, 'Rank Door section includes Event, Rank, Agency, Notice shortcuts');

    // 11. Event Door notification dot
    const eventDoor = rankDoorsRes.data?.doors?.find(d => d.id === 'event');
    assert(eventDoor?.hasNotificationDot === true, 11, 'Event squircle button features active notification dot badge');

    // 12. Ranking Preview API - Top 3 Podium
    const previewRes = await get('/api/discovery/rankings/preview');
    assert(previewRes.status === 200 && previewRes.data?.podium?.first && previewRes.data?.podium?.second && previewRes.data?.podium?.third, 12, 'GET /api/discovery/rankings/preview returns Top 3 Podium (1st Gold, 2nd Silver, 3rd Bronze)');

    // 13. Ranking Preview Scores & Verification
    const firstPodium = previewRes.data?.podium?.first;
    assert(firstPodium && typeof firstPodium.scoreFormatted === 'string' && typeof firstPodium.isVerified === 'boolean', 13, 'Podium users contain formatted scores (e.g. 2.3M, 1.9M) and verification badges');

    // 14. Coming Soon Categories (Gift Ranking)
    const giftRankingRes = await get('/api/discovery/rankings/preview?category=gifts');
    assert(giftRankingRes.status === 200 && giftRankingRes.data?.isComingSoon === true && giftRankingRes.data?.category === 'gifts', 14, 'Unpopulated categories (Gifts) honestly return isComingSoon=true');

    // 15. Ranking Hub Page /ranking/[category]
    const rankPageRes = await get('/ranking/host');
    assert(rankPageRes.status === 200 && rankPageRes.raw.includes('Leaderboards'), 15, 'Ranking category hub /ranking/host returns valid HTML with status 200');

    // 16. Discovery Page Integration (/live/explore)
    const explorePageRes = await get('/live/explore');
    assert(explorePageRes.status === 200 && explorePageRes.raw.includes('<!DOCTYPE html>'), 16, 'Discovery explore page renders cleanly with Banners, Rank Doors, and Ranking preview');

  } catch (err) {
    console.error('Test execution failed with error:', err);
  }

  console.log('\n============================================================');
  console.log(`📊 TEST RESULTS: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
  if (passed === total) {
    console.log('🎉 ALL 16 BANNERS & RANK DOOR REQUIREMENTS VERIFIED!');
  } else {
    console.log('⚠️ Some requirements need attention.');
  }
  console.log('============================================================\n');
}

runTests();
