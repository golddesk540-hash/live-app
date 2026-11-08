const assert = require('assert');
const { Pool } = require('pg');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING POPO LIVE PHASE 3 - PROMPT 03.3 TEST SUITE');
  console.log('   Country Filters & Location-Based Discovery');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function record(name, pass, detail = '') {
    if (pass) {
      console.log(`✅ [PASS] ${name} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${detail ? '(' + detail + ')' : ''}`);
      failed++;
    }
  }

  // 1. Test Countries API: GET /api/discovery/countries
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/countries`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.countries) && data.countries.length > 20;
    record('Countries API GET /api/discovery/countries', ok, `${data.countries?.length} countries returned, worldwide live: ${data.worldwide?.activeRooms}`);
  } catch (e) {
    record('Countries API GET /api/discovery/countries', false, e.message);
  }

  // 2. Test Country Search in API: GET /api/discovery/countries?q=pak
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/countries?q=pak`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && data.countries.some(c => c.code === 'PK');
    record('Country Search in API (query="pak")', ok, `Matched ${data.countries?.length} countries: ${data.countries?.map(c => c.name).join(', ')}`);
  } catch (e) {
    record('Country Search in API', false, e.message);
  }

  // 3. Test Popular Countries API: GET /api/discovery/countries/popular
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/countries/popular`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.popular);
    const codes = data.popular.map(p => p.code);
    const hasRequired = ['ALL', 'PH', 'NP', 'IN', 'PK', 'BD'].every(c => codes.includes(c));
    record('Popular Countries API GET /api/discovery/countries/popular', ok && hasRequired, `Returned shortcuts: ${codes.join(', ')}`);
  } catch (e) {
    record('Popular Countries API', false, e.message);
  }

  // 4. Test Explore Tab with Popular Filter (ALL)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/explore?country=ALL`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.rooms) && data.rooms.length > 0;
    record('Explore Tab Filter: Popular (ALL)', ok, `${data.rooms.length} active global rooms`);
  } catch (e) {
    record('Explore Tab Filter: Popular (ALL)', false, e.message);
  }

  // 5. Test Explore Tab with Pakistan Filter (PK)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/explore?country=PK`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.rooms);
    const allPK = data.rooms.every(r => r.countryCode === 'PK');
    record('Explore Tab Filter: Pakistan (PK)', ok && allPK, `${data.rooms.length} rooms from Pakistan`);
  } catch (e) {
    record('Explore Tab Filter: Pakistan (PK)', false, e.message);
  }

  // 6. Test Explore Tab with UAE Filter (AE)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/explore?country=AE`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.rooms);
    const allAE = data.rooms.every(r => r.countryCode === 'AE');
    record('Explore Tab Filter: UAE (AE)', ok && allAE, `${data.rooms.length} rooms from UAE`);
  } catch (e) {
    record('Explore Tab Filter: UAE (AE)', false, e.message);
  }

  // 7. Test Empty Country Filter (country with 0 rooms e.g. NP or NO)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/explore?country=NO`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.rooms) && data.rooms.length === 0;
    record('Empty Country Results Handling (country=NO)', ok, `Returned empty array without crash (total: ${data.pagination?.total})`);
  } catch (e) {
    record('Empty Country Results Handling', false, e.message);
  }

  // 8. Test Invalid Country Code (sanitization & safe fallback)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/explore?country=INVALID_CODE_XYZ_99`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.rooms) && data.rooms.length === 0;
    record('Invalid Country Code Handling (country=INVALID_CODE_XYZ_99)', ok, 'Safe SQL parameterized query returned 0 rooms cleanly');
  } catch (e) {
    record('Invalid Country Code Handling', false, e.message);
  }

  // 9. Test New Broadcasters with Country Filter (country=PK)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/new?country=PK`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.creators);
    const allPK = data.creators.every(c => c.countryCode === 'PK');
    record('New Broadcasters Filter: Country (country=PK)', ok && allPK, `${data.creators.length} new creators from Pakistan`);
  } catch (e) {
    record('New Broadcasters Filter: Country', false, e.message);
  }

  // 10. Test PK Battles with Country Filter (country=PK)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/pk?country=PK`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.battles);
    const matchesPK = data.battles.every(b => b.hostA.countryCode === 'PK' || b.hostB.countryCode === 'PK');
    record('PK Battles Filter: Country (country=PK)', ok && matchesPK, `${data.battles.length} PK battles involving Pakistan creators`);
  } catch (e) {
    record('PK Battles Filter: Country', false, e.message);
  }

  // 11. Test Following Feed with Country Filter (guest access)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/following?country=PK`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && data.authenticated === false;
    record('Following Tab Country Filter (Guest State)', ok, data.message || '');
  } catch (e) {
    record('Following Tab Country Filter', false, e.message);
  }

  // 12. Test HTML SSR Generation with Country Parameters
  const pageRoutes = [
    { path: '/live?country=PK', label: 'Main Discovery with ?country=PK' },
    { path: '/live/explore?country=PH', label: 'Explore Tab with ?country=PH' },
    { path: '/live/pk?country=AE', label: 'PK Tab with ?country=AE' },
    { path: '/live/new?country=IN', label: 'New Broadcasters with ?country=IN' },
  ];

  for (const r of pageRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${r.path}`);
      const text = await res.text();
      const ok = res.status === 200 && text.length > 500 && text.includes('Popo');
      record(`HTML SSR Render: ${r.label}`, ok, `Status ${res.status}, ${text.length} bytes`);
    } catch (e) {
      record(`HTML SSR Render: ${r.label}`, false, e.message);
    }
  }

  console.log('\n======================================================');
  console.log(`📊 FINAL RESULTS: ${passed} PASSED | ${failed} FAILED (Total: ${passed + failed})`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
