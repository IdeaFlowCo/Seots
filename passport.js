import passport from 'passport'
import uuid from 'uuid'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as FacebookTokenStrategy } from 'passport-facebook-token'
import bcrypt from 'bcryptjs'
import dbPromise from './db'
// import {facebook as fbConfig} from '../config/config.js' //TODO implement

// =========================================================================
// passport session setup ==================================================
// =========================================================================
// required for persistent login sessions
// passport needs ability to serialize and unserialize users out of session

// used to serialize the user for the session
passport.serializeUser(function(user, callback) {
  callback(null, user.id);
});

// used to deserialize the user (used when checking session)
passport.deserializeUser(function(id, callback) {
  dbPromise
    .then((db) => {
      return db
        .collection('users')
        .findOne({id})
    })
    .then((user) => {
      if(!user) return callback({error:'No such user'}, null);
      return callback(null, user);
    })
});

// =========================================================================
// Local Signup ============================================================
// =========================================================================

// TODO user user model instead of dbConnection! (create a function to create the user)
passport.use(
  'local-signup',
  new LocalStrategy({
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
  },
  function(req, email, password, callback){
    const username = req.body.username

    const salt = bcrypt.genSaltSync(10)
    const passwordHash = bcrypt.hashSync(password, salt)
    const userObject = {
      id: uuid.v4(),
      email,
      username,
      password: passwordHash
    }

    // Lets not worry about concurrency errors just yet //TODO worry about concurrency errors
    dbPromise
      .then((db) => {
        return db
          .collection('users')
          .find({email})
          .toArray()
      })
      .then((users) => {
        if (users.length > 0) return callback({message: 'That email is already being used.'});

        dbPromise
          .then((db) => {
            return db
              .collection('users')
              .find({username})
              .toArray()
          })
          .then((users) => {
            if (users.length > 0) return callback({message: 'That username is already being used.'});

            dbPromise
              .then((db) => {
                return db
                  .collection('users')
                  .insertOne(userObject)
              })
              .then((result) => {
                if(result.insertedCount == 1) {
                  callback({user: userObject});
                } else {
                  return Promise.reject({error: (new Error("fail"))});
                }
              })
              .catch((error) => {
                callback({error: error.stack});
              })
          })
      })
      .catch((error) => {
        callback({error: error.stack});
      })
  })
);

// =========================================================================
// Local Login =============================================================
// =========================================================================

passport.use( 
  'local-login',
  new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
  },
  function(req, email, password, callback) {
    dbPromise
      .then((db) => {
        return db
          .collection('users')
          .find({email})
          .toArray()
      })
      .then((users) => {
        if(users.length > 1) throw new Error('Catastrophy! - more than 1 user with email: ' + email);
        if(users.length === 0) {
          return callback({message: 'Incorrect username or password'});
        };

        const user = users[0];

        if (!bcrypt.compareSync(password, user.password)){
          callback({message: 'Incorrect password'});
          return;
        }
        callback({user});
      })
  })
);

// =========================================================================
// Facebook Login ==========================================================
// =========================================================================

// TODO: use resolve/reject to avoid the nesting
// passport.use(new FacebookTokenStrategy({
//   clientID: fbConfig.appId,
//   clientSecret: fbConfig.appSecret,
// },  
//   function(accessToken, refreshToken, profile, done) {
//     // TODO figure out the best practice to manage the accessToken/refreshToken
//     // TODO figure out whatelse to store? (e.g. user profile photo)

//     userModel.getters.findUserByFacebookId(profile.id)
//     .then(  
//       function(result){
//         if (result.error) {
//           return done(result.error);
//         }
//         else if (result.user){
//           return done(null, result.user); 
//         }
//         else {
//           userModel.modifiers.createUserWithFacebook(profile.id, profile.displayName)
//           .then(
//             function(result){
//               if (result.error) {
//                 return done(result.error);
//               }
//               else {
//                 return done(null, result.user); 
//               }
//             }
//           );
//         }
//       }
//     );
//   }
// ));

export default passport;
