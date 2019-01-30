import { getRecordFromIndexedDB } from './support/indexeddb';
import {
  Record,
  Schema,
  KeyMap,
  AddRecordOperation
} from '@orbit/data';
import IndexedDBSource from '../src/source';

const { module, test, skip } = QUnit;

module('IndexedDBSource', function(hooks) {
  let schema: Schema,
      source: IndexedDBSource,
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
            moons: { type: 'hasMany', model: 'moon', inverse: 'planet' },
            solarSystem: { type: 'hasOne', model: 'solarSystem', inverse: 'planets' }
          }
        },
        moon: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
          }
        },
        solarSystem: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planets: { type: 'hasMany', model: 'planet', inverse: 'solarSystem' }
          }
        }
      }
    });

    keyMap = new KeyMap();

    source = new IndexedDBSource({ schema, keyMap });
  });

  hooks.afterEach(() => {
    return source.cache.deleteDB();
  });

  test('it exists', function(assert) {
    assert.ok(source);
    assert.strictEqual(source.schema, schema, 'schema has been assigned');
    assert.strictEqual(source.keyMap, keyMap, 'keyMap has been assigned');
  });

  test('is assigned a default dbName', function(assert) {
    assert.equal(source.cache.dbName, 'orbit', '`dbName` is `orbit` by default');
  });

  // TODO: Skipped for CI
  skip('will reopen the database when the schema is upgraded', async function(assert) {
    const done = assert.async();

    assert.expect(5);

    assert.equal(source.cache.dbVersion, 1, 'db starts with version == 1');

    source.cache.migrateDB = function(db, event) {
      assert.equal(event.oldVersion, 1, 'migrateDB called with oldVersion == 1');
      assert.equal(event.newVersion, 2, 'migrateDB called with newVersion == 2');
      done();
    };

    schema.on('upgrade', (version) => {
      assert.equal(version, 2, 'schema has upgraded to v2');
      assert.equal(source.cache.dbVersion, 2, 'db has the correct version');
    });

    await source.cache.openDB();

    await schema.upgrade({
      models: {
        planet: {
          attributes: {
            name: { type: 'string' }
          }
        },
        moon: {
          attributes: {
            name: { type: 'string' }
          }
        }
      }
    });
  });

  test('#reset is idempotent', async function(assert) {
    await source.cache.openDB();
    await source.reset();
    await source.reset();
    await source.cache.openDB();

    assert.ok(true, 'db has been reset twice and can still be reopened');
  });

  test('#push - addRecord', async function(assert) {
    assert.expect(2);

    let planet: Record = {
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, planet), planet, 'indexeddb contains record');

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

    let updates: Record = {
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

    let expected: Record = {
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, expected), expected, 'indexeddb contains record');
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
  });

  test('#push - removeRecord', async function(assert) {
    assert.expect(1);

    let planet: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    await source.push(t => t.addRecord(planet));
    await source.push(t => t.removeRecord(planet));
    assert.equal(await getRecordFromIndexedDB(source.cache, planet), undefined, 'indexeddb does not contain record');
  });

  test('#push - removeRecord - when record does not exist', async function(assert) {
    assert.expect(1);

    let planet: Record = {
      type: 'planet',
      id: 'jupiter'
    };

    await source.push(t => t.removeRecord(planet));
    assert.equal(await getRecordFromIndexedDB(source.cache, planet), undefined, 'indexeddb does not contain record');
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');

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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');

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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
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
          data: [
            { type: 'moon', id: 'moon1' }
          ]
        }
      }
    };

    await source.push(t => t.addRecord(original));
    await source.push(t => t.removeFromRelatedRecords(original, 'moons', { type: 'moon', id: 'moon2' }));
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
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
    assert.equal(await getRecordFromIndexedDB(source.cache, revised), undefined, 'indexeddb does not contain record');
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

    await source.push(t => t.addRecord(original))
    await source.push(t => t.replaceRelatedRecords(original, 'moons', [{ type: 'moon', id: 'moon2' }, { type: 'moon', id: 'moon3' }]));
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
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
    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revised), revised, 'indexeddb contains record');
   });

  test('#push - inverse relationships are created', async function(assert) {
    assert.expect(2);

    let ss = {
      type: 'solarSystem',
      id: 'ss'
    };

    let earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      },
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss' }
        }
      }
    };

    let jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss' }
        }
      }
    };

    let io: Record = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      },
      relationships: {
        planet: {
          data: { type: 'planet', id: 'jupiter' }
        }
      }
    };

    await source.push(t => [
      t.addRecord(ss),
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    let revisedSs = {
      type: 'solarSystem',
      id: 'ss',
      relationships: {
        planets: {
          data: [
            { type: 'planet', id: 'earth' },
            { type: 'planet', id: 'jupiter' }
          ]
        }
      }
    };

    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revisedSs), revisedSs, 'indexeddb contains record');

    let revisedJupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [
            { type: 'moon', id: 'io' }
          ]
        },
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss' }
        }
      }
    };

    assert.deepEqual(await getRecordFromIndexedDB(source.cache, revisedJupiter), revisedJupiter, 'indexeddb contains record');
  });

  test('#pull - all records', async function(assert) {
    assert.expect(5);

    let earth: Record = {
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

    let jupiter: Record = {
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

    let io: Record = {
      type: 'moon',
      id: 'io',
      keys: {
        remoteId: 'm1'
      },
      attributes: {
        name: 'Io'
      }
    };

    await source.push(t => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    // reset keyMap to verify that pulling records also adds keys
    keyMap.reset();

    let transforms = await source.pull(q => q.findRecords());

    assert.equal(transforms.length, 1, 'one transform returned');
    assert.deepEqual(
      transforms[0].operations.map(o => o.op),
      ['updateRecord', 'updateRecord', 'updateRecord'],
       'operations match expectations'
    );
    assert.equal(keyMap.keyToId('planet', 'remoteId', 'p1'), 'earth', 'key has been mapped');
    assert.equal(keyMap.keyToId('planet', 'remoteId', 'p2'), 'jupiter', 'key has been mapped');
    assert.equal(keyMap.keyToId('moon', 'remoteId', 'm1'), 'io', 'key has been mapped');
  });

  test('#pull - records of one type', async function(assert) {
    assert.expect(3);

    let earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io: Record = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    await source.push(t => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    let transforms = await source.pull(q => q.findRecords('planet'));

    assert.equal(transforms.length, 1, 'one transform returned');
    assert.deepEqual(
      transforms[0].operations.map(o => o.op),
      ['updateRecord', 'updateRecord'],
      'operations match expectations'
    );
    assert.deepEqual(
      transforms[0].operations.map((o: AddRecordOperation) => o.record.type),
      ['planet', 'planet'],
      'operations match expectations'
    );
  });

  test('#pull - specific records', async function(assert) {
    assert.expect(3);

    let earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io: Record = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    await source.push(t => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    let transforms = await source.pull(q => q.findRecords([
      earth,
      io,
      { type: 'moon', id: 'FAKE' }
    ]));

    assert.equal(transforms.length, 1, 'one transform returned');
    assert.deepEqual(
      transforms[0].operations.map(o => o.op),
      ['updateRecord', 'updateRecord'],
      'operations match expectations'
    );
    assert.deepEqual(
      transforms[0].operations.map((o: AddRecordOperation) => o.record.type),
      ['planet', 'moon'],
      'operations match expectations'
    );
  });

  test('#pull - a specific record', async function(assert) {
    assert.expect(3);

    let earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter: Record = {
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

    let io: Record = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    await source.push(t => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    // reset keyMap to verify that pulling records also adds keys
    keyMap.reset();

    let transforms = await source.pull(q => q.findRecord(jupiter));

    assert.equal(transforms.length, 1, 'one transform returned');
    assert.deepEqual(
      transforms[0].operations.map(o => o.op),
      ['updateRecord'],
      'operations match expectations'
    );

    assert.equal(keyMap.keyToId('planet', 'remoteId', 'p2'), 'jupiter', 'key has been mapped');
  });
});
