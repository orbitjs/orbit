import { RecordSchema } from '../../src/record-schema';
import { StandardRecordValidators } from '../../src/record-validators/standard-record-validators';
import { buildRecordValidatorFor } from '../../src/record-validators/record-validator-builder';
import { validateRecordOperation } from '../../src/record-validators/record-operation-validator';
import {
  RecordAttributeValidationIssue,
  RecordFieldDefinitionIssue,
  RecordKeyValidationIssue,
  RecordOperation,
  RecordRelationshipValidationIssue,
  RecordTypeValidationIssue,
  RelatedRecordValidationIssue
} from '../../src';
import { formatValidationDescription } from '@orbit/validators';

const { module, test } = QUnit;

///////////////////////////////////////////////////////////////////////////////

module('validateRecordOperation', function (hooks) {
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

  test("will validate 'addRecord' operations", function (assert) {
    const validRecord = {
      type: 'moon',
      id: '1',
      attributes: { name: 'Luna' },
      keys: { remoteId: 'abc' },
      relationships: {
        planet: {}
      }
    };

    assert.strictEqual(
      validateRecordOperation(
        {
          op: 'addRecord',
          record: validRecord
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid operation'
    );

    const invalidRecord = {
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
    };

    const issues: RecordFieldDefinitionIssue[] = [
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
    ];

    assert.deepEqual(
      validateRecordOperation(
        {
          op: 'addRecord',
          record: invalidRecord
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationValid',
          ref: {
            op: 'addRecord',
            record: invalidRecord
          },
          details: issues,
          description: formatValidationDescription(
            'record operation is invalid',
            issues
          )
        }
      ],
      'invalid operation'
    );
  });

  test("will validate 'updateRecord' operations", function (assert) {
    const validUpdate = {
      type: 'moon',
      id: '1',
      attributes: { name: 'Luna' }
    };

    assert.strictEqual(
      validateRecordOperation(
        {
          op: 'updateRecord',
          record: validUpdate
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid operation'
    );

    const invalidUpdate = {
      type: 'moon',
      id: '1',
      attributes: {
        name: 'Luna',
        fakeAttr: 'Earth'
      }
    };

    const issues: RecordFieldDefinitionIssue[] = [
      {
        validator: StandardRecordValidators.RecordFieldDefinition,
        validation: 'fieldDefined',
        ref: {
          kind: 'attribute',
          type: 'moon',
          field: 'fakeAttr'
        },
        description: `attribute 'fakeAttr' for type 'moon' is not defined in schema`
      }
    ];

    assert.deepEqual(
      validateRecordOperation(
        {
          op: 'updateRecord',
          record: invalidUpdate
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationValid',
          ref: {
            op: 'updateRecord',
            record: invalidUpdate
          },
          details: issues,
          description: formatValidationDescription(
            'record operation is invalid',
            issues
          )
        }
      ],
      'invalid operation'
    );
  });

  test("will validate 'removeRecord' operations", function (assert) {
    const validRecord = {
      type: 'moon',
      id: '1'
    };

    assert.strictEqual(
      validateRecordOperation(
        {
          op: 'removeRecord',
          record: validRecord
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid operation'
    );

    const invalidRecord = {
      type: 'fake',
      id: '1'
    };

    const issues: RecordTypeValidationIssue[] = [
      {
        validator: StandardRecordValidators.RecordType,
        validation: 'recordTypeDefined',
        ref: 'fake',
        description: `Record type 'fake' does not exist in schema`
      }
    ];

    assert.deepEqual(
      validateRecordOperation(
        {
          op: 'removeRecord',
          record: invalidRecord
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationValid',
          ref: {
            op: 'removeRecord',
            record: invalidRecord
          },
          details: issues,
          description: formatValidationDescription(
            'record operation is invalid',
            issues
          )
        }
      ],
      'invalid operation'
    );
  });

  test("will validate 'replaceKey' operations", function (assert) {
    const validRecord = {
      type: 'moon',
      id: '1'
    };

    assert.strictEqual(
      validateRecordOperation(
        {
          op: 'replaceKey',
          record: validRecord,
          key: 'remoteId',
          value: 'a'
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid operation'
    );

    const invalidRecord = {
      type: 'fake',
      id: '1'
    };

    const issues: RecordKeyValidationIssue[] = [
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
    ];

    assert.deepEqual(
      validateRecordOperation(
        {
          op: 'replaceKey',
          record: invalidRecord,
          key: 'remoteId',
          value: 'a'
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationValid',
          ref: {
            op: 'replaceKey',
            record: invalidRecord,
            key: 'remoteId',
            value: 'a'
          },
          details: issues,
          description: formatValidationDescription(
            'record operation is invalid',
            issues
          )
        }
      ],
      'invalid operation'
    );
  });

  test("will validate 'replaceAttribute' operations", function (assert) {
    const validRecord = {
      type: 'moon',
      id: '1'
    };

    assert.strictEqual(
      validateRecordOperation(
        {
          op: 'replaceAttribute',
          record: validRecord,
          attribute: 'name',
          value: 'a'
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid operation'
    );

    const invalidRecord = {
      type: 'fake',
      id: '1'
    };

    const issues: RecordAttributeValidationIssue[] = [
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
    ];

    assert.deepEqual(
      validateRecordOperation(
        {
          op: 'replaceAttribute',
          record: invalidRecord,
          attribute: 'name',
          value: 'a'
        },
        {
          schema,
          validatorFor
        }
      ),
      [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationValid',
          ref: {
            op: 'replaceAttribute',
            record: invalidRecord,
            attribute: 'name',
            value: 'a'
          },
          details: issues,
          description: formatValidationDescription(
            'record operation is invalid',
            issues
          )
        }
      ],
      'invalid operation'
    );
  });

  test("will validate 'addToRelatedRecords' operations", function (assert) {
    assert.strictEqual(
      validateRecordOperation(
        {
          op: 'addToRelatedRecords',
          record: {
            type: 'planet',
            id: '1'
          },
          relationship: 'moons',
          relatedRecord: {
            type: 'moon',
            id: '1'
          }
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid operation'
    );

    const invalidOperation: RecordOperation = {
      op: 'addToRelatedRecords',
      record: {
        type: 'planet',
        id: '1'
      },
      relationship: 'moons',
      relatedRecord: {
        type: 'planet',
        id: '1'
      }
    };

    const issues: RelatedRecordValidationIssue[] = [
      {
        validator: StandardRecordValidators.RelatedRecord,
        validation: 'relatedRecordType',
        ref: {
          record: { type: 'planet', id: '1' },
          relationship: 'moons',
          relatedRecord: { type: 'planet', id: '1' }
        },
        details: {
          allowedTypes: ['moon']
        },
        description:
          "relatedRecord has a type 'planet' which is not an allowed type for this relationship"
      }
    ];

    assert.deepEqual(
      validateRecordOperation(invalidOperation, {
        schema,
        validatorFor
      }),
      [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationValid',
          ref: invalidOperation,
          details: issues,
          description: formatValidationDescription(
            'record operation is invalid',
            issues
          )
        }
      ],
      'invalid operation'
    );
  });

  test("will validate 'removeFromRelatedRecords' operations", function (assert) {
    assert.strictEqual(
      validateRecordOperation(
        {
          op: 'removeFromRelatedRecords',
          record: {
            type: 'planet',
            id: '1'
          },
          relationship: 'moons',
          relatedRecord: {
            type: 'moon',
            id: '1'
          }
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid operation'
    );

    const invalidOperation: RecordOperation = {
      op: 'removeFromRelatedRecords',
      record: {
        type: 'planet',
        id: '1'
      },
      relationship: 'moons',
      relatedRecord: {
        type: 'planet',
        id: '1'
      }
    };

    const issues: RelatedRecordValidationIssue[] = [
      {
        validator: StandardRecordValidators.RelatedRecord,
        validation: 'relatedRecordType',
        ref: {
          record: { type: 'planet', id: '1' },
          relationship: 'moons',
          relatedRecord: { type: 'planet', id: '1' }
        },
        details: {
          allowedTypes: ['moon']
        },
        description:
          "relatedRecord has a type 'planet' which is not an allowed type for this relationship"
      }
    ];

    assert.deepEqual(
      validateRecordOperation(invalidOperation, {
        schema,
        validatorFor
      }),
      [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationValid',
          ref: invalidOperation,
          details: issues,
          description: formatValidationDescription(
            'record operation is invalid',
            issues
          )
        }
      ],
      'invalid operation'
    );
  });

  test("will validate 'replaceRelatedRecords' operations", function (assert) {
    assert.strictEqual(
      validateRecordOperation(
        {
          op: 'replaceRelatedRecords',
          record: {
            type: 'planet',
            id: '1'
          },
          relationship: 'moons',
          relatedRecords: [
            {
              type: 'moon',
              id: '1'
            }
          ]
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid operation'
    );

    const invalidOperation: RecordOperation = {
      op: 'replaceRelatedRecords',
      record: {
        type: 'planet',
        id: '1'
      },
      relationship: 'moons',
      relatedRecords: [
        {
          type: 'planet',
          id: '1'
        }
      ]
    };

    const relationshipDataIssues: RelatedRecordValidationIssue[] = [
      {
        validator: StandardRecordValidators.RelatedRecord,
        validation: 'relatedRecordType',
        ref: {
          record: { type: 'planet', id: '1' },
          relationship: 'moons',
          relatedRecord: { type: 'planet', id: '1' }
        },
        details: {
          allowedTypes: ['moon']
        },
        description:
          "relatedRecord has a type 'planet' which is not an allowed type for this relationship"
      }
    ];

    const issues: RecordRelationshipValidationIssue[] = [
      {
        validator: StandardRecordValidators.RecordRelationship,
        validation: 'dataValid',
        ref: {
          record: { type: 'planet', id: '1' },
          relationship: 'moons',
          data: [{ type: 'planet', id: '1' }]
        },
        details: relationshipDataIssues,
        description: formatValidationDescription(
          'relationship data is invalid',
          relationshipDataIssues
        )
      }
    ];

    assert.deepEqual(
      validateRecordOperation(invalidOperation, {
        schema,
        validatorFor
      }),
      [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationValid',
          ref: invalidOperation,
          details: issues,
          description: formatValidationDescription(
            'record operation is invalid',
            issues
          )
        }
      ],
      'invalid operation'
    );
  });

  test("will validate 'replaceRelatedRecord' operations", function (assert) {
    assert.strictEqual(
      validateRecordOperation(
        {
          op: 'replaceRelatedRecord',
          record: {
            type: 'moon',
            id: '1'
          },
          relationship: 'planet',
          relatedRecord: {
            type: 'planet',
            id: '1'
          }
        },
        {
          schema,
          validatorFor
        }
      ),
      undefined,
      'valid operation'
    );

    const invalidOperation: RecordOperation = {
      op: 'replaceRelatedRecord',
      record: {
        type: 'moon',
        id: '1'
      },
      relationship: 'planet',
      relatedRecord: {
        type: 'moon',
        id: '1'
      }
    };

    const relationshipDataIssues: RelatedRecordValidationIssue[] = [
      {
        validator: StandardRecordValidators.RelatedRecord,
        validation: 'relatedRecordType',
        ref: {
          record: { type: 'moon', id: '1' },
          relationship: 'planet',
          relatedRecord: { type: 'moon', id: '1' }
        },
        details: {
          allowedTypes: ['planet']
        },
        description:
          "relatedRecord has a type 'moon' which is not an allowed type for this relationship"
      }
    ];

    const issues: RecordRelationshipValidationIssue[] = [
      {
        validator: StandardRecordValidators.RecordRelationship,
        validation: 'dataValid',
        ref: {
          record: { type: 'moon', id: '1' },
          relationship: 'planet',
          data: { type: 'moon', id: '1' }
        },
        details: relationshipDataIssues,
        description: formatValidationDescription(
          'relationship data is invalid',
          relationshipDataIssues
        )
      }
    ];

    assert.deepEqual(
      validateRecordOperation(invalidOperation, {
        schema,
        validatorFor
      }),
      [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationValid',
          ref: invalidOperation,
          details: issues,
          description: formatValidationDescription(
            'record operation is invalid',
            issues
          )
        }
      ],
      'invalid operation'
    );
  });

  test('will validate unknown operations', function (assert) {
    const unknownOperation = ({
      op: 'unknown'
    } as unknown) as RecordOperation;

    assert.deepEqual(
      validateRecordOperation(unknownOperation, {
        schema,
        validatorFor
      }),
      [
        {
          validator: StandardRecordValidators.RecordOperation,
          validation: 'operationAllowed',
          ref: unknownOperation,
          description: "record operation 'unknown' is not recognized"
        }
      ],
      'invalid operation'
    );
  });
});
