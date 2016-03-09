import sms from 'source-map-support'
sms.install()

import express from 'express'
import config from './config'

const app = express();

import * as CollectionsOperations from './SeotsCollections'
import {CustomizeCollectionRouter} from './GeneralizedCollectionRouter'

import FilesRouter from './FilesRouter'
import VotesRouter from './VotesRouter'
import CommentsRouter from './CommentsRouter'

import CookieParser from 'cookie-parser'

app.use('/*', CookieParser());

// Auth
import AuthRouter from './AuthRouter'
import * as Auth from './Auth'

app.use(Auth.session)
app.use('/auth', AuthRouter);

app.use('/persistence/gestalts', CustomizeCollectionRouter(CollectionsOperations.gestalts));
app.use('/persistence/connections', CustomizeCollectionRouter(CollectionsOperations.connections));
app.use('/persistence/layouts', CustomizeCollectionRouter(CollectionsOperations.layouts));
app.use('/persistence/users', CustomizeCollectionRouter(CollectionsOperations.users));
app.use('/persistence/votes', VotesRouter);
app.use('/persistence/comments', CommentsRouter);
app.use('/persistence/files', FilesRouter);

app.get('/version', (req,res) => {
  res.status(200).json({version: config.version})
})

app.listen(9090);
