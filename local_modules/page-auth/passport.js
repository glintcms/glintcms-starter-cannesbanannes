var _ = require('lodash');
var passport = require('passport');
var InstagramStrategy = require('passport-instagram').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GitHubStrategy = require('passport-github').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var OAuthStrategy = require('passport-oauth').OAuthStrategy;
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

var secrets = require('./secrets');
var User = require('./model');

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, model) {
    if (!model) return done(err);
    done(err, model.toJSON());
  });
});

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({usernameField: 'email'}, function (email, password, done) {
  email = email.toLowerCase();
  User.findOne({email: email}, function (err, model) {
    if (err) return done(null, false, {message: 'Uups, an error occured, please try again later'});
    if (!model) return done(null, false, {message: 'Email ' + email + ' not found'});
    User.authenticate(model, password, function (err, model) {
      if (model) {
        return done(null, model.toJSON());
      } else {
        return done(null, false, {message: 'Invalid email or password.'});
      }
    });
  });
}));

/**
 * Sign in with Instagram.
 */
passport.use(new InstagramStrategy(secrets.instagram, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({instagram: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already an Instagram account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.instagram(profile.id);
          user.tokens(user.tokens().push({kind: 'instagram', accessToken: accessToken}));
          user.profileName(user.profileName || profile.displayName);
          user.profilePicture(user.profilePicture || profile._json.data.profile_picture);
          user.profileWebsite(user.profileWebsite || profile._json.data.website);
          user.save(function (err) {
            req.flash('info', {msg: 'Instagram account has been linked.'});
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({instagram: profile.id}, function (err, existingUser) {
      if (existingUser) return done(null, existingUser);

      var user = new User();
      user.instagram(profile.id);
      user.tokens(user.tokens().push({kind: 'instagram', accessToken: accessToken}));
      // Similar to Twitter API, assigns a temporary e-mail address
      // to get on with the registration process. It can be changed later
      // to a valid e-mail address in Profile Management.
      user.email(profile.username + "@instagram.com");
      user.profileName(profile.displayName);
      user.profileWebsite(profile._json.data.website);
      user.profilePicture(profile._json.data.profile_picture);
      user.save(function (err) {
        done(err, user);
      });
    });
  }
}));

/**
 * OAuth Strategy Overview
 *
 * - User is already logged in.
 *   - Check if there is an existing account with a provider id.
 *     - If there is, return an error message. (Account merging not supported)
 *     - Else link new OAuth account with currently logged-in user.
 * - User is not logged in.
 *   - Check if it's a returning user.
 *     - If returning user, sign in and we are done.
 *     - Else check if there is an existing account with user's email.
 *       - If there is, return an error message.
 *       - Else create a new account.
 */

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy(secrets.facebook, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({facebook: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.facebook(profile.id);
          user.tokens(user.tokens().push({kind: 'facebook', accessToken: accessToken}));
          user.profileName(user.profile.name || profile.displayName);
          user.profileGender(user.profile.gender || profile._json.gender);
          user.profilePicture(user.profile.picture || 'https://graph.facebook.com/' + profile.id + '/picture?type=large');
          user.save(function (err) {
            req.flash('info', {msg: 'Facebook account has been linked.'});
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({facebook: profile.id}, function (err, existingUser) {
      if (existingUser) return done(null, existingUser);
      User.findOne({email: profile._json.email}, function (err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', {msg: 'There is already an account using this email address. Sign in to that account and link it with Facebook manually from Account Settings.'});
          done(err);
        } else {
          var user = new User();
          user.email(profile._json.email);
          user.facebook(profile.id);
          user.tokens(user.tokens().push({kind: 'facebook', accessToken: accessToken}));
          user.profileName(profile.displayName);
          user.profileGender(profile._json.gender);
          user.profilePicture('https://graph.facebook.com/' + profile.id + '/picture?type=large');
          user.profileLocation((profile._json.location) ? profile._json.location.name : '');
          user.save(function (err) {
            done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with GitHub.
 */
passport.use(new GitHubStrategy(secrets.github, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({github: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already a GitHub account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.github(profile.id);
          user.tokens(user.tokens().push({kind: 'github', accessToken: accessToken}));
          user.profileName(user.profile.name || profile.displayName);
          user.profilePicture(user.profile.picture || profile._json.avatar_url);
          user.profileLocation(user.profile.location || profile._json.location);
          user.profileWebsite(user.profile.website || profile._json.blog);
          user.save(function (err) {
            req.flash('info', {msg: 'GitHub account has been linked.'});
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({github: profile.id}, function (err, existingUser) {
      if (existingUser) return done(null, existingUser);
      User.findOne({email: profile._json.email}, function (err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', {msg: 'There is already an account using this email address. Sign in to that account and link it with GitHub manually from Account Settings.'});
          done(err);
        } else {
          var user = new User();
          user.email(profile._json.email);
          user.github(profile.id);
          user.tokens(user.tokens().push({kind: 'github', accessToken: accessToken}));
          user.profileName(profile.displayName);
          user.profilePicture(profile._json.avatar_url);
          user.profileLocation(profile._json.location);
          user.profileWebsite(profile._json.blog);
          user.save(function (err) {
            done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with Twitter.
 */

passport.use(new TwitterStrategy(secrets.twitter, function (req, accessToken, tokenSecret, profile, done) {
  if (req.user) {
    User.findOne({twitter: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.twitter(profile.id);
          user.tokens(user.tokens().push({kind: 'twitter', accessToken: accessToken, tokenSecret: tokenSecret}));
          user.profileName(user.profileName || profile.displayName);
          user.profileLocation(user.profileLocation || profile._json.location);
          user.profilePicture(user.profilePicture || profile._json.profile_image_url_https);
          user.save(function (err) {
            req.flash('info', {msg: 'Twitter account has been linked.'});
            done(err, user);
          });
        });
      }
    });

  } else {
    User.findOne({twitter: profile.id}, function (err, existingUser) {
      if (existingUser) return done(null, existingUser);
      var user = new User();
      // Twitter will not provide an email address.  Period.
      // But a person’s twitter username is guaranteed to be unique
      // so we can "fake" a twitter email address as follows:
      user.email(profile.username + "@twitter.com");
      user.twitter(profile.id);
      user.tokens(user.tokens().push({kind: 'twitter', accessToken: accessToken, tokenSecret: tokenSecret}));
      user.profileName(profile.displayName);
      user.profileLocation(profile._json.location);
      user.profilePicture(profile._json.profile_image_url_https);
      user.save(function (err) {
        done(err, user);
      });
    });
  }
}));

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy(secrets.google, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({google: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already a Google account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.google(profile.id);
          user.tokens(user.tokens().push({kind: 'google', accessToken: accessToken}));
          user.profileName(user.profileName || profile.displayName);
          user.profileGender(user.profileGender || profile._json.gender);
          user.profilePicture(user.profilePicture || profile._json.picture);
          user.save(function (err) {
            req.flash('info', {msg: 'Google account has been linked.'});
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({google: profile.id}, function (err, existingUser) {
      if (existingUser) return done(null, existingUser);
      User.findOne({email: profile._json.email}, function (err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', {msg: 'There is already an account using this email address. Sign in to that account and link it with Google manually from Account Settings.'});
          done(err);
        } else {
          var user = new User();
          user.email(profile._json.email);
          user.google(profile.id);
          user.tokens(user.tokens().push({kind: 'google', accessToken: accessToken}));
          user.profileName(profile.displayName);
          user.profileGender(profile._json.gender);
          user.profilePicture(profile._json.picture);
          user.save(function (err) {
            done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Sign in with LinkedIn.
 */
passport.use(new LinkedInStrategy(secrets.linkedin, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findOne({linkedin: profile.id}, function (err, existingUser) {
      if (existingUser) {
        req.flash('errors', {msg: 'There is already a LinkedIn account that belongs to you. Sign in with that account or delete it, then link it with your current account.'});
        done(err);
      } else {
        User.findById(req.user.id, function (err, user) {
          user.linkedin(profile.id);
          user.tokens(user.tokens().push({kind: 'linkedin', accessToken: accessToken}));
          user.profileName(user.profileName || profile.displayName);
          user.profileLocation(user.profileLocation || profile._json.location.name);
          user.profilePicture(user.profilePicture || profile._json.pictureUrl);
          user.profileWebsite(user.profileWebsite || profile._json.publicProfileUrl);
          user.save(function (err) {
            req.flash('info', {msg: 'LinkedIn account has been linked.'});
            done(err, user);
          });
        });
      }
    });
  } else {
    User.findOne({linkedin: profile.id}, function (err, existingUser) {
      if (existingUser) return done(null, existingUser);
      User.findOne({email: profile._json.emailAddress}, function (err, existingEmailUser) {
        if (existingEmailUser) {
          req.flash('errors', {msg: 'There is already an account using this email address. Sign in to that account and link it with LinkedIn manually from Account Settings.'});
          done(err);
        } else {
          var user = new User();
          user.linkedin(profile.id);
          user.tokens(user.tokens().push({kind: 'linkedin', accessToken: accessToken}));
          user.email(profile._json.emailAddress);
          user.profileName(profile.displayName);
          user.profileLocation(profile._json.location.name);
          user.profilePicture(profile._json.pictureUrl);
          user.profileWebsite(profile._json.publicProfileUrl);
          user.save(function (err) {
            done(err, user);
          });
        }
      });
    });
  }
}));

/**
 * Tumblr API OAuth.
 */
passport.use('tumblr', new OAuthStrategy({
    requestTokenURL: 'http://www.tumblr.com/oauth/request_token',
    accessTokenURL: 'http://www.tumblr.com/oauth/access_token',
    userAuthorizationURL: 'http://www.tumblr.com/oauth/authorize',
    consumerKey: secrets.tumblr.consumerKey,
    consumerSecret: secrets.tumblr.consumerSecret,
    callbackURL: secrets.tumblr.callbackURL,
    passReqToCallback: true
  },
  function (req, token, tokenSecret, profile, done) {
    User.findById(req.user._id, function (err, user) {
      user.tokens(user.tokens().push({kind: 'tumblr', accessToken: token, tokenSecret: tokenSecret}));
      user.save(function (err) {
        done(err, user);
      });
    });
  }
));

/**
 * Foursquare API OAuth.
 */
passport.use('foursquare', new OAuth2Strategy({
    authorizationURL: 'https://foursquare.com/oauth2/authorize',
    tokenURL: 'https://foursquare.com/oauth2/access_token',
    clientID: secrets.foursquare.clientId,
    clientSecret: secrets.foursquare.clientSecret,
    callbackURL: secrets.foursquare.redirectUrl,
    passReqToCallback: true
  },
  function (req, accessToken, refreshToken, profile, done) {
    User.findById(req.user._id, function (err, user) {
      user.tokens(user.tokens().push({kind: 'foursquare', accessToken: accessToken}));
      user.save(function (err) {
        done(err, user);
      });
    });
  }
));

/**
 * Venmo API OAuth.
 */
passport.use('venmo', new OAuth2Strategy({
    authorizationURL: 'https://api.venmo.com/v1/oauth/authorize',
    tokenURL: 'https://api.venmo.com/v1/oauth/access_token',
    clientID: secrets.venmo.clientId,
    clientSecret: secrets.venmo.clientSecret,
    callbackURL: secrets.venmo.redirectUrl,
    passReqToCallback: true
  },
  function (req, accessToken, refreshToken, profile, done) {
    User.findById(req.user._id, function (err, user) {
      user.tokens(user.tokens().push({kind: 'venmo', accessToken: accessToken}));
      user.save(function (err) {
        done(err, user);
      });
    });
  }
));

/**
 * Login Required middleware.
 */
exports.isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

/**
 * Authorization Required middleware.
 */
exports.isAuthorized = function (req, res, next) {
  var provider = req.path.split('/').slice(-1)[0];

  if (_.find(req.user.tokens, {kind: provider})) {
    next();
  } else {
    res.redirect('/auth/' + provider);
  }
};
