const { Client } = require('ssh2');

const conn = new Client();

console.log('Testing connection to 169.58.50.184 as root...');

conn.on('ready', () => {
  console.log('✅ SSH CONNECTION SUCCESSFUL! Logged in as root.');
  conn.exec('uname -a && cat /etc/os-release', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', (data) => { out += data; });
    stream.on('close', (code, signal) => {
      console.log('System info:\n' + out);
      conn.end();
      process.exit(0);
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Connection Failed:', err.message);
  process.exit(1);
}).connect({
  host: '169.58.50.184',
  port: 22,
  username: 'root',
  password: 'Iftkharzaman',
  readyTimeout: 20000,
});
