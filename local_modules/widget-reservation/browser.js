var debug = require('debug')('widget-reservation');
var defaults = require('defaults');
var messages = require('widget-messages').messages;
var c = require('./config');

module.exports = function(o) {

  o = defaults(o, c);

  var widget = require('./widget')(o);

  return widget;

};

// initialization
$(function() {
  $('#reservation-start').datetimepicker({
    locale: 'de'
  });
  $('#reservation-end').datetimepicker({
    locale: 'de',
    useCurrent: false //Important! See issue #1075
  });
  $("#reservation-start").on("dp.change", function(e) {
    $('#reservation-end').data("DateTimePicker").minDate(e.date);
  });
  $("#reservation-end").on("dp.change", function(e) {
    $('#reservation-start').data("DateTimePicker").maxDate(e.date);
  });
});

$('.js-reservation-button').on('click', function(e) {
  e.preventDefault();
  debug('reserve request');
  reserve();
});

function reserve() {
  var obj = {};
  var inputs = document.querySelectorAll('[name*="reservation-"]');
  [].slice.call(inputs).forEach(function(input) {
    var inputName = input.getAttribute('name').replace('reservation-', '');
    var inputValue = $(input).val();
    obj[inputName] = inputValue;

  });

  debug('reserve parameter', obj);

  if (!validate(obj)) return false;

  $.post('/reservation', obj)
    .fail(function reservationErrorCallback(err) {
      debug('reservation failed', err);
      console.log(err.responseText);
      if (err.responseText.indexOf('ENOTFOUND') > -1) err.responseText = 'Der Zugriff auf den Kalender ist zurzeit nicht möglich';
      messages(err.responseText);
    })
    .done(function reservationCallback() {
      debug('reservation success');
      messages({type: 'success'}, 'die Reservierung wurde erfolgreich übermittelt.');
      clear();
    })

}

function clear() {
  var obj = {};
  var inputs = document.querySelectorAll('[name*="reservation-"]');
  [].slice.call(inputs).forEach(function(input) {
    var inputName = input.getAttribute('name').replace('reservation-', '');
    $(input).val('');

  });
}

function validate(obj) {

  var err = [];

  if (!obj.start) err.push('Von Datum fehlt');
  if (!obj.end) err.push('Bis Datum fehlt');
  if (!obj.name) err.push('Name fehlt');
  if (!obj.email) err.push('Email fehlt');
  if (!obj.message) err.push('Nachricht fehlt');

  if (err.length > 0) {
    var motivation = '';
    if (err.length > 3) {
      motivation = 'ist das dein Ernst?';
    } else {
      motivation = 'noch nicht ganz korrekt :-(';
    }
    err.push(err.length + ' von 5 Feldern sind fehlerhaft... ' + motivation);
    messages({type: 'errors'}, err);
    return false;
  }
  return true;
}
