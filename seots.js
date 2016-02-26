import sms from 'source-map-support'
sms.install()

import express from 'express'
import config from './config'

const app = express();

import * as CollectionsOperations from './SeotsCollections'
import {CustomizeCollectionRouter} from './GeneralizedCollectionRouter'

import FilesRouter from './FilesRouter'
import VotesRouter from './VotesRouter'
import CommentsCollection from './CommentsCollection'

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

app.use('/persistence/boards', CustomizeCollectionRouter(CollectionsOperations.boards));
app.use('/persistence/gestalts', CustomizeCollectionRouter(CollectionsOperations.gestalts));
app.use('/persistence/connections', CustomizeCollectionRouter(CollectionsOperations.connections));
app.use('/persistence/layouts', CustomizeCollectionRouter(CollectionsOperations.layouts));
app.use('/persistence/users', CustomizeCollectionRouter(CollectionsOperations.users));
app.use('/persistence/votes', VotesRouter);
app.use('/persistence/comments', CustomizeCollectionRouter(CommentsCollection));
app.use('/persistence/files', FilesRouter);

app.get('/version', (req,res) => {
  res.status(200).json({version: config.version})
})

app.listen(9090);
