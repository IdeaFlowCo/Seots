var boardName = 'import'

var nodes = require('./hinodes')
  .map((node) => {
    return {
      id: node._id,
      boardName: boardName,
      payload: {
        text: node.slug
      }
    }
  }).slice(0,100);
var edges = require('./hiedges')
  .map((edge) => {
    return {
      boardName: boardName,
      targetId: edge.target._id,
      sourceId: edge.source._id,
      payload: {
        text: edge.text
      }
    }
  }).slice(0,100);

console.log('edges: ',edges.length);
console.log('nodes: ',nodes.length);

var dbUrl = "mongodb://localhost/seots_data";
var MongoClient = require('mongodb').MongoClient;
var dbPromise = MongoClient.connect(dbUrl);

dbPromise
  .catch((err) => {console.log('db problem', err)})
  .then((db) => {
    return Promise.resolve()
      .then(() => {
        return db.collection('gestalts')
          .insertMany(nodes)
      })
      .then(() => {
        return db.collection('connections')
          .insertMany(edges)
      })
  })
  .catch((err) => {
    console.log(err);
  })

console.log(edges,nodes);
