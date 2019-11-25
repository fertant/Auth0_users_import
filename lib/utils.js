const Promise = require('bluebird');
const request = require('superagent');
const zlib = require('zlib');
const split2 = require('split2');
const _ = require('lodash');
const csvParser = require('json2csv').Parser;
var fs = require("fs");
const path = require('path');

const s3 = require('./aws.s3');            
const sftp = require('./sftp');            
const logger = require('./logger');
const jobs = require('./jobs');
const config = require('./config');

const makeRequest = (url, token) => {
  return new Promise((resolve, reject) => {
    request
      .get(url)
      .set('accept', 'json')
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err) {
          return reject(err);
        }

        if (res.status >= 200 && res.status <= 300) {
          return resolve(res.body)
        }

        return reject((res && res.error) || res);
      })
  });
};

const loadFile = (url) => {
  return new Promise((resolve, reject) => {
    const unzip = zlib.createUnzip();
    var chunks = [];
    return request
      .get(url)
      .pipe(unzip)
      .pipe(split2(JSON.parse))
      .on('data', (data) => {
        chunks.push(data)
      })
      .on('end', () => {
        return resolve(chunks);
      });
  });
};

const getConnections = (strategy, token) => {
  const concurrency = 5;
  const perPage = 100;
  const result = [];
  const url = `https://${config.get('AUTH0_DOMAIN')}/api/v2/connections`;

  let total = 0;
  let pageCount = 0;
  let query = `?per_page=${perPage}`;
  if (strategy) {
    query += '&strategy=auth0';
  }
  const getTotals = () => {
    const totalsUrl = `${url}${query}&page=0&include_totals=true`;
    return makeRequest(totalsUrl, token)
      .then((response) => {
        total = response.total || 0;
        pageCount = Math.ceil(total / perPage);
        const data = response.connections || response || [];
        data.forEach(item => result.push(item));
        return null;
      });
  };

  const getPage = (page) => {
    const pageUrl = `${url}${query}&page=${page}`;
    return makeRequest(pageUrl, token)
      .then((response) => {
        response.forEach(item => result.push(item));
        return null;
      });
  };

  const getAll = () =>
    getTotals()
      .then(() => {
        if (total === 0 || result.length >= total) {
          return result;
        }

        const pages = [];
        for (let i = 1; i <= pageCount; i++) {
          pages.push(i);
        }

        return Promise.map(pages, getPage, { concurrency });
      });

  return getAll().then(() => result);
};

const prepareOutputKey = (argv) => {
  let elements = [];
  switch (argv.filterBy) {
    case 'users':
      elements = argv.key.split('/');
      let file = elements[elements.length - 1].split('.')
      elements[elements.length - 1] = file[0] + '_Result.csv';
      return elements.join('/');
    case 'app':
      elements = argv.key.split('/');
      let fileName = prepareOutputFilename();
      if (!elements[elements.length - 1] || elements[elements.length - 1] === '') {
        elements[elements.length - 1] = fileName;
      } else {
        elements[elements.length] = fileName;
      }
      return elements.join('/');
    default:
      return argv.key;
  }
};

const prepareOutputFilename = () => {
  let todayDate = new Date().toISOString().slice(0,10);
  return 'users-export-' + todayDate + '.csv';
};

const parseImportedUsers = (users, importedUsers) => {
  const exportUsers = _.filter(users, function(user) { 
    const existing = _.filter(importedUsers, function(importedUser) { 
      return user.email.toLowerCase() == importedUser.email.toLowerCase(); 
    });
    return existing.length > 0;
  })
  const fields = [
    'user_id', 
    'email', 
    'name', 
    'nickname', 
    'last_ip', 
    'login_count', 
    'created_at', 
    'updated_at', 
    'last_login', 
    'email_verified'
  ];
  const parser = new csvParser({ fields });
  const csv = parser.parse(exportUsers);
   
  return csv;
};

