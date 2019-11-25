const AWS = require('aws-sdk');
const config = require('../lib/config');
let s3 = new AWS.S3({
    region: config.get('AWS_DEFAULT_REGION'),
    signatureVersion: 'v4'
  });
const csv=require('csvtojson');
const _ = require('lodash');

module.exports = {
    setClient: (creds) => {
        const keys = {
            accessKeyId: creds.AccessKeyId,
            secretAccessKey: creds.SecretAccessKey,
            sessionToken: creds.SessionToken,
            region: 'eu-west-1'
        }
        s3 = new AWS.S3(keys);
    },
    listBuckets: () => {
        return new Promise((resolve, reject) => {
            s3.listBuckets(function(err, data) { 
                if (err) reject(err);
                else     resolve(data);
            });
        });
    },
    getObject: (bucket, key) => {
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: bucket, 
                Key: key
            };
            const s3Stream = s3.getObject(params).createReadStream();
            s3Stream.on('error', function(err){reject(err)});
            csv()
                .fromStream(s3Stream)
                .then((json) => {
                    const externalUsers = _.filter(json, function(user) { 
                        return user.email.toLowerCase().indexOf('elsevier.com') === -1; 
                      });
                    resolve(externalUsers);
                });
        });
    },
    putObject: (bucket, key, data) => {
        return new Promise((resolve, reject) => {
            const params = {
                Body: data,
                Bucket: bucket, 
                Key: key
            };
            s3.putObject(params, function(err, data) {
                if (err) reject(err);
                else     resolve(data);
            });
        });
    }
};      
