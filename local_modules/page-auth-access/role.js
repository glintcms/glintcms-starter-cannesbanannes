/**
 * Module dependencies.
 */
var debug = require('debug')('page-auth-access:role');
var defaults = require('defaults');

var c = require('./config');
var Role = require('./role-model');

module.exports = function role(o) {
  o = defaults(o, c);

  function loadRole(req, callback) {
    var id = req.user ? req.user.id : null;
    if (!id) return callback(new Error('ENOUSERID'));
    Role.findById(id, function(err, model){
      if (err) return callback(err);
      callback(err, model.toJSON());
    });
  };

  o.loadRole = o.loadRole || loadRole;

  // role middleware
  return function getRoles(req, res, next) {

    // userIs for use in server side tepmlates.
    req.userIs = function(role) {
      return req[o.roleProperty] && req[o.roleProperty][role];
    };

    // nothing to do if there is no user or the role property already exists on the `req` object.
    if (!req[o.userProperty] || req[o.roleProperty]) return next();

    o.loadRole(req, function(err, role) {
      if (err) {
        debug('could not get user access role for user', req.user, err);
        return next();
      }
      if (!role) {
        debug('user has no role');
        return next();
      }

      if (!role.roles) {
        debug('no roles property found in user role', roles);
        return next();
      }

      // store role lookup object
      var rolesString, rolesArray;
      var roles = role.roles;
      if (Array.isArray(roles)) {
        rolesArray = roles;
        rolesString = roles.join(',');
      } else if (typeof roles === 'string') {
        rolesArray = roles.split(/[,; ]/);
        rolesString = roles;
      } else {
        debug('wrong roles format. must be either Array or String.', roles);
        return next();
      }

      var rolesObject = {};
      rolesArray.forEach(function(role) {
        rolesObject[role] = true;
      });

      req[o.roleProperty] = rolesObject;
      req[o.roleStringProperty] = rolesString;

      next();
    });

  }

}

