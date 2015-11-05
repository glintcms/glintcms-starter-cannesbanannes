/**
 * Module dependencies.
 */
var Adapter = require('glint-adapter');
var Dates = require('glint-plugin-adapter-dates');
var PageAdapter = require('page-adapter');

var adapter = Adapter(PageAdapter()).db('glint').type('config').use(Dates());

module.exports = adapter;


