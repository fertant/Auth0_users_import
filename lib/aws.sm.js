const AWS = require('aws-sdk');
const config = require('../lib/config');
let secretsmanager = new AWS.SecretsManager({
    region: config.get('AWS_DEFAULT_REGION'),
    signatureVersion: 'v4'
  });

module.exports = {
    setClient: (creds) => {
        const keys = {
            accessKeyId: creds.AccessKeyId,
            secretAccessKey: creds.SecretAccessKey,
            sessionToken: creds.SessionToken,
            region: 'eu-west-1'
        }
        secretsmanager = new AWS.SecretsManager(keys);
    },
    getValue: (id) => {
        return new Promise((resolve, reject) => {
            let params = {
                SecretId: id
            };
            secretsmanager.getSecretValue(params, function(err, data) {
                if (err) reject(err);
                else     resolve(data);
            });
        });
    }
};      
