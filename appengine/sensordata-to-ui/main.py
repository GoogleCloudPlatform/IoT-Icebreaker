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


import os
import webapp2
import logging
import json
import urllib
import datetime
import time
import jinja2
from google.appengine.api import urlfetch
from google.appengine.api import app_identity

GAE_APP_ID_ORIGINAL = app_identity.get_application_id()
GAE_APP_ID = GAE_APP_ID_ORIGINAL if GAE_APP_ID_ORIGINAL != "None" else 'cloud-iot-dev'
JINJA_ENVIRONMENT = jinja2.Environment(
        loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
        extensions=['jinja2.ext.autoescape'],
        autoescape=True)

class SensorHandler(webapp2.RequestHandler):
    def get(self, sessionId):
        mobile = self.request.get("mobile")
        if sessionId:
            long_url = "http://mobile-dot-" + GAE_APP_ID + ".appspot.com/" + sessionId
            response = urlfetch.fetch(url='https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyB-ErvSsS8MhI7crW7-OkPUFh9hIDnqvLg',
                    payload='{"longUrl": "' + long_url + '"}',
                    method=urlfetch.POST,
                    headers={'Content-Type': 'application/json'})
            url = json.loads(response.content)['id']
            template_values = {
                'sessionId': sessionId,
                'url': url,
                'qrUrl': "https://chart.googleapis.com/chart?cht=qr&chs=150x150&chl=" + urllib.quote_plus(url),
                'mobile': mobile == "1",
                'gae_app_id': GAE_APP_ID
            }

            template = JINJA_ENVIRONMENT.get_template('index.html')
            self.response.write(template.render(template_values))
        else:
            self.response.write('No sensor ID provided')

app = webapp2.WSGIApplication([
    ('/(.*)', SensorHandler)
], debug=True)
