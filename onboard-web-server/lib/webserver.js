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

var each = require('lodash').each;
var express = require('express');
var app = express();

function Webserver(opts) {
  if (!(this instanceof Webserver)) {
    return new Webserver(opts);
  }

  this.events = {};
  this.onClientConnect = null;
  this.port = null;
  this.webSocket = null;

  this.opts = opts || {};
  this.init_();
}

/**
 * File descriptor to use systemd
 * @static
 * @private
 */
Webserver.SD_LISTEN_FDS_START = 3;

/**
 * Validates the require options to start the server.
 *
 * @private
 *
 * @example
 * webserver.start({
 *  port: 3001
 * });
 */
Webserver.prototype.init_ = function() {
  if (!this.opts.port) {
    throw new Error('[Webserver] opts.port is missing');
  }
  this.port = this.opts.port;

  if (typeof this.opts.onClientConnect !== 'function') {
    throw new Error('[Webserver] opts.onClientConnectHandler is missing');
  }
  this.onClientConnect = this.opts.onClientConnect;

  if (!this.opts.events) {
    throw new Error('[Webserver] opts.events is missing');
  }
  this.events = this.opts.events;
};

/**
 * Prepare for a websocket connection initiated by the client.
 *
 * @example
 * webserver.start();
 */
Webserver.prototype.start = function() {
  var self = this;
  var listener = this.port;

  if (process.env.NODE_ENV === 'production' && process.env.LISTEN_FDS) {
    listener = {
      fd: Webserver.SD_LISTEN_FDS_START
    };
  }

  // Start the server
  app.use(express.static(__dirname + '/../public'));
  this.server = app.listen(listener, function() {
    var host = self.server.address().address;
    var port = self.server.address().port;

    console.log('[Webserver] App listening at http://%s:%s', host, port);
  }).on('error', function(error) {
    console.error('[Webserver] Error creating server', error);
    process.exit(1);
  });

  this.io = require('socket.io')(this.server);
  this.io.on('connection', function(socket) {
    self.webSocket = socket;
    self.onClientConnect();

    // setup socket event handlers
    each(self.events, function(handler, eventName) {
      self.webSocket.on(eventName, handler);
    });
  });

  this.io.on('error', function(error) {
    console.error(error);
  });
};

/**
 * Sends events through the web socket to client.
 *
 * @example
 * webserver.sendEventToClient('sensorData', {});
 */
Webserver.prototype.sendEventToClient = function(eventName, data) {
  if (this.webSocket) {
    this.webSocket.emit(eventName, data);
  }
};

module.exports = Webserver;
