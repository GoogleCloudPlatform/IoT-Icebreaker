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
var jsupm = require('jsupm_mic');

/**
 * Can detect the sound strength of the environment. The main component of
 * the module is a simple microphone, which is based on the LM358 amplifier
 * and an electret microphone.
 */
function Sound(opts) {
  if (!(this instanceof Sound)) {
    return new Sound(opts);
  }

  this.driver = null;
  this.timer = null;
  this.threshContext = null;
  this.opts = opts || {};
  this.name = this.opts.name;

  this.PORT = this.opts.port || Sound.DEFAULT_PORT;
  this.DELAY = this.opts.delay || Sound.DEFAULT_DELAY;
  this.THRESHOLD = this.opts.threshold || Sound.THRESHOLD;
  this.FREQUENCY = this.opts.frequency || Sound.FREQUENCY;
  this.SAMPLES = this.opts.samples || Sound.SAMPLES;
  this.BUFFER_SIZE = this.opts.bufferSize || Sound.BUFFER_SIZE;
  this.AVERAGE_READING = this.opts.averageReading || Sound.AVERAGE_READING;
  this.RUNNING_AVERAGE = this.opts.runningAverage || Sound.RUNNING_AVERAGE;
  this.AVERAGED_OVER = this.opts.averagedOver || Sound.AVERAGED_OVER;
}

/**
 * Maps to AIN 2 using power cape
 * @private
 **/
Sound.DEFAULT_PORT = 2;

/**
 * Defaults 1 second to delay the retrieving data loop
 * @private
 */
Sound.DEFAULT_DELAY = 1000;

/**
 * Defaults for the sound sensor threshold
 * @private
 */
Sound.THRESHOLD = 30;

/**
 * Default time between each sample in microseconds
 * @private
 */
Sound.FREQUENCY = 2;

/**
 * Default number of samples to sample for this window
 * @private
 */
Sound.SAMPLES = 128;

/**
 * Default size of sound buffer
 * @private
 */
Sound.BUFFER_SIZE = 128;

/**
 * Default //TODO: find documentation
 * @private
 */
Sound.AVERAGE_READING = 0;

/**
 * Default //TODO: find documentation
 * @private
 */
Sound.RUNNING_AVERAGE = 0;

/**
 * Default //TODO: find documentation
 * @private
 */
Sound.AVERAGED_OVER = 1;

/**
 * Clears any event attached to the driver.
 */
Sound.prototype.disable = function() {
  this.driver = null;
  this.timer && clearInterval(this.timer);
  this.timer = null;
  this.threshContext = null;
};

/**
 * Instatiates the driver, and runs the callback with the output.
 *
 * @param {Function} callback The callback.
 */
Sound.prototype.enable = function(callback) {
  var self = this;
  var domain = Domain.create();

  domain.on('error', function(error) {
    console.error(error.message || error);

    if (!self.driver) {
      console.info('Please insert the Sound Sensor into the port AIN ' +
        self.PORT + ' of your BeagleBone.');
    }
    self.disable();
    self.enable(callback);
  });

  domain.run(function() {
    if (!self.timer) {
      self.timer = setInterval(function() {
        if (!self.driver) {
          self.driver = new jsupm.Microphone(self.PORT);
          self.threshContext = new jsupm.thresholdContext();
          self.threshContext.averageReading = self.AVERAGE_READING;
          self.threshContext.runningAverage = self.RUNNING_AVERAGE;
          self.threshContext.averagedOver = self.AVERAGED_OVER;
        }

        var buffer = new jsupm.uint16Array(self.BUFFER_SIZE);
        var length = self.driver.getSampledWindow(self.FREQUENCY, self.SAMPLES, buffer);
        if (length) {
          var threshold = self.driver.findThreshold(self.threshContext, self.THRESHOLD, buffer, length);

          callback && callback({
            sensor: self.name,
            timestamp: Date.now(),
            sound: threshold
          });
        }
      }, self.DELAY);

      domain.add(self.timer);
    }
  });
};

module.exports = Sound;
