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

var jsupm = require('jsupm_adxl345');
var Domain = require('domain');

/**
 * This is a high resolution digital accelerometer providing you at max 3.9mg/LSB resolution
 * and large ±16g measurement range.
 * It's base on an advanced 3-axis IC ADXL345.
 * It's ideal for motion detection, Gesture detection as well as robotics.
 */
function Accelerometer(opts) {
  if (!(this instanceof Accelerometer)) {
    return new Accelerometer(opts);
  }

  this.driver = null;
  this.timer = null;

  this.opts = opts || {};
  this.name = this.opts.name;

  this.DELAY = this.opts.delay || Accelerometer.DEFAULT_DELAY;
  this.I2C_BUS = this.opts.i2c || Accelerometer.I2C_BUS_DEFAULT;
}

/**
 * Binds to I2C-1 bus
 * @private
 */
Accelerometer.I2C_BUS_DEFAULT = 1;

/**
 * Defaults 1 seconds to delay the retrieving data loop
 * @private
 */
Accelerometer.DEFAULT_DELAY = 1000;

/**
 * Clears any event attached to the driver.
 */
Accelerometer.prototype.disable = function() {
  this.driver = null;
  this.timer && clearInterval(this.timer);
  this.timer = null;
};

/**
 * Instantiates the driver, and runs the callback with the output.
 *
 * @param {Function} callback The callback.
 */
Accelerometer.prototype.enable = function(callback) {
  var self = this;
  var domain = Domain.create();

  domain.on('error', function(error) {
    console.error(error.message || error);

    if (!self.driver) {
      console.info('Please insert the accelerometer into the I2C bus ' +
       self.I2C_BUS + ' of your BeagleBone');
    }
    self.disable();
    self.enable(callback);
  });

  domain.run(function() {
    if (!self.timer) {
      self.timer = setInterval(function() {
        if (!self.driver) {
          self.driver = new jsupm.Adxl345(self.I2C_BUS);
        }

        // Update the data
        self.driver.update();

        // Read acceleration force (g)
        var force = self.driver.getAcceleration();

        callback && callback({
          sensor: self.name,
          timestamp: Date.now(),
          x: +force.getitem(0).toFixed(6),
          y: +force.getitem(1).toFixed(6),
          z: +force.getitem(2).toFixed(6)
        });
      }, self.DELAY);

      domain.add(self.timer);
    }
  });
};

module.exports = Accelerometer;
