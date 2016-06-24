import Source from 'orbit/source';
import Schema from 'orbit-common/schema';
import KeyMap from 'orbit-common/key-map';
import Store from 'orbit-common/store';
import qb from 'orbit-common/query/builder';
import CacheIntegrityProcessor from 'orbit-common/cache/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from 'orbit-common/cache/operation-processors/schema-consistency-processor';
import {
  addRecord
} from 'orbit-common/transform/operators';

const schemaDefinition = {
  models: {
    star: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planets: { type: 'hasMany', model: 'planet', inverse: 'star' }
      }
    },
    planet: {
      attributes: {
        name: { type: 'string' },
        classification: { type: 'string' }
      },
      relationships: {
        moons: { type: 'hasMany', model: 'moon', inverse: 'planet' },
        star: { type: 'hasOne', model: 'star', inverse: 'planets' }
      }
    },
    moon: {
      attributes: {
        name: { type: 'string' }
      },
      relationships: {
        planet: { type: 'hasOne', model: 'planet', inverse: 'moons' }
      }
    }
  }
};

const schema = new Schema(schemaDefinition);

module('OC - Store', function(hooks) {
  let store, keyMap;

  hooks.beforeEach(function() {
    keyMap = new KeyMap();
    store = new Store({ schema, keyMap });
  });

  test('its prototype chain is correct', function(assert) {
    assert.ok(store instanceof Source, 'instanceof Source');
  });

  test('implements Queryable', function(assert) {
    assert.ok(store._queryable, 'implements Queryable');
    assert.ok(typeof store.query === 'function', 'has `query` method');
  });

  test('implements Updatable', function(assert) {
    assert.ok(store._updatable, 'implements Updatable');
    assert.ok(typeof store.update === 'function', 'has `update` method');
  });

  test('internal cache\'s options can be specified with `cacheOptions`', function() {
    var store = new Store({ schema, keyMap, cacheOptions: { processors: [CacheIntegrityProcessor, SchemaConsistencyProcessor] } });
    ok(store.cache, 'cache exists');
    equal(store.cache._processors.length, 2, 'cache has 2 processors');
  });

  test('#update - transforms the store\'s cache', function(assert) {
    assert.expect(3);

    const jupiter = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    assert.equal(store.cache.length('planet'), 0, 'cache should start empty');

    return store.update(addRecord(jupiter))
      .then(() => {
        assert.equal(store.cache.length('planet'), 1, 'cache should contain one planet');
        assert.deepEqual(store.cache.get('planet/jupiter'), jupiter, 'planet should be jupiter');
      });
  });

  test('#query - queries the store\'s cache', function(assert) {
    assert.expect(2);

    let jupiter = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    store.cache.reset({
      planet: {
        jupiter
      }
    });

    assert.equal(store.cache.length('planet'), 1, 'cache should contain one planet');

    return store.query(qb.record({ type: 'planet', id: 'jupiter' }))
      .then(foundPlanet => {
        assert.deepEqual(foundPlanet, jupiter, 'found planet matches original');
      });
  });

  test('#liveQuery - invokes `query()` and then returns `cache.liveQuery()`', function(assert) {
    const done = assert.async();

    const jupiter = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter' }
    };

    const pluto = {
      type: 'planet',
      id: 'pluto',
      attributes: { name: 'Pluto' }
    };

    store.cache.reset({
      planet: {
        jupiter,
        pluto
      }
    });

    const liveQuery = store.liveQuery(qb.records('planet'));

    liveQuery.take(2).toArray().subscribe(operations => {
      assert.deepEqual(operations[0], { op: 'addRecord', record: jupiter });
      assert.deepEqual(operations[1], { op: 'addRecord', record: pluto });
      done();
    });
  });
});
