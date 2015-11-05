var fs = require('fs');
var ejs = require('ejs');
var Wrap = require('glint-wrap');
var Widget = require('glint-widget');
var LayoutWrap = require('wrap-layout');
var defaults = require('defaults');
var c = require('./config');

module.exports = function wrap(o) {
  o = defaults(o, c);
  var template = o.template || fs.readFileSync(__dirname + '/index.ejs', 'utf-8');

  var contentWidget = Widget(function(options) {
    return ejs.render(template, options);
  });

  return Wrap()
    .defaults({
      title: c.title,
      style: '/assets/page-filemanager/style.css'
    })
    .series('content', contentWidget.place('force:server'))
    .series(LayoutWrap(o.layout).place('force:server'))
    ;

};
