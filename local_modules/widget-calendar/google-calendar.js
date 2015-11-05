var debug = require('debug')('widget-calendar:google-calendar');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var calendar = google.calendar('v3');
var async = require('async');
var merge = require('utils-merge');

var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-token.json';
var SECRED_PATH = './client_secret.json';

var credentials = require(SECRED_PATH);
var token = require(TOKEN_PATH);


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {function} callback The callback to call with the authorized client. the callback contains the oauth2Client Object:
 *
 *
 */
exports.authorize = function authorize(callback) {

  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  oauth2Client.credentials = token;
  callback(oauth2Client);

};

/**
 * Lists all calendars
 *
 * [ { kind: 'calendar#calendarListEntry',
    etag: '"1442954794158000"',
    id: '49jndcfvhc26ecem5d6uj8eg44@group.calendar.google.com',
    summary: 'holidays',
    timeZone: 'Europe/Zurich',
    colorId: '19',
    backgroundColor: '#c2c2c2',
    foregroundColor: '#000000',
    selected: true,
    accessRole: 'owner',
    defaultReminders: [] },
 ...
 ]
 *
 * @param callback
 */
exports.calendarList = function calendarList(callback) {
  exports.authorize(function(auth) {
    calendar.calendarList.list({
      auth: auth
    }, function(err, result) {
      if (err) return callback(err);
      result.auth = auth;
      callback(err, result);
    });
  });
};


/**
 * Calendar Lookup object.
 *
 * {
 * holidays: { kind: 'calendar#calendarListEntry',
    etag: '"1442954794158000"',
    id: '49jndcfvhc26ecem5d6uj8eg44@group.calendar.google.com',
    summary: 'holidays',
    timeZone: 'Europe/Zurich',
    colorId: '19',
    backgroundColor: '#c2c2c2',
    foregroundColor: '#000000',
    selected: true,
    accessRole: 'owner',
    defaultReminders: [] },
 ...
 }
 *
 * @param callback
 */
exports.calendarLookup = function calendarLookup(callback) {
  exports.calendarList(function(err, result) {
    if (err) return callback(err);
    debug('calendarLookup result', err, result);

    var calendars = {};
    calendars.lookup = {};
    calendars.auth = result.auth;

    // filter only own calendars.
    // to prevent ERROR: { errors: [ { domain: 'global', reason: 'notFound', message: 'Not Found' } ], code: 404, message: 'Not Found' }
    calendars.calendars = result.items.filter(function(cal) {
      return cal.accessRole === 'owner';
    });

    result.items.forEach(function(cal, i) {
      calendars.lookup[cal.summary] = cal;
      calendars.lookup[cal.summary].number = i;
    });

    callback(err, calendars);
  })
};

/**
 * List the calendar events
 *
 * @param options Object
 *
 * e.g. Lists the next 10 events on the user's primary calendar.
 *
 * {
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }
 *
 */
exports.listEvents = function listEvents(options, callback) {

  exports.authorize(function(auth) {
    options.auth = auth;

    calendar.events.list(options, function(err, response) {
      if (err) return callback(err);
      response.auth = auth;
      callback(null, response.items);
    });
  })
};

exports.calendars = function calendars(options, callback) {
  options = options || {};
  exports.calendarLookup(function(err, result) {
    if (err) return callback(err);
    var cals = result.calendars;

    async.map(ownCalendars, function(cal, cb) {
      debug('cal', cal.id);
      var param = {};
      param.calendarId = cal.id;
      param.auth = result.auth;

      debug('events for calendar', param);

      calendar.events.list(param, function(err, response) {
        debug('events list inside', err, response);
        if (err) return cb(err);
        cb(null, response);
      });
    }, function(err, results) {
      debug('final callback', err, results);
      if (err) return callback(err);
      callback(null, {
        calendars: ownCalendars,
        events: results
      });
    });

  });
};


/**
 *
 * Inserts a new event into the calendar with the `calendarId`.
 *
 * @param calendarId
 * @param event
 * @param callback
 *
 *
 * event:
 *
 var event = {
    'summary': 'Feerie',
    //'location': '800 Howard St., San Francisco, CA 94103',
    'description': 'in cannes',
    'start': {
      'dateTime': '2015-10-31T09:00:00-07:00',
      'timeZone': 'Europe/Paris'
    },
    'end': {
      'dateTime': '2015-11-01T17:00:00-07:00',
      'timeZone': 'Europe/Paris'
    },
    'recurrence': [
      'RRULE:FREQ=DAILY;COUNT=2'
    ],
    'attendees': [
      {'email': 'lpage@example.com'},
      {'email': 'sbrin@example.com'}
    ],
    'reminders': {
      'useDefault': false,
      'overrides': [
        {'method': 'email', 'minutes': 24 * 60},
        {'method': 'popup', 'minutes': 10}
      ]
    }
  };
 *
 */
exports.insertEvent = function insertEvent(calendarId, event, parameters, callback) {
  if (typeof parameters === 'function') callback = parameters, parameters = undefined;

  exports.authorize(function(auth) {

    var params = {
      auth: auth,
      calendarId: calendarId,
      resource: event
    };
    if (parameters) merge(params, parameters);

    calendar.events.insert(params, callback);

  });
};

