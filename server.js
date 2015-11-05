var debug = require('debug')('glintcms-starter-cannesbanannes');
var url = require('url');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var compression = require('compression');

/**
 * glintcms application
 *
 * @param options Object
 * @returns {*} http server with express server `app` field.
 */
module.exports = function glintcms(options) {

  // get options
  var o = require('page-config')(options);

  var app = express();
  var server = require('http').createServer(app);

  // app, server, session, adapter
  var Adapter = require('glint-adapter');
  var pageAdapter = require('page-adapter')(o.adapter);

  var sessionAdapter = Adapter(pageAdapter).db('glint').type('session');
  var sessionStore = require('glint-session')(app, sessionAdapter);
  var io = require('glint-socket-io')(server, sessionStore);

  // pages
  // no i18n
  var pageAuth = require('page-auth');
  var pageAccess = require('page-auth-access');
  var pageMain = require('page-main');

  var pageFilemanager = require('page-filemanager');
  var pageUpload = require('page-upload');

  var pageError = require('page-error');

  var pageIsBot = require('page-is-bot');

  // no view engine setup -> all handled by the page modules
  app.use(compression(o.compression)); // middleware order: very early to compress everything. -> huge difference in file size! check network in browser.

  app.use(favicon(__dirname + '/public/assets/wrap-layout/favicon.ico'));
  app.use(express.static(path.join(__dirname, 'public')));

  // enable cors
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.use(function(req, res, next){
    req.__ = res.locals.__ = function noopTranslate(str) {
      return str;
    };
    next();
  });

  app.use(flash(o.flash));
  app.use(cookieParser(o.cookieParser));

  // the important stuff happens from here on! -> page routes

  var auth = pageAuth(o.auth);
  app.use(auth.session);  // middleware order: first page middleware

  var access = pageAccess(o.access);
  app.use(access); // middleware order: after pageAuth session

  app.use(auth.user);
  app.use(auth.oauth);

  if (debug.enabled) {
    app.use(function(req, res, next) {
      debug('locals', res.locals);
      debug('userRole', req.userRole);
      debug('userRoleString', req.userRoleString);
      debug('userPermission', req.userPermission);
      next();
    });
  }

  app.use(o.routes);
  app.use(pageIsBot(o.isBot));
  app.use(pageAdapter.routes);

  app.use(pageMain(o.main)); // middleware order: must be after the other pages

  app.use(pageFilemanager(o.filemanager));
  app.use(pageUpload(o.upload));

  if (debug.enabled) {
    app.use(function(req, res, next) {
      debug('no route');
      next();
    });
  }

  app.use(function(err, req, res, next) {
    console.error('uncaught error', err);
    next(err);
  });

  // final error handler
  app.use(pageError(o.error)); // middleware order: at the very end

  // return http server and express app.
  var srv = server;
  srv.app = app;
  return srv;

};

