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
    smokeCOAlarms = [],
    isFirstRun    = true;

if (nestToken) { // Simple check for token

  // Create a reference to the API using the provided token
  var dataRef = new Firebase('wss://developer-api.nest.com');
  dataRef.auth(nestToken);

  // in a production client we would want to
  // handle auth errors here.

  // If an alarm goes off, we want to push a notification from the background
  if (window.Notification && window.Notification.permission === 'default') {
    window.Notification.requestPermission();
  }

} else {
  // No auth token, go get one
  // window.location.replace('/auth/nest');
}

/**
  Listen for CO alarms and alert the user
  as appropriate

*/
function listenForSmokeAlarms(alarm) {
  var alarmState;

  alarm.child('smoke_alarm_state').on('change', function (state) {
    // Get the latest alarm data
    var alarm = state.parent().val();

    switch (state.val()) {
    case 'warning':
      if (alarmState !== 'warning') { // only alert the first change
        new Notification('Heads Up', {
          tag: alarm.device_id + 'smoke_alarm_state-warning',
          body: 'Smoke has been detected by ' + alarm.name_long
        });
      }
      break;
    case 'emergency':
      if (alarmState !== 'emergency') { // only alert the first change
        new Notification('Emergency', {
          tag: alarm.device_id + 'smoke_alarm_state-warning',
          body: 'Smoke has been detected by ' + alarm.name_long
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
  alarm.child('co_alarm_state').on('change', function (state) {
    // Get the latest alarm data
    var alarm = state.parent().val();

    switch (state.val()) {
    case 'warning':
      if (alarmState !== 'warning') { // only alert the first change
        new Notification('Heads Up', {
          tag: alarm.device_id + 'co_alarm_state-warning',
          body: 'CO has been detected by ' + alarm.name_long
        });
      }
      break;
    case 'emergency':
      if (alarmState !== 'emergency') { // only alert the first change
        new Notification('Emergency', {
          tag: alarm.device_id + 'co_alarm_state-warning',
          body: 'CO has been detected by ' + alarm.name_long
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
  alarm.child('battry_health').on('change', function (state) {
    // Get the latest alarm data
    var alarm = state.parent().val();

    // Don't show battery alerts if a more important alert
    // is already showing
    if ( state.val() === 'replace' &&
         alarm.smoke_alarm_state === 'ok' &&
         alarm.co_alarm_state === 'ok') {
      new Notification('Replace battery', {
        tag: alarm.device_id + 'battry_health',
        body: 'The battery is low on ' + alarm.name_long
      });
    }
  });
}

/**
  Start listening for changes on this account,
  update appropriate views as data changes.

  If it is the first run, also setup listeners
  for alarm notifications

*/
dataRef.on('value', function (snapshot) {
  smokeCOAlarms = snapshot.val().devices.smoke_co_alarms;

  for(var id in smokeCOAlarms) {

    if (isFirstRun && window.Notification && window.Notification.permission === 'granted') {
      var alarm = snapshot.child('/devices/smoke_co_alarms/' + id);
      listenForSmokeAlarms(alarm);
      listenForCOAlarms(alarm);
      listenForBatteryAlarms(alarm);
      isFirstRun = false;
    }
  }

});
