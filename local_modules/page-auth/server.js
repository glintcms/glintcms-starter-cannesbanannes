/**
 * Module dependencies.
 */
var debug = require('debug')('page-auth');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var path = require('path');
var passport = require('passport');
var expressValidator = require('express-validator');
var defaults = require('defaults');

var c = require('./config');

/**
 * Controllers (route handlers).
 */
var UserController = require('./controller');

/**
 * API keys and Passport configuration.
 */
var secrets = require('./secrets');
var passportConf = require('./passport');

/**
 * Create Express server and roles.
 */
var app = express();
var passportRoutes = express();
var authenticatonRoutes = express.Router();

function auth(o) {
  o = defaults(o, c);

  var userController = UserController(o);

  /**
   * Express app (passport session) configuration.
   */
    // make sure you have got glint-session middleware called before this module in order to have session support
  passportRoutes.use(bodyParser.urlencoded({extended: true}));
  passportRoutes.use(passport.initialize());
  passportRoutes.use(passport.session());

  /**
   * Express app (user authentication) configuration.
   */
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(expressValidator());
  app.use(methodOverride());

  app.use(flash());

  app.use(function(req, res, next) {
    res.locals.context = res.locals.context || {};
    res.locals.user = req.user;
    res.locals.gravatar = userController.gravatar;
    res.locals.messages = req.flash();
    next();
  });

  /**
   * Primary app routes.
   */
  app.get('/login', userController.getLogin);
  app.post('/login', userController.postLogin);
  app.get('/logout', userController.logout);
  app.get('/forgot', userController.getForgot);
  app.post('/forgot', userController.postForgot);
  app.get('/reset/:token', userController.getReset);
  app.post('/reset/:token', userController.postReset);
  app.get('/signup', userController.getSignup);
  app.post('/signup', userController.postSignup);
  app.get('/signin', userController.getSignin);
  app.get('/account', passportConf.isAuthenticated, userController.getAccount);
  app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
  app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
  app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
  app.get('/account/unlink/:provider', passportConf.isAuthenticated, userController.getOauthUnlink);

  /**
   * OAuth authentication routes. (Sign in)
   */
  authenticatonRoutes.get('/auth/instagram', passport.authenticate('instagram'));
  authenticatonRoutes.get('/auth/instagram/callback', passport.authenticate('instagram', {failureRedirect: '/login'}), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });
  authenticatonRoutes.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email', 'user_location']}));
  authenticatonRoutes.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/login'}), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });
  authenticatonRoutes.get('/auth/github', passport.authenticate('github'));
  authenticatonRoutes.get('/auth/github/callback', passport.authenticate('github', {failureRedirect: '/login'}), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });
  authenticatonRoutes.get('/auth/google', passport.authenticate('google', {scope: 'profile email'}));
  authenticatonRoutes.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/login'}), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });
  authenticatonRoutes.get('/auth/twitter', passport.authenticate('twitter'));
  authenticatonRoutes.get('/auth/twitter/callback', passport.authenticate('twitter', {failureRedirect: '/login'}), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });
  authenticatonRoutes.get('/auth/linkedin', passport.authenticate('linkedin', {state: 'SOME STATE'}));
  authenticatonRoutes.get('/auth/linkedin/callback', passport.authenticate('linkedin', {failureRedirect: '/login'}), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  });

  /**
   * return the express apps/routes array.
   */
  return {
    all: [passportRoutes, app, authenticatonRoutes],
    session: passportRoutes,
    user: app,
    oauth: authenticatonRoutes
  }
}


/**
 * expose auth (express app).
 */
module.exports = auth;

