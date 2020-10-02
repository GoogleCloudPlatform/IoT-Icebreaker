# Run the IoT developer kit icebreaker in your own project

This example code shows how to use Google Cloud Platform to process sensor data
and publish it to Cloud PubSub. It is available to test drive at http://cloud.google.com/solutions/iot/ as an icebreaker demonstration for a developer prototyping kit based on the [SeeedStudio BeagleBone Green Wireless](http://www.seeedstudio.com/wiki/Beaglebone_green_wireless). However this is not an official Google product.

## How it works

### Authenticate the BeagleBone using a token vendor

Authentication to Google Cloud Pub/Sub uses an IAM Service Account. This
service account is used to generate time-limited OAuth Access tokens used by
the agent on the IoT device. See the token-vendor readme for more details.


### Send sensor data from BeagleBone to Google Cloud

![BeagleBone to Google Cloud
Pub/sub](onboard-web-server/public/img/bbg-to-pubsub.png)

Using [Node.js](https://nodejs.org/en/) and
[libmraa](https://github.com/intel-iot-devkit/mraa) we'll access the sensors
attached to the BeagleBone. The [googleapi npm
package](https://www.npmjs.com/package/googleapis) is used to publish the
sensor data to Google Cloud Pub/Sub.

This way, different subscribers can subscribe to the sensor data, and process
it however they want.

### Store data

![Google Cloud Pub/sub to Google Cloud
Datastore](appengine/pubsub-to-datastore/pubsub-to-datastore.png)

A Google App Engine service (module) is used to subscribe to the sensor data topic
and store the data in Cloud Datastore.

[View the code running in Google App Engine](appengine/pubsub-to-datastore)

### Retrieve sensor values from storage

![Google Cloud Datastore to API
endpoint](appengine/datastore-to-api/datastore-to-api.png)

To read the sensor data we'll use a separate Google App Engine service (module) that
exposes a RESTful JSON API to the sensordata stored in Google Cloud Datastore.

[View the code](appengine/datastore-to-api)

## Running on your own Google Cloud Project


**NOTE: All of the command lines given below assume you are inside this repositories folder as the working directory.**

### Setup Pub/Sub topic and subscription

* Create a new Google Cloud Project and enable billing enabled.

* [Enable Pub/Sub](https://console.cloud.google.com/apis/library?q=pub)

* If you get a recommendation to create a credential - you can ignore that for
  now, we will be creating a special service account later.
  
* Install [gcloud](https://cloud.google.com/sdk/), or run an update if you
  already have it.
  
  		gcloud components update
		export GOOGLE_CLOUD_PROJECT_ID=<your_project_id>
		gcloud config set project ${GOOGLE_CLOUD_PROJECT_ID}

* [Create a Google Cloud Pub/Sub
  topic](https://console.cloud.google.com/cloudpubsub/topicList) named
  `demo-topic`

		gcloud alpha pubsub topics create projects/${GOOGLE_CLOUD_PROJECT_ID}/topics/demo-topic

Note: you will be prompted to install the alpha component for gcloud

* Add a subscription to this topic named `pubsub-to-datastore`, of type `push`. [The specific push URL is protected on only reached via the pubsub service](https://cloud.google.com/pubsub/prereqs#configure-push-endpoints-subscribers-only).

		gcloud alpha pubsub subscriptions create pubsub-to-datastore \
		--topic "projects/${GOOGLE_CLOUD_PROJECT_ID}/topics/demo-topic" \
		--push-endpoint "https://pubsub-to-datastore-dot-${GOOGLE_CLOUD_PROJECT_ID}.appspot.com/_ah/push-handlers/data_handler"


### Setup service account with limited access

* [Create a service account key and download JSON
  credentials](https://console.cloud.google.com/iam-admin/serviceaccounts/project)

		gcloud iam service-accounts create iot-publisher

* Now create and download a service account key into the token vendor appengine service (module)

		gcloud iam service-accounts keys create \
		appengine/token-vendor/google-cloud-credentials.json \
		--iam-account iot-publisher@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com


* When you create a service account in the web console, it is automatically added to the editor role for your whole project. For this use, we want to use a service account with very narrow permissions. The service account we created with the gcloud command above has no specific permissions, and so we can add it only to the publisher role for our topic.

* Go to the [Pub/Sub page](https://console.cloud.google.com/cloudpubsub/topicList) in the console.

* Select your "demo-topic" topic.

* Click the "Permissions" button

* In the "New Members" type "iot-publisher" and select the service account you
  had created.

* Choose a role of "Pub/Sub Publisher"

* Click "Add"

### Setup and Deploy AppEngine services

* First install the default service 

		gcloud preview app deploy --version 1-0-0 appengine/welcome-page/app.yaml 

* [Add the OAuth2 library](https://cloud.google.com/appengine/docs/python/tools/using-libraries-python-27#installing_a_library) needed by a couple of the services.
(please note this [possible issue](https://github.com/Homebrew/brew/blob/master/share/doc/homebrew/Homebrew-and-Python.md#note-on-pip-install---user) if you have installed Python via Homebrew). This assume you have [pip already installed](https://pip.pypa.io/en/stable/installing/).

	    mkdir appengine/token-vendor/lib
	    pip install -t appengine/token-vendor/lib google-api-python-client

	    mkdir appengine/phone-to-pubsub/lib
	    pip install -t appengine/phone-to-pubsub/lib google-api-python-client

**note the warning and workaround in the above docs if you are using homebrew Python - you may need to create ~/.pydistutils.cfg if you are using Homebrew Python, and likely want to remove it after.**

* Update the indexes on the database

		gcloud preview datastore create-indexes appengine/datastore-to-api/index.yaml
		
* now deploy the other appengine services (modules)

		gcloud preview app deploy --version 1-0-0 \
		  appengine/token-vendor/app.yaml \
		  appengine/phone-to-pubsub/app.yaml \
		  appengine/pubsub-to-datastore/app.yaml \
		  appengine/datastore-to-api/app.yaml \
		  appengine/sensordata-to-ui/app.yaml

**Note: if you get an error on deployment, re-issue the `gcloud preview app deploy` command for each service (module) until you see all 6 services deployed in the [services list in the console](https://console.cloud.google.com/appengine/services)

* Now open `https://${GOOGLE_CLOUD_PROJECT_ID}.appspot.com`

* Follow the steps on that page to get your Beaglebone online, and note the IP address assigned to the board.

### Setup and Deploy BeagleBone Onboard WebServer

Note: the onboard server is included in the Beaglebone Community image - these instructions assume a more bare image.

* Update the board config.json in onboard-web-server/config.json to use your projectId and the appengine default URL which should be: `https://${GOOGLE_CLOUD_PROJECT_ID}.appspot.com`

* Update the ip address in onboard-web-server/deploy/deploy.sh with your board IP and execute the script.  

		cd onboard-web-server
		./deploy/deploy.sh

* ssh to the board

		ssh root@[BOARD-IP]
		
* install the NPM packages and run the on-board server

		cd /opt/gcp-iot-demo/demoserver
		npm install
		node index.js
		
		
* check it out: Now in your browser visit: http://[BOARD-IP]:3001

### Modifying the code

Now you've got it running on your own Google Cloud Project. If you want to
make changes, update the appropriate code and redeploy.


