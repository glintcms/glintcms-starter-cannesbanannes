var test = require('tape');
var User = require('../model');

test('create user', function (t) {
  t.plan(1);

  var user = new User();
  t.true(user);

});

test('save user', function (t) {
  t.plan(2);

  var user = new User({
    email: 'a@b.com',
    password: '1234',
    tokens: 'asdf'
  });

  user.save(function (err, result) {
    t.false(err);
    t.true(result);
  });

});

test('find user with id and authenticate', function (t) {
  t.plan(5);

  User.findOne({email: 'a@b.com'}, function (err, model) {
    t.false(err);
    var user = model.toJSON();
    var id = user.id;
    t.notEqual(user.password, '1234');

    User.authorize(model, '1234', function (err, model) {
      t.false(err);
      var user = model.toJSON();
      t.equal(user.tokens, 'asdf');
      t.equal(user.id, id);
    });

  });

});

test('deny user', function (t) {
  t.plan(4);

  User.findOne({email: 'a@b.com'}, function (err, model) {
    t.false(err);
    var user = model.toJSON();
    var id = user.id;
    t.notEqual(user.password, '1234');

    User.authorize(id, 'aaa', function (err, model) {
      t.false(err);
      t.false(model);
    });

  });

});
