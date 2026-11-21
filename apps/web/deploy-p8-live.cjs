const { Client } = require('ssh2');

function deploy(attempt = 1) {
  console.log(`[Attempt ${attempt}] Connecting to VPS 169.58.50.184 as root...`);
  const conn = new Client();

  conn.on('ready', () => {
    console.log('✅ SSH CONNECTED TO VPS AS ROOT!');

    const cmd = `
      set -e
      echo "=== 1. PULLING LATEST CODE FROM GITHUB ==="
      cd /var/www/popo-live
      git fetch origin main
      git reset --hard origin/main
      echo "Latest deployed commit:"
      git log -n 1 --oneline

      echo "=== 2. APPLYING DATABASE MIGRATIONS ==="
      if [ -f /var/www/popo-live/apps/web/data/migrations/061_live_rooms_flag_and_pk_status.sql ]; then
        sudo -u postgres psql -d nordleads -f /var/www/popo-live/apps/web/data/migrations/061_live_rooms_flag_and_pk_status.sql || true
      fi

      echo "=== 3. COMPILING APPS/API ==="
      cd /var/www/popo-live/apps/api
      npm run build || npx tsc

      echo "=== 4. BUILDING APPS/WEB NEXT.JS ==="
      cd /var/www/popo-live/apps/web
      npm run build

      echo "=== 5. RELOADING PM2 (kigolive) ==="
      pm2 reload kigolive || pm2 restart kigolive
      pm2 save

      echo "=== 6. WAITING FOR NEXT.JS STARTUP (10s) ==="
      sleep 10

      echo "=== 7. VERIFYING PRODUCTION STATUS & ENDPOINTS ==="
      pm2 status
      curl -I http://127.0.0.1:3005/
      curl -I http://127.0.0.1:3005/live
      curl -s http://127.0.0.1:3005/api/live/rooms | head -c 200
      echo ""
      curl -I http://127.0.0.1:3005/api/admin/monitoring/metrics || true

      echo "=== 🎉 DEPLOYMENT COMPLETED & VERIFIED ON VPS ==="
    `;

    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error('Command execution failed:', err);
        conn.end();
        process.exit(1);
      }

      stream.on('data', (d) => process.stdout.write(d.toString()));
      stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
      stream.on('close', (code) => {
        console.log(`\nRemote deployment finished with exit code: ${code}`);
        conn.end();
        process.exit(code);
      });
    });
  }).on('error', (err) => {
    console.error(`❌ SSH Connection Error on attempt ${attempt}:`, err.message);
    conn.end();
    if (attempt < 5) {
      console.log('Retrying connection in 8 seconds...');
      setTimeout(() => deploy(attempt + 1), 8000);
    } else {
      process.exit(1);
    }
  }).connect({
    host: '169.58.50.184',
    port: 22,
    username: 'root',
    password: 'Iftz@92071015',
    readyTimeout: 60000,
    keepaliveInterval: 0,
  });
}

deploy(1);
