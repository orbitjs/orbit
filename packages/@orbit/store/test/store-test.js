import {
  addRecord,
  cloneRecordIdentity as identity,
  KeyMap,
  QueryBuilder as qb,
  Schema,
  Source,
  Transform
} from '@orbit/core';
import Store from '../src/store';
import CacheIntegrityProcessor from '../src/cache/operation-processors/cache-integrity-processor';
import SchemaConsistencyProcessor from '../src/cache/operation-processors/schema-consistency-processor';
import { all } from 'rsvp';

const { module, test } = QUnit;

module('Store', function(hooks) {
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

  let store, keyMap;

  hooks.beforeEach(function() {
    keyMap = new KeyMap();
    store = new Store({ schema, keyMap });
  });

  test('its prototype chain is correct', function(assert) {
    assert.ok(store instanceof Source, 'instanceof Source');
  });

  test('internal cache\'s options can be specified with `cacheOptions`', function(assert) {
    var store = new Store({ schema, keyMap, cacheOptions: { processors: [CacheIntegrityProcessor, SchemaConsistencyProcessor] } });
    assert.ok(store.cache, 'cache exists');
    assert.equal(store.cache._processors.length, 2, 'cache has 2 processors');
  });

  test('#update - transforms the store\'s cache', function(assert) {
    assert.expect(3);

    const jupiter = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    assert.equal(store.cache.records('planet').length, 0, 'cache should start empty');

    return store.update(addRecord(jupiter))
      .then(() => {
        assert.equal(store.cache.records('planet').length, 1, 'cache should contain one planet');
        assert.deepEqual(store.cache.records('planet').get('jupiter'), jupiter, 'planet should be jupiter');
      });
  });

  test('#query - queries the store\'s cache', function(assert) {
    assert.expect(2);

    let jupiter = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    store.cache.patch(addRecord(jupiter));

    assert.equal(store.cache.records('planet').length, 1, 'cache should contain one planet');

    return store.query(qb.record({ type: 'planet', id: 'jupiter' }))
      .then(foundPlanet => {
        assert.deepEqual(foundPlanet, jupiter, 'found planet matches original');
      });
  });

  test('#query - catches errors', function(assert) {
    assert.expect(2);

    store.cache.reset();

    assert.equal(store.cache.records('planet').length, 0, 'cache should contain no planets');

    return store.query(qb.record({ type: 'planet', id: 'jupiter' }))
      .catch(e => {
        assert.equal(e.message, 'Record not found: planet:jupiter');
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
      store.sync(addRecordATransform),
      store.sync(addRecordBTransform),
      store.sync(addRecordCTransform)
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
      store.sync(addRecordATransform),
      store.sync(addRecordBTransform),
      store.sync(addRecordCTransform)
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

  test('transformLog.truncate - clears transforms from log as well as tracked transforms before a specified transform', function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };

    const addRecordATransform = new Transform(addRecord(recordA));
    const addRecordBTransform = new Transform(addRecord(recordB));
    const addRecordCTransform = new Transform(addRecord(recordC));

    return all([
      store.sync(addRecordATransform),
      store.sync(addRecordBTransform),
      store.sync(addRecordCTransform)
    ])
      .then(() => {
        return store.transformLog.truncate(addRecordBTransform.id);
      })
      .then(() => {
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

  test('transformLog.clear - clears all transforms from log as well as tracked transforms', function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };

    const addRecordATransform = new Transform(addRecord(recordA));
    const addRecordBTransform = new Transform(addRecord(recordB));
    const addRecordCTransform = new Transform(addRecord(recordC));

    return all([
      store.sync(addRecordATransform),
      store.sync(addRecordBTransform),
      store.sync(addRecordCTransform)
    ])
      .then(() => store.transformLog.clear())
      .then(() => {
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
        assert.deepEqual(store.cache.records('planet').get('jupiter-id'), jupiter, 'verify store data');

        const fork = store.fork();

        assert.deepEqual(fork.cache.records('planet').get('jupiter-id'), jupiter, 'data in fork matches data in store');
        assert.strictEqual(store.schema, fork.schema, 'schema matches');
        assert.strictEqual(store.keyMap, fork.keyMap, 'keyMap matches');
      });
  });

  test('#merge - merges transforms from a forked store back into a base store', function(assert) {
    const jupiter = { type: 'planet', id: 'jupiter-id', attributes: { name: 'Jupiter', classification: 'gas giant' } };

    let fork = store.fork();

    return fork.update(addRecord(jupiter))
      .then(() => {
        assert.deepEqual(fork.cache.records('planet').get('jupiter-id'), jupiter, 'verify fork data');
        return store.merge(fork);
      })
      .then(() => {
        assert.deepEqual(store.cache.records('planet').get('jupiter-id'), jupiter, 'data in store matches data in fork');
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

    const rollbackOperations = [];

    return all([
      store.sync(addRecordATransform),
      store.sync(addRecordBTransform),
      store.sync(addRecordCTransform),
      store.sync(Transform.from([
        addRecord(recordD),
        addRecord(recordE)
      ]))
    ])
      .then(() => {
        store.cache.on('patch', (operation) => rollbackOperations.push(operation));
        return store.rollback(addRecordATransform.id);
      })
      .then(() => {
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

        assert.equal(store.transformLog.head, addRecordATransform.id, 'rolls back transform log');
      });
  });
});
