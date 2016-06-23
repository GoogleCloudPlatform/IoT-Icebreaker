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
var sinon = require('should-sinon');

var Accelerometer = rootRequire('lib/sensor/accelerometer');

describe('Accelerometer', function() {
  it('inits', function() {
    var accelerometer = Accelerometer({ name: 'bar' });
    accelerometer.name.should.equal('bar');
  });

  it('enables the sensor', function(done) {
    var accelerometer = Accelerometer({ name: 'bar' });
    accelerometer.name.should.equal('bar');
    accelerometer.enable(function(data) {
      should.exist(data);
      data.should.have.properties(['sensor', 'timestamp', 'x', 'y', 'z']);
      accelerometer.disable();
      done();
    });
  });

  it('disables the sensor', function(done) {
    var accelerometer = Accelerometer({ name: 'bar' });
    accelerometer.enable(function(data) {
      accelerometer.disable();
      should.not.exist(accelerometer.driver);
      should.not.exist(accelerometer.timer);
      done();
    });
  });
});
