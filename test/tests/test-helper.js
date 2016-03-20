import './support/orbit-setup';
import { on } from 'rsvp';

on('error', function(reason) {
  console.error('rsvp error', reason);
});

import {
  serializeOps,
  serializeOp,
  op,
  successfulOperation,
  failedOperation
} from './support/operations';

import {
  transformMatching
} from './support/matchers';

import {
  verifyLocalStorageIsEmpty,
  verifyLocalStorageContainsRecord
} from './support/local-storage';

import { planetsSchema } from './support/schemas';

import './support/rsvp';


export {
  serializeOps,
  serializeOp,
  op,
  successfulOperation,
  failedOperation,
  transformMatching,
  verifyLocalStorageIsEmpty,
  verifyLocalStorageContainsRecord,
  planetsSchema
};
