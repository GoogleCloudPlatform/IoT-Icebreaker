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
import logging
import json
import webapp2
from token_utils import get_access_token
from datastore_utils import check_expired_session


class ApiHandler(webapp2.RequestHandler):
    def get(self, device_id):
        self.response.content_type = 'application/json'
        self.response.headers['Access-Control-Allow-Origin'] = '*'

        session_id = self.request.get('sessionId')
        if device_id and session_id:
            is_session_expired = check_expired_session(session_id)
            if not is_session_expired:
                output = get_access_token()
                logging.debug('Generated Token: %s device: %s' % (
                    output['access_token'], device_id))
                self.response.write(json.dumps(output))
            else:
                self.response.status = 400
                self.response.write('Session expired.')
        else:
            self.response.status = 400
            self.response.write('Missing parameter device or session ID')


app = webapp2.WSGIApplication([
    ('/api/token/(.*)', ApiHandler),
], debug=True)
