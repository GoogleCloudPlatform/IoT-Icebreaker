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

var Domain = require('domain');
var jsupm = require('jsupm_grove');

/**
 * Can detect the amount of light in the environment.
 */
function Light(opts) {
  if (!(this instanceof Light)) {
    return new Light(opts);
  }

  this.driver = null;
  this.timer = null;
  this.opts = opts || {};
  this.name = this.opts.name;

  this.PORT = this.opts.port || Light.DEFAULT_PORT;
  this.DELAY = this.opts.delay || Light.DEFAULT_DELAY;
}

/**
 * Maps to AIN 2 using power cape
 * @private
 **/
Light.DEFAULT_PORT = 2;

/**
 * Defaults 1 second to delay the retrieving data loop
 * @private
 */
Light.DEFAULT_DELAY = 1000;

/**
 * Clears any event attached to the driver.
 */
Light.prototype.disable = function() {
  this.driver = null;
  this.timer && clearInterval(this.timer);
  this.timer = null;
};

/**
 * Instatiates the driver, and runs the callback with the output.
 *
 * @param {Function} callback The callback.
 */
Light.prototype.enable = function(callback) {
  var self = this;
  var domain = Domain.create();

  domain.on('error', function(error) {
    console.error(error.message || error);

    if (!self.driver) {
      console.info('Please insert the Light Sensor into the port AIN ' +
        self.PORT + ' of your BeagleBone.');
    }
    self.disable();
    self.enable(callback);
  });

  domain.run(function() {
    if (!self.timer) {
      self.timer = setInterval(function() {
        if (!self.driver) {
          self.driver = new jsupm.GroveLight(self.PORT);
        }

        callback && callback({
          sensor: self.name,
          timestamp: Date.now(),
          /*jshint camelcase: false */
          //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
          lightValue: self.driver.raw_value()
          //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
          /*jshint camelcase: true */
        });
      }, self.DELAY);

      domain.add(self.timer);
    }
  });
};

module.exports = Light;
