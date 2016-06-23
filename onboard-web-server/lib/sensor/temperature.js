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
 * The Grove - Temperature Sensor uses a Thermistor to detect the ambient temperature.
 * The resistance of a thermistor will increase when the ambient temperature decreases.
 * It's this characteristic that we use to calculate the ambient temperature.
 * The detectable range of this sensor is -40 - 125ºC, and the accuracy is ±1.5ºC.
 */
function Temperature(opts) {
  if (!(this instanceof Temperature)) {
    return new Temperature(opts);
  }

  this.driver = null;
  this.timer = null;
  this.opts = opts || {};
  this.name = this.opts.name;

  this.PORT = this.opts.port || Temperature.DEFAULT_PORT;
  this.DELAY = this.opts.delay || Temperature.DEFAULT_DELAY;
}

/**
 * Maps to AIN 0 using power cape
 * @private
 **/
Temperature.DEFAULT_PORT = 0;

/**
 * Defaults 1 seconds to delay the retrieving data loop
 * @private
 */
Temperature.DEFAULT_DELAY = 1000;

/**
 * Clears any event attached to the driver.
 */
Temperature.prototype.disable = function() {
  this.driver = null;
  this.timer && clearInterval(this.timer);
  this.timer = null;
};

/**
 * Instatiates the driver, and runs the callback with the output.
 *
 * @param {Function} callback The callback.
 */
Temperature.prototype.enable = function(callback) {
  var self = this;
  var domain = Domain.create();

  domain.on('error', function(error) {
    console.error(error.message || error);

    if (!self.driver) {
      console.info('Please insert the Temperature Sensor into the port AIN ' +
        self.PORT + ' of your BeagleBone.');
    }
    self.disable();
    self.enable(callback);
  });

  domain.run(function() {
    if (!self.timer) {
      self.timer = setInterval(function() {
        if (!self.driver) {
          self.driver = new jsupm.GroveTemp(self.PORT);
        }

        var celsius = self.driver.value();
        if (celsius !== undefined || celsius !== null) {
          callback && callback({
            sensor: self.name,
            timestamp: Date.now(),
            celsius: celsius
          });
        }
      }, self.DELAY);

      domain.add(self.timer);
    }
  });
};

module.exports = Temperature;
