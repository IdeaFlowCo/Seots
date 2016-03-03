import uuid from 'uuid'
//import dbPromise from './db'

import crypto from 'crypto'

import {users} from './SeotsCollections'
import {gestalts} from './SeotsCollections'
import {CollectionOperations} from './GeneralizedCollection'

const sessions = CollectionOperations('sessions');

const hashAndSaltPassword = (username,password) => {
  return crypto
    .createHash('sha256')
    .update('believeineverywordthatiamsayingandtrustme' + username + password,'utf8')
    .digest()
    .toString('hex');
}

export const session = async (req,res,next) => {
  console.log(req.cookies);
  let sessionid = req.cookies['sessionid'];
  if(sessionid === undefined) {
    sessionid = uuid.v4();
    res.cookie('sessionid',sessionid,{ expires: new Date(Date.now() + 1000*60*75), httpOnly: true })
  }
  const sessiondata = await sessions.fetch({sessionid: sessionid});
  if(sessiondata.length > 0) {
    req.sessiondata = sessiondata[0];
  } else {
    req.sessiondata = {sessionid};
  }
  next();
}

export const login = async (req,res) => {
  const {username,password} = req.body;
  if(!username || !password || username.constructor !== String || password.constructor !== String) {
    res.status(401).json({message: 'Invalid input'})
  }
  const usersResult = await users.fetch({username, password : hashAndSaltPassword(username,password)});
  if(usersResult.length > 1) throw new Error('Catastrophy!');
  if(usersResult.length == 0) {
    res.status(403).json({message: 'Incorrect username or password'});
    return;
  };
  const user = users[0];

  const sessiondata = req.sessiondata;
  const newSessionData = Object.assign({},sessiondata,{
    username
  });
  result = await sessions.upsertOne(newSessionData);
  res.status(200).json({message: 'Login pass', sessiondata: newSessionData})
}

export const logout = async (req,res) => {
  const sessiondata = req.sessiondata;
  const id = sessiondata.id
  const newSessionData = Object.assign({},sessiondata,{username:undefined});
  const transform = (sessionData) => {
    console.log('updating session data to',newSessionData);
    return newSessionData;
  };
  await sessions.ensureTransformation({id}, transform)
  res.status(200).json({message: 'Logout pass', sessiondata: newSessionData})
}

export const register = async (req,res) => {
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
  const user = await users.fetch({username});
  if(user.length > 0) {
    res.status(403).json({message: 'Duplicate user'});
  } else {
    const gestalts = await users.fetch({boardName:username});
    console.log('found gestalts',gestalts);
    if (gestalts.length > 0) {
      res.status(403).json({message: 'boardName exists'});
        return Promise.reject(new Error("boardName exists"));
    }
    const userBoard = {
      boardName: username,
      payload: {},
      acl: {
        owner: username,
        readPermissions: ['public']
      }
    }
    const insertUser = await  users.upsertOne(userObject);
    const insertBoard = await gestalts.upsertOne(userBoard);
    // TODO: How to rollback registration if user board creation fails?
  }
}
