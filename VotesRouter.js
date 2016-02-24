import {gestalts} from './SeotsCollections'
import comments from './CommentsCollection'

import {CustomizeCollectionRouter} from './GeneralizedCollectionRouter'
import {CollectionOperations} from './GeneralizedCollection'

const voteValue = ({vote}) => (vote == 'positive') ? 1 : 0;

const handleVoteDelta = async function(targetId,delta,collection) {
  const transform = (gestalt) => {
    console.log('attempting delta',delta,targetId);
    const currentUpvotes = gestalt.upvotes || 0;
    return Object.assign({}, gestalt, {upvotes: currentUpvotes + delta});
  };

  return await collection.ensureTransformation(targetId,transform);
};

const getCollection = (type) => {
  switch(type) {
    case 'gestalt': return gestalts;
    case 'comment': return comments;
    default: throw new Error(`Type ${type} is unknown, expected gestalt or comment`);
  }
};

export default CustomizeCollectionRouter(CollectionOperations('votes', {

  async verifyDocumentCorrectness(doc) {
    if(!doc.username) return 'No username defined';
    if(!doc.targetId) return 'No targetId defined';
    if(!doc.type) return 'No type defined';
    if(doc.acl.owner !== doc.username)
      return 'Owner different from provided username. Are you trying something funny here?' + doc.acl.owner + ' ' + doc.username;
    if(doc.vote != 'positive' && doc.vote != 'novote') return 'No such voting possibility';
    const matchingObject = await getCollection(doc.type).fetch({id: doc.targetId});
    if (matchingObject.length != 1) {
      return `Matching gestalt not found. Found: ${matchingObject}.` +
        ` Query was: [${doc.type}]{id: ${doc.targetId}`;

    }
  },

  async shouldInsert(doc) {
    const votes = await this.fetch({
      username:doc.username,
      targetId:doc.targetId,
    });
    if(votes.length > 0) {
      console.warn("Duplicate vote cannot be inserted");
      return false;
    };
    return true;
  },

  async shouldUpdate(existingDoc,doc) {
    if(doc.vote == existingDoc.vote) {
      console.warn("Vote ignored because an identical vote exists");
      return false;
    }
    return true;
  },

  async postInsert(doc,dbRes) {
    const delta = voteValue(doc);
    return await handleVoteDelta(doc.targetId,delta, getCollection(doc.type))
  },
  async postUpdate(existingDoc,doc,dbRes) {
    const delta = voteValue(doc) - voteValue(existingDoc);
    return await handleVoteDelta(doc.targetId,delta, getCollection(doc.type))
  },
}));
