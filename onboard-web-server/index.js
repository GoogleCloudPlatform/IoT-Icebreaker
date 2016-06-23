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

var Promise = require('promise');
var assign = require('lodash').assign;

var utils = require('./lib/utils');
var uuid = require('node-uuid');
var sensor = require('./lib/sensor');
var config = require('./config.json');

assign(config, utils.getConfigFile(config.configFile, {
  appengine: config.appengine,
  deviceId: uuid.v4(),
  projectId: config.projectId,
  topicName: config.topicName
}));

var enableDataPublication = false;
var hasInternet = false;
var hasTokenExpired = false;
var pubsub = null;
var sessionId = uuid.v4();
var webserver = null;

/**
 * Sends the sensor data to the client and
 * call to publish pubsub if enabled.
 *
 * @param {object} data contains sensor data
 *
 * @example
 * handleSensorData({ foo: 'bar' });
 */
function handleSensorData(data) {
  webserver.sendEventToClient('sensorData', data);

  if (enableDataPublication) {
    pubsub.publish(data, function() {
      hasTokenExpired = true;
      enableDataPublication = false;
      sensor.resetSensor();
      webserver.sendEventToClient('tokenExpired');
    });
  } else {
    console.info('[Main] Sensor Data: ', JSON.stringify(data, null, 2));
  }
}

/**
 * Starts the demo server.
 */
function startServer() {
  console.log('*** Starting demo for developer prototyping' +
  ' kit for BeagleBone Green ***');

  // Starts the server.
  webserver.start();

  // Checks internet connection on board.
  utils.checkInternetConnection(function(result) {
    webserver.sendEventToClient('hasInternet', result);
    hasInternet = result;
  });
}

/**
 * Error handling for uncaught exceptions
 */
process.on('uncaughtException', function(error) {
  console.error('[Main] exception: ', error);
});

/**
 * Resolves the required urls, and calls to start the server.
 */
utils.resolveUrl(config.appengine.default.url)
.then(function(defaultUrl) {
  // Setting up the webserver.
  webserver = require('./lib/webserver')({
    port: 3001,
    events: {
      generateToken: function() {
        sessionId = uuid.v4();
        pubsub.init(sessionId, function() {
          webserver.sendEventToClient('tokenUpdated');
        });
      },
      selectSensor: function(sensorName) {
        pubsub.clearSession();
        sensor.initSensor(sensorName, handleSensorData);
      },
      setDataPublication: function(value) {
        if (value) {
          console.info('[Main] Sending data to cloud');
        }

        enableDataPublication = value;
      }
    },
    onClientConnect: function() {
      sensor.resetSensor();

      this.sendEventToClient('config', {
        availableSensors: config.groveModules,
        defaultUrl: defaultUrl,
        deviceId: config.deviceId,
        hasTokenExpired: hasTokenExpired,
        sensorDataUrl: utils.prependModuleToUrl(defaultUrl, config.appengine.sensordata.module),
        sessionId: sessionId
      });

      this.sendEventToClient('hasInternet', hasInternet);
    }
  });

  // Setting up the pubsub module.
  pubsub = require('./lib/pubsub')({
    deviceId: config.deviceId,
    projectId: config.projectId,
    pubsubUrl: utils.prependModuleToUrl(defaultUrl, config.appengine.pubsub.module),
    tokenUrl: utils.prependModuleToUrl(defaultUrl, config.appengine.token.module),
    topicName: config.topicName
  });
  pubsub.init(sessionId);

  startServer();
})
.catch(function(error) {
  console.error('[Main] Error resolving required urls', error);
  process.exit(1);
});
