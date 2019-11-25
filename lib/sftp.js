let dns = require('dns');
let Client = require('ssh2-sftp-client');
let sftp = new Client();
const config = require('../lib/config');
const defaults = {
    highWaterMark: 32 * 1024,
    debug: undefined,
    concurrency: 64,
    chunkSize: 32768,
    step: undefined,
    mode: 0o666,
    autoClose: true,
    encoding: null
  };

module.exports = {
    putObject: (data, filename) => {
        dns.lookup(config.get('SFTP_HOST'), function (err, addresses, family) {
            sftp.connect({
                host: addresses,
                port: '22',
                username: config.get('SFTP_USERNAME'),
                password: config.get('SFTP_PASSWORD')
            }).then(() => {
                return sftp.put(data, config.get('SFTP_PATH') + filename);
            }).then((data) => {
                sftp.end();
                console.log(data, 'the data info');
            }).catch((err) => {
                sftp.end();
                console.log(err, 'catch error');
            });
        });
    },
    listObjects: () => {
        dns.lookup(config.get('SFTP_HOST'), function (err, addresses, family) {
            sftp.connect({
                host: addresses,
                port: '22',
                username: config.get('SFTP_USERNAME'),
                password: config.get('SFTP_PASSWORD')
            }).then(() => {
                return sftp.list(config.get('SFTP_PATH'));
            }).then((data) => {
                sftp.end();
                console.log(data, 'the data info');
            }).catch((err) => {
                sftp.end();
                console.log(err, 'catch error');
            });
        });
    }
};      
