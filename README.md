# Run the IoT Developer Kit Icebreaker Demo in Your Project

This example code shows how to use Google Cloud Platform to process sensor data
and publish it to Google Cloud Pub/Sub. It is available to test drive at http://cloud.google.com/solutions/iot/ as an icebreaker demonstration for a developer prototyping kit based on the [SeeedStudio BeagleBone Green Wireless](http://www.seeedstudio.com/wiki/Beaglebone_green_wireless). This is not an official Google product.

## How it works

### Authenticate the BeagleBone using a token vendor

Authentication to Google Cloud Pub/Sub uses an IAM Service Account. This
service account is used to generate time-limited OAuth access tokens used by
the agent on the IoT device. See the token-vendor readme for more details.


### Send sensor data from BeagleBone to Cloud Platform

![BeagleBone to Google Cloud
Pub/Sub](onboard-web-server/public/img/bbg-to-pubsub.png)

Using [Node.js](https://nodejs.org/) and
[libmraa](https://github.com/intel-iot-devkit/mraa), you'll access the sensors
attached to the BeagleBone. The [googleapi npm
package](https://www.npmjs.com/package/googleapis) is used to publish the
sensor data to Cloud Pub/Sub.

This way, different subscribers can subscribe to the sensor data, and then process
it however they want.

### Store data

![Google Cloud Pub/Sub to Google Cloud
Datastore](appengine/pubsub-to-datastore/pubsub-to-datastore.png)

A Google App Engine service, or *module*, is used to subscribe to the sensor data topic
and store the data in Cloud Datastore.

[View the code running in Google App Engine](appengine/pubsub-to-datastore)

### Retrieve sensor values from storage

![Google Cloud Datastore to API
endpoint](appengine/datastore-to-api/datastore-to-api.png)

To read the sensor data you'll use a separate Google App Engine service that
exposes a RESTful JSON API to the sensordata stored in Cloud Datastore.

[View the code](appengine/datastore-to-api)

## Running on your own Google Cloud Platform project

**NOTE**: All of the following command line examples assume you are inside this repository's folder as the working directory.

### Setup Cloud Pub/Sub topic and subscription

1. Create a new Cloud Platform project and enable billing.

1. [Enable Cloud Pub/Sub](https://console.cloud.google.com/apis/library?q=pub)

1. If you see a recommendation to create a credential, you can ignore that for
  now, as you will create a special service account later.
  
1.  Install [`gcloud`](https://cloud.google.com/sdk/), or run an update if you
  already have it:
  
  		gcloud components update
		export GOOGLE_CLOUD_PROJECT_ID=<your_project_id>
		gcloud config set project ${GOOGLE_CLOUD_PROJECT_ID}

1. [Create a Cloud Pub/Sub
  topic](https://console.cloud.google.com/cloudpubsub/topicList) named
  `demo-topic`:

		gcloud alpha pubsub topics create projects/${GOOGLE_CLOUD_PROJECT_ID}/topics/demo-topic

	**Note**: you will be prompted to install the alpha component for `gcloud`.

1. Add a subscription to this topic, named `pubsub-to-datastore` and of type `push`. [The specific push URL is protected on only reached by using the Cloud Pub/Sub service](https://cloud.google.com/pubsub/prereqs#configure-push-endpoints-subscribers-only).

		gcloud alpha pubsub subscriptions create pubsub-to-datastore \
		--topic "projects/${GOOGLE_CLOUD_PROJECT_ID}/topics/demo-topic" \
		--push-endpoint "https://pubsub-to-datastore-dot-${GOOGLE_CLOUD_PROJECT_ID}.appspot.com/_ah/push-handlers/data_handler"


### Set up a service account with limited access

1. [Create a service account key and download JSON
  credentials](https://console.cloud.google.com/iam-admin/serviceaccounts/project)

		gcloud iam service-accounts create iot-publisher

1. Create and download a service account key into the token vendor appengine service:

		gcloud iam service-accounts keys create \
		appengine/token-vendor/google-cloud-credentials.json \
		--iam-account iot-publisher@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com


1. When you create a service account in the web console, it is automatically added to the `editor` role for your whole project. For this use, you should use a service account with very narrow permissions. The service account you created with the `gcloud` command has no specific permissions, so you can add it only to the `publisher` role for your topic.

1. Go to the [Cloud Pub/Sub page](https://console.cloud.google.com/cloudpubsub/topicList) in the Cloud Console.

1. Select your `demo-topic` topic.

1. Click the "Permissions" button.

1. In the **New Members** field, enter "iot-publisher" and select the service account you
  had created.

1. Choose a role of "Pub/Sub Publisher"

1. Click **Add**.

### Set up and deploy App Engine services

1. Install the default service:

		gcloud preview app deploy --version 1-0-0 appengine/welcome-page/app.yaml 

1. [Add the OAuth2 library](https://cloud.google.com/appengine/docs/python/tools/using-libraries-python-27#installing_a_library), which is needed by a couple of the services.
(Also note this [possible issue](https://github.com/Homebrew/brew/blob/master/share/doc/homebrew/Homebrew-and-Python.md#note-on-pip-install---user) if you have installed Python via Homebrew). This assumes you have [pip already installed](https://pip.pypa.io/en/stable/installing/).

	    mkdir appengine/token-vendor/lib
	    pip install -t appengine/token-vendor/lib google-api-python-client

	    mkdir appengine/phone-to-pubsub/lib
	    pip install -t appengine/phone-to-pubsub/lib google-api-python-client

	**Note the warning and workaround in the above docs if you are using Homebrew Python. You might need to create `~/.pydistutils.cfg` if you are using Homebrew Python, and likely want to remove it after.**

1. Update the indexes on the database:

		gcloud preview datastore create-indexes appengine/datastore-to-api/index.yaml
		
1. Deploy the other App Engine services:

		gcloud preview app deploy --version 1-0-0 \
		  appengine/token-vendor/app.yaml \
		  appengine/phone-to-pubsub/app.yaml \
		  appengine/pubsub-to-datastore/app.yaml \
		  appengine/datastore-to-api/app.yaml \
		  appengine/sensordata-to-ui/app.yaml

	**Note**: If you get an error on deployment, re-issue the `gcloud preview app deploy` command for each service  until you see all 6 services deployed in the [services list in the Cloud Console](https://console.cloud.google.com/appengine/services).

1. In your browser, open https://[YOUR_PROJECT_ID].appspot.com. Replace [YOUR_PROJECT_ID] with your project ID.

1. Follow the steps on the web page to get your Beaglebone online, and note the IP address assigned to the board.

### Set up and deploy BeagleBone Onboard WebServer

**Note**: The onboard server is included in the Beaglebone Community image. These instructions assume a more-bare image.

1. Update the board `config.json` in `onboard-web-server/config.json` to use your `projectId` and the appengine default URL, which should be: `https://${GOOGLE_CLOUD_PROJECT_ID}.appspot.com`

1. Update the IP address in `onboard-web-server/deploy/deploy.sh` with your board IP and execute the script.  

		cd onboard-web-server
		./deploy/deploy.sh

1. SSH to the board. Replace [YOUR_BOARD_IP] with the IP address of your board::

		ssh root@[YOUR_BOARD-IP]
		
1. Install the NPM packages and run the on-board server.

		cd /opt/gcp-iot-demo/demoserver
		npm install
		node index.js
		
		
1. In your browser, open http://[YOUR_BOARD-IP]:3001. Replace [YOUR_BOARD_IP] with the IP address of your board.

### Modifying the code

Now you've got it running on your own Cloud Platform Project. If you want to
make changes, update the appropriate code and redeploy.


