import Schema from 'orbit-common/schema';
import CacheIntegrityProcessor from 'orbit-common/operation-processors/cache-integrity-processor';
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

module('OC - OperationProcessors - CacheIntegrityProcessor', {
  setup: function() {
    Orbit.Promise = Promise;

    schema = new Schema(schemaDefinition);
    cache = new Cache(schema, { processors: [CacheIntegrityProcessor] });
    processor = cache._processors[0];
  },

  teardown: function() {
    schema = null;
    cache = null;
    processor = null;
  }
});

test('add record to empty cache', function() {
  cache.reset({});

  var addPlanetOp = addRecordOperation({ type: 'planet', id: 'saturn' });

  equalOps(
    processor.before( addPlanetOp ),
    [
      toOperation('add', ['planet'], {})
    ]
  );

  equalOps(
    processor.after( addPlanetOp ),
    []
  );

  equalOps(
    processor.finally( addPlanetOp ),
    []
  );

  deepEqual(processor._rev, {}, 'empty rev links');
});

test('reset empty cache', function() {
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: { 'moon:titan': true } } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: { 'moon:europa': true } } } };

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

  deepEqual(processor._rev, {
    'moon': {
      'europa': {
        'planet/jupiter/relationships/moons/data/moon:europa': true
      },
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'jupiter': {
        'moon/europa/relationships/planet/data': true
      },
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');
});

test('add to hasOne => hasMany', function() {
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: { 'moon:titan': true } } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: { 'moon:europa': true } } } };

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

  deepEqual(processor._rev, {
    'moon': {
      'europa': {
        'planet/jupiter/relationships/moons/data/moon:europa': true
      },
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'jupiter': {
        'moon/europa/relationships/planet/data': true
      },
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');

  var addPlanetOp = addToHasManyOperation(
    { type: 'moon', id: europa.id },
    'planet',
    { type: 'planet', id: saturn.id });

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
    []
  );

  deepEqual(processor._rev, {
    'moon': {
      'europa': {
        'planet/jupiter/relationships/moons/data/moon:europa': true
      },
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'jupiter': {
        'moon/europa/relationships/planet/data': true
      },
      'saturn': {
        'moon/europa/relationships/planet/data': true,
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');
});

test('replace hasOne => hasMany', function() {
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: { 'moon:titan': true } } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: { 'moon:europa': true } } } };

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

  deepEqual(processor._rev, {
    'moon': {
      'europa': {
        'planet/jupiter/relationships/moons/data/moon:europa': true
      },
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'jupiter': {
        'moon/europa/relationships/planet/data': true
      },
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');

  var replacePlanetOp = replaceHasOneOperation(europa, 'planet', saturn);

  equalOps(
    processor.before( replacePlanetOp ),
    []
  );

  equalOps(
    processor.after( replacePlanetOp ),
    []
  );

  equalOps(
    processor.finally(
      replacePlanetOp
    ),
    []
  );

  deepEqual(processor._rev, {
    'moon': {
      'europa': {
        'planet/jupiter/relationships/moons/data/moon:europa': true
      },
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'jupiter': {
      },
      'saturn': {
        'moon/europa/relationships/planet/data': true,
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');
});

test('replace hasMany => hasOne with empty array', function() {
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: { 'moon:titan': true } } } };

  var titan = { type: 'moon', id: 'titan',
                attributes: { name: 'Titan' },
                relationships: { planet: { data: 'planet:saturn' } } };

  cache.reset({
    planet: { saturn: saturn },
    moon: { titan: titan }
  });

  deepEqual(processor._rev, {
    'moon': {
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');

  var clearMoonsOp = replaceHasManyOperation(saturn, 'moons', []);

  equalOps(
    processor.before( clearMoonsOp ),
    []
  );

  equalOps(
    processor.after( clearMoonsOp ),
    []
  );

  equalOps(
    processor.finally( clearMoonsOp ),
    []
  );

  deepEqual(processor._rev, {
    'moon': {
      'titan': {
      }
    },
    'planet': {
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');
});

test('replace hasMany => hasOne with populated array', function() {
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: { 'moon:titan': true } } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: {} } };

  var titan = { type: 'moon', id: 'titan',
                attributes: { name: 'Titan' },
                relationships: { planet: { data: 'planet:saturn' } } };

  cache.reset({
    planet: { saturn: saturn, jupiter: jupiter },
    moon: { titan: titan }
  });

  deepEqual(processor._rev, {
    'moon': {
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');

  var replaceMoonsOp = replaceHasManyOperation(saturn, 'moons', [{ type: 'moon', id: 'titan' }]);

  equalOps(
    processor.before( replaceMoonsOp ),
    []
  );

  equalOps(
    processor.after( replaceMoonsOp ),
    []
  );

  equalOps(
    processor.finally( replaceMoonsOp ),
    []
  );

  deepEqual(processor._rev, {
    'moon': {
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');
});

test('replace hasMany => hasOne with populated array, when already populated', function() {
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: { 'moon:titan': true } } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: { 'moon:europa': true } } } };

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

  deepEqual(processor._rev, {
    'moon': {
      'europa': {
        'planet/jupiter/relationships/moons/data/moon:europa': true
      },
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'jupiter': {
        'moon/europa/relationships/planet/data': true
      },
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');

  var replaceMoonsOp = replaceHasManyOperation(saturn, 'moons', [{ type: 'moon', id: 'europa' }]);

  equalOps(
    processor.before( replaceMoonsOp ),
    []
  );

  equalOps(
    processor.after( replaceMoonsOp ),
    []
  );

  equalOps(
    processor.finally( replaceMoonsOp ),
    []
  );

  deepEqual(processor._rev, {
    'moon': {
      'europa': {
        'planet/jupiter/relationships/moons/data/moon:europa': true,
        'planet/saturn/relationships/moons/data/moon:europa': true
      },
      'titan': {}
    },
    'planet': {
      'jupiter': {
        'moon/europa/relationships/planet/data': true
      },
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');
});

test('replace hasMany => hasMany', function() {
  var human = { type: 'race', id: 'human', relationships: { planets: { data: { 'planet:earth': true } } } };
  var earth = { type: 'planet', id: 'earth', relationships: { races: { data: { 'race:human': true } } } };

  cache.reset({
    race: { human: human },
    planet: { earth: earth }
  });

  deepEqual(processor._rev, {
    'planet': {
      'earth': {
        'race/human/relationships/planets/data/planet:earth': true
      }
    },
    'race': {
      'human': {
        'planet/earth/relationships/races/data/race:human': true
      }
    }
  }, 'rev links match');

  var clearRacesOp = replaceHasManyOperation(earth, 'races', []);

  equalOps(
    processor.after( clearRacesOp ),
    []
  );

  equalOps(
    processor.finally( clearRacesOp ),
    []
  );

  deepEqual(processor._rev, {
    'planet': {
      'earth': {
        'race/human/relationships/planets/data/planet:earth': true
      }
    },
    'race': {
      'human': {
      }
    }
  }, 'rev links match');
});

test('remove hasOne => hasMany', function() {
  var saturn = { type: 'planet', id: 'saturn',
                 attributes: { name: 'Saturn' },
                 relationships: { moons: { data: { 'moon:titan': true } } } };

  var jupiter = { type: 'planet', id: 'jupiter',
                  attributes: { name: 'Jupiter' },
                  relationships: { moons: { data: { 'moon:europa': true } } } };

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

  deepEqual(processor._rev, {
    'moon': {
      'europa': {
        'planet/jupiter/relationships/moons/data/moon:europa': true
      },
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'jupiter': {
        'moon/europa/relationships/planet/data': true
      },
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');

  var removePlanetOp = replaceHasOneOperation(europa, 'planet', null);

  equalOps(
    processor.before( removePlanetOp ),
    []
  );

  equalOps(
    processor.after( removePlanetOp ),
    []
  );

  equalOps(
    processor.finally( removePlanetOp ),
    []
  );

  deepEqual(processor._rev, {
    'moon': {
      'europa': {
        'planet/jupiter/relationships/moons/data/moon:europa': true
      },
      'titan': {
        'planet/saturn/relationships/moons/data/moon:titan': true
      }
    },
    'planet': {
      'jupiter': {
      },
      'saturn': {
        'moon/titan/relationships/planet/data': true
      }
    }
  }, 'rev links match');
});

test('add to hasOne => hasOne', function() {
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

  deepEqual(processor._rev, {
    'planet': {
      'jupiter': {
        'planet/saturn/relationships/next/data': true
      },
      'saturn': {
        'planet/jupiter/relationships/previous/data': true
      }
    }
  }, 'rev links match');


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
    []
  );

  deepEqual(processor._rev, {
    'planet': {
      'jupiter': {
        'planet/saturn/relationships/next/data': true
      },
      'saturn': {
        'planet/earth/relationships/next/data': true,
        'planet/jupiter/relationships/previous/data': true
      }
    }
  }, 'rev links match');
});

test('add to hasOne => hasOne with existing value', function() {
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

  deepEqual(processor._rev, {
    'planet': {
      'jupiter': {
        'planet/saturn/relationships/next/data': true
      },
      'saturn': {
        'planet/jupiter/relationships/previous/data': true
      }
    }
  }, 'rev links match');

  var changePlanetOp = replaceHasOneOperation(earth, 'next', jupiter);

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
    []
  );

  deepEqual(processor._rev, {
    'planet': {
      'jupiter': {
        'planet/earth/relationships/next/data': true,
        'planet/saturn/relationships/next/data': true
      },
      'saturn': {
        'planet/jupiter/relationships/previous/data': true
      }
    }
  }, 'rev links match');
});

test('replace hasOne => hasOne with existing value', function() {
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

  deepEqual(processor._rev, {
    'planet': {
      'jupiter': {
        'planet/saturn/relationships/next/data': true
      },
      'saturn': {
        'planet/jupiter/relationships/previous/data': true
      }
    }
  }, 'rev links match');

  var changePlanetOp = replaceHasOneOperation(earth, 'next', jupiter);

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
    []
  );

  deepEqual(processor._rev, {
    'planet': {
      'jupiter': {
        'planet/earth/relationships/next/data': true,
        'planet/saturn/relationships/next/data': true
      },
      'saturn': {
        'planet/jupiter/relationships/previous/data': true
      }
    }
  }, 'rev links match');
});

test('add to hasMany => hasMany', function() {
  var earth = { type: 'planet', id: 'earth' };
  var human = { type: 'race', id: 'human' };

  cache.reset({
    planet: { earth: earth },
    race: { human: human }
  });

  deepEqual(processor._rev, {}, 'empty rev links');

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
    []
  );

  deepEqual(processor._rev, {
    'planet': {
      'earth': {
        'race/human/relationships/planets/data/planet:earth': true
      }
    }
  }, 'rev links match');
});

test('remove from hasMany => hasMany', function() {
  var earth = { type: 'planet', id: 'earth', relationships: { races: { data: { 'race:human': true } } } };
  var human = { type: 'race', id: 'human', relationships: { planets: { data: { 'planet:earth': true } } } };

  cache.reset({
    planet: { earth: earth },
    race: { human: human }
  });

  deepEqual(processor._rev, {
    'planet': {
      'earth': {
        'race/human/relationships/planets/data/planet:earth': true
      }
    },
    'race': {
      'human': {
        'planet/earth/relationships/races/data/race:human': true
      }
    }
  }, 'rev links match');

  var removePlanetOp = removeFromHasManyOperation(human, 'planets', earth);

  equalOps(
    processor.before( removePlanetOp ),
    []
  );

  equalOps(
    processor.after( removePlanetOp ),
    []
  );

  equalOps(
    processor.finally( removePlanetOp ),
    []
  );

  deepEqual(processor._rev, {
    'planet': {
      'earth': {
      }
    },
    'race': {
      'human': {
        'planet/earth/relationships/races/data/race:human': true
      }
    }
  }, 'rev links match');
});

test('remove record with hasMany relationships', function() {
  var earth = { type: 'planet', id: 'earth', relationships: { races: { data: { 'race:human': true } } } };
  var human = { type: 'race', id: 'human', relationships: { planets: { data: { 'planet:earth': true } } } };

  cache.reset({
    planet: { earth: earth },
    race: { human: human }
  });

  deepEqual(processor._rev, {
    'planet': {
      'earth': {
        'race/human/relationships/planets/data/planet:earth': true
      }
    },
    'race': {
      'human': {
        'planet/earth/relationships/races/data/race:human': true
      }
    }
  }, 'rev links match');

  var removeRaceOp = removeRecordOperation(human);

  equalOps(
    processor.before( removeRaceOp ),
    []
  );

  equalOps(
    processor.after( removeRaceOp ),
    [
      removeFromHasManyOperation(earth, 'races', human)
    ]
  );

  equalOps(
    processor.finally( removeRaceOp ),
    []
  );

  deepEqual(processor._rev, {
    'planet': {
      'earth': {
      }
    },
    'race': {
    }
  }, 'rev links match');
});
