import dbPromise from './db'

import uuid from 'uuid'

export const CollectionOperations = function(collectionName,hooks={}) {
  const insertOne = async function(doc,{preserveId}={preserveId:false}) {
    if(hooks.verifyDocumentCorectness) {
      const errorMessage = await hooks.verifyDocumentCorectness.call(operations,doc);
      if(!!errorMessage) {
        return {outcome: 'error', errorMessage};
      }
    }
    if(hooks.shouldInsert) {
      const shouldInsert = await hooks.shouldInsert.call(operations,doc);
      if(!shouldInsert) {
        return {outcome: 'noop'};
      }
    }
    if(!!doc.id && !preserveId) {
      console.warn(
        'Inserting a document with an id property set to',
        doc.id,
        '- it is being overwritten'
      );
    };
    const normalizedDoc = Object.assign({},doc,{
      id: (preserveId ? doc.id : undefined) || uuid.v4() ,
      creationTime: Date.now(),
      version: 0,
    });
    const db = await dbPromise;
    const dbRes = await db
      .collection(collectionName)
      .insertOne(normalizedDoc)

    if(hooks.postInsert) {
      await hooks.postInsert.call(operations,normalizedDoc,dbRes);
    }
    return {
      id: normalizedDoc.id,
      outcome: 'insert',
      result: dbRes.result,
    }
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

  const upsertOne = async function(doc) {
    if(hooks.verifyDocumentCorectness) {
      const errorMessage = await hooks.verifyDocumentCorectness.call(operations,doc);
      if(!!errorMessage) {
        return {outcome: 'error', errorMessage};
      }
    }
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

  const operations = {
    fetch,
    insertOne,
    upsertOne,
    compareVersionAndSet,
    deleteOne,
    clearCollection
  };
  return operations;
}
