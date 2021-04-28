import { validateNumber } from '../src/number-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateNumber', function (hooks) {
  test('validates type', function (assert) {
    assert.strictEqual(validateNumber(1), undefined);
    assert.deepEqual(validateNumber('not-a-number' as any), [
      {
        validator: 'number',
        validation: 'type',
        description: 'is not a number',
        ref: 'not-a-number' as any
      }
    ]);
  });

  test('validates minimum', function (assert) {
    assert.strictEqual(validateNumber(1, { minimum: 0 }), undefined);
    assert.strictEqual(validateNumber(1, { minimum: 1 }), undefined);
    assert.deepEqual(validateNumber(1, { minimum: 2 }), [
      {
        validator: 'number',
        validation: 'minimum',
        description: 'is too low',
        ref: 1,
        details: {
          minimum: 2
        }
      }
    ]);
  });

  test('validates maximum', function (assert) {
    assert.strictEqual(validateNumber(1, { maximum: 2 }), undefined);
    assert.strictEqual(validateNumber(1, { maximum: 1 }), undefined);
    assert.deepEqual(validateNumber(2, { maximum: 1 }), [
      {
        validator: 'number',
        validation: 'maximum',
        description: 'is too high',
        ref: 2,
        details: {
          maximum: 1
        }
      }
    ]);
  });

  test('validates exclusiveMinimum', function (assert) {
    assert.strictEqual(validateNumber(1, { exclusiveMinimum: 0 }), undefined);
    assert.deepEqual(validateNumber(1, { exclusiveMinimum: 1 }), [
      {
        validator: 'number',
        validation: 'exclusiveMinimum',
        description: 'is too low',
        ref: 1,
        details: {
          exclusiveMinimum: 1
        }
      }
    ]);
  });

  test('validates exclusiveMaximum', function (assert) {
    assert.strictEqual(validateNumber(1, { exclusiveMaximum: 2 }), undefined);
    assert.deepEqual(validateNumber(2, { exclusiveMaximum: 2 }), [
      {
        validator: 'number',
        validation: 'exclusiveMaximum',
        description: 'is too high',
        ref: 2,
        details: {
          exclusiveMaximum: 2
        }
      }
    ]);
  });
});
