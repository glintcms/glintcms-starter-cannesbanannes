var defaults = require('defaults');
var Ajax = require('glint-adapter-ajax');

var c = require('./config');

module.exports = function adapter(o) {

  o = defaults(o, c);

  return Ajax(o);

};
