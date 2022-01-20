import { Orbit } from '@orbit/core';
import {
  InitializedRecord,
  RecordKeyMap,
  RecordQuery,
  RecordQueryExpression,
  RecordSchema
} from '@orbit/records';
import { LocalStorageSource } from '../src/local-storage-source';

const { module, test } = QUnit;

module('LocalStorageSource - queryable', function (hooks) {
  let schema: RecordSchema, source: LocalStorageSource, keyMap: RecordKeyMap;

  hooks.beforeEach(() => {
    schema = new RecordSchema({
      models: {
        star: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planets: { kind: 'hasMany', type: 'planet', inverse: 'star' }
          }
        },
        planet: {
          attributes: {
            name: { type: 'string' },
            classification: { type: 'string' }
          },
          relationships: {
            moons: { kind: 'hasMany', type: 'moon', inverse: 'planet' },
            star: { kind: 'hasOne', type: 'star', inverse: 'planets' }
          }
        },
        moon: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            planet: { kind: 'hasOne', type: 'planet', inverse: 'moons' }
          }
        },
        binaryStar: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            starOne: { kind: 'hasOne', type: 'star' },
            starTwo: { kind: 'hasOne', type: 'star' }
          }
        },
        planetarySystem: {
          attributes: {
            name: { type: 'string' }
          },
          relationships: {
            star: { kind: 'hasOne', type: ['star', 'binaryStar'] },
            bodies: { kind: 'hasMany', type: ['planet', 'moon'] }
          }
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

  test("#query - queries the source's cache", async function (assert) {
    assert.expect(2);

    const source = new LocalStorageSource({ schema, keyMap });

    let jupiter = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    source.cache.update((t) => t.addRecord(jupiter));

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      1,
      'cache should contain one planet'
    );

    let planet = await source.query((q) =>
      q.findRecord({ type: 'planet', id: 'jupiter' })
    );

    assert.deepEqual(planet, jupiter, 'found planet matches original');
  });

  test('#query - findRecord accepts hints that can influence results', async function (assert) {
    assert.expect(2);

    const source = new LocalStorageSource({ schema, keyMap });

    let jupiter2 = {
      id: 'jupiter2',
      type: 'planet',
      attributes: { name: 'Jupiter2', classification: 'gas giant' }
    };

    source.on('beforeQuery', (query: RecordQuery, hints: any) => {
      hints.data = jupiter2;
    });

    source.cache.update((t) => t.addRecord(jupiter2));

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      1,
      'cache should contain one planet'
    );

    let planet = await source.query((q) =>
      q.findRecord({ type: 'planet', id: 'jupiter' })
    );

    assert.deepEqual(planet, jupiter2, 'found planet matches hinted record');
  });

  test('#query - findRecords accepts hints that can influence results', async function (assert) {
    assert.expect(2);

    const source = new LocalStorageSource({ schema, keyMap });

    let jupiter = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    let earth = {
      id: 'earth',
      type: 'planet',
      attributes: { name: 'Earth' }
    };

    let uranus = {
      id: 'uranus',
      type: 'planet',
      attributes: { name: 'Uranus' }
    };

    source.on('beforeQuery', (query: RecordQuery, hints: any) => {
      if (query.options?.sources?.remote.customFilter === 'distantPlanets') {
        hints.data = [
          { type: 'planet', id: 'uranus' },
          { type: 'planet', id: 'jupiter' }
        ];
      }
    });

    source.cache.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(uranus)
    ]);

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      3,
      'cache should contain three planets'
    );

    let distantPlanets = await source.query((q) => q.findRecords('planet'), {
      sources: {
        remote: {
          customFilter: 'distantPlanets' // custom remote-only filter
        }
      }
    });

    assert.deepEqual(
      distantPlanets,
      [uranus, jupiter],
      'planets match hinted records'
    );
  });

  test('#query - catches errors', async function (assert) {
    assert.expect(2);

    const source = new LocalStorageSource({ schema, keyMap });

    source.cache.reset();

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      0,
      'cache should contain no planets'
    );

    try {
      await source.query(
        (q) => q.findRecord({ type: 'planet', id: 'jupiter' }),
        { raiseNotFoundExceptions: true }
      );
    } catch (e) {
      assert.equal((e as Error).message, 'Record not found: planet:jupiter');
    }
  });

  test('#query - can query with multiple expressions', async function (assert) {
    const source = new LocalStorageSource({ schema, keyMap });
    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter'
      }
    };
    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: {
        name: 'Earth'
      }
    };
    await source.update((t) => [t.addRecord(jupiter), t.addRecord(earth)]);

    assert.deepEqual(
      await source.query((q) => [
        q.findRecord({ type: 'planet', id: 'jupiter' }),
        q.findRecord({ type: 'planet', id: 'fake' }),
        q.findRecords('planet').sort('name')
      ]),
      [jupiter, undefined, [earth, jupiter]]
    );
  });
});
