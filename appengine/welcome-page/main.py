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
import webapp2
import jinja2
from google.appengine.api import app_identity

GAE_APP_ID_ORIGINAL = app_identity.get_application_id()
GAE_APP_ID = GAE_APP_ID_ORIGINAL if GAE_APP_ID_ORIGINAL != "None" else 'cloud-iot-dev'

JINJA_ENVIRONMENT = jinja2.Environment(
        loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
        extensions=['jinja2.ext.autoescape'],
        autoescape=True)


class MainHandler(webapp2.RequestHandler):
    def get(self):
        template = JINJA_ENVIRONMENT.get_template('index.html')
        self.response.write(template.render({
            'gae_app_id': GAE_APP_ID
        }))


class PageHandler(webapp2.RequestHandler):
    def get(self, pageId):
        template = JINJA_ENVIRONMENT.get_template(pageId + '.html')
        self.response.write(template.render({
            'gae_app_id': GAE_APP_ID
        }))

app = webapp2.WSGIApplication([
    ('/', MainHandler),
    ('/([^\.\/]*)', PageHandler)
], debug=True)
