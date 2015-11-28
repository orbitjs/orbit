import Schema from 'orbit-common/schema';
import SchemaConsistencyProcessor from 'orbit-common/operation-processors/schema-consistency-processor';
import { uuid } from 'orbit/lib/uuid';
import { toOperation } from 'orbit/lib/operations';
import Operation from 'orbit/operation';
import Cache from 'orbit-common/cache';
import Orbit from 'orbit/main';
import { Promise } from 'rsvp';
import {
  addRecordOperation,
  replaceRecordOperation,
  removeRecordOperation,
  replaceAttributeOperation,
  addToHasManyOperation,
  removeFromHasManyOperation,
  replaceHasOneOperation,
  replaceHasManyOperation
} from 'orbit-common/lib/operations';
import { equalOps } from 'tests/test-helper';

var schema,
    cache,
    processor;

var schemaDefinition = {
  models: {
    planet: {
      attributes: {
        name: {type: 'string'},
        classification: {type: 'string'}
      },
      relationships: {
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
      relationships: {
        planet: {type: 'hasOne', model: 'planet', inverse: 'moons'}
      }
    },
    race: {
      attributes: {
        name: {type: 'string'},
      },
      relationships: {
        planets: {type: 'hasMany', model: 'planet', inverse: 'races'}
      }
    }
  }
};

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

test('add to hasOne => hasMany', function(){
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: {'moon:titan': true } } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: {'moon:europa': true } } } };

  var titan = { type: 'moon', id: 'titan',
                attributes: { name: 'Titan' },
                relationships: { planet: { data: 'planet:saturn' } } };

  var europa = { type: 'moon', id: 'europa',
                 attributes: { name: 'Europa' },
                 relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  var addPlanetOp = addToHasManyOperation(europa, 'planet', saturn);

  equalOps(
    processor.before( addPlanetOp ),
    []
  );

  equalOps(
    processor.after( addPlanetOp ),
    []
  );

  equalOps(
    processor.finally( addPlanetOp ),
    [
      addToHasManyOperation(saturn, 'moons', europa)
    ]
  );
});

test('replace hasOne => hasMany', function(){
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: {'moon:titan': true } } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: {'moon:europa': true } } } };

  var titan = { type: 'moon', id: 'titan',
                attributes: { name: 'Titan' },
                relationships: { planet: { data: 'planet:saturn' } } };

  var europa = { type: 'moon', id: 'europa',
                 attributes: { name: 'Europa' },
                 relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  var replacePlanetOp = replaceHasOneOperation(europa, 'planet', saturn);

  equalOps(
    processor.before( replacePlanetOp ),
    []
  );

  equalOps(
    processor.after( replacePlanetOp ),
    [
      removeFromHasManyOperation(jupiter, 'moons', europa)
    ]
  );

  equalOps(
    processor.finally(
      replacePlanetOp
    ),
    [
      addToHasManyOperation(saturn, 'moons', europa)
    ]
  );
});

test('replace hasMany => hasOne with empty array', function(){
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: {'moon:titan': true } } } };

  var titan = { type: 'moon', id: 'titan',
                attributes: { name: 'Titan' },
                relationships: { planet: { data: 'planet:saturn' } } };

  cache.reset({
    planet: { saturn: saturn },
    moon: { titan: titan }
  });

  var clearMoonsOp = replaceHasManyOperation(saturn, 'moons', []);

  equalOps(
    processor.before( clearMoonsOp ),
    []
  );

  equalOps(
    processor.after( clearMoonsOp ),
    [
      replaceHasOneOperation(titan, 'planet', null)
    ]
  );

  equalOps(
    processor.finally( clearMoonsOp ),
    []
  );

});

test('replace hasMany => hasOne with populated array', function(){
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: {'moon:titan': true } } } };

  var titan = { type: 'moon', id: 'titan',
                attributes: { name: 'Titan' },
                relationships: { planet: { data: 'planet:saturn' } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: {} } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan }
  });

  var replaceMoonsOp = replaceHasManyOperation(jupiter, 'moons', [titan]);

  equalOps(
    processor.before( replaceMoonsOp ),
    []
  );

  equalOps(
    processor.after( replaceMoonsOp ),
    [
      // op('replace', ['moon', titan.id, 'relationships', 'planet'], null),
      // op('remove', ['planet', saturn.id, 'relationships', 'moons', titan.id])
    ]
  );

  equalOps(
    processor.finally( replaceMoonsOp ),
    [
      replaceHasOneOperation(titan, 'planet', jupiter)
    ]
  );
});

test('replace hasMany => hasOne with populated array, when already populated', function(){
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: {'moon:titan': true } } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: {'moon:europa': true } } } };

  var titan = { type: 'moon', id: 'titan',
                attributes: { name: 'Titan' },
                relationships: { planet: { data: 'planet:saturn' } } };

  var europa = { type: 'moon', id: 'europa',
                 attributes: { name: 'Europa' },
                 relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  var replaceMoonsOp = replaceHasManyOperation(saturn, 'moons', [europa]);

  equalOps(
    processor.before( replaceMoonsOp ),
    []
  );

  equalOps(
    processor.after( replaceMoonsOp ),
    [
      replaceHasOneOperation(titan, 'planet', null)
      // op('replace', ['moon', europa.id, 'relationships', 'planet'], null),
      // op('remove', ['planet', jupiter.id, 'relationships', 'moons', europa.id])
    ]
  );

  equalOps(
    processor.finally( replaceMoonsOp ),
    [
      replaceHasOneOperation(europa, 'planet', saturn)
    ]
  );
});

