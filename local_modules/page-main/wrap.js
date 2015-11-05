var fs = require('fs');
var dot = require('dot');
var isBrowser = require('is-browser');
var defaults = require('defaults');
var Block = require('glint-block');
var Style = require('glint-plugin-block-style-editable');
var TextBlock = require('glint-block-text');
var MDBlock = require('glint-block-markdown');
var MetaBlock = require('glint-block-meta');
var CKEditorBlock = require('glint-block-ckeditor');
var Adapter = require('glint-adapter');
var PageAdapter = require('page-adapter');
var Container = require('glint-container');
var Wrap = require('glint-wrap');
var Widget = require('glint-widget');
var LayoutWrap = require('wrap-layout');

var Reservation = require('widget-reservation');
var Contact = require('widget-contact');
var Calendar = require('widget-calendar');

var template = fs.readFileSync(__dirname + '/index.dot', 'utf-8');
var compiled = dot.template(template);

function text() {
  return Block(TextBlock()).use(Style());
}

function markdown() {
  return Block(MDBlock()).use(Style());
}

function editor() {
  return Block(CKEditorBlock()).use(Style());
}

exports = module.exports = function wrap(o) {
  o = o || {};

  var wrap = Wrap();

  var blocks = {

    teaser1Title: editor().selector('[data-id=teaser1Title]'),
    teaser1SubTitle: text().selector('[data-id=teaser1SubTitle]'),
    teaser1Action: text().selector('[data-id=teaser1Action]'),
    teaser2Title: editor().selector('[data-id=teaser2Title]'),
    teaser2SubTitle: text().selector('[data-id=teaser2SubTitle]'),
    teaser2Action: text().selector('[data-id=teaser2Action]'),
    //loginIntro: editor().selector('[data-id=loginIntro]'),
    startIntro: editor().selector('[data-id=startIntro]'),
    calendarIntro: editor().selector('[data-id=calendarIntro]'),
    calendarOutro: editor().selector('[data-id=calendarOutro]'),
    reservationIntro: editor().selector('[data-id=reservationIntro]'),
    reservationOutro: editor().selector('[data-id=reservationOutro]'),
    infoIntro: editor().selector('[data-id=infoIntro]'),
    contactIntro: editor().selector('[data-id=contactIntro]'),
    contactOutro: editor().selector('[data-id=contactOutro]'),

    meta: Block(MetaBlock())

  };

  var adapter = o.adapter || PageAdapter(o);
  var db = o.db || 'glint';
  var type = o.type || 'main';
  var id = o.id || 'main';
  var templateData = o.templateData || '__template__';

  var homeAdapter = Adapter(adapter)
    .db(db)
    .type(type)

  var container = Container(blocks, homeAdapter)
    .id(id)
    .template(templateData);

  var reservation = Reservation(o.reservation);
  var contact = Contact(o.contact);
  var calendar = Calendar(o.calendar);

  wrap
    .parallel(container)
    .parallel('reservation', reservation)
    .parallel('contact', contact)
    .parallel('calendar', calendar)
    .series('content', Widget(function(options) {
      return compiled(options)
    }).place('force:server'))
    .series(LayoutWrap(o.layout).place('force:server'))

  if (!isBrowser) {
    wrap.router = [calendar.router, reservation.router];
  }

  return wrap;
};



