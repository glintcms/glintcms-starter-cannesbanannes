var debug = require('debug')('page-filemanager');
var router = require('page.js');
var isBrowser = require('is-browser');
var defaults = require('defaults');

var c = require('./config');

module.exports = function filemanager(o) {
  o = defaults(o, c);

  return router(o.route, function(req) {

    debug('filemanager route', o.route);
    // get view url query right
    // TODO use some sort of query parser
    var buttonList = document.querySelector('.filemanager .js-list');
    if (buttonList) {
      buttonList.addEventListener('click', function(e) {
        var name = 'list';
        e.preventDefault();

        if (!~location.search.indexOf(name)) {
          var search = location.search.length ? location.search += '&' + name : '?' + name;
          location.search = search;
        }

      });
    }

    var buttonPreview = document.querySelector('.filemanager .js-preview');
    if (buttonPreview) {
      buttonPreview.addEventListener('click', function(e) {
        e.preventDefault();
        var name = 'list';

        if (~location.search.indexOf('list')) {
          var search = location.search;
          search = search.replace('?' + name, '');
          search = search.replace('&' + name, '');
          location.search = search;
        }

      });
    }

    // TODO move to CKEDITOR plugin
    // handle CKEDITOR file api stuff
    if (window.opener && window.opener.CKEDITOR) {

      function queryString(search) {
        var queryString = search || location.search;
        queryString = queryString.trim().replace(/^(\?|#)/, '');
        queryString = queryString.split('&');
        var param = {};
        var query = queryString.forEach(function(query) {
          var segment = query.split('=');
          param[segment[0]] = segment.length > 1 ? segment[1] : true;
        });
        return param;
      }

      var query = queryString();

      var el = document.querySelectorAll(o.selectable);
      var links = [].slice.call(el);

      links.forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          var ref = window.opener;
          ref.CKEDITOR.tools.callFunction(query.CKEditorFuncNum, link.getAttribute('href'));
          window.close();
          return false;
        }, false);
      });

    }

    // END CKEDITOR plugin

  });

};
