var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/user');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var FacebookTokenStrategy = require('passport-facebook-token');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var config = require('./config.js');
const {OAuth2Client}=require('google-auth-library');

const client=new OAuth2Client(config.google.clientId)

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function (user) {
     const token = jwt.sign(user, config.secretKey,
        { expiresIn: 3600 });
        return token
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts,
    (jwt_payload, done) => {
        console.log("JWT payload: ", jwt_payload);
        User.findOne({ _id: jwt_payload._id }, (err, user) => {
            if (err) {
                return done(err, false);
            }
            else if (user) {
                return done(null, user);
            }
            else {
                return done(null, false);
            }
        });
    }));

exports.verifyUser = passport.authenticate('jwt', { session: false });

exports.verifyAdmin = function (req, res, next) {
    if (req.user.admin) {
        next();
    }
    else {
        err = new Error('You are not authorized to perform this operation!');
        err.status = 403;
        return next(err);
    }
};

exports.googlePassport = passport.use(new GoogleStrategy({
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: "https://localhost:3443/users/auth/google/callback"
},
    function (accessToken, refreshToken, email, done) {
        User.findOne({
            'googleId': email.id
        }, function (err, user) {
            console.log(email);
            if (err) {
                return done(err);
            }
            //No user was found... so create a new user with values from Facebook (all the profile. stuff)
            if (!user) {
                user = new User({
                    email: email.emails[0].value,
                    googleId: email.id,
                    provider: 'google',
                    //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line

                });
                user.save(function (err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
        });
    }
))

// exports.googlelogin = (req, res) => {
//     const { tokenId } = req.body;
//     client.verifyIdToken({ idToken: tokenId, audience: config.google.clientId }).then((res) => {
//         const { email_verified, name, email } = res.payload;
//         console.log(res.payload, "data")
//         console.log(tokenId)
//         if (email_verified) {
//             User.findOne({ email: res.payload.email }).exec((err, user) => {
//                 if (err) {
                    
//                     res.statusCode = 400;
//                     res.json={
//                         error: "Something went wrong"
//                     }
                     
//                 } else {
//                     if (user) {
//                         const token=jwt.sign({user}, config.secretKey,
//                             { expiresIn: 3600 });
//                         res.json={
//                             token,
//                             user:{user}
//                         }
                            
//                     } else {
//                         user = new User({
//                             email: res.payload.email,
//                             provider: 'google',
//                             //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line

//                         });
//                         user.save((err,user) => {
//                             if (err) 
//                             {
//                                 res.statusCode = 400;
//                                 res.json={
//                                     error: "Something went wrong"
//                                 }
//                             }
//                             const token=jwt.sign({user}, config.secretKey,
//                                 { expiresIn: 3600 });
//                             res.json={
//                             token,
//                             user:{user}
//                         }
                            
//                         });

//                     }
//                 }

//             })

//         }
//     })
// }
