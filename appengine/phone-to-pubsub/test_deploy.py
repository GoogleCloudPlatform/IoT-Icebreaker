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


"""Test classes for the mobile module."""

import os
import time
import unittest
import urllib
import json
import sys
sys.path.insert(1, 'lib')

import httplib2


GAE_HOST = "mobile-dot-cloud-iot-dev.appspot.com"


def url_for(path):
    """Returns the URL of the endpoint for the given path."""
    return 'https://%s%s' % (GAE_HOST, path)


class IntegrationTestCase(unittest.TestCase):
    """A test case for the mobile module."""

    def setUp(self):
        self.http = httplib2.Http()

    def test_push_success(self):
        """Test processing a new message."""
        headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
        data = {"sessionId":"69a47ea5-c201-0832-f56f-a3fe4e170487","data":{"ev":"deviceorientation","x":0.19013416584156898,"y":23.904114936378452},"timestamp":1462552737209}
        (resp, content) = self.http.request(url_for('/api/data'), 'POST', body=json.dumps(data), headers=headers)
        # This ensures that our App Engine service account is working correctly.
        self.assertEquals(200, resp.status)


# [START main]
if __name__ == '__main__':
    unittest.main()
# [END main]
