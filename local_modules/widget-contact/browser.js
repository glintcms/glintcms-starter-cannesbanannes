var debug = require('debug')('widget-contact');
var isBrowser = require('is-browser');
var defaults = require('defaults');

var c = require('./config');

module.exports = function widget(o) {

  o = defaults(o, c);

  initialize(o);

  var widget = require('./widget')(o);

  return widget;

};

function initialize(o) {

  var form = document.querySelector(o.selectorForm);
  var buttons = document.querySelectorAll(o.selectorButton);

  function contact(e) {

    var target = e.target || e.srcElement;

    function getAttributes(config, form, names) {
      var attributes = {};
      names.forEach(function(name) {
        var value = config[name] || '';
        if (form) {
          var input = form.querySelector('[name=' + name + ']');
          if (input) value = input.value || input.text || input.placeholder;
        }
        attributes[name] = value;
      });
      return attributes;
    }


    var attr = getAttributes(o, form, ['email', 'subject', 'message']);

    debug('button', e, target, attr);

    var href = 'mailto:' + attr.email + '?subject=' + encodeURIComponent(attr.subject) + '&body=' + encodeURIComponent(attr.message);

    target.setAttribute('href', href);

  }

  [].slice.call(buttons).forEach(function(button) {
    button.addEventListener('click', contact, false);
  });

}
