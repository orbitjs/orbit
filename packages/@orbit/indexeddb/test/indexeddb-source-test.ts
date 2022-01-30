import { buildTransform } from '@orbit/data';
import {
  AddRecordOperation,
  InitializedRecord,
  RecordKeyMap,
  RecordSchema
} from '@orbit/records';
import { IndexedDBCache } from '../src';
import { IndexedDBSource } from '../src/indexeddb-source';
import { getRecordFromIndexedDB } from './support/indexeddb';

const { module, test } = QUnit;

module('IndexedDBSource', function (hooks) {
  let schema: RecordSchema, source: IndexedDBSource, keyMap: RecordKeyMap;

  hooks.beforeEach(async () => {
    schema = new RecordSchema({
      models: {
        planet: {
          keys: { remoteId: {} },
          attributes: {
            name: { type: 'string' },
            classification: { type: 'string' },
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
  });

  test('it exists', function (assert) {
    source = new IndexedDBSource({ schema, keyMap, autoActivate: false });
    assert.ok(source);
    assert.strictEqual(source.schema, schema, 'schema has been assigned');
    assert.strictEqual(source.keyMap, keyMap, 'keyMap has been assigned');
  });

  test('is assigned a default dbName', function (assert) {
    source = new IndexedDBSource({ schema, keyMap, autoActivate: false });
    assert.equal(
      source.cache.dbName,
      'orbit',
      '`dbName` is `orbit` by default'
    );
  });

  test('can be assigned a custom `cacheClass`', function (assert) {
    class CustomCache extends IndexedDBCache {
      custom = true;
    }

    source = new IndexedDBSource({
      schema,
      autoActivate: false,
      cacheClass: CustomCache
    });
    assert.ok(
      (source.cache as CustomCache).custom,
      'custom cacheClass has been instantiated'
    );
  });

  test('shares its `transformBuilder` and `queryBuilder` with its cache', function (assert) {
    source = new IndexedDBSource({ schema, keyMap, autoActivate: false });
    assert.strictEqual(
      source.cache.transformBuilder,
      source.transformBuilder,
      'transformBuilder is shared'
    );
    assert.strictEqual(
      source.cache.queryBuilder,
      source.queryBuilder,
      'queryBuilder is shared'
    );
  });

  test('shares its `defaultTransformOptions` and `defaultQueryOptions` with its cache', function (assert) {
    source = new IndexedDBSource({
      schema,
      keyMap,
      autoActivate: false,
      defaultQueryOptions: {
        a: 1
      },
      defaultTransformOptions: {
        b: 1
      }
    });

    assert.strictEqual(
      source.cache.defaultTransformOptions,
      source.defaultTransformOptions,
      'defaultTransformOptions are shared'
    );
    assert.strictEqual(
      source.cache.defaultTransformOptions?.b,
      1,
      'cache.defaultTransformOptions are correct'
    );
    assert.strictEqual(
      source.cache.defaultQueryOptions,
      source.defaultQueryOptions,
      'defaultQueryOptions are shared'
    );
    assert.strictEqual(
      source.cache.defaultQueryOptions?.a,
      1,
      'cache.defaultQueryOptions are correct'
    );

    let newQueryOptions = {
      a: 2
    };
    source.defaultQueryOptions = newQueryOptions;
    assert.strictEqual(
      source.defaultQueryOptions?.a,
      2,
      'defaultQueryOptions are correct'
    );
    assert.strictEqual(
      source.cache.defaultQueryOptions,
      source.defaultQueryOptions,
      'updated defaultQueryOptions are shared'
    );

    let newTransformOptions = {
      b: 2
    };
    source.defaultTransformOptions = newTransformOptions;
    assert.strictEqual(
      source.cache.defaultTransformOptions,
      source.defaultTransformOptions,
      'updated defaultTransformOptions are shared'
    );
    assert.strictEqual(
      source.cache.defaultTransformOptions?.b,
      2,
      'updated cache.defaultTransformOptions are correct'
    );
  });

  test('shares its `validatorFor` with its cache', function (assert) {
    const source = new IndexedDBSource({
      schema,
      keyMap,
      autoActivate: false
    });
    assert.strictEqual(
      source.cache.validatorFor,
      source.validatorFor,
      'validatorFor is shared'
    );
  });

  test('will not create a `validatorFor` fn if `autoValidate: false`', function (assert) {
    const source = new IndexedDBSource({
      schema,
      keyMap,
      autoActivate: false,
      autoValidate: false
    });
    assert.strictEqual(
      source.validatorFor,
      undefined,
      'validatorFor is undefined'
    );
    assert.strictEqual(
      source.cache.validatorFor,
      undefined,
      'cache.validatorFor is undefined'
    );
  });

  module('activated', function (hooks) {
    hooks.beforeEach(async () => {
      source = new IndexedDBSource({ schema, keyMap });
      await source.activated;
    });

    hooks.afterEach(async () => {
      await source.deactivate();
      await source.cache.deleteDB();
    });

    test('will reopen the database when the schema is upgraded', async function (assert) {
      assert.expect(5);

      assert.equal(source.cache.dbVersion, 1, 'db starts with version == 1');

      source.cache.migrateDB = function (db, event) {
        assert.equal(
          event.oldVersion,
          1,
          'migrateDB called with oldVersion == 1'
        );
        assert.equal(
          event.newVersion,
          2,
          'migrateDB called with newVersion == 2'
        );
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

    test('#reset is idempotent', async function (assert) {
      await source.cache.openDB();
      await source.reset();
      await source.reset();
      await source.cache.openDB();

      assert.ok(true, 'db has been reset twice and can still be reopened');
    });

    test('data persists across re-instantiating source', async function (assert) {
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

      await source.push((t) => t.addRecord(planet));
      assert.deepEqual(
        await getRecordFromIndexedDB(source.cache, planet),
        planet,
        'indexeddb contains record'
      );

      await source.deactivate();

      source = new IndexedDBSource({ schema, keyMap });
      await source.activated;

      assert.deepEqual(
        await getRecordFromIndexedDB(source.cache, planet),
        planet,
        'indexeddb still contains record'
      );
    });

    test('#sync - addRecord', async function (assert) {
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

      await source.sync(t);

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
  });
});
