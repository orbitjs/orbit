import { validateDate } from '../src/date-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateDate', function (hooks) {
  test('validates type', function (assert) {
    assert.strictEqual(validateDate(new Date()), undefined);
    assert.deepEqual(validateDate('not-a-date' as any), [
      {
        validator: 'date',
        validation: 'type',
        ref: 'not-a-date' as any,
        description: 'is not a date'
      }
    ]);
  });

  test('validates minimum', function (assert) {
    assert.strictEqual(
      validateDate(new Date(2021, 4, 1), { minimum: new Date(2021, 4, 0) }),
      undefined
    );
    assert.strictEqual(
      validateDate(new Date(2021, 4, 1), { minimum: new Date(2021, 4, 1) }),
      undefined
    );
    assert.deepEqual(
      validateDate(new Date(2021, 4, 1), { minimum: new Date(2021, 4, 2) }),
      [
        {
          validator: 'date',
          validation: 'minimum',
          description: 'is too early',
          ref: new Date(2021, 4, 1),
          details: {
            minimum: new Date(2021, 4, 2)
          }
        }
      ]
    );
  });

  test('validates maximum', function (assert) {
    assert.strictEqual(
      validateDate(new Date(2021, 4, 1), { maximum: new Date(2021, 4, 2) }),
      undefined
    );
    assert.strictEqual(
      validateDate(new Date(2021, 4, 1), { maximum: new Date(2021, 4, 1) }),
      undefined
    );
    assert.deepEqual(
      validateDate(new Date(2021, 4, 2), { maximum: new Date(2021, 4, 1) }),
      [
        {
          validator: 'date',
          validation: 'maximum',
          description: 'is too late',
          ref: new Date(2021, 4, 2),
          details: {
            maximum: new Date(2021, 4, 1)
          }
        }
      ]
    );
  });

  test('validates exclusiveMinimum', function (assert) {
    assert.strictEqual(
      validateDate(new Date(2021, 4, 1), {
        exclusiveMinimum: new Date(2021, 4, 0)
      }),
      undefined
    );
    assert.deepEqual(
      validateDate(new Date(2021, 4, 1), {
        exclusiveMinimum: new Date(2021, 4, 1)
      }),
      [
        {
          validator: 'date',
          validation: 'exclusiveMinimum',
          description: 'is too early',
          ref: new Date(2021, 4, 1),
          details: {
            exclusiveMinimum: new Date(2021, 4, 1)
          }
        }
      ]
    );
  });

  test('validates exclusiveMaximum', function (assert) {
    assert.strictEqual(
      validateDate(new Date(2021, 4, 1), {
        exclusiveMaximum: new Date(2021, 4, 2)
      }),
      undefined
    );
    assert.deepEqual(
      validateDate(new Date(2021, 4, 1), {
        exclusiveMaximum: new Date(2021, 4, 1)
      }),
      [
        {
          validator: 'date',
          validation: 'exclusiveMaximum',
          description: 'is too late',
          ref: new Date(2021, 4, 1),
          details: {
            exclusiveMaximum: new Date(2021, 4, 1)
          }
        }
      ]
    );
  });
});
