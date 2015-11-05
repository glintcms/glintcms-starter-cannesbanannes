exports.title = 'Kalender';

exports.route = '/calendars';

exports.routeFullCalendar = '/calendars/:calendar/:id';

exports.selector = '#calendar';

exports.place = process.env.GLINT_PLACE || 'browser';