import { RecordSchema } from '../../src/record-schema';
import { StandardRecordValidators } from '../../src/record-validators/standard-record-validators';
import { buildRecordValidatorFor } from '../../src/record-validators/record-validator-builder';
import { validateRecordQueryExpression } from '../../src/record-validators/record-query-expression-validator';
import { RecordQueryExpression } from '../../src';
import { formatValidationDescription } from '@orbit/validators';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateRecordQueryExpression', function (hooks) {
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

  test("will validate 'findRecord' query expressions", function (assert) {
    const validRecord = {
      type: 'moon',
      id: '1'
    };

    assert.strictEqual(
      validateRecordQueryExpression(
        {
          op: 'findRecord',
          record: validRecord
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid query expression'
    );

    const invalidRecord = {
      type: 'unknown',
      id: '1'
    };

    const issues = [
      {
        validator: StandardRecordValidators.RecordType,
        validation: 'recordTypeDefined',
        ref: 'unknown',
        description: `Record type 'unknown' does not exist in schema`
      }
    ];

    assert.deepEqual(
      validateRecordQueryExpression(
        {
          op: 'findRecord',
          record: invalidRecord
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordQueryExpression,
          validation: 'queryExpressionValid',
          ref: {
            op: 'findRecord',
            record: invalidRecord
          },
          details: issues,
          description: formatValidationDescription(
            'record query expression is invalid',
            issues
          )
        }
      ],
      'invalid query expression'
    );
  });

  test("will validate 'findRelatedRecord' query expressions", function (assert) {
    const validRecord = {
      type: 'moon',
      id: '1'
    };

    assert.strictEqual(
      validateRecordQueryExpression(
        {
          op: 'findRelatedRecord',
          record: validRecord,
          relationship: 'planet'
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid query expression'
    );

    const invalidRecord = {
      type: 'unknown',
      id: '1'
    };

    const issues = [
      {
        validator: StandardRecordValidators.RecordType,
        validation: 'recordTypeDefined',
        ref: 'unknown',
        description: `Record type 'unknown' does not exist in schema`
      },
      {
        validator: StandardRecordValidators.RecordFieldDefinition,
        validation: 'fieldDefined',
        ref: {
          field: 'planet',
          kind: 'relationship',
          type: 'unknown'
        },
        description: `relationship 'planet' for type 'unknown' is not defined in schema`
      }
    ];

    assert.deepEqual(
      validateRecordQueryExpression(
        {
          op: 'findRelatedRecord',
          record: invalidRecord,
          relationship: 'planet'
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordQueryExpression,
          validation: 'queryExpressionValid',
          ref: {
            op: 'findRelatedRecord',
            record: invalidRecord,
            relationship: 'planet'
          },
          details: issues,
          description: formatValidationDescription(
            'record query expression is invalid',
            issues
          )
        }
      ],
      'invalid query expression'
    );
  });

  test("will validate 'findRelatedRecords' query expressions", function (assert) {
    const validRecord = {
      type: 'planet',
      id: '1'
    };

    assert.strictEqual(
      validateRecordQueryExpression(
        {
          op: 'findRelatedRecords',
          record: validRecord,
          relationship: 'moons'
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid query expression'
    );

    const invalidRecord = {
      type: 'unknown',
      id: '1'
    };

    const issues = [
      {
        validator: StandardRecordValidators.RecordType,
        validation: 'recordTypeDefined',
        ref: 'unknown',
        description: `Record type 'unknown' does not exist in schema`
      },
      {
        validator: StandardRecordValidators.RecordFieldDefinition,
        validation: 'fieldDefined',
        ref: {
          field: 'moons',
          kind: 'relationship',
          type: 'unknown'
        },
        description: `relationship 'moons' for type 'unknown' is not defined in schema`
      }
    ];

    assert.deepEqual(
      validateRecordQueryExpression(
        {
          op: 'findRelatedRecords',
          record: invalidRecord,
          relationship: 'moons'
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordQueryExpression,
          validation: 'queryExpressionValid',
          ref: {
            op: 'findRelatedRecords',
            record: invalidRecord,
            relationship: 'moons'
          },
          details: issues,
          description: formatValidationDescription(
            'record query expression is invalid',
            issues
          )
        }
      ],
      'invalid query expression'
    );
  });

  test("will validate 'findRecords' query expressions that request `type`", function (assert) {
    assert.strictEqual(
      validateRecordQueryExpression(
        {
          op: 'findRecords',
          type: 'moon'
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid query expression'
    );

    const issues = [
      {
        validator: StandardRecordValidators.RecordType,
        validation: 'recordTypeDefined',
        ref: 'unknown',
        description: `Record type 'unknown' does not exist in schema`
      }
    ];

    assert.deepEqual(
      validateRecordQueryExpression(
        {
          op: 'findRecords',
          type: 'unknown'
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordQueryExpression,
          validation: 'queryExpressionValid',
          ref: {
            op: 'findRecords',
            type: 'unknown'
          },
          details: issues,
          description: formatValidationDescription(
            'record query expression is invalid',
            issues
          )
        }
      ],
      'invalid query expression'
    );
  });

  test("will validate 'findRecords' query expressions that request `records`", function (assert) {
    const validRecord = {
      type: 'moon',
      id: '1'
    };

    assert.strictEqual(
      validateRecordQueryExpression(
        {
          op: 'findRecords',
          records: [validRecord]
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid query expression'
    );

    const invalidRecord = {
      type: 'unknown',
      id: '1'
    };

    const issues = [
      {
        validator: StandardRecordValidators.RecordType,
        validation: 'recordTypeDefined',
        ref: 'unknown',
        description: `Record type 'unknown' does not exist in schema`
      }
    ];

    assert.deepEqual(
      validateRecordQueryExpression(
        {
          op: 'findRecords',
          records: [invalidRecord]
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordQueryExpression,
          validation: 'queryExpressionValid',
          ref: {
            op: 'findRecords',
            records: [invalidRecord]
          },
          details: issues,
          description: formatValidationDescription(
            'record query expression is invalid',
            issues
          )
        }
      ],
      'invalid query expression'
    );
  });

  test('will validate unknown query expressions', function (assert) {
    const unknownQueryExpression = ({
      op: 'unknown'
    } as unknown) as RecordQueryExpression;

    assert.deepEqual(
      validateRecordQueryExpression(unknownQueryExpression, {
        schema,
        validatorFor
      }),
      [
        {
          validator: StandardRecordValidators.RecordQueryExpression,
          validation: 'queryExpressionAllowed',
          ref: unknownQueryExpression,
          description: "record query expression 'unknown' is not recognized"
        }
      ],
      'invalid query expression'
    );
  });
});
