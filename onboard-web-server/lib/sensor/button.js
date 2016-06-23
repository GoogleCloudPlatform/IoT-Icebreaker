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
 * The Grove - Button is a momentary push button. It contains one independent "momentary on/off" button.
 * “Momentary” means that the button rebounds on its own after it is released. The button outputs a
 * HIGH signal when pressed, and LOW when released.
 */
function Button(opts) {
  if (!(this instanceof Button)) {
    return new Button(opts);
  }

  this.driver = null;
  this.timer = null;
  this.opts = opts || {};
  this.name = this.opts.name;

  this.PORT = this.opts.port || Button.DEFAULT_PORT;
  this.DELAY = this.opts.delay || Button.DEFAULT_DELAY;
}

/**
 * Maps to GPIO 117 using the cape
 * 46 pins of beagleboard + 25 pins on cape
 * @private
 **/
Button.DEFAULT_PORT = 71;

/**
 * Defaults 1 seconds to delay the retrieving data loop
 * @private
 */
Button.DEFAULT_DELAY = 1000;

/**
 * Clears any event attached to the driver.
 */
Button.prototype.disable = function() {
  this.driver = null;
  this.timer && clearInterval(this.timer);
  this.timer = null;
};

/**
 * Instatiates the driver, and runs the callback with the output.
 *
 * @param {Function} callback The callback.
 */
Button.prototype.enable = function(callback) {
  var self = this;
  var domain = Domain.create();

  domain.on('error', function(error) {
    console.error(error.message || error);

    if (!self.driver) {
      console.info('Please insert the Temperature Sensor into the port GPIO 115 of your BeagleBone.');
    }
    self.disable();
    self.enable(callback);
  });

  domain.run(function() {
    if (!self.timer) {
      self.timer = setInterval(function() {
        if (!self.driver) {
          self.driver = new jsupm.GroveButton(self.PORT);
        }

        var value = self.driver.value();
        if (value !== undefined || value !== null) {
          callback && callback({
            sensor: self.name,
            timestamp: Date.now(),
            button: value
          });
        }
      }, self.DELAY);

      domain.add(self.timer);
    }
  });
};

module.exports = Button;
