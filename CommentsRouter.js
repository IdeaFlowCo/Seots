import {gestalts} from './SeotsCollections'
import {CustomizeCollectionRouter} from './GeneralizedCollectionRouter'
import {CollectionOperations} from './GeneralizedCollection'


export default CustomizeCollectionRouter(CollectionOperations('comments', {
  async verifyDocumentCorrectness(doc) {
    // Expected doc:
    // {
    //    "username": ...
    //    "gestaltId": ...
    //    "text": ...
    // }
    if (!(doc.username && doc.gestaltId && doc.text)) {
      return "Comment is invalid (missing fields)";
    }
    if (!gestalts.fetchOneById(doc.gestaltId)) {
      return "Matching gestalt not found";
    }
  },

  async postInsert(doc) {
    const commentId = doc.id;
    const matchingGestalt = gestalts.fetchOneById(doc.gestaltId);
    const transform = (gestalt) => {
      const currentComments = gestalt.commentIds || [];
      const newComments = currentComments.slice();
      newComments.push(doc.id);
      return Object.assign({}, gestalt, {commentIds: newComments});
    };
    gestalts.ensureTransformation(doc.gestaltId, transform);
  }
}));
