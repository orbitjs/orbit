import {
  cloneRecordIdentity as identity,
  KeyMap,
  Schema,
  SchemaSettings,
  AddToRelatedRecordsOperation,
  ReplaceRelatedRecordOperation,
  ReplaceRelatedRecordsOperation,
  RemoveFromRelatedRecordsOperation,
  ReplaceRecordOperation
} from '@orbit/data';
import { SyncCacheIntegrityProcessor, SyncSchemaConsistencyProcessor } from '../../src/index';
import Cache from '../support/example-sync-record-cache';

const { module, test } = QUnit;

module('SchemaConsistencyProcessor', function(hooks) {
  let schema: Schema;
  let cache: Cache;
  let processor: SyncSchemaConsistencyProcessor;

  const schemaDefinition: SchemaSettings = {
    models: {
      planet: {
        attributes: {
          name: { type: 'string' },
          classification: { type: 'string' }
        },
        relationships: {
          moons: { type: 'hasMany', model: 'moon', inverse: 'planet' },
          inhabitants: { type: 'hasMany', model: 'inhabitant', inverse: 'planets' },
          next: { type: 'hasOne', model: 'planet', inverse: 'previous' },
          previous: { type: 'hasOne', model: 'planet', inverse: 'next' }
        }
      },
      moon: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
        }
      },
      inhabitant: {
        attributes: {
          name: { type: 'string' }
        },
        relationships: {
          planets: { type: 'hasMany', model: 'planet', inverse: 'inhabitants' }
        }
      }
    }
  };

  hooks.beforeEach(function() {
    let keyMap = new KeyMap();
    schema = new Schema(schemaDefinition);
    cache = new Cache({ schema, keyMap, processors: [SyncCacheIntegrityProcessor, SyncSchemaConsistencyProcessor] });
    processor = cache.processors[1] as SyncSchemaConsistencyProcessor;
  });

  hooks.afterEach(function() {
    schema = null;
    cache = null;
    processor = null;
  });

  test('add to hasOne => hasMany', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                    attributes: { name: 'Saturn' },
                    relationships: { moons: { data: [{ type: 'moon', id: 'titan' }] } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                      attributes: { name: 'Jupiter' },
                      relationships: { moons: { data: [{ type: 'moon', id: 'europa' }] } } };

    const titan = { type: 'moon', id: 'titan',
                    attributes: { name: 'Titan' },
                    relationships: { planet: { data: { type: 'planet', id: 'saturn' } } } };

    const europa = { type: 'moon', id: 'europa',
                    attributes: { name: 'Europa' },
                    relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    const addPlanetOp: AddToRelatedRecordsOperation = {
      op: 'addToRelatedRecords',
      record: { type: 'moon', id: europa.id },
      relationship: 'planet',
      relatedRecord: { type: 'planet', id: saturn.id }
    };

    assert.deepEqual(
      processor.before(addPlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(addPlanetOp),
      [
        {
          op: 'addToRelatedRecords',
          record: identity(saturn),
          relationship: 'moons',
          relatedRecord: identity(europa)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(addPlanetOp),
      []
    );
  });

  test('replace hasOne => hasMany', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                    attributes: { name: 'Saturn' },
                    relationships: { moons: { data: [{ type: 'moon', id: 'titan' }] } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                      attributes: { name: 'Jupiter' },
                      relationships: { moons: { data: [{ type: 'moon', id: 'europa' }] } } };

    const titan = { type: 'moon', id: 'titan',
                    attributes: { name: 'Titan' },
                    relationships: { planet: { data: { type: 'planet', id: 'saturn' } } } };

    const europa = { type: 'moon', id: 'europa',
                    attributes: { name: 'Europa' },
                    relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    const replacePlanetOp: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record: identity(europa),
      relationship: 'planet',
      relatedRecord: identity(saturn)
    };

    assert.deepEqual(
      processor.before(replacePlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(replacePlanetOp),
      [
        {
          op: 'removeFromRelatedRecords',
          record: identity(jupiter),
          relationship: 'moons',
          relatedRecord: identity(europa)
        },
        {
          op: 'addToRelatedRecords',
          record: identity(saturn),
          relationship: 'moons',
          relatedRecord: identity(europa)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(replacePlanetOp),
      [
      ]
    );
  });

  test('replace hasMany => hasOne with empty array', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                    attributes: { name: 'Saturn' },
                    relationships: { moons: { data: [{ type: 'moon', id: 'titan' }] } } };

    const titan = { type: 'moon', id: 'titan',
                    attributes: { name: 'Titan' },
                    relationships: { planet: { data: { type: 'planet', id: 'saturn' } } } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(titan)
    ]);

    const clearMoonsOp: ReplaceRelatedRecordsOperation = {
      op: 'replaceRelatedRecords',
      record: identity(saturn),
      relationship: 'moons',
      relatedRecords: []
    };

    assert.deepEqual(
      processor.before(clearMoonsOp),
      []
    );

    assert.deepEqual(
      processor.after(clearMoonsOp),
      [
        {
          op: 'replaceRelatedRecord',
          record: identity(titan),
          relationship: 'planet',
          relatedRecord: null
        }
      ]
    );

    assert.deepEqual(
      processor.finally(clearMoonsOp),
      []
    );
  });

  test('replace hasMany => hasOne with populated array', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                    attributes: { name: 'Saturn' },
                    relationships: { moons: { data: [{ type: 'moon', id: 'titan' }] } } };

    const titan = { type: 'moon', id: 'titan',
                    attributes: { name: 'Titan' },
                    relationships: { planet: { data: { type: 'planet', id: 'saturn' } } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                      attributes: { name: 'Jupiter' } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan)
    ]);

    const replaceMoonsOp: ReplaceRelatedRecordsOperation = {
      op: 'replaceRelatedRecords',
      record: identity(jupiter),
      relationship: 'moons',
      relatedRecords: [identity(titan)]
    };

    assert.deepEqual(
      processor.before(replaceMoonsOp),
      []
    );

    assert.deepEqual(
      processor.after(replaceMoonsOp),
      [
        {
          op: 'replaceRelatedRecord',
          record: identity(titan),
          relationship: 'planet',
          relatedRecord: identity(jupiter)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(replaceMoonsOp),
      []
    );
  });

  test('replace hasMany => hasOne with populated array, when already populated', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                  attributes: { name: 'Saturn' },
                  relationships: { moons: { data: [{ type: 'moon', id: 'titan' }] } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                    attributes: { name: 'Jupiter' },
                    relationships: { moons: { data: [{ type: 'moon', id: 'europa' }] } } };

    const titan = { type: 'moon', id: 'titan',
                  attributes: { name: 'Titan' },
                  relationships: { planet: { data: { type: 'planet', id: 'saturn' } } } };

    const europa = { type: 'moon', id: 'europa',
                  attributes: { name: 'Europa' },
                  relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    const replaceMoonsOp: ReplaceRelatedRecordsOperation = {
      op: 'replaceRelatedRecords',
      record: identity(saturn),
      relationship: 'moons',
      relatedRecords: [identity(europa)]
    };

    assert.deepEqual(
      processor.before(replaceMoonsOp),
      []
    );

    assert.deepEqual(
      processor.after(replaceMoonsOp),
      [
        {
          op: 'replaceRelatedRecord',
          record: identity(titan),
          relationship: 'planet',
          relatedRecord: null
        },
        {
          op: 'replaceRelatedRecord',
          record: identity(europa),
          relationship: 'planet',
          relatedRecord: identity(saturn)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(replaceMoonsOp),
      []
    );
  });

  test('replace hasMany => hasMany, clearing records', function(assert) {
    const human = { type: 'inhabitant', id: 'human', relationships: { planets: { data: [{ type: 'planet', id: 'earth' }] } } };
    const earth = { type: 'planet', id: 'earth', relationships: { inhabitants: { data: [{ type: 'inhabitant', id: 'human' }] } } };

    cache.patch(t => [
      t.addRecord(earth),
      t.addRecord(human)
    ]);

    const clearInhabitantsOp: ReplaceRelatedRecordsOperation = {
      op: 'replaceRelatedRecords',
      record: identity(earth),
      relationship: 'inhabitants',
      relatedRecords: []
    };

    assert.deepEqual(
      processor.after(clearInhabitantsOp),
      [
        {
          op: 'removeFromRelatedRecords',
          record: identity(human),
          relationship: 'planets',
          relatedRecord: identity(earth)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(clearInhabitantsOp),
      []
    );
  });

  test('replace hasMany => hasMany, replacing some records', function(assert) {
    const human = { type: 'inhabitant', id: 'human', relationships: { planets: { data: [{ type: 'planet', id: 'earth' }] } } };
    const cat = { type: 'inhabitant', id: 'cat' };
    const dog = { type: 'inhabitant', id: 'dog' };
    const earth = { type: 'planet', id: 'earth', relationships: { inhabitants: { data: [{ type: 'inhabitant', id: 'human' }] } } };

    cache.patch(t => [
      t.addRecord(earth),
      t.addRecord(human),
      t.addRecord(cat),
      t.addRecord(dog)
    ]);

    const clearInhabitantsOp: ReplaceRelatedRecordsOperation = {
      op: 'replaceRelatedRecords',
      record: identity(earth),
      relationship: 'inhabitants',
      relatedRecords: [identity(human), identity(cat), identity(dog)]
    };

    assert.deepEqual(
      processor.after(clearInhabitantsOp),
      [
        {
          op: 'addToRelatedRecords',
          record: identity(cat),
          relationship: 'planets',
          relatedRecord: identity(earth)
        },
        {
          op: 'addToRelatedRecords',
          record: identity(dog),
          relationship: 'planets',
          relatedRecord: identity(earth)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(clearInhabitantsOp),
      []
    );
  });

  test('remove hasOne => hasMany', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                  attributes: { name: 'Saturn' },
                  relationships: { moons: { data: [{ type: 'moon', id: 'titan' }] } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                    attributes: { name: 'Jupiter' },
                    relationships: { moons: { data: [{ type: 'moon', id: 'europa' }] } } };

    const titan = { type: 'moon', id: 'titan',
                  attributes: { name: 'Titan' },
                  relationships: { planet: { data: { type: 'planet', id: 'saturn' } } } };

    const europa = { type: 'moon', id: 'europa',
                  attributes: { name: 'Europa' },
                  relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    const removePlanetOp: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record: identity(europa),
      relationship: 'planet',
      relatedRecord: null
    };

    assert.deepEqual(
      processor.before(removePlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(removePlanetOp),
      [
        {
          op: 'removeFromRelatedRecords',
          record: identity(jupiter),
          relationship: 'moons',
          relatedRecord: identity(europa)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(removePlanetOp),
      []
    );
  });

  test('add to hasOne => hasOne', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                  attributes: { name: 'Saturn' },
                  relationships: { next: { data: { type: 'planet', id: 'jupiter' } } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                    attributes: { name: 'Jupiter' },
                    relationships: { previous: { data: { type: 'planet', id: 'saturn' } } } };

    const earth = { type: 'planet', id: 'earth',
                  attributes: { name: 'Earth' } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(earth)
    ]);

    const changePlanetOp: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record: identity(earth),
      relationship: 'next',
      relatedRecord: identity(saturn)
    };

    assert.deepEqual(
      processor.before(changePlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(changePlanetOp),
      [
        {
          op: 'replaceRelatedRecord',
          record: identity(saturn),
          relationship: 'previous',
          relatedRecord: identity(earth)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(changePlanetOp),
      []
    );
  });

  test('replace hasOne => hasOne with existing value', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                  attributes: { name: 'Saturn' },
                  relationships: { next: { data: { type: 'planet', id: 'jupiter' } } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                    attributes: { name: 'Jupiter' },
                    relationships: { previous: { data: { type: 'planet', id: 'saturn' } } } };

    const earth = { type: 'planet', id: 'earth',
                  attributes: { name: 'Earth' } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(earth)
    ]);

    const changePlanetOp: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record: identity(earth),
      relationship: 'next',
      relatedRecord: identity(jupiter)
    };

    assert.deepEqual(
      processor.before(changePlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(changePlanetOp),
      [
        {
          op: 'replaceRelatedRecord',
          record: identity(jupiter),
          relationship: 'previous',
          relatedRecord: identity(earth)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(changePlanetOp),
      []
    );
  });

  test('replace hasOne => hasOne with current existing value', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                  attributes: { name: 'Saturn' },
                  relationships: { next: { data: { type: 'planet', id: 'jupiter' } } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                    attributes: { name: 'Jupiter' },
                    relationships: { previous: { data: { type: 'planet', id: 'saturn' } } } };

    const earth = { type: 'planet', id: 'earth',
                  attributes: { name: 'Earth' } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(earth)
    ]);

    const changePlanetOp: ReplaceRelatedRecordOperation = {
      op: 'replaceRelatedRecord',
      record: identity(saturn),
      relationship: 'next',
      relatedRecord: identity(jupiter)
    };

    assert.deepEqual(
      processor.before(changePlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(changePlanetOp),
      []
    );

    assert.deepEqual(
      processor.finally(changePlanetOp),
      []
    );
  });

  test('add to hasMany => hasMany', function(assert) {
    const earth = { type: 'planet', id: 'earth' };
    const human = { type: 'inhabitant', id: 'human' };

    cache.patch(t => [
      t.addRecord(earth),
      t.addRecord(human)
    ]);

    const addPlanetOp: AddToRelatedRecordsOperation = {
      op: 'addToRelatedRecords',
      record: identity(human),
      relationship: 'planets',
      relatedRecord: identity(earth)
    };

    assert.deepEqual(
      processor.before(addPlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(addPlanetOp),
      [
        {
          op: 'addToRelatedRecords',
          record: identity(earth),
          relationship: 'inhabitants',
          relatedRecord: identity(human)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(addPlanetOp),
      []
    );
  });

  test('remove from hasMany => hasMany', function(assert) {
    const earth = { type: 'planet', id: 'earth', relationships: { inhabitants: { data: [{ type: 'inhabitant', id: 'human' }] } } };
    const human = { type: 'inhabitant', id: 'human', relationships: { planets: { data: [{ type: 'planet', id: 'earth' }] } } };

    cache.patch(t => [
      t.addRecord(earth),
      t.addRecord(human)
    ]);

    const removePlanetOp: RemoveFromRelatedRecordsOperation = {
      op: 'removeFromRelatedRecords',
      record: identity(human),
      relationship: 'planets',
      relatedRecord: identity(earth)
    };

    assert.deepEqual(
      processor.before(removePlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(removePlanetOp),
      [
        {
          op: 'removeFromRelatedRecords',
          record: identity(earth),
          relationship: 'inhabitants',
          relatedRecord: identity(human)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(removePlanetOp),
      []
    );
  });

  test('replaceRecord', function(assert) {
    const human = { type: 'inhabitant', id: 'human', relationships: { planets: { data: [{ type: 'planet', id: 'earth' }] } } };
    const cat = { type: 'inhabitant', id: 'cat' };
    const dog = { type: 'inhabitant', id: 'dog' };
    const moon = { type: 'moon', id: 'themoon' };
    const saturn = { type: 'planet', id: 'saturn',
                  attributes: { name: 'Saturn' },
                  relationships: { next: { data: { type: 'planet', id: 'jupiter' } } } };
    const jupiter = { type: 'planet', id: 'jupiter',
                    attributes: { name: 'Jupiter' },
                    relationships: { previous: { data: { type: 'planet', id: 'saturn' } } } };
    const earth = {
      type: 'planet', id: 'earth',
      relationships: {
        inhabitants: {
          data: [{ type: 'inhabitant', id: 'human' }]
        },
        next: {
          data: { type: 'planet', id: 'jupiter' }
        }
      }
    };
    const earth2 = {
      type: 'planet', id: 'earth',
      relationships: {
        inhabitants: {
          data: [
            { type: 'inhabitant', id: 'human' },
            { type: 'inhabitant', id: 'cat' },
            { type: 'inhabitant', id: 'dog' }
          ]
        },
        moons: {
          data: [{ type: 'moon', id: 'themoon' }]
        },
        next: {
          data: { type: 'planet', id: 'saturn' }
        }
      }
    };

    cache.patch(t => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(saturn),
      t.addRecord(moon),
      t.addRecord(human),
      t.addRecord(cat),
      t.addRecord(dog)
    ]);

    const clearInhabitantsOp: ReplaceRecordOperation = {
      op: 'replaceRecord',
      record: earth2
    };

    assert.deepEqual(
      processor.after(clearInhabitantsOp),
      [
        {
          op: 'addToRelatedRecords',
          record: identity(cat),
          relationship: 'planets',
          relatedRecord: identity(earth)
        },
        {
          op: 'addToRelatedRecords',
          record: identity(dog),
          relationship: 'planets',
          relatedRecord: identity(earth)
        },
        {
          op: 'replaceRelatedRecord',
          record: identity(moon),
          relationship: 'planet',
          relatedRecord: identity(earth)
        },
        {
          op: 'replaceRelatedRecord',
          record: identity(jupiter),
          relationship: 'previous',
          relatedRecord: null
        },
        {
          op: 'replaceRelatedRecord',
          record: identity(saturn),
          relationship: 'previous',
          relatedRecord: identity(earth)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(clearInhabitantsOp),
      []
    );
  });
});
