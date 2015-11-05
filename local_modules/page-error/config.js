exports.identifier = 'page-error';

exports.selector = 'body';

exports.defaultErrorCode = 500;

exports.defaultErrorMessage = 'Uups, something wen\'t wrong';

exports.routeErrors = /^\/[1-9][0-9]{2}$/; // like /400, /404 /500 etc.

exports.place = process.env.GLINT_PLACE || 'server';




