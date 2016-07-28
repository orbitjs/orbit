import Source from 'orbit-common/source';
import Schema from 'orbit-common/schema';
import KeyMap from 'orbit-common/key-map';
import Store from 'orbit-common/store';
import qb from 'orbit-common/query/builder';
import CacheIntegrityProcessor from 'orbit-common/cache/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from 'orbit-common/cache/operation-processors/schema-consistency-processor';
import {
  addRecord
} from 'orbit-common/transform/operators';
import Transform from 'orbit/transform';
import { identity } from 'orbit-common/lib/identifiers';
import { all } from 'rsvp';

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

  test('#transformsSince - returns all transforms since a specified transformId', function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };

    const addRecordATransform = new Transform(addRecord(recordA));
    const addRecordBTransform = new Transform(addRecord(recordB));
    const addRecordCTransform = new Transform(addRecord(recordC));

    return all([
      store.pick(addRecordATransform),
      store.pick(addRecordBTransform),
      store.pick(addRecordCTransform)
    ])
      .then(() => {
        assert.deepEqual(
          store.transformsSince(addRecordATransform.id),
          [
            addRecordBTransform,
            addRecordCTransform
          ],
          'returns transforms since the specified transform'
        );
      });
  });

  test('#allTransforms - returns all tracked transforms', function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };

    const addRecordATransform = new Transform(addRecord(recordA));
    const addRecordBTransform = new Transform(addRecord(recordB));
    const addRecordCTransform = new Transform(addRecord(recordC));

    return all([
      store.pick(addRecordATransform),
      store.pick(addRecordBTransform),
      store.pick(addRecordCTransform)
    ])
      .then(() => {
        assert.deepEqual(
          store.allTransforms(),
          [
            addRecordATransform,
            addRecordBTransform,
            addRecordCTransform
          ],
          'tracks transforms in correct order'
        );
      });
  });

  test('#truncateHistory - clears transforms from log as well as tracked transforms before a specified transform', function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };

    const addRecordATransform = new Transform(addRecord(recordA));
    const addRecordBTransform = new Transform(addRecord(recordB));
    const addRecordCTransform = new Transform(addRecord(recordC));

    return all([
      store.pick(addRecordATransform),
      store.pick(addRecordBTransform),
      store.pick(addRecordCTransform)
    ])
      .then(() => {
        store.truncateHistory(addRecordBTransform.id);

        assert.deepEqual(
          store.allTransforms(),
          [
            addRecordBTransform,
            addRecordCTransform
          ],
          'remaining transforms are in correct order'
        );
      });
  });

  test('#clearHistory - clears all transforms from log as well as tracked transforms', function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };

    const addRecordATransform = new Transform(addRecord(recordA));
    const addRecordBTransform = new Transform(addRecord(recordB));
    const addRecordCTransform = new Transform(addRecord(recordC));

    return all([
      store.pick(addRecordATransform),
      store.pick(addRecordBTransform),
      store.pick(addRecordCTransform)
    ])
      .then(() => {
        store.clearHistory();

        assert.deepEqual(
          store.allTransforms(),
          [],
          'no transforms remain in history'
        );
      });
  });

  test('#fork - creates a new store that starts with the same schema, keyMap, and cache contents as the base store', function(assert) {
    const jupiter = { type: 'planet', id: 'jupiter-id', attributes: { name: 'Jupiter', classification: 'gas giant' } };

    return store.update(addRecord(jupiter))
      .then(() => {
        assert.deepEqual(store.cache.get(['planet', 'jupiter-id']), jupiter, 'verify store data');

        const fork = store.fork();

        assert.deepEqual(fork.cache.get(['planet', 'jupiter-id']), jupiter, 'data in fork matches data in store');
        assert.strictEqual(store.schema, fork.schema, 'schema matches');
        assert.strictEqual(store.keyMap, fork.keyMap, 'keyMap matches');
      });
  });

  test('#merge - merges transforms from a forked store back into a base store', function(assert) {
    const jupiter = { type: 'planet', id: 'jupiter-id', attributes: { name: 'Jupiter', classification: 'gas giant' } };

    let fork = store.fork();

    return fork.update(addRecord(jupiter))
      .then(() => {
        assert.deepEqual(fork.cache.get(['planet', 'jupiter-id']), jupiter, 'verify fork data');
        return store.merge(fork);
      })
      .then(() => {
        assert.deepEqual(store.cache.get(['planet', 'jupiter-id']), jupiter, 'data in store matches data in fork');
      });
  });

  test('#rollback - rolls back transform log and replays transform inverses against the cache', function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };
    const recordD = { id: 'neptune', type: 'planet', attributes: { name: 'Neptune' } };
    const recordE = { id: 'uranus', type: 'planet', attributes: { name: 'Uranus' } };

    const addRecordATransform = Transform.from(addRecord(recordA));
    const addRecordBTransform = Transform.from(addRecord(recordB));
    const addRecordCTransform = Transform.from(addRecord(recordC));

    return all([
      store.pick(addRecordATransform),
      store.pick(addRecordBTransform),
      store.pick(addRecordCTransform),
      store.pick(Transform.from([
        addRecord(recordD),
        addRecord(recordE)
      ]))
    ])
      .then(() => {
        const rollbackOperations = [];
        store.cache.on('patch', (operation) => rollbackOperations.push(operation));

        store.rollback(addRecordATransform.id);

        assert.deepEqual(
          rollbackOperations,
          [
            { op: 'removeRecord', record: identity(recordE) },
            { op: 'removeRecord', record: identity(recordD) },
            { op: 'removeRecord', record: identity(recordC) },
            { op: 'removeRecord', record: identity(recordB) }
          ],
          'emits inverse operations in correct order'
        );

        equal(store.transformLog.head(), addRecordATransform.id, 'rolls back transform log');
      });
  });
});
