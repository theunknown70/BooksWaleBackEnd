var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');
const cors = require('./cors');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config');
const { OAuth2Client } = require('google-auth-library');
const { response } = require('express');

const client = new OAuth2Client(config.google.clientId)

var router = express.Router();
router.use(express.json());

/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.find({})
    .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
    }, (err) => next(err))
    .catch((err) => next(err));
});

router.get('/logout', cors.corsWithOptions, (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

router.post('/googleLogin', cors.corsWithOptions, (req, res) => {
  const { tokenId } = req.body;
  client.verifyIdToken({ idToken: tokenId, audience: config.google.clientId }).then((response) => {
    console.log(response.payload, "data")
    const { email_verified, name, email } = response.payload;
    console.log(tokenId)
    if (email_verified) {
      User.findOne({ username: response.payload.email }).exec((err, user) => {
        if (err) {
          res.statusCode = 400;
          res.json({
            error: "Something went wrong"
          })
        } else {
          if (user) {
            const token = authenticate.getToken({ _id: user._id });
            res.json({
              token,
              user: { user }
            })
          } else {
            user = new User({
              username: response.payload.email,
              //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
            });
            user.save()
              .then((user) => {
                if (user) {
                  const token = authenticate.getToken({ _id: user._id });
                  res.json({
                    token,
                    user: { user }
                  })
                }else{
                  res.statusCode=400;
                  res.json("some error occured")
                }
              })
          }
        }
      })
    }
  })
})

// router.get('/auth/google',
//   passport.authenticate('google', { scope: ['email'] }), (req, res) => {
//   });

// router.get('/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/dishes' }),
//   function (req, res) {
//     // Successful authentication, redirect home.
//     if (req.user) {
//       var token = authenticate.getToken({ _id: req.user._id });
//       res.statusCode = 200;
//       res.setHeader('Content-Type', 'application/json');
//       res.json({ success: true, token: token, status: 'You are successfully logged in!' });
//     }
//     res.redirect('/leaders');
//   });

router.get('/checkJWTtoken', cors.corsWithOptions, (req, res) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: 'JWT invalid!', success: false, err: info });
    }
    else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({ status: 'JWT valid!', success: true, user: user });
    }
  })(req, res);
});

module.exports = router;
