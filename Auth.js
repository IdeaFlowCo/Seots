import passport from './passport'
import uuid from 'uuid'
import dbPromise from './db'

export const login = (req,res) => {
  const {username,password} = req.body;
  if(!username || !password || username.constructor !== String || password.constructor !== String) {
    res.status(401).json({message: 'Invalid input'})
  }

  passport.authenticate('local-login', function(error, user, info) {
    if (error) return res.status(500).json({message: 'Server/Passport error', error: error})
    if (!user) return res.status(403).json({message: info})

    req.logIn(user, function(error) {
      if (error) { return res.status(500).json({message: 'Server error', error: error.stack})}
      return res.status(200).json({message: 'Login pass', user: user})
    });
  })(req, res);
}

export const logout = (req,res) => {
  req.logout();
  req.session.destroy();
  return res.status(200).json({message: 'Logout pass'});
}

export const register = (req,res) => {
  const {username,email,password} = req.body;

  if(!username || !password || username.constructor !== String || password.constructor !== String) {
    res.status(401).json({message: 'Invalid input'})
  }

  passport.authenticate('local-signup', function(error, user, info) {
    if (error) return res.status(500).json({message: 'Server/Passport error', error: error})
    if (!user) return res.status(403).json({message: info})

    req.logIn(user, function(error) {
      if (error) { return res.status(500).json({message: 'Server error', error: error.stack})}
      return res.status(200).json({message: 'Signup pass', user: user})
    });
  })(req, res);
}

export const session = (req,res) => {
  var user = req.isAuthenticated() ? req.user : null;
  return res.status(200).json(user);
}

// TODO move these functions somewhere else? Might be needed by more files.
const findUser = (username) => {
  return dbPromise
  .then((db) => {
    return db
      .collection('users')
      .findOne({username})
  })
  .then((user) => {
    if(!user) return Promise.reject('No such user');
    return Promise.resolve(user);
  })
}

const insertUserObject = (userObject) => {
  return dbPromise
  .then((db) => {
    return db
      .collection('users')
      .insertOne(userObject)
  });
}

const findSessionData = (sessionid) => {
  return dbPromise
    .then((db) => {
      return db.collection('sessions')
        .findOne({sessionid})
    })
}

const updateSessionData = (sessionid,sessiondata) => {
  return dbPromise
    .then((db) => {
      return db.collection('sessions')
        .updateOne({sessionid}, sessiondata, {upsert: true})
    })
}
