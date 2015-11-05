/**
 * Module dependencies.
 */
var merge = require('utils-merge');
var wildcard = require('wildcard');

// access function
function access(options) {

  var rules = [];

  // access control middleware
  function middleware(options) {
    options = options || {};
    var permissionProperty = options.permissionProperty || access.permissionProperty || 'userPermission';

    return function accessMiddleware(req, res, next) {

      // variables
      var method = req.method;
      var path = req.originalUrl.split(/[?#]/)[0];
      var userPermission = req[permissionProperty];

      // res.locals userCan property for things like templates.
      req.userCan = function(permission) {
        return !hasPermission(userPermission, permission);
      }

      //method: wildcard(req, def)
      //path: wildcard(def, req)
      //permission: wildcard(def, req)

      // procedure description:
      // iterate over rules, check if:
      // 1. the method/path matches and if so,
      // 2. check if the permission matches: yes: next(), no: call next(403)

      if (!rules || rules.length === 0) return next();

      var i;
      for (i = 0; i < rules.length; i++) {
        var rule = rules[i];

        // check rule arguments:
        if (!rule.length || rule.length < 3 || rule.length > 4) {
          return next(new TypeError('wrong access rule definition. must have 3 or 4 arguments.'));
        }

        // check method (1.argument)
        if (typeof rule[0] === 'string') rule[0] = rule[0].split(/[,; ]/);
        if (!wildcard(method, rule[0], /[,; ]/) && rule[0] !== '*') continue; // with next rule

        // path (2.argument)
        if (!wildcard(rule[1], path, /\//)) continue; // with next rule

        // where (4.argument) optional
        if (rule.length > 3) {
          return next(new TypeError('access rule `where` argument 4, is not yet implemented'));
        }

        // permission (3.argument)
        // so method and path matched, now the permission has to match to, otherwise access is denied -> 403
        return next(hasPermission(userPermission, rule[2]));

      }

      // no matching access definition
      return next(403);
    }
  }

  // single route middleware
  function restrict(routePermission) {
    var permissionProperty = access.permissionProperty || 'userPermission';

    return function allowRoute(req, res, next) {
      next(hasPermission(req[permissionProperty], routePermission));
    }
  }

  // general permission query function
  function hasPermission(userPermission, routePermission) {
    // permission (3.argument)
    // so method and path matched, now the permission has to match to, otherwise access is denied -> 403
    if (routePermission === '*') return undefined; // with next rule
    if (!userPermission) return 403;

    if (typeof routePermission === 'string') {
      routePermission = routePermission.split(/[,; ]/)
    }
    if (!Array.isArray(routePermission)) {
      return new TypeError('wrong permission format: ' + routePermission);
    }

    var allow = routePermission.some(function(p) {
      if (p === '*') return true;
      if (userPermission[p]) return true;
      if (userPermission[p.split(':')[0]]) return true;
      return false;
    });
    if (!allow) return 403;
    return undefined;

  }

  // adding rules function
  access = function access() {
    var args = [].slice.call(arguments);
    if (args.length === 1 && Array.isArray(args[0])) {
      var entries = args[0];
      var multiple = entries.every(function(entry) {
        return Array.isArray(entry);
      });
      if (multiple) {
        // multiple rules provided via array
        rules = entries;
      } else {
        // single rule provided via array
        rules.push(args[0]);
      }

    } else {
      // single rule provided via parameters
      rules.push(args)
    }
  };
  access.rules = rules;
  access.middleware = middleware;
  access.restrict = restrict;

  //// when this function is called the first time: save options / or rules
  //if (options) {
  //  if (typeof options === 'object' && !Array.isArray(options)) {
  //    // save options
  //    merge(access, options);
  //  } else {
  //    // add rules
  //    var args = [].slice.call(arguments);
  //    access.apply(null, args);
  //  }
  //}

  return access;

}

/**
 * expose access
 */
module.exports = access;


