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
import os
import base64
import jinja2
import webapp2
import pubsub_utils


JINJA_ENVIRONMENT = jinja2.Environment(
        loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
        extensions=['jinja2.ext.autoescape'],
        autoescape=True)


class SensorHandler(webapp2.RequestHandler):
    def get(self, sessionId):

        if sessionId == "":
            self.response.status = 404
            self.response.write('No session id provided')
        else:
            template_values = {
                'sessionId': sessionId
            }

            template = JINJA_ENVIRONMENT.get_template('mobile-app.html')
            self.response.write(template.render(template_values))


class ApiHandler(webapp2.RequestHandler):
    def post(self):
        message = self.request.body
        client = pubsub_utils.get_client()

        topic_name = pubsub_utils.get_full_topic_name()
        body = {
            'messages': [{
                'data': base64.b64encode(message.encode('utf-8'))
            }]
        }
        client.projects().topics().publish(
                topic=topic_name, body=body).execute()
        self.response.write(body)

app = webapp2.WSGIApplication([
    ('/api/data', ApiHandler),
    ('/(.*)', SensorHandler)
], debug=True)
