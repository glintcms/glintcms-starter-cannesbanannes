var debug = require('debug')('widget-reservation');
var defaults = require('defaults');
var router = require('express').Router();
var bodyParser = require('body-parser');
var bj = bodyParser.json({limit: '1gb'});
var moment = require('moment');
var calendar = require('widget-calendar/google-calendar');

var c = require('./config');

module.exports = function(o) {

  o = defaults(o, c);

  var widget = require('./widget')(o);

  router.post(o.route, bj, function(req, res, next) {
    debug('reservation body', req.body);

    calendar.calendarLookup(function(err, result) {
      if (err) return res.status(500).send(err.message);

      var id = result.lookup[o.calendar].id;

      var format = 'DD.MM.YYYY HH:mm';
      var start = moment(req.body.start, format).toISOString();
      var end = moment(req.body.end, format).toISOString();

      var event = {
        summary: req.body.name,
        start: {dateTime: start},
        end: {dateTime: end},
        attendees: [{
          email: req.body.email,
          displayName: req.body.name
        }],
        description: req.body.message
      };

      debug('reservation id, event', id, event);

      calendar.insertEvent(id, event, {sendNotifications: true}, function(err, result) {
        if (err) return res.status(500).send(err.message);
        res.send(result);
      });

    });

  });

  widget.router = router;

  return widget;

};