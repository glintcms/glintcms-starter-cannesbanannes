/*
 * serve-index fork
 * Copyright(c) 2011 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * Copyright(c) 2015 Andi Neck
 * MIT Licensed
 */

// TODO: arrow key navigation

/**
 * Module dependencies.
 */
var debug = require('debug')('page-filemanager');
var express = require('express');
var router = express.Router();
var accepts = require('accepts');
var createError = require('http-errors');
var defaults = require('defaults');
var escapeHtml = require('escape-html');
var ejs = require('ejs');
var fs = require('fs');
var path = require('path');
var normalize = path.normalize;
var resolve = path.resolve;
var sep = path.sep;
var extname = path.extname;
var join = path.join;
var Batch = require('batch');
var mime = require('mime-types');
var parseUrl = require('parseurl');
var prettysize = require('prettysize');

var Wrap = require('./wrap');
var c = require('./config');

/**
 * Media types and the map for content negotiation.
 */

var mediaTypes = [
  'text/html',
  'text/plain',
  'application/json'
];

var mediaType = {
  'text/html': 'html',
  'text/plain': 'plain',
  'application/json': 'json'
};

/**
 * Serve directory listings with the given `root` path.
 *
 * See Readme.md for documentation of o.
 *
 * @param {String} path
 * @param {Object} o options
 * @return {Function} middleware
 * @api public
 */

module.exports = function filemanager(o) {
  o = defaults(o, c);

  // root required
  if (!o.root) throw new TypeError('filemanager() root path required');

  // resolve root to absolute and normalize
  var relativeRoot = o.root;
  var root = resolve(o.root);
  root = normalize(root + sep);

  var hidden = o.hidden
    , icons = o.icons
    , view = o.view || 'tiles'
    , filter = o.filter
    , up = !!o.up
    , down = !!o.down
    , crumbs = !!o.crumbs
    , serve = o.serve || relativeRoot
    , mount = o.mount || '/filemanager'

  router.use(o.route, function filemanager(req, res, next) {

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 'OPTIONS' === req.method
        ? 200
        : 405;
      res.setHeader('Allow', 'GET, HEAD, OPTIONS');
      res.end();
      return;
    }

    // parse original url
    var originalUrl = parseUrl.original(req);
    var originalDir = decodeURIComponent(originalUrl.pathname);
    var search = originalUrl.search ? decodeURIComponent(originalUrl.search) : '';
    var dir = normalize(originalDir.replace(mount, ''));
    var serveDir = normalize(join(serve, dir));

    // join / normalize from root dir
    var path = normalize(join(root, dir));

    // null byte(s), bad request
    if (~path.indexOf('\0')) return next(createError(400));

    // malicious path
    if ((path + sep).substr(0, root.length) !== root) {
      debug('malicious path "%s"', path);
      return next(createError(403));
    }

    // determine ".." display
    up = normalize(resolve(path) + sep) !== root && o.up;

    // check if we have a directory
    debug('stat "%s"', path);


    fs.stat(path, function(err, stat) {
      if (err && err.code === 'ENOENT') {
        if (originalDir === o.mount) {
          debug('ENOENT, forward request to next middleware');
          return next();
        } else {
          var to = o.mount + search;
          debug('ENOENT, redirect from: "' + originalUrl + '" to: "' + to + '"');
          return res.redirect(to);
        }
      }

      if (err) {
        err.status = err.code === 'ENAMETOOLONG'
          ? 414
          : 500;
        return next(err);
      }

      if (!stat.isDirectory()) return next();

      // fetch files
      debug('readdir "%s"', path);
      fs.readdir(path, function(err, files) {
        if (err) return next(err);
        if (!hidden) files = removeHidden(files);
        if (filter) files = files.filter(function(filename, index, list) {
          return filter(filename, index, list, path);
        });

        if (up) files.unshift('..');

        statFiles(path, files, function(err, stats) {
          if (err) return next(err);

          files = files.map(function(file, i) {
            var s = stats[i];

            return {
              name: file,
              link: getLink(file, s.isDirectory(), originalDir, serveDir, search),
              size: prettysize(s.size),
              stat: s,
              isDirectory: s.isDirectory(),
              isImage: isImage(file),
              icon: iconLookup(file, s.isDirectory())
            };
          });
          files = files.filter(navigate(files, up, down));
          files.sort(fileSort);

          // content-negotiation
          var accept = accepts(req);
          var type = accept.type(mediaTypes);

          // not acceptable
          if (!type) return next(createError(406));
          var crumbsRoot = originalDir.repl;
          exports[mediaType[type]](req, res, next, files, originalDir, icons, up, down, o);
        });
      });
    });


  });

  return router;
};

/**
 * Respond with text/html.
 */

