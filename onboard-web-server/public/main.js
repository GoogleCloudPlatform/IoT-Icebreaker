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

var LOG_MAX_LENGTH = 10000;

/**
 * Caches the common ui elements used.
 */
var uiElements = {
  cloudToggle: document.querySelector('label[for=enable-cloud]'),
  connectSensor: document.getElementById('connect-your-sensor'),
  dialog: document.querySelector('dialog'),
  firstStep: document.getElementById('step-1-complete'),
  makeRoundtrip: document.getElementById('make-roundtrip'),
  sensorDataToggle: document.querySelector('label[for=toggle-sensor-data]'),
  sensorLog: document.getElementById('sensor-log')
};
var hasTokenExpired = false;
var deviceId = null;

/**
 * Connects back to server.
 */
var socket = io();

/**
 * Vue Configuration
 */
var vue = new Vue({
  el: '#app',
  data: {
    activeStep: 1,
    availableSensors: [],
    defaultUrl: null,
    deviceId: null,
    enableDataPublication: false,
    hasData: false,
    hasInternet: false,
    selectedSensor: null,
    sensorDataUrl: null,
    sessionId: null,
    showSensorOutput: false,
    userHasVerifiedSensor: false
  },
  methods: {
    nextStep: function() {
      this.activeStep++;
      ga('send', 'event', 'Sensor', 'looking good', this.selectedSensor.name, deviceId);
      setTimeout(function() {
        uiElements.firstStep.scrollIntoView();
      }, 100);
    },
    toggleDataPublication: function() {
      if (hasTokenExpired) {
        showDemoExpiredDialog();
        this.enableDataPublication = false;
        uiElements.makeRoundtrip.style.visibility = 'hidden';
      } else {
        ga('send', 'event', 'Sensor', 'data publish', this.selectedSensor.name, deviceId);
        this.enableDataPublication = !this.enableDataPublication;
        socket.emit('setDataPublication', this.enableDataPublication);
        setTimeout(function() {
          uiElements.makeRoundtrip.scrollIntoView();
        });
      }
    },
    toggleSensorOutput: function() {
      ga('send', 'event', 'Sensor', 'toggle', this.selectedSensor.name, !this.showSensorOutput, deviceId);
      this.showSensorOutput = !this.showSensorOutput;
      if (this.toggleSensorOutput) {
        uiElements.sensorLog.innerText = 'Waiting for data. Please connect your sensor..';
      }

      this.userHasVerifiedSensor = this.showSensorOutput;
    },
    selectSensor: function(sensor) {
      ga('send', 'event', 'Sensor', 'select', sensor.name, deviceId);
      this.selectedSensor = sensor;
      this.hasData = false;
      this.showSensorOutput = false;
      this.activeStep = 2;

      socket.emit('selectSensor', this.selectedSensor.name);
      setTimeout(function() {
        uiElements.connectSensor.scrollIntoView();
      },100);
    },
    openDataLink: function(url) {
      ga('send', 'event', 'Sensor', 'data link', this.selectedSensor.name, url, deviceId);
    }
  }
});

/**
 * Watch the onChange action of the show sensor output toggle.
 */
vue.$watch('showSensorOutput', function(newVal) {
  uiElements.sensorDataToggle.classList.toggle('is-checked', newVal);
});

/**
 * Watch the onChange action the send data to cloud toggle.
 */
vue.$watch('enableDataPublication', function(newVal) {
  uiElements.cloudToggle.classList.toggle('is-checked', hasTokenExpired ? false : newVal);
});

/**
 * Receives from server the required properties to 
 * configure the client.
 */
socket.on('config', function(config) {
  vue.activeStep = 1;
  vue.defaultUrl = config.defaultUrl;
  vue.enableDataPublication = false;
  vue.hasData = false;
  vue.hasInternet = false;
  vue.selectedSensor = null;
  vue.showSensorOutput = false;
  vue.sessionId = config.sessionId;
  vue.sensorDataUrl = config.sensorDataUrl + vue.sessionId;
  vue.userHasVerifiedSensor = false;

  deviceId = config.deviceId;
  hasTokenExpired = config.hasTokenExpired;

  // Updating model object
  while (vue.availableSensors.length) { 
    vue.availableSensors.pop();
  }

  config.availableSensors.forEach(function(sensor) {
    vue.availableSensors.push(sensor);
  });
});

/**
 * Receives from server the value of checking the internet
 * connection of the board.
 */
socket.on('hasInternet', function(hasInternet) {
  vue.hasInternet = hasInternet;
});

/**
 * Receives from server the sensor data,
 * and adds it to sensor log box on the page.
 */
socket.on('sensorData', function(data) {
  if (!vue.selectedSensor || !vue.showSensorOutput) {
    return;
  }

  vue.hasData = true;

  var sensorLog = uiElements.sensorLog;
  var logText = '[' + formatTime(data.timestamp) + '] ' + 
    JSON.stringify(_.omit(data, ['timestamp', 'sensor']))
      .replace(/[{}"]/g, '')
      .replace(/:/g, ': ')
      .replace(/,/g, '  ') + '\n';
  var newValue = sensorLog.innerText + logText;

  sensorLog.innerText = newValue.substr(newValue.length - LOG_MAX_LENGTH);
  sensorLog.scrollTop = sensorLog.scrollHeight;
});

/**
 * Receives from server the order to stop the demo.
 */
socket.on('tokenExpired', function() {
  hasTokenExpired = true;
  showDemoExpiredDialog();
  uiElements.makeRoundtrip.style.display = 'none';
});

/**
 * Receives from server the permission to continue
 * the demo, with a new token.
 */
socket.on('tokenUpdated', function() {
  hasTokenExpired = false;
  uiElements.dialog.close();
  window.location.reload();
});

/**
 * Displays the expired token dialog.
 */
function showDemoExpiredDialog() {
  var dialog = uiElements.dialog;

  if (!dialog.showModal) {
    dialogPolyfill.registerDialog(dialog);
  }

  dialog.showModal();

  if (!uiElements.dialogClose) {
    uiElements.dialogClose = uiElements.dialog.querySelector('.close');
  }

  if (!uiElements.dialogGenerate) {
    uiElements.dialogGenerate = uiElements.dialog.querySelector('.generate');
  }

  if (!uiElements.spinner) {
    uiElements.spinner = uiElements.dialog.querySelector('.mdl-spinner');
  }

  uiElements.dialogClose.addEventListener('click', function() {
    dialog.close();
    window.location.reload();
  });

  uiElements.dialogGenerate.addEventListener('click', function() {
    uiElements.dialogClose.style.display = 'none';
    this.style.display = 'none';
    uiElements.spinner.classList.add('is-active', 'show');
    socket.emit('generateToken');
  });
}

/**
 * Formats a timestamp into [HH:mm:ss]
 */
function formatTime(millis) {
  millis /= 1000;
  var hours   = Math.floor(millis / 3600);
  var minutes = Math.floor((millis - (hours * 3600)) / 60);
  var seconds = Math.floor(millis - (hours * 3600) - (minutes * 60));

  hours %= 24;

  if (hours   < 10) {hours   = '0' + hours;}
  if (minutes < 10) {minutes = '0' + minutes;}
  if (seconds < 10) {seconds = '0' + seconds;}
  var time    = hours + ':' + minutes + ':' + seconds;

  return time;
}
