import Schema from 'orbit-common/schema';
import SchemaConsistencyProcessor from 'orbit-common/cache/operation-processors/schema-consistency-processor';
import { uuid } from 'orbit/lib/uuid';
import Cache from 'orbit-common/cache';
import Orbit from 'orbit/main';
import { Promise } from 'rsvp';
import { identity } from 'orbit-common/lib/identifiers';

let schema,
    cache,
    processor;

const schemaDefinition = {
  models: {
    planet: {
      attributes: {
        name: { type: 'string' },
        classification: { type: 'string' }
      },
      relationships: {
        moons: { type: 'hasMany', model: 'moon', inverse: 'planet', actsAsSet: true },
        races: { type: 'hasMany', model: 'race', inverse: 'planets' },
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
    race: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planets: { type: 'hasMany', model: 'planet', inverse: 'races' }
      }
    }
  }
};

module('OC - OperationProcessors - SchemaConsistencyProcessor', {
  setup() {
    schema = new Schema(schemaDefinition);
    cache = new Cache(schema, { processors: [SchemaConsistencyProcessor] });
    processor = cache._processors[0];
  },

  teardown() {
    schema = null;
    cache = null;
    processor = null;
  }
});

test('add to hasOne => hasMany', function(assert) {
  const saturn = { type: 'planet', id: 'saturn',
                   attributes: { name: 'Saturn' },
                   relationships: { moons: { data: { 'moon:titan': true } } } };

  const jupiter = { type: 'planet', id: 'jupiter',
                    attributes: { name: 'Jupiter' },
                    relationships: { moons: { data: { 'moon:europa': true } } } };

  const titan = { type: 'moon', id: 'titan',
                  attributes: { name: 'Titan' },
                  relationships: { planet: { data: 'planet:saturn' } } };

  const europa = { type: 'moon', id: 'europa',
                   attributes: { name: 'Europa' },
                   relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({
    planet: { saturn, jupiter },
    moon: { titan, europa }
  });

  const addPlanetOp = {
    op: 'addToHasMany',
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
    [
      {
        op: 'addToHasMany',
        record: identity(saturn),
        relationship: 'moons',
        relatedRecord: identity(europa)
      }
    ]
  );
});

test('replace hasOne => hasMany', function(assert) {
  const saturn = { type: 'planet', id: 'saturn',
                   attributes: { name: 'Saturn' },
                   relationships: { moons: { data: { 'moon:titan': true } } } };

  const jupiter = { type: 'planet', id: 'jupiter',
                    attributes: { name: 'Jupiter' },
                    relationships: { moons: { data: { 'moon:europa': true } } } };

  const titan = { type: 'moon', id: 'titan',
                  attributes: { name: 'Titan' },
                  relationships: { planet: { data: 'planet:saturn' } } };

  const europa = { type: 'moon', id: 'europa',
                   attributes: { name: 'Europa' },
                   relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({
    planet: { saturn, jupiter },
    moon: { titan, europa }
  });

  const replacePlanetOp = {
    op: 'replaceHasOne',
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
        op: 'removeFromHasMany',
        record: identity(jupiter),
        relationship: 'moons',
        relatedRecord: identity(europa)
      }
    ]
  );

  assert.deepEqual(
    processor.finally(
      replacePlanetOp
    ),
    [
      {
        op: 'addToHasMany',
        record: identity(saturn),
        relationship: 'moons',
        relatedRecord: identity(europa)
      }
    ]
  );
});

test('replace hasMany => hasOne with empty array', function(assert) {
  const saturn = { type: 'planet', id: 'saturn',
                   attributes: { name: 'Saturn' },
                   relationships: { moons: { data: { 'moon:titan': true } } } };

  const titan = { type: 'moon', id: 'titan',
                  attributes: { name: 'Titan' },
                  relationships: { planet: { data: 'planet:saturn' } } };

  cache.reset({
    planet: { saturn },
    moon: { titan }
  });

  const clearMoonsOp = {
    op: 'replaceHasMany',
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
        op: 'replaceHasOne',
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
                   relationships: { moons: { data: { 'moon:titan': true } } } };

  const titan = { type: 'moon', id: 'titan',
                  attributes: { name: 'Titan' },
                  relationships: { planet: { data: 'planet:saturn' } } };

  const jupiter = { type: 'planet', id: 'jupiter',
                    attributes: { name: 'Jupiter' },
                    relationships: { moons: {} } };

  cache.reset({
    planet: { saturn, jupiter },
    moon: { titan }
  });

  const replaceMoonsOp = {
    op: 'replaceHasMany',
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
      // op('replace', ['moon', titan.id, 'relationships', 'planet'], null),
      // op('remove', ['planet', saturn.id, 'relationships', 'moons', titan.id])
    ]
  );

  assert.deepEqual(
    processor.finally(replaceMoonsOp),
    [
      {
        op: 'replaceHasOne',
        record: identity(titan),
        relationship: 'planet',
        relatedRecord: identity(jupiter)
      }
    ]
  );
});

