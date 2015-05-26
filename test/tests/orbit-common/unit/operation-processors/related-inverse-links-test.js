import Schema from 'orbit-common/schema';
import RelatedInverseLinksProcessor from 'orbit-common/operation-processors/related-inverse-links';
import { uuid } from 'orbit/lib/uuid';
import Operation from 'orbit/operation';
import { op } from 'tests/test-helper';
import Cache from 'orbit-common/cache';
import Orbit from 'orbit/main';
import { Promise } from 'rsvp';

var schemaDefinition = {
  modelDefaults: {
    keys: {
      '__id': {primaryKey: true, defaultValue: uuid}
    }
  },
  models: {
    planet: {
      attributes: {
        name: {type: 'string'},
        classification: {type: 'string'}
      },
      links: {
        moons: {type: 'hasMany', model: 'moon', inverse: 'planet', actsAsSet: true},
        races: {type: 'hasMany', model: 'race', inverse: 'planets'},
        next: {type: 'hasOne', model: 'planet', inverse: 'previous'},
        previous: {type: 'hasOne', model: 'planet', inverse: 'next'}
      }
    },
    moon: {
      attributes: {
        name: {type: 'string'}
      },
      links: {
        planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
      }
    },
    race: {
      attributes: {
        name: {type: 'string'},
      },
      links: {
        planets: {type: 'hasMany', model: 'planet', inverse: 'races'}
      }
    }
  }
};

var schema,
    cache,
    processor;

module('OC - OperationProcessors - RelatedInverseLinks', {
  setup: function(){
    Orbit.Promise = Promise;

    schema = new Schema(schemaDefinition);
    cache = new Cache(schema);
    processor = new RelatedInverseLinksProcessor(schema, cache);
  },

  teardown: function(){
    schema = null;
    cache = null;
    processor = null;
  }
});

function operationsShouldMatch(actualOperations, expectedOperations){
  console.log("actual", actualOperations);
  equal(actualOperations.length, expectedOperations.length, 'Same number of operations');

  for(var i = 0; i < actualOperations.length; i++){
    var actual = actualOperations[i];
    var expected = expectedOperations[i];
    deepEqual(actual.serialize(), expected.serialize(), "Operation " + i + " matches");
  }
}


test('add to hasOne => hasMany', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: { 'europa': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var europa = { id: 'europa', name: "Europa", __rel: { planet: 'jupiter' } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  operationsShouldMatch(
    processor.process(
      op('add', ['moon', europa.id, '__rel', 'planet'], saturn.id)
    ),
    [
      // op('remove', ['planet', jupiter.id, '__rel', 'moons', europa.id]),
      op('add', ['planet', saturn.id, '__rel', 'moons', europa.id], true)
    ]
  );
});

test('replace hasOne => hasMany', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: { 'europa': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var europa = { id: 'europa', name: "Europa", __rel: { planet: 'jupiter' } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  operationsShouldMatch(
    processor.process(
      op('replace', ['moon', europa.id, '__rel', 'planet'], saturn.id)
    ),
    [
      // op('remove', ['planet', jupiter.id, '__rel', 'moons', europa.id]),
      op('add', ['planet', saturn.id, '__rel', 'moons', europa.id], true)
    ]
  );
});

test('replace hasMany => hasOne with empty array', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };

  cache.reset({
    planet: { saturn: saturn },
    moon: { titan: titan }
  });

  operationsShouldMatch(
    processor.process(
      op('replace', ['planet', saturn.id, '__rel', 'moons'], {})
    ),
    [
      // op('remove', ['moon', titan.id, '__rel', 'planet'])
    ]
  );
});

test('replace hasMany => hasOne with empty array', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };

  cache.reset({
    planet: { saturn: saturn },
    moon: { titan: titan }
  });

  operationsShouldMatch(
    processor.process(
      op('replace', ['planet', saturn.id, '__rel', 'moons'], {})
    ),
    [
      // op('remove', ['moon', titan.id, '__rel', 'planet'])
    ]
  );
});

