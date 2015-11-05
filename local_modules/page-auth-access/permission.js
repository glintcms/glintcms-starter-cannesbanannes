/**
 * Module dependencies.
 */
var debug = require('debug')('page-auth-access:permission');
var defaults = require('defaults');
var merge = require('utils-merge');

var c = require('./config');
var Permission = require('./permission-model');

function loadPermission(callback) {
  Permission.load('permission', callback);
}

module.exports = function permission(o) {
  o = defaults(o, c);

  var error, lookup = {}, cache = {};

  // load permissions
  o.loadPermission = o.loadPermission || loadPermission;
  o.loadPermission(function(err, permission) {

    if (err) return error = err;

    Object.keys(permission).forEach(function(key) {
      var grants = permission[key];
      if (typeof grants === 'string') {
        grants = grants.split(/[,; ]/)
      }

      // make grant object instead of an array for faster lookup
      var grant = {};
      grants.forEach(function(g) {
        grant[g] = true;
      });
      lookup[key] = grant;

    });

  });

  // permission middleware
  return function getPermissions(req, res, next) {

    if (req[o.permissionProperty]) return next(); // only add permissions once

    if (!lookup) {
      debug('no permission definition found yet.');
      return next();
    }

    var roles = req[o.roleProperty];
    var rolesString = req[o.roleStringProperty];
    if (!roles) {
      debug('no user role found.');
      return next();
    }

    var permissions = {};

    if (rolesString && cache[rolesString]) {
      req[o.permissionProperty] = cache[rolesString];
      return next();
    }

    Object.keys(roles).forEach(function(role) {
      // merge permissions for the user's roles into a new object.
      merge(permissions, lookup[role]);
    })

    req[o.permissionProperty] = cache[rolesString] = permissions;
    next();

  }

}