test('replace hasMany => hasOne with populated array, when already populated', function(assert) {
  const saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: { 'moon:titan': true } } } };

  const jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: { 'moon:europa': true } } } };

  const titan = { type: 'moon', id: 'titan',
                attributes: { name: 'Titan' },
                relationships: { planet: { data: 'planet:saturn' } } };

  const europa = { type: 'moon', id: 'europa',
                 attributes: { name: 'Europa' },
                 relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({
    planet: { saturn, jupiter },
    moon: { titan, europa }
  });

  const replaceMoonsOp = {
    op: 'replaceHasMany',
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
        op: 'replaceHasOne',
        record: identity(titan),
        relationship: 'planet',
        relatedRecord: null
      }
      // op('replace', ['moon', europa.id, 'relationships', 'planet'], null),
      // op('remove', ['planet', jupiter.id, 'relationships', 'moons', europa.id])
    ]
  );

  assert.deepEqual(
    processor.finally(replaceMoonsOp),
    [
      {
        op: 'replaceHasOne',
        record: identity(europa),
        relationship: 'planet',
        relatedRecord: identity(saturn)
      }
    ]
  );
});

test('replace hasMany => hasMany', function(assert) {
  const human = { type: 'race', id: 'human', relationships: { planets: { data: { 'planet:earth': true } } } };
  const earth = { type: 'planet', id: 'earth', relationships: { races: { data: { 'race:human': true } } } };

  cache.reset({
    race: { human },
    planet: { earth }
  });

  const clearRacesOp = {
    op: 'replaceHasMany',
    record: identity(earth),
    relationship: 'races',
    relatedRecords: []
  };

  assert.deepEqual(
    processor.after(clearRacesOp),
    [
      {
        op: 'removeFromHasMany',
        record: identity(human),
        relationship: 'planets',
        relatedRecord: identity(earth)
      }
    ]
  );

  assert.deepEqual(
    processor.finally(clearRacesOp),
    []
  );
});

test('remove hasOne => hasMany', function(assert) {
  const saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: { 'moon:titan': true } } } };

  const jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: { 'moon:europa': true } } } };

  const titan = { type: 'moon', id: 'titan',
                attributes: { name: 'Titan' },
                relationships: { planet: { data: 'planet:saturn' } } };

  const europa = { type: 'moon', id: 'europa',
                 attributes: { name: 'Europa' },
                 relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({
    planet: { saturn, jupiter },
    moon: { titan, europa }
  });

  const removePlanetOp = {
    op: 'replaceHasOne',
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
        op: 'removeFromHasMany',
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
                 relationships: { next: { data: 'planet:jupiter' } } };

  const jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { previous: { data: 'planet:saturn' } } };

  const earth = { type: 'planet', id: 'earth',
                attributes: { name: 'Earth' } };

  cache.reset({
    planet: { saturn, jupiter, earth }
  });

  const changePlanetOp = {
    op: 'replaceHasOne',
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
    []
  );

  assert.deepEqual(
    processor.finally(changePlanetOp),
    [
      {
        op: 'replaceHasOne',
        record: identity(saturn),
        relationship: 'previous',
        relatedRecord: identity(earth)
      }
    ]
  );
});

test('replace hasOne => hasOne with existing value', function(assert) {
  const saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { next: { data: 'planet:jupiter' } } };

  const jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { previous: { data: 'planet:saturn' } } };

  const earth = { type: 'planet', id: 'earth',
                attributes: { name: 'Earth' } };

  cache.reset({
    planet: { saturn, jupiter, earth }
  });

  const changePlanetOp = {
    op: 'replaceHasOne',
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
      // op('remove', ['planet', saturn.id, 'relationships', 'next'])
    ]
  );

  assert.deepEqual(
    processor.finally(changePlanetOp),
    [
      {
        op: 'replaceHasOne',
        record: identity(jupiter),
        relationship: 'previous',
        relatedRecord: identity(earth)
      }
    ]
  );
});

test('add to hasMany => hasMany', function(assert) {
  const earth = { type: 'planet', id: 'earth' };
  const human = { type: 'race', id: 'human' };

  cache.reset({
    planet: { earth },
    race: { human }
  });

  const addPlanetOp = {
    op: 'addToHasMany',
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
    []
  );

  assert.deepEqual(
    processor.finally(addPlanetOp),
    [
      {
        op: 'addToHasMany',
        record: identity(earth),
        relationship: 'races',
        relatedRecord: identity(human)
      }
    ]
  );
});

test('remove from hasMany => hasMany', function(assert) {
  const earth = { type: 'planet', id: 'earth', relationships: { races: { data: { 'race:human': true } } } };
  const human = { type: 'race', id: 'human', relationships: { planets: { data: { 'planet:earth': true } } } };

  cache.reset({
    planet: { earth },
    race: { human }
  });

  const removePlanetOp = {
    op: 'removeFromHasMany',
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
        op: 'removeFromHasMany',
        record: identity(earth),
        relationship: 'races',
        relatedRecord: identity(human)
      }
    ]
  );

  assert.deepEqual(
    processor.finally(removePlanetOp),
    []
  );
});
