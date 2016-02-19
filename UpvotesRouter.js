import {gestalts} from './SeotsCollections'
import {CustomizeCollectionRouter} from './GeneralizedCollectionRouter'

export default CustomizeCollectionRouter('upvotes',{
  async verifyDocumentCorectness(doc) {
    if(!doc.userId) return 'No userId defined';
    if(!doc.gestaltId) return 'No gestaltId defined';
  },

  async shouldInsert(doc) {
    const upvotes = await this.fetch({
      userId:doc.userId,
      gestaltId:doc.gestaltId
    })
    if(upvotes.length > 0) return false;
    return true;
  },

  async postInsert(doc,dbRes) {
  }
})
