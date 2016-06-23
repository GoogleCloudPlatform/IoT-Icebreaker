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

screen.lockOrientationUniversal = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;
if (screen.lockOrientationUniversal) {
  screen.lockOrientationUniversal('portrait');
}

$(function(){
  var isShowingGraph = false;
  var dialValue = 0;
  var uiElements = {
    barX: $('.bar.x'),
    dial: $('.dial'),
    dialContainer: $('.dial-container'),
    graph: $('.graph'),
    graphError: $('.graph-error')
  };

  var showGraph = function() {
    if (isShowingGraph) return;

    uiElements.graphError.hide();
    uiElements.graph.show();
    uiElements.dialContainer.show();
    uiElements.dial.knob({
      angleArc: 180,
      angleOffset: -90,
      change: function (value) {
        dialValue = value;

        updateGraph({
          dial: value
        });
      },
      format: function () {
        return 'dial';
      },
      lineCap: 'round',
      min: 0,
      max: 100
    });

    isShowingGraph = true;
  };

  uiElements.graph.hide();
  uiElements.dialContainer.hide();

  var readMotionData = function(callback) {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', function() {
        if (!event.beta) return;
        showGraph();
        callback({
          ev: 'deviceorientation',
          x: event.beta
        });
      }, true);
    } else if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', function() {
        if (!event.acceleration.x) return;
        showGraph();
        callback({
          ev: 'devicemotion',
          x: event.acceleration.x * 2
        });
      }, true);
    }
  };

  var sendData = function(data) {
    if (dialValue !== null) {
      data.dial = dialValue;

      var payload = {
        sessionId: sessionId,
        data: data,
        timestamp: new Date().getTime()
      };

      $.post('/api/data', JSON.stringify(payload), function() {}, 'json');
    }
  };

  var updateGraph = function(data) {
    if (data.x) {
      var correctedX = (Math.max(0, Math.min(data.x, 90)) * 100) / 90;
      uiElements.barX.height((100 - correctedX) + '%');
    }
  };

  var sendDataThrottled = _.throttle(sendData, 1000);

  readMotionData(function(data) {
    updateGraph(data);
    sendDataThrottled(data);
  });
});
