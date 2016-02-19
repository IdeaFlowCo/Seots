import {CollectionOperations} from './GeneralizedCollection'
import dbPromise from './db'
import {Router} from 'express'
import * as AccessControl from './AccessControl'

import {exposePromise} from './ExposePromise'

export const UpvoteOperations = () => {
  const gestaltOps = CollectionOperations('gestalts');
  const upvoteOps = CollectionOperations('upvotes');

  const getUpvote = (gestaltId, username) => {
    return {gestaltId, username, acl: {owner: username}};
  };

  const handleUpvote = async (gestaltId, username) => {
    const currentGestalt = await gestaltOps.fetchOne({id: gestaltId});
    if (currentGestalt === undefined) {
      return {
        id: gestaltId,
        outcome: 'failure',
        cause: 'Gestalt not found'
      }
    }
    const currentUpvoteList = await upvoteOps.fetch(getUpvote(gestaltId, username));
    if (currentUpvoteList.length > 0) {
      return {
        id: gestaltId,
        outcome: 'failure',
        cause: 'Already upvoted'
      }
    }

    currentGestalt.upvotes = (currentGestalt.upvotes || 0) + 1;
    const updatedGestalt = await gestaltOps.upsertOne(currentGestalt);
    if (updatedGestalt.result.ok != 1) {
      return {
        id: gestaltId,
        outcome: 'failure',
        cause: updatedGestalt
      }
    }
    const upvote = getUpvote(gestaltId, username);
    return upvoteOps.upsertOne(upvote);
  };

  const handleUnvote = async (gestaltId, username) => {
    const currentGestalt = await gestaltOps.fetchOne({id: gestaltId});
    const currentUpvote = await upvoteOps.fetchOne({gestaltId, username});
    console.log(currentUpvote, currentGestalt);
    if (currentUpvote === undefined) {
      return {
        id: gestaltId,
        outcome: 'failure',
        cause: 'No upvote to unvote'
      }
    }
    const deletedVote = await upvoteOps.deleteOne(currentUpvote);
    currentGestalt.upvotes = (currentGestalt.upvotes || 0) - 1;
    const updatedGestalt = await gestaltOps.upsertOne(currentGestalt);
    if (updatedGestalt.outcome != 'update') {
      return {
        id: gestaltId,
        outcome: 'failure',
        cause: updatedGestalt
      }
    }
    return {
      id: gestaltId,
      outcome: 'unvote'
    }
  };
  return {handleUpvote, handleUnvote};
};

export default Router()
  .post('/upvote/:gestaltId', (req, res) => {
    if (!AccessControl.ensureUserOr403(req, res)) {
      return;
    }
    const gestaltId = req.params['gestaltId'];
    const username = req.sessiondata.username;
    const promise = UpvoteOperations().handleUpvote(gestaltId, username);
    exposePromise(promise)(req, res);
  }).post('/unvote/:gestaltId', (req, res) => {
    if (!AccessControl.ensureUserOr403(req, res)) {
      return;
    }
    const gestaltId = req.params['gestaltId'];
    const username = req.sessiondata.username;
    const promise = UpvoteOperations().handleUnvote(gestaltId, username);
    exposePromise(promise)(req, res);
  });
