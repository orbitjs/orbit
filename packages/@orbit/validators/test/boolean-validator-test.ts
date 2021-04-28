import { validateBoolean } from '../src/boolean-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateBoolean', function (hooks) {
  test('validates type', function (assert) {
    assert.strictEqual(validateBoolean(true), undefined);
    assert.strictEqual(validateBoolean(false), undefined);
    assert.deepEqual(validateBoolean('not-a-boolean' as any), [
      {
        validator: 'boolean',
        validation: 'type',
        ref: 'not-a-boolean' as any,
        description: 'is not a boolean'
      }
    ]);
  });
});
