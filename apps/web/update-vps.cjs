const { Client } = require('ssh2');

const conn = new Client();

function exec(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n> ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', d => { out += d; process.stdout.write(d.toString()); });
      stream.stderr.on('data', d => { process.stderr.write(d.toString()); });
      stream.on('close', code => {
        if (code === 0) resolve(out);
        else reject(new Error(`Exit code ${code}`));
      });
    });
  });
}

async function main() {
  await new Promise((res, rej) => {
    conn.on('ready', res).on('error', rej).connect({
      host: '169.58.50.184',
      port: 22,
      username: 'root',
      password: 'Iftkharzaman',
      readyTimeout: 30000,
    });
  });

  console.log('Connected to VPS.');

  // 1. Pull latest code from GitHub
  await exec('cd /var/www/popo-live && git fetch origin main && git reset --hard origin/main');

  // 1.5. Apply Migrations (010 to 016) on VPS PostgreSQL
  await exec('cd /var/www/popo-live/apps/web && node data/migrations/apply_010.cjs');
  await exec('cd /var/www/popo-live/apps/web && node data/migrations/apply_011.cjs');
  await exec('cd /var/www/popo-live/apps/web && node data/migrations/apply_012.cjs');
  await exec('cd /var/www/popo-live/apps/web && node data/migrations/apply_013.cjs');
  await exec('cd /var/www/popo-live/apps/web && node data/migrations/apply_014.cjs');
  await exec('cd /var/www/popo-live/apps/web && node data/migrations/apply_015.cjs');
  await exec('cd /var/www/popo-live/apps/web && node data/migrations/apply_016.cjs');

  // 2. Build Next.js
  await exec('cd /var/www/popo-live/apps/web && npm run build');

  // 3. Reload PM2 process
  await exec('pm2 reload popo-live');

  // 4. Check status
  await exec('pm2 list');

  // 5. Verify local response on port 3005
  await exec('curl -I http://127.0.0.1:3005/live/explore');
  await exec('curl -I http://127.0.0.1:3005/live/party');
  await exec('curl -I http://127.0.0.1:3005/live/following');
  await exec('curl -I http://127.0.0.1:3005/live/near');
  await exec('curl -I http://127.0.0.1:3005/near');
  await exec('curl -I http://127.0.0.1:3005/staff');
  await exec('curl -I http://127.0.0.1:3005/search');

  // 6. Verify public HTTPS response
  await exec('curl -I https://kigolive.com/live/explore');
  await exec('curl -I https://kigolive.com/live/party');
  await exec('curl -I https://kigolive.com/live/following');
  await exec('curl -I https://kigolive.com/live/near');
  await exec('curl -I https://kigolive.com/near');
  await exec('curl -I https://kigolive.com/staff');
  await exec('curl -I https://kigolive.com/search');
  await exec('curl -s https://kigolive.com/api/discovery/near');
  await exec('curl -s "https://kigolive.com/api/staff/test-rooms?preview=demo"');

  console.log('\n🎉 VPS UPDATE & RELOAD COMPLETED SUCCESSFULLY!');
  conn.end();
}

main().catch(err => {
  console.error('Update failed:', err);
  conn.end();
  process.exit(1);
});
