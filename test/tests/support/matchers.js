import { eq } from 'orbit/lib/eq';
import {
  serializeOps
} from './operations';

function transformMatching({ operations: expectedOps }) {
  return sinon.match(function({ operations: actualOps }) {
    return eq(serializeOps(expectedOps), serializeOps(actualOps));
  });
}

export { transformMatching };
