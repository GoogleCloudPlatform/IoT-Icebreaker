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

/*!
 * @module sensor
 */

'use strict';

/**
 * @type {module:sensor/accelerometer}
 * @private
 */
var Accelerometer = require('./accelerometer');

/**
 * @type {module:sensor/temperature}
 * @private
 */
var Temperature = require('./temperature');

/**
 * @type {module:sensor/pir-motion}
 * @private
 */
var PIRMotion = require('./pir-motion');

/**
 * @type {module:sensor/button}
 * @private
 */
var Button = require('./button');

/**
 * @type {module:sensor/light}
 * @private
 */
var Light = require('./light');

/**
 * @type {module:sensor/light}
 * @private
 */
var RotaryAngle = require('./rotary-angle');

/**
 * A Sensor object allows you to interact with the Grove Sensors.
 *
 * @example
 *
 * var sensor = require('sensor');
 *
 * sensor.initSensor('accelerometer', function(data) {
 *   console.log(data);
 * });
 */
function Sensor() {
  if (!(this instanceof Sensor)) {
    return new Sensor();
  }

  this.currentSensor = null;
}

/**
 * Contains the sensor drivers.
 * @static
 */
Sensor.constructors = {
  'accelerometer': Accelerometer,
  'temperature sensor': Temperature,
  'pir motion sensor': PIRMotion,
  'light sensor': Light,
  'button sensor': Button,
  'rotary angle sensor': RotaryAngle
};

/**
 * Instantiates the selected sensor.
 */
Sensor.prototype.initSensor = function(sensorName, callback) {
  this.resetSensor();

  /**
   * Determine how to instantiate the driver
   * for this particular sensor.
   */
  var constructor = Sensor.constructors[sensorName.toLowerCase()] || null;

  if (!constructor) {
    throw new Error('[Sensor] Unknown sensor!');
  }

  this.currentSensor = constructor({
    name: sensorName
  });

  if (this.currentSensor.enable) {
    this.currentSensor.enable(callback);
  } else {
    throw new Error('[Sensor] Couldn\'t find sensor initializer.');
  }
};

/**
 * Clears the current module.
 */
Sensor.prototype.resetSensor = function() {
  if (this.currentSensor) {
    this.currentSensor.disable && this.currentSensor.disable();
    console.info('[Sensor] ' + this.currentSensor.name + ' disabled');
  }

  this.currentSensor = null;
};

module.exports = Sensor();
