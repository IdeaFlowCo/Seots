var apicall = require('./apicall').apicall
var {expect} = require('chai');
const chai = require('chai');

describe('VotesTest', function () {
  // TODO: add asserts
  // TODO: break up test into smaller pieces
  it('Work for gestalts', async function () {
    await apicall('auth/register', {username: 'testu', password: 'testp'}, "POST");
    await apicall('auth/login', {username: 'testu', password: 'testp'}, "POST");
    const gestalt = await apicall('persistence/gestalts/upsertOne', {payload: {text: 'a'}}, "POST");
    const gestaltId = gestalt.id;
    const vote = await apicall('persistence/votes/upsertOne', {
      username: 'testu',
      targetId: gestaltId,
      type: "gestalt",
      vote: 'novote'
    }, "POST");
    const voteId = vote.id;
    console.log('...Creating a duplicate vote');
    const duplicateVote = await apicall('persistence/votes/upsertOne', {
      username: 'testu',
      targetId: gestaltId,
      type: "gestalt",
      vote: 'positive'
    }, "POST");

    console.log('...Creating a duplicate vote');
    const dupVoteResult = await apicall('persistence/votes/upsertOne', {
      username: 'testu',
      targetId: gestaltId,
      type: "gestalt",
      vote: 'positive'
    }, "POST");

    expect(dupVoteResult.outcome).to.equal('noop', "No duplicate votes should be allowed");

    console.log('...Changin the vote to the same one');
    const changeToSame = await apicall('persistence/votes/upsertOne', {
      id: voteId,
      username: 'testu',
      targetId: gestaltId,
      vote: 'novote',
      type: 'gestalt'
    }, "POST");
    
    expect(changeToSame.outcome).to.equal('noop', "An identical vote should be a noop");

    console.log('...Changin the vote to a positive one');
    const positiveVote = await apicall('persistence/votes/upsertOne', {
      id: voteId,
      username: 'testu',
      targetId: gestaltId,
      vote: 'positive',
      type: 'gestalt'
    }, "POST");

    expect(positiveVote.outcome).to.equal('update', 'Vote should be allowed to be changed');

    const resultingGestalt = await apicall('persistence/gestalts/fetch', {id: gestaltId}, "POST");
    expect(resultingGestalt[0].upvotes).to.equal(1, "Gestalt vote should be 1");
  });

  it('Work for comments', async function() {
    await apicall('auth/register', {username: 'testu', password: 'testp'}, "POST");
    await apicall('auth/login', {username: 'testu', password: 'testp'}, "POST");
    const gestalt = await apicall('persistence/gestalts/upsertOne', {payload: {text: 'a'}}, "POST");
    const comment = await apicall('persistence/comments/upsertOne',
      {username: 'testu', gestaltId: gestalt.id, text: "comment text"}, "POST");
    console.log(comment);
    const vote = await apicall('persistence/votes/upsertOne', {
      username: 'testu',
      targetId: comment.id,
      type: 'comment',
      vote: 'positive'
    }, "POST");
    console.log(vote);
    expect(vote.outcome).to.equal('insert', 'Votes should be able to be inserted');
    const resultingComment = await apicall('persistence/comments/fetch', {id: comment.id}, "POST");
    expect(resultingComment[0].upvotes).to.equal(1, "Comment should be upvoted");
  });
});
