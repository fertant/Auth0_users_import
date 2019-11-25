const config = require('./config');
const Promise = require('bluebird');
const request = require('superagent');

module.exports = {
    getToken: () => {
      const url = `https://${config.get('AUTH0_DOMAIN')}/oauth/token`;
      const options = { 
          grant_type: 'client_credentials',
          client_id: config.get('AUTH0_CLIENT_ID'),
          client_secret: config.get('AUTH0_CLIENT_SECRET'),
          audience: `https://${config.get('AUTH0_DOMAIN')}/api/v2/` 
        }

      return new Promise((resolve, reject) => {
        request
          .post(url)
          .set('accept', 'json')
          .send(options)
          .end((err, res) => {
            if (err || !res) {
              return reject(err || 'Unknown error');
            }
  
            if (res.status >= 300) {
              return reject(res.error || res.body || res);
            }
  
            return resolve(res.body);
          });
      });
    }
};
  