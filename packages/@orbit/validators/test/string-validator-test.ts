import { validateString } from '../src/string-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateString', function (hooks) {
  test('validates type', function (assert) {
    assert.strictEqual(validateString('ok'), undefined);
    assert.deepEqual(validateString([] as any), [
      {
        validator: 'string',
        validation: 'type',
        description: 'is not a string',
        ref: [] as any
      }
    ]);
  });

  test('validates minLength', function (assert) {
    assert.strictEqual(validateString('', { minLength: 0 }), undefined);
    assert.strictEqual(validateString('a', { minLength: 0 }), undefined);
    assert.deepEqual(validateString('', { minLength: 1 }), [
      {
        validator: 'string',
        validation: 'minLength',
        description: 'is too short',
        ref: '',
        details: {
          minLength: 1
        }
      }
    ]);
  });

  test('validates maxLength', function (assert) {
    assert.strictEqual(validateString('ab', { maxLength: 3 }), undefined);
    assert.strictEqual(validateString('ab', { maxLength: 2 }), undefined);
    assert.deepEqual(validateString('ab', { maxLength: 1 }), [
      {
        validator: 'string',
        validation: 'maxLength',
        description: 'is too long',
        ref: 'ab',
        details: {
          maxLength: 1
        }
      }
    ]);
  });
});