test('replace hasMany => hasOne with populated array', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: {} } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan }
  });

  operationsShouldMatch(
    processor.process(
      op('replace', ['planet', jupiter.id, '__rel', 'moons'], {titan: true})
    ),
    [
      op('replace', ['moon', titan.id, '__rel', 'planet'], jupiter.id),
      // op('remove', ['planet', saturn.id, '__rel', 'moons', titan.id])
    ]
  );
});

test('replace hasMany => hasMany', function(){
  var human = { id: 'human', __rel: { planets: { earth: true } }};
  var earth = { id: 'earth', __rel: { races: { human: true}  }};

  cache.reset({
    race: { human: human },
    planet: { earth: earth }
  });

  operationsShouldMatch(
    processor.process(
      op('replace', ['planet', earth.id, '__rel', 'races'], {})
    ),
    [
      // op('replace', ['planet', earth.id, '__rel', 'races'], {})
    ]
  );
});

test('remove hasOne => hasMany', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: { 'europa': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var europa = { id: 'europa', name: "Europa", __rel: { planet: 'jupiter' } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  operationsShouldMatch(
    processor.process(
      op('remove', ['moon', europa.id, '__rel', 'planet'])
    ),
    [
      op('remove', ['planet', jupiter.id, '__rel', 'moons', europa.id])
    ]
  );
});

test('add to hasOne => hasOne', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: {}, next: 'jupiter' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: {}, previous: 'saturn' } };
  var earth = { id: 'earth', name: "Earth", __rel: { moons: {} } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter, earth: earth }
  });

  operationsShouldMatch(
    processor.process(
      op('add', ['planet', earth.id, '__rel', 'next'], saturn.id)
    ),
    [
      op('replace', ['planet', saturn.id, '__rel', 'previous'], earth.id)
    ]
  );
});

test('add to hasOne => hasOne with existing value', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: {}, next: 'jupiter' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: {}, previous: 'saturn' } };
  var earth = { id: 'earth', name: "Earth", __rel: { moons: {} } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter, earth: earth }
  });

  operationsShouldMatch(
    processor.process(
      op('add', ['planet', earth.id, '__rel', 'next'], jupiter.id)
    ),
    [
      op('replace', ['planet', jupiter.id, '__rel', 'previous'], earth.id),
      // op('remove', ['planet', saturn.id, '__rel', 'next'])
    ]
  );
});

test('replace hasOne => hasOne with existing value', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: {}, next: 'jupiter' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: {}, previous: 'saturn' } };
  var earth = { id: 'earth', name: "Earth", __rel: { moons: {} } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter, earth: earth }
  });

  operationsShouldMatch(
    processor.process(
      op('replace', ['planet', earth.id, '__rel', 'next'], jupiter.id)
    ),
    [
      op('replace', ['planet', jupiter.id, '__rel', 'previous'], earth.id),
      // op('remove', ['planet', saturn.id, '__rel', 'next'])
    ]
  );
});

test('add to hasMany => hasMany', function(){
  var earth = { id: 'earth' };
  var human = { id: 'human' };

  cache.reset({
    planet: { earth: earth },
    race: { human: human}
  });

  operationsShouldMatch(
    processor.process(
      op('add', ['race', human.id, '__rel', 'planets', earth.id], true)
    ),
    [
      op('add', ['planet', earth.id, '__rel','races', human.id], true)
    ]
  );
});

test('remove from hasMany => hasMany', function(){
  var earth = { id: 'earth', __rel: { races: { human: true } } };
  var human = { id: 'human', __rel: { planets: { earth: true} } };

  cache.reset({
    planet: { earth: earth },
    race: { human: human }
  });

  operationsShouldMatch(
    processor.process(
      op('remove', ['race', human.id, '__rel', 'planets', earth.id])
    ),
    [
      op('remove', ['planet', earth.id, '__rel','races', human.id])
    ]
  );
});

