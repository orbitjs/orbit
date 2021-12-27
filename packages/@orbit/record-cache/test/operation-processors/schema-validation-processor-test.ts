import {
  ModelNotDefined,
  RecordKeyMap,
  RecordSchema,
  RecordSchemaSettings,
  RelationshipNotDefined,
  StandardRecordValidators,
  ValidationError
} from '@orbit/records';
import { ValidationIssue } from '@orbit/validators';
import { ExampleSyncRecordCache } from '../support/example-sync-record-cache';
import { SyncSchemaValidationProcessor } from '../../src/operation-processors/sync-schema-validation-processor';

const { module, test } = QUnit;

module('SchemaValidationProcessor', function (hooks) {
  let schema: RecordSchema;
  let cache: ExampleSyncRecordCache;

  const schemaDefinition: RecordSchemaSettings = {
    models: {
      node: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          parent: { kind: 'hasOne', type: 'node', inverse: 'children' },
          children: { kind: 'hasMany', type: 'node', inverse: 'parent' }
        }
      },
      person: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          favoritePet: { kind: 'hasOne', type: ['cat', 'dog'] },
          pets: { kind: 'hasMany', type: ['cat', 'dog'], inverse: 'owner' }
        }
      },
      cat: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          owner: { kind: 'hasOne', type: 'person', inverse: 'pets' }
        }
      },
      dog: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          owner: { kind: 'hasOne', type: 'person', inverse: 'pets' }
        }
      }
    }
  };

  const node = { type: 'node', id: '1' };
  const unknown = { type: 'unknown', id: '?' };
  const unknownError = new ModelNotDefined('unknown');

  hooks.beforeEach(function () {
    let keyMap = new RecordKeyMap();
    schema = new RecordSchema(schemaDefinition);
    cache = new ExampleSyncRecordCache({
      schema,
      keyMap,
      processors: [SyncSchemaValidationProcessor]
    });
  });

  test('addRecord with an unknown model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.addRecord(unknown));
    }, unknownError);
  });

  test('updateRecord with an unknown model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.updateRecord(unknown));
    }, unknownError);
  });

  test('removeRecord with an unknown model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.removeRecord(unknown));
    }, unknownError);
  });

  test('replaceKey with an unknown model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.replaceKey(unknown, 'key', 'value'));
    }, unknownError);
  });

  test('replaceAttribute with an unknown model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.replaceAttribute(unknown, 'attribute', 'value'));
    }, unknownError);
  });

  test('addToRelatedRecords with an unknown model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.addToRelatedRecords(unknown, 'children', node));
    }, unknownError);
  });

  test('addToRelatedRecords with an unknown related model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.addToRelatedRecords(node, 'children', unknown));
    }, unknownError);
  });

  test('addToRelatedRecords with a relationship not defined in the schema', (assert) => {
    assert.throws(
      () => {
        cache.update((t) =>
          t.addToRelatedRecords({ type: 'node', id: '1' }, 'sibling', {
            type: 'node',
            id: '2'
          })
        );
      },
      new ValidationError(
        'Validation isssues encountered while building a transform operation',
        [
          {
            validator: StandardRecordValidators.RecordOperation,
            validation: 'operationValid',
            description: `record operation is invalid\n- relationship 'sibling' for type 'node' is not defined in schema`
          }
        ]
      )
    );
  });

  test('addToRelatedRecord with a related record with an invalid type for a non-polymorphic relationship', (assert) => {
    assert.throws(
      () => {
        cache.update((t) =>
          t.addToRelatedRecords({ type: 'node', id: '1' }, 'children', {
            type: 'person',
            id: '1'
          })
        );
      },
      new ValidationError(
        'Validation isssues encountered while building a transform operation',
        [
          {
            validator: StandardRecordValidators.RecordOperation,
            validation: 'operationValid',
            description: `record operation is invalid\n- relatedRecord has a type 'person' which is not an allowed type for this relationship`
          }
        ]
      )
    );
  });

  test('addToRelatedRecords with a related record with an invalid type for a polymorphic relationship', (assert) => {
    assert.throws(
      () => {
        cache.update((t) =>
          t.addToRelatedRecords({ type: 'person', id: '1' }, 'pets', {
            type: 'person',
            id: '2'
          })
        );
      },
      new ValidationError(
        'Validation isssues encountered while building a transform operation',
        [
          {
            validator: StandardRecordValidators.RecordOperation,
            validation: 'operationValid',
            description: `record operation is invalid\n- relatedRecord has a type 'person' which is not an allowed type for this relationship`
          }
        ]
      )
    );
  });

  test('removeFromRelatedRecords with an unknown model type', (assert) => {
    assert.throws(() => {
      cache.update((t) =>
        t.removeFromRelatedRecords(unknown, 'children', node)
      );
    }, unknownError);
  });

  test('removeFromRelatedRecords with an unknown related model type', (assert) => {
    assert.throws(() => {
      cache.update((t) =>
        t.removeFromRelatedRecords(node, 'children', unknown)
      );
    }, unknownError);
  });

  test('replaceRelatedRecords with an unknown model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.replaceRelatedRecords(unknown, 'children', [node]));
    }, unknownError);
  });

  test('replaceRelatedRecords with an unknown related model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.replaceRelatedRecords(node, 'children', [unknown]));
    }, unknownError);
  });

  test('replaceRelatedRecords with a relationship not defined in the schema', (assert) => {
    assert.throws(
      () => {
        cache.update((t) =>
          t.replaceRelatedRecords({ type: 'node', id: '1' }, 'siblings', [
            { type: 'node', id: '2' }
          ])
        );
      },
      new ValidationError(
        'Validation isssues encountered while building a transform operation',
        [
          {
            validator: StandardRecordValidators.RecordOperation,
            validation: 'operationValid',
            description: `record operation is invalid\n- relationship 'siblings' for type 'node' is not defined in schema`
          }
        ]
      )
    );
  });

  test('replaceRelatedRecords with a related record with an invalid type for a non-polymorphic relationship', (assert) => {
    assert.throws(
      () => {
        cache.update((t) =>
          t.replaceRelatedRecords({ type: 'node', id: '1' }, 'children', [
            { type: 'person', id: '1' }
          ])
        );
      },
      new ValidationError(
        'Validation isssues encountered while building a transform operation',
        [
          {
            validator: StandardRecordValidators.RecordOperation,
            validation: 'operationValid',
            description: `record operation is invalid\n- relationship data is invalid\n  - relatedRecord has a type 'person' which is not an allowed type for this relationship`
          }
        ]
      )
    );
  });

  test('replaceRelatedRecords with a related record with an invalid type for a polymorphic relationship', (assert) => {
    assert.throws(
      () => {
        cache.update((t) =>
          t.replaceRelatedRecords({ type: 'person', id: '1' }, 'pets', [
            { type: 'person', id: '2' }
          ])
        );
      },
      new ValidationError(
        'Validation isssues encountered while building a transform operation',
        [
          {
            validator: StandardRecordValidators.RecordOperation,
            validation: 'operationValid',
            description: `record operation is invalid\n- relationship data is invalid\n  - relatedRecord has a type 'person' which is not an allowed type for this relationship`
          }
        ]
      )
    );
  });

  test('replaceRelatedRecord with an unknown model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.replaceRelatedRecord(unknown, 'parent', node));
    }, unknownError);
  });

  test('replaceRelatedRecord with an unknown related model type', (assert) => {
    assert.throws(() => {
      cache.update((t) => t.replaceRelatedRecord(node, 'parent', unknown));
    }, unknownError);
  });

  test('replaceRelatedRecord with a null related model', (assert) => {
    cache.update((t) => t.replaceRelatedRecord(node, 'parent', null));
    assert.ok(true, 'no error is thrown');
  });

  test('replaceRelatedRecord with a relationship not defined in the schema', (assert) => {
    assert.throws(
      () => {
        cache.update((t) =>
          t.replaceRelatedRecord({ type: 'node', id: '1' }, 'mother', {
            type: 'node',
            id: '1'
          })
        );
      },
      new ValidationError(
        'Validation isssues encountered while building a transform operation',
        [
          {
            validator: StandardRecordValidators.RecordOperation,
            validation: 'operationValid',
            description: `record operation is invalid\n- relationship 'mother' for type 'node' is not defined in schema`
          }
        ]
      )
    );
  });

  test('replaceRelatedRecord with a related record with an invalid type for a non-polymorphic relationship', (assert) => {
    assert.throws(
      () => {
        cache.update((t) =>
          t.replaceRelatedRecord({ type: 'node', id: '1' }, 'parent', {
            type: 'person',
            id: '1'
          })
        );
      },
      new ValidationError(
        'Validation isssues encountered while building a transform operation',
        [
          {
            validator: StandardRecordValidators.RecordOperation,
            validation: 'operationValid',
            description: `record operation is invalid\n- relationship data is invalid\n  - relatedRecord has a type 'person' which is not an allowed type for this relationship`
          }
        ]
      )
    );
  });

  test('replaceRelatedRecord with a related record with an invalid type for a polymorphic relationship', (assert) => {
    assert.throws(
      () => {
        cache.update((t) =>
          t.replaceRelatedRecord({ type: 'person', id: '1' }, 'favoritePet', {
            type: 'person',
            id: '2'
          })
        );
      },
      new ValidationError(
        'Validation isssues encountered while building a transform operation',
        [
          {
            validator: StandardRecordValidators.RecordOperation,
            validation: 'operationValid',
            description: `record operation is invalid\n- relationship data is invalid\n  - relatedRecord has a type 'person' which is not an allowed type for this relationship`
          }
        ]
      )
    );
  });
});
