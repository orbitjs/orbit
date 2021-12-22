import { RecordSchema } from '../../src/record-schema';
import { StandardRecordValidators } from '../../src/record-validators/standard-record-validators';
import { buildRecordValidatorFor } from '../../src/record-validators/record-validator-builder';
import { validateRecordRelationship } from '../../src/record-validators/record-relationship-validator';
import { formatValidationDescription } from '@orbit/validators';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateRecordRelationship', function (hooks) {
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
          remoteId: {}
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
          remoteId: {}
        },
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          objects: {
            kind: 'hasMany',
            type: ['planet', 'moon'],
            validation: { required: true, minItems: 1 }
          },
          largestObject: { kind: 'hasOne', type: ['planet', 'moon'] }
        }
      }
    }
  });

  const validatorFor = buildRecordValidatorFor();

  test('will check that `relationship` is defined in schema', function (assert) {
    assert.strictEqual(
      validateRecordRelationship(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          data: { type: 'planet', id: 'p1' }
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined
    );

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'fake', id: 'm1' },
          relationship: 'planet',
          data: { type: 'planet', id: 'p1' }
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
            kind: 'relationship',
            type: 'fake',
            field: 'planet'
          },
          description: `relationship 'planet' for type 'fake' is not defined in schema`
        }
      ]
    );

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'fake',
          data: { type: 'planet', id: 'p1' }
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
            kind: 'relationship',
            type: 'moon',
            field: 'fake'
          },
          description: `relationship 'fake' for type 'moon' is not defined in schema`
        }
      ]
    );
  });

  test('skips some schema checks if `relationshipDef` option is passed', function (assert) {
    const relationshipDef = schema.getRelationship('moon', 'planet');

    assert.strictEqual(
      validateRecordRelationship(
        {
          record: { type: 'fake', id: 'm1' },
          relationship: 'planet',
          data: { type: 'planet', id: 'p1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      undefined
    );

    assert.strictEqual(
      validateRecordRelationship(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'unknown',
          data: { type: 'planet', id: 'p1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      undefined
    );
  });

  test('will check that records in data are valid record identities', function (assert) {
    const relationshipDef = schema.getRelationship('moon', 'planet');

    const relationshipDataIssues = [
      {
        description: "Record type 'fake' does not exist in schema",
        ref: 'fake',
        validation: 'recordTypeDefined',
        validator: 'recordType'
      }
    ];

    const issues = [
      {
        validator: StandardRecordValidators.RelatedRecord,
        validation: 'relatedRecordValid',
        ref: {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          relatedRecord: { type: 'fake', id: 'p1' }
        },
        details: relationshipDataIssues,
        description: formatValidationDescription(
          'relatedRecord is not a valid record identity',
          relationshipDataIssues
        )
      }
    ];

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          data: { type: 'fake', id: 'p1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordRelationship,
          validation: 'dataValid',
          ref: {
            record: { type: 'moon', id: 'm1' },
            relationship: 'planet',
            data: { type: 'fake', id: 'p1' }
          },
          details: issues,
          description: formatValidationDescription(
            'relationship data is invalid',
            issues
          )
        }
      ]
    );
  });

  test('will check if relatedRecord has an allowed type, when one type is allowed', function (assert) {
    const relationshipDef = schema.getRelationship('moon', 'planet');

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          data: { type: 'planet', id: 'p1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      undefined
    );

    const issues = [
      {
        validator: StandardRecordValidators.RelatedRecord,
        validation: 'relatedRecordType',
        ref: {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          relatedRecord: { type: 'solarSystem', id: 'ss1' }
        },
        details: {
          allowedTypes: ['planet']
        },
        description:
          "relatedRecord has a type 'solarSystem' which is not an allowed type for this relationship"
      }
    ];

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          data: { type: 'solarSystem', id: 'ss1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordRelationship,
          validation: 'dataValid',
          ref: {
            record: { type: 'moon', id: 'm1' },
            relationship: 'planet',
            data: { type: 'solarSystem', id: 'ss1' }
          },
          details: issues,
          description: formatValidationDescription(
            'relationship data is invalid',
            issues
          )
        }
      ]
    );
  });

  test('will check if relatedRecord has an allowed type, when multiple types are allowed', function (assert) {
    const relationshipDef = schema.getRelationship('solarSystem', 'objects');

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'solarSystem', id: 'ss1' },
          relationship: 'objects',
          data: [{ type: 'planet', id: 'p1' }]
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      undefined
    );

    const issues = [
      {
        validator: StandardRecordValidators.RelatedRecord,
        validation: 'relatedRecordType',
        ref: {
          record: { type: 'solarSystem', id: 'ss1' },
          relationship: 'objects',
          relatedRecord: { type: 'solarSystem', id: 'ss1' }
        },
        details: {
          allowedTypes: ['planet', 'moon']
        },
        description:
          "relatedRecord has a type 'solarSystem' which is not an allowed type for this relationship"
      }
    ];

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'solarSystem', id: 'ss1' },
          relationship: 'objects',
          data: [{ type: 'solarSystem', id: 'ss1' }]
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordRelationship,
          validation: 'dataValid',
          ref: {
            record: { type: 'solarSystem', id: 'ss1' },
            relationship: 'objects',
            data: [{ type: 'solarSystem', id: 'ss1' }]
          },
          details: issues,
          description: formatValidationDescription(
            'relationship data is invalid',
            issues
          )
        }
      ]
    );
  });

  test('will check that hasMany relationships have an array', function (assert) {
    const relationshipDef = schema.getRelationship('solarSystem', 'objects');

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'solarSystem', id: 'ss1' },
          relationship: 'objects',
          data: { type: 'planet', id: 'p1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordRelationship,
          validation: 'dataValid',
          ref: {
            record: { type: 'solarSystem', id: 'ss1' },
            relationship: 'objects',
            data: { type: 'planet', id: 'p1' }
          },
          description: 'data for a hasMany relationship must be an array'
        }
      ]
    );
  });

  test('will check array validations like minItems for hasMany relationships', function (assert) {
    const relationshipDef = schema.getRelationship('solarSystem', 'objects');

    const issues = [
      {
        validator: 'array',
        validation: 'minItems',
        ref: [],
        details: {
          minItems: 1
        },
        description: 'has too few members'
      }
    ];

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'solarSystem', id: 'ss1' },
          relationship: 'objects',
          data: []
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordRelationship,
          validation: 'dataValid',
          ref: {
            record: { type: 'solarSystem', id: 'ss1' },
            relationship: 'objects',
            data: []
          },
          details: issues,
          description: formatValidationDescription(
            'relationship data is invalid',
            issues
          )
        }
      ]
    );
  });

  test('will check whether relationship data is `required`', function (assert) {
    const relationshipDef = schema.getRelationship('solarSystem', 'objects');

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'solarSystem', id: 'ss1' },
          relationship: 'objects',
          data: undefined as any
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordRelationship,
          validation: 'dataRequired',
          ref: {
            record: { type: 'solarSystem', id: 'ss1' },
            relationship: 'objects',
            data: undefined as any
          },
          description: 'data is required'
        }
      ]
    );
  });

  test('will check whether hasOne relationships can be `null`', function (assert) {
    const relationshipDef = schema.getRelationship('moon', 'planet');

    assert.deepEqual(
      validateRecordRelationship(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          data: null
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordRelationship,
          validation: 'dataNotNull',
          ref: {
            record: { type: 'moon', id: 'm1' },
            relationship: 'planet',
            data: null
          },
          description: 'data can not be null'
        }
      ]
    );
  });
});