test('replace hasMany => hasMany', function(){
  var human = { type: 'race', id: 'human', relationships: { planets: { data: { 'planet:earth': true } }}};
  var earth = { type: 'planet', id: 'earth', relationships: { races: { data: { 'race:human': true } }}};

  cache.reset({
    race: { human: human },
    planet: { earth: earth }
  });

  var clearRacesOp = replaceHasManyOperation(earth, 'races', []);

  equalOps(
    processor.after( clearRacesOp ),
    [
      removeFromHasManyOperation(human, 'planets', earth)
    ]
  );

  equalOps(
    processor.finally( clearRacesOp ),
    []
  );
});

test('remove hasOne => hasMany', function(){
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: {'moon:titan': true } } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: {'moon:europa': true } } } };

  var titan = { type: 'moon', id: 'titan',
                attributes: { name: 'Titan' },
                relationships: { planet: { data: 'planet:saturn' } } };

  var europa = { type: 'moon', id: 'europa',
                 attributes: { name: 'Europa' },
                 relationships: { planet: { data: 'planet:jupiter' } } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  var removePlanetOp = replaceHasOneOperation(europa, 'planet', null);

  equalOps(
    processor.before( removePlanetOp ),
    []
  );

  equalOps(
    processor.after( removePlanetOp ),
    [
      removeFromHasManyOperation(jupiter, 'moons', europa)
    ]
  );

  equalOps(
    processor.finally( removePlanetOp ),
    []
  );
});

test('add to hasOne => hasOne', function(){
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { next: { data: 'planet:jupiter' } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { previous: { data: 'planet:saturn' } } };

  var earth = { type: 'planet', id: 'earth',
                attributes: { name: 'Earth' } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter, earth: earth }
  });

  var changePlanetOp = replaceHasOneOperation(earth, 'next', saturn);

  equalOps(
    processor.before( changePlanetOp ),
    []
  );

  equalOps(
    processor.after( changePlanetOp ),
    []
  );

  equalOps(
    processor.finally( changePlanetOp ),
    [
      replaceHasOneOperation(saturn, 'previous', earth)
    ]
  );
});

test('add to hasOne => hasOne with existing value', function(){
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { next: { data: 'planet:jupiter' } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { previous: { data: 'planet:saturn' } } };

  var earth = { type: 'planet', id: 'earth',
                attributes: { name: 'Earth' } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter, earth: earth }
  });

  var changePlanetOp = replaceHasOneOperation(earth, 'next', jupiter);

  equalOps(
    processor.before( changePlanetOp ),
    []
  );

  equalOps(
    processor.after( changePlanetOp ),
    [
      // op('remove', ['planet', saturn.id, 'relationships', 'next'])
    ]
  );

  equalOps(
    processor.finally( changePlanetOp ),
    [
      replaceHasOneOperation(jupiter, 'previous', earth)
    ]
  );
});

test('replace hasOne => hasOne with existing value', function(){
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { next: { data: 'planet:jupiter' } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { previous: { data: 'planet:saturn' } } };

  var earth = { type: 'planet', id: 'earth',
                attributes: { name: 'Earth' } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter, earth: earth }
  });

  var changePlanetOp = replaceHasOneOperation(earth, 'next', jupiter);

  equalOps(
    processor.before( changePlanetOp ),
    []
  );

  equalOps(
    processor.after( changePlanetOp ),
    [
      // op('replace', ['planet', jupiter.id, 'relationships', 'previous'], null),
      // op('replace', ['planet', saturn.id, 'relationships', 'next'], null)
    ]
  );

  equalOps(
    processor.finally( changePlanetOp ),
    [
      replaceHasOneOperation(jupiter, 'previous', earth)
    ]
  );
});

test('add to hasMany => hasMany', function(){
  var earth = { type: 'planet', id: 'earth' };
  var human = { type: 'race', id: 'human' };

  cache.reset({
    planet: { earth: earth },
    race: { human: human}
  });

  var addPlanetOp = addToHasManyOperation(human, 'planets', earth);

  equalOps(
    processor.before( addPlanetOp ),
    []
  );

  equalOps(
    processor.after( addPlanetOp ),
    []
  );

  equalOps(
    processor.finally( addPlanetOp ),
    [
      addToHasManyOperation(earth, 'races', human)
    ]
  );
});

test('remove from hasMany => hasMany', function(){
  var earth = { type: 'planet', id: 'earth', relationships: { races: { data: {'race:human': true } } } };
  var human = { type: 'race', id: 'human', relationships: { planets: { data: {'planet:earth': true} } } };

  cache.reset({
    planet: { earth: earth },
    race: { human: human }
  });

  var removePlanetOp = removeFromHasManyOperation(human, 'planets', earth);

  equalOps(
    processor.before( removePlanetOp ),
    []
  );

  equalOps(
    processor.after( removePlanetOp ),
    [
      removeFromHasManyOperation(earth, 'races', human)
    ]
  );

  equalOps(
    processor.finally( removePlanetOp ),
    []
  );
});
