import dbPromise from './db'

import uuid from 'uuid'

import bodyParser from 'body-parser'
import {Router} from 'express'

export const callbackFunctionToPromise = (fn) => {
  return new Promise((resolve,reject) => {
    fn((error,result) => {
      console.log('back')
      if(!!error) return reject(error);
      resolve(result);
    })
  })
}

export const apiExposePromise = (promise,req,res) => {
  return promise
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      console.log('Error', error, error.stack);
      res.status(500).json(error);
    })
}

export const apiExproseFromPromise = (req,res) => {
  return [
    (result) => {
      res.status(200).json(result);
    },
    (error) => {
      console.log('Error', error, error.stack);
      res.status(500).json(error);
    }
  ];
}

export const CollectionOperations = (collectionName) => {return {
  fetch: (criteria) => {
    return dbPromise
      .then((db) => {
        return db
          .collection(collectionName)
          .find(criteria || {})
          .sort({creationTime : 1})
          .toArray();
      })
  },
  upsertOne: (doc) => {
    return dbPromise
      .then((db) => {
        delete doc._id;
        delete doc.version;
        delete doc.creationTime;
        doc.modificationTime = Date.now();
        if(doc.id === undefined) {
          doc.id = uuid.v4();
          doc.creationTime = Date.now();
          doc.version = 0;
          return db
            .collection(collectionName)
            .insertOne(doc)
            .then((dbRes) => {
              return {
                id: doc.id,
                outcome: 'insert',
                result: dbRes.result,
              }
            })
        } else {
          return db
            .collection(collectionName)
            .findOne({id: doc.id})
            .then((existingDoc) => {
              if(!existingDoc || !existingDoc.acl || existingDoc.acl.owner == doc.acl.owner) {
                return Promise.resolve();
              } else {
                // TODO: write a test for this
                return Promise.reject(new Error('Different owner!'))
              }
            })
            .then(() => {
              return db
                .collection(collectionName)
                .updateOne(
                  {id : doc.id},
                  {$set: doc, $setOnInsert: {creationTime: Date.now()}, $inc: {version: 1}},
                  {upsert: true}
                )
            })
            .then((dbRes) => {
              const outcome = (dbRes.result.nModified > 0) ? 'update' : 'insert';
              return {
                id: doc.id,
                outcome,
                result: dbRes.result,
              }
            })
        }
      })
  },
  getRekt: () => {
    return dbPromise
      .then((db) => {
        return db
          .collection(collectionName)
          .remove({})
      })
  },
}}

const identity = (a) => a;

import * as AccessControl from './AccessControl'

export const CustomizeCollectionApi = (collectionName,hydrate=identity,serialize=identity) => {
  const operations = CollectionOperations(collectionName);
  return Router()
    .use(bodyParser.json())
    .post('/fetch/', (req,res) => {
      operations.fetch(req.body)
        .then((docs) => docs.map(hydrate))
        .then((docs) => AccessControl.filter(docs,req.sessiondata))
        .then(...apiExproseFromPromise(req,res));
    })
    .post('/upsertOne/', (req,res) => {
      let doc = serialize(req.body);
      doc = AccessControl.addACLToDoc(doc,req.sessiondata);
      console.log('Upserting', doc);
      operations.upsertOne(doc)
        .then(...apiExproseFromPromise(req,res));
    })
    .post('/getRekt/', (req,res) => {
      operations.getRekt()
        .then(...apiExproseFromPromise(req,res));
    })
}
