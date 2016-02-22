import uuid from 'uuid'
import dbPromise from './db'

import crypto from 'crypto'

const hashAndSaltPassword = (username,password) => {
  return crypto
    .createHash('sha256')
    .update('believeineverywordthatiamsayingandtrustme' + username + password,'utf8')
    .digest()
    .toString('hex');
}

export const session = (req,res,next) => {
  console.log(req.cookies);
  let sessionid = req.cookies['sessionid'];
  if(sessionid === undefined) {
    sessionid = uuid.v4();
    res.cookie('sessionid',sessionid,{ expires: new Date(Date.now() + 1000*60*75), httpOnly: true })
  }
  findSessionData(sessionid)
    .then((sessiondata) => {
      if(sessiondata == null) {
        req.sessiondata = {sessionid};
      } else {
        req.sessiondata = sessiondata;
      }
      next();
    })
    .catch((error) => {
      console.log('error', error.stack);
      next();
    })
}

export const login = (req,res) => {
  const {username,password} = req.body;
  if(!username || !password || username.constructor !== String || password.constructor !== String) {
    res.status(401).json({message: 'Invalid input'})
  }
  dbPromise
    .then((db) => {
      return db
        .collection('users')
        .find({username, password : hashAndSaltPassword(username,password)})
        .toArray()
    })
    .then((users) => {
      if(users.length > 1) throw new Error('Catastrophy!');
      if(users.length == 0) {
        res.status(403).json({message: 'Incorrect username or password'});
        return;
      };
      const user = users[0];

      const sessiondata = req.sessiondata;
      console.log('username',username);
      const newSessionData = Object.assign({},sessiondata,{
        username
      });
      updateSessionData(sessiondata.sessionid,newSessionData)
        .then(() => {
          res.status(200).json({message: 'Login pass', sessiondata: newSessionData})
        })
    })
    .catch((error) => {
      res.status(500).json({message: 'Server error', error: error.stack});
    })
}

export const logout = (req,res) => {
  const sessiondata = req.sessiondata;
  const newSessionData = Object.assign({},sessiondata,{username:undefined});
  updateSessionData(sessiondata.sessionid,newSessionData)
    .then(() => {
      res.status(200).json({message: 'Logout pass', sessiondata: newSessionData})
    })
}

export const register = (req,res) => {
  const {username,password} = req.body;
  if(!username || !password || username.constructor !== String || password.constructor !== String) {
    res.status(401).json({message: 'Invalid input'})
  }
  const userObject = {
    id: uuid.v4(),
    username,
    password: hashAndSaltPassword(username,password)
  }
  let userExists;
  // Lets not worry about concurrency errors just yet
  findUser(username)
    .then((user) => {
      res.status(403).json({message: 'Duplicate user'});
    })
    .catch((user) => {
      insertUserObject(userObject)
      .then((result) => {
        if(result.insertedCount == 1) {
          res.status(200).json({message: 'Registration correct'})
        } else {
          return Promise.reject(new Error("fail"));
        }
      })
      .catch((error) => {
        res.status(500).json({message: 'Server error', error: error.stack});
      })
    })
}

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
