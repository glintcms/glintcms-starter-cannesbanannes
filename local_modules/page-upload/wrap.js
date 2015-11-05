var fs = require('fs');
var ejs = require('ejs');

var Wrap = require('glint-wrap');
var Widget = require('glint-widget');
var defaults = require('defaults');
var LayoutWrap = require('wrap-layout');

var template = fs.readFileSync(__dirname + '/index.ejs', 'utf-8');

module.exports = function wrap(o) {
  o = o || {};

  var contentWidget = Widget(function(options) {
    return ejs.render(o.template || template, options);
  });

  return Wrap()
    .defaults({
      title: 'i18n-File-Upload',
      meta: {title: 'i18n-File-Upload'},
      style: '/assets/page-upload/dropzone.css',
      script: '/assets/page-upload/dropzone.js'
    })
    .series('content', contentWidget.place('force:server'))
    .series(LayoutWrap(o.layout).place('force:server'))
    ;

};
