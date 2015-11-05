var debug = require('debug')('page-main');

var user = require('page-auth-access');
var keyboard = require('glint-trigger-keyboard');
var sidenav = require('glint-trigger-sidenav');
var defaults = require('defaults');
var router = require('page.js');

var c = require('./config');
var Wrap = require('./wrap');

module.exports = function main(o) {
  o = defaults(o, c);

  router(o.route, function(req, next) {

    var wrap = Wrap(o);

    debug('route', window.location.href, context.locale, req.params);
    if (user.can('edit')) {
      wrap.editable(true);
      wrap.containers.forEach(function(container, i) {
        keyboard(o.triggerKeyboard).add(container);
        sidenav(o.triggerSidenav).add(container);
      });
    }

    wrap
      .cid(o.id)
      .place(context.place || o.place)
      .load(function(err, result) {
        if (err) return console.error(err);
        debug('wrap loaded', o.id, result);
        next();
      })

  });

};


