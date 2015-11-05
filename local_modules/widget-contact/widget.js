var debug = require('debug')('widget-contact:widget');
var fs = require('fs');
var dot = require('dot');
var defaults = require('defaults');
var Widget = require('glint-widget');

var template = fs.readFileSync(__dirname + '/index.dot', 'utf-8');
var compiled = dot.template(template);

module.exports = function(o) {

  return  Widget(function(options) {
      return compiled(options);
    }).selector(o.selectorForm).place(o.place);

};