# Sending mobile phone sensor data to Google Cloud Pub/sub

## Running locally

Assuming you've done the setup part in the root of this github repo, you can authenticate with the Google Cloud credentials there.

```
export GOOGLE_APPLICATION_CREDENTIALS=../google-cloud-credentials.json
dev_appserver.py -A <GOOGLE_CLOUD_PROJECT_ID> .
```
