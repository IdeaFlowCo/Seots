var apicall = require('./apicall').apicall
var {assert, expect} = require('chai');
const chai = require('chai');

describe('VotesTest', function () {
  // TODO: add asserts
  // TODO: break up test into smaller pieces
  it('Voting', async function () {
    await apicall('auth/register', {username: 'testu', password: 'testp'}, "POST");
    await apicall('auth/login', {username: 'testu', password: 'testp'}, "POST");
    const gestalt = await apicall('persistence/gestalts/upsertOne', {payload: {text: 'a'}}, "POST");
    const gestaltId = gestalt.id;
    const vote = await apicall('persistence/votes/upsertOne', {
      username: 'testu',
      gestaltId: gestaltId,
      vote: 'novote'
    }, "POST");
    const voteId = vote.id;
    console.log('...Creating a duplicate vote');
    const duplicateVote = await apicall('persistence/votes/upsertOne', {
      username: 'testu',
      gestaltId: gestaltId,
      vote: 'positive'
    }, "POST");

    console.log('...Creating a duplicate vote');
    const dupVoteResult = await apicall('persistence/votes/upsertOne', {
      username: 'testu',
      gestaltId: gestaltId,
      vote: 'positive'
    }, "POST");

    expect(dupVoteResult.outcome).to.equal('noop', "No duplicate votes should be allowed");

    console.log('...Changin the vote to the same one');
    const changeToSame = await apicall('persistence/votes/upsertOne', {
      id: voteId,
      username: 'testu',
      gestaltId: gestaltId,
      vote: 'novote'
    }, "POST");
    
    expect(changeToSame.outcome).to.equal('noop', "An identical vote should be a noop");

    console.log('...Changin the vote to a positive one');
    const positiveVote = await apicall('persistence/votes/upsertOne', {
      id: voteId,
      username: 'testu',
      gestaltId: gestaltId,
      vote: 'positive'
    }, "POST");

    expect(positiveVote.outcome).to.equal('update', 'Vote should be allowed to be changed');

    const resultingGestalt = await apicall('persistence/gestalts/fetch', {id: gestaltId}, "POST");
    expect(resultingGestalt[0].upvotes).to.equal(1, "Gestalt vote should be 1");
  })
});
