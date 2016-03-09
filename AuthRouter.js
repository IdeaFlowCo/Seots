import {Router} from 'express'
import bodyParser from 'body-parser'

import * as Auth from './Auth'

import {exposeRejectedPromise} from './ExposePromise'

export default Router()
  .use(bodyParser.json())
  .post('/login', (req,res) => {
    exposeRejectedPromise(Auth.login(req,res))(req,res);
  })
  .post('/register', (req,res) => {
    exposeRejectedPromise(Auth.register(req,res))(req,res);
  })
  .get('/logout', (req,res) => {
    exposeRejectedPromise(Auth.logout(req,res))(req,res);
  })
  .get('/sessiondata', (req,res) => {
    res.status(200).json(req.sessiondata);
  })
