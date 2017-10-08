import {
  Schema,
  SchemaSettings,
  KeyMap,
  cloneRecordIdentity
} from '@orbit/data';
import CacheIntegrityProcessor from '../../../src/cache/operation-processors/cache-integrity-processor';
import Cache from '../../../src/cache';
import '../../test-helper';

const { module, test } = QUnit;

module('CacheIntegrityProcessor', function(hooks) {
  let schema, cache, processor;

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
    cache = new Cache({ schema, keyMap, processors: [CacheIntegrityProcessor] });
    processor = cache._processors[0];
  });

  hooks.afterEach(function() {
    schema = null;
    cache = null;
    processor = null;
  });

  test('reset empty cache', function(assert) {
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

    assert.deepEqual(cache.inverseRelationships.all(europa), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), [{
      record: { type: 'moon', id: 'europa' },
      relationship: 'planet'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);
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
                    relationships: { planet: { data: { type: 'planet', id: 'saturn' }} } };

    const europa = { type: 'moon', id: 'europa',
                    attributes: { name: 'Europa' },
                    relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(europa), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), [{
      record: { type: 'moon', id: 'europa' },
      relationship: 'planet'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);

    const addPlanetOp = {
      op: 'replaceRelatedRecord',
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
      []
    );

    assert.deepEqual(
      processor.finally(addPlanetOp),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(europa), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), []);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }, {
      record: { type: 'moon', id: 'europa' },
      relationship: 'planet'
    }]);
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
                    relationships: { planet: { data: { type: 'planet', id: 'saturn' }} } };

    const europa = { type: 'moon', id: 'europa',
                    attributes: { name: 'Europa' },
                    relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(europa), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), [{
      record: { type: 'moon', id: 'europa' },
      relationship: 'planet'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);

    const replacePlanetOp = {
      op: 'replaceRelatedRecord',
      record: europa,
      relationship: 'planet',
      relatedRecord: saturn
    };

    assert.deepEqual(
      processor.before(replacePlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(replacePlanetOp),
      []
    );

    assert.deepEqual(
      processor.finally(
        replacePlanetOp
      ),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(europa), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), []);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }, {
      record: { type: 'moon', id: 'europa' },
      relationship: 'planet'
    }]);
  });

  test('replace hasMany => hasOne with empty array', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                    attributes: { name: 'Saturn' },
                    relationships: { moons: { data: [{ type: 'moon', id: 'titan' }] } } };

    const titan = { type: 'moon', id: 'titan',
                    attributes: { name: 'Titan' },
                    relationships: { planet: { data: { type: 'planet', id: 'saturn' }} } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(titan)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);

    const clearMoonsOp = {
      op: 'replaceRelatedRecords',
      record: saturn,
      relationship: 'moons',
      relatedRecords: []
    };

    assert.deepEqual(
      processor.before(clearMoonsOp),
      []
    );

    assert.deepEqual(
      processor.after(clearMoonsOp),
      []
    );

    assert.deepEqual(
      processor.finally(clearMoonsOp),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(titan), []);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);
  });

  test('replace hasMany => hasOne with populated array', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                    attributes: { name: 'Saturn' },
                    relationships: { moons: { data: [{ type: 'moon', id: 'titan' }] } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                      attributes: { name: 'Jupiter' } };

    const titan = { type: 'moon', id: 'titan',
                    attributes: { name: 'Titan' },
                    relationships: { planet: { data: { type: 'planet', id: 'saturn' }} } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);

    const replaceMoonsOp = {
      op: 'replaceRelatedRecords',
      record: saturn,
      relationship: 'moons',
      relatedRecords: [{ type: 'moon', id: 'titan' }]
    };

    assert.deepEqual(
      processor.before(replaceMoonsOp),
      []
    );

    assert.deepEqual(
      processor.after(replaceMoonsOp),
      []
    );

    assert.deepEqual(
      processor.finally(replaceMoonsOp),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);
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

    assert.deepEqual(cache.inverseRelationships.all(europa), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), [{
      record: { type: 'moon', id: 'europa' },
      relationship: 'planet'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);

    const replaceMoonsOp = {
      op: 'replaceRelatedRecords',
      record: saturn,
      relationship: 'moons',
      relatedRecords: [{ type: 'moon', id: 'europa' }]
    };

    assert.deepEqual(
      processor.before(replaceMoonsOp),
      []
    );

    assert.deepEqual(
      processor.after(replaceMoonsOp),
      []
    );

    assert.deepEqual(
      processor.finally(replaceMoonsOp),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(europa), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'moons'
    }, {
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(titan), []);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), [{
      record: { type: 'moon', id: 'europa' },
      relationship: 'planet'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);
  });

  test('replace hasMany => hasMany', function(assert) {
    const human = { type: 'inhabitant', id: 'human', relationships: { planets: { data: [{ type: 'planet', id: 'earth' }] } } };
    const earth = { type: 'planet', id: 'earth', relationships: { inhabitants: { data: [{ type: 'inhabitant', id: 'human' }] } } };

    cache.patch(t => [
      t.addRecord(human),
      t.addRecord(earth)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(earth), [{
      record: { type: 'inhabitant', id: 'human' },
      relationship: 'planets'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(human), [{
      record: { type: 'planet', id: 'earth' },
      relationship: 'inhabitants'
    }]);

    const clearInhabitantsOp = {
      op: 'replaceRelatedRecords',
      record: earth,
      relationship: 'inhabitants',
      relatedRecords: []
    };

    assert.deepEqual(
      processor.after(clearInhabitantsOp),
      []
    );

    assert.deepEqual(
      processor.finally(clearInhabitantsOp),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(earth), [{
      record: { type: 'inhabitant', id: 'human' },
      relationship: 'planets'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(human), []);
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
                  relationships: { planet: { data: { type: 'planet', id: 'saturn' }} } };

    const europa = { type: 'moon', id: 'europa',
                    attributes: { name: 'Europa' },
                    relationships: { planet: { data: { type: 'planet', id: 'jupiter' } } } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(titan),
      t.addRecord(europa)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(europa), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), [{
      record: { type: 'moon', id: 'europa' },
      relationship: 'planet'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);

    const removePlanetOp = {
      op: 'replaceRelatedRecord',
      record: europa,
      relationship: 'planet',
      relatedRecord: null
    };

    assert.deepEqual(
      processor.before(removePlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(removePlanetOp),
      []
    );

    assert.deepEqual(
      processor.finally(removePlanetOp),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(europa), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(titan), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'moons'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), []);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'moon', id: 'titan' },
      relationship: 'planet'
    }]);
  });

  test('add to hasOne => hasOne', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                    attributes: { name: 'Saturn' },
                    relationships: { next: { data: { type: 'planet', id: 'jupiter' } } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                      attributes: { name: 'Jupiter' },
                      relationships: { previous: { data: { type: 'planet', id: 'saturn' }} } };

    const earth = { type: 'planet', id: 'earth',
                    attributes: { name: 'Earth' } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(earth)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'next'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'previous'
    }]);

    const changePlanetOp = {
      op: 'replaceRelatedRecord',
      record: earth,
      relationship: 'next',
      relatedRecord: saturn
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


    assert.deepEqual(cache.inverseRelationships.all(jupiter), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'next'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'previous'
    }, {
      record: { type: 'planet', id: 'earth' },
      relationship: 'next'
    }]);
  });

  test('replace hasOne => hasOne with existing value', function(assert) {
    const saturn = { type: 'planet', id: 'saturn',
                    attributes: { name: 'Saturn' },
                    relationships: { next: { data: { type: 'planet', id: 'jupiter' } } } };

    const jupiter = { type: 'planet', id: 'jupiter',
                      attributes: { name: 'Jupiter' },
                      relationships: { previous: { data: { type: 'planet', id: 'saturn' }} } };

    const earth = { type: 'planet', id: 'earth',
                    attributes: { name: 'Earth' } };

    cache.patch(t => [
      t.addRecord(saturn),
      t.addRecord(jupiter),
      t.addRecord(earth)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(jupiter), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'next'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'previous'
    }]);

    const changePlanetOp = {
      op: 'replaceRelatedRecord',
      record: earth,
      relationship: 'next',
      relatedRecord: jupiter
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

    assert.deepEqual(cache.inverseRelationships.all(jupiter), [{
      record: { type: 'planet', id: 'saturn' },
      relationship: 'next'
    }, {
      record: { type: 'planet', id: 'earth' },
      relationship: 'next'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(saturn), [{
      record: { type: 'planet', id: 'jupiter' },
      relationship: 'previous'
    }]);
  });

  test('add to hasMany => hasMany', function(assert) {
    const earth = { type: 'planet', id: 'earth' };
    const human = { type: 'inhabitant', id: 'human' };

    cache.patch(t => [
      t.addRecord(earth),
      t.addRecord(human)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(earth), []);
    assert.deepEqual(cache.inverseRelationships.all(human), []);

    const addPlanetOp = {
      op: 'addToRelatedRecords',
      record: human,
      relationship: 'planets',
      relatedRecord: earth
    };

    assert.deepEqual(
      processor.before(addPlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(addPlanetOp),
      []
    );

    assert.deepEqual(
      processor.finally(addPlanetOp),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(earth), [{
      record: { type: 'inhabitant', id: 'human' },
      relationship: 'planets'
    }]);
  });

  test('remove from hasMany => hasMany', function(assert) {
    const earth = { type: 'planet', id: 'earth', relationships: { inhabitants: { data: [{ type: 'inhabitant', id: 'human' }] } } };
    const human = { type: 'inhabitant', id: 'human', relationships: { planets: { data: [{ type: 'planet', id: 'earth' }] } } };

    cache.patch(t => [
      t.addRecord(earth),
      t.addRecord(human)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(earth), [{
      record: { type: 'inhabitant', id: 'human' },
      relationship: 'planets'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(human), [{
      record: { type: 'planet', id: 'earth' },
      relationship: 'inhabitants'
    }]);

    const removePlanetOp = {
      op: 'removeFromRelatedRecords',
      record: human,
      relationship: 'planets',
      relatedRecord: earth
    };

    assert.deepEqual(
      processor.before(removePlanetOp),
      []
    );

    assert.deepEqual(
      processor.after(removePlanetOp),
      []
    );

    assert.deepEqual(
      processor.finally(removePlanetOp),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(earth), []);

    assert.deepEqual(cache.inverseRelationships.all(human), [{
      record: { type: 'planet', id: 'earth' },
      relationship: 'inhabitants'
    }]);
  });

  test('remove record with hasMany relationships', function(assert) {
    const earth = { type: 'planet', id: 'earth', relationships: { inhabitants: { data: [{ type: 'inhabitant', id: 'human' }] } } };
    const human = { type: 'inhabitant', id: 'human', relationships: { planets: { data: [{ type: 'planet', id: 'earth' }] } } };

    cache.patch(t => [
      t.addRecord(earth),
      t.addRecord(human)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(earth), [{
      record: { type: 'inhabitant', id: 'human' },
      relationship: 'planets'
    }]);

    assert.deepEqual(cache.inverseRelationships.all(human), [{
      record: { type: 'planet', id: 'earth' },
      relationship: 'inhabitants'
    }]);

    const removeInhabitantOp = {
      op: 'removeRecord',
      record: human
    };

    assert.deepEqual(
      processor.before(removeInhabitantOp),
      []
    );

    assert.deepEqual(
      processor.after(removeInhabitantOp),
      [
        {
          op: 'removeFromRelatedRecords',
          record: cloneRecordIdentity(earth),
          relationship: 'inhabitants',
          relatedRecord: cloneRecordIdentity(human)
        }
      ]
    );

    assert.deepEqual(
      processor.finally(removeInhabitantOp),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(earth), []);
    assert.deepEqual(cache.inverseRelationships.all(human), []);
  });

  test('replaceRecord', function(assert) {
    const earth = { type: 'planet', id: 'earth' };
    const human = { type: 'inhabitant', id: 'human' };

    cache.patch(t => [
      t.addRecord(earth),
      t.addRecord(human)
    ]);

    assert.deepEqual(cache.inverseRelationships.all(earth), []);
    assert.deepEqual(cache.inverseRelationships.all(human), []);

    const humanOnEarth = {
      type: 'inhabitant',
      id: 'human',
      relationships: {
        planets: { data: [{ type: 'planet', id: 'earth' }] }
      }
    };

    const replaceHumanOp = {
      op: 'replaceRecord',
      record: humanOnEarth
    };

    assert.deepEqual(
      processor.before(replaceHumanOp),
      []
    );

    assert.deepEqual(
      processor.after(replaceHumanOp),
      []
    );

    assert.deepEqual(
      processor.finally(replaceHumanOp),
      []
    );

    assert.deepEqual(cache.inverseRelationships.all(earth), [{
      record: { type: 'inhabitant', id: 'human' },
      relationship: 'planets'
    }]);
    assert.deepEqual(cache.inverseRelationships.all(human), []);
  });
});
