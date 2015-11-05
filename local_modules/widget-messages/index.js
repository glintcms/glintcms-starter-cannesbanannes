var debug = require('debug')('widget-menu');
var fs = require('fs');
var dot = require('dot');
var defaults = require('defaults');
var isBrowser = require('is-browser');
var router = require('page.js');
var Widget = require('glint-widget');

var template = fs.readFileSync(__dirname + '/index.dot', 'utf-8');
var compiled = dot.template(template);

module.exports = function(o) {

  return Widget(function(options) {
    return compiled(options);
  });

};

/**
 *
 * @param o options Object
 *
 o.place = o.place || 'browser';
 o.selector = o.selector || 'body';
 o.prepend = typeof o.prepend !== undefined || true;
 o.type = o.type || 'errors'; // (errors|message|success);

 * @param messages (String|Array)
 */
module.exports.messages = function(o, messages) {
  if (!messages) messages = o, o = undefined;

  o = o || {};
  o.place = o.place || 'browser';
  o.selector = o.selector || 'body';
  o.prepend = typeof o.prepend !== undefined || true;
  o.type = o.type || 'errors'; // (errors|info|success);

  var widget = module.exports().place(o.place).selector(o.selector);
  if (o.prepend) widget.prepend(true);

  var entries = !Array.isArray(messages) ? [{msg: messages}] : messages.map(function(msg){
    return {msg: msg};
  });

  var payload = {messages: {}};
  payload.messages[o.type] = entries;
  widget.load(payload);

};