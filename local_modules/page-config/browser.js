var debug = require('debug')('page-config');
var defaults = require('defaults');

var c = require('./config');

module.exports = function config(o) {
  o = defaults(o, context.options || {});
  o = defaults(o, c);

  Object.defineProperty(window, 'options', {
    get: function() {
      return o;
    }
  });

  return o;

};
