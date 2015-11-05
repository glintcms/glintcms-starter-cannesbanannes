var debug = require('debug')('wrap-layout');
var fs = require('fs');
var ejs = require('ejs');
var router = require('page.js');
var isBrowser = require('is-browser');
var Wrap = require('glint-wrap');
var Widget = require('glint-widget');
var Adapter = require('glint-adapter');
var Style = require('glint-plugin-block-style-editable');
var Block = require('glint-block');
var TextBlock = require('glint-block-text');
var CKEditorBlock = require('glint-block-ckeditor');
var Container = require('glint-container');
var PageAdapter = require('page-adapter');
var MessagesWidget = require('widget-messages');
var MenuWidget = require('widget-menu');

var template = fs.readFileSync(__dirname + '/index.ejs', 'utf-8');

// `title` and `content` must be provided
module.exports = function layout(o) {
  o = o || {};

  var pageWidget = Widget(function(options) {
    return ejs.render(o.template || template, options)
  });

  function text() {
    return Block(TextBlock()).use(Style());
  }

  function editor() {
    return Block(CKEditorBlock()).use(Style({hover: false}));
  }

  var blocks = {
    footerLeft: editor().selector('[data-id=footer-left]'),
    footerRight: editor().selector('[data-id=footer-right]')
  };

  var adapter = o.adapter || PageAdapter(o);
  var db = o.db || 'glint';
  var type = o.type || 'layout';
  var id = o.id || 'layout';
  var templateData = o.templateData || '__template__';

  var layoutAdapter = Adapter(adapter).db(db).type(type);

  var container = Container(blocks, layoutAdapter).id(id).template(templateData);

  return Wrap()
    .series(container)
    .series('menu', MenuWidget(o.menuWidget))
    .series('messages', MessagesWidget(o.messagesWidget).selector('body').prepend(true).place('force:server'))
    .series('page', pageWidget.place('force:server'))

};


if (isBrowser) {

  jQuery(function($) {

    //Preloader
    var preloader = $('.preloader');
    $(window).load(function() {
      preloader.remove();
      //$('body').scrollTop(0);
    });
  });

}