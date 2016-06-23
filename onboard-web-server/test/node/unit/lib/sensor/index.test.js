/*!
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var rootRequire = require('root-require');
var should = require('should');

var Sensor = rootRequire('lib/sensor');

describe('Sensor index', function() {
  it('throws error when can\'t find a contructor for a sensor', function() {
    (function() { Sensor.initSensor('foo'); }).should.throw('[Sensor] Unknown sensor!');
  });

  it('inits a sensor', function() {
    Sensor.initSensor('accelerometer');
    Sensor.currentSensor.should.exist;
    Sensor.currentSensor.name.should.equal('accelerometer');
    Sensor.resetSensor();
  });

  it('resets a sensor', function() {
    Sensor.initSensor('accelerometer');
    Sensor.resetSensor();
    should.not.exist(Sensor.currentSensor);
  });
});
