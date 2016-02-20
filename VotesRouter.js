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

  /*getId(doc) {
    return doc.gestaltId + "-" + doc.userId;
  },*/

  async shouldInsert(doc) {
    const upvotes = await this.fetch({
      userId:doc.userId,
      gestaltId:doc.gestaltId
    });
    console.log('Upvotes!', upvotes);
    if(upvotes.length > 0) return false;
    return true;
  },

  async shouldUpdate(doc) {
    //const upvote = await this.fetchOneById(this.hooks.getId(doc.id));
    const upvote = await this.fetchOneById(doc.id);
    console.log('Upvote!', upvote);
    if(upvote === undefined) return false;
    if(upvote.vote == doc.vote) return false;
    return true;
  },

  async postUpsert(doc,dbRes) {
    const delta = (doc.vote == 0) ? -1 : 1;
    const transform = (gestalt) => {
      return Object.assign({}, gestalt, {
        upvotes: (gestalt.upvotes || 0) + delta
      })
    };

    return await gestalts.ensureTransformation(doc.gestaltId,transform);
  }
}));
