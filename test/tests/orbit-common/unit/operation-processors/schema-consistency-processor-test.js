import Schema from 'orbit-common/schema';
import SchemaConsistencyProcessor from 'orbit-common/operation-processors/schema-consistency-processor';
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

module('OC - OperationProcessors - SchemaConsistencyProcessor', {
  setup: function(){
    Orbit.Promise = Promise;

    schema = new Schema(schemaDefinition);
    cache = new Cache(schema, {processors: [SchemaConsistencyProcessor]});
    processor = cache._processors[0];
  },

  teardown: function(){
    schema = null;
    cache = null;
    processor = null;
  }
});

function operationsShouldMatch(actualOperations, expectedOperations){
  // console.log("actual", actualOperations);
  equal(actualOperations.length, expectedOperations.length, 'Same number of operations');

  if (actualOperations.length === expectedOperations.length) {
    for(var i = 0; i < actualOperations.length; i++){
      var actual = actualOperations[i];
      var expected = expectedOperations[i];
      deepEqual(actual.serialize(), expected.serialize(), "Operation " + i + " matches");
    }
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

  var addPlanetOp = op('add', ['moon', europa.id, '__rel', 'planet'], saturn.id);

  operationsShouldMatch(
    processor.before( addPlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( addPlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.finally( addPlanetOp ),
    [
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

  var replacePlanetOp = op('replace', ['moon', europa.id, '__rel', 'planet'], saturn.id);

  operationsShouldMatch(
    processor.before( replacePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( replacePlanetOp ),
    [
      op('remove', ['planet', jupiter.id, '__rel', 'moons', europa.id])
    ]
  );

  operationsShouldMatch(
    processor.finally(
      replacePlanetOp
    ),
    [
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

  var clearMoonsOp = op('replace', ['planet', saturn.id, '__rel', 'moons'], {});

  operationsShouldMatch(
    processor.before( clearMoonsOp ),
    []
  );

  operationsShouldMatch(
    processor.after( clearMoonsOp ),
    [
      op('replace', ['moon', titan.id, '__rel', 'planet'], null)
    ]
  );

  operationsShouldMatch(
    processor.finally( clearMoonsOp ),
    []
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

  var replaceMoonsOp = op('replace', ['planet', jupiter.id, '__rel', 'moons'], {titan: true});

  operationsShouldMatch(
    processor.before( replaceMoonsOp ),
    []
  );

  operationsShouldMatch(
    processor.after( replaceMoonsOp ),
    [
      // op('replace', ['moon', titan.id, '__rel', 'planet'], null),
      // op('remove', ['planet', saturn.id, '__rel', 'moons', titan.id])
    ]
  );

  operationsShouldMatch(
    processor.finally( replaceMoonsOp ),
    [
      op('replace', ['moon', titan.id, '__rel', 'planet'], jupiter.id),
    ]
  );
});

test('replace hasMany => hasOne with populated array, when already populated', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var europa = { id: 'europa', name: "Europa", __rel: { planet: 'jupiter' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: { 'europa': true } } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  var replaceMoonOp = op('replace', ['planet', saturn.id, '__rel', 'moons'], {europa: true});

  operationsShouldMatch(
    processor.before( replaceMoonOp ),
    []
  );

  operationsShouldMatch(
    processor.after( replaceMoonOp ),
    [
      op('replace', ['moon', titan.id, '__rel', 'planet'], null)
      // op('replace', ['moon', europa.id, '__rel', 'planet'], null),
      // op('remove', ['planet', jupiter.id, '__rel', 'moons', europa.id])
    ]
  );

  operationsShouldMatch(
    processor.finally( replaceMoonOp ),
    [
      op('replace', ['moon', europa.id, '__rel', 'planet'], saturn.id)
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

  var clearRacesOp = op('replace', ['planet', earth.id, '__rel', 'races'], {});

  operationsShouldMatch(
    processor.after( clearRacesOp ),
    [
      op('remove', ['race', human.id, '__rel', 'planets', earth.id])
    ]
  );

  operationsShouldMatch(
    processor.finally( clearRacesOp ),
    []
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

  var removePlanetOp = op('remove', ['moon', europa.id, '__rel', 'planet']);

  operationsShouldMatch(
    processor.before( removePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( removePlanetOp ),
    [
      op('remove', ['planet', jupiter.id, '__rel', 'moons', europa.id])
    ]
  );

  operationsShouldMatch(
    processor.finally( removePlanetOp ),
    []
  );
});

test('add to hasOne => hasOne', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: {}, next: 'jupiter' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: {}, previous: 'saturn' } };
  var earth = { id: 'earth', name: "Earth", __rel: { moons: {} } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter, earth: earth }
  });

  var changePlanetOp = op('add', ['planet', earth.id, '__rel', 'next'], saturn.id);

  operationsShouldMatch(
    processor.before( changePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( changePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.finally( changePlanetOp ),
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

  var changePlanetOp = op('add', ['planet', earth.id, '__rel', 'next'], jupiter.id);

  operationsShouldMatch(
    processor.before( changePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( changePlanetOp ),
    [
      // op('remove', ['planet', saturn.id, '__rel', 'next'])
    ]
  );

  operationsShouldMatch(
    processor.finally( changePlanetOp ),
    [
      op('replace', ['planet', jupiter.id, '__rel', 'previous'], earth.id),
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

  var changePlanetOp = op('replace', ['planet', earth.id, '__rel', 'next'], jupiter.id);

  operationsShouldMatch(
    processor.before( changePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( changePlanetOp ),
    [
      // op('replace', ['planet', jupiter.id, '__rel', 'previous'], null),
      // op('replace', ['planet', saturn.id, '__rel', 'next'], null)
    ]
  );

  operationsShouldMatch(
    processor.finally( changePlanetOp ),
    [
      op('replace', ['planet', jupiter.id, '__rel', 'previous'], earth.id)
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

  var addPlanetOp = op('add', ['race', human.id, '__rel', 'planets', earth.id], true);

  operationsShouldMatch(
    processor.before( addPlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( addPlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.finally( addPlanetOp ),
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

  var removePlanetOp = op('remove', ['race', human.id, '__rel', 'planets', earth.id]);

  operationsShouldMatch(
    processor.before( removePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( removePlanetOp ),
    [
      op('remove', ['planet', earth.id, '__rel','races', human.id])
    ]
  );

  operationsShouldMatch(
    processor.finally( removePlanetOp ),
    []
  );
});

