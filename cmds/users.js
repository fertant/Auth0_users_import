const sts = require('../lib/aws.sts');
const secretManager = require('../lib/aws.sm');
const auth = require('../lib/auth');
const utils = require('../lib/utils');
const logger = require('../lib/logger');
const config = require('../lib/config');

exports.command = 'users <cmd> <filter>'
exports.desc = 'Search users.'
exports.builder = {}
exports.handler = async function (argv) {
  const secretArn = 'arn:aws:secretsmanager:eu-west-1:<ACCOUNT-ID>:secret:<SECRET>';
  try {
    logger.info(`Get Auth0 credentials from Secret Manager.`);
    const secrets = await secretManager.getValue(secretArn);
    const credsOAuth = JSON.parse(secrets.SecretString);
    config.set('AUTH0_CLIENT_ID', credsOAuth.clientId);
    config.set('AUTH0_CLIENT_SECRET', credsOAuth.clientSecret);
    config.set('AUTH0_DOMAIN', credsOAuth.domain);
    config.set('AWS_CREDS', creds);

    const token = await auth.getToken();
    if (argv.cmd == 'get') {
        logger.info(`Get user info by id: ${argv.filter}.`);
        const result = await utils.searchUserId(argv.filter, token.access_token)
        console.log(result);
    }
  }
  catch(error) {
    const msg = error.message || error.toString();
    logger.error(msg);
    process.exit(1);
  }
}