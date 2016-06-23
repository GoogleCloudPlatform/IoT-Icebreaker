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
 
var ip;

$(function(){
  var found = function(url) {
    console.log('Found BeagleBone at', ip);
    $("#link-to-beaglebone")
      .attr('href','http://' + ip + ":3001")
      .text('Continue on the BeagleBone')
      .show();
    $('#ipaddress').attr('disabled','disabled');
    $('.waiting').hide();
  }

  var loadImage = function(url, success, failure) {
      var timer;
      function clearTimer() {
          if (timer) {
              clearTimeout(timer);
              timer = null;
          }
      }

      function handleFail() {
          // kill previous error handlers
          this.onload = this.onabort = this.onerror = function() {};
          // stop existing timer
          clearTimer();
          // switch to alternate url
          if (this.src === url) {
              this.src = '';
          }
          failure();
      }

      var img = new Image();
      img.onerror = img.onabort = handleFail;
      img.onload = function() {
        clearTimer();
        success();
      };
      img.src = url;
      timer = setTimeout(function(theImg) {
          return function() {
              handleFail.call(theImg);
          };
      }(img), 1000);
      return(img);
  }

  var pingBeagleBone = function() {
    ip = $('#ipaddress').val();

    //10.42.39.184
    if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip))
    {
      console.log('invalid ipaddress', ip);
      setTimeout(pingBeagleBone, 1000);
      return;
    }
    var src = 'http://' + ip + ':3001/img/bbg.png';
    // var src = "http://cdn.sstatic.net/stackoverflow/img/sprites.svg";

    loadImage(src, function() {
      found(ip);
    }, function() {
      console.log('BeagleBone not found at', ip, status);
      setTimeout(pingBeagleBone, 1000);
    });
  }

  pingBeagleBone();
});
