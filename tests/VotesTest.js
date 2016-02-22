var apicall = require('./apicall').apicall

var gestaltId = undefined;
var voteId = undefined;

Promise.resolve()
  .then(() => {
    console.log('...Creating a gestalt')
    return apicall('persistence/gestalts/upsertOne',{payload:{text:'a'}},"POST")
  })
  .then((result) => {
    //console.log('gestalt creation response', result);
    gestaltId = result.id;
  })
  .then(() => {
    console.log('...Creating a vote')
    return apicall('persistence/votes/upsertOne',{
      username:'testu',
      gestaltId:gestaltId,
      vote:'novote'
    },"POST")
  })
  .then((result) => {
    //console.log('vote creation response', result);
    voteId = result.id;
  })
  .then(() => {
    console.log('...Creating a duplicate vote')
    return apicall('persistence/votes/upsertOne',{
      username:'testu',
      gestaltId:gestaltId,
      vote:'positive'
    },"POST")
  })
  .then((result) => {
    if(result.outcome !== 'noop') {
      console.error('No duplicates should be allowed!',result);
    } else {
      console.log('✓ Duplicate vote correctly rejected')
    }
  })
  .then(() => {
    console.log('...Changin the vote to the same one')
    return apicall('persistence/votes/upsertOne',{
      id:voteId,
      username:'testu',
      gestaltId:gestaltId,
      vote:'novote'
    },"POST")
  })
  .then((result) => {
    if(result.outcome !== 'noop') {
      console.error('Changing vote to the same one should result in a noop!',result);
    } else {
      console.log('✓ Same vote correctly rejected')
    }
  })
