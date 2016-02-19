import sms from 'source-map-support'
sms.install()

import express from 'express'
import config from './config'

const app = express();

import {CustomizeCollectionRouter} from './GeneralizedCollection'
import FilesRouter from './FilesRouter'
import UpvotesRouter from './UpvotesRouter'

import CookieParser from 'cookie-parser'

app.use('/*', CookieParser());

// Auth
import * as Auth from './Auth'
import dbPromise from './db'
import bodyParser from 'body-parser'
const authRouter = express.Router();

authRouter
  .use(bodyParser.json())
  .post('/login', Auth.login)
  .post('/register', Auth.register)
  .get('/logout', Auth.logout)
  .get('/sessiondata', (req,res) => {
    res.status(200).json(req.sessiondata);
  })

app.use(Auth.session)
app.use('/auth', authRouter);

app.use('/persistence/boards', CustomizeCollectionRouter('boards'));
app.use('/persistence/gestalts', CustomizeCollectionRouter('gestalts'));
app.use('/persistence/connections', CustomizeCollectionRouter('connections'));
app.use('/persistence/layouts', CustomizeCollectionRouter('layouts'));
app.use('/persistence/users', CustomizeCollectionRouter('users'));
app.use('/persistence/upvotes', UpvotesRouter);
app.use('/persistence/files', FilesRouter);

app.get('/version', (req,res) => {
  res.status(200).json({version: config.version})
})

app.listen(9090);
