/**
 * Module dependencies.
 */
var debug = require('debug')('page-auth-access');
var express = require('express');
var defaults = require('defaults');

var c = require('./config');
var role = require('./role');
var permission = require('./permission');
var Access = require('./access');

var app = express.Router();

function authorization(o) {
  o = defaults(o, c);

  // add middlewares
  app.use(role());
  app.use(permission());

  // define rules / load from config, options
  var access = Access();
  access(o.rules);

  app.use(access.middleware());

  app.use(function(req, res, next) {
    res.locals.context = res.locals.context || {};
    res.locals.userIs = req.userIs;
    res.locals.userCan = req.userCan;
    res.locals[o.roleProperty] = res.locals.context[o.roleProperty] = req[o.roleProperty];
    res.locals[o.permissionProperty] = res.locals.context[o.permissionProperty] = req[o.permissionProperty];
    next();
  });

  /**
   * return the express app.
   */
  app.access = access;
  return app;
}


/**
 * expose auth (express app).
 */
exports = module.exports = authorization;

