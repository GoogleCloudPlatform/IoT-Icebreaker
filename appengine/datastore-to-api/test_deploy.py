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


"""Test classes for the pubsub-to-datastore module."""

import unittest
import json
import sys
sys.path.insert(1, 'lib')

import httplib2


GAE_PUBSUB_HOST = "https://pubsub-to-datastore-dot-cloud-iot-dev.appspot.com/"
GAE_SENSORDATA_HOST = "sensordata-api-dot-cloud-iot-dev.appspot.com"


def url_for(path):
    """Returns the URL of the endpoint for the given path."""
    return 'https://%s%s' % (GAE_SENSORDATA_HOST, path)


class IntegrationTestCase(unittest.TestCase):
    """A test case for the sensordata-api module."""

    def setUp(self):
        self.http = httplib2.Http()
        self.insert_data()

    def insert_data(self):
        headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
        data = {"message": {"data": "eyJzZXNzaW9uSWQiOiI1OWE0N2VhNS1jMjAxLTA4MzItZjU2Zi1hM2ZlNGUxNzA0ODciLCJkYXRhIjp7ImV2IjoiZGV2aWNlb3JpZW50YXRpb24iLCJ4IjowLjE5MDEzNDE2NTg0MTU2ODk4LCJ5IjoyMy45MDQxMTQ5MzYzNzg0NTJ9LCJ0aW1lc3RhbXAiOjE0NjI1NTI3MzcyMDl9", "message_id": "34536788863333"}}
        self.http.request(GAE_PUBSUB_HOST, 'POST', body=json.dumps(data), headers=headers)

    def test_get_data(self):
        """Test requesting data to API."""
        (resp, content) = self.http.request(url_for('/59a47ea5-c201-0832-f56f-a3fe4e170487'), 'GET')
        # This ensures that our App Engine service account is working correctly.
        self.assertEquals(200, resp.status)
        assert '59a47ea5-c201-0832-f56f-a3fe4e170487' in content, "Response should contain the session id"


# [START main]
if __name__ == '__main__':
    unittest.main()
# [END main]
