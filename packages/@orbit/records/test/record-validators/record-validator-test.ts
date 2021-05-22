import { RecordSchema } from '../../src/record-schema';
import { StandardRecordValidators } from '../../src/record-validators/standard-record-validators';
import { buildRecordValidatorFor } from '../../src/record-validators/record-validator-builder';
import { validateRecord } from '../../src/record-validators/record-validator';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateRecord', function (hooks) {
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
          }
        },
        relationships: {
          moons: { kind: 'hasMany', type: 'moon' }
        }
      },
      moon: {
        keys: {
          remoteId: { validation: { notNull: true } }
        },
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planet: {
            kind: 'hasOne',
            type: 'planet',
            validation: { notNull: true }
          }
        }
      },
      solarSystem: {
        keys: {
          remoteId: { validation: { notNull: true, required: true } }
        },
        attributes: {
          name: {
            type: 'string',
            validation: { required: true, notNull: true, minLength: 2 }
          }
        },
        relationships: {
          objects: {
            kind: 'hasMany',
            type: ['planet', 'moon'],
            validation: { required: true }
          },
          largestObject: { kind: 'hasOne', type: ['planet', 'moon'] }
        }
      }
    }
  });

  const validatorFor = buildRecordValidatorFor();

  test('will check that `type` and `id` are strings', function (assert) {
    assert.strictEqual(
      validateRecord({ type: 'moon', id: '1' }, { schema, validatorFor }),
      undefined
    );

    // Check invalid types
    [{}, { type: 'moon' }, { id: '' }, { type: 'moon', id: 9 }].forEach(
      (record: any) => {
        assert.deepEqual(validateRecord(record, { schema, validatorFor }), [
          {
            validator: StandardRecordValidators.RecordIdentity,
            validation: 'type',
            ref: record,
            description:
              'Record identities must be in the form `{ type, id }`, with string values for both `type` and `id`.'
          }
        ]);
      }
    );
  });

  test('will check that `type` is defined in the schema', function (assert) {
    assert.deepEqual(
      validateRecord({ type: 'fake', id: '1' }, { schema, validatorFor }),
      [
        {
          validator: StandardRecordValidators.RecordType,
          validation: 'recordTypeDefined',
          ref: 'fake',
          description: `Record type 'fake' does not exist in schema`
        }
      ]
    );
  });

  test('will check that fields are defined in the schema', function (assert) {
    assert.strictEqual(
      validateRecord(
        {
          type: 'moon',
          id: '1',
          attributes: { name: 'Luna' },
          keys: { remoteId: 'abc' },
          relationships: {
            planet: {}
          }
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'all fields are defined'
    );

    assert.deepEqual(
      validateRecord(
        {
          type: 'moon',
          id: '1',
          attributes: {
            name: 'Luna',
            fakeAttr: 'Earth'
          },
          relationships: {
            fakeRel: {}
          },
          keys: {
            fakeKey: '123'
          }
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
            type: 'moon',
            field: 'fakeKey'
          },
          description: `key 'fakeKey' for type 'moon' is not defined in schema`
        },
        {
          validator: StandardRecordValidators.RecordFieldDefinition,
          validation: 'fieldDefined',
          ref: {
            kind: 'attribute',
            type: 'moon',
            field: 'fakeAttr'
          },
          description: `attribute 'fakeAttr' for type 'moon' is not defined in schema`
        },
        {
          validator: StandardRecordValidators.RecordFieldDefinition,
          validation: 'fieldDefined',
          ref: {
            kind: 'relationship',
            type: 'moon',
            field: 'fakeRel'
          },
          description: `relationship 'fakeRel' for type 'moon' is not defined in schema`
        }
      ],
      'undefined fields are highlighted'
    );
  });

  test('will validate attribute values', function (assert) {
    assert.strictEqual(
      validateRecord(
        {
          type: 'planet',
          id: '1',
          attributes: {
            name: 'Earth'
          }
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined
    );

    assert.deepEqual(
      validateRecord(
        {
          type: 'planet',
          id: '1',
          attributes: {
            name: 'E'
          }
        },
        {
          schema,
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
            value: 'E'
          },
          details: [
            {
              validator: 'string',
              validation: 'minLength',
              description: 'is too short',
              ref: 'E',
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

  test('will validate key values', function (assert) {
    assert.strictEqual(
      validateRecord(
        {
          type: 'moon',
          id: '1',
          keys: {
            remoteId: 'a'
          }
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined
    );

    assert.deepEqual(
      validateRecord(
        {
          type: 'moon',
          id: '1',
          keys: {
            remoteId: null as any
          }
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordKey,
          validation: 'valueNotNull',
          ref: {
            record: { type: 'moon', id: '1' },
            key: 'remoteId',
            value: null
          },
          description: `value can not be null`
        }
      ]
    );
  });

  test('will validate relationship data', function (assert) {
    assert.strictEqual(
      validateRecord(
        {
          type: 'moon',
          id: '1',
          relationships: {
            planet: { data: { type: 'planet', id: '1' } }
          }
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined
    );

    assert.deepEqual(
      validateRecord(
        {
          type: 'moon',
          id: '1',
          relationships: {
            planet: { data: null }
          }
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordRelationship,
          validation: 'dataNotNull',
          ref: {
            record: { type: 'moon', id: '1' },
            relationship: 'planet',
            data: null
          },
          description: `data can not be null`
        }
      ]
    );
  });

  test('will check that required fields are defined, unless the record is "partial"', function (assert) {
    assert.strictEqual(
      validateRecord(
        {
          type: 'solarSystem',
          id: '1'
        },
        {
          schema,
          validatorFor,
          partialRecord: true
        }
      ),
      undefined
    );

    assert.deepEqual(
      validateRecord(
        {
          type: 'solarSystem',
          id: '1'
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordKey,
          validation: 'valueRequired',
          ref: {
            record: { type: 'solarSystem', id: '1' },
            key: 'remoteId',
            value: undefined
          },
          description: `value is required`
        },
        {
          validator: StandardRecordValidators.RecordAttribute,
          validation: 'valueRequired',
          ref: {
            record: { type: 'solarSystem', id: '1' },
            attribute: 'name',
            value: undefined
          },
          description: `value is required`
        },
        {
          validator: StandardRecordValidators.RecordRelationship,
          validation: 'dataRequired',
          ref: {
            record: { type: 'solarSystem', id: '1' },
            relationship: 'objects',
            data: undefined
          },
          description: `data is required`
        }
      ]
    );
  });
});
