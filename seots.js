import sms from 'source-map-support'
sms.install()

import express from 'express'
import config from './config'
import passport from './passport'

const app = express();

import {CustomizeCollectionApi} from './GeneralizedCollection'
import cookieParser from 'cookie-parser'

app.use('/*', cookieParser());

// Auth
import * as Auth from './Auth'
import dbPromise from './db'
import bodyParser from 'body-parser'
import session from 'express-session'
const MongoStore = require('connect-mongo')(session)


const authRouter = express.Router();
authRouter
  .use(bodyParser.json())
  .post('/login', Auth.login)
  .post('/register', Auth.register)
  .get('/logout', Auth.logout)
  .get('/sessiondata', Auth.session)

app.use(session({
  secret: 'yetanothersecret',
  store: new MongoStore({url: config.dbUrl})
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRouter);

app.use('/persistence/boards', CustomizeCollectionApi('boards'));
app.use('/persistence/gestalts', CustomizeCollectionApi('gestalts'));
app.use('/persistence/connections', CustomizeCollectionApi('connections'));
app.use('/persistence/layouts', CustomizeCollectionApi('layouts'));
app.use('/persistence/users', CustomizeCollectionApi('users'));

app.get('/version', (req,res) => {
  res.status(200).json({version: config.version})
})

app.listen(9090);
