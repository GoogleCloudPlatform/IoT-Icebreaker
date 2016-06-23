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

var dns = require('dns');
var jsonfile = require('jsonfile');
var Promise = require('promise');
var request = require('request');

var utils = {

  /**
   * Check if the board has internet connection.
   *
   * @example
   * utils.checkInternetConnection(function() {});
   */
  checkInternetConnection: checkInternetConnection_,

  /**
   * Read/Create a file with project settings.
   *
   * @return {object} config properties.
   *
   * @example
   * utils.getConfigFile('/etc/configFile.json', {});
   */
  getConfigFile: function(configFilePath, defaultConfig) {
    console.log('[Utils] Reading config from ' + configFilePath);
    var config = null;

    try {
      config = jsonfile.readFileSync(configFilePath);
    } catch (exception) {
      if (exception instanceof SyntaxError) {
        console.log('Unable to parse config file ' + configFilePath);
        console.error(exception);
        process.exit(1);
      }

      console.log('[Utils] Config file doesn\'t exist, creating new one.');
      jsonfile.writeFileSync(configFilePath, defaultConfig || {});
    }

    return config;
  },

  /**
   * Prepends a GAE module name to the default url.
   *
   * @param {string} defaultUrl default url
   * @param {string} moduleName GAE module name
   * @return {string} an url.
   *
   * @example
   * utils.prependModuleToUrl('https://cloud-iot-demo.appspot.com', 'sensordata-');
   * https://sensordata-cloud-iot-demo.appspot.com
   */
  prependModuleToUrl: function(defaultUrl, moduleName) {
    if (defaultUrl && moduleName && defaultUrl.indexOf('http') > -1) {
      var protocol = defaultUrl.indexOf('https://') > -1 ? 'https://' : 'http://';
      return defaultUrl.replace(protocol, protocol + moduleName);
    }

    return defaultUrl;
  },

  /**
   * Resolves a target url.
   *
   * @param {string} shortUrl short form of url
   * @return {Promise} a promise.
   *
   * @example
   * utils.resolveUrl('https://goo.gl/sgtey6');
   * https://google.com/
   */
  resolveUrl: function(shortUrl) {
    return new Promise(function(resolve, reject) {
      request({
        method: 'HEAD',
        url: shortUrl,
        followAllRedirects: true
      },
      function(error, response) {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(response.request.href);
        }
      });
    });
  }
};

/**
 * Check if the board has internet connection.
 *
 * @example
 * utils.checkInternetConnection(function() {});
 */
function checkInternetConnection_(callback) {
  dns.lookup('8.8.8.8', 4, function(error) {
    var hasInternet = false;

    if (error) {
      console.log(error);
      setTimeout(checkInternetConnection_, 1000, callback);
    } else {
      hasInternet = true;
    }

    callback(hasInternet);
  });
}

module.exports = utils;
