import { getRecordFromLocalStorage } from './support/local-storage';
import { InitializedRecord, RecordSchema, RecordKeyMap } from '@orbit/records';
import { LocalStorageCache } from '../src/local-storage-cache';

const { module, test } = QUnit;

module('LocalStorageCache', function (hooks) {
  let schema: RecordSchema, cache: LocalStorageCache, keyMap: RecordKeyMap;

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

    cache = new LocalStorageCache({ schema, keyMap });
  });

  hooks.afterEach(() => {
    return cache.reset();
  });

  test('it exists', function (assert) {
    assert.ok(cache);
    assert.strictEqual(cache.schema, schema, 'schema has been assigned');
    assert.strictEqual(cache.keyMap, keyMap, 'keyMap has been assigned');
  });

  test('sets/gets records individually', function (assert) {
    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' }
    };
    const io = { type: 'moon', id: 'io', attributes: { name: 'Io' } };
    const europa = {
      type: 'moon',
      id: 'europa',
      attributes: { name: 'Europa' }
    };

    cache.setRecordSync(jupiter);
    cache.setRecordSync(io);
    cache.setRecordSync(europa);

    assert.deepEqual(cache.getRecordSync(jupiter), jupiter);
    assert.deepEqual(cache.getRecordSync(io), io);
    assert.deepEqual(cache.getRecordSync(europa), europa);

    cache.removeRecordSync(jupiter);
    cache.removeRecordSync(io);
    cache.removeRecordSync(europa);

    assert.deepEqual(cache.getRecordSync(jupiter), undefined);
    assert.deepEqual(cache.getRecordSync(io), undefined);
    assert.deepEqual(cache.getRecordSync(europa), undefined);
  });

  test('sets/gets records in bulk', function (assert) {
    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' }
    };
    const io = { type: 'moon', id: 'io', attributes: { name: 'Io' } };
    const europa = {
      type: 'moon',
      id: 'europa',
      attributes: { name: 'Europa' }
    };

    cache.setRecordsSync([jupiter, io, europa]);

    assert.deepEqual(cache.getRecordsSync([jupiter, io, europa]), [
      jupiter,
      io,
      europa
    ]);

    cache.removeRecordsSync([jupiter, io, europa]);

    assert.deepEqual(cache.getRecordsSync([jupiter, io, europa]), []);
  });

  test('sets/gets inverse relationships for a single record', function (assert) {
    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };
    const europa = { type: 'moon', id: 'europa' };
    const callisto = { type: 'moon', id: 'callisto' };

    const earth = { type: 'planet', id: 'earth' };
    const earthMoon = { type: 'moon', id: 'earthMoon' };

    assert.deepEqual(
      cache.getInverseRelationshipsSync(jupiter),
      [],
      'no inverse relationships to start'
    );

    cache.addInverseRelationshipsSync([
      { record: callisto, relationship: 'planet', relatedRecord: jupiter },
      { record: earthMoon, relationship: 'planet', relatedRecord: earth },
      { record: europa, relationship: 'planet', relatedRecord: jupiter },
      { record: io, relationship: 'planet', relatedRecord: jupiter }
    ]);

    assert.deepEqual(
      cache.getInverseRelationshipsSync(jupiter),
      [
        { record: callisto, relationship: 'planet', relatedRecord: jupiter },
        { record: europa, relationship: 'planet', relatedRecord: jupiter },
        { record: io, relationship: 'planet', relatedRecord: jupiter }
      ],
      'inverse relationships have been added'
    );

    assert.deepEqual(
      cache.getInverseRelationshipsSync(earth),
      [{ record: earthMoon, relationship: 'planet', relatedRecord: earth }],
      'inverse relationships have been added'
    );

    cache.removeInverseRelationshipsSync([
      { record: callisto, relationship: 'planet', relatedRecord: jupiter },
      { record: earthMoon, relationship: 'planet', relatedRecord: earth },
      { record: europa, relationship: 'planet', relatedRecord: jupiter },
      { record: io, relationship: 'planet', relatedRecord: jupiter }
    ]);

    assert.deepEqual(
      cache.getInverseRelationshipsSync(jupiter),
      [],
      'inverse relationships have been removed'
    );

    assert.deepEqual(
      cache.getInverseRelationshipsSync(earth),
      [],
      'inverse relationships have been removed'
    );
  });

  test('sets/gets inverse relationships for a multiple records', function (assert) {
    const jupiter = { type: 'planet', id: 'jupiter' };
    const io = { type: 'moon', id: 'io' };
    const europa = { type: 'moon', id: 'europa' };
    const callisto = { type: 'moon', id: 'callisto' };

    const earth = { type: 'planet', id: 'earth' };
    const earthMoon = { type: 'moon', id: 'earthMoon' };

    assert.deepEqual(
      cache.getInverseRelationshipsSync([jupiter, earth]),
      [],
      'no inverse relationships to start'
    );

    cache.addInverseRelationshipsSync([
      { record: callisto, relationship: 'planet', relatedRecord: jupiter },
      { record: europa, relationship: 'planet', relatedRecord: jupiter },
      { record: io, relationship: 'planet', relatedRecord: jupiter },
      { record: earthMoon, relationship: 'planet', relatedRecord: earth }
    ]);

    assert.deepEqual(
      cache.getInverseRelationshipsSync([jupiter, earth]),
      [
        { record: callisto, relationship: 'planet', relatedRecord: jupiter },
        { record: europa, relationship: 'planet', relatedRecord: jupiter },
        { record: io, relationship: 'planet', relatedRecord: jupiter },
        { record: earthMoon, relationship: 'planet', relatedRecord: earth }
      ],
      'inverse relationships have been added'
    );

    cache.removeInverseRelationshipsSync([
      { record: callisto, relationship: 'planet', relatedRecord: jupiter },
      { record: europa, relationship: 'planet', relatedRecord: jupiter },
      { record: io, relationship: 'planet', relatedRecord: jupiter },
      { record: earthMoon, relationship: 'planet', relatedRecord: earth }
    ]);

    assert.deepEqual(
      cache.getInverseRelationshipsSync([jupiter, earth]),
      [],
      'inverse relationships have been removed'
    );
  });

  test('#update - addRecord', function (assert) {
    assert.expect(2);

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

    cache.update((t) => t.addRecord(planet));

    assert.deepEqual(
      getRecordFromLocalStorage(cache, planet),
      planet,
      'indexeddb contains record'
    );

    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'j'),
      'jupiter',
      'key has been mapped'
    );
  });

  test('#update - updateRecord', function (assert) {
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

    cache.update((t) => t.addRecord(original));
    cache.update((t) => t.updateRecord(updates));
    assert.deepEqual(
      getRecordFromLocalStorage(cache, expected),
      expected,
      'indexeddb contains record'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'j'),
      'jupiter',
      'key has been mapped'
    );
  });

  test('#update - updateRecord - when record does not exist', function (assert) {
    assert.expect(1);

    let revised = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant',
        revised: true
      }
    };

    cache.update((t) => t.updateRecord(revised));
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - removeRecord', function (assert) {
    assert.expect(1);

    let planet: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    cache.update((t) => t.addRecord(planet));
    cache.update((t) => t.removeRecord(planet));
    assert.equal(
      getRecordFromLocalStorage(cache, planet),
      null,
      'indexeddb does not contain record'
    );
  });

  test('#update - removeRecord - when record does not exist', function (assert) {
    assert.expect(1);

    let planet = {
      type: 'planet',
      id: 'jupiter'
    };

    cache.update((t) => t.removeRecord(planet));
    assert.equal(
      getRecordFromLocalStorage(cache, planet),
      null,
      'indexeddb does not contain record'
    );
  });

  test('#update - replaceKey', function (assert) {
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

    cache.update((t) => t.addRecord(original));
    cache.update((t) => t.replaceKey(original, 'remoteId', '123'));
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );

    assert.equal(
      keyMap.keyToId('planet', 'remoteId', '123'),
      'jupiter',
      'key has been mapped'
    );
  });

  test('#update - replaceKey - when base record does not exist', function (assert) {
    assert.expect(2);

    let revised: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      keys: {
        remoteId: '123'
      }
    };

    cache.update((t) =>
      t.replaceKey({ type: 'planet', id: 'jupiter' }, 'remoteId', '123')
    );
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );

    assert.equal(
      keyMap.keyToId('planet', 'remoteId', '123'),
      'jupiter',
      'key has been mapped'
    );
  });

  test('#update - replaceAttribute', function (assert) {
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

    cache.update((t) => t.addRecord(original));
    cache.update((t) => t.replaceAttribute(original, 'order', 5));
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - replaceAttribute - when base record does not exist', function (assert) {
    assert.expect(1);

    let revised: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        order: 5
      }
    };

    cache.update((t) =>
      t.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'order', 5)
    );
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - addToRelatedRecords', function (assert) {
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

    cache.update((t) => t.addRecord(original));
    cache.update((t) =>
      t.addToRelatedRecords(original, 'moons', { type: 'moon', id: 'moon1' })
    );
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - addToRelatedRecords - when base record does not exist', function (assert) {
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

    cache.update((t) =>
      t.addToRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', {
        type: 'moon',
        id: 'moon1'
      })
    );
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - removeFromRelatedRecords', function (assert) {
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

    cache.update((t) => t.addRecord(original));
    cache.update((t) =>
      t.removeFromRelatedRecords(original, 'moons', {
        type: 'moon',
        id: 'moon2'
      })
    );
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - removeFromRelatedRecords - when base record does not exist', function (assert) {
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

    cache.update((t) =>
      t.removeFromRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', {
        type: 'moon',
        id: 'moon2'
      })
    );
    assert.equal(
      getRecordFromLocalStorage(cache, revised),
      null,
      'indexeddb does not contain record'
    );
  });

  test('#update - replaceRelatedRecords', function (assert) {
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

    cache.update((t) => t.addRecord(original));
    cache.update((t) =>
      t.replaceRelatedRecords(original, 'moons', [
        { type: 'moon', id: 'moon2' },
        { type: 'moon', id: 'moon3' }
      ])
    );
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - replaceRelatedRecords - when base record does not exist', function (assert) {
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

    cache.update((t) =>
      t.replaceRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', [
        { type: 'moon', id: 'moon2' },
        { type: 'moon', id: 'moon3' }
      ])
    );
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - replaceRelatedRecord - with record', function (assert) {
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

    cache.update((t) => t.addRecord(original));
    cache.update((t) =>
      t.replaceRelatedRecord(original, 'solarSystem', {
        type: 'solarSystem',
        id: 'ss1'
      })
    );
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - replaceRelatedRecord - with record - when base record does not exist', function (assert) {
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

    cache.update((t) =>
      t.replaceRelatedRecord({ type: 'planet', id: 'jupiter' }, 'solarSystem', {
        type: 'solarSystem',
        id: 'ss1'
      })
    );
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - replaceRelatedRecord - with null', function (assert) {
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

    cache.update((t) => t.addRecord(original));
    cache.update((t) => t.replaceRelatedRecord(original, 'solarSystem', null));
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#update - replaceRelatedRecord - with null - when base record does not exist', function (assert) {
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

    cache.update((t) =>
      t.replaceRelatedRecord(
        { type: 'planet', id: 'jupiter' },
        'solarSystem',
        null
      )
    );
    assert.deepEqual(
      getRecordFromLocalStorage(cache, revised),
      revised,
      'indexeddb contains record'
    );
  });

  test('#query - all records', function (assert) {
    let earth: InitializedRecord = {
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

    let jupiter: InitializedRecord = {
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

    let io: InitializedRecord = {
      type: 'moon',
      id: 'io',
      keys: {
        remoteId: 'm1'
      },
      attributes: {
        name: 'Io'
      }
    };

    cache.update((t) => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    // reset keyMap to verify that querying records also adds keys
    keyMap.reset();

    const records = cache.query<InitializedRecord[]>((q) => q.findRecords());
    assert.deepEqual(
      records.map((r) => r.id).sort(),
      ['earth', 'io', 'jupiter'],
      'query results match'
    );

    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'p1'),
      'earth',
      'key has been mapped'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'p2'),
      'jupiter',
      'key has been mapped'
    );
    assert.equal(
      keyMap.keyToId('moon', 'remoteId', 'm1'),
      'io',
      'key has been mapped'
    );
  });

  test('#query - records of one type', function (assert) {
    assert.expect(1);

    let earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io: InitializedRecord = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    cache.update((t) => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    let records = cache.query((q) => q.findRecords('planet'));
    assert.deepEqual(records, [earth, jupiter], 'query results are expected');
  });

  test('#query - records by identity', function (assert) {
    assert.expect(1);

    let earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter',
        classification: 'gas giant'
      }
    };

    let io: InitializedRecord = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    cache.update((t) => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    let records = cache.query((q) =>
      q.findRecords([earth, io, { type: 'planet', id: 'FAKE' }])
    );
    assert.deepEqual(records, [earth, io], 'only matches are returned');
  });

  test('#query - a specific record', function (assert) {
    assert.expect(2);

    let earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth',
        classification: 'terrestrial'
      }
    };

    let jupiter: InitializedRecord = {
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

    let io: InitializedRecord = {
      type: 'moon',
      id: 'io',
      attributes: {
        name: 'Io'
      }
    };

    cache.update((t) => [
      t.addRecord(earth),
      t.addRecord(jupiter),
      t.addRecord(io)
    ]);

    // reset keyMap to verify that pulling records also adds keys
    keyMap.reset();

    let record = cache.query((q) => q.findRecord(jupiter));

    assert.deepEqual(record, jupiter, 'query results are expected');

    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'p2'),
      'jupiter',
      'key has been mapped'
    );
  });
});
