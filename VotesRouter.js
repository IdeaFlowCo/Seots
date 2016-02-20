import {gestalts} from './SeotsCollections'
import {CustomizeCollectionRouter} from './GeneralizedCollectionRouter'
import {CollectionOperations} from './GeneralizedCollection'

const shouldPersist = async function(doc) {
  const votes = await this.fetch({
    username:doc.username,
    gestaltId:doc.gestaltId
  });
  if(votes.length > 0 && votes[0].vote == doc.vote) {
    console.warn("Vote ignored because an identical vote exists");
    return false;
  }
  if(votes.length == 0 && doc.vote == 0) {
    console.log("Vote ignored because the vote was an unvote and no votes exist");
    return false;
  }
  return true;
};

const postUpsert = async function(doc,dbRes) {
  const delta = doc.vote ? 1 : -1;
  const transform = (gestalt) => {
    const currentUpvotes = gestalt.upvotes || 0;
    return Object.assign({}, gestalt, {upvotes: currentUpvotes + delta});
  };

  return await gestalts.ensureTransformation(doc.gestaltId, transform);
};

export default CustomizeCollectionRouter(CollectionOperations('upvotes', {

  async verifyDocumentCorectness(doc) {
    if(!doc.username) return 'No username defined';
    if(!doc.gestaltId) return 'No gestaltId defined';
    const matchingGestalt = await gestalts.fetch({id: doc.gestaltId});
    if (matchingGestalt.length != 1) {
      return 'Matching gestalt not found';
    }
  },

  async shouldInsert(doc) {
    return await shouldPersist.call(this,doc);
  },

  async shouldUpdate(existingDoc,doc) {
    return await shouldPersist.call(this,doc);
  },

  async postInsert(doc,dbRes) {
    console.log(dbRes);
    return await postUpsert.call(this,doc,dbRes)
  },
  async postUpdate(existingDoc,doc,dbRes) {
    console.log(dbRes);
    return await postUpsert.call(this,doc,dbRes)
  },
}));
