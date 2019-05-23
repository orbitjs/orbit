import {
  KeyMap,
  Schema,
  SchemaSettings,
  ModelNotFound,
  RelationshipNotFound,
  IncorrectRelatedRecordType
} from '@orbit/data';
import Cache from '../support/example-sync-record-cache';
import { SyncSchemaValidationProcessor } from '../../src/index';

const { module, test } = QUnit;

module('SchemaValidationProcessor', function(hooks) {
  let schema: Schema;
  let cache: Cache;

  const schemaDefinition: SchemaSettings = {
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
  const unknownError = new ModelNotFound('unknown');

  hooks.beforeEach(function() {
    let keyMap = new KeyMap();
    schema = new Schema(schemaDefinition);
    cache = new Cache({
      schema,
      keyMap,
      processors: [SyncSchemaValidationProcessor]
    });
  });

  hooks.afterEach(function() {
    schema = null;
    cache = null;
  });

  test('addRecord with an unknown model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.addRecord(unknown));
    }, unknownError);
  });

  test('updateRecord with an unknown model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.updateRecord(unknown));
    }, unknownError);
  });

  test('removeRecord with an unknown model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.removeRecord(unknown));
    }, unknownError);
  });

  test('replaceKey with an unknown model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceKey(unknown, 'key', 'value'));
    }, unknownError);
  });

  test('replaceAttribute with an unknown model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceAttribute(unknown, 'attribute', 'value'));
    }, unknownError);
  });

  test('addToRelatedRecords with an unknown model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.addToRelatedRecords(unknown, 'children', node));
    }, unknownError);
  });

  test('addToRelatedRecords with an unknown related model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.addToRelatedRecords(node, 'children', unknown));
    }, unknownError);
  });

  test('addToRelatedRecords with a relationship not defined in the schema', assert => {
    assert.throws(() => {
      cache.patch(t =>
        t.addToRelatedRecords({ type: 'node', id: '1' }, 'sibling', {
          type: 'node',
          id: '2'
        })
      );
    }, new RelationshipNotFound('sibling', 'node'));
  });

  test('addToRelatedRecord with a related record with an invalid type for a non-polymorphic relationship', assert => {
    assert.throws(() => {
      cache.patch(t =>
        t.addToRelatedRecords({ type: 'node', id: '1' }, 'children', {
          type: 'person',
          id: '1'
        })
      );
    }, new IncorrectRelatedRecordType('person', 'children', 'node'));
  });

  test('addToRelatedRecords with a related record with an invalid type for a polymorphic relationship', assert => {
    assert.throws(() => {
      cache.patch(t =>
        t.addToRelatedRecords({ type: 'person', id: '1' }, 'pets', {
          type: 'person',
          id: '2'
        })
      );
    }, new IncorrectRelatedRecordType('person', 'pets', 'person'));
  });

  test('removeFromRelatedRecords with an unknown model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.removeFromRelatedRecords(unknown, 'children', node));
    }, unknownError);
  });

  test('removeFromRelatedRecords with an unknown related model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.removeFromRelatedRecords(node, 'children', unknown));
    }, unknownError);
  });

  test('replaceRelatedRecords with an unknown model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceRelatedRecords(unknown, 'children', [node]));
    }, unknownError);
  });

  test('replaceRelatedRecords with an unknown related model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceRelatedRecords(node, 'children', [unknown]));
    }, unknownError);
  });

  test('replaceRelatedRecords with a relationship not defined in the schema', assert => {
    assert.throws(() => {
      cache.patch(t =>
        t.replaceRelatedRecords({ type: 'node', id: '1' }, 'siblings', [
          { type: 'node', id: '2' }
        ])
      );
    }, new RelationshipNotFound('siblings', 'node'));
  });

  test('replaceRelatedRecords with a related record with an invalid type for a non-polymorphic relationship', assert => {
    assert.throws(() => {
      cache.patch(t =>
        t.replaceRelatedRecords({ type: 'node', id: '1' }, 'children', [
          { type: 'person', id: '1' }
        ])
      );
    }, new IncorrectRelatedRecordType('person', 'children', 'node'));
  });

  test('replaceRelatedRecords with a related record with an invalid type for a polymorphic relationship', assert => {
    assert.throws(() => {
      cache.patch(t =>
        t.replaceRelatedRecords({ type: 'person', id: '1' }, 'pets', [
          { type: 'person', id: '2' }
        ])
      );
    }, new IncorrectRelatedRecordType('person', 'pets', 'person'));
  });

  test('replaceRelatedRecord with an unknown model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceRelatedRecord(unknown, 'parent', node));
    }, unknownError);
  });

  test('replaceRelatedRecord with an unknown related model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceRelatedRecord(node, 'parent', unknown));
    }, unknownError);
  });

  test('replaceRelatedRecord with a null related model', assert => {
    cache.patch(t => t.replaceRelatedRecord(node, 'parent', null));
    assert.ok(true, 'no error is thrown');
  });

  test('replaceRelatedRecord with a relationship not defined in the schema', assert => {
    assert.throws(() => {
      cache.patch(t =>
        t.replaceRelatedRecord({ type: 'node', id: '1' }, 'mother', {
          type: 'node',
          id: '1'
        })
      );
    }, new RelationshipNotFound('mother', 'node'));
  });

  test('replaceRelatedRecord with a related record with an invalid type for a non-polymorphic relationship', assert => {
    assert.throws(() => {
      cache.patch(t =>
        t.replaceRelatedRecord({ type: 'node', id: '1' }, 'parent', {
          type: 'person',
          id: '1'
        })
      );
    }, new IncorrectRelatedRecordType('person', 'parent', 'node'));
  });

  test('replaceRelatedRecord with a related record with an invalid type for a polymorphic relationship', assert => {
    assert.throws(() => {
      cache.patch(t =>
        t.replaceRelatedRecord({ type: 'person', id: '1' }, 'favoritePet', {
          type: 'person',
          id: '2'
        })
      );
    }, new IncorrectRelatedRecordType('person', 'favoritePet', 'person'));
  });
});
