import { validateObject } from '../src/object-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateObject', function (hooks) {
  test('validates type', function (assert) {
    assert.strictEqual(validateObject({}), undefined);
    assert.deepEqual(validateObject('not-an-object' as any), [
      {
        validator: 'object',
        validation: 'type',
        ref: 'not-an-object' as any,
        description: 'is not an object'
      }
    ]);
  });
});
