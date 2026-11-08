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
      readyTimeout: 20000,
    });
  });

  console.log('Connected to VPS.');

  // 1. Install certbot for SSL
  await exec('DEBIAN_FRONTEND=noninteractive apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y certbot python3-certbot-nginx');

  // 2. Configure Nginx with kigolive.com and www.kigolive.com
  const nginxConf = `
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name kigolive.com www.kigolive.com 169.58.50.184 _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3005;
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

  await exec(`cat << 'EOF' > /etc/nginx/sites-available/00-popolive
${nginxConf.trim()}
EOF`);

  await exec('nginx -t && systemctl reload nginx');

  // 3. Update environment on VPS for kigolive.com
  const envContent = `
DATABASE_URL=postgresql://nordleads:local-platform-password@127.0.0.1:5432/nordleads?schema=popolive
AUTH_SECRET=popolive_production_super_secret_jwt_hmac_key_2026_eu_contabo
NEXT_PUBLIC_APP_URL=https://kigolive.com
NEXT_PUBLIC_API_URL=https://kigolive.com/api
NEXT_PUBLIC_SOCKET_URL=https://kigolive.com
NODE_ENV=production
PORT=3005
`;

  await exec(`cat << 'EOF' > /var/www/popo-live/apps/web/.env.production
${envContent.trim()}
EOF`);

  console.log('\n✅ VPS is fully prepared for kigolive.com!');
  conn.end();
}

main().catch(err => {
  console.error('Error:', err);
  conn.end();
  process.exit(1);
});
