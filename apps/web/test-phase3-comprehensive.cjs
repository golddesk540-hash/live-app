/**
 * POPO LIVE — PHASE 3 MASTER TEST SUITE
 * Comprehensive validation across all 10 Phase 3 modules:
 * - Module 3.1: Discovery Header & Navigation Tabs
 * - Module 3.2: Country & Regional Category Filters
 * - Module 3.3: Live Room Card Component
 * - Module 3.4: Discovery Grid & Infinite Scroll
 * - Module 3.5: Discovery Banners & Rank Doors
 * - Module 3.6: Party Discovery List
 * - Module 3.7: Global Search System
 * - Module 3.8: Following Discovery List
 * - Module 3.9: Near (Default OFF) Screen
 * - Module 3.10: Staff Preview Tool for Test Rooms
 * - Production Health Verification (kigolive.com)
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

console.log('================================================================');
console.log('🌟 POPO LIVE — PHASE 3 FULL REGRESSION & COMPREHENSIVE SUITE 🌟');
console.log('   Modules 3.1 through 3.10 + Production Verification');
console.log('================================================================\n');

const testSuites = [
  { module: 'Module 3.1', name: 'Discovery Header & Tabs', script: 'test-discovery-shells.cjs' },
  { module: 'Module 3.2', name: 'Country & Regional Filters', script: 'test-country-filters.cjs' },
  { module: 'Module 3.3', name: 'Live Room Cards & System', script: 'test-room-cards.cjs' },
  { module: 'Module 3.4', name: 'Discovery Tabs & Grid', script: 'test-discovery-tabs.cjs' },
  { module: 'Module 3.5', name: 'Banners & Rank Doors', script: 'test-banners-and-rank-doors.cjs' },
  { module: 'Module 3.6', name: 'Party Discovery List', script: 'test-party-discovery.cjs' },
  { module: 'Module 3.7', name: 'Global Search System', script: 'test-search-module.cjs' },
  { module: 'Module 3.8', name: 'Following Discovery List', script: 'test-following-module.cjs' },
  { module: 'Module 3.9', name: 'Near Screen (Default OFF)', script: 'test-near-module.cjs' },
  { module: 'Module 3.10', name: 'Staff Preview Tool', script: 'test-staff-preview-module.cjs' },
];

const results = [];
let totalLocalPassed = 0;
let totalLocalFailed = 0;

for (const suite of testSuites) {
  process.stdout.write(`⏳ Running [${suite.module}] ${suite.name} ... `);
  try {
    const output = execSync(`node ${suite.script}`, { cwd: __dirname, encoding: 'utf-8', stdio: 'pipe' });
    
    // Count passes in output
    const passMatches = output.match(/(\[PASS\]|✅ PASS:|✔ \[PASS\])/g) || [];
    const count = passMatches.length;
    totalLocalPassed += count;
    results.push({ module: suite.module, name: suite.name, count, status: 'PASS' });
    console.log(`✅ PASS (${count} assertions)`);
  } catch (err) {
    totalLocalFailed += 1;
    results.push({ module: suite.module, name: suite.name, count: 0, status: 'FAIL', error: err.message });
    console.log(`❌ FAIL`);
  }
}

// Production VPS Live Smoke Checks
console.log('\n================================================================');
console.log('🌐 RUNNING PRODUCTION VPS LIVE SMOKE CHECKS (https://kigolive.com)');
console.log('================================================================\n');

function checkUrl(url, expectedStatus = 200, isJson = false) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let ok = res.statusCode === expectedStatus;
        let details = `HTTP ${res.statusCode}`;
        if (isJson) {
          try {
            const j = JSON.parse(data);
            if (!j.success && !j.total && !j.status) ok = false;
            details += ` (JSON valid: ${Object.keys(j).length} keys)`;
          } catch (e) {
            ok = false;
            details += ' (JSON parse error)';
          }
        }
        resolve({ url, ok, details, statusCode: res.statusCode });
      });
    }).on('error', (err) => {
      resolve({ url, ok: false, details: err.message });
    });
  });
}

async function runProductionChecks() {
  const productionEndpoints = [
    { url: 'https://kigolive.com/live/explore', name: 'Explore Screen' },
    { url: 'https://kigolive.com/live/following', name: 'Following Screen' },
    { url: 'https://kigolive.com/live/party', name: 'Party Discovery Screen' },
    { url: 'https://kigolive.com/live/pk', name: 'PK Battles Screen' },
    { url: 'https://kigolive.com/live/new', name: 'New Creators Screen' },
    { url: 'https://kigolive.com/live/near', name: 'Near Screen (Tab)' },
    { url: 'https://kigolive.com/near', name: 'Near Screen (Direct)' },
    { url: 'https://kigolive.com/party', name: 'Party Screen (Direct)' },
    { url: 'https://kigolive.com/search', name: 'Global Search Screen' },
    { url: 'https://kigolive.com/staff', name: 'Staff Preview Screen' },
    { url: 'https://kigolive.com/api/discovery/countries', name: 'Country Filters API', json: true },
    { url: 'https://kigolive.com/api/discovery/rooms', name: 'Live Rooms API', json: true },
    { url: 'https://kigolive.com/api/discovery/banners', name: 'Banners API', json: true },
    { url: 'https://kigolive.com/api/discovery/rank-doors', name: 'Rank Doors API', json: true },
    { url: 'https://kigolive.com/api/discovery/party', name: 'Party Rooms API', json: true },
    { url: 'https://kigolive.com/api/discovery/following', name: 'Following API', json: true },
    { url: 'https://kigolive.com/api/discovery/near', name: 'Near API (OFF Status)', json: true },
    { url: 'https://kigolive.com/api/staff/test-rooms?preview=demo', name: 'Staff Test Rooms API', json: true }
  ];

  let prodPassed = 0;
  let prodFailed = 0;

  for (const ep of productionEndpoints) {
    const res = await checkUrl(ep.url, 200, ep.json);
    if (res.ok) {
      prodPassed++;
      console.log(`  ✅ [PROD PASS] ${ep.name.padEnd(26)} -> ${res.details} (${ep.url})`);
    } else {
      prodFailed++;
      console.log(`  ❌ [PROD FAIL] ${ep.name.padEnd(26)} -> ${res.details} (${ep.url})`);
    }
  }

  console.log('\n================================================================');
  console.log('📊 FINAL COMPREHENSIVE PHASE 3 TEST SUMMARY');
  console.log('================================================================');
  console.log('Module Summary:');
  for (const r of results) {
    console.log(`  • ${r.module.padEnd(12)} ${r.name.padEnd(30)} : ${r.status} (${r.count} tests)`);
  }
  console.log('----------------------------------------------------------------');
  console.log(`Local Regression Tests  : ${totalLocalPassed} Passed, ${totalLocalFailed} Failed`);
  console.log(`Production Smoke Tests  : ${prodPassed} Passed, ${prodFailed} Failed`);
  console.log(`Total Assertions Passed : ${totalLocalPassed + prodPassed}`);
  console.log('================================================================');

  if (totalLocalFailed === 0 && prodFailed === 0) {
    console.log('🎉 ALL PHASE 3 MODULES & PRODUCTION CHECKS ARE 100% HEALTHY!');
  } else {
    process.exit(1);
  }
}

runProductionChecks();
