import { eq } from 'orbit/lib/eq';
import TransformBuilder from 'orbit-common/transform/builder';

const transformBuilder = new TransformBuilder();

function transformMatching(transformCallback) {
  const transform = transformBuilder.build(transformCallback);
  const expectedOps = transform.operations;

  return sinon.match(function({ operations: actualOps }) {
    return eq(expectedOps, actualOps);
  });
}

export { transformMatching };
