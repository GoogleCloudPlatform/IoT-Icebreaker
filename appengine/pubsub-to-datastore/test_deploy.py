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

import os
import time
import unittest
import urllib
import json
import sys
sys.path.insert(1, 'lib')

import httplib2


GAE_HOST = "pubsub-to-datastore-dot-cloud-iot-dev.appspot.com"


def url_for(path):
    """Returns the URL of the endpoint for the given path."""
    return 'https://%s%s' % (GAE_HOST, path)


class IntegrationTestCase(unittest.TestCase):
    """A test case for the pubsub-to-datastore module."""

    def setUp(self):
        self.http = httplib2.Http()

    def test_push_success(self):
        """Test processing a new message."""
        headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
        data = {"message": {"data": "eyJzZXNzaW9uSWQiOiI1OWE0N2VhNS1jMjAxLTA4MzItZjU2Zi1hM2ZlNGUxNzA0ODciLCJkYXRhIjp7ImV2IjoiZGV2aWNlb3JpZW50YXRpb24iLCJ4IjowLjE5MDEzNDE2NTg0MTU2ODk4LCJ5IjoyMy45MDQxMTQ5MzYzNzg0NTJ9LCJ0aW1lc3RhbXAiOjE0NjI1NTI3MzcyMDl9","message_id": "34536788863333"}}
        (resp, content) = self.http.request(url_for('/'), 'POST', body=json.dumps(data), headers=headers)
        # This ensures that our App Engine service account is working correctly.
        self.assertEquals(204, resp.status)


# [START main]
if __name__ == '__main__':
    unittest.main()
# [END main]
