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
var jsupm = require('jsupm_biss0001');

/**
 * This sensor allows you to sense motion, usually human movement in its range.
 * When anyone moves in its detecting range,
 * the sensor will output HIGH on its SIG pin.
 */
function PIRMotion(opts) {
  if (!(this instanceof PIRMotion)) {
    return new PIRMotion(opts);
  }

  this.driver = null;
  this.timer = null;
  this.opts = opts || {};
  this.name = this.opts.name;

  this.PORT = this.opts.port || PIRMotion.DEFAULT_PORT;
  this.DELAY = this.opts.delay || PIRMotion.DEFAULT_DELAY;
}

/**
 * Maps to GPIO 115 using power cape
 * 46 pins of beagleboard + 27 pins on cape
 * @private
 **/
PIRMotion.DEFAULT_PORT = 73;

/**
 * Defaults 2 seconds to delay the retrieving data loop
 * @private
 */
PIRMotion.DEFAULT_DELAY = 1000;

/**
 * Clears any event attached to the driver.
 */
PIRMotion.prototype.disable = function() {
  this.driver = null;
  this.timer && clearInterval(this.timer);
  this.timer = null;
};

/**
 * Instatiates the driver, and runs the callback with the output.
 *
 * @param {Function} callback The callback.
 */
PIRMotion.prototype.enable = function(callback) {
  var self = this;
  var domain = Domain.create();

  domain.on('error', function(error) {
    console.error(error.message || error);

    if (!self.driver) {
      console.info('Please insert the PIR Motion Sensor into the port ' +
        self.PORT + ' of your BeagleBone.');
    }
    self.disable();
    self.enable(callback);
  });

  domain.run(function() {
    if (!self.timer) {
      self.timer = setInterval(function() {
        if (!self.driver) {
          self.driver = new jsupm.BISS0001(self.PORT);
        }

        callback && callback({
          sensor: self.name,
          timestamp: Date.now(),
          motion: self.driver.value()
        });
      }, self.DELAY);

      domain.add(self.timer);
    }
  });
};

module.exports = PIRMotion;
