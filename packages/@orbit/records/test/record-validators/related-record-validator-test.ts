import { RecordSchema } from '../../src/record-schema';
import { StandardRecordValidators } from '../../src/record-validators/standard-record-validators';
import { buildRecordValidatorFor } from '../../src/record-validators/record-validator-builder';
import { validateRelatedRecord } from '../../src/record-validators/related-record-validator';
import { formatValidationDescription } from '@orbit/validators';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateRelatedRecord', function (hooks) {
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

  test('will check that `relationship` is defined in schema', function (assert) {
    assert.strictEqual(
      validateRelatedRecord(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          relatedRecord: { type: 'planet', id: 'p1' }
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined
    );

    assert.deepEqual(
      validateRelatedRecord(
        {
          record: { type: 'fake', id: 'm1' },
          relationship: 'planet',
          relatedRecord: { type: 'planet', id: 'p1' }
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
      validateRelatedRecord(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'fake',
          relatedRecord: { type: 'planet', id: 'p1' }
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
      validateRelatedRecord(
        {
          record: { type: 'fake', id: 'm1' },
          relationship: 'planet',
          relatedRecord: { type: 'planet', id: 'p1' }
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
      validateRelatedRecord(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'unknown',
          relatedRecord: { type: 'planet', id: 'p1' }
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

  test('will check if relatedRecord is a valid record identity', function (assert) {
    const relationshipDef = schema.getRelationship('moon', 'planet');

    const issues = [
      {
        description: "Record type 'fake' does not exist in schema",
        ref: 'fake',
        validation: 'recordTypeDefined',
        validator: 'recordType'
      }
    ];

    assert.deepEqual(
      validateRelatedRecord(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          relatedRecord: { type: 'fake', id: 'p1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      [
        {
          validator: StandardRecordValidators.RelatedRecord,
          validation: 'relatedRecordValid',
          ref: {
            record: { type: 'moon', id: 'm1' },
            relationship: 'planet',
            relatedRecord: { type: 'fake', id: 'p1' }
          },
          description: formatValidationDescription(
            'relatedRecord is not a valid record identity',
            issues
          ),
          details: issues
        }
      ]
    );
  });

  test('will check if relatedRecord has an allowed type, when one type is allowed', function (assert) {
    const relationshipDef = schema.getRelationship('moon', 'planet');

    assert.deepEqual(
      validateRelatedRecord(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          relatedRecord: { type: 'planet', id: 'p1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      undefined
    );

    assert.deepEqual(
      validateRelatedRecord(
        {
          record: { type: 'moon', id: 'm1' },
          relationship: 'planet',
          relatedRecord: { type: 'solarSystem', id: 'ss1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      [
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
      ]
    );
  });

  test('will check if relatedRecord has an allowed type, when multiple types are allowed', function (assert) {
    const relationshipDef = schema.getRelationship('solarSystem', 'objects');

    assert.deepEqual(
      validateRelatedRecord(
        {
          record: { type: 'solarSystem', id: 'ss1' },
          relationship: 'objects',
          relatedRecord: { type: 'planet', id: 'p1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      undefined
    );

    assert.deepEqual(
      validateRelatedRecord(
        {
          record: { type: 'solarSystem', id: 'ss1' },
          relationship: 'objects',
          relatedRecord: { type: 'solarSystem', id: 'ss1' }
        },
        {
          relationshipDef,
          validatorFor,
          schema
        }
      ),
      [
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
      ]
    );
  });
});
