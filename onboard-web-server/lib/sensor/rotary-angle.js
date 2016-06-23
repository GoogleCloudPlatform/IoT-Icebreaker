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
 * Rotary Angle sensor implementation.
 */
function RotaryAngle(opts) {
  if (!(this instanceof RotaryAngle)) {
    return new RotaryAngle(opts);
  }

  this.driver = null;
  this.timer = null;
  this.opts = opts || {};
  this.name = this.opts.name;

  this.PORT = this.opts.port || RotaryAngle.DEFAULT_PORT;
  this.DELAY = this.opts.delay || RotaryAngle.DEFAULT_DELAY;
}

/**
 * Maps to AIN 0 using power cape
 * @private
 **/
RotaryAngle.DEFAULT_PORT = 0;

/**
 * Defaults 1 seconds to delay the retrieving data loop
 * @private
 */
RotaryAngle.DEFAULT_DELAY = 1000;

/**
 * Clears any event attached to the driver.
 */
RotaryAngle.prototype.disable = function() {
  this.driver = null;
  this.timer && clearInterval(this.timer);
  this.timer = null;
};

/**
 * Instatiates the driver, and runs the callback with the output.
 *
 * @param {Function} callback The callback.
 */
RotaryAngle.prototype.enable = function(callback) {
  var self = this;
  var domain = Domain.create();

  domain.on('error', function(error) {
    console.error(error.message || error);

    if (!self.driver) {
      console.info('Please insert the Rotary Angle Sensor into the port AIN ' +
        self.PORT + ' of your BeagleBone.');
    }
    self.disable();
    self.enable(callback);
  });

  domain.run(function() {
    if (!self.timer) {
      self.timer = setInterval(function() {
        if (!self.driver) {
          self.driver = new jsupm.GroveRotary(self.PORT);
        }

        callback && callback({
          sensor: self.name,
          timestamp: Date.now(),
          /*jshint camelcase: false */
          //jscs:disable requireCamelCaseOrUpperCaseIdentifiers
          groveRotary: self.driver.abs_value()
          //jscs:enable requireCamelCaseOrUpperCaseIdentifiers
          /*jshint camelcase: true */
        });
      }, self.DELAY);

      domain.add(self.timer);
    }
  });
};

module.exports = RotaryAngle;
