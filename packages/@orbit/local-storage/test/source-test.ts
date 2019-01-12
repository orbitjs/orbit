import {
  getRecordFromLocalStorage,
  isLocalStorageEmpty
} from './support/local-storage';
import {
  Record,
  Schema,
  Source,
  KeyMap
} from '@orbit/data';
import Orbit from '@orbit/core';
import LocalStorageSource from '../src/source';

const { module, test } = QUnit;

module('LocalStorageSource', function(hooks) {
  let schema: Schema,
      source: LocalStorageSource,
      keyMap: KeyMap;

  hooks.beforeEach(() => {
    schema = new Schema({
      models: {
        planet: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' },
            classification: { type: 'string' },
            revised: { type: 'boolean' }
          },
          relationships: {
            moons: { type: 'hasMany', model: 'moon' },
            solarSystem: { type: 'hasMany', model: 'solarSystem' }
          }
        },
        moon: {
          keys: { remoteId: {} }
        },
        solarSystem: {
          keys: { remoteId: {} }
        }
      }
    });

    keyMap = new KeyMap();

    source = new LocalStorageSource({ schema, keyMap });
  });

  hooks.afterEach(() => {
    return source.reset()
      .then(() => {
        schema = source = keyMap = null;
        Orbit.globals.localStorage.removeItem('orbit-bucket/foo');
      });
  });

  test('it exists', function(assert) {
    assert.ok(source);
    assert.strictEqual(source.schema, schema, 'schema has been assigned');
    assert.strictEqual(source.keyMap, keyMap, 'keyMap has been assigned');
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

  test('#push - addRecord', async function(assert) {
    assert.expect(2);

    let planet = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'j'
      },
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    await source.push(t => t.addRecord(planet));

    assert.deepEqual(getRecordFromLocalStorage(source, planet), planet, 'local storage contains record');
    assert.equal(keyMap.keyToId('planet', 'remoteId', 'j'), 'jupiter', 'key has been mapped');
   });

  test('#push - updateRecord', async function(assert) {
    assert.expect(2);

    let original: Record = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'j'
      },
      attributes: {
        name: 'Jupiter',
      },
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        }
      }
    };

    let updates = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        classification: 'gas giant'
      },
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    let expected = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'j'
      },
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        },
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    await source.push(t => t.addRecord(original));
    await source.push(t => t.updateRecord(updates));

    assert.deepEqual(getRecordFromLocalStorage(source, expected), expected, 'local storage contains record');
    assert.equal(keyMap.keyToId('planet', 'remoteId', 'j'), 'jupiter', 'key has been mapped');
  });

  test('#push - updateRecord - when record does not exist', async function(assert) {
    assert.expect(1);

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        revised: true
      }
    };

    await source.push(t => t.updateRecord(revised));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - removeRecord', async function(assert) {
    assert.expect(1);

    let planet = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    await source.push(t => t.addRecord(planet));
    await source.push(t => t.removeRecord(planet));

    assert.deepEqual(getRecordFromLocalStorage(source, planet), null, 'local storage does not contain record');
  });

  test('#push - removeRecord - when record does not exist', async function(assert) {
    assert.expect(1);

    let planet = {
      type: 'planet',
      id: 'jupiter'
    };

    await source.push(t => t.removeRecord(planet));

    assert.equal(getRecordFromLocalStorage(source, planet), undefined, 'local storage does not contain record');
  });

  test('#push - replaceKey', async function(assert) {
    assert.expect(2);

    let original: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      keys: {
        remoteId: '123'
      }
    };

    await source.push(t => t.addRecord(original));
    await source.push(t => t.replaceKey(original, 'remoteId', '123'));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
    assert.equal(keyMap.keyToId('planet', 'remoteId', '123'), 'jupiter', 'key has been mapped');
  });

  test('#push - replaceKey - when base record does not exist', async function(assert) {
    assert.expect(2);

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: '123'
      }
    };

    await source.push(t => t.replaceKey({ type: 'planet', id: 'jupiter' }, 'remoteId', '123'));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
    assert.equal(keyMap.keyToId('planet', 'remoteId', '123'), 'jupiter', 'key has been mapped');
  });

  test('#push - replaceAttribute', async function(assert) {
    assert.expect(1);

    let original: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        order: 5
      }
    };

    await source.push(t => t.addRecord(original));
    await source.push(t => t.replaceAttribute(original, 'order', 5));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - replaceAttribute - when base record does not exist', async function(assert) {
    assert.expect(1);

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        order: 5
      }
    };

    await source.push(t => t.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'order', 5));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - addToRelatedRecords', async function(assert) {
    assert.expect(1);

    let original: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: []
        }
      }
    };

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        }
      }
    };

    await source.push(t => t.addRecord(original));
    await source.push(t => t.addToRelatedRecords(original, 'moons', { type: 'moon', id: 'moon1' }));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - addToRelatedRecords - when base record does not exist', async function(assert) {
    assert.expect(1);

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        }
      }
    };

    await source.push(t => t.addToRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', { type: 'moon', id: 'moon1' }));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - removeFromRelatedRecords', async function(assert) {
    assert.expect(1);

    let original: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'moon1' },
            { type: 'moon', id: 'moon2' }
          ]
        }
      }
    };

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        }
      }
    };

    await source.push(t => t.addRecord(original));
    await source.push(t => t.removeFromRelatedRecords(original, 'moons', { type: 'moon', id: 'moon2' }));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - removeFromRelatedRecords - when base record does not exist', async function(assert) {
    assert.expect(1);

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        moons: {
          data: [
          ]
        }
      }
    };

    await source.push(t => t.removeFromRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', { type: 'moon', id: 'moon2' }));

    assert.equal(getRecordFromLocalStorage(source, revised), undefined, 'local storage does not contain record');
  });

  test('#push - replaceRelatedRecords', async function(assert) {
    assert.expect(1);

    let original: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'moon1' }
          ]
        }
      }
    };

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'moon2' },
            { type: 'moon', id: 'moon3' }
          ]
        }
      }
    };

    await source.push(t => t.addRecord(original));
    await source.push(t => t.replaceRelatedRecords(original, 'moons', [{ type: 'moon', id: 'moon2' }, { type: 'moon', id: 'moon3' }]));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - replaceRelatedRecords - when base record does not exist', async function(assert) {
    assert.expect(1);

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'moon2' },
            { type: 'moon', id: 'moon3' }
          ]
        }
      }
    };

    await source.push(t => t.replaceRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', [{ type: 'moon', id: 'moon2' }, { type: 'moon', id: 'moon3' }]));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - replaceRelatedRecord - with record', async function(assert) {
    assert.expect(1);

    let original: Record = {
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
    };

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    await source.push(t => t.addRecord(original));
    await source.push(t => t.replaceRelatedRecord(original, 'solarSystem', { type: 'solarSystem', id: 'ss1' }));

    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - replaceRelatedRecord - with record - when base record does not exist', async function(assert) {
    assert.expect(1);

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    await source.push(t => t.replaceRelatedRecord({ type: 'planet', id: 'jupiter' }, 'solarSystem', { type: 'solarSystem', id: 'ss1' }));
    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - replaceRelatedRecord - with null', async function(assert) {
    assert.expect(1);

    let original: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    let revised: Record = {
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
    };

    await source.push(t => t.addRecord(original));
    await source.push(t => t.replaceRelatedRecord(original, 'solarSystem', null));
    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#push - replaceRelatedRecord - with null - when base record does not exist', async function(assert) {
    assert.expect(1);

    let revised: Record = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        solarSystem: {
          data: null
        }
      }
    };

    await source.push(t => t.replaceRelatedRecord({ type: 'planet', id: 'jupiter' }, 'solarSystem', null));
    assert.deepEqual(getRecordFromLocalStorage(source, revised), revised, 'local storage contains record');
  });

  test('#reset - clears records for source', async function(assert) {
    assert.expect(2);

    let planet = {
      type: 'planet',
      id: 'jupiter'
    };

    await source.push(t => t.addRecord(planet));

    assert.deepEqual(getRecordFromLocalStorage(source, planet), planet, 'local storage contains record');

    await source.reset();

    assert.ok(isLocalStorageEmpty(source), 'local storage is empty');
  });

  test('#reset - ignores local-storage-bucket entries', async function(assert) {
    assert.expect(2);

    let planet = {
      type: 'planet',
      id: 'jupiter'
    };

    await source.push(t => t.addRecord(planet));

    Orbit.globals.localStorage.setItem('orbit-bucket/foo', '{}');

    await source.reset();

    assert.ok(isLocalStorageEmpty(source), 'local storage is empty');

    assert.equal(Orbit.globals.localStorage.getItem('orbit-bucket/foo'), '{}');
  });

  test('#pull - all records', function(assert) {
    assert.expect(5);

    let earth = {
      type: 'planet',
      id: 'earth',
      keys: {
        remoteId: 'p1'
      },
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'p2'
      },
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io = {
      type: 'moon',
      id: 'io',
      keys: {
        remoteId: 'm1'
      },
      attributes: {
        name: 'Io'
      }
    };

    return source.reset()
      .then(() => source.push(t => [
        t.addRecord(earth),
        t.addRecord(jupiter),
        t.addRecord(io)
      ]))
      .then(() => {
        // reset keyMap to verify that pulling records also adds keys
        keyMap.reset();
      })
      .then(() => source.pull(q => q.findRecords()))
      .then(transforms => {
        assert.equal(transforms.length, 1, 'one transform returned');
        assert.deepEqual(
          transforms[0].operations.map(o => o.op),
          ['updateRecord', 'updateRecord', 'updateRecord'],
          'operations match expectations'
        );
      })
      .then(() => {
        assert.equal(keyMap.keyToId('planet', 'remoteId', 'p1'), 'earth', 'key has been mapped');
        assert.equal(keyMap.keyToId('planet', 'remoteId', 'p2'), 'jupiter', 'key has been mapped');
        assert.equal(keyMap.keyToId('moon', 'remoteId', 'm1'), 'io', 'key has been mapped');
      });
  });

  test('#pull - records of one type', function(assert) {
    assert.expect(2);

    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    return source.reset()
      .then(() => source.push(t => [
        t.addRecord(earth),
        t.addRecord(jupiter),
        t.addRecord(io)
      ]))
      .then(() => source.pull(q => q.findRecords('planet')))
      .then(transforms => {
        assert.equal(transforms.length, 1, 'one transform returned');
        assert.deepEqual(
          transforms[0].operations.map(o => o.op),
          ['updateRecord', 'updateRecord'],
          'operations match expectations'
        );
      });
  });

  test('#pull - a specific record', function(assert) {
    assert.expect(3);

    let earth = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'p2'
      },
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    return source.reset()
      .then(() => source.push(t => [
        t.addRecord(earth),
        t.addRecord(jupiter),
        t.addRecord(io)
      ]))
      .then(() => {
        // reset keyMap to verify that pulling records also adds keys
        keyMap.reset();
      })
      .then(() => source.pull(q => q.findRecord(jupiter)))
      .then(transforms => {
        assert.equal(transforms.length, 1, 'one transform returned');
        assert.deepEqual(
          transforms[0].operations.map(o => o.op),
          ['updateRecord'],
          'operations match expectations'
        );
      })
      .then(() => {
        assert.equal(keyMap.keyToId('planet', 'remoteId', 'p2'), 'jupiter', 'key has been mapped');
      });
   });

  test('#pull - ignores local-storage-bucket entries', function(assert) {
    assert.expect(2);

    return source.reset()
      .then(() => Orbit.globals.localStorage.setItem('orbit-bucket/foo', '{}'))
      .then(() => source.pull(q => q.findRecords()))
      .then(transforms => {
        assert.equal(transforms.length, 1, 'one transform returned');
        assert.equal(transforms[0].operations.length, 0, 'no operations returned');
      });
  });
});
