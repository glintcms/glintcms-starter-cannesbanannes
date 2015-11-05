var defaults = require('defaults');
var clone = require('clone');
var Ajax = require('glint-adapter-ajax');

var c = require('./config');
var cs = require('./config-server');

exports = module.exports = function adapter(o) {
  o = defaults(o, c);
  os = clone(cs);
  o.server = o.server || os;

 return Ajax(o);
};
