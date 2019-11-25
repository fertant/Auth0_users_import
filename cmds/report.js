const s3 = require('../lib/aws.s3');
const auth = require('../lib/auth');
const logger = require('../lib/logger');
const jobs = require('../lib/jobs');

exports.command = 'report <job_id>'
exports.desc = 'Error report for Auth0 job.'
exports.builder = {}
exports.handler = async function (argv) {
    try {
      const token = await auth.getToken();
      const report = await jobs.report(argv.job_id, token.access_token);
      report.forEach(user => {
        logger.info(`Report for user ${user.email}`);
        user.errors.forEach(error => {
          logger.info(`Error code: ${error.code}`);
          logger.info(`Error message: ${error.message}`);
        });
      });
    }
    catch(error) {
      const msg = error.message || error.toString();
      logger.error(msg);
      process.exit(1);
    }
}