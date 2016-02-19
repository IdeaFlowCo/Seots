import {gestalts} from './SeotsCollections'
import {CustomizeCollectionRouter} from './GeneralizedCollectionRouter'
import {CollectionOperations} from './GeneralizedCollection'

/**
 * The upvotes have their id set to gestaltId-userId so that they can be easily updated
 */
export default CustomizeCollectionRouter(CollectionOperations('upvotes', {

  async verifyDocumentCorectness(doc) {
    if(!doc.userId) return 'No userId defined';
    if(!doc.gestaltId) return 'No gestaltId defined';
    const matchingGestalt = await gestalts.fetch({id: doc.gestaltId});
    if (matchingGestalt.length != 1) {
      return 'Matching gestalt not found';
    }
  },

  getId(doc) {
    return doc.gestaltId + "-" + doc.userId;
  },

  async shouldInsert(doc) {
    const upvotes = await this.fetch({
      userId:doc.userId,
      gestaltId:doc.gestaltId
    });
    if(upvotes.length > 0 && upvotes[0].vote == doc.vote) return false;
    if(upvotes.length == 0 && doc.vote == 0) return false;
    return true;
  },

  async postUpsert(doc,dbRes) {
    const gestalt = await gestalts.fetchOneById(doc.gestaltId);
    const currentUpvotes = gestalt.upvotes || 0;
    const delta = () => {
      if (doc.vote == 0) {
        return -1;
      } else {
        return 1;
      }
    };
    const newGestalt = Object.assign({}, gestalt, {upvotes: currentUpvotes + delta()});
    return await gestalts.upsertOne(newGestalt);
  }
}));
