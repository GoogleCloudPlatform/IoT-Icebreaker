# Sending Mobile Phone Sensor Data to Google Cloud Pub/Sub

## Running locally

Assuming you've done the setup part in the root of this GitHub repo, you can authenticate with your Google Cloud Platform credentials, there.

    export GOOGLE_APPLICATION_CREDENTIALS=../google-cloud-credentials.json 
    dev_appserver.py -A <GOOGLE_CLOUD_PROJECT_ID> .

