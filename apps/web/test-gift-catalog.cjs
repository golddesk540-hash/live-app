const http = require('http');
const https = require('https');

const baseUrl = (
  process.argv[2] ||
  process.env.TEST_BASE_URL ||
  'http://127.0.0.1:3000'
).trim();
const isHttps = baseUrl.startsWith('https');
const client = isHttps ? https : http;

const DEMO_USER_ID = 'user_wallet_demo_701';
const RUN_ID = Date.now();

let passed = 0;
let failed = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

function extractCookies(setCookieHeaders, existingMap = {}) {
  if (!Array.isArray(setCookieHeaders)) return existingMap;
  for (const header of setCookieHeaders) {
    const firstPart = header.split(';')[0];
    const eqIdx = firstPart.indexOf('=');
    if (eqIdx > 0) {
      const name = firstPart.slice(0, eqIdx).trim();
      const val = firstPart.slice(eqIdx + 1).trim();
      existingMap[name] = val;
    }
  }
  return existingMap;
}

function formatCookieHeader(cookieMap) {
  return Object.entries(cookieMap)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: { ...headers },
    };

    let payload = null;
    if (body !== null && body !== undefined) {
      if (Buffer.isBuffer(body) || typeof body === 'string') {
        payload = body;
      } else {
        payload = JSON.stringify(body);
        if (!options.headers['Content-Type']) {
          options.headers['Content-Type'] = 'application/json';
        }
      }
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = client.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const text = buf.toString('utf8');
        let json = null;
        try {
          json = JSON.parse(text);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: text,
          buffer: buf,
          json,
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function loginAs(email, password) {
  const cookies = {};
  const consentRes = await request('POST', '/api/consent', {
    action: 'accept',
    termsAccepted: true,
    privacyAccepted: true,
    isAdultConfirmed: true,
  });
  extractCookies(consentRes.headers['set-cookie'], cookies);

  const loginRes = await request(
    'POST',
    '/api/auth/login',
    { email, password },
    { Cookie: formatCookieHeader(cookies) }
  );
  extractCookies(loginRes.headers['set-cookie'], cookies);
  return { cookies, cookieHeader: formatCookieHeader(cookies), loginRes };
}

function listenForSseEvent(eventNameToMatch, triggerFn, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const url = new URL('/api/gifts/events', baseUrl);
    let buffer = '';
    let connected = false;
    let matched = false;
    let triggered = false;
    let timer = null;

    const req = client.request(
      {
        method: 'GET',
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers: { Accept: 'text/event-stream' },
      },
      (res) => {
        res.on('data', async (chunk) => {
          buffer += chunk.toString('utf8');
          if (!connected && buffer.includes('event: connected')) {
            connected = true;
            if (!triggered) {
              triggered = true;
              try {
                await triggerFn();
              } catch {}
            }
          }
          if (buffer.includes(`event: ${eventNameToMatch}`)) {
            matched = true;
            clearTimeout(timer);
            try {
              req.destroy();
            } catch {}
            resolve({ connected, matched, raw: buffer });
          }
        });
      }
    );

    req.on('error', () => {
      clearTimeout(timer);
      resolve({ connected, matched, raw: buffer });
    });

    timer = setTimeout(() => {
      try {
        req.destroy();
      } catch {}
      resolve({ connected, matched, raw: buffer });
    }, timeoutMs);

    req.end();
  });
}

