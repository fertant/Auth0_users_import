# User import/export command

## Install

Change current directory to project folder. Install all packages `npm i` and execute command `npm link`.
Now you could execute `user_import` command globally.
Before you are going to use this command you have to be on internal AWS account network with appropriate role with S3 bucket access or export AWS creds on your machine.

## Import users list

Command example:

```
user_import import "upload-bucket" "csv_folder/SampleUserMigrationFile.csv" "Connection-name" "registeringApp" "step"
2019-01-14T16:02:26.218Z - info: Import from bucket: upload-bucket, file: csv_folder/SampleUserMigrationFile.csv
2019-01-14T16:02:26.220Z - info: Collect users list for import from S3 bucket.
2019-01-14T16:02:27.615Z - info: Get connection id for Connection-name.
2019-01-14T16:02:28.444Z - info: Trigger export job on Auth0.
2019-01-14T16:02:30.392Z - info: Job completed: job_7Yv0ezBvua1yXeP2
```

Required parameters:
 - bucket - name of the bucket on S3
 - key - path to csv file with users list for import
 - connection - connection name on Auth0 where you need to import users
 - registeringApp - preset field for registering application for imported users list
 - step - starting point for import

Notice: csv file header should contain name of the fields in Auth0.

## Export users list

Command example:

```
user_import export "upload-bucket" "csv_folder/SampleUserMigrationFile.csv" "Filter-type" "Connection-name" 
2019-01-14T16:01:15.193Z - info: Export users to: upload-bucket, file: csv_folder/SampleUserMigrationFileResult.csv
2019-01-14T16:01:15.195Z - info: Collect users list for export from S3 bucket.
2019-01-14T16:01:16.417Z - info: Get connection id for Connection-name.
2019-01-14T16:01:17.235Z - info: Trigger export job on Auth0.
2019-01-14T16:01:18.892Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:20.206Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:21.514Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:22.857Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:24.169Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:25.472Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:26.775Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:28.114Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:29.424Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:30.731Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:32.035Z - info: Job pending: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:33.414Z - info: Job completed: job_DL3ixmt6ZIZJb7aN
2019-01-14T16:01:34.343Z - info: Filter users list and save to S3 bucket.
2019-01-14T16:01:34.350Z - info: Export users complete!
```

Required parameters:
 - bucket - name of the bucket on S3
 - key - path to csv file with users list for export
 - filter-type - could be user (filter by predefined users list with emails) or app (filter by application id or registered app name).
 - connection - connection name on Auth0 where you need to import users