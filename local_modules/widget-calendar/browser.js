var debug = require('debug')('widget-calendar');
var isBrowser = require('is-browser');
var defaults = require('defaults');
var messages = require('widget-messages').messages;

var c = require('./config');

module.exports = function widget(o) {

  o = defaults(o, c);

  function lookup(o, callback) {
    debug('calendar lookup');

    var date = new Date();
    date.getMonth();

    $.get(o.route)
      .fail(function calErrorCallback(err) {
        debug('cal failed', err);
        callback(err);
      })
      .done(function calCallback(result) {
        debug('cal success', result);
        callback(null, result);
      })

  }

  function display(o, calendars) {

    var sources = calendars.calendars.map(function(cal){
      return {
        url: '/calendars/' + cal.summary + '/' + cal.id,
        color: cal.backgroundColor,
        textColor: cal.foregroundColor,
        error: function() {
          messages('der Kalender konnte nicht geladen werden.');
        }
      }
    });

    debug('calendar display', sources);

    $('#calendar-view').fullCalendar({
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'month,basicWeek,basicDay'
      },
      lang: 'de',
      defaultDate: new Date().toISOString(),
      editable: false,
      eventLimit: true, // allow "more" link when too many events
      eventSources: sources
    });

  }

  $(function() {
    lookup(o, function(err, result) {
      if (err) {
        messages(err);
        return console.error('ERROR', err);
      }
      display(o, result);
    });

  });

  var widget = require('./widget')(o);

  widget.data(function(callback) {

    lookup(o, callback);

  });

  return widget;

};




