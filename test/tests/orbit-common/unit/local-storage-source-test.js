import {
  verifyLocalStorageContainsRecord,
  verifyLocalStorageDoesNotContainRecord,
  verifyLocalStorageIsEmpty
} from 'tests/test-helper';
import Source from 'orbit-common/source';
import Schema from 'orbit-common/schema';
import LocalStorageSource from 'orbit-common/local-storage-source';
import {
  addRecord,
  replaceRecord,
  removeRecord,
  replaceKey,
  replaceAttribute,
  addToHasMany,
  removeFromHasMany,
  replaceHasMany,
  replaceHasOne
} from 'orbit-common/transform/operators';
import qb from 'orbit-common/query/builder';

let schema, source;

///////////////////////////////////////////////////////////////////////////////

module('OC - LocalStorageSource', {
  setup() {
    schema = new Schema({
      models: {
        planet: {},
        moon: {}
      }
    });

    source = new LocalStorageSource({ schema });
  },

  teardown() {
    schema = source = null;
  }
});

test('it exists', function(assert) {
  assert.ok(source);
});

test('its prototype chain is correct', function(assert) {
  assert.ok(source instanceof Source, 'instanceof Source');
});

test('is assigned a default namespace and delimiter', function(assert) {
  assert.equal(source.namespace, 'orbit', 'namespace is `orbit` by default');
  assert.equal(source.delimiter, '/', 'delimiter is `/` by default');
});

test('#getKeyForRecord returns the local storage key that will be used for a record', function(assert) {
  assert.equal(
    source.getKeyForRecord({type: 'planet', id: 'jupiter'}),
    'orbit/planet/jupiter'
  );
});

test('#transform - addRecord', function(assert) {
  assert.expect(1);

  let planet = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    }
  });

  return source.transform(addRecord(planet))
    .then(() => verifyLocalStorageContainsRecord(source, planet));
});

test('#transform - replaceRecord', function(assert) {
  assert.expect(1);

  let original = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    }
  });

  let revised = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant',
      revised: true
    }
  });

  return source.transform(addRecord(original))
    .then(() => source.transform(replaceRecord(revised)))
    .then(() => verifyLocalStorageContainsRecord(source, revised));
});

test('#transform - removeRecord', function(assert) {
  assert.expect(1);

  let planet = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    }
  });

  return source.transform(addRecord(planet))
    .then(() => source.transform(removeRecord(planet)))
    .then(() => verifyLocalStorageDoesNotContainRecord(source, planet));
});

test('#transform - replaceKey', function(assert) {
  assert.expect(1);

  let original = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    }
  });

  let revised = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    keys: {
      remoteId: '123'
    }
  });

  return source.transform(addRecord(original))
    .then(() => source.transform(replaceKey(original, 'remoteId', '123')))
    .then(() => verifyLocalStorageContainsRecord(source, revised));
});

test('#transform - replaceAttribute', function(assert) {
  assert.expect(1);

  let original = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    }
  });

  let revised = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant',
      order: 5
    }
  });

  return source.transform(addRecord(original))
    .then(() => source.transform(replaceAttribute(original, 'order', 5)))
    .then(() => verifyLocalStorageContainsRecord(source, revised));
});

test('#transform - addToHasMany', function(assert) {
  assert.expect(1);

  let original = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    relationships: {
      moons: {
        data: {}
      }
    }
  });

  let revised = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    relationships: {
      moons: {
        data: {
          'moon:moon1': true
        }
      }
    }
  });

  return source.transform(addRecord(original))
    .then(() => source.transform(addToHasMany(original, 'moons', { type: 'moon', id: 'moon1' })))
    .then(() => verifyLocalStorageContainsRecord(source, revised));
});

test('#transform - removeFromHasMany', function(assert) {
  assert.expect(1);

  let original = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    relationships: {
      moons: {
        data: {
          'moon:moon1': true,
          'moon:moon2': true
        }
      }
    }
  });

  let revised = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    relationships: {
      moons: {
        data: {
          'moon:moon1': true
        }
      }
    }
  });

  return source.transform(addRecord(original))
    .then(() => source.transform(removeFromHasMany(original, 'moons', { type: 'moon', id: 'moon2' })))
    .then(() => verifyLocalStorageContainsRecord(source, revised));
});

