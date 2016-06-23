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
var fs = require('fs');

var utils = rootRequire('lib/utils');

describe('Utils', function() {
  it('resolves a short url', function(done) {
    utils.resolveUrl('http://goo.gl/a2Om4f')
    .then(function(longUrl) {
      longUrl.should.equal('http://cloud-iot-dev.appspot.com/');
      done();
    });
  });

  it('reads config file', function() {
    var configFile = '/tmp/config.test.json';
    var defaultConfig = {
      appengine: 'bar',
      deviceId: 'deviceId'
    };
    var config = utils.getConfigFile(configFile, defaultConfig);

    config.should.have.property('deviceId');
    config.appengine.should.equal('bar');
    fs.unlinkSync(configFile);
  });

  it('checks internet connection', function(done) {
    utils.checkInternetConnection(function(hasInternet) {
      (typeof hasInternet).should.equal('boolean');
      done();
    });
  });
});
