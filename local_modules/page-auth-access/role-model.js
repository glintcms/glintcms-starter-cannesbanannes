var Adapter = require('glint-adapter');
var Dates = require('glint-plugin-adapter-dates');
var PageAdapter = require('page-adapter');
var model = require('modella');
var Storage = require('modella-glint');

var adapter = Adapter(PageAdapter()).db('glint').use(Dates());

// define schema
var Role = model('role');

Role
  .attr('id', {required: true})
  .attr('roles', {required: true, defaultValue: ''})
  .attr('grant', {required: true, defaultValue: ''})
  .attr('revoke', {required: true, defaultValue: ''})

Role.on('saving', function(user, done) {
  return done();
});

// add methods
Role.findById = function(id, fn) {
  Role.load(id, fn);
};

Role.findOne = function(query, fn) {
  Role.find(query, function(err, result) {
    if (err) return fn(err);
    if (result.length > 0) return fn(null, result[0]);
    return fn(null, null);
  });
};

Role.use(Storage(adapter))

exports = module.exports = Role;
