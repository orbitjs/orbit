import './support/orbit-setup';
import { on } from 'rsvp';
import './support/qunit-matchers';

const { module, test } = QUnit;

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

import { planetsSchema } from './support/schemas';

import FakeBucket from './support/fake-bucket';

import './support/rsvp';

export {
  serializeOps,
  serializeOp,
  op,
  successfulOperation,
  failedOperation,
  planetsSchema,
  FakeBucket
};
