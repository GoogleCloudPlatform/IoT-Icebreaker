# Token Vendor

Shows how to facilitate clients to access Google Cloud Pub/sub without having to use the credentials that have access to everything.

## Setup

The application needs service account credentials in `google-cloud-credentials.json`. This file is created in the setup part of this entire repository.

## Running locally

Run using [`dev_appserver.py`](https://cloud.google.com/appengine/docs/python/tools/devserver):

    dev_appserver.py .

## Deploying

Deploy using [`gcloud preview app deploy`](https://cloud.google.com/sdk/gcloud/reference/preview/app/deploy):

    gcloud preview app deploy --project <GOOGLE_CLOUD_PROJECT_ID>
