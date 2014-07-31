/**
 *  Copyright 2014 Nest Labs Inc. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
/* globals $, Firebase, Notification */
'use strict';

var nestToken     = $.cookie('nest_token'),
    smokeCOAlarms = [];

if (nestToken) { // Simple check for token

  // Create a reference to the API using the provided token
  var dataRef = new Firebase('wss://developer-api.nest.com');
  dataRef.auth(nestToken);

  // in a production client we would want to
  // handle auth errors here.

  // Request on launch since an event may not happen for a while
  Notification.requestPermission();
} else {
  // No auth token, go get one
  window.location.replace('/auth/nest');
}


/**
  Send out a notification and also log
  to the UI.

*/
function notify(title, options) {
  var notification = $('<li>');
  notification.css({color: options.color});
  notification.append(title, ': ', options.body);
  $('#log').append(notification);
  Notification.requestPermission(function() {
    var notification = new Notification(title, options);
  });
}



/**
  Listen for CO alarms and alert the user
  as appropriate

*/
function listenForSmokeAlarms(alarm) {
  var alarmState;

  alarm.child('smoke_alarm_state').ref().on('value', function (state) {

    switch (state.val()) {
    case 'warning':
      if (alarmState !== 'warning') { // only alert the first change
        notify('Heads Up', {
          tag: alarm.child('device_id').val() + 'smoke_alarm_state',
          body: 'Smoke has been detected by ' + alarm.child('name_long').val(),
          color: alarm.child('ui_color_state').val()
        });
      }
      break;
    case 'emergency':
      if (alarmState !== 'emergency') { // only alert the first change
        notify('Emergency', {
          tag: alarm.child('device_id').val() + 'smoke_alarm_state',
          body: 'Smoke has been detected by ' + alarm.child('name_long').val(),
          color: alarm.child('ui_color_state').val()
        });
      }
      break;
    }

    alarmState = state.val();
  });
}

/**
  Listen for CO alarms and alert the user
  as appropriate

*/
function listenForCOAlarms(alarm) {
  var alarmState;

  alarm.child('co_alarm_state').ref().on('value', function (state) {
    switch (state.val()) {
    case 'warning':
      if (alarmState !== 'warning') { // only alert the first change
        notify('Heads Up', {
          tag: alarm.child('device_id').val() + '-co_alarm_state',
          body: 'CO has been detected by ' + alarm.child('name_long').val(),
          color: alarm.child('ui_color_state').val()
        });
      }
      break;
    case 'emergency':
      if (alarmState !== 'emergency') { // only alert the first change
        notify('Emergency', {
          tag: alarm.child('device_id').val() + '-co_alarm_state',
          body: 'CO has been detected by ' + alarm.child('name_long').val(),
          color: alarm.child('ui_color_state').val()
        });
      }
      break;
    }
    alarmState = state.val();
  });
}

/**
  Listen for low battery alarms and alert the user

*/
function listenForBatteryAlarms(alarm) {
  alarm.child('battry_health').ref().on('value', function (state) {

    // Don't show battery alerts if a more
    // important alert is already showing
    if ( state.val() === 'replace' &&
         alarm.smoke_alarm_state === 'ok' &&
         alarm.co_alarm_state === 'ok') {
      notify('Replace battery', {
        tag: alarm.child('device_id').val() + '-battry_health',
        body: 'The battery is low on ' + alarm.child('name_long').val(),
        color: alarm.child('ui_color_state').val()
      });
    }
  });
}

/**
  Start listening for changes on this account,
  update appropriate views as data changes.

  Note: this will only work in browsers that support notifications
  See http://caniuse.com/notifications for a current list.

*/
if ('Notification' in window) {
  dataRef.once('value', function (snapshot) {
    var smokeCOAlarms = snapshot.child('devices/smoke_co_alarms');
    window.smokeCOAlarms = smokeCOAlarms;
    for(var id in smokeCOAlarms.val()) {
      var alarm = smokeCOAlarms.child(id);
      listenForSmokeAlarms(alarm);
      listenForCOAlarms(alarm);
      listenForBatteryAlarms(alarm);
    }
  });
}