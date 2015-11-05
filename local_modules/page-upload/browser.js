var debug = require('debug')('page-upload');
var router = require('page.js');
var defaults = require('defaults');

var c = require('./config');

module.exports = function upload(o) {
  o = defaults(o, c);

  return router(o.get, function(req) {
    debug('upload route', o.get);
    var el = document.querySelector(o.selector);
    if (el) el.setAttribute('action', location.pathname);
  });
};



