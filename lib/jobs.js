const Promise = require('bluebird');
const request = require('superagent');

const logger = require('./logger');
const config = require('./config');


module.exports = {
  usersImport: (connection, file, token) => {
    const url = `https://${config.get('AUTH0_DOMAIN')}/api/v2/jobs/users-imports`;

    return new Promise((resolve, reject) => {
      request
        .post(url)
        .set('accept', 'json')
        .set('Authorization', `Bearer ${token}`)
        .field('connection_id', connection)
        .attach('users', file, 'users.json')
        .end((err, res) => {
          if (err || !res) {
            return reject(err || 'Unknown error');
          }

          if (res.status >= 300) {
            return reject(res.error || res.body || res);
          }

          return resolve(res.body);
        })
    });
  },
  usersExport: (data, token) => {
    const url = `https://${config.get('AUTH0_DOMAIN')}/api/v2/jobs/users-exports`;

    return new Promise((resolve, reject) => {
      request
        .post(url)
        .send(data)
        .set('accept', 'json')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          if (err || !res) {
            return reject(err || 'Unknown error');
          }

          if (res.status >= 300) {
            return reject(res.error || res.body || res);
          }

          return resolve(res.body);
        })
    });
  },
  check: (id, token) => {
    const url = `https://${config.get('AUTH0_DOMAIN')}/api/v2/jobs/${id}`;

    return new Promise((resolve, reject) => {
      request
        .get(url)
        .set('accept', 'json')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          if (err || !res) {
            return reject(err || 'Unknown error');
          }

          if (res.status >= 300) {
            return reject(res.error || res.body || res);
          }

          return resolve(res.body);
        })
    });
  },
  loopJobCheck: (jobId, token, delay, lib) => {
    return new Promise((resolve, reject) => {
      try {
        lib.check(jobId, token).then((result) => {
          if (result.status == 'completed') {
            logger.info(`Job completed: ${result.id}`);
            return resolve(result);
          } else {
            logger.info(`Job pending: ${result.id}`);
            setTimeout(lib.loopJobCheck.bind({}, jobId, token, delay, lib), delay);
          }
        })
      }
      catch(err) {
        const msg = error.message || error.toString();
        logger.error(msg);
        process.exit(1);
      }
    });
  },
  report: (id, token) => {
    const url = `https://${config.get('AUTH0_DOMAIN')}/api/v2/jobs/${id}/errors`;
    return new Promise((resolve, reject) => {
      request
        .get(url)
        .set('accept', 'json')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          if (err || !res) {
            return reject(err || 'Unknown error');
          }

          if (res.status >= 300) {
            return reject(res.error || res.body || res);
          }

          if (res.status === 204) {
            return resolve([ 'Failed to parse users file when importing users.' ]);
          }

          return resolve(res.body);
        })
    });
  }
};
