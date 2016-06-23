/*!
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var google = require('googleapis');
var request = require('request-json');

/**
 * Simple pubsub wrapper this module is in charge of:
 * - publish sensor data to PubSub
 * - subscribe to the topic to retrieve the sensor data
 */
function PubSub(opts) {
  if (!(this instanceof PubSub)) {
    return new PubSub(opts);
  }

  this.opts = opts || {};
  this.deviceId = this.opts.deviceId;
  this.projectId = this.opts.projectId;
  this.pubsubUrl = this.opts.pubsubUrl;
  this.tokenUrl = this.opts.tokenUrl;
  this.topicName = this.opts.topicName;
  this.clientToken = request.createClient(this.tokenUrl);
  this.clientPubsub = request.createClient(this.pubsubUrl);

  this.pubsub = null;
  this.sessionId = null;
}

/**
 * Authenticates the device with Google Cloud Pub/Sub.
 *
 * @param {string} sessionId GUID attached to the devide.
 * @param {Function} callback The callback.
 *
 * @example
 * pubsub.init();
 */
PubSub.prototype.init = function(sessionId, callback) {
  var self = this;

  this.sessionId = sessionId;
  this.clientToken.get(this.tokenUrl + '/api/token/' + this.deviceId + '?sessionId=' + this.sessionId,
    function(err, response, body) {
      if (err) {
        console.error('[PubSub] Error getting a Pub/Sub auth token', err);
        process.exit(1);
        return;
      }

      var OAuth2 = google.auth.OAuth2;
      var authClient = new OAuth2('', '', '');
      authClient.setCredentials(body);
      self.pubsub = google.pubsub({ version: 'v1', auth: authClient });
      console.log('[PubSub] Authenticated Google Cloud Pub/Sub');
      callback && callback();
    }
  );
};

/**
 * Adds a message to the queue to be processed by the worker.
 *
 * @param {object} data The message to send to the queue.
 *
 * @example
 * pubsub.publish({ id: 1, value: 'object' });
 */
PubSub.prototype.publish = function(data, callback) {
  var self = this;

  if (!this.pubsub) {
    this.init(this.sessionId, function() {
      this.publish(data);
    });

    return;
  }

  var msg = {
    data: data,
    sessionId: this.sessionId,
    timestamp: Date.now()
  };

  this.pubsub.projects.topics.publish({
    topic: 'projects/' + this.projectId + '/topics/' + this.topicName,
    resource: {
      messages: [{
        data: new Buffer(JSON.stringify(msg)).toString('base64')
      }]
    }
  }, function(error) {
    if (error) {
      console.error('[PubSub] Error occurred while queuing background task', error);
      callback();
    }
  });
};

/**
 * Clears the data from datastore bind to the sessionId.
 *
 * @example
 * pubsub.clearSession();
 */
PubSub.prototype.clearSession = function() {
  this.clientPubsub.post(this.pubsubUrl + 'delete/' + this.sessionId, {},
    function(err, res, body) {
      if (err) {
        console.error('[PubSub] Error clearing session', err);
      }
    }
  );
};

module.exports = PubSub;
