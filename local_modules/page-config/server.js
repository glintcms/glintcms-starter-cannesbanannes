var debug = require('debug')('page-config');
var defaults = require('defaults');

var c = require('./config');

module.exports = function config(o) {
  o = defaults(o, c);

  /**
   * removes server options and non string options
   * @param key
   * @param value
   * @returns {*}
   */
  function replacer(key, value) {

    if (typeof value === "function") {
      return undefined;
    }

    if (key === 'server') {
      return undefined;
    }

    return value;
  }

  var clientOptions = {};
  try {
    var str = JSON.stringify(o, replacer, 2);
    clientOptions = JSON.parse(str);
  } catch (e) {
    debug('error while preparing client options' + e.message);
  }

  /**
   * client options middle ware function
   */
  o.routes = function(req, res, next) {
    res.locals.context = res.locals.context || {};
    res.locals.context.options = res.locals.context.options || {};
    res.locals.context.options = defaults(res.locals.context.options, clientOptions);
    debug('options', clientOptions);
    next();
  };

  return o;
};

