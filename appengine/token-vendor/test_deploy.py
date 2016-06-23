#!/usr/bin/env python
# Copyright 2015 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


"""Test classes for the token-vendor module."""

import unittest
import uuid
import sys
sys.path.insert(1, 'google-cloud-sdk/platform/google_appengine')
sys.path.insert(1, 'google-cloud-sdk/platform/google_appengine/lib/yaml/lib')
sys.path.insert(1, 'lib')

import httplib2

GAE_HOST = "token-vendor-dot-cloud-iot-dev.appspot.com"


def url_for(path):
    """Returns the URL of the endpoint for the given path."""
    return 'https://%s%s' % (GAE_HOST, path)


class IntegrationTestCase(unittest.TestCase):
    """A test case for the token-vendor module."""

    def setUp(self):
        self.http = httplib2.Http()

    def test_get_success(self):
        """Test requesting a new token."""
        device_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        url = url_for('/api/token/' + device_id + "?sessionId=" + session_id)
        print "Executing url: ", url
        (resp, content) = self.http.request(url, 'GET')
        # This ensures that our App Engine service account is working correctly.
        self.assertEquals(200, resp.status)
        assert 'access_token' in content, "Response should contain an access_token"

# [START main]
if __name__ == '__main__':
    unittest.main()
# [END main]
