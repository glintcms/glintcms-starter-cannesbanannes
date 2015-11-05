var debug = require('debug')('page-is-bot');
var defaults = require('defaults');
var express = require('express');
var router = express.Router();
var bot = require('connect-is-bot');

var c = require('./config');

module.exports = function isBot(o) {
  o = defaults(o, c);

  router.use(bot(o));

  router.use(function(req, res, next) {

    if (req.isBot) {
      debug('request is comming from a bot');
      req.place = o.place;
      res.locals.context = res.locals.context || {};
      res.locals.context.isBot = true;
      res.locals.context.place = o.place;
    }
    next();

  });

  return router;

};
