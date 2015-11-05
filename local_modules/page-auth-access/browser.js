var debug = require('debug')('page-auth-access');

var c = require('./config');

exports.userCan = exports.can = function(permission) {
  if (!permission) return false;
  if (typeof permission !== 'string') return false;
  if (typeof window === 'undefined') return false;
  if (!window.context) return false;
  if (!window.context[c.permissionProperty]) return false;
  return window.context[c.permissionProperty][permission];
};

exports.userIs = exports.is = function(role) {
  if (!role) return false;
  if (typeof role !== 'string') return false;
  if (typeof window === 'undefined') return false;
  if (!window.context) return false;
  if (!window.context[c.roleProperty]) return false;
  return window.context[c.roleProperty][role];
};
