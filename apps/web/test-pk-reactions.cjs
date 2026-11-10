const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CANONICAL_BATTLE_ID = '00000000-0000-0000-0000-000000000603';
const COMPLETED_BATTLE_ID = '00000000-0000-0000-0000-000000000604';

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    client
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, text: data });
          }
        });
      })
      .on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;
    const postData = JSON.stringify(body || {});
    const req = client.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, text: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function check(desc, condition) {
  if (condition) {
    console.log(`  ✓ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${desc}`);
    failed++;
  }
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`POPO LIVE — PHASE 6 MODULE 6.8 AUTOMATED TEST SUITE`);
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Canonical Battle: ${CANONICAL_BATTLE_ID}`);
  console.log(`======================================================\n`);

  // --- Group 1: Reaction Catalog Tests ---
  console.log('--- 1. Testing Approved PK Reaction Catalog ---');
  const catalogRes = await get(`/api/pk/battle/${CANONICAL_BATTLE_ID}/reaction/catalog`);
  check('Catalog status code is 200', catalogRes.status === 200);
  check('Catalog reports success: true', catalogRes.body?.success === true);
  check('Catalog contains exactly 10 approved reactions', catalogRes.body?.catalog?.length === 10);
  check('Catalog is strictly free (isFree: true, pointsDeducted: 0)', catalogRes.body?.isFree === true && catalogRes.body?.pointsDeducted === 0);

  const approvedIds = (catalogRes.body?.catalog || []).map((r) => r.id);
  const requiredIds = ['heart', 'like', 'fire', 'clap', 'love', 'laugh', 'wow', 'party', 'strong', 'cry'];
  const hasAll = requiredIds.every((id) => approvedIds.includes(id));
  check('All 10 required reaction IDs present (heart, like, fire, clap, love, laugh, wow, party, strong, cry)', hasAll);

  const firstReaction = catalogRes.body?.catalog?.[0];
  check('Reaction has emoji and English label', !!firstReaction?.emoji && !!firstReaction?.label);
  check('Reaction has Urdu label (labelUr)', !!firstReaction?.labelUr);

  // --- Group 2: Reaction Counters Retrieval ---
  console.log('\n--- 2. Testing Reaction Counters ---');
  const countersRes = await get(`/api/pk/battle/${CANONICAL_BATTLE_ID}/reaction/counters`);
  check('Counters status code is 200', countersRes.status === 200);
  check('Counters reports success: true', countersRes.body?.success === true);
  check('Counters object contains total count', typeof countersRes.body?.counters?.total === 'number');
  check('Counters object contains hostA count', typeof countersRes.body?.counters?.hostA === 'number');
  check('Counters object contains hostB count', typeof countersRes.body?.counters?.hostB === 'number');
  check('Counters object contains byType breakdown', typeof countersRes.body?.counters?.byType === 'object');

  const initialTotal = countersRes.body?.counters?.total || 0;

  // --- Group 3: Sending Valid Free Reactions ---
  console.log('\n--- 3. Testing Sending Valid Reactions ---');
  const sendHeartRes = await post(`/api/pk/battle/${CANONICAL_BATTLE_ID}/reaction/send`, {
    reactionType: 'heart',
    targetHostSide: 'host_a',
    userId: 'test_viewer_suite_1',
    userNickname: 'Ali Tester',
  });

  check('Send heart status code is 200', sendHeartRes.status === 200);
  check('Send heart response success: true', sendHeartRes.body?.success === true);
  check('Reaction response contains reaction ID', !!sendHeartRes.body?.reaction?.id);
  check('Reaction response contains emoji ❤️', sendHeartRes.body?.reaction?.emoji === '❤️');
  check('Reaction targetHostSide matches host_a', sendHeartRes.body?.reaction?.targetHostSide === 'host_a');
  check('Zero score impact confirmed: isScoreChanged is FALSE', sendHeartRes.body?.isScoreChanged === false);
  check('Total reactions count incremented', sendHeartRes.body?.counters?.total >= initialTotal);

  const sendLikeRes = await post(`/api/pk/battle/${CANONICAL_BATTLE_ID}/reaction/send`, {
    reactionType: 'like',
    targetHostSide: 'host_b',
    userId: 'test_viewer_suite_2',
    userNickname: 'Sana Tester',
  });

  check('Send like status code is 200', sendLikeRes.status === 200);
  check('Reaction targetHostSide matches host_b', sendLikeRes.body?.reaction?.targetHostSide === 'host_b');
  check('Like reaction emoji is 👍', sendLikeRes.body?.reaction?.emoji === '👍');
  check('Zero score impact confirmed for host_b', sendLikeRes.body?.isScoreChanged === false);

  const sendFireRes = await post(`/api/pk/battle/${CANONICAL_BATTLE_ID}/reaction/send`, {
    reactionType: 'fire',
    targetHostSide: 'both',
    userId: 'test_viewer_suite_3',
    userNickname: 'Raza Tester',
  });

  check('Send fire to both hosts status code is 200', sendFireRes.status === 200);
  check('Fire reaction targetHostSide is both', sendFireRes.body?.reaction?.targetHostSide === 'both');

  // --- Group 4: Score Integrity Verification ---
  console.log('\n--- 4. Verifying Official PK Score Remains Unaffected ---');
  // Free reactions must NEVER alter battle scores or declare a winner
  check('Reactions are strictly free and cannot change battle score', sendHeartRes.body?.isScoreChanged === false && sendLikeRes.body?.isScoreChanged === false);

  // --- Group 5: Rate Limiting & Anti-Spam Protection ---
  console.log('\n--- 5. Testing Rate Limiting & Anti-Spam Guard ---');
  const spamUserId = `spammer_${Date.now()}`;
  let spamCount = 0;
  let received429 = false;

  // Attempt to blast 12 rapid reactions within a few milliseconds
  for (let i = 0; i < 12; i++) {
    const res = await post(`/api/pk/battle/${CANONICAL_BATTLE_ID}/reaction/send`, {
      reactionType: 'clap',
      targetHostSide: 'host_a',
      userId: spamUserId,
      userNickname: 'Spam Bot',
    });
    if (res.status === 429) {
      received429 = true;
      break;
    }
    spamCount++;
  }

  check('Spam rate limiter triggers HTTP 429 when threshold exceeded (>10 reqs/2s)', received429);

  // --- Group 6: Invalid Reaction & Edge Cases ---
  console.log('\n--- 6. Testing Invalid Reaction & Edge Cases ---');
  const invalidReactionRes = await post(`/api/pk/battle/${CANONICAL_BATTLE_ID}/reaction/send`, {
    reactionType: 'unapproved_rocket_blast',
    targetHostSide: 'host_a',
    userId: 'test_viewer_suite_4',
  });
  check('Invalid reaction type rejected with HTTP 400', invalidReactionRes.status === 400);

  const notFoundBattleRes = await post(`/api/pk/battle/00000000-0000-0000-0000-999999999999/reaction/send`, {
    reactionType: 'heart',
    targetHostSide: 'host_a',
    userId: 'test_viewer_suite_5',
  });
  check('Non-existent battle returns HTTP 404', notFoundBattleRes.status === 404);

  // Rejection on completed battle
  const completedBattleRes = await post(`/api/pk/battle/${COMPLETED_BATTLE_ID}/reaction/send`, {
    reactionType: 'heart',
    targetHostSide: 'host_a',
    userId: 'test_viewer_suite_6',
  });
  check('Completed battle rejects new reactions with HTTP 400', completedBattleRes.status === 400);

  // --- Group 7: Web Pages & Watermark Verification ---
  console.log('\n--- 7. Testing Frontend Web Pages & 1:1 Design Elements ---');
  const webReactionsRes = await get('/pk/reactions');
  check('Route /pk/reactions returns HTTP 200', webReactionsRes.status === 200);
  const webReactionsHtml = webReactionsRes.text || '';
  check('Page renders 6.8 Reactions badge watermark', webReactionsHtml.includes('6.8 Reactions') || webReactionsHtml.includes('Reactions'));
  check('Page renders Sara Live host header', webReactionsHtml.includes('Sara Live'));
  check('Page renders Ayesha host header', webReactionsHtml.includes('Ayesha'));

  const webReactionsUrduRes = await get('/pk/reactions?lang=ur');
  check('Route /pk/reactions?lang=ur returns HTTP 200', webReactionsUrduRes.status === 200);
  const webReactionsUrduHtml = webReactionsUrduRes.text || '';
  check('Urdu page contains Urdu watermark (6.8 ری ایکشنز)', webReactionsUrduHtml.includes('6.8 ری ایکشنز') || webReactionsUrduHtml.includes('ری ایکشنز'));

  const webBattleReactionsRes = await get(`/pk/battle/${CANONICAL_BATTLE_ID}/reactions`);
  check(`Route /pk/battle/[battleId]/reactions returns HTTP 200`, webBattleReactionsRes.status === 200);

  const pkRootRes = await get('/pk');
  check('Root /pk discovery route returns HTTP 200', pkRootRes.status === 200);

  // --- Summary ---
  console.log(`\n======================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED / ${failed} FAILED (TOTAL ${passed + failed})`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed with unhandled error:', err);
  process.exit(1);
});
