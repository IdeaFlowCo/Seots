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

export const apiExposeFromPromise = (req,res) => {
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

export const CollectionOperations = (collectionName) => {

  const insertOne = (doc,{preserveId}={preserveId:false}) => {
    if(!!doc.id && !preserveId) {
      console.warn('Inserting a document with an id', doc.id, '(it is being overwritten)');
    };
    const normalizedDoc = Object.assign({},doc,{
      id: (preserveId ? doc.id : undefined) || uuid.v4() ,
      creationTime: Date.now(),
      version: 0,
    });
    return dbPromise
      .then((db) => {
        return db
          .collection(collectionName)
          .insertOne(normalizedDoc)
          .then((dbRes) => {
            return {
              id: normalizedDoc.id,
              outcome: 'insert',
              result: dbRes.result,
            }
          })
      });
  };

  const removeProtectedProperties = (doc) => {
    const newDoc = Object.assign({},doc);
    delete newDoc._id;
    delete newDoc.version;
    delete newDoc.creationTime;
    delete newDoc.modificationTime;
    return newDoc;
  };

  return {
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
    insertOne: insertOne,

    upsertOne: async (doc) => {
      const db = await dbPromise;
      const adjustedDoc = removeProtectedProperties(doc);
      adjustedDoc.modificationTime = Date.now();
      if(adjustedDoc.id === undefined) {
        return insertOne(adjustedDoc);
      }
      const existingDoc = await db
        .collection(collectionName)
        .findOne({id: adjustedDoc.id})
      if(!existingDoc) {
        return insertOne(adjustedDoc,{preserveId:true});
      };
      if(!!existingDoc.acl && existingDoc.acl.owner != adjustedDoc.acl.owner) {
        // TODO: write a test for this
        return Promise.reject(new Error('Different owner!'))
      };

      const dbRes = await db
        .collection(collectionName)
        .updateOne(
          {id : adjustedDoc.id},
          {$set: adjustedDoc, $inc: {version: 1}}
        );
      const outcome = (dbRes.result.nModified > 0) ? 'update' : 'failure';
      return {
        id: adjustedDoc.id,
        outcome,
        result: dbRes.result,
      };
    },
    compareVersionAndSet: async (doc) => {
      const db = await dbPromise;
      const oldVersion = doc.version;
      const adjustedDoc = removeProtectedProperties(doc);
      adjustedDoc.modificationTime = Date.now();
      if(adjustedDoc.id === undefined) {
        return insertOne(adjustedDoc);
      }
      const existingDoc = await db
        .collection(collectionName)
        .findOne({id: adjustedDoc.id})
      if(!existingDoc) {
        return insertOne(adjustedDoc,{preserveId:true});
      };
      if(!!existingDoc.acl && existingDoc.acl.owner != adjustedDoc.acl.owner) {
        // TODO: write a test for this
        return Promise.reject(new Error('Different owner!'))
      };

      const dbRes = await db
        .collection(collectionName)
        .updateOne(
          {id : adjustedDoc.id, version: oldVersion, 'acl.owner': adjustedDoc.acl.owner},
          {$set: adjustedDoc, $inc: {version: 1}}
        );
      if(dbRes.result.nModified == 0) {
        return Promise.reject(new Error('wrong version or owner!'))
      }
      return {
        id: adjustedDoc.id,
        outcome: 'update',
        result: dbRes.result,
      };
    },
    getRekt: () => {
      return dbPromise
        .then((db) => {
          return db
            .collection(collectionName)
            .remove({})
        })
    },
  };
}

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
        .then(...apiExposeFromPromise(req,res));
    })
    .post('/upsertOne/', (req,res) => {
      let doc = serialize(req.body);
      doc = AccessControl.addACLToDoc(doc,req.sessiondata);
      console.log('Upserting', doc);
      operations.upsertOne(doc)
        .then(...apiExposeFromPromise(req,res));
    })
    .post('/compareVersionAndSet/', (req,res) => {
      let doc = serialize(req.body);
      doc = AccessControl.addACLToDoc(doc,req.sessiondata);
      console.log('compareVersionAndSet', doc);
      operations.compareVersionAndSet(doc)
        .then(...apiExposeFromPromise(req,res));
    })
    .post('/getRekt/', (req,res) => {
      operations.getRekt()
        .then(...apiExposeFromPromise(req,res));
    })
}
