import {gestalts} from './SeotsCollections';
import {CustomizeCollectionRouter} from '../routes/GeneralizedCollectionRouter';
import {CollectionOperations} from './GeneralizedCollection';

export default CollectionOperations('comments', {
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

    if (!(await gestalts.fetchOneById(doc.gestaltId))) {
      return "Matching gestalt not found";
    }

    if (doc.acl.owner !== doc.username)
      return 'Owner different from provided username. Are you trying something funny here?' + doc.acl.owner + ' ' + doc.username;

  },

  async postInsert(doc) {
    const transform = (gestalt) => {
      const currentComments = gestalt.commentIds || [];
      const newComments = [...currentComments, doc.id];
      return Object.assign({}, gestalt, { commentIds: newComments });
    };

    return gestalts.ensureTransformation(doc.gestaltId, transform);
  },
});
