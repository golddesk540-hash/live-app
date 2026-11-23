const path = require('path');
const { NextRequest } = require(path.resolve(__dirname, '../apps/web/node_modules/next/server'));

async function main() {
  const { GET: popularHandler } = await import('../apps/web/app/api/discovery/countries/popular/route.ts');
  const { GET: countriesHandler } = await import('../apps/web/app/api/discovery/countries/route.ts');

  const popRes = await popularHandler();
  const popData = await popRes.json();
  console.log('Popular response:');
  console.log(popData);

  const countRes = await countriesHandler(new NextRequest('http://localhost:3000/api/discovery/countries'));
  const countData = await countRes.json();
  console.log('\nCountries response summary:');
  console.log({
    success: countData.success,
    totalCountries: countData.totalCountries,
    worldwide: countData.worldwide,
    first3: countData.countries?.slice(0, 3)
  });
}

main().catch(console.error);
