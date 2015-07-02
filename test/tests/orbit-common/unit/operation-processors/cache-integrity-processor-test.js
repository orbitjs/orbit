import Schema from 'orbit-common/schema';
import CacheIntegrityProcessor from 'orbit-common/operation-processors/cache-integrity-processor';
import { uuid } from 'orbit/lib/uuid';
import Document from 'orbit/document';
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
    document,
    processor;

module('OC - OperationProcessors - CacheIntegrityProcessor', {
  setup: function(){
    Orbit.Promise = Promise;

    schema = new Schema(schemaDefinition);
    document = new Document({});
    processor = new CacheIntegrityProcessor(schema, document);
  },

  teardown: function(){
    schema = null;
    cache = null;
    document = null;
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

test('add record to empty cache', function() {
  document.reset({});

  var addPlanetOp = op('add', ['planet', 'saturn'], { id: 'saturn' });

  operationsShouldMatch(
    processor.before( addPlanetOp ),
    [
      op('add', ['planet'], {})
    ]
  );

  operationsShouldMatch(
    processor.after( addPlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.finally( addPlanetOp ),
    []
  );

  deepEqual(processor._rev, {}, 'empty rev links');
});

test('reset empty cache', function() {
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: { 'europa': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var europa = { id: 'europa', name: "Europa", __rel: { planet: 'jupiter' } };

  document.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  deepEqual(processor._rev, {
    "moon": {
      "europa": {
        "planet/jupiter/__rel/moons/europa": true
      },
      "titan": {
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "jupiter": {
        "moon/europa/__rel/planet": true
      },
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');
});


test('add to hasOne => hasMany', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: { 'europa': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var europa = { id: 'europa', name: "Europa", __rel: { planet: 'jupiter' } };

  document.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  deepEqual(processor._rev, {
    "moon": {
      "europa": {
        "planet/jupiter/__rel/moons/europa": true
      },
      "titan": {
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "jupiter": {
        "moon/europa/__rel/planet": true
      },
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');

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
    []
  );

  deepEqual(processor._rev, {
    "moon": {
      "europa": {
        "planet/jupiter/__rel/moons/europa": true
      },
      "titan": {
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "jupiter": {
        "moon/europa/__rel/planet": true
      },
      "saturn": {
        "moon/europa/__rel/planet": true,
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');
});

test('replace hasOne => hasMany', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: { 'europa': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var europa = { id: 'europa', name: "Europa", __rel: { planet: 'jupiter' } };

  document.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  deepEqual(processor._rev, {
    "moon": {
      "europa": {
        "planet/jupiter/__rel/moons/europa": true
      },
      "titan": {
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "jupiter": {
        "moon/europa/__rel/planet": true
      },
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');

  var replacePlanetOp = op('replace', ['moon', europa.id, '__rel', 'planet'], saturn.id);

  operationsShouldMatch(
    processor.before( replacePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( replacePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.finally(
      replacePlanetOp
    ),
    []
  );

  deepEqual(processor._rev, {
    "moon": {
      "europa": {
        "planet/jupiter/__rel/moons/europa": true
      },
      "titan": {
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "jupiter": {
      },
      "saturn": {
        "moon/europa/__rel/planet": true,
        "moon/titan/__rel/planet": true
      }
    }
    }, 'rev links match');
});

test('replace hasMany => hasOne with empty array', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };

  document.reset({
    planet: { saturn: saturn },
    moon: { titan: titan }
  });

  deepEqual(processor._rev, {
    "moon": {
      "titan": {
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');

  var clearMoonsOp = op('replace', ['planet', saturn.id, '__rel', 'moons'], {});

  operationsShouldMatch(
    processor.before( clearMoonsOp ),
    []
  );

  operationsShouldMatch(
    processor.after( clearMoonsOp ),
    []
  );

  operationsShouldMatch(
    processor.finally( clearMoonsOp ),
    []
  );

  deepEqual(processor._rev, {
    "moon": {
      "titan": {
      }
    },
    "planet": {
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');
});

test('replace hasMany => hasOne with populated array', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: {} } };

  document.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan }
  });

  deepEqual(processor._rev, {
    "moon": {
      "titan": {
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');

  var replaceMoonsOp = op('replace', ['planet', jupiter.id, '__rel', 'moons'], {titan: true});

  operationsShouldMatch(
    processor.before( replaceMoonsOp ),
    []
  );

  operationsShouldMatch(
    processor.after( replaceMoonsOp ),
    []
  );

  operationsShouldMatch(
    processor.finally( replaceMoonsOp ),
    []
  );

  deepEqual(processor._rev, {
    "moon": {
      "titan": {
        "planet/jupiter/__rel/moons/titan": true,
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');
});

test('replace hasMany => hasOne with populated array, when already populated', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var europa = { id: 'europa', name: "Europa", __rel: { planet: 'jupiter' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: { 'europa': true } } };

  document.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  deepEqual(processor._rev, {
    "moon": {
      "europa": {
        "planet/jupiter/__rel/moons/europa": true
      },
      "titan": {
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "jupiter": {
        "moon/europa/__rel/planet": true
      },
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');

  var replaceMoonOp = op('replace', ['planet', saturn.id, '__rel', 'moons'], {europa: true});

  operationsShouldMatch(
    processor.before( replaceMoonOp ),
    []
  );

  operationsShouldMatch(
    processor.after( replaceMoonOp ),
    []
  );

  operationsShouldMatch(
    processor.finally( replaceMoonOp ),
    []
  );

  deepEqual(processor._rev, {
    "moon": {
      "europa": {
        "planet/jupiter/__rel/moons/europa": true,
        "planet/saturn/__rel/moons/europa": true
      },
      "titan": {}
    },
    "planet": {
      "jupiter": {
        "moon/europa/__rel/planet": true
      },
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');
});

test('replace hasMany => hasMany', function(){
  var human = { id: 'human', __rel: { planets: { earth: true } }};
  var earth = { id: 'earth', __rel: { races: { human: true}  }};

  document.reset({
    race: { human: human },
    planet: { earth: earth }
  });

  deepEqual(processor._rev, {
    "planet": {
      "earth": {
        "race/human/__rel/planets/earth": true
      }
    },
    "race": {
      "human": {
        "planet/earth/__rel/races/human": true
      }
    }
  }, 'rev links match');

  var clearRacesOp = op('replace', ['planet', earth.id, '__rel', 'races'], {});

  operationsShouldMatch(
    processor.after( clearRacesOp ),
    []
  );

  operationsShouldMatch(
    processor.finally( clearRacesOp ),
    []
  );

  deepEqual(processor._rev, {
    "planet": {
      "earth": {
        "race/human/__rel/planets/earth": true
      }
    },
    "race": {
      "human": {
      }
    }
  }, 'rev links match');
});

test('remove hasOne => hasMany', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: { 'titan': true } } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: { 'europa': true } } };
  var titan = { id: 'titan', name: "Titan", __rel: { planet: 'saturn' } };
  var europa = { id: 'europa', name: "Europa", __rel: { planet: 'jupiter' } };

  document.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan, europa: europa }
  });

  deepEqual(processor._rev, {
    "moon": {
      "europa": {
        "planet/jupiter/__rel/moons/europa": true
      },
      "titan": {
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "jupiter": {
        "moon/europa/__rel/planet": true
      },
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');

  var removePlanetOp = op('remove', ['moon', europa.id, '__rel', 'planet']);

  operationsShouldMatch(
    processor.before( removePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( removePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.finally( removePlanetOp ),
    []
  );

  deepEqual(processor._rev, {
    "moon": {
      "europa": {
        "planet/jupiter/__rel/moons/europa": true
      },
      "titan": {
        "planet/saturn/__rel/moons/titan": true
      }
    },
    "planet": {
      "jupiter": {
      },
      "saturn": {
        "moon/titan/__rel/planet": true
      }
    }
  }, 'rev links match');
});

test('add to hasOne => hasOne', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: {}, next: 'jupiter' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: {}, previous: 'saturn' } };
  var earth = { id: 'earth', name: "Earth", __rel: { moons: {} } };

  document.reset({
    planet: { saturn: saturn, jupiter: jupiter, earth: earth }
  });

  deepEqual(processor._rev, {
    "planet": {
      "jupiter": {
        "planet/saturn/__rel/next": true
      },
      "saturn": {
        "planet/jupiter/__rel/previous": true
      }
    }
  }, 'rev links match');

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
    []
  );

  deepEqual(processor._rev, {
    "planet": {
      "jupiter": {
        "planet/saturn/__rel/next": true
      },
      "saturn": {
        "planet/earth/__rel/next": true,
        "planet/jupiter/__rel/previous": true
      }
    }
  }, 'rev links match');
});

test('add to hasOne => hasOne with existing value', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: {}, next: 'jupiter' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: {}, previous: 'saturn' } };
  var earth = { id: 'earth', name: "Earth", __rel: { moons: {} } };

  document.reset({
    planet: { saturn: saturn, jupiter: jupiter, earth: earth }
  });

  deepEqual(processor._rev, {
    "planet": {
      "jupiter": {
        "planet/saturn/__rel/next": true
      },
      "saturn": {
        "planet/jupiter/__rel/previous": true
      }
    }
  }, 'rev links match');

  var changePlanetOp = op('add', ['planet', earth.id, '__rel', 'next'], jupiter.id);

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
    []
  );

  deepEqual(processor._rev, {
    "planet": {
      "jupiter": {
        "planet/earth/__rel/next": true,
        "planet/saturn/__rel/next": true
      },
      "saturn": {
        "planet/jupiter/__rel/previous": true
      }
    }
  }, 'rev links match');
});

test('replace hasOne => hasOne with existing value', function(){
  var saturn = { id: 'saturn', name: "Saturn", __rel: { moons: {}, next: 'jupiter' } };
  var jupiter = { id: 'jupiter', name: "Jupiter", __rel: { moons: {}, previous: 'saturn' } };
  var earth = { id: 'earth', name: "Earth", __rel: { moons: {} } };

  document.reset({
    planet: { saturn: saturn, jupiter: jupiter, earth: earth }
  });

  deepEqual(processor._rev, {
    "planet": {
      "jupiter": {
        "planet/saturn/__rel/next": true
      },
      "saturn": {
        "planet/jupiter/__rel/previous": true
      }
    }
  }, 'rev links match');

  var changePlanetOp = op('replace', ['planet', earth.id, '__rel', 'next'], jupiter.id);

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
    []
  );

  deepEqual(processor._rev, {
    "planet": {
      "jupiter": {
        "planet/earth/__rel/next": true,
        "planet/saturn/__rel/next": true
      },
      "saturn": {
        "planet/jupiter/__rel/previous": true
      }
    }
  }, 'rev links match');
});

test('add to hasMany => hasMany', function(){
  var earth = { id: 'earth' };
  var human = { id: 'human' };

  document.reset({
    planet: { earth: earth },
    race: { human: human}
  });

  deepEqual(processor._rev, {}, 'empty rev links');

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
    []
  );

  deepEqual(processor._rev, {
    "planet": {
      "earth": {
        "race/human/__rel/planets/earth": true
      }
    }
  }, 'rev links match');
});

test('remove from hasMany => hasMany', function(){
  var earth = { id: 'earth', __rel: { races: { human: true } } };
  var human = { id: 'human', __rel: { planets: { earth: true} } };

  document.reset({
    planet: { earth: earth },
    race: { human: human }
  });

  deepEqual(processor._rev, {
    "planet": {
      "earth": {
        "race/human/__rel/planets/earth": true
      }
    },
    "race": {
      "human": {
        "planet/earth/__rel/races/human": true
      }
    }
  }, 'rev links match');

  var removePlanetOp = op('remove', ['race', human.id, '__rel', 'planets', earth.id]);

  operationsShouldMatch(
    processor.before( removePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.after( removePlanetOp ),
    []
  );

  operationsShouldMatch(
    processor.finally( removePlanetOp ),
    []
  );

  deepEqual(processor._rev, {
    "planet": {
      "earth": {
      }
    },
    "race": {
      "human": {
        "planet/earth/__rel/races/human": true
      }
    }
  }, 'rev links match');
});

test('remove record with hasMany relationships', function(){
  var earth = { id: 'earth', __rel: { races: { human: true } } };
  var human = { id: 'human', __rel: { planets: { earth: true} } };

  document.reset({
    planet: { earth: earth },
    race: { human: human }
  });

  deepEqual(processor._rev, {
    "planet": {
      "earth": {
        "race/human/__rel/planets/earth": true
      }
    },
    "race": {
      "human": {
        "planet/earth/__rel/races/human": true
      }
    }
  }, 'rev links match');

  var removePlanetOp = op('remove', ['race', human.id]);

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

  deepEqual(processor._rev, {
    "planet": {
      "earth": {
      }
    },
    "race": {
    }
  }, 'rev links match');
});
