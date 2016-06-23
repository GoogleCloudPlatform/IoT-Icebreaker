#!/usr/bin/env python
#
# Copyright 2016 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import webapp2
import logging
import json
import urllib
import base64
import time
from google.appengine.ext import ndb


# Database model for permanent storage of the sensor data
class SensorData(ndb.Model):
    message_id = ndb.StringProperty(required=True)
    session_id = ndb.StringProperty(required=True)
    received_date = ndb.IntegerProperty(required=True)
    timestamp = ndb.IntegerProperty(required=True)
    payload = ndb.StringProperty(required=True)


# Google Cloud Pub/sub is set up with a push subscription to this URL
# Every message it receives is forwarded to this handler as a POST
# In the body is this format:
# {
#  "message": {
#   "attributes": {
#    "key": "value"
#   },
#   "data": "SGVsbG8gQ2xvdWQgUHViL1N1YiEgSGVyZSBpcyBteSBtZXNzYWdlIQ==",
#   "message_id": "136969346945"
#  }
# }
class StoreHandler(webapp2.RequestHandler):
    def post(self):
        # Parse the message body as JSON
        message = json.loads(urllib.unquote(self.request.body).rstrip('='))
        if 'message' in message and 'data' in message['message']:
            # Decode the actual message
            message_body = base64.b64decode(str(message['message']['data']))
            logging.debug('Received body: %s', message_body)
            try:
                # Body is JSON, extract sessionId from it, if it exists
                payload_json = json.loads(message_body)
                session_id = payload_json.get('sessionId', 'unknown')
                timestamp = payload_json.get('timestamp', None)

                session_expired = self.check_expired_session(session_id)
                if not session_expired:
                    # Stores the sensor data to Google Cloud Datastore
                    SensorData(
                        message_id=message['message']['message_id'],
                        session_id=session_id,
                        received_date=int(time.time() * 1000),
                        timestamp=timestamp,
                        payload=message_body
                    ).put()
                else:
                    logging.warn('Expired session found: session_id[%s]', session_id)
            except ValueError:
                logging.error('Unable to parse as json: %s', message_body)

            # Respond with an empty 204 to acknowledge receipt of the message
            self.response.status = 204
        else:
            logging.warn('No message or message.data found in payload')
            self.response.status = 400

    def check_expired_session(self, session_id):
        try:
            timestamp = int((time.time() - 3600) * 1000)
            sensor_keys = SensorData.query(SensorData.session_id == session_id, SensorData.timestamp < timestamp).fetch(1, keys_only=True)
            return len(sensor_keys) > 0
        except:
            logging.error('Error retrieving data')


class DeleteHandler(webapp2.RequestHandler):
    def post(self, session_id):
        if session_id:
            logging.info('Deleting records for session id [%s]', session_id)
            try:
                sensor_keys = SensorData.query(SensorData.session_id == session_id).fetch(keys_only=True)
                ndb.delete_multi(sensor_keys)
                logging.info('Successfully deleted %s records', len(sensor_keys))

                self.response.status = 204
            except:
                logging.error('Error deleting data')
                self.response.status = 500
        else:
            self.response.write('No session ID provided')
            self.response.status = 400


app = webapp2.WSGIApplication([
    ('/delete/(.*)', DeleteHandler),
    ('/_ah/push-handlers/data_handler', StoreHandler)
], debug=True)
