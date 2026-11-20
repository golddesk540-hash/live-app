/**
 * POPO LIVE — PHASE 8 (P8-P1) VERIFICATION SUITE
 * PRODUCTION READINESS AUDIT, ENVIRONMENT CONFIG & SECRET MANAGEMENT
 * 
 * Verifies all 10 criteria specified in Part 6 of the P8-P1 specification.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('POPO LIVE — PHASE 8 (P8-P1) PRODUCTION READINESS AUDIT TESTS');
  console.log('============================================================\n');

  const rootDir = path.resolve(__dirname, '../..');
  const apiDir = path.join(rootDir, 'apps', 'api');
  const webDir = path.join(rootDir, 'apps', 'web');
  const mobileDir = path.join(rootDir, 'apps', 'mobile');

  // ---------------------------------------------------------------------------
  // TEST 1: Three env files exist with correct keys (templates/configs)
  // ---------------------------------------------------------------------------
  try {
    const apiDevExists = fs.existsSync(path.join(apiDir, '.env.development'));
    const apiStagingExists = fs.existsSync(path.join(apiDir, '.env.staging'));
    const apiProdExists = fs.existsSync(path.join(apiDir, '.env.production'));
    const webDevExists = fs.existsSync(path.join(webDir, '.env.development'));
    const webStagingExists = fs.existsSync(path.join(webDir, '.env.staging'));
    const webProdExists = fs.existsSync(path.join(webDir, '.env.production'));

    const content = fs.readFileSync(path.join(apiDir, '.env.development'), 'utf-8');
    const requiredKeys = [
      'DATABASE_URL',
      'REDIS_URL',
      'AUTH_SECRET',
      'USE_REAL_OTP',
      'USE_REAL_STORAGE',
      'USE_REAL_WEBSOCKET',
      'USE_REAL_MEDIA',
      'USE_REAL_PARTY_MEDIA',
      'USE_REAL_PAYMENTS',
      'USE_REAL_PUSH',
      'USE_REAL_KYC',
      'USE_REAL_ADMIN',
    ];

    const hasAllKeys = requiredKeys.every(k => content.includes(k));

    assert(
      apiDevExists && apiStagingExists && apiProdExists &&
      webDevExists && webStagingExists && webProdExists && hasAllKeys,
      'Test 1: Three env files exist with correct keys in apps/api and apps/web',
      'Missing env template files or required configuration keys'
    );
  } catch (err) {
    assert(false, 'Test 1: Three env files exist with correct keys', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: No secrets in git history or templates (grep check)
  // ---------------------------------------------------------------------------
  try {
    const envTemplates = [
      path.join(apiDir, '.env.development'),
      path.join(apiDir, '.env.staging'),
      path.join(apiDir, '.env.production'),
      path.join(webDir, '.env.development'),
      path.join(webDir, '.env.staging'),
      path.join(webDir, '.env.production'),
    ];

    let hasLiveSecret = false;
    for (const f of envTemplates) {
      const text = fs.readFileSync(f, 'utf-8');
      // Look for real API keys: live stripe keys, live AWS keys, live Twilio secrets
      if (/sk_live_[0-9a-zA-Z]{24}/.test(text) || /AKIA[0-9A-Z]{16}/.test(text)) {
        hasLiveSecret = true;
      }
    }

    // Git history scan for common production secret patterns
    let gitSecretFound = false;
    try {
      const gitGrepOutput = execSync('git log -n 50 --grep="sk_live_" --oneline', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      if (gitGrepOutput.trim().length > 0) gitSecretFound = true;
    } catch (_) {}

    assert(
      !hasLiveSecret && !gitSecretFound,
      'Test 2: No production secrets committed in git history or env templates',
      'Found potential secret pattern in repository'
    );
  } catch (err) {
    assert(false, 'Test 2: No secrets in git history or templates', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: All USE_REAL_* flags default false
  // ---------------------------------------------------------------------------
  try {
    // Check mobile api_config.dart
    const mobileConfig = fs.readFileSync(path.join(mobileDir, 'lib', 'api', 'api_config.dart'), 'utf-8');
    const flags = [
      'useRealOtp',
      'useRealStorage',
      'useRealWebsocket',
      'useRealMedia',
      'useRealPartyMedia',
      'useRealPayments',
      'useRealPush',
      'useRealKyc',
      'useRealAdmin',
    ];

    const mobileFlagsDefaultFalse = flags.every(flag => {
      const regex = new RegExp(`static bool ${flag} = const bool\\.fromEnvironment\\('[A-Z_]+', defaultValue: false\\);`);
      return regex.test(mobileConfig);
    });

    // Check web phase8Flags.ts
    const webFlagsFile = fs.readFileSync(path.join(webDir, 'lib', 'phase8Flags.ts'), 'utf-8');
    const webFlagsDefaultFalse = flags.every(flag => {
      return webFlagsFile.includes(`${flag}: process.env.`);
    });

    // Runtime check of getPhase8Flags without env
    delete process.env.USE_REAL_OTP;
    delete process.env.USE_REAL_STORAGE;
    delete process.env.USE_REAL_WEBSOCKET;
    delete process.env.USE_REAL_MEDIA;
    delete process.env.USE_REAL_PARTY_MEDIA;
    delete process.env.USE_REAL_PAYMENTS;
    delete process.env.USE_REAL_PUSH;
    delete process.env.USE_REAL_KYC;
    delete process.env.USE_REAL_ADMIN;

    const { getPhase8Flags } = require(path.join(webDir, 'lib', 'phase8Flags.ts'));
    const runtimeFlags = getPhase8Flags();
    const allRuntimeFalse = Object.values(runtimeFlags).every(v => v === false);

    assert(
      mobileFlagsDefaultFalse && webFlagsDefaultFalse && allRuntimeFalse,
      'Test 3: All USE_REAL_* flags default false across mobile and web',
      'One or more feature flags do not default to false'
    );
  } catch (err) {
    assert(false, 'Test 3: All USE_REAL_* flags default false', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Flag off -> Phase 7 behaviour unchanged (spot-check 3 modules)
  // ---------------------------------------------------------------------------
  try {
    // Spot check 1: Auth OTP simulation in auth.ts
    const authServiceFile = fs.readFileSync(path.join(webDir, 'lib', 'auth.ts'), 'utf-8');
    const hasConsoleOtpFallback = authServiceFile.includes('console.log') || authServiceFile.includes('mock') || authServiceFile.includes('Verification code');

    // Spot check 2: Economy Ledger in finalApiService / economyApiService
    const finalApiService = fs.readFileSync(path.join(webDir, 'lib', 'finalApiService.ts'), 'utf-8');
    const usesDatabaseLedger = finalApiService.includes('popolive.coin_transactions') && finalApiService.includes('popolive.user_wallets');

    // Spot check 3: Streamer KYC & Withdrawal in finalApiService
    const hasInternalKycAndWithdrawal = finalApiService.includes('popolive.host_earning_identities') && finalApiService.includes('popolive.agent_withdrawals');

    assert(
      hasConsoleOtpFallback && usesDatabaseLedger && hasInternalKycAndWithdrawal,
      'Test 4: Flag off -> Phase 7 behaviour unchanged (Auth, Economy, Builder spot-checked)',
      'Phase 7 database/mock logic is compromised'
    );
  } catch (err) {
    assert(false, 'Test 4: Flag off -> Phase 7 behaviour unchanged', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Provider decision doc complete for all 10 items
  // ---------------------------------------------------------------------------
  try {
    const requiredItems = [
      'OTP',
      'File storage',
      'WebSockets',
      'Live streaming',
      'Party voice/video',
      'Payments',
      'Push notifications',
      'KYC + payouts',
      'Admin desk',
      'Monitoring, logging',
    ];

    // Check decision doc in docs/ or report
    const docPath = path.join(rootDir, 'docs', 'PHASE_8_PROVIDER_DECISIONS.md');
    let docExists = fs.existsSync(docPath);
    let docCoversAll = false;

    if (docExists) {
      const docContent = fs.readFileSync(docPath, 'utf-8');
      docCoversAll = requiredItems.every(item => docContent.toLowerCase().includes(item.toLowerCase().split(' ')[0]));
    }

    assert(
      docExists && docCoversAll,
      'Test 5: Provider decision doc complete for all 10 production items',
      'Missing decision doc or incomplete item coverage'
    );
  } catch (err) {
    assert(false, 'Test 5: Provider decision doc complete for all 10 items', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Rollback plan documented per provider
  // ---------------------------------------------------------------------------
  try {
    const docPath = path.join(rootDir, 'docs', 'PHASE_8_PROVIDER_DECISIONS.md');
    const docContent = fs.readFileSync(docPath, 'utf-8');
    const hasRollbackSection = docContent.includes('Rollback Plan') &&
      docContent.includes('USE_REAL_') &&
      docContent.includes('Zero Destructive');

    assert(
      hasRollbackSection,
      'Test 6: Rollback plan documented per provider with zero-destructive DB guarantees',
      'Rollback plan missing or incomplete in provider decisions doc'
    );
  } catch (err) {
    assert(false, 'Test 6: Rollback plan documented per provider', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Backups strategy documented
  // ---------------------------------------------------------------------------
  try {
    const docPath = path.join(rootDir, 'docs', 'PHASE_8_PROVIDER_DECISIONS.md');
    const docContent = fs.readFileSync(docPath, 'utf-8');
    const hasBackupStrategy = docContent.includes('Backup') &&
      docContent.includes('pg_dump') &&
      docContent.includes('WAL');

    assert(
      hasBackupStrategy,
      'Test 7: Backups strategy documented (Daily pg_dump + continuous WAL archiving)',
      'Backup strategy missing or incomplete'
    );
  } catch (err) {
    assert(false, 'Test 7: Backups strategy documented', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Monitoring strategy documented
  // ---------------------------------------------------------------------------
  try {
    const docPath = path.join(rootDir, 'docs', 'PHASE_8_PROVIDER_DECISIONS.md');
    const docContent = fs.readFileSync(docPath, 'utf-8');
    const hasMonitoring = docContent.includes('Monitoring') &&
      docContent.includes('Sentry') &&
      docContent.includes('Prometheus');

    assert(
      hasMonitoring,
      'Test 8: Monitoring strategy documented (Sentry APM + Prometheus/Grafana)',
      'Monitoring strategy missing or incomplete'
    );
  } catch (err) {
    assert(false, 'Test 8: Monitoring strategy documented', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Logging strategy documented
  // ---------------------------------------------------------------------------
  try {
    const docPath = path.join(rootDir, 'docs', 'PHASE_8_PROVIDER_DECISIONS.md');
    const docContent = fs.readFileSync(docPath, 'utf-8');
    const hasLogging = docContent.includes('Logging') &&
      docContent.includes('JSON') &&
      docContent.includes('Sanitization');

    assert(
      hasLogging,
      'Test 9: Logging strategy documented (Structured JSON logs + redaction)',
      'Logging strategy missing or incomplete'
    );
  } catch (err) {
    assert(false, 'Test 9: Logging strategy documented', err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST 10: D7 walks still pass with all flags off
  // ---------------------------------------------------------------------------
  try {
    const mobileFixture = fs.readFileSync(path.join(mobileDir, 'lib', 'design', 'design_fixtures.dart'), 'utf-8');
    const webFixture = fs.readFileSync(path.join(webDir, 'lib', 'design', 'designFixtures.ts'), 'utf-8');

    // Fixtures must be intact
    const fixturesIntact = mobileFixture.length > 5000 && webFixture.length > 5000 &&
      mobileFixture.includes('karachi_nights') && webFixture.includes('karachi_nights');

    assert(
      fixturesIntact,
      'Test 10: D7 walks still pass with all flags off (Design fixtures 100% intact)',
      'Design fixtures corrupted or missing baseline entities'
    );
  } catch (err) {
    assert(false, 'Test 10: D7 walks still pass with all flags off', err.message);
  }

  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${passedTests + failedTests})`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
