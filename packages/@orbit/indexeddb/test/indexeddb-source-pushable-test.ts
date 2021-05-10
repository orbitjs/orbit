import { buildTransform } from '@orbit/data';
import {
  AddRecordOperation,
  InitializedRecord,
  RecordIdentity,
  RecordKeyMap,
  RecordSchema,
  RecordTransform
} from '@orbit/records';
import { IndexedDBSource } from '../src/indexeddb-source';
import { getRecordFromIndexedDB } from './support/indexeddb';

const { module, test } = QUnit;

module('IndexedDBSource - pushable', function (hooks) {
  let schema: RecordSchema, source: IndexedDBSource, keyMap: RecordKeyMap;

  hooks.beforeEach(async () => {
    schema = new RecordSchema({
      models: {
        planet: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' },
            classification: { type: 'string' },
            order: { type: 'number' },
            revised: { type: 'boolean' }
          },
          relationships: {
            moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
            solarSystem: {
              kind: 'hasOne',
              type: 'solarSystem',
              inverse: 'planets'
            }
          }
        },
        moon: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
          }
        },
        solarSystem: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planets: {
              kind: 'hasMany',
              type: 'planet',
              inverse: 'solarSystem'
            }
          }
        }
      }
    });

    keyMap = new RecordKeyMap();

    source = new IndexedDBSource({ schema, keyMap });
    await source.activated;
  });

  hooks.afterEach(async () => {
    await source.deactivate();
    await source.cache.deleteDB();
  });

  test('#push - addRecord', async function (assert) {
    assert.expect(3);

    let planet: InitializedRecord = {
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

    const t = buildTransform({
      op: 'addRecord',
      record: planet
    } as AddRecordOperation);

    await source.push(t);

    assert.ok(source.transformLog.contains(t.id), 'log contains transform');
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, planet),
      planet,
      'indexeddb contains record'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'j'),
      'jupiter',
      'key has been mapped'
    );
  });

  test('#push - addRecord - with beforePush listener that syncs transform', async function (assert) {
    assert.expect(4);

    let planet: InitializedRecord = {
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

    const t = buildTransform({
      op: 'addRecord',
      record: planet
    } as AddRecordOperation);

    source.on('beforePush', async function (transform: RecordTransform) {
      await source.sync(transform);
    });

    let result = await source.push(t);

    assert.deepEqual(result, [], 'result represents transforms applied');
    assert.ok(source.transformLog.contains(t.id), 'log contains transform');
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, planet),
      planet,
      'indexeddb contains record'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'j'),
      'jupiter',
      'key has been mapped'
    );
  });

  test('#push - updateRecord', async function (assert) {
    assert.expect(2);

    let original: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: 'j'
      },
      attributes: {
        name: 'Jupiter'
      },
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        }
      }
    };

    let updates: InitializedRecord = {
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

    let expected: InitializedRecord = {
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

    await source.push((t) => t.addRecord(original));
    await source.push((t) => t.updateRecord(updates));
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, expected),
      expected,
      'indexeddb contains record'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'j'),
      'jupiter',
      'key has been mapped'
    );
  });

  test('#push - updateRecord - when record does not exist', async function (assert) {
    assert.expect(1);

    let revised: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        revised: true
      }
    };

    await source.push((t) => t.updateRecord(revised));
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - removeRecord', async function (assert) {
    assert.expect(1);

    let planet: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    await source.push((t) => t.addRecord(planet));
    await source.push((t) => t.removeRecord(planet));
    assert.equal(
      await getRecordFromIndexedDB(source.cache, planet),
      undefined,
      'indexeddb does not contain record'
    );
  });

  test('#push - removeRecord when part of has many relationship', async function (assert) {
    assert.expect(2);

    let moon1 = { type: 'moon', id: 'moon1' };
    let moon2 = { type: 'moon', id: 'moon2' };
    let planet: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [moon1, moon2]
        }
      }
    };

    await source.push((t) => [
      t.addRecord(moon1),
      t.addRecord(moon2),
      t.addRecord(planet)
    ]);

    let moons = (await getRecordFromIndexedDB(source.cache, planet))
      ?.relationships?.moons.data as RecordIdentity[];
    assert.deepEqual(moons.length, 2, 'record has 2 moons');

    await source.push((t) => t.removeRecord(moon1));
    moons = (await getRecordFromIndexedDB(source.cache, planet)).relationships
      ?.moons.data as RecordIdentity[];
    assert.deepEqual(moons.length, 1, 'record has 1 moon');
  });

  test('#push - removeRecord - when record does not exist', async function (assert) {
    assert.expect(1);

    let planet: InitializedRecord = {
      type: 'planet',
      id: 'jupiter'
    };

    await source.push((t) => t.removeRecord(planet));
    assert.equal(
      await getRecordFromIndexedDB(source.cache, planet),
      undefined,
      'indexeddb does not contain record'
    );
  });

  test('#push - replaceKey', async function (assert) {
    assert.expect(2);

    let original: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let revised: InitializedRecord = {
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

    await source.push((t) => t.addRecord(original));
    await source.push((t) => t.replaceKey(original, 'remoteId', '123'));
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );

    assert.equal(
      keyMap.keyToId('planet', 'remoteId', '123'),
      'jupiter',
      'key has been mapped'
    );
  });

  test('#push - replaceKey - when base record does not exist', async function (assert) {
    assert.expect(2);

    let revised: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: '123'
      }
    };

    await source.push((t) =>
      t.replaceKey({ type: 'planet', id: 'jupiter' }, 'remoteId', '123')
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );

    assert.equal(
      keyMap.keyToId('planet', 'remoteId', '123'),
      'jupiter',
      'key has been mapped'
    );
  });

  test('#push - replaceAttribute', async function (assert) {
    assert.expect(1);

    let original: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let revised: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        order: 5
      }
    };

    await source.push((t) => t.addRecord(original));
    await source.push((t) => t.replaceAttribute(original, 'order', 5));
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - replaceAttribute - when base record does not exist', async function (assert) {
    assert.expect(1);

    let revised: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        order: 5
      }
    };

    await source.push((t) =>
      t.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'order', 5)
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - addToRelatedRecords', async function (assert) {
    assert.expect(1);

    let original: InitializedRecord = {
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

    let revised: InitializedRecord = {
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

    await source.push((t) => t.addRecord(original));
    await source.push((t) =>
      t.addToRelatedRecords(original, 'moons', { type: 'moon', id: 'moon1' })
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - addToRelatedRecords - when base record does not exist', async function (assert) {
    assert.expect(1);

    let revised: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'moon1' }]
        }
      }
    };

    await source.push((t) =>
      t.addToRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', {
        type: 'moon',
        id: 'moon1'
      })
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - removeFromRelatedRecords', async function (assert) {
    assert.expect(1);

    let original: InitializedRecord = {
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

    let revised: InitializedRecord = {
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

    await source.push((t) => t.addRecord(original));
    await source.push((t) =>
      t.removeFromRelatedRecords(original, 'moons', {
        type: 'moon',
        id: 'moon2'
      })
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - removeFromRelatedRecords - when base record does not exist', async function (assert) {
    assert.expect(1);

    let revised: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        moons: {
          data: []
        }
      }
    };

    await source.push((t) =>
      t.removeFromRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', {
        type: 'moon',
        id: 'moon2'
      })
    );
    assert.equal(
      await getRecordFromIndexedDB(source.cache, revised),
      undefined,
      'indexeddb does not contain record'
    );
  });

  test('#push - replaceRelatedRecords', async function (assert) {
    assert.expect(1);

    let original: InitializedRecord = {
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

    let revised: InitializedRecord = {
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

    await source.push((t) => t.addRecord(original));
    await source.push((t) =>
      t.replaceRelatedRecords(original, 'moons', [
        { type: 'moon', id: 'moon2' },
        { type: 'moon', id: 'moon3' }
      ])
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - replaceRelatedRecords - when base record does not exist', async function (assert) {
    assert.expect(1);

    let revised: InitializedRecord = {
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

    await source.push((t) =>
      t.replaceRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', [
        { type: 'moon', id: 'moon2' },
        { type: 'moon', id: 'moon3' }
      ])
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - replaceRelatedRecord - with record', async function (assert) {
    assert.expect(1);

    let original: InitializedRecord = {
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

    let revised: InitializedRecord = {
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

    await source.push((t) => t.addRecord(original));
    await source.push((t) =>
      t.replaceRelatedRecord(original, 'solarSystem', {
        type: 'solarSystem',
        id: 'ss1'
      })
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - replaceRelatedRecord - with record - when base record does not exist', async function (assert) {
    assert.expect(1);

    let revised: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss1' }
        }
      }
    };

    await source.push((t) =>
      t.replaceRelatedRecord({ type: 'planet', id: 'jupiter' }, 'solarSystem', {
        type: 'solarSystem',
        id: 'ss1'
      })
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - replaceRelatedRecord - with null', async function (assert) {
    assert.expect(1);

    let original: InitializedRecord = {
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

    let revised: InitializedRecord = {
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

    await source.push((t) => t.addRecord(original));
    await source.push((t) =>
      t.replaceRelatedRecord(original, 'solarSystem', null)
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - replaceRelatedRecord - with null - when base record does not exist', async function (assert) {
    assert.expect(1);

    let revised: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      relationships: {
        solarSystem: {
          data: null
        }
      }
    };

    await source.push((t) =>
      t.replaceRelatedRecord(
        { type: 'planet', id: 'jupiter' },
        'solarSystem',
        null
      )
    );
    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#push - inverse relationships are created', async function (assert) {
    assert.expect(2);

    let ss = {
      type: 'solarSystem',
      id: 'ss'
    };

    let earth: InitializedRecord = {
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

    let jupiter: InitializedRecord = {
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

    let io: InitializedRecord = {
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

    await source.push((t) => [
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

    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revisedSs),
      revisedSs,
      'indexeddb contains record'
    );

    let revisedJupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      },
      relationships: {
        moons: {
          data: [{ type: 'moon', id: 'io' }]
        },
        solarSystem: {
          data: { type: 'solarSystem', id: 'ss' }
        }
      }
    };

    assert.deepEqual(
      await getRecordFromIndexedDB(source.cache, revisedJupiter),
      revisedJupiter,
      'indexeddb contains record'
    );
  });
});
