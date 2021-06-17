import { RecordSchema } from '../../src/record-schema';
import { StandardRecordValidators } from '../../src/record-validators/standard-record-validators';
import { buildRecordValidatorFor } from '../../src/record-validators/record-validator-builder';
import { validateRecordAttribute } from '../../src/record-validators/record-attribute-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateRecordAttribute', function (hooks) {
  const schema = new RecordSchema({
    models: {
      planet: {
        keys: {
          remoteId: {}
        },
        attributes: {
          name: {
            type: 'string',
            validation: { required: true, notNull: true, minLength: 2 }
          },
          description: {
            type: 'fake' // Validator does not exist for this type
          }
        },
        relationships: {
          moons: { kind: 'hasMany', type: 'moon' }
        }
      },
      moon: {
        keys: {
          remoteId: {}
        },
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planet: { kind: 'hasOne', type: 'planet' }
        }
      },
      solarSystem: {
        keys: {
          remoteId: {}
        },
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          objects: { kind: 'hasMany', type: ['planet', 'moon'] },
          largestObject: { kind: 'hasOne', type: ['planet', 'moon'] }
        }
      }
    }
  });

  const validatorFor = buildRecordValidatorFor();

  test('will check that `attribute` is defined in schema', function (assert) {
    assert.strictEqual(
      validateRecordAttribute(
        {
          record: { type: 'planet', id: '1' },
          attribute: 'name',
          value: 'Earth'
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined
    );

    assert.deepEqual(
      validateRecordAttribute(
        {
          record: { type: 'fake', id: '1' },
          attribute: 'name',
          value: 'Earth'
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordFieldDefinition,
          validation: 'fieldDefined',
          ref: {
            kind: 'attribute',
            type: 'fake',
            field: 'name'
          },
          description: `attribute 'name' for type 'fake' is not defined in schema`
        }
      ]
    );

    assert.deepEqual(
      validateRecordAttribute(
        {
          record: { type: 'planet', id: '1' },
          attribute: 'fake',
          value: 'Earth'
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordFieldDefinition,
          validation: 'fieldDefined',
          ref: {
            kind: 'attribute',
            type: 'planet',
            field: 'fake'
          },
          description: `attribute 'fake' for type 'planet' is not defined in schema`
        }
      ]
    );
  });

  test('skips schema checks if `attributeDef` option is passed instead of `schema`', function (assert) {
    const attributeDef = schema.getAttribute('planet', 'name');

    assert.strictEqual(
      validateRecordAttribute(
        {
          record: { type: 'fake', id: '1' },
          attribute: 'name',
          value: 'Earth'
        },
        {
          attributeDef,
          validatorFor
        }
      ),
      undefined
    );

    assert.strictEqual(
      validateRecordAttribute(
        {
          record: { type: 'fake', id: '1' },
          attribute: 'unknown',
          value: 'Earth'
        },
        {
          attributeDef,
          validatorFor
        }
      ),
      undefined
    );
  });

  test('will check if an `attribute` is `required`', function (assert) {
    const attributeDef = schema.getAttribute('planet', 'name');

    assert.deepEqual(
      validateRecordAttribute(
        {
          record: { type: 'planet', id: '1' },
          attribute: 'name',
          value: undefined
        },
        {
          attributeDef,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordAttribute,
          validation: 'valueRequired',
          ref: {
            record: { type: 'planet', id: '1' },
            attribute: 'name',
            value: undefined
          },
          description: `value is required`
        }
      ]
    );
  });

  test('will check if an `attribute` is `notNull`', function (assert) {
    const attributeDef = schema.getAttribute('planet', 'name');

    assert.deepEqual(
      validateRecordAttribute(
        {
          record: { type: 'planet', id: '1' },
          attribute: 'name',
          value: null
        },
        {
          attributeDef,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordAttribute,
          validation: 'valueNotNull',
          ref: {
            record: { type: 'planet', id: '1' },
            attribute: 'name',
            value: null
          },
          description: `value can not be null`
        }
      ]
    );
  });

  test('will check if an `attribute` has a valid `value` according to its type', function (assert) {
    const attributeDef = schema.getAttribute('planet', 'name');

    assert.deepEqual(
      validateRecordAttribute(
        {
          record: { type: 'planet', id: '1' },
          attribute: 'name',
          value: 'a'
        },
        {
          attributeDef,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordAttribute,
          validation: 'valueValid',
          ref: {
            record: { type: 'planet', id: '1' },
            attribute: 'name',
            value: 'a'
          },
          details: [
            {
              validator: 'string',
              validation: 'minLength',
              description: 'is too short',
              ref: 'a',
              details: {
                minLength: 2
              }
            }
          ],
          description: `value is invalid`
        }
      ]
    );
  });

  test('will check if an `attribute` has a validator defined for its `type`', function (assert) {
    const attributeDef = schema.getAttribute('planet', 'description');

    assert.deepEqual(
      validateRecordAttribute(
        {
          record: { type: 'planet', id: '1' },
          attribute: 'description',
          value: 'a'
        },
        {
          attributeDef,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordAttribute,
          validation: 'type',
          ref: {
            record: { type: 'planet', id: '1' },
            attribute: 'description',
            value: 'a'
          },
          description:
            "validator has not been provided for attribute 'description' of `type` 'fake'"
        }
      ]
    );
  });
});
