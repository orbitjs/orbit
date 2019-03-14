import {
  cloneRecordIdentity as identity,
  KeyMap,
  Query,
  Record,
  Schema,
  SchemaSettings,
  Source,
  buildTransform,
  RecordOperation
} from '@orbit/data';
import { clone } from '@orbit/utils';
import {
  SyncCacheIntegrityProcessor,
  SyncSchemaConsistencyProcessor
} from '@orbit/record-cache';
import Store from '../src/index';

declare const RSVP: any;

const { all } = RSVP;
const { module, test } = QUnit;

module('Store', function(hooks) {
  const schemaDefinition: SchemaSettings = {
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

  let store: Store;
  let keyMap: KeyMap;

  hooks.beforeEach(function() {
    keyMap = new KeyMap();
    store = new Store({ schema, keyMap });
  });

  test('its prototype chain is correct', function(assert) {
    assert.ok(store instanceof Source, 'instanceof Source');
  });

  test('internal cache\'s settings can be specified with `cacheSettings`', function(assert) {
    let store = new Store({ schema, keyMap, cacheSettings: { processors: [SyncCacheIntegrityProcessor, SyncSchemaConsistencyProcessor] } });
    let cache = store.cache as any;

    assert.ok(cache, 'cache exists');
    assert.equal(cache._processors.length, 2, 'cache has 2 processors');
  });

  test('automatically shares its `transformBuilder` and `queryBuilder` with its cache', function(assert) {
    assert.strictEqual(store.cache.transformBuilder, store.transformBuilder, 'transformBuilder is shared');
    assert.strictEqual(store.cache.queryBuilder, store.queryBuilder, 'queryBuilder is shared');
  });

  test('#update - transforms the store\'s cache', async function(assert) {
    assert.expect(4);

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    assert.equal(store.cache.getRecordsSync('planet').length, 0, 'cache should start empty');

    let record = await store.update(t => t.addRecord(jupiter));

    assert.equal(store.cache.getRecordsSync('planet').length, 1, 'cache should contain one planet');
    assert.deepEqual(store.cache.getRecordSync({ type: 'planet', id: 'jupiter' }), jupiter, 'planet should be jupiter');
    assert.strictEqual(record, jupiter, 'result should be returned');
  });

  test('#update - can perform multiple operations and return the results', async function(assert) {
    assert.expect(3);

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    const earth: Record = {
      type: 'planet',
      id: 'earth',
      attributes: { name: 'Earth', classification: 'terrestrial' }
    }

    assert.equal(store.cache.getRecordsSync('planet').length, 0, 'cache should start empty');

    let records = await store.update(t => [t.addRecord(jupiter), t.addRecord(earth)]);

    assert.equal(store.cache.getRecordsSync('planet').length, 2, 'cache should contain two planets');
    assert.deepEqual(records, [ jupiter, earth ], 'results array should be returned');
  });

  test('#query - queries the store\'s cache', async function(assert) {
    assert.expect(2);

    let jupiter = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    store.cache.patch(t => t.addRecord(jupiter));

    assert.equal(store.cache.getRecordsSync('planet').length, 1, 'cache should contain one planet');

    let planet = await store.query(q => q.findRecord({ type: 'planet', id: 'jupiter' }));

    assert.deepEqual(planet, jupiter, 'found planet matches original');
  });

  test('#query - findRecord accepts hints that can influence results', async function(assert) {
    assert.expect(2);

    let jupiter2 = {
      id: 'jupiter2',
      type: 'planet',
      attributes: { name: 'Jupiter2', classification: 'gas giant' }
    };

    store.on('beforeQuery', (query: Query, hints: any) => {
      if (query.expression.op === 'findRecord') {
        hints.data = jupiter2;
      }
    });

    store.cache.patch(t => t.addRecord(jupiter2));

    assert.equal(store.cache.getRecordsSync('planet').length, 1, 'cache should contain one planet');

    let planet = await store.query(q => q.findRecord({ type: 'planet', id: 'jupiter' }));

    assert.deepEqual(planet, jupiter2, 'found planet matches hinted record');
  });

  test('#query - findRecords accepts hints that can influence results', async function(assert) {
    assert.expect(2);

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
    }

    store.on('beforeQuery', (query: Query, hints: any) => {
      if (query.expression.op === 'findRecords' &&
          query.options.sources.remote.customFilter === 'distantPlanets') {
        hints.data = [{ type: 'planet', id: 'uranus' }, { type: 'planet', id: 'jupiter'}];
      }
    });

    store.cache.patch(t => [
      t.addRecord(jupiter),
      t.addRecord(earth),
      t.addRecord(uranus)
    ]);

    assert.equal(store.cache.getRecordsSync('planet').length, 3, 'cache should contain three planets');

    let distantPlanets = await store.query(q => q.findRecords('planet'), {
      sources: {
        remote: {
          customFilter: 'distantPlanets' // custom remote-only filter
        }
      }
    });

    assert.deepEqual(distantPlanets, [uranus, jupiter] , 'planets match hinted records');
  });

  test('#query - catches errors', async function(assert) {
    assert.expect(2);

    store.cache.reset();

    assert.equal(store.cache.getRecordsSync('planet').length, 0, 'cache should contain no planets');

    try {
      await store.query(q => q.findRecord({ type: 'planet', id: 'jupiter' }));
    } catch(e) {
      assert.equal(e.message, 'Record not found: planet:jupiter');
    }
  });

  test('#getTransform - returns a particular transform given an id', async function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };

    const addRecordATransform = buildTransform(store.transformBuilder.addRecord(recordA));

    await store.sync(addRecordATransform);

    assert.strictEqual(store.getTransform(addRecordATransform.id), addRecordATransform);
  });

  test('#getInverseOperations - returns the inverse operations for a particular transform', async function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const addRecordATransform = buildTransform(store.transformBuilder.addRecord(recordA));

    await store.sync(addRecordATransform);

    assert.deepEqual(store.getInverseOperations(addRecordATransform.id), [
      { op: 'removeRecord', record: identity(recordA) }
    ]);
  });

  test('#transformsSince - returns all transforms since a specified transformId', async function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };
    const tb = store.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await store.sync(addRecordATransform);
    await store.sync(addRecordBTransform);
    await store.sync(addRecordCTransform);

    assert.deepEqual(
      store.transformsSince(addRecordATransform.id),
      [
        addRecordBTransform,
        addRecordCTransform
      ],
      'returns transforms since the specified transform'
    );
  });

  test('#allTransforms - returns all tracked transforms', async function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };
    const tb = store.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await store.sync(addRecordATransform);
    await store.sync(addRecordBTransform);
    await store.sync(addRecordCTransform);

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

  test('transformLog.truncate - clears transforms from log as well as tracked transforms before a specified transform', async function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };
    const tb = store.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await store.sync(addRecordATransform);
    await store.sync(addRecordBTransform);
    await store.sync(addRecordCTransform);

    await store.transformLog.truncate(addRecordBTransform.id);

    assert.deepEqual(
      store.allTransforms(),
      [
        addRecordBTransform,
        addRecordCTransform
      ],
      'remaining transforms are in correct order'
    );
  });

  test('transformLog.clear - clears all transforms from log as well as tracked transforms', async function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };
    const tb = store.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await store.sync(addRecordATransform);
    await store.sync(addRecordBTransform);
    await store.sync(addRecordCTransform);

    await store.transformLog.clear();

    assert.deepEqual(
      store.allTransforms(),
      [],
      'no transforms remain in history'
    );
  });

  test('#fork - creates a new store that starts with the same schema, keyMap, and cache contents as the base store', async function(assert) {
    const jupiter: Record = { type: 'planet', id: 'jupiter-id', attributes: { name: 'Jupiter', classification: 'gas giant' } };

    await store.update(t => t.addRecord(jupiter));

    assert.deepEqual(store.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }), jupiter, 'verify store data');

    const fork = store.fork();

    assert.deepEqual(fork.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }), jupiter, 'data in fork matches data in store');
    assert.strictEqual(store.schema, fork.schema, 'schema matches');
    assert.strictEqual(store.keyMap, fork.keyMap, 'keyMap matches');
    assert.strictEqual(store.transformBuilder, fork.transformBuilder, 'transformBuilder is shared');
    assert.strictEqual(store.queryBuilder, fork.queryBuilder, 'queryBuilder is shared');
    assert.strictEqual(fork.forkPoint, store.transformLog.head, 'forkPoint is set on the forked store');
    assert.strictEqual(fork.base, store, 'base store is set on the forked store');
  });

  test('#merge - merges transforms from a forked store back into a base store', async function(assert) {
    const jupiter: Record = { type: 'planet', id: 'jupiter-id', attributes: { name: 'Jupiter', classification: 'gas giant' } };

    let fork = store.fork();

    await fork.update(t => t.addRecord(jupiter));

    assert.deepEqual(fork.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }), jupiter, 'verify fork data');

    await store.merge(fork);

    assert.deepEqual(store.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }), jupiter, 'data in store matches data in fork');
  });

  test('#merge - can accept options that will be assigned to the resulting transform', async function(assert) {
    assert.expect(3);

    const jupiter: Record = { type: 'planet', id: 'jupiter-id', attributes: { name: 'Jupiter', classification: 'gas giant' } };

    let fork = store.fork();

    store.on('update', (transform) => {
      assert.equal(transform.options.label, 'Create Jupiter');
    });

    await fork.update(t => t.addRecord(jupiter));

    assert.deepEqual(fork.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }), jupiter, 'verify fork data');

    await store.merge(fork, { transformOptions: { label: 'Create Jupiter' }});

    assert.deepEqual(store.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }), jupiter, 'data in store matches data in fork');
  });

  test('#rebase - works with empty stores', function(assert) {
    assert.expect(1);

    let child = store.fork();
    child.rebase();

    assert.ok(true, 'no exception has been thrown');
  });

  test('#rebase - record ends up in child store', async function(assert) {
    assert.expect(3);

    const jupiter: Record = { type: 'planet', id: 'jupiter-id', attributes: { name: 'Jupiter', classification: 'gas giant' } };

    let child = store.fork();

    await store.update(t => t.addRecord(jupiter));

    assert.deepEqual(store.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }), jupiter, 'verify store data');
    assert.equal(child.cache.getRecordsSync('planet').length, 0, 'child store is still empty');

    child.rebase();

    assert.deepEqual(child.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }), jupiter, 'verify child data');
  });

  test('#rebase - maintains only unique transforms in fork', async function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };
    const recordD = { id: 'neptune', type: 'planet', attributes: { name: 'Neptune' } };
    const recordE = { id: 'uranus', type: 'planet', attributes: { name: 'Uranus' } };

    const tb = store.transformBuilder;
    const addRecordA = buildTransform(tb.addRecord(recordA));
    const addRecordB = buildTransform(tb.addRecord(recordB));
    const addRecordC = buildTransform(tb.addRecord(recordC));
    const addRecordD = buildTransform(tb.addRecord(recordD));
    const addRecordE = buildTransform(tb.addRecord(recordE));

    let fork;

    await all([
      store.update(addRecordA),
      store.update(addRecordB)
    ]);

    fork = store.fork();

    await all([
      fork.update(addRecordD),
      store.update(addRecordC),
      fork.update(addRecordE)
    ]);

    fork.rebase();

    assert.deepEqual(fork.allTransforms(), [addRecordD, addRecordE]);

    assert.deepEqual(fork.cache.getRecordSync(recordA), recordA);
    assert.deepEqual(fork.cache.getRecordSync(recordB), recordB);
    assert.deepEqual(fork.cache.getRecordSync(recordC), recordC);
    assert.deepEqual(fork.cache.getRecordSync(recordD), recordD);
    assert.deepEqual(fork.cache.getRecordSync(recordE), recordE);
    assert.deepEqual(fork.cache.getRecordsSync('planet').length, 5);
  });

  test('#rebase - rebase orders conflicting transforms in expected way', async function(assert) {
    assert.expect(6);

    const jupiter: Record = { type: 'planet', id: 'jupiter-id', attributes: { name: 'Jupiter', classification: 'gas giant' } };
    const id = { type: 'planet', id: 'jupiter-id' };

    let child: Store;

    // 1. fill store with some data
    await store.update(t => t.addRecord(jupiter));

    // 2. create a child store
    assert.deepEqual(store.cache.getRecordSync(id), jupiter, 'verify store data');
    child = store.fork();
    assert.deepEqual(child.cache.getRecordSync(id), jupiter, 'verify child data');

    // 3. update the child and the parent store (in any order)
    await child.update(t => t.replaceAttribute(id, 'name', 'The Gas Giant'));
    await store.update(t => t.replaceAttribute(id, 'name', 'Gassy Giant'));

    // 4. make sure updates were successful
    assert.equal(child.cache.getRecordSync(id).attributes.name, 'The Gas Giant');
    assert.equal(store.cache.getRecordSync(id).attributes.name, 'Gassy Giant');

    // 5. do the rebase
    child.rebase();

    assert.equal(child.cache.getRecordSync(id).attributes.name, 'The Gas Giant');
    assert.equal(store.cache.getRecordSync(id).attributes.name, 'Gassy Giant');
  });

  test('#rebase - calling rebase multiple times', async function(assert) {
    assert.expect(22);

    const jupiter: Record = { type: 'planet', id: 'jupiter-id', attributes: { name: 'Jupiter', classification: 'gas giant' } };
    const id = { type: 'planet', id: 'jupiter-id' };

    let child: Store;

    // 1. fill store with some data
    await store.update(t => t.addRecord(jupiter));
    // 2. create a child store
    assert.deepEqual(store.cache.getRecordSync(id), jupiter, 'verify store data');
    child = store.fork();
    assert.deepEqual(child.cache.getRecordSync(id), jupiter, 'verify child data');

    // 3. update the child and the parent store (in any order)
    await child.update(t => t.replaceAttribute(id, 'name', 'The Gas Giant'));
    await store.update(t => t.replaceAttribute(id, 'name', 'Gassy Giant'));
    // 4. make sure updates were successful
    assert.equal(child.cache.getRecordSync(id).attributes.name, 'The Gas Giant');
    assert.equal(store.cache.getRecordSync(id).attributes.name, 'Gassy Giant');

    // 5. do the rebase
    child.rebase();
    assert.equal(child.cache.getRecordSync(id).attributes.name, 'The Gas Giant');
    assert.equal(store.cache.getRecordSync(id).attributes.name, 'Gassy Giant');

    // 6. do a second update to the parent store
    assert.equal(store.cache.getRecordSync(id).attributes.classification, 'gas giant');
    await store.update(t => t.updateRecord({
      ...id,
      attributes: {
        name: 'Gassy Giant II',
        classification: 'gas giant II',
      }
    }));
    // 7. make sure updates were successful
    assert.equal(child.cache.getRecordSync(id).attributes.name, 'The Gas Giant');
    assert.equal(store.cache.getRecordSync(id).attributes.name, 'Gassy Giant II');
    assert.equal(store.cache.getRecordSync(id).attributes.classification, 'gas giant II');

    // 8. do the second rebase
    // make sure that changes from the child are still winning
    child.rebase();
    assert.equal(child.cache.getRecordSync(id).attributes.name, 'The Gas Giant');
    assert.equal(child.cache.getRecordSync(id).attributes.classification, 'gas giant II');
    assert.equal(store.cache.getRecordSync(id).attributes.name, 'Gassy Giant II');
    assert.equal(store.cache.getRecordSync(id).attributes.classification, 'gas giant II');

    // 9. update the parent store a third time
    await store.update(t => t.replaceAttribute(id, 'classification', 'gas giant III'));
    // 10. make sure updates were successful
    assert.equal(child.cache.getRecordSync(id).attributes.name, 'The Gas Giant');
    assert.equal(child.cache.getRecordSync(id).attributes.classification, 'gas giant II');
    assert.equal(store.cache.getRecordSync(id).attributes.name, 'Gassy Giant II');
    assert.equal(store.cache.getRecordSync(id).attributes.classification, 'gas giant III');

    // 11. do the third rebase
    // make sure that transforms from the parent are applied in correct order
    child.rebase();
    assert.equal(child.cache.getRecordSync(id).attributes.name, 'The Gas Giant');
    assert.equal(child.cache.getRecordSync(id).attributes.classification, 'gas giant III', 'classification has not been touched in child store => should be the same as in parent store');
    assert.equal(store.cache.getRecordSync(id).attributes.name, 'Gassy Giant II');
    assert.equal(store.cache.getRecordSync(id).attributes.classification, 'gas giant III');
  });

  test('#rollback - rolls back transform log and replays transform inverses against the cache', async function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };
    const recordB = { id: 'saturn', type: 'planet', attributes: { name: 'Saturn' } };
    const recordC = { id: 'pluto', type: 'planet', attributes: { name: 'Pluto' } };
    const recordD = { id: 'neptune', type: 'planet', attributes: { name: 'Neptune' } };
    const recordE = { id: 'uranus', type: 'planet', attributes: { name: 'Uranus' } };

    const tb = store.transformBuilder;
    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    const rollbackOperations: RecordOperation[] = [];

    await all([
      store.sync(addRecordATransform),
      store.sync(addRecordBTransform),
      store.sync(addRecordCTransform),
      store.sync(buildTransform([
        tb.addRecord(recordD),
        tb.addRecord(recordE)
      ]))
    ]);

    store.cache.on('patch', (operation: RecordOperation) => rollbackOperations.push(operation));
    await store.rollback(addRecordATransform.id);

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

  test('#upgrade upgrades the cache to include new models introduced in a schema', async function(assert) {
    let person = { type: 'person', id: '1', relationships: { planet: { data: { type: 'planet', id: 'earth' }}} };

    let models = clone(schema.models);
    models.planet.relationships.inhabitants = { type: 'hasMany', model: 'person', inverse: 'planet' };
    models.person = { relationships: { planet: { type: 'hasOne', model: 'planet', inverse: 'inhabitants' }} };

    schema.upgrade({ models });

    await store.update(t => t.addRecord(person));

    assert.deepEqual(store.cache.getRecordSync({ type: 'person', id: '1' }), person, 'records match');
  });
});
