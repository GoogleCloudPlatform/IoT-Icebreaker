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
import time
from oauth2client import service_account


def get_access_token():
    # Note: every use of the standard GoogleCredential type yielded the GAE
    # service account token, no matter what environ was set
    credentials = service_account.ServiceAccountCredentials.from_json_keyfile_name('google-cloud-credentials.json')

    credentials = credentials.create_scoped('https://www.googleapis.com/auth/pubsub')

    # note - rapid requests to this will return the same access token within
    # the same 1-second-resolution of expiration date
    # as the backend either has a cache, or timing dependent algo
    # this does not effect the security model
    credentials.access_token = None
    token_string = credentials.get_access_token().access_token
    if not credentials.token_expiry:
        expiration = 0
    else:
        expiration = time.mktime(credentials.token_expiry.timetuple())
    return {"access_token": token_string, "expiration": expiration * 1000}