test('#transform - replaceHasMany', function(assert) {
  assert.expect(1);

  let original = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    relationships: {
      moons: {
        data: {
          'moon:moon1': true
        }
      }
    }
  });

  let revised = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    relationships: {
      moons: {
        data: {
          'moon:moon2': true,
          'moon:moon3': true
        }
      }
    }
  });

  return source.transform(addRecord(original))
    .then(() => source.transform(replaceHasMany(original, 'moons', [{ type: 'moon', id: 'moon2' }, { type: 'moon', id: 'moon3' }])))
    .then(() => verifyLocalStorageContainsRecord(source, revised));
});

test('#transform - replaceHasOne - record', function(assert) {
  assert.expect(1);

  let original = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    relationships: {
      solarSystem: {
        data: null
      }
    }
  });

  let revised = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    relationships: {
      solarSystem: {
        data: 'solarSystem:ss1'
      }
    }
  });

  return source.transform(addRecord(original))
    .then(() => source.transform(replaceHasOne(original, 'solarSystem', { type: 'solarSystem', id: 'ss1' })))
    .then(() => verifyLocalStorageContainsRecord(source, revised));
});

test('#transform - replaceHasOne - null', function(assert) {
  assert.expect(1);

  let original = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    relationships: {
      solarSystem: {
        data: 'solarSystem:ss1'
      }
    }
  });

  let revised = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    },
    relationships: {
      solarSystem: {
        data: null
      }
    }
  });

  return source.transform(addRecord(original))
    .then(() => source.transform(replaceHasOne(original, 'solarSystem', null)))
    .then(() => verifyLocalStorageContainsRecord(source, revised));
});

test('#reset - clears records for source', function(assert) {
  assert.expect(2);

  let planet = schema.normalize({
    type: 'planet',
    id: 'jupiter'
  });

  return source.transform(addRecord(planet))
    .then(() => {
      verifyLocalStorageContainsRecord(source, planet);
      source.reset();
    })
    .then(() => verifyLocalStorageIsEmpty(source));
});

test('#fetch - all records', function(assert) {
  assert.expect(2);

  let earth = schema.normalize({
    type: 'planet',
    id: 'earth',
    attributes: {
      name: 'Earth',
      classification: 'terrestrial'
    }
  });

  let jupiter = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    }
  });

  let io = schema.normalize({
    type: 'moon',
    id: 'io',
    attributes: {
      name: 'Io'
    }
  });

  source.reset();

  return source.transform([
    addRecord(earth),
    addRecord(jupiter),
    addRecord(io)
  ])
    .then(() => source.fetch(qb.records()))
    .then(transforms => {
      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(
        transforms[0].operations.map(o => o.op),
        ['addRecord', 'addRecord', 'addRecord'],
        'operations match expectations'
      );
    });
});

test('#fetch - records of one type', function(assert) {
  assert.expect(2);

  let earth = schema.normalize({
    type: 'planet',
    id: 'earth',
    attributes: {
      name: 'Earth',
      classification: 'terrestrial'
    }
  });

  let jupiter = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    }
  });

  let io = schema.normalize({
    type: 'moon',
    id: 'io',
    attributes: {
      name: 'Io'
    }
  });

  source.reset();

  return source.transform([
    addRecord(earth),
    addRecord(jupiter),
    addRecord(io)
  ])
    .then(() => source.fetch(qb.records('planet')))
    .then(transforms => {
      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(
        transforms[0].operations.map(o => o.op),
        ['addRecord', 'addRecord'],
        'operations match expectations'
      );
    });
});

test('#fetch - a specific record', function(assert) {
  assert.expect(2);

  let earth = schema.normalize({
    type: 'planet',
    id: 'earth',
    attributes: {
      name: 'Earth',
      classification: 'terrestrial'
    }
  });

  let jupiter = schema.normalize({
    type: 'planet',
    id: 'jupiter',
    attributes: {
      name: 'Jupiter',
      classification: 'gas giant'
    }
  });

  let io = schema.normalize({
    type: 'moon',
    id: 'io',
    attributes: {
      name: 'Io'
    }
  });

  source.reset();

  return source.transform([
    addRecord(earth),
    addRecord(jupiter),
    addRecord(io)
  ])
    .then(() => source.fetch(qb.record(jupiter)))
    .then(transforms => {
      assert.equal(transforms.length, 1, 'one transform returned');
      assert.deepEqual(
        transforms[0].operations.map(o => o.op),
        ['addRecord'],
        'operations match expectations'
      );
    });
});