exports.html = function(req, res, next, files, dir, icons, up, down, o) {

  var search = parseUrl.original(req).search;

  res.locals.files = files;
  res.locals.crumbs = up ? breadCrumbs(dir, up, search) : [];
  res.locals.list = typeof req.query.list !== 'undefined';

  var wrap = Wrap(o);

  wrap
    .place(req.place || o.place)
    .load(res.locals, function(err, result) {
      debug('route loaded', result);
      if (err) return next(err);
      res.send(result.page);
    })
  ;

};

/**
 * Respond with application/json.
 */

exports.json = function(req, res, next, files) {
  var body = JSON.stringify(files);
  var buf = new Buffer(body, 'utf8');

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', buf.length);
  res.end(buf);
};

/**
 * Respond with text/plain.
 */

exports.plain = function(req, res, next, files) {
  var names = files.map(function(file) {
    return file.name
  });
  var body = names.join('\n') + '\n';
  var buf = new Buffer(body, 'utf8');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Length', buf.length);
  res.end(buf);
};

/**
 * Normalizes the path separator from system separator
 * to URL separator, aka `/`.
 *
 * @param {String} path
 * @return {String}
 * @api private
 */

function normalizeSlashes(path) {
  return path.split(sep).join('/');
}

/**
 * Stat all files and return array of stat
 * in same order.
 */

function statFiles(dir, files, cb) {
  var batch = new Batch();

  batch.concurrency(10);

  files.forEach(function(file) {
    batch.push(function(done) {
      fs.stat(join(dir, file), function(err, stat) {
        if (err && err.code !== 'ENOENT') return done(err);

        // pass ENOENT as null stat, not error
        done(null, stat || null);
      });
    });
  });

  batch.end(cb);
}

/**
 * Sort function for with directories first.
 */

function fileSort(a, b) {
  return Number(b.name === '..') - Number(a.name === '') ||
    Number(b.stat && b.stat.isDirectory()) - Number(a.stat && a.stat.isDirectory()) ||
    Number(a.isImage) - Number(b.isImage) ||
    String(a.name).toLocaleLowerCase().localeCompare(String(b.name).toLocaleLowerCase());
}

/**
 * Filter "hidden" `files`, aka files
 * beginning with a `.`.
 *
 * @param {Array} files
 * @return {Array}
 * @api private
 */

function removeHidden(files) {
  return files.filter(function(file) {
    return '.' != file[0];
  });
}
/**
 * Determines whether navigating up or down the folder hierarchy is allowed.
 */

function navigate(file, up, down) {
  return function(file) {
    return !file.stat || !file.stat.isDirectory() || file.name == '..' && up || down;
  };
}

function getLink(name, isDirectory, dir, serveDir, search) {
  search = isDirectory ? search || '' : '';
  var d = isDirectory ? dir : serveDir;
  var p = d.split('/').map(function(c) {
    return encodeURIComponent(c);
  });
  if (name && name === '..') {
    var last = p.pop();
    if (last === '') p.pop();
  } else {
    p.push(encodeURIComponent(name));
  }
  return escapeHtml(normalizeSlashes(normalize(p.join('/')))) + search;
}

/**
 * Map html `dir`, returning a linked path.
 */

function breadCrumbs(dir, up, search) {
  search = search || '';
  var parts = dir.split('/');
  crumbs = [];
  if (up === false) return crumbs;

  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];

    parts[i] = encodeURIComponent(part);

    if (part) {
      crumbs.push({
        name: escapeHtml(part),
        href: escapeHtml(parts.slice(0, i + 1).join('/')) + search,
        last: i == (parts.length - 1) || !parts[i + 1]
      });
    }

  }

  return crumbs;
}

/**
 * Image can be displayed in html
 */

function isImage(name) {
  return ['svg', 'png', 'jpg', 'jpeg', 'bmp', 'gif'].some(function(type) {
    return new RegExp('\.' + type + '$', 'i').test(name);
  });
}

/**
 * Get the icon data for the file name.
 */

function iconLookup(filename, isDirectory) {

  // is directory
  if (isDirectory) {
    return {
      className: 'filemanager-icon-directory',
      fileName: icons.folder
    }
  }

  var ext = extname(filename);

  // try by extension
  if (icons[ext]) {
    return {
      className: 'filemanager-icon-' + ext.substring(1),
      fileName: icons[ext]
    };
  }

  var mimetype = mime.lookup(ext);

  // default if no mime type
  if (mimetype === false) {
    return {
      className: 'filemanager-icon-default',
      fileName: icons.default
    };
  }

  // try by mime type
  if (icons[mimetype]) {
    return {
      className: 'filemanager-icon-' + mimetype.replace('/', '-'),
      fileName: icons[mimetype]
    };
  }

  var suffix = mimetype.split('+')[1];

  if (suffix && icons['+' + suffix]) {
    return {
      className: 'filemanager-icon-' + suffix,
      fileName: icons['+' + suffix]
    };
  }

  var type = mimetype.split('/')[0];

  // try by type only
  if (icons[type]) {
    return {
      className: 'filemanager-icon-' + type,
      fileName: icons[type]
    };
  }

  return {
    className: 'filemanager-icon-default',
    fileName: icons.default
  };
}

