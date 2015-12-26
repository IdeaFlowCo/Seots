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
          .toArray();
      })
  },
  upsertOne: (doc) => {
    return dbPromise
      .then((db) => {
        delete doc._id;
        if(doc.id === undefined) {
          doc.id = uuid.v4();
          return db
            .collection(collectionName)
            .insertOne(doc)
        } else {
          return db
            .collection(collectionName)
            .updateOne({id : doc.id}, doc, {upsert: true})
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

export const CustomizeCollectionApi = (collectionName,hydrate=identity,serialize=identity) => {
  const operations = CollectionOperations(collectionName);
  return Router()
    .use(bodyParser.json())
    .post('/fetch/', (req,res) => {
      operations.fetch(req.body)
        .then((docs) => docs.map(hydrate))
        .then(...apiExproseFromPromise(req,res));
    })
    .post('/upsertOne/', (req,res) => {
      const doc = serialize(req.body);
      console.log('Upserting', doc);
      operations.upsertOne(doc)
        .then(...apiExproseFromPromise(req,res));
    })
    .post('/getRekt/', (req,res) => {
      operations.getRekt()
        .then(...apiExproseFromPromise(req,res));
    })
}
