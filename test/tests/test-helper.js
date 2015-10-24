import { Promise, on } from 'rsvp';
import Orbit from 'orbit/main';

Orbit.Promise = Promise;

on('error', function(reason) {
  console.error('rsvp error', reason);
});

import {
  serializeOps,
  serializeOp,
  op,
  successfulOperation,
  failedOperation,
  equalOps
} from './support/operations';

import {
  transformMatching
} from './support/matchers';

import {
  verifyLocalStorageIsEmpty,
  verifyLocalStorageContainsRecord
} from './support/local-storage';

import './support/rsvp';

export {
  serializeOps,
  serializeOp,
  op,
  successfulOperation,
  failedOperation,
  equalOps,
  transformMatching,
  verifyLocalStorageIsEmpty,
  verifyLocalStorageContainsRecord
};
