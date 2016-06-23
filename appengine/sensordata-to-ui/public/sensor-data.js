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

$(function() {
  var barChart = null;
  var sensor = null;
  var currentTimestamp = new Date().getTime();
  var uiElements = {
    barChart: $('#barChart'),
    sensorName: $('#sensor-name'),
    legend: $('#legend')
  };
  var offset = 0;

  /**
   * Specific sensor handlers to prepare the data to be rendered.
   */
  var sensorHandlers = {
    'accelerometer': {
      getKeys: function(keys) {
        return keys.sort();
      },
      getData: function(data, timestamp) {
        if (typeof data === 'number') {
          return {
            time: timestamp,
            y: data
          };
        }

        return null;
      }
    },
    'default': {
      getKeys: function(keys) {
        return keys;
      },
      getData: function(data, timestamp) {
        if (typeof data === 'number') {
          return {
            time: timestamp,
            y: data
          };
        }

        return null;
      }
    },
    'pir motion sensor': {
      getKeys: function(keys) {
        return keys;
      },
      getData: function(data, timestamp) {
        return {
          time: timestamp,
          y: data ? 1 : 0
        };
      }
    }
  };

  var epochSpecificSettings = {
    'boolean': {
      range: [-1, 2]
    },
    'temperature sensor': {
      range: [-100, 100]
    }
  };
  epochSpecificSettings['button sensor'] = epochSpecificSettings.boolean;
  epochSpecificSettings['light sensor'] = epochSpecificSettings.boolean;
  epochSpecificSettings['pir motion sensor'] = epochSpecificSettings.boolean;

  /**
   * Requests the latest data from sensordata server.
   */
  function getData() {
    var query = '?fromTimestamp=' + Math.round(currentTimestamp) + 
      '&offset=' + offset;

    $.getJSON('https://sensordata-api-dot-' + gae_app_id +
      '.appspot.com/' + sessionId + query, 
      function(messages) {
        if (messages && messages.length) {
          offset += messages.length;
        }

        processData(messages);
      });
  };

  /**
   * Calls to display the chart and maintains
   * the request for data loop.
   */
  function processData(messages) {
    if (messages && messages.length) {        
      barChart ? updateChart(messages) : initChart(messages);
    }

    currentTimestamp = new Date().getTime();
    setTimeout(getData, 1000);
  };

  /**
   * Prepares the initial data to render the chart.
   */
  function initChart(data) {
    $('.loader, .qr-code').fadeOut(function() {
      $('.sensor-data').fadeIn(function() {
        setTimeout(function() {
          $('.extra-info').fadeIn();
        }, 1000);

        var initialData = {};
        var html = '';

        for (var idx = 0; idx < data.length; idx++) {
          var obj = data[idx];
          var objectTimestamp = getTimestamp(obj);
          if (sensor && obj.payload.data.sensor &&
            sensor !== obj.payload.data.sensor) 
          {
            sensor = obj.payload.data.sensor;
            removeChart();
            processData(data.slice(idx));
            return;
          }

          sensor = obj.payload.data.sensor || sensor;
          obj.payload.data = _.omit(obj.payload.data, 'timestamp');
          html += prepareRawData(objectTimestamp, obj.payload.data);

          sensorHandler = getSensorHandler(sensor);
          sensorHandler.getKeys(Object.keys(_.omit(obj.payload.data, 'sensor')))
            .forEach(function(key) {
              if (!initialData[key]) {
                initialData[key] = [];
              }

              var entry = sensorHandler
                .getData(obj.payload.data[key], objectTimestamp);

              if (entry) {
                initialData[key].push(entry);
              }
            });
        };

        renderRawData(html);
        renderChart(data, initialData);
      });
    });
  }

  /**
   * Adds the latest data to the current chart.
   */
  function updateChart(data) {
    var html = '';

    for (var idx = 0; idx < data.length; idx++) {
      var obj = data[idx];

      if (obj.payload.data.sensor && sensor !== obj.payload.data.sensor) {
        sensor = obj.payload.data.sensor;
        removeChart();
        processData(data.slice(idx));
        return;
      }

      var objectTimestamp = getTimestamp(obj);
      obj.payload.data = _.omit(obj.payload.data, 'timestamp');
      html += prepareRawData(objectTimestamp, obj.payload.data);

      var sensorHandler = getSensorHandler(sensor);
      var barData = sensorHandler.getKeys(Object.keys(obj.payload.data))
        .map(function(key) {
          return sensorHandler
            .getData(obj.payload.data[key], objectTimestamp) || null;
        }).filter(function(entry) {
          return entry;
        });

      if (barData && barData.length) {
        barChart.push(barData);
      }
    };

    renderRawData(html);
  }

  /**
   * Removes the chart from the page.
   */
  function removeChart() {
    $('#barChart').fadeOut(function() {
      barChart = null;
      uiElements.barChart.remove();
      uiElements.sensorName.after('<div id="barChart" class="epoch sensordata"' + 
        'style="width: 100%; height: 100%;"></div>');
      uiElements.barChart = $('#barChart');
      uiElements.sensorName.empty();
      uiElements.legend.empty();
    })
  }

  /**
   * Renders the chart into the webpage.
   */
  function renderChart(data, initialData) {
    var sensorHandler = getSensorHandler(sensor);
    var barChartData = sensorHandler.getKeys(
      Object.keys(data[0].payload.data)
    ).map(function(key) {
      if (!initialData[key]) {
        return null;
      }

      return {
        label: key,
        values: initialData[key]
      };
    }).filter(function(entry) {
      return entry;
    });

    barChartData = barChartData.filter(function(element) {
      return element.values && element.values.length;
    });

    var specificSettings = epochSpecificSettings[sensor && sensor.toLowerCase()]
      || {};

    var epochSettings = _.extend({
      type: 'time.line',
      axes: ['right', 'bottom', 'left'],
      data: barChartData
    }, specificSettings);

    barChart = uiElements.barChart.epoch(epochSettings);

    // Chart legend
    var html = '';
    var colors = ['#1f77b4', '#ff7f0e', '#2ca02c'];
    barChartData.forEach(function(element, idx) {
      html += '<span style="color:' + colors[idx] + '">&#8212; ' + element.label + '</span>';
    });

    uiElements.sensorName.text(sensor);
    uiElements.legend.html(html);
  }

  /**
   * Returns an entry timestamp.
   */
  function getTimestamp(data) {
    return data.payload.timestamp || data.payload.data.timestamp || 0;
  }

  /**
   * Returns sensor handler.
   */
   function getSensorHandler(sensor) {
    var handler = sensorHandlers[sensor && sensor.toLowerCase()];
    return handler || sensorHandlers.default;
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

  /**
   *  Returns a HTML element containing the raw data.
   */
  function prepareRawData(timestamp, data) {
    var html = '[' + formatTime(timestamp) + ']: ';
    html += JSON.stringify(_.omit(data, 'sensor'))
    return html += '<br>'
  }

  /**
   * Adds data entries to the raw data section.
   */
  function renderRawData(html) {
    $('.raw-data').prepend(html);
  }

  /**
   * Starts the on going data requests.
   */
  getData();
});
