import {gestalts} from './SeotsCollections'

import {CustomizeCollectionRouter} from './GeneralizedCollectionRouter'
import {CollectionOperations} from './GeneralizedCollection'

const voteValue = ({vote}) => (vote == 'positive') ? 1 : 0;

const handleVoteDelta = async function(gestaltId,delta) {
  const transform = (gestalt) => {
    console.log('attempting delta',delta,gestaltId);
    const currentUpvotes = gestalt.upvotes || 0;
    return Object.assign({}, gestalt, {upvotes: currentUpvotes + delta});
  };

  return await gestalts.ensureTransformation(gestaltId,transform);
};

export default CustomizeCollectionRouter(CollectionOperations('votes', {

  async verifyDocumentCorectness(doc) {
    if(!doc.username) return 'No username defined';
    if(!doc.gestaltId) return 'No gestaltId defined';
    if(doc.acl.owner !== doc.username)
      return 'Owner different from provided username. Are you trying something funny here?' + doc.acl.owner + ' ' + doc.username;
    if(doc.vote != 'positive' && doc.vote != 'novote') return 'No such voting possibility';
    const matchingGestalt = await gestalts.fetch({id: doc.gestaltId});
    if (matchingGestalt.length != 1) {
      return 'Matching gestalt not found';
    }
  },

  async shouldInsert(doc) {
    const votes = await this.fetch({
      username:doc.username,
      gestaltId:doc.gestaltId
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
    return await handleVoteDelta(doc.gestaltId,delta)
  },
  async postUpdate(existingDoc,doc,dbRes) {
    const delta = voteValue(doc) - voteValue(existingDoc);
    return await handleVoteDelta(doc.gestaltId,delta)
  },
}));
