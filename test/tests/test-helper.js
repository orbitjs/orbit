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
  verifyLocalStorageIsEmpty,
  verifyLocalStorageContainsRecord
} from './support/local-storage';


export {
  serializeOps,
  serializeOp,
  op,
  successfulOperation,
  failedOperation,
  verifyLocalStorageIsEmpty,
  verifyLocalStorageContainsRecord
}
