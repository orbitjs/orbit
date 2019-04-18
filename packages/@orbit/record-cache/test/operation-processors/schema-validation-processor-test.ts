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
          name: { type: 'string' },
        },
        relationships: {
          parent: { type: 'hasOne', model: 'node', inverse: 'children' },
          children: { type: 'hasMany', model: 'node', inverse: 'parent' }
        }
      },
      person: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          pets: { type: 'hasMany', model: ['cat', 'dog'], inverse: 'owner' }
        }
      },
      cat: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          owner: { type: 'hasOne', model: 'person', inverse: 'pets' }
        }
      },
      dog: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          owner: { type: 'hasOne', model: 'person', inverse: 'pets' }
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
    cache = new Cache({ schema, keyMap, processors: [SyncSchemaValidationProcessor] });
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

  test('addToRelatedRecords with an unknown relationship type', assert => {
    assert.throws(() => {
      cache.patch(t => t.addToRelatedRecords({ type: 'person', id: '1'}, 'animals', { type: 'dog', id: '1' }));
    }, new RelationshipNotFound('animals', 'person'));
  });

  test('addToRelatedRecords with a related record with an invalid type for a polymorphic relationship', assert => {
    assert.throws(() => {
      cache.patch(t => t.addToRelatedRecords({ type: 'person', id: '1'}, 'pets', { type: 'person', id: '2' }));
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

  test('replaceRelatedRecords with an unknown relationship type', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceRelatedRecords({ type: 'person', id: '1'}, 'animals', [{ type: 'dog', id: '1' }]));
    }, new RelationshipNotFound('animals', 'person'));
  });
  
  test('replaceRelatedRecords with a related record with an invalid type for a polymorphic relationship', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceRelatedRecords({ type: 'person', id: '1'}, 'pets', [{ type: 'person', id: '2' }]));
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

  test('replaceRelatedRecord with an unknown relationship type', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceRelatedRecord({ type: 'dog', id: '1'}, 'human', { type: 'person', id: '1' }));
    }, new RelationshipNotFound('human', 'dog'));
  });

  test('replaceRelatedRecord with an invalid type', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceRelatedRecord({ type: 'dog', id: '1'}, 'owner', { type: 'dog', id: '2' }));
    }, new RelationshipNotFound('dog', 'owner', 'dog'));
  });
});
