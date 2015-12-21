import express from 'express'
import config from './config'

const app = express();

import {CustomizeCollectionApi} from './GeneralizedCollection'

app.use('/persistence/boards', CustomizeCollectionApi('boards'));
app.use('/persistence/gestalts', CustomizeCollectionApi('gestalts'));
app.use('/persistence/connections', CustomizeCollectionApi('connections'));
app.use('/persistence/layouts', CustomizeCollectionApi('layouts'));
app.use('/persistence/users', CustomizeCollectionApi('users'));

app.get('/version', (req,res) => {
  res.status(200).json({version: config.version})
})

app.listen(9090);
