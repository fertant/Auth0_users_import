const AWS = require('aws-sdk');
const sts = new AWS.STS({
    region: 'eu-west-1'
  });

module.exports = {
    getCreds: (role) => {
        return new Promise((resolve, reject) => {
            let params = {
                RoleArn: role,
                RoleSessionName: 'Auth0UsersExport',
            };
            sts.assumeRole(params, function(err, data) {
                if (err) reject(err);
                else     resolve(data.Credentials);
            });
        });
    }
};      
