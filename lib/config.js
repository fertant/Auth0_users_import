const path = require('path');
const nconf = require('nconf');

module.exports = nconf
  .argv()
  .env()
  .file(path.join(__dirname, '../config.json'))
  .defaults({
    NODE_ENV: 'deploy'
  });
