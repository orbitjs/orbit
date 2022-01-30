import {
  getRecordFromLocalStorage,
  isLocalStorageEmpty
} from './support/local-storage';
import { Orbit } from '@orbit/core';
import { buildTransform } from '@orbit/data';
import {
  AddRecordOperation,
  InitializedRecord,
  RecordSchema,
  RecordSource,
  RecordKeyMap
} from '@orbit/records';
import { LocalStorageSource } from '../src/local-storage-source';
import { LocalStorageCache } from '../src/local-storage-cache';

const { module, test } = QUnit;

module('LocalStorageSource', function (hooks) {
  let schema: RecordSchema, source: LocalStorageSource, keyMap: RecordKeyMap;

  hooks.beforeEach(() => {
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
            moons: { kind: 'hasMany', type: 'moon' },
            solarSystem: { kind: 'hasMany', type: 'solarSystem' }
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

    keyMap = new RecordKeyMap();

    source = new LocalStorageSource({ schema, keyMap });
  });

  hooks.afterEach(() => {
    return source.reset().then(() => {
      Orbit.globals.localStorage.removeItem('orbit-bucket/foo');
    });
  });

  test('it exists', function (assert) {
    assert.ok(source);
    assert.strictEqual(source.schema, schema, 'schema has been assigned');
    assert.strictEqual(source.keyMap, keyMap, 'keyMap has been assigned');
  });

  test('its prototype chain is correct', function (assert) {
    assert.ok(source instanceof RecordSource, 'instanceof Source');
  });

  test('is assigned a default namespace and delimiter', function (assert) {
    assert.equal(source.namespace, 'orbit', 'namespace is `orbit` by default');
    assert.equal(source.delimiter, '/', 'delimiter is `/` by default');
  });

  test('can be assigned a custom `cacheClass`', function (assert) {
    class CustomCache extends LocalStorageCache {
      custom = true;
    }

    source = new LocalStorageSource({
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
    source = new LocalStorageSource({
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
    const source = new LocalStorageSource({
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
    const source = new LocalStorageSource({
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

  test('#getKeyForRecord returns the local storage key that will be used for a record', function (assert) {
    assert.equal(
      source.getKeyForRecord({ type: 'planet', id: 'jupiter' }),
      'orbit/planet/jupiter'
    );
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

    await source.update((t) => t.addRecord(planet));
    assert.deepEqual(
      getRecordFromLocalStorage(source, planet),
      planet,
      'local storage contains record'
    );

    source = new LocalStorageSource({ schema, keyMap });
    assert.deepEqual(
      getRecordFromLocalStorage(source, planet),
      planet,
      'local storage still contains record'
    );
  });

  test('#sync - addRecord', async function (assert) {
    assert.expect(3);

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

    const t = buildTransform({
      op: 'addRecord',
      record: planet
    } as AddRecordOperation);

    await source.sync(t);

    assert.ok(source.transformLog.contains(t.id), 'log contains transform');
    assert.deepEqual(
      getRecordFromLocalStorage(source, planet),
      planet,
      'local storage contains record'
    );
    assert.equal(
      keyMap.keyToId('planet', 'remoteId', 'j'),
      'jupiter',
      'key has been mapped'
    );
  });

  test('#reset - clears records for source', async function (assert) {
    assert.expect(2);

    let planet = {
      type: 'planet',
      id: 'jupiter'
    };

    await source.push((t) => t.addRecord(planet));

    assert.deepEqual(
      getRecordFromLocalStorage(source, planet),
      planet,
      'local storage contains record'
    );

    await source.reset();

    assert.ok(isLocalStorageEmpty(source), 'local storage is empty');
  });

  test('#reset - ignores local-storage-bucket entries', async function (assert) {
    assert.expect(2);

    let planet = {
      type: 'planet',
      id: 'jupiter'
    };

    await source.push((t) => t.addRecord(planet));

    Orbit.globals.localStorage.setItem('orbit-bucket/foo', '{}');

    await source.reset();

    assert.ok(isLocalStorageEmpty(source), 'local storage is empty');

    assert.equal(Orbit.globals.localStorage.getItem('orbit-bucket/foo'), '{}');
  });
});
