const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const VPS_HOST = '169.58.50.184';
const VPS_USER = 'root';
const VPS_PASS = 'Iftkharzaman';

const conn = new Client();

function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n======================================================`);
    console.log(`🚀 [STEP] ${description}`);
    console.log(`======================================================`);

    conn.exec(command, (err, stream) => {
      if (err) return reject(err);

      let stdout = '';
      let stderr = '';

      stream.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        process.stdout.write(text);
      });

      stream.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        process.stderr.write(text);
      });

      stream.on('close', (code) => {
        if (code === 0) {
          console.log(`\n✅ Completed: ${description}`);
          resolve(stdout);
        } else {
          console.error(`\n❌ Failed with exit code ${code}: ${description}`);
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  });
}

async function deploy() {
  console.log(`Connecting to ${VPS_HOST} as ${VPS_USER}...`);

  await new Promise((resolve, reject) => {
    conn.on('ready', () => {
      console.log('✅ SSH Connection Established to Contabo VPS!');
      resolve();
    }).on('error', reject).connect({
      host: VPS_HOST,
      port: 22,
      username: VPS_USER,
      password: VPS_PASS,
      readyTimeout: 30000,
    });
  });

  // Step 1: Update apt and install system packages
  await runCommand(
    'DEBIAN_FRONTEND=noninteractive apt-get update -y && DEBIAN_FRONTEND=noninteractive apt-get install -y curl wget git nginx postgresql postgresql-contrib ufw build-essential',
    'Updating apt packages and installing Nginx, PostgreSQL, Git'
  );

  // Step 2: Install Node.js 20 LTS & PM2
  await runCommand(
    'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs && npm install -g pm2',
    'Installing Node.js 20 LTS and PM2 Process Manager'
  );

  // Verify versions
  await runCommand('node -v && npm -v && pm2 -v && psql --version', 'Verifying installed runtime versions');

  // Step 3: Setup PostgreSQL User, Database, and Schema
  const pgSetup = `
systemctl start postgresql && systemctl enable postgresql
sudo -u postgres psql -c "DO \\$do\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nordleads') THEN CREATE ROLE nordleads WITH LOGIN PASSWORD 'local-platform-password' SUPERUSER; ELSE ALTER ROLE nordleads WITH PASSWORD 'local-platform-password'; END IF; END \\$do\\$;"
sudo -u postgres createdb -O nordleads nordleads 2>/dev/null || true
sudo -u postgres psql -d nordleads -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
sudo -u postgres psql -d nordleads -c "CREATE SCHEMA IF NOT EXISTS popolive AUTHORIZATION nordleads;"
sudo -u postgres psql -d nordleads -c "GRANT ALL ON SCHEMA popolive TO nordleads;"
`;
  await runCommand(pgSetup, 'Configuring PostgreSQL database (nordleads) & schema (popolive)');

  // Step 4: Clone or Pull latest repository
  const repoSetup = `
mkdir -p /var/www
if [ -d "/var/www/popo-live/.git" ]; then
  cd /var/www/popo-live && git reset --hard && git pull origin main
else
  rm -rf /var/www/popo-live
  cd /var/www && git clone https://github.com/golddesk540-hash/live-app.git popo-live
fi
`;
  await runCommand(repoSetup, 'Cloning Popo Live repository from GitHub (main branch)');

  // Step 5: Configure Environment Variables
  const envContent = `
DATABASE_URL=postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive
AUTH_SECRET=popolive_production_super_secret_jwt_hmac_key_2026_eu_contabo
NEXT_PUBLIC_APP_URL=http://${VPS_HOST}
NEXT_PUBLIC_API_URL=http://${VPS_HOST}/api
NEXT_PUBLIC_SOCKET_URL=http://${VPS_HOST}
NODE_ENV=production
PORT=3000
`;
  const writeEnv = `cat << 'EOF' > /var/www/popo-live/apps/web/.env.local
${envContent.trim()}
EOF
cat << 'EOF' > /var/www/popo-live/apps/web/.env.production
${envContent.trim()}
EOF
`;
  await runCommand(writeEnv, 'Writing production environment variables (.env.local, .env.production)');

  // Step 6: Install dependencies & run database migrations on server
  const installAndMigrate = `
cd /var/www/popo-live/apps/web
npm install --production=false
# Apply migrations sequentially
if [ -d "data/migrations" ]; then
  for sql in data/migrations/*.sql; do
    echo "Applying migration: $sql"
    sudo -u postgres psql -d nordleads -f "$sql"
  done
fi
# Apply initial seed/faqs if script exists
if [ -f "data/migrations/apply_009.cjs" ]; then
  node data/migrations/apply_009.cjs || true
fi
`;
  await runCommand(installAndMigrate, 'Installing NPM packages and applying database migrations');

  // Step 7: Build Next.js Production Bundle
  await runCommand(
    'cd /var/www/popo-live/apps/web && npm run build',
    'Compiling and building Next.js production web application'
  );

  // Step 8: Configure PM2 for automatic startup
  const startPm2 = `
cd /var/www/popo-live/apps/web
pm2 delete popo-live || true
pm2 start npm --name "popo-live" -- start
pm2 save
pm2 startup systemd -u root --hp /root || true
`;
  await runCommand(startPm2, 'Starting Popo Live on PM2 background process manager');

  // Step 9: Configure Nginx Reverse Proxy (Port 80 -> Port 3000)
  const nginxConfig = `
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${VPS_HOST} _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
  const writeNginx = `
cat << 'EOF' > /etc/nginx/sites-available/default
${nginxConfig.trim()}
EOF
nginx -t && systemctl restart nginx
`;
  await runCommand(writeNginx, 'Configuring Nginx reverse proxy on port 80 to port 3000');

  // Step 10: Configure Firewall
  const firewall = `
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable || true
ufw status
`;
  await runCommand(firewall, 'Configuring UFW Firewall (allowing SSH 22, HTTP 80, HTTPS 443)');

  // Step 11: Verify Live HTTP response
  await runCommand('curl -I http://127.0.0.1', 'Verifying local HTTP response on VPS port 80');

  console.log('\n======================================================');
  console.log('🎉 DEPLOYMENT COMPLETE! POPO LIVE IS LIVE ON VPS!');
  console.log(`🌐 Public Website URL: http://${VPS_HOST}`);
  console.log('======================================================');

  conn.end();
}

deploy().catch((err) => {
  console.error('\n💥 Deployment script encountered an error:', err);
  conn.end();
  process.exit(1);
});
