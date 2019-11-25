const secretManager = require('../lib/aws.sm');
const auth = require('../lib/auth');
const utils = require('../lib/utils');
const logger = require('../lib/logger');
const jobs = require('../lib/jobs');
const config = require('../lib/config');
var fs = require("fs");
const path = require('path');

exports.command = 'export <connection>'
exports.desc = 'Exports users list from Auth0 to SFTP with predefined users list.'
exports.builder = {}
exports.handler = async function (argv) {
  let outputKey = utils.prepareOutputFilename();
  const secretArn = 'arn:aws:secretsmanager:eu-west-1:<ACCOUNT-ID>:secret:<SECRET>';
  logger.info(`Export users to sftp filename: ${outputKey}.`);
  try {
    logger.info(`Get Auth0 credentials from Secret Manager.`);
    const secrets = await secretManager.getValue(secretArn);
    const credsOAuth = JSON.parse(secrets.SecretString);
    config.set('AUTH0_CLIENT_ID', credsOAuth.clientId);
    config.set('AUTH0_CLIENT_SECRET', credsOAuth.clientSecret);
    config.set('AUTH0_DOMAIN', credsOAuth.domain);
    config.set('SFTP_USERNAME', credsOAuth.sftpUsername);
    config.set('SFTP_PASSWORD', credsOAuth.sftpPassword);
    config.set('SFTP_HOST', credsOAuth.sftpHost);
    config.set('SFTP_PATH', credsOAuth.remotePath);

    const token = await auth.getToken();
    logger.info(`Get connection id for ${argv.connection}.`);
    const connections = await utils.getConnections(true, token.access_token);
    let conId = '';
    connections.forEach(con => {
      if (con.name == argv.connection) {
        conId = con.id;
      }
    });
    logger.info(`Trigger export job on Auth0.`);
    const fieldsFilter = fs.readFileSync(path.join(__dirname, '../data/fields.json'), 'utf8');
    const job = await jobs.usersExport({
      "connection_id": conId,
      "format": "json",
      "fields": JSON.parse(fieldsFilter)
    }, token.access_token);
    utils.loopExportJobCheck(job.id, token.access_token, 500, outputKey);
  }
  catch(error) {
    const msg = error.message || error.toString();
    logger.error(msg);
    process.exit(1);
  }
}