async function runTests() {
  console.log(`\n🚀 Running Module 7.2 Virtual Gift Catalog Verification against: ${baseUrl}\n`);

  // 1. Public Catalog & Pagination + Reference Image Exact Prices
  console.log('1️⃣  Testing Public Gift Catalog & Pagination...');
  const catPage1 = await request('GET', '/api/gifts/catalog?page=1&limit=6');
  assert(catPage1.status === 200 && catPage1.json?.success === true, 'GET /api/gifts/catalog page 1 returns 200');
  const p1Gifts = catPage1.json?.gifts || [];
  assert(p1Gifts.length === 6, `Page 1 returns 6 gifts (got ${p1Gifts.length})`);

  const expectedRef = [
    { name: 'Rose', coinPrice: 10 },
    { name: 'Heart', coinPrice: 50 },
    { name: 'Teddy', coinPrice: 100 },
    { name: 'Crown', coinPrice: 500 },
    { name: 'Sports Car', coinPrice: 3000 },
    { name: 'Castle', coinPrice: 10000 },
  ];
  for (const exp of expectedRef) {
    const found = p1Gifts.find((g) => g.name === exp.name);
    assert(
      Boolean(found && found.coinPrice === exp.coinPrice),
      `Catalog includes reference gift ${exp.name} = ${exp.coinPrice} coins`
    );
  }

  const catPage2 = await request('GET', '/api/gifts/catalog?page=2&limit=6');
  assert(catPage2.status === 200 && catPage2.json?.success === true, 'GET /api/gifts/catalog page 2 returns 200');
  const p2Gifts = catPage2.json?.gifts || [];
  const p1Ids = new Set(p1Gifts.map((g) => g.giftId));
  const overlap = p2Gifts.filter((g) => p1Ids.has(g.giftId));
  assert(overlap.length === 0, 'Pagination pages have zero duplicate giftIds');

  // 2. Backend Categories
  console.log('\n2️⃣  Testing Backend Gift Categories...');
  const categoriesRes = await request('GET', '/api/gifts/categories');
  assert(categoriesRes.status === 200 && categoriesRes.json?.success === true, 'GET /api/gifts/categories returns 200');
  const cats = categoriesRes.json?.categories || [];
  assert(cats.length >= 10, `Loaded at least 10 active backend categories (got ${cats.length})`);
  const requiredSlugs = ['all', 'popular', 'luxury', 'special-event', 'basic', 'love', 'premium', 'seasonal', 'animated', 'exclusive'];
  for (const slug of requiredSlugs) {
    assert(cats.some((c) => c.slug === slug), `Category slug "${slug}" exists from backend`);
  }

  // 3. Asset Verification (Images, Thumbnails, Animations)
  console.log('\n3️⃣  Testing Gift Images, Thumbnails & Animation URLs...');
  const rose = p1Gifts.find((g) => g.giftId === 'gift_rose');
  const crown = p1Gifts.find((g) => g.giftId === 'gift_crown');
  const castle = p1Gifts.find((g) => g.giftId === 'gift_castle');
  const assetUrls = [
    rose?.imageUrl,
    rose?.thumbnailUrl,
    rose?.animationUrl,
    crown?.imageUrl,
    castle?.imageUrl,
    castle?.animationUrl,
    '/assets/gifts/fallback_gift.png',
  ].filter(Boolean);
  for (const u of assetUrls) {
    const assetRes = await request('GET', u);
    assert(assetRes.status === 200 && assetRes.buffer.length > 200, `Asset loads cleanly: ${u} (${assetRes.buffer.length} bytes)`);
  }

  // 4. Search & Category Filtering
  console.log('\n4️⃣  Testing Search, Urdu Search & Category Filters...');
  const searchRose = await request('GET', '/api/gifts/search?q=Rose');
  assert(
    searchRose.status === 200 && searchRose.json?.gifts?.some((g) => g.giftId === 'gift_rose'),
    'Search for "Rose" returns Rose gift'
  );
  const searchUr = await request('GET', `/api/gifts/search?q=${encodeURIComponent('گلاب')}`);
  assert(
    searchUr.status === 200 && searchUr.json?.gifts?.some((g) => g.giftId === 'gift_rose'),
    'Urdu search for "گلاب" returns Rose gift'
  );
  const luxuryFilter = await request('GET', '/api/gifts/catalog?category=luxury');
  assert(
    luxuryFilter.status === 200 &&
      luxuryFilter.json?.gifts?.length > 0 &&
      luxuryFilter.json?.gifts?.every((g) => g.categoryId === 'luxury'),
    'Category filter "luxury" returns only luxury gifts'
  );
  const typeFilter = await request('GET', '/api/gifts/catalog?giftType=luxury_entrance');
  assert(
    typeFilter.status === 200 && typeFilter.json?.gifts?.length > 0,
    'giftType filter "luxury_entrance" returns matching gifts'
  );
  const emptySearch = await request('GET', '/api/gifts/search?q=ZzzNoSuchGift999');
  assert(emptySearch.status === 200 && (emptySearch.json?.gifts || []).length === 0, 'Non-matching search returns empty array safely');

  // 5. Popular, New & Featured Endpoints (DB backed)
  console.log('\n5️⃣  Testing Popular, New & Featured Endpoints...');
  const popRes = await request('GET', '/api/gifts/popular');
  const popGifts = popRes.json?.gifts || [];
  let sortedPop = true;
  for (let i = 1; i < popGifts.length; i++) {
    if (popGifts[i].usageCount > popGifts[i - 1].usageCount) sortedPop = false;
  }
  assert(popRes.status === 200 && popGifts.length > 0 && sortedPop, 'Popular gifts sorted by real usageCount DESC');
  const newRes = await request('GET', '/api/gifts/new');
  assert(newRes.status === 200 && (newRes.json?.gifts || []).length > 0, 'New gifts endpoint returns DB items');
  const featRes = await request('GET', '/api/gifts/featured');
  assert(
    featRes.status === 200 && (featRes.json?.gifts || []).every((g) => g.isFeatured === true),
    'Featured gifts endpoint returns only isFeatured=true items'
  );

  // 6. Preview Safety (Zero Coin Deduction!)
  console.log('\n6️⃣  Testing Gift Detail Preview (Zero Coin Deduction)...');
  const balBefore = await request('GET', `/api/wallet/balance?userId=${DEMO_USER_ID}&preview=demo`);
  const beforeCoins = balBefore.json?.wallet?.coins;
  assert(typeof beforeCoins === 'number', `Initial demo user balance readable (${beforeCoins} coins)`);

  const detailRes = await request('GET', `/api/gifts/gift_castle?userId=${DEMO_USER_ID}&preview=demo`);
  assert(
    detailRes.status === 200 &&
      detailRes.json?.gift?.coinPrice === 10000 &&
      detailRes.json?.coinDeducted === false &&
      detailRes.json?.isAvailableForSending === true &&
      detailRes.json?.viewerCoinBalance === beforeCoins,
    'GET /api/gifts/gift_castle returns 10,000 coins, coinDeducted=false & matching read-only viewerCoinBalance'
  );

  const postPreview = await request('POST', '/api/gifts/gift_castle', { userId: DEMO_USER_ID });
  assert(postPreview.status === 405, 'POST /api/gifts/gift_castle returns 405 Method Not Allowed (Module 7.2 preview-only)');

  const balAfter = await request('GET', `/api/wallet/balance?userId=${DEMO_USER_ID}&preview=demo`);
  const afterCoins = balAfter.json?.wallet?.coins;
  assert(beforeCoins === afterCoins, `Coins unchanged after gift browsing & preview (${beforeCoins} === ${afterCoins})`);

  // 7. RBAC Security Check
  console.log('\n7️⃣  Testing RBAC Security Enforcement...');
  const anonCreate = await request('POST', '/api/admin/gifts', { name: 'Hack Gift', coinPrice: 1, categoryId: 'basic' });
  assert(anonCreate.status === 403, `Anonymous POST /api/admin/gifts rejected (${anonCreate.status})`);

  const viewerAuth = await loginAs('viewer701@popolive.com', 'ViewerPass123!');
  assert(viewerAuth.loginRes.status === 200, 'Signed in as normal viewer701@popolive.com');
  const viewerCreate = await request(
    'POST',
    '/api/admin/gifts',
    { name: 'Viewer Hack Gift', coinPrice: 10, categoryId: 'basic' },
    { Cookie: viewerAuth.cookieHeader }
  );
  assert(viewerCreate.status === 403, `Viewer POST /api/admin/gifts blocked with 403 (${viewerCreate.status})`);

  // 8. Admin Sign-In + Asset Uploads (PNG, Lottie JSON, Malicious Reject)
  console.log('\n8️⃣  Testing Admin Upload Validation & Storage...');
  const adminAuth = await loginAs('ordinaryadmin@popolive.com', 'AdminPass123!');
  assert(adminAuth.loginRes.status === 200, 'Signed in as authorized ordinaryadmin@popolive.com');

  const samplePngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const uploadPngRes = await request(
    'POST',
    '/api/admin/gifts/upload',
    {
      fileName: `qa_gift_${RUN_ID}.png`,
      mimeType: 'image/png',
      fileBase64: samplePngBase64,
    },
    { Cookie: adminAuth.cookieHeader }
  );
  assert(
    uploadPngRes.status === 201 && uploadPngRes.json?.asset?.assetType === 'png',
    'Admin PNG upload validated & stored cleanly'
  );
  if (uploadPngRes.json?.asset?.fileUrl) {
    const uploadedFetch = await request('GET', uploadPngRes.json.asset.fileUrl);
    assert(uploadedFetch.status === 200, `Uploaded asset URL resolves: ${uploadPngRes.json.asset.fileUrl}`);
  }

  const sampleLottieJson = Buffer.from(
    JSON.stringify({ v: '5.7.4', fr: 30, ip: 0, op: 60, w: 200, h: 200, nm: 'QA Spark', layers: [{ ty: 4 }] })
  ).toString('base64');
  const uploadLottieRes = await request(
    'POST',
    '/api/admin/gifts/upload',
    {
      fileName: `qa_anim_${RUN_ID}.json`,
      mimeType: 'application/json',
      fileBase64: sampleLottieJson,
    },
    { Cookie: adminAuth.cookieHeader }
  );
  assert(
    uploadLottieRes.status === 201 && uploadLottieRes.json?.asset?.assetType === 'lottie',
    'Admin Lottie JSON upload validated & stored cleanly'
  );

  const rejectExeRes = await request(
    'POST',
    '/api/admin/gifts/upload',
    {
      fileName: 'malware.exe',
      mimeType: 'application/octet-stream',
      fileBase64: Buffer.from('MZ9000').toString('base64'),
    },
    { Cookie: adminAuth.cookieHeader }
  );
  assert(rejectExeRes.status === 400, `Invalid/dangerous .exe upload rejected (${rejectExeRes.status})`);

  // 9. Admin Create, Validation, Duplicate Check, Update, Disable/Enable
  console.log('\n9️⃣  Testing Admin Gift CRUD, Validation & Enable/Disable...');
  const badPriceRes = await request(
    'POST',
    '/api/admin/gifts',
    { name: `InvalidPrice_${RUN_ID}`, description: 'Negative test', coinPrice: -50, categoryId: 'basic' },
    { Cookie: adminAuth.cookieHeader }
  );
  assert(badPriceRes.status === 400, 'Negative coinPrice rejected cleanly with 400');

  const qaGiftName = `QA Sapphire ${RUN_ID}`;
  const createGiftRes = await request(
    'POST',
    '/api/admin/gifts',
    {
      name: qaGiftName,
      nameUr: 'کیو اے نیلم',
      description: 'Automated test gift item',
      coinPrice: 777,
      categoryId: 'luxury',
      giftType: 'luxury_entrance',
      assetType: 'lottie',
      imageUrl: uploadPngRes.json?.asset?.fileUrl || '/assets/gifts/crown.png',
      thumbnailUrl: uploadPngRes.json?.asset?.thumbnailUrl || '/assets/gifts/thumbs/crown.png',
      animationUrl: uploadLottieRes.json?.asset?.fileUrl || '/assets/gifts/animations/crown.json',
      isFeatured: true,
      isNew: true,
      displayOrder: 99,
      reason: 'Module 7.2 QA creation',
    },
    { Cookie: adminAuth.cookieHeader }
  );
  assert(
    createGiftRes.status === 201 && createGiftRes.json?.success === true,
    `Admin created gift "${qaGiftName}"`,
    createGiftRes.body
  );
  const qaGiftId = createGiftRes.json?.gift?.giftId;

  // Duplicate gift prevention in same category
  const dupRes = await request(
    'POST',
    '/api/admin/gifts',
    { name: qaGiftName, description: 'Duplicate test', coinPrice: 800, categoryId: 'luxury' },
    { Cookie: adminAuth.cookieHeader }
  );
  assert(dupRes.status === 409, `Duplicate gift in same category blocked with 409 (${dupRes.status})`);

  // Update gift price
  const patchRes = await request(
    'PATCH',
    `/api/admin/gifts/${encodeURIComponent(qaGiftId)}`,
    { coinPrice: 888, reason: 'Price update QA' },
    { Cookie: adminAuth.cookieHeader }
  );
  assert(patchRes.status === 200 && patchRes.json?.gift?.coinPrice === 888, 'Admin updated gift coinPrice to 888');

  // Verify live SSE receives status toggle event!
  console.log('\n🔟 Testing Real-Time SSE Broadcast & Gift Disable/Enable...');
  const sseResult = await listenForSseEvent('gift_catalog:gift_status_changed', async () => {
    await new Promise((r) => setTimeout(r, 250));
    await request(
      'POST',
      `/api/admin/gifts/${encodeURIComponent(qaGiftId)}/status`,
      { isActive: false, reason: 'Disable test via SSE' },
      { Cookie: adminAuth.cookieHeader }
    );
  });
  assert(sseResult.connected, 'SSE /api/gifts/events connected successfully');
  assert(sseResult.matched, 'SSE received real-time gift_catalog:gift_status_changed broadcast');

  // Disabled gift should NOT appear in public catalog and should return 403 on detail
  const searchDisabled = await request('GET', `/api/gifts/search?q=${encodeURIComponent(qaGiftName)}`);
  assert((searchDisabled.json?.gifts || []).length === 0, 'Disabled gift is excluded from public search/catalog');

  const getDisabled = await request('GET', `/api/gifts/${encodeURIComponent(qaGiftId)}`);
  assert(getDisabled.status === 403, `Disabled gift detail returns 403 GIFT_DISABLED (${getDisabled.status})`);

  // Re-enable briefly to confirm enable works, then disable cleanly so catalog stays clean
  const reEnableRes = await request(
    'POST',
    `/api/admin/gifts/${encodeURIComponent(qaGiftId)}/status`,
    { isActive: true, reason: 'Re-enable verification' },
    { Cookie: adminAuth.cookieHeader }
  );
  assert(reEnableRes.status === 200 && reEnableRes.json?.gift?.isActive === true, 'Re-enabled gift works cleanly');

  const searchEnabled = await request('GET', `/api/gifts/search?q=${encodeURIComponent(qaGiftName)}`);
  assert(
    searchEnabled.json?.gifts?.some((g) => g.giftId === qaGiftId),
    'Re-enabled gift immediately appears in public search'
  );

  // Leave QA gift inactive so production UI reflects clean reference gifts
  await request(
    'POST',
    `/api/admin/gifts/${encodeURIComponent(qaGiftId)}/status`,
    { isActive: false, reason: 'Post-QA cleanup' },
    { Cookie: adminAuth.cookieHeader }
  );

  // 11. Admin Category Creation / Update / Disable + Cache Invalidation
  console.log('\n1️⃣1️⃣ Testing Admin Category Management & Redis Cache Invalidation...');
  const catSlug = `qa_cat_${RUN_ID}`;
  const createCatRes = await request(
    'POST',
    '/api/admin/gifts/categories',
    { name: `QA Events ${RUN_ID}`, shortName: 'QA', slug: catSlug, displayOrder: 99 },
    { Cookie: adminAuth.cookieHeader }
  );
  assert(createCatRes.status === 201 && createCatRes.json?.success === true, 'Admin created custom gift category');
  const qaCatId = createCatRes.json?.category?.categoryId;

  const pubCatsAfterCreate = await request('GET', '/api/gifts/categories');
  assert(
    (pubCatsAfterCreate.json?.categories || []).some((c) => c.slug === catSlug),
    'Public /api/gifts/categories shows newly added category immediately (cache invalidated)'
  );

  const disableCatRes = await request(
    'PATCH',
    `/api/admin/gifts/categories/${qaCatId}`,
    { isActive: false },
    { Cookie: adminAuth.cookieHeader }
  );
  assert(disableCatRes.status === 200 && disableCatRes.json?.category?.isActive === false, 'Admin disabled custom category cleanly');

  // 12. Audit Logs
  console.log('\n1️⃣2️⃣ Testing Gift Catalog Audit Logs...');
  const auditRes = await request('GET', '/api/admin/gifts/audit-logs?limit=15', null, {
    Cookie: adminAuth.cookieHeader,
  });
  assert(
    auditRes.status === 200 &&
      (auditRes.json?.logs || []).some((l) => l.targetId === qaGiftId),
    'Admin audit log records gift create/update/status events'
  );

  // 13. Frontend Web Routes & Zero Data Leak
  console.log('\n1️⃣3️⃣ Testing Frontend Pages & Privacy...');
  const giftsPage = await request('GET', '/gifts?preview=demo');
  assert(
    giftsPage.status === 200 && giftsPage.body.includes('Gift Catalog'),
    'GET /gifts?preview=demo returns HTTP 200 with Gift Catalog content'
  );
  const adminGiftsPage = await request('GET', '/admin/gifts');
  assert(
    adminGiftsPage.status === 200,
    'GET /admin/gifts returns HTTP 200'
  );

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 MODULE 7.2 RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('❌ Test runner fatal error:', err);
  process.exit(1);
});
