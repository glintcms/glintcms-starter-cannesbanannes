var debug = require('debug')('page-error');
var defaults = require('defaults');
var express = require('express');
var app = express();
var parseurl = require('parseurl');
var HttpError = require('create-http-error');

var c = require('./config');
var Wrap = require('./wrap');

if (process.env.NODE_ENV !== 'production') {
  Error.stackTraceLimit = Infinity;
  //require('superstack');
}

function error(o) {
  o = defaults(o, c);

  // TODO care about XMLHttpRequest and accept header


  // should only be reached when no other route matched.
  function finalhandler(req, res, next) {
    var err = new HttpError(404);
    next(err);
  }

  // should be called at the very end.
  function errorhandler(err, req, res, next) {

    // create error object for ui
    var error = {};
    var type = typeof err;
    if (type === 'number') {
      error = new HttpError(err);
    } else if (type === 'string') {
      error.status = o.defaultErrorCode;
      error.message = err;
    } else if (type === 'object' && !(err instanceof HttpError)) {
      var code = err.code;
      console.error('error', err);

      if (process.env.NODE_ENV === 'production') {
        switch (err.code) {
          case 'ENOENT' :
            return res.redirect('/404');
            break;
          default:
            return res.redirect('/' + o.defaultErrorCode);
            break;
        }
      }

    }

    error.message = error.message || err.message || err.msg || err.name || o.defaultErrorMessage;
    if (process.env.NODE_ENV === 'production') {
      error.status = null;
      error.stack = null;
    } else {
      error.status = error.status || err.status || err.statusCode || err.code || o.defaultErrorCode;
      error.stack = error.stack || err.stack;
    }

    res.locals.error = error;

    var wrap = Wrap(o);

    debug(req.path, res.statusCode, req.locale, res.locals);

    wrap
      .place(req.place || o.place)
      .load(res.locals, function(err, result) {
        debug('route loaded', result);
        if (err) return next(err);
        res.send(result.page);
      })
    ;

  }

  // routes
  app.use(o.routeErrors, function(req, res, next) {
    var p = parseurl.original(req).pathname;
    var code = p.replace(/\//g, '');
    try {
      code = Number(code);
    } catch (e) {
      code = o.defaultErrorCode;
    } finally {
      var err = HttpError(code);
      next(err);
    }
  });
  app.use(finalhandler);

  app.on('mount', function(parent) {
    // error handler in express sub apps don't work. tried with app, didn't work either.
    // see issue: https://github.com/strongloop/express/issues/1522
    parent.use(errorhandler);
  });

  app.errorhandler = errorhandler;
  app.finalhandler = finalhandler;

  return app;
}

// export stuff
exports = module.exports = error;
exports.HttpError = HttpError;

