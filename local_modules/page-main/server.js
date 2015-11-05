var debug = require('debug')('page-main');
var defaults = require('defaults');
var url = require('url');
var express = require('express');
var router = express.Router();

var c = require('./config');
var Wrap = require('./wrap');

exports = module.exports = function main(o) {
  o = defaults(o, c);

  var wrap = Wrap(o);

  router.use(o.route, function(req, res, next) {
    debug('route', o.route, req.locale, req.user, res.locals);

    wrap
      .editable(req.userCan('edit'))
      .cid(o.id)
      .place(req.place || o.place)
      .load(res.locals, function(err, result) {
        debug('route loaded', o.route, err, result);
        if (err) return next(err);
        res.send(result.page);
      })

  });

  router.use(wrap.router);

  return router;

};
