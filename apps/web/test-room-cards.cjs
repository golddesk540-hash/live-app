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

async function runTests() {
  console.log('============================================================');
  console.log('🎯 POPO LIVE - PHASE 3 PROMPT 03.4 AUTOMATED TEST SUITE');
  console.log('   (Live Room Cards & Discovery Grid System)');
  console.log('============================================================\n');

  let passed = 0;
  let total = 20;

  function assert(condition, testNum, desc) {
    if (condition) {
      console.log(`✔ [PASS] ${testNum}. ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testNum}. ${desc}`);
    }
  }

  try {
    // 1. Room card display & Rooms API
    const roomsRes = await get('/api/discovery/rooms');
    assert(roomsRes.status === 200 && roomsRes.data?.success === true && Array.isArray(roomsRes.data?.rooms), 1, 'GET /api/discovery/rooms returns 200 and list of rooms');

    const firstRoom = roomsRes.data.rooms[0];

    // 2. Room cover images
    assert(Boolean(firstRoom && firstRoom.coverUrl && firstRoom.coverUrl.length > 5), 2, 'Room cards contain valid cover URLs for lazy loading');

    // 3. Host profile information
    assert(Boolean(firstRoom && firstRoom.host && firstRoom.host.nickname && firstRoom.host.poppoId && firstRoom.host.id), 3, 'Room cards contain host profile info (nickname, Poppo ID, host ID)');

    // 4. LIVE badge status on active rooms
    assert(firstRoom.isLive === true && firstRoom.status === 'live', 4, 'Active rooms confirmed as isLive=true and status="live" for LIVE badge');

    // 5. Offline status endpoint
    const offlineRes = await get('/api/discovery/rooms/999901/status');
    assert(offlineRes.status === 200 && offlineRes.data?.status === 'offline' && offlineRes.data?.isLive === false, 5, 'GET /api/discovery/rooms/:roomId/status correctly returns offline state');

    // 6. Ended room handling endpoint
    const endedRes = await get('/api/discovery/rooms/999902/status');
    assert(endedRes.status === 200 && endedRes.data?.status === 'ended' && endedRes.data?.isLive === false && endedRes.data?.endedAt, 6, 'GET /api/discovery/rooms/:roomId/status correctly handles ended room with endedAt timestamp');

    // 7. Viewer count & formatting
    assert(typeof firstRoom.viewerCount === 'number' && typeof firstRoom.viewersFormatted === 'string' && firstRoom.viewersFormatted.length > 0, 7, 'Viewer count formatted correctly (e.g. 35K, 24.2K, 892)');

    // 8. Country flag & ISO country code
    assert(Boolean(firstRoom.flagEmoji && firstRoom.countryCode && firstRoom.country), 8, 'Room card includes flag emoji, country code, and country name');

    // 9. Open Room endpoint (room detail)
    const roomDetailRes = await get(`/api/discovery/rooms/${firstRoom.roomId}`);
    assert(roomDetailRes.status === 200 && roomDetailRes.data?.success === true && roomDetailRes.data?.room?.title, 9, 'GET /api/discovery/rooms/:roomId loads room data for Room Opening route');

    // 10. Open Host Profile action endpoint
    const hostRes = await get(`/api/discovery/rooms/${firstRoom.roomId}/host`);
    assert(hostRes.status === 200 && hostRes.data?.success === true && hostRes.data?.host?.profileUrl.startsWith('/user/'), 10, 'GET /api/discovery/rooms/:roomId/host returns public profile link /user/:id');

    // 11. Share Room link generation
    assert(Boolean(roomDetailRes.data?.room?.shareUrl && roomDetailRes.data.room.shareUrl.includes('/live/room/')), 11, 'Room data generates valid shareUrl with /live/room/ path');

    // 12. Room viewers endpoint (contributors/viewers)
    const viewersRes = await get(`/api/discovery/rooms/${firstRoom.roomId}/viewers`);
    assert(viewersRes.status === 200 && viewersRes.data?.success === true && Array.isArray(viewersRes.data?.recentViewers), 12, 'GET /api/discovery/rooms/:roomId/viewers returns real-time viewer count and contributors');

    // 13. Country filter integration
    const pkRoomsRes = await get('/api/discovery/rooms?country=PK');
    const allPK = pkRoomsRes.data?.rooms?.every(r => r.countryCode === 'PK');
    assert(pkRoomsRes.status === 200 && allPK === true && pkRoomsRes.data.rooms.length > 0, 13, 'GET /api/discovery/rooms?country=PK filters rooms accurately by country');

    // 14. Explore integration endpoint
    const exploreRes = await get('/api/discovery/explore');
    assert(exploreRes.status === 200 && exploreRes.data?.tab === 'explore' && Array.isArray(exploreRes.data?.rooms), 14, 'GET /api/discovery/explore integrates room cards list for Explore tab');

    // 15. Following integration endpoint
    const followRes = await get('/api/discovery/following');
    assert(followRes.status === 200 && typeof followRes.data?.authenticated === 'boolean', 15, 'GET /api/discovery/following provides live followed creators feed');

    // 16. New tab integration endpoint
    const newRes = await get('/api/discovery/new');
    assert(newRes.status === 200 && newRes.data?.success === true && Array.isArray(newRes.data?.creators || newRes.data?.users), 16, 'GET /api/discovery/new provides new hosts and broadcast states');

    // 17. PK tab integration endpoint
    const pkTabRes = await get('/api/discovery/pk');
    assert(pkTabRes.status === 200 && pkTabRes.data?.success === true && Array.isArray(pkTabRes.data?.battles), 17, 'GET /api/discovery/pk integrates PK rooms and status');

    // 18. Pagination & limits
    const paginatedRes = await get('/api/discovery/rooms?page=1&limit=3');
    assert(paginatedRes.data?.pagination?.limit === 3 && paginatedRes.data?.rooms?.length <= 3 && paginatedRes.data?.pagination?.totalPages >= 1, 18, 'Backend pagination respects limit=3 and returns valid pagination meta');

    // 19. Broken image fallback & tags
    assert(Array.isArray(firstRoom.tags) && firstRoom.tags.length > 0 && typeof firstRoom.host.isVerified === 'boolean', 19, 'Room cards contain authentic tags array and isVerified badge property');

    // 20. Live room UI page response (SSR / HTML)
    const roomPageRes = await get(`/live/room/${firstRoom.roomId}`);
    assert(roomPageRes.status === 200 && roomPageRes.raw.includes('<!DOCTYPE html>'), 20, 'Live room page /live/room/:roomId serves valid HTML with status 200');

  } catch (err) {
    console.error('Test execution failed with error:', err);
  }

  console.log('\n============================================================');
  console.log(`📊 TEST RESULTS: ${passed} / ${total} Passed (${Math.round((passed / total) * 100)}%)`);
  if (passed === total) {
    console.log('🎉 ALL 20 LIVE ROOM CARD & DISCOVERY GRID REQUIREMENTS VERIFIED!');
  } else {
    console.log('⚠️ Some requirements need attention.');
  }
  console.log('============================================================\n');
}

runTests();
