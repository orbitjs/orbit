import { validateArray } from '../src/array-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateArray', function (hooks) {
  test('validates type', function (assert) {
    assert.strictEqual(validateArray([]), undefined);
    assert.deepEqual(validateArray('not-an-array' as any), [
      {
        validator: 'array',
        validation: 'type',
        ref: 'not-an-array' as any,
        description: 'is not an array'
      }
    ]);
  });

  test('validates minItems', function (assert) {
    assert.strictEqual(validateArray([], { minItems: 0 }), undefined);
    assert.strictEqual(validateArray(['a'], { minItems: 0 }), undefined);
    assert.deepEqual(validateArray([], { minItems: 1 }), [
      {
        validator: 'array',
        validation: 'minItems',
        ref: [],
        description: 'has too few members',
        details: {
          minItems: 1
        }
      }
    ]);
  });

  test('validates maxItems', function (assert) {
    assert.strictEqual(validateArray(['a', 'b'], { maxItems: 3 }), undefined);
    assert.strictEqual(validateArray(['a', 'b'], { maxItems: 2 }), undefined);
    assert.deepEqual(validateArray(['a', 'b'], { maxItems: 1 }), [
      {
        validator: 'array',
        validation: 'maxItems',
        ref: ['a', 'b'],
        description: 'has too many members',
        details: {
          maxItems: 1
        }
      }
    ]);
  });
});
