/*
 * modules / dependencies
 */
var page = require('page.js');
var PageConfig = require('page-config');
var PageFilemanager = require('page-filemanager');
var PageUpload = require('page-upload');
var PageMain = require('page-main');

/*
 * variables
 */
var root = !module.exports.length;

/**
 * glintcms application
 *
 * @param options Object
 */
module.exports = function glintcms(options) {

  // get options
  var o = PageConfig(options);

  // routes
  // auth is done completely on the server ;-)
  PageFilemanager(o.filemanager);
  PageUpload(o.upload);
  PageMain(o.main);

  // initialize page.js router
  page(o.browser || {
      click: false,
      dispatch: true,
      decodeURLComponents: false
    });

  // initialize socket.io communication
  //var io = window.io = require('glint-socket-io').io;
  //var socket = window.socket = require('glint-socket-io')();

};

if (root) module.exports();