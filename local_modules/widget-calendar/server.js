var debug = require('debug')('widget-calendar');
var defaults = require('defaults');
var router = require('express').Router();
var bodyParser = require('body-parser');
var calendar = require('./google-calendar');
var bj = bodyParser.json({limit: '1gb'});
var merge = require('utils-merge');

var c = require('./config');

module.exports = function(o) {

  o = defaults(o, c);

  var widget = require('./widget')(o);

  router.post(o.route, bj, function(req, res, next) {
    debug('calendar body', req.body);
    res.sendStatus(200);
  });

  router.get(o.route, function(req, res, next){
    debug('calendarLookup');
    merge(o, req.query);
    lookup(req.query, function(err, result){
      if (err) return res.status(500).send(err.message);
      res.send(result);
    });
  });

  router.get(o.routeFullCalendar, function(req, res, next){
    var calendarName = req.params.calendar;
    var calendarId = req.params.id;
    var query = req.query;

    var obj = {
      calendarId: calendarId,
      timeMin: new Date(query.start).toISOString(),
      timeMax: new Date(query.end).toISOString()
    };

    debug('fullCalendarView', calendarName, calendarId, query, obj);

    calendar.listEvents(obj, function(err, result){
      debug('listEvents',err, result);
      if (err) return res.status(500).send(err.message);

      var compact = result.map(function(event){
        return {
          title: event.summary,
          start: event.start.date || event.start.dateTime,
          end: event.end.date || event.end.dateTime
        }
      });

      debug('listEvents compact', compact);

      res.send(compact);
    });

  });

  function lookup(o, callback){
    debug('lookup request');
    calendar.calendarLookup(function(err, result){
      debug('lookup lookup result', err, result);
      if (err) {
        result = result || {};
        result.calendarError = true;
        result.calendars = [];
      }
      callback(null, result);
    });
  }

  widget.data(function(callback){
    lookup(o, callback);
  });

  widget.router = router;

  return widget;

};