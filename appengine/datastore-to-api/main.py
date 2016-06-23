#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
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
from google.appengine.ext import db


# Database model for permanent storage of the sensor data
class SensorData(db.Model):
    message_id = db.StringProperty(required=True)
    session_id = db.StringProperty(required=True)
    received_date = db.IntegerProperty(required=True)
    timestamp = db.IntegerProperty(required=True)
    payload = db.StringProperty(required=True)


# Handles /DEVICE_ID
# API endpoint to fetch all sensordata from a device
# Gets latest 100 entries and serializes to json
class ApiHandler(webapp2.RequestHandler):
    def get(self, sessionId):
        self.response.content_type = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'

        if sessionId:
            query = db.Query(SensorData)
            query.filter('session_id =', sessionId)

            if self.request.get('fromTimestamp'):
                query.filter('timestamp <=', int(self.request.get('fromTimestamp')))
            else:
                logging.info('No timestamp provided, returning all records')

            query.order('timestamp')
            offset = self.request.get('offset')

            messages = []
            if offset:
                messages = query.run(limit=100,
                                     read_policy=db.STRONG_CONSISTENCY,
                                     offset=int(offset))
            else:
                messages = query.run(limit=100,
                                     read_policy=db.STRONG_CONSISTENCY)

            output = []
            for message in messages:
                dictionary = {}
                dictionary['message_id'] = message.message_id
                dictionary['session_id'] = message.session_id
                dictionary['timestamp'] = message.timestamp
                # payload is stored as a string, here we load it into JSON
                dictionary['payload'] = json.loads(message.payload)
                output.append(dictionary)

            self.response.write(json.dumps(output))
        else:
            self.response.write('No session ID provided')

app = webapp2.WSGIApplication([
    ('/(.*)', ApiHandler)
], debug=True)
