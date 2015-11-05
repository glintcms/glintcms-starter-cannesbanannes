var debug = require('debug')('widget-contact');
var defaults = require('defaults');
var router = require('express').Router();
var bodyParser = require('body-parser');
var bj = bodyParser.json({limit: '1gb'});

var c = require('./config');

module.exports = function(o) {

  o = defaults(o, c);

  var widget = require('./widget')(o);

  router.post(o.route, bj, function(req, res, next) {
    console.log('contact body', req.body);
    next();
  });

  widget.router = router;

  return widget;

};