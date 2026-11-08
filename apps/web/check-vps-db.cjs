const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  conn.exec("sudo -u postgres psql -d nordleads -c 'SELECT count(*) FROM popolive.users;' -c 'SELECT count(*) FROM popolive.live_rooms;' -c 'SELECT count(*) FROM popolive.pk_activities;'", (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '169.58.50.184', port: 22, username: 'root', password: 'Iftkharzaman' });
