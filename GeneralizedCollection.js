import dbPromise from './db'

import uuid from 'uuid'

import bodyParser from 'body-parser'
import {Router} from 'express'

import {exposePromise} from './ExposePromise'

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

  const fetch = (criteria) => {
    return dbPromise
      .then((db) => {
        return db
          .collection(collectionName)
          .find(criteria || {})
          .sort({creationTime : 1})
          .toArray();
      })
  };

  const upsertOne = async (doc) => {
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
  };

  const compareVersionAndSet = async (doc) => {
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
  };

  const deleteOne = async (doc) => {
    const db = await dbPromise;
    const dbRes = await db
      .collection(collectionName)
      .deleteOne({id: doc.id,'acl.owner': doc.acl.owner})
    if(dbRes.result.deletedCount == 1) {
      return {
        id: doc.id,
        outcome: 'removed',
        result: dbRes.result,
      };
    } else {
      return {
        id: doc.id,
        outcome: 'nonexistent',
        result: dbRes.result,
      };
    }
  };

  const clearCollection = async () => {
    const db = await dbPromise;
    return db
      .collection(collectionName)
      .remove({});
  };

  return {
    fetch,
    insertOne,
    upsertOne,
    compareVersionAndSet,
    deleteOne,
    clearCollection
  };
}

const identity = (a) => a;

import * as AccessControl from './AccessControl'

export const CustomizeCollectionRouter = (collectionName,hydrate=identity,serialize=identity) => {
  const operations = CollectionOperations(collectionName);
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
