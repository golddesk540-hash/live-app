/**
 * POPO LIVE — B0 PROMPT 2: FLAG DISCIPLINE & FREEZE VERIFICATION SUITE
 * Validates that all module flags and provider flags are frozen to OFF by default
 * on both Mobile and Web platforms, while ensuring proper override capability.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let total = 0;

function check(title, condition, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${title}`);
    if (details) console.log(`         -> ${details}`);
  } else {
    console.error(`  [FAIL] ${title}`);
    if (details) console.error(`         -> ${details}`);
    process.exitCode = 1;
  }
}

console.log('======================================================================');
console.log('POPO LIVE: B0 PROMPT 2 MASTER FLAG FREEZE VERIFICATION');
console.log('======================================================================\n');

// -----------------------------------------------------------------------------
// SECTION 1: MOBILE FLAGS (apps/mobile/lib/api/api_config.dart)
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: MOBILE API_CONFIG.DART INSPECTION ---');

const mobileApiConfigPath = path.resolve(__dirname, 'apps/mobile/lib/api/api_config.dart');
const mobileApiConfigSrc = fs.readFileSync(mobileApiConfigPath, 'utf8');

const requiredMobileModuleFlags = [
  'useLiveApi',
  'usePartyApi',
  'useMessageApi',
  'useEconomyApi',
  'useVipApi',
  'useStoreApi',
  'useCommunityApi',
  'useFinalApi',
];

const mobileModuleFlagEnvs = [
  'USE_LIVE_API',
  'USE_PARTY_API',
  'USE_MESSAGE_API',
  'USE_ECONOMY_API',
  'USE_VIP_API',
  'USE_STORE_API',
  'USE_COMMUNITY_API',
  'USE_FINAL_API',
];

requiredMobileModuleFlags.forEach((flag, idx) => {
  const envName = mobileModuleFlagEnvs[idx];
  const regex = new RegExp(`static\\s+bool\\s+${flag}\\s*=\\s*const\\s+bool\\.fromEnvironment\\('${envName}',\\s*defaultValue:\\s*false\\);`);
  check(`Mobile module flag '${flag}' defaults to false via ${envName}`, regex.test(mobileApiConfigSrc), `Found: bool.fromEnvironment('${envName}', defaultValue: false)`);
});

const requiredMobileProviderFlags = [
  'useRealOtp',
  'useRealStorage',
  'useRealWebsocket',
  'useRealMedia',
  'useRealPartyMedia',
  'useRealPayments',
  'useRealPush',
  'useRealKyc',
  'useRealPayout',
  'useRealAdmin',
];

const mobileProviderFlagEnvs = [
  'USE_REAL_OTP',
  'USE_REAL_STORAGE',
  'USE_REAL_WEBSOCKET',
  'USE_REAL_MEDIA',
  'USE_REAL_PARTY_MEDIA',
  'USE_REAL_PAYMENTS',
  'USE_REAL_PUSH',
  'USE_REAL_KYC',
  'USE_REAL_PAYOUT',
  'USE_REAL_ADMIN',
];

requiredMobileProviderFlags.forEach((flag, idx) => {
  const envName = mobileProviderFlagEnvs[idx];
  const regex = new RegExp(`static\\s+bool\\s+${flag}\\s*=\\s*const\\s+bool\\.fromEnvironment\\('${envName}',\\s*defaultValue:\\s*false\\);`);
  check(`Mobile provider flag '${flag}' defaults to false via ${envName}`, regex.test(mobileApiConfigSrc), `Found: bool.fromEnvironment('${envName}', defaultValue: false)`);
});

// -----------------------------------------------------------------------------
// SECTION 2: WEB CLIENT FLAGS (apps/web/lib/clientFlags.ts)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: WEB CLIENTFLAGS.TS INSPECTION ---');

const webClientFlagsPath = path.resolve(__dirname, 'apps/web/lib/clientFlags.ts');
const webClientFlagsSrc = fs.readFileSync(webClientFlagsPath, 'utf8');

const requiredWebClientFlags = [
  'USE_LIVE_API',
  'USE_PARTY_API',
  'USE_MESSAGE_API',
  'USE_ECONOMY_API',
  'USE_VIP_API',
  'USE_STORE_API',
  'USE_COMMUNITY_API',
  'USE_FINAL_API',
];

requiredWebClientFlags.forEach((flag) => {
  const regex = new RegExp(`export\\s+const\\s+${flag}:\\s*boolean\\s*=\\s*process\\.env\\.NEXT_PUBLIC_${flag}\\s*===\\s*'true';`);
  check(`Web client flag '${flag}' exports and evaluates strictly to false by default`, regex.test(webClientFlagsSrc), `Found: process.env.NEXT_PUBLIC_${flag} === 'true'`);
});

// Evaluate behavior with unset environment
delete process.env.NEXT_PUBLIC_USE_LIVE_API;
delete process.env.NEXT_PUBLIC_USE_PARTY_API;
delete process.env.NEXT_PUBLIC_USE_MESSAGE_API;
delete process.env.NEXT_PUBLIC_USE_ECONOMY_API;
delete process.env.NEXT_PUBLIC_USE_VIP_API;
delete process.env.NEXT_PUBLIC_USE_STORE_API;
delete process.env.NEXT_PUBLIC_USE_COMMUNITY_API;
delete process.env.NEXT_PUBLIC_USE_FINAL_API;

// -----------------------------------------------------------------------------
// SECTION 3: WEB ENVIRONMENT FILES (.env.development, .env.staging, .env.production)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: WEB ENVIRONMENT FILES INSPECTION ---');

const envFiles = [
  'apps/web/.env.development',
  'apps/web/.env.staging',
  'apps/web/.env.production',
];

const requiredEnvModuleFlags = [
  'NEXT_PUBLIC_USE_LIVE_API=false',
  'NEXT_PUBLIC_USE_PARTY_API=false',
  'NEXT_PUBLIC_USE_MESSAGE_API=false',
  'NEXT_PUBLIC_USE_ECONOMY_API=false',
  'NEXT_PUBLIC_USE_VIP_API=false',
  'NEXT_PUBLIC_USE_STORE_API=false',
  'NEXT_PUBLIC_USE_COMMUNITY_API=false',
  'NEXT_PUBLIC_USE_FINAL_API=false',
];

const requiredEnvProviderFlags = [
  'USE_REAL_OTP=false',
  'USE_REAL_STORAGE=false',
  'USE_REAL_WEBSOCKET=false',
  'USE_REAL_MEDIA=false',
  'USE_REAL_PARTY_MEDIA=false',
  'USE_REAL_PAYMENTS=false',
  'USE_REAL_PUSH=false',
  'USE_REAL_KYC=false',
  'USE_REAL_PAYOUT=false',
  'USE_REAL_ADMIN=false',
];

envFiles.forEach((file) => {
  const envSrc = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
  const baseName = path.basename(file);

  requiredEnvModuleFlags.forEach((flagDef) => {
    check(`${baseName} explicitly freezes '${flagDef}'`, envSrc.includes(flagDef), `Matched: ${flagDef}`);
  });

  requiredEnvProviderFlags.forEach((provDef) => {
    check(`${baseName} explicitly freezes provider '${provDef}'`, envSrc.includes(provDef), `Matched: ${provDef}`);
  });
});

console.log('\n======================================================================');
console.log(`TOTAL B0 FLAG AUDIT CHECKS: ${total}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${total - passed}`);
console.log('======================================================================\n');

if (passed === total) {
  console.log('ALL B0 FLAG FREEZE AND DISCIPLINE VERIFICATIONS PASSED WITH 100% SUCCESS!');
} else {
  console.error('B0 FLAG VERIFICATION FAILED.');
  process.exit(1);
}
