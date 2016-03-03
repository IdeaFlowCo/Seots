import dbPromise from '../config/db';
import {GridStore, ObjectId} from 'mongodb';

import uuid from 'uuid';

import multipart from 'connect-multiparty';
import fs from 'fs';
import bodyParser from 'body-parser';
import {Router} from 'express';

import {exposePromise} from '../helpers/ExposePromise';
const exposeFilePromise = (promise) => (req, res) => {
  return promise
    .then(({ content, metadata }) => res.status(200).set('Content-Type', metadata.contentType).end(content))
    .catch((error) => res.status(500).json({ message: error.message, stack: error.stack }));
};

const upload = async function(fileContentBuffer, fileName='', contentType) {
  console.log("Uploading", fileName, contentType, 'of size', fileContentBuffer.length / 1024 / 1024, 'mb');

  const db = await dbPromise;
  const fileId = uuid.v4();
  const gridStore = new GridStore(db, fileId, fileName, 'w', {
    content_type: contentType,
    metadata: { contentType },
  });
  await gridStore.open();
  await gridStore.write(fileContentBuffer);
  const result = await gridStore.close();

  return { id:fileId, '_id':result._id };
};

const retrieve = async function(fileId) {
  const db = await dbPromise;
  const gridStore = new GridStore(db, fileId, '', 'r');
  await gridStore.open();
  const metadata = gridStore.metadata;
  await gridStore.seek(0);
  const content = await gridStore.read();
  return { content, metadata };
};

const retrieveMetadata = async function(criteria={}) {
  const db = await dbPromise;
  return await db
    .collection('fs.files')
    .find(criteria, { metadata:true })
    .toArray();
};

const readFilePromise = (path) => {
  return new Promise((res, rej) => {
    fs.readFile(
      path,
      (err, buffer) => !!err ? rej(err) : res(buffer)
    );
  });
};

const unlinkPromise = (path) => {
  return new Promise((res, rej) => {
    fs.unlink(
      path,
      (err, result) => !!err ? rej(err) : res(result)
    );
  });
};

export default Router()
  .use(multipart())
  .post('/upload/', (req, res) => {
    let fileContentBufferPromise;
    let fileName;
    let contentType;

    if (req.body.file) {
      // The file was sent directly in the form data
      const fileContentBufferPromise = Promise.resolve(new Buffer(req.body.file, 'base64'));
    } else {
      // The file was retrieval was handled by the multiparty lib and it's
      fileContentBufferPromise = readFilePromise(req.files.file.path)
        .then((buffer) => {
          return unlinkPromise(req.files.file.path)
            .then(() => buffer);
        });
    }

    if (req.body.contentType) {
      contentType = req.body.contentType;
    };

    if (req.body.fileName) {
      fileName = req.body.fileName;
    };

    const promise = fileContentBufferPromise
      .then((fileContentBuffer) => upload(fileContentBuffer, fileName, contentType))
      .catch((err) => {
        console.log('error', err, err.stack); return Promise.reject(err);
      });
    exposePromise(promise)(req, res);
  })
  .post('/retrieveMetadata/', (req, res) => {
    const criteria = req.body;
    const promise = retrieveMetadata(criteria);
    exposePromise(promise)(req, res);
  })
  .post('/retrieve/', (req, res) => {
    const fileId = req.body.fileId;
    const promise = retrieve(fileId);
    exposeFilePromise(promise)(req, res);
  })
  .get('/retrieve/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    const promise = retrieve(fileId);
    exposeFilePromise(promise)(req, res);
  });
