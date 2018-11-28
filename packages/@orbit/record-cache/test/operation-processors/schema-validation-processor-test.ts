import {
  KeyMap,
  Schema,
  SchemaSettings,
  ModelNotFound
} from '@orbit/data';
import Cache from '../support/example-sync-record-cache';
import { SyncSchemaValidationProcessor } from '../../src/index';
import '../test-helper';

const { module, test } = QUnit;

module('SchemaValidationProcessor', function(hooks) {
  let schema, cache;

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

  test('replaceRecord with an unknown model type', assert => {
    assert.throws(() => {
      cache.patch(t => t.replaceRecord(unknown));
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
});
