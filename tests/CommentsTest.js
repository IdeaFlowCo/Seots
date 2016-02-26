/**
 * Created by russell on 2/22/16.
 */
var apicall = require('./apicall').apicall;
var {expect} = require('chai');
describe('CommentRouter', function () {
  it('Create comments', async function () {
    const gestalt = await apicall('persistence/gestalts/upsertOne', {payload: {text: 'a'}}, "POST");
    const comment = await apicall('persistence/comments/upsertOne',
      {username: 'testu', gestaltId: gestalt.id, text: "comment text"}, "POST");
    expect(comment.outcome).to.equal("insert");
    const newGestalt = await apicall('persistence/gestalts/fetch', {id: gestalt.id}, "POST").then(l => l[0]);

    expect(newGestalt.commentIds).to.deep.equal([comment.id]);
  });

  it('Reject comments with missing fields', async function() {
    const gestalt = await apicall('persistence/gestalts/upsertOne', {payload: {text: 'a'}}, "POST");
    const comment = await apicall('persistence/comments/upsertOne',
      {gestaltId: gestalt.id, text: "comment text"}, "POST");
    expect(comment.outcome).to.equal("error");
  });

  it('Reject comments without a matching gestalt', async function() {
    const notAGestaltId = 12312323;
    const comment = await apicall('persistence/comments/upsertOne',
      {gestaltId: notAGestaltId, text: "whatever", username: 'testu'}, "POST");
    console.log(comment);
    expect(comment.outcome).to.equal('error');
  });
  // TODO: Delete comments
  // TODO: Edit comments
});