const parseAppUsers = (users) => {
  let apps = fs.readFileSync(path.join(__dirname, '../data/app.json'), 'utf8');
  apps = JSON.parse(apps);
  const exportUsers = _.filter(users, function(user) {
    let existing = false;
    if (!user.hasOwnProperty('app_id') && !user.hasOwnProperty('registering_app')) {
      return false;
    }
    for (let i = 0; i < apps.length; i++) {
      if (user.hasOwnProperty('app_id') && apps[i].hasOwnProperty('app_id') && user.app_id === apps[i].app_id) {
        existing = true;
        break;
      }
      if (user.hasOwnProperty('registering_app') && apps[i].hasOwnProperty('registering_app') && user.registering_app === apps[i].registering_app) {
        existing = true;
        user.app_id = apps[i].app_id;
        break;
      }
    }
    return existing;
  })
  const fields = [
    'user_id', 
    'email', 
    'email_verified', 
    'created_at', 
    'updated_at', 
    'last_login', 
    'last_ip', 
    'logins_count',
    'app_id',
    'app_metadata',
    'user_metadata'
  ];
  const parser = new csvParser({ fields });
  const csv = parser.parse(exportUsers);
   
  return csv;
};

const loopExportJobCheck = async (jobId, token, delay, filename) => {
  try {
    jobs.check(jobId, token).then((result) => {
      if (result.status == 'completed') {
        logger.info(`Job completed: ${result.id}`);
        return loadFile(result.location)
          .then(async (users) => {
            logger.info(`Filter users list and save to sftp.`);
            let csv = parseAppUsers(users);
            sftp.putObject(Buffer.from(csv), filename);
            logger.info(`Export users complete!`);
            return csv;
          });
      } else {
        logger.info(`Job pending: ${result.id}`);
        setTimeout(loopExportJobCheck.bind({}, jobId, token, delay, filename), delay);
      }
    })
  }
  catch(err) {
    const msg = error.message || error.toString();
    logger.error(msg);
    process.exit(1);
  }
};

const loopImportJobCheck = async (json, step, token, conId, jobId, delay) => {
  const chunkSize = 1000;
  try {
    if (jobId == 'empty') {
      const importChunk = _.slice(json, step * chunkSize, (step + 1) * chunkSize);
      if (importChunk.length == 0) return;
      logger.info(`Starting import step: ${step}`);
      const job = await jobs.usersImport(conId, Buffer.from(JSON.stringify(importChunk)), token);
      jobId = job.id;
      setTimeout(loopImportJobCheck.bind({}, json, ++step, token, conId, jobId, delay), delay);
    } else {
      jobs.check(jobId, token).then((result) => {
        if (result.status == 'completed') {
          logger.info(`Job completed: ${result.id}`);
          jobId = 'empty';
          setTimeout(loopImportJobCheck.bind({}, json, step, token, conId, jobId, delay), delay);
        } else {
          logger.info(`Job pending: ${result.id}`);
          setTimeout(loopImportJobCheck.bind({}, json, step, token, conId, jobId, delay), delay);
        }
      })
    }
  }
  catch(err) {
    const msg = error.message || error.toString();
    logger.error(msg);
    process.exit(1);
  }
};

module.exports = {
  getUsersCount: (connection, token) => {
    let url = `https://${config.get('AUTH0_DOMAIN')}/api/v2/users?per_page=1&page=0&include_totals=true&search_engine=v3`;
    if (connection) {
      url += `&q=identities.connection:"${connection}"`
    }

    return makeRequest(url, token);
  },
  searchUser: (query, token) => {
    let url = `https://${config.get('AUTH0_DOMAIN')}/api/v2/users?per_page=10&page=0&include_totals=true&search_engine=v3`;
    if (query) {
      url += `&q=${query}`
    }
    return makeRequest(url, token);
  },
  loopImportJobCheck,
  loopExportJobCheck,
  getConnections,
  prepareOutputKey,
  prepareOutputFilename
};
