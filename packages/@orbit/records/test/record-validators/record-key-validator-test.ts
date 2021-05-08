import { RecordSchema } from '../../src/record-schema';
import { StandardRecordValidators } from '../../src/record-validators/standard-record-validators';
import { validateRecordKey } from '../../src/record-validators/record-key-validator';
import { buildRecordValidatorFor } from '../../src/record-validators/record-validator-builder';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateRecordKey', function (hooks) {
  const schema = new RecordSchema({
    models: {
      planet: {
        keys: {
          remoteId: {
            validation: { required: true, notNull: true }
          }
        },
        attributes: {
          name: {
            type: 'string',
            validation: { required: true, notNull: true, minLength: 2 }
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

  test('will check that `key` is defined in schema', function (assert) {
    assert.strictEqual(
      validateRecordKey(
        {
          record: { type: 'planet', id: '1' },
          key: 'remoteId',
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
      validateRecordKey(
        {
          record: { type: 'fake', id: '1' },
          key: 'remoteId',
          value: 'earth'
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
            kind: 'key',
            type: 'fake',
            field: 'remoteId'
          },
          description: `key 'remoteId' for type 'fake' is not defined in schema`
        }
      ]
    );

    assert.deepEqual(
      validateRecordKey(
        {
          record: { type: 'planet', id: '1' },
          key: 'fake',
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
            kind: 'key',
            type: 'planet',
            field: 'fake'
          },
          description: `key 'fake' for type 'planet' is not defined in schema`
        }
      ]
    );
  });

  test('skips schema checks if `keyDef` option is passed instead of `schema`', function (assert) {
    const keyDef = schema.getKey('planet', 'remoteId');

    assert.strictEqual(
      validateRecordKey(
        {
          record: { type: 'fake', id: '1' },
          key: 'remoteId',
          value: 'earth'
        },
        {
          validatorFor,
          keyDef
        }
      ),
      undefined
    );

    assert.strictEqual(
      validateRecordKey(
        {
          record: { type: 'fake', id: '1' },
          key: 'unknown',
          value: 'earth'
        },
        {
          validatorFor,
          keyDef
        }
      ),
      undefined
    );
  });

  test('will check if a `key` is `required`', function (assert) {
    const keyDef = schema.getKey('planet', 'remoteId');

    assert.deepEqual(
      validateRecordKey(
        {
          record: { type: 'planet', id: '1' },
          key: 'remoteId',
          value: undefined as any
        },
        {
          validatorFor,
          keyDef
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordKey,
          validation: 'valueRequired',
          ref: {
            record: { type: 'planet', id: '1' },
            key: 'remoteId',
            value: undefined
          },
          description: `value is required`
        }
      ]
    );
  });

  test('will check if an `key` is `notNull`', function (assert) {
    const keyDef = schema.getKey('planet', 'remoteId');

    assert.deepEqual(
      validateRecordKey(
        {
          record: { type: 'planet', id: '1' },
          key: 'remoteId',
          value: null as any
        },
        {
          validatorFor,
          keyDef
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordKey,
          validation: 'valueNotNull',
          ref: {
            record: { type: 'planet', id: '1' },
            key: 'remoteId',
            value: null
          },
          description: `value can not be null`
        }
      ]
    );
  });

  test('will check if a `key` has a valid string `value`', function (assert) {
    const keyDef = schema.getKey('planet', 'remoteId');

    assert.deepEqual(
      validateRecordKey(
        {
          record: { type: 'planet', id: '1' },
          key: 'remoteId',
          value: [] as any
        },
        {
          validatorFor,
          keyDef
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordKey,
          validation: 'valueValid',
          ref: {
            record: { type: 'planet', id: '1' },
            key: 'remoteId',
            value: []
          },
          description: `value is invalid`
        }
      ]
    );
  });
});
