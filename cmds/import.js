const s3 = require('../lib/aws.s3');
const auth = require('../lib/auth');
const utils = require('../lib/utils');
const logger = require('../lib/logger');
const _ = require('lodash');

exports.command = 'import <bucket> <key> <connection> <registeringApp> <step>'
exports.desc = 'Import users list from S3 bucket to Auth0.'
exports.builder = {}
exports.handler = async function (argv) {
    const secretArn = 'arn:aws:secretsmanager:eu-west-1:<ACCOUNT-ID>:secret:<SECRET>';
    logger.info(`Import from bucket: ${argv.bucket}, file: ${argv.key}`);
    try {
      logger.info(`Get Auth0 credentials from Secret Manager.`);
      const secrets = await secretManager.getValue(secretArn);
      const credsOAuth = JSON.parse(secrets.SecretString);
      config.set('AUTH0_CLIENT_ID', credsOAuth.clientId);
      config.set('AUTH0_CLIENT_SECRET', credsOAuth.clientSecret);
      config.set('AUTH0_DOMAIN', credsOAuth.domain);
  
      logger.info(`Collect users list for import from S3 bucket.`);
      let json = await s3.getObject(argv.bucket, argv.key);
      json = _.map(json, function(user) {
        user.app_metadata = {
          "registering_app": argv.registeringApp
        };
        user.email_verified = true;
        return user;
      });
      const token = await auth.getToken();
      logger.info(`Get connection id for ${argv.connection}.`);
      const connections = await utils.getConnections(true, token.access_token);
      let conId = '';
      connections.forEach(con => {
        if (con.name == argv.connection) {
          conId = con.id;
        }
      });
      logger.info(`Trigger import job on Auth0.`);
      utils.loopImportJobCheck(json, argv.step, token.access_token, conId, 'empty', 500);
    }
    catch(error) {
      const msg = error.message || error.toString();
      logger.error(msg);
      process.exit(1);
    }
}