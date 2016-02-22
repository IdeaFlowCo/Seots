import bodyParser from 'body-parser'
import {Router} from 'express'

import {exposePromise} from './ExposePromise'

const identity = (a) => a;

import * as AccessControl from './AccessControl'

export const CustomizeCollectionRouter = (operations,hydrate=identity,serialize=identity) => {
  return Router()
    .use(bodyParser.json())
    .post('/fetch/', (req,res) => {
      const promise = operations.fetch(req.body)
        .then((docs) => docs.map(hydrate))
        .then((docs) => AccessControl.filter(docs,req.sessiondata));
      exposePromise(promise)(req,res);
    })
    .post('/upsertOne/', (req,res) => {
      let doc = serialize(req.body);
      doc = AccessControl.addACLToDoc(doc,req.sessiondata);
      console.log('Upserting', doc);
      const promise = operations.upsertOne(doc);
      exposePromise(promise)(req,res);
    })
    .post('/compareVersionAndSet/', (req,res) => {
      let doc = serialize(req.body);
      doc = AccessControl.addACLToDoc(doc,req.sessiondata);
      console.log('compareVersionAndSet', doc);
      const promise = operations.compareVersionAndSet(doc);
      exposePromise(promise)(req,res);
    })
    .post('/deleteOne/', (req,res) => {
      let doc = serialize(req.body);
      doc = AccessControl.addACLToDoc(doc,req.sessiondata);
      console.log('Deleting', doc);
      const promise = operations.deleteOne(doc);
      exposePromise(promise)(req,res);
    })
    .post('/clearCollection/', (req,res) => {
      const promise = operations.clearCollection();
      exposePromise(promise)(req,res);
    })
}
