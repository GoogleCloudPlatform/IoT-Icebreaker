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
import time
import logging
import json
import datetime
import time
from google.appengine.ext import ndb

# Database model for permanent storage of the sensor data
class SensorData(ndb.Model):
    message_id = ndb.StringProperty(required=True)
    session_id = ndb.StringProperty(required=True)
    received_date = ndb.IntegerProperty(required=True)
    timestamp = ndb.IntegerProperty(required=True)
    payload = ndb.StringProperty(required=True)

def check_expired_session(session_id):
    record_keys = SensorData.query(SensorData.session_id == session_id).fetch(1, keys_only=True)
    return len(record_keys) > 0
