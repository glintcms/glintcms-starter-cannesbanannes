var debug = require('debug')('page-upload');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var url = require('url');
var mkdirp = require('mkdirp');
var defaults = require('defaults');

var c = require('./config');
var cs = require('./config-server');
var Wrap = require('./wrap');

var jsonParser = bodyParser.json({limit: '1gb'});

function dir(d) {
  if (!fs.existsSync(d)) {
    try {
      var done = mkdirp.sync(d);
      if (!done) debug('dicectory %s was not created!', d);
    } catch (e) {
      debug('dicectory %s was not created!', d, e);
    }
  }
}

function ckeditor(req, url) {
  // http://docs.ckeditor.com/#!/guide/dev_file_browser_api
  html = "";
  html += "<script type='text/javascript'>";
  html += "    var funcNum = " + req.query.CKEditorFuncNum + ";";
  html += "    var url     = \"" + url + "\";";
  html += "    var message = \"Uploaded file successfully\";";
  html += "";
  html += "    window.parent.CKEDITOR.tools.callFunction(funcNum, url)"; //, message);";  // message -> alert() -> annoying
  html += "</script>";

  return html;
}

module.exports = function upload(o, os) {
  o = defaults(o, c);
  os = defaults(os, cs);

  // make sure the directories exist
  [os.tmp, os.dir].map(function(d) {
    dir(d);
  });

  app.get(o.get, function(req, res, next) {

    debug('route', o.get);

    Wrap(o)
      .place(o.get)
      .load(res.locals, function(err, result) {
        debug('route loaded', result);
        if (err) return next(err);
        res.send(result.page);
      })
    ;
  });

// Upload middleware for multipart/form-data
  var multipartFormData = multer({
    dest: os.dir,
    rename: function(fieldname, filename) {
      return filename;
    }
  });

  app.post(o.post, jsonParser, multipartFormData, function(req, res, next) {
    var folder = (req.params[0]) ? req.params[0] : '';
    var file = (req.files) ? req.files.file : undefined;
    debug('post', o.post, folder, file);
    if (!file) return res.sendStatus(400);

    var files = [];
    if (Array.isArray(file)) {
      // for some weird reasons req.files.file is a nested array when `uploadMultiple: true`,
      // except for the last file with an odd number of files.
      files = Array.isArray(file[0]) ? file[0] : file;
    } else {
      // used when `uploadMultiple: false`
      files.push(file);
    }

    files.map(function(file) {
      // get the temporary location of the file
      var tmp = file.path;
      // set where the file should actually exists - in this case it is in the "images" directory
      var d = path.resolve(os.dir + '/' + folder + '/');
      // make the directory if it does not alredy exist
      dir(d);
      var target = path.resolve(d + '/' + file.name);

      var message = 'File uploaded to: ' + target + ' - ' + file.size + ' bytes';

      if (tmp !== target) {
        // move the file from the temporary location to the intended location
        debug('post rename:', tmp, target);
        fs.rename(tmp, target, function(err) {
          debug('post rename err', err);
          if (err) return res.sendStatus(400);
          // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
          fs.unlink(tmp, function() {
            debug('post unlink', err);
            if (err) return res.sendStatus(400);
            debug('post send', message);
            res.send(message);
          });
        });
      } else {
        debug('post send', message);
        res.send(message);
      }

    });

  });

  app.post(o.ckeditor, jsonParser, multipartFormData, function(req, res, next) {

    var referer = req.get('Referer');
    var folder = url.parse(referer).pathname;

    var editor = req.query.CKEditor;
    var fn = req.query.CKEditorFuncNum;
    var file = (req.files) ? req.files.upload : undefined;

    debug('post ckeditor', o.ckeditor, folder, file, editor, fn, referer);
    if (!file) return res.sendStatus(400);

    var files = [];
    if (Array.isArray(file)) {
      // for some weird reasons req.files.file is a nested array when `uploadMultiple: true`,
      // except for the last file with an odd number of files.
      files = Array.isArray(file[0]) ? file[0] : file;
    } else {
      // used when `uploadMultiple: false`
      files.push(file);
    }

    files.map(function(file) {
      // get the temporary location of the file
      var tmp = file.path;
      // set where the file should actually exists - in this case it is in the "images" directory
      var d = path.resolve(os.dir + '/' + folder + '/');
      // make the directory if it does not alredy exist
      dir(d);
      var target = path.resolve(d + '/' + file.name);
      var publicUrl = path.resolve(os.rootUrl + '/' + folder + '/' + file.name);
      var message = ckeditor(req, publicUrl);

      if (tmp !== target) {
        // move the file from the temporary location to the intended location
        debug('post rename:', tmp, target);
        fs.rename(tmp, target, function(err) {
          debug('post rename err', err);
          if (err) return res.sendStatus(400);
          // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
          fs.unlink(tmp, function() {
            debug('post unlink', err);
            if (err) return res.sendStatus(400);
            debug('post send', message);
            res.send(message);
          });
        });
      } else {
        debug('post send', message);
        res.send(message);
      }

    });

  });

  // return the express app
  return app;
};
