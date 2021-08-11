import { getRecordFromIndexedDB } from './support/indexeddb';
import {
  InitializedRecord,
  RecordSchema,
  RecordKeyMap,
  ModelDefinition
} from '@orbit/records';
import { Dict } from '@orbit/utils';
import { IndexedDBCache } from '../src/indexeddb-cache';

const { module, test } = QUnit;

module('IndexedDBCache', function () {
  let schema: RecordSchema, cache: IndexedDBCache, keyMap: RecordKeyMap;

  module('fixed schema', function (hooks) {
    hooks.beforeEach(async () => {
      const models = {
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
      } as Dict<ModelDefinition>;

      keyMap = new RecordKeyMap();
      schema = new RecordSchema({ models });
      cache = new IndexedDBCache({ schema, keyMap });
      await cache.openDB();
    });

    hooks.afterEach(() => {
      return cache.deleteDB();
    });

    test('it exists', function (assert) {
      assert.ok(cache);
      assert.strictEqual(cache.schema, schema, 'schema has been assigned');
      assert.strictEqual(cache.keyMap, keyMap, 'keyMap has been assigned');
    });

    test('is assigned a default dbName', function (assert) {
      assert.equal(cache.dbName, 'orbit', '`dbName` is `orbit` by default');
    });

    test('sets/gets records individually', async function (assert) {
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

      await cache.setRecordAsync(jupiter);
      await cache.setRecordAsync(io);
      await cache.setRecordAsync(europa);

      assert.deepEqual(await cache.getRecordAsync(jupiter), jupiter);
      assert.deepEqual(await cache.getRecordAsync(io), io);
      assert.deepEqual(await cache.getRecordAsync(europa), europa);

      await cache.removeRecordAsync(jupiter);
      await cache.removeRecordAsync(io);
      await cache.removeRecordAsync(europa);

      assert.deepEqual(await cache.getRecordAsync(jupiter), undefined);
      assert.deepEqual(await cache.getRecordAsync(io), undefined);
      assert.deepEqual(await cache.getRecordAsync(europa), undefined);
    });

    test('sets/gets records in bulk', async function (assert) {
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

      await cache.setRecordsAsync([jupiter, io, europa]);

      assert.deepEqual(await cache.getRecordsAsync([jupiter, io, europa]), [
        jupiter,
        io,
        europa
      ]);

      await cache.removeRecordsAsync([jupiter, io, europa]);

      assert.deepEqual(await cache.getRecordsAsync([jupiter, io, europa]), []);
    });

    test('sets/gets inverse relationships for a single record', async function (assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };
      const europa = { type: 'moon', id: 'europa' };
      const callisto = { type: 'moon', id: 'callisto' };

      const earth = { type: 'planet', id: 'earth' };
      const earthMoon = { type: 'moon', id: 'earthMoon' };

      assert.deepEqual(
        await cache.getInverseRelationshipsAsync(jupiter),
        [],
        'no inverse relationships to start'
      );

      await cache.addInverseRelationshipsAsync([
        { record: callisto, relationship: 'planet', relatedRecord: jupiter },
        { record: earthMoon, relationship: 'planet', relatedRecord: earth },
        { record: europa, relationship: 'planet', relatedRecord: jupiter },
        { record: io, relationship: 'planet', relatedRecord: jupiter }
      ]);

      assert.deepEqual(
        await cache.getInverseRelationshipsAsync(jupiter),
        [
          {
            record: callisto,
            relationship: 'planet',
            relatedRecord: jupiter
          },
          { record: europa, relationship: 'planet', relatedRecord: jupiter },
          { record: io, relationship: 'planet', relatedRecord: jupiter }
        ],
        'inverse relationships have been added'
      );

      assert.deepEqual(
        await cache.getInverseRelationshipsAsync(earth),
        [{ record: earthMoon, relationship: 'planet', relatedRecord: earth }],
        'inverse relationships have been added'
      );

      await cache.removeInverseRelationshipsAsync([
        { record: callisto, relationship: 'planet', relatedRecord: jupiter },
        { record: earthMoon, relationship: 'planet', relatedRecord: earth },
        { record: europa, relationship: 'planet', relatedRecord: jupiter },
        { record: io, relationship: 'planet', relatedRecord: jupiter }
      ]);

      assert.deepEqual(
        await cache.getInverseRelationshipsAsync(jupiter),
        [],
        'inverse relationships have been removed'
      );

      assert.deepEqual(
        await cache.getInverseRelationshipsAsync(earth),
        [],
        'inverse relationships have been removed'
      );
    });

    test('sets/gets inverse relationships for a multiple records', async function (assert) {
      const jupiter = { type: 'planet', id: 'jupiter' };
      const io = { type: 'moon', id: 'io' };
      const europa = { type: 'moon', id: 'europa' };
      const callisto = { type: 'moon', id: 'callisto' };

      const earth = { type: 'planet', id: 'earth' };
      const earthMoon = { type: 'moon', id: 'earthMoon' };

      assert.deepEqual(
        await cache.getInverseRelationshipsAsync([jupiter, earth]),
        [],
        'no inverse relationships to start'
      );

      await cache.addInverseRelationshipsAsync([
        { record: callisto, relationship: 'planet', relatedRecord: jupiter },
        { record: earthMoon, relationship: 'planet', relatedRecord: earth },
        { record: europa, relationship: 'planet', relatedRecord: jupiter },
        { record: io, relationship: 'planet', relatedRecord: jupiter }
      ]);

      assert.deepEqual(
        await cache.getInverseRelationshipsAsync([jupiter, earth]),
        [
          {
            record: callisto,
            relationship: 'planet',
            relatedRecord: jupiter
          },
          { record: earthMoon, relationship: 'planet', relatedRecord: earth },
          { record: europa, relationship: 'planet', relatedRecord: jupiter },
          { record: io, relationship: 'planet', relatedRecord: jupiter }
        ],
        'inverse relationships have been added'
      );

      await cache.removeInverseRelationshipsAsync([
        { record: callisto, relationship: 'planet', relatedRecord: jupiter },
        { record: earthMoon, relationship: 'planet', relatedRecord: earth },
        { record: europa, relationship: 'planet', relatedRecord: jupiter },
        { record: io, relationship: 'planet', relatedRecord: jupiter }
      ]);

      assert.deepEqual(
        await cache.getInverseRelationshipsAsync([jupiter, earth]),
        [],
        'inverse relationships have been removed'
      );
    });

    test('#update - addRecord', async function (assert) {
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

      await cache.update((t) => t.addRecord(planet));

      assert.deepEqual(
        await getRecordFromIndexedDB(cache, planet),
        planet,
        'indexeddb contains record'
      );

      assert.equal(
        keyMap.keyToId('planet', 'remoteId', 'j'),
        'jupiter',
        'key has been mapped'
      );
    });

    test('#update - updateRecord', async function (assert) {
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

      await cache.update((t) => t.addRecord(original));
      await cache.update((t) => t.updateRecord(updates));
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, expected),
        expected,
        'indexeddb contains record'
      );
      assert.equal(
        keyMap.keyToId('planet', 'remoteId', 'j'),
        'jupiter',
        'key has been mapped'
      );
    });

    test('#update - updateRecord - when record does not exist', async function (assert) {
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

      await cache.update((t) => t.updateRecord(revised));
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - removeRecord', async function (assert) {
      assert.expect(1);

      let planet: InitializedRecord = {
        type: 'planet',
        id: 'jupiter',
        attributes: {
          name: 'Jupiter',
          classification: 'gas giant'
        }
      };

      await cache.update((t) => t.addRecord(planet));
      await cache.update((t) => t.removeRecord(planet));
      assert.equal(
        await getRecordFromIndexedDB(cache, planet),
        null,
        'indexeddb does not contain record'
      );
    });

    test('#update - removeRecord - when record does not exist', async function (assert) {
      assert.expect(1);

      let planet = {
        type: 'planet',
        id: 'jupiter'
      };

      await cache.update((t) => t.removeRecord(planet));
      assert.equal(
        await getRecordFromIndexedDB(cache, planet),
        null,
        'indexeddb does not contain record'
      );
    });

    test('#update - replaceKey', async function (assert) {
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

      await cache.update((t) => t.addRecord(original));
      await cache.update((t) => t.replaceKey(original, 'remoteId', '123'));
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );

      assert.equal(
        keyMap.keyToId('planet', 'remoteId', '123'),
        'jupiter',
        'key has been mapped'
      );
    });

    test('#update - replaceKey - when base record does not exist', async function (assert) {
      assert.expect(2);

      let revised: InitializedRecord = {
        type: 'planet',
        id: 'jupiter',
        keys: {
          remoteId: '123'
        }
      };

      await cache.update((t) =>
        t.replaceKey({ type: 'planet', id: 'jupiter' }, 'remoteId', '123')
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );

      assert.equal(
        keyMap.keyToId('planet', 'remoteId', '123'),
        'jupiter',
        'key has been mapped'
      );
    });

    test('#update - replaceAttribute', async function (assert) {
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

      await cache.update((t) => t.addRecord(original));
      await cache.update((t) => t.replaceAttribute(original, 'order', 5));
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - replaceAttribute - when base record does not exist', async function (assert) {
      assert.expect(1);

      let revised: InitializedRecord = {
        type: 'planet',
        id: 'jupiter',
        attributes: {
          order: 5
        }
      };

      await cache.update((t) =>
        t.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'order', 5)
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - addToRelatedRecords', async function (assert) {
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

      await cache.update((t) => t.addRecord(original));
      await cache.update((t) =>
        t.addToRelatedRecords(original, 'moons', {
          type: 'moon',
          id: 'moon1'
        })
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - addToRelatedRecords - when base record does not exist', async function (assert) {
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

      await cache.update((t) =>
        t.addToRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', {
          type: 'moon',
          id: 'moon1'
        })
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - removeFromRelatedRecords', async function (assert) {
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

      await cache.update((t) => t.addRecord(original));
      await cache.update((t) =>
        t.removeFromRelatedRecords(original, 'moons', {
          type: 'moon',
          id: 'moon2'
        })
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - removeFromRelatedRecords - when base record does not exist', async function (assert) {
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

      await cache.update((t) =>
        t.removeFromRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', {
          type: 'moon',
          id: 'moon2'
        })
      );
      assert.equal(
        await getRecordFromIndexedDB(cache, revised),
        null,
        'indexeddb does not contain record'
      );
    });

    test('#update - replaceRelatedRecords', async function (assert) {
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

      await cache.update((t) => t.addRecord(original));
      await cache.update((t) =>
        t.replaceRelatedRecords(original, 'moons', [
          { type: 'moon', id: 'moon2' },
          { type: 'moon', id: 'moon3' }
        ])
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - replaceRelatedRecords - when base record does not exist', async function (assert) {
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

      await cache.update((t) =>
        t.replaceRelatedRecords({ type: 'planet', id: 'jupiter' }, 'moons', [
          { type: 'moon', id: 'moon2' },
          { type: 'moon', id: 'moon3' }
        ])
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - replaceRelatedRecord - with record', async function (assert) {
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

      await cache.update((t) => t.addRecord(original));
      await cache.update((t) =>
        t.replaceRelatedRecord(original, 'solarSystem', {
          type: 'solarSystem',
          id: 'ss1'
        })
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - replaceRelatedRecord - with record - when base record does not exist', async function (assert) {
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

      await cache.update((t) =>
        t.replaceRelatedRecord(
          { type: 'planet', id: 'jupiter' },
          'solarSystem',
          {
            type: 'solarSystem',
            id: 'ss1'
          }
        )
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - replaceRelatedRecord - with null', async function (assert) {
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

      await cache.update((t) => t.addRecord(original));
      await cache.update((t) =>
        t.replaceRelatedRecord(original, 'solarSystem', null)
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#update - replaceRelatedRecord - with null - when base record does not exist', async function (assert) {
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

      await cache.update((t) =>
        t.replaceRelatedRecord(
          { type: 'planet', id: 'jupiter' },
          'solarSystem',
          null
        )
      );
      assert.deepEqual(
        await getRecordFromIndexedDB(cache, revised),
        revised,
        'indexeddb contains record'
      );
    });

    test('#query - all records', async function (assert) {
      assert.expect(4);

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

      await cache.update((t) => [
        t.addRecord(earth),
        t.addRecord(jupiter),
        t.addRecord(io)
      ]);

      // reset keyMap to verify that querying records also adds keys
      keyMap.reset();

      let records = await cache.query((q) => q.findRecords());
      assert.deepEqual(
        records,
        [earth, jupiter, io],
        'query results are expected'
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

    test('#query - records of one type', async function (assert) {
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

      await cache.update((t) => [
        t.addRecord(earth),
        t.addRecord(jupiter),
        t.addRecord(io)
      ]);

      let records = await cache.query((q) => q.findRecords('planet'));
      assert.deepEqual(records, [earth, jupiter], 'query results are expected');
    });

    test('#query - records by identity', async function (assert) {
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

      await cache.update((t) => [
        t.addRecord(earth),
        t.addRecord(jupiter),
        t.addRecord(io)
      ]);

      let records = await cache.query((q) =>
        q.findRecords([earth, io, { type: 'planet', id: 'FAKE' }])
      );
      assert.deepEqual(records, [earth, io], 'only matches are returned');
    });

    test('#query - a specific record', async function (assert) {
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

      await cache.update((t) => [
        t.addRecord(earth),
        t.addRecord(jupiter),
        t.addRecord(io)
      ]);

      // reset keyMap to verify that pulling records also adds keys
      keyMap.reset();

      let record = await cache.query((q) => q.findRecord(jupiter));

      assert.deepEqual(record, jupiter, 'query results are expected');

      assert.equal(
        keyMap.keyToId('planet', 'remoteId', 'p2'),
        'jupiter',
        'key has been mapped'
      );
    });

    test('#update tracks refs and clears them from hasOne relationships when a referenced record is removed', async function (assert) {
      const jupiter: InitializedRecord = {
        type: 'planet',
        id: 'p1',
        attributes: { name: 'Jupiter' },
        relationships: { moons: { data: undefined } }
      };
      const io: InitializedRecord = {
        type: 'moon',
        id: 'm1',
        attributes: { name: 'Io' },
        relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
      };
      const europa: InitializedRecord = {
        type: 'moon',
        id: 'm2',
        attributes: { name: 'Europa' },
        relationships: { planet: { data: { type: 'planet', id: 'p1' } } }
      };

      await cache.update((t) => [
        t.addRecord(jupiter),
        t.addRecord(io),
        t.addRecord(europa)
      ]);

      assert.deepEqual(
        ((await cache.getRecordAsync({
          type: 'moon',
          id: 'm1'
        })) as InitializedRecord)?.relationships?.planet.data,
        { type: 'planet', id: 'p1' },
        'Jupiter has been assigned to Io'
      );
      assert.deepEqual(
        ((await cache.getRecordAsync({
          type: 'moon',
          id: 'm2'
        })) as InitializedRecord)?.relationships?.planet.data,
        { type: 'planet', id: 'p1' },
        'Jupiter has been assigned to Europa'
      );

      await cache.update((t) => t.removeRecord(jupiter));

      assert.equal(
        await cache.getRecordAsync({ type: 'planet', id: 'p1' }),
        undefined,
        'Jupiter is GONE'
      );

      assert.equal(
        ((await cache.getRecordAsync({
          type: 'moon',
          id: 'm1'
        })) as InitializedRecord)?.relationships?.planet.data,
        undefined,
        'Jupiter has been cleared from Io'
      );
      assert.equal(
        ((await cache.getRecordAsync({
          type: 'moon',
          id: 'm2'
        })) as InitializedRecord)?.relationships?.planet.data,
        undefined,
        'Jupiter has been cleared from Europa'
      );
    });

    test('#update tracks refs and clears them from hasMany relationships when a referenced record is removed', async function (assert) {
      const io: InitializedRecord = {
        type: 'moon',
        id: 'm1',
        attributes: { name: 'Io' },
        relationships: { planet: { data: null } }
      };
      const europa: InitializedRecord = {
        type: 'moon',
        id: 'm2',
        attributes: { name: 'Europa' },
        relationships: { planet: { data: null } }
      };
      const jupiter: InitializedRecord = {
        type: 'planet',
        id: 'p1',
        attributes: { name: 'Jupiter' },
        relationships: {
          moons: {
            data: [
              { type: 'moon', id: 'm1' },
              { type: 'moon', id: 'm2' }
            ]
          }
        }
      };

      await cache.update((t) => [
        t.addRecord(io),
        t.addRecord(europa),
        t.addRecord(jupiter)
      ]);

      assert.deepEqual(
        ((await cache.getRecordAsync({
          type: 'planet',
          id: 'p1'
        })) as InitializedRecord)?.relationships?.moons.data,
        [
          { type: 'moon', id: 'm1' },
          { type: 'moon', id: 'm2' }
        ],
        'Jupiter has been assigned to Io and Europa'
      );
      assert.deepEqual(
        await cache.getRelatedRecordsAsync(jupiter, 'moons'),
        [
          { type: 'moon', id: 'm1' },
          { type: 'moon', id: 'm2' }
        ],
        'Jupiter has been assigned to Io and Europa'
      );

      await cache.update((t) => t.removeRecord(io));

      assert.equal(
        await cache.getRecordAsync({ type: 'moon', id: 'm1' }),
        null,
        'Io is GONE'
      );

      await cache.update((t) => t.removeRecord(europa));

      assert.equal(
        await cache.getRecordAsync({ type: 'moon', id: 'm2' }),
        null,
        'Europa is GONE'
      );

      assert.deepEqual(
        await cache.getRelatedRecordsAsync(
          { type: 'planet', id: 'p1' },
          'moons'
        ),
        [],
        'moons have been cleared from Jupiter'
      );
    });
  });

  module('migrated schema', function (hooks) {
    hooks.beforeEach(async () => {
      keyMap = new RecordKeyMap();

      // v1 of schema
      schema = new RecordSchema({
        version: 1,
        models: {}
      });
      cache = new IndexedDBCache({
        schema,
        keyMap
      });
      await cache.openDB();
      await cache.closeDB();

      // v2 of schema
      schema = new RecordSchema({
        version: 2,
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
      cache = new IndexedDBCache({
        keyMap,
        schema
      });

      await cache.openDB();
    });

    hooks.afterEach(() => {
      return cache.deleteDB();
    });

    test('it exists', function (assert) {
      assert.ok(cache);
      assert.strictEqual(cache.schema, schema, 'schema has been assigned');
      assert.strictEqual(cache.keyMap, keyMap, 'keyMap has been assigned');
    });

    test('sets/gets records individually', async function (assert) {
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

      await cache.setRecordAsync(jupiter);
      await cache.setRecordAsync(io);
      await cache.setRecordAsync(europa);

      assert.deepEqual(await cache.getRecordAsync(jupiter), jupiter);
      assert.deepEqual(await cache.getRecordAsync(io), io);
      assert.deepEqual(await cache.getRecordAsync(europa), europa);

      await cache.removeRecordAsync(jupiter);
      await cache.removeRecordAsync(io);
      await cache.removeRecordAsync(europa);

      assert.deepEqual(await cache.getRecordAsync(jupiter), undefined);
      assert.deepEqual(await cache.getRecordAsync(io), undefined);
      assert.deepEqual(await cache.getRecordAsync(europa), undefined);
    });
  });
});
