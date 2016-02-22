/**
 * Created by russell on 2/22/16.
 */
var apicall = require('./apicall').apicall;
var {assert} = require('chai');
describe('CommentRouter', function () {
  it('Create comments', async function () {
    const gestalt = await apicall('persistence/gestalts/upsertOne', {payload: {text: 'a'}}, "POST");
    const comment = await apicall('persistence/comments/upsertOne',
      {username: 'testu', gestaltId: gestalt.id, text: "comment text"}, "POST");
    assert.deepEqual(comment.outcome, "insert");
    const newGestalt = await apicall('persistence/gestalts/fetch', {id: gestalt.id}, "POST").then(l => l[0]);

    assert.deepEqual(newGestalt.commentIds, [comment.id]);
  });
  // TODO: Delete comments
  // TODO: Edit comments
});