/**
 * Icon map.
 */

var icons = {
  // base icons
  'default': 'page_white.png',
  'folder': 'folder.png',

  // generic mime type icons
  'image': 'image.png',
  'text': 'page_white_text.png',
  'video': 'film.png',

  // generic mime suffix icons
  '+json': 'page_white_code.png',
  '+xml': 'page_white_code.png',
  '+zip': 'box.png',

  // specific mime type icons
  'application/font-woff': 'font.png',
  'application/javascript': 'page_white_code_red.png',
  'application/json': 'page_white_code.png',
  'application/msword': 'page_white_word.png',
  'application/pdf': 'page_white_acrobat.png',
  'application/postscript': 'page_white_vector.png',
  'application/rtf': 'page_white_word.png',
  'application/vnd.ms-excel': 'page_white_excel.png',
  'application/vnd.ms-powerpoint': 'page_white_powerpoint.png',
  'application/vnd.oasis.opendocument.presentation': 'page_white_powerpoint.png',
  'application/vnd.oasis.opendocument.spreadsheet': 'page_white_excel.png',
  'application/vnd.oasis.opendocument.text': 'page_white_word.png',
  'application/x-7z-compressed': 'box.png',
  'application/x-sh': 'application_xp_terminal.png',
  'application/x-font-ttf': 'font.png',
  'application/x-msaccess': 'page_white_database.png',
  'application/x-shockwave-flash': 'page_white_flash.png',
  'application/x-sql': 'page_white_database.png',
  'application/x-tar': 'box.png',
  'application/x-xz': 'box.png',
  'application/xml': 'page_white_code.png',
  'application/zip': 'box.png',
  'image/svg+xml': 'page_white_vector.png',
  'text/css': 'page_white_code.png',
  'text/html': 'page_white_code.png',
  'text/less': 'page_white_code.png',

  // other, extension-specific icons
  '.accdb': 'page_white_database.png',
  '.apk': 'box.png',
  '.app': 'application_xp.png',
  '.as': 'page_white_actionscript.png',
  '.asp': 'page_white_code.png',
  '.aspx': 'page_white_code.png',
  '.bat': 'application_xp_terminal.png',
  '.bz2': 'box.png',
  '.c': 'page_white_c.png',
  '.cab': 'box.png',
  '.cfm': 'page_white_coldfusion.png',
  '.clj': 'page_white_code.png',
  '.cc': 'page_white_cplusplus.png',
  '.cgi': 'application_xp_terminal.png',
  '.cpp': 'page_white_cplusplus.png',
  '.cs': 'page_white_csharp.png',
  '.db': 'page_white_database.png',
  '.dbf': 'page_white_database.png',
  '.deb': 'box.png',
  '.dll': 'page_white_gear.png',
  '.dmg': 'drive.png',
  '.docx': 'page_white_word.png',
  '.erb': 'page_white_ruby.png',
  '.exe': 'application_xp.png',
  '.fnt': 'font.png',
  '.gam': 'controller.png',
  '.gz': 'box.png',
  '.h': 'page_white_h.png',
  '.ini': 'page_white_gear.png',
  '.iso': 'cd.png',
  '.jar': 'box.png',
  '.java': 'page_white_cup.png',
  '.jsp': 'page_white_cup.png',
  '.lua': 'page_white_code.png',
  '.lz': 'box.png',
  '.lzma': 'box.png',
  '.m': 'page_white_code.png',
  '.map': 'map.png',
  '.msi': 'box.png',
  '.mv4': 'film.png',
  '.otf': 'font.png',
  '.pdb': 'page_white_database.png',
  '.php': 'page_white_php.png',
  '.pl': 'page_white_code.png',
  '.pkg': 'box.png',
  '.pptx': 'page_white_powerpoint.png',
  '.psd': 'page_white_picture.png',
  '.py': 'page_white_code.png',
  '.rar': 'box.png',
  '.rb': 'page_white_ruby.png',
  '.rm': 'film.png',
  '.rom': 'controller.png',
  '.rpm': 'box.png',
  '.sass': 'page_white_code.png',
  '.sav': 'controller.png',
  '.scss': 'page_white_code.png',
  '.srt': 'page_white_text.png',
  '.tbz2': 'box.png',
  '.tgz': 'box.png',
  '.tlz': 'box.png',
  '.vb': 'page_white_code.png',
  '.vbs': 'page_white_code.png',
  '.xcf': 'page_white_picture.png',
  '.xlsx': 'page_white_excel.png',
  '.yaws': 'page_white_code.png'
};
