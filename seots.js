import express from 'express'
import config from './config'

const app = express();

import {CustomizeCollectionApi} from './routes/generalized'

app.use('/persistence/gestalts', CustomizeCollectionApi('gestalts'));
app.use('/persistence/connections', CustomizeCollectionApi('connections'));
app.use('/persistence/users', CustomizeCollectionApi('users'));

app.get('/version', (req,res) => {
  res.status(200).json({version: config.version})
})

app.listen(9090);
