import { buildTransform } from '@orbit/data';
import {
  SyncCacheIntegrityProcessor,
  SyncSchemaConsistencyProcessor
} from '@orbit/record-cache';
import {
  cloneRecordIdentity as identity,
  InitializedRecord,
  RecordKeyMap,
  RecordOperation,
  RecordSchema,
  RecordSchemaSettings,
  RecordSource,
  RecordTransformBuilder
} from '@orbit/records';
import { clone } from '@orbit/utils';
import { MemoryCache } from '../src/memory-cache';
import { MemorySource } from '../src/memory-source';

const { module, test } = QUnit;

module('MemorySource', function (hooks) {
  const schemaDefinition: RecordSchemaSettings = {
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
  };

  let schema: RecordSchema;
  let keyMap: RecordKeyMap;

  hooks.beforeEach(function () {
    schema = new RecordSchema(schemaDefinition);
    keyMap = new RecordKeyMap();
  });

  test('its prototype chain is correct', function (assert) {
    const source = new MemorySource({ schema, keyMap });
    assert.ok(source instanceof RecordSource, 'instanceof RecordSource');
    assert.ok(source instanceof MemorySource, 'instanceof MemorySource');
    assert.equal(source.name, 'memory', 'should have default name');
  });

  test("internal cache's settings can be specified with `cacheSettings`", function (assert) {
    const source = new MemorySource({
      schema,
      keyMap,
      cacheSettings: {
        schema,
        processors: [
          SyncCacheIntegrityProcessor,
          SyncSchemaConsistencyProcessor
        ]
      }
    });

    assert.ok(source.cache, 'cache exists');
    assert.equal(source.cache.processors.length, 2, 'cache has 2 processors');
  });

  test('can be assigned a custom `cacheClass`', function (assert) {
    class CustomCache extends MemoryCache {
      custom = true;
    }

    const source = new MemorySource({
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
    const source = new MemorySource({ schema, keyMap });
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
    const source = new MemorySource({
      schema,
      keyMap,
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
    const source = new MemorySource({ schema, keyMap });
    assert.strictEqual(
      source.cache.validatorFor,
      source.validatorFor,
      'validatorFor is shared'
    );
  });

  test('will not create a `validatorFor` fn if `autoValidate: false`', function (assert) {
    const source = new MemorySource({ schema, keyMap, autoValidate: false });
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

  test('#sync - appends transform to log', async function (assert) {
    const source = new MemorySource({ schema, keyMap });
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const addRecordATransform = buildTransform(
      source.transformBuilder.addRecord(recordA)
    );

    await source.sync(addRecordATransform);

    assert.ok(
      source.transformLog.contains(addRecordATransform.id),
      'log contains transform'
    );
  });

  test('#getTransform - returns a particular transform given an id', async function (assert) {
    const source = new MemorySource({ schema, keyMap });

    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const addRecordATransform = buildTransform(
      source.transformBuilder.addRecord(recordA)
    );

    await source.sync(addRecordATransform);

    assert.strictEqual(
      source.getTransform(addRecordATransform.id),
      addRecordATransform
    );
  });

  test('#getInverseOperations - returns the inverse operations for a particular transform', async function (assert) {
    const source = new MemorySource({ schema, keyMap });
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const addRecordATransform = buildTransform(
      source.transformBuilder.addRecord(recordA)
    );
    await source.sync(addRecordATransform);

    assert.deepEqual(source.getInverseOperations(addRecordATransform.id), [
      { op: 'removeRecord', record: identity(recordA) }
    ]);
  });

  test('#getTransformsSince - returns all transforms since a specified transformId', async function (assert) {
    const source = new MemorySource({ schema, keyMap });
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' }
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' }
    };
    const tb = source.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await source.sync(addRecordATransform);
    await source.sync(addRecordBTransform);
    await source.sync(addRecordCTransform);

    assert.deepEqual(
      source.getTransformsSince(addRecordATransform.id),
      [addRecordBTransform, addRecordCTransform],
      'returns transforms since the specified transform'
    );
  });

  test('#getAllTransforms - returns all tracked transforms', async function (assert) {
    const source = new MemorySource({ schema, keyMap });
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' }
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' }
    };
    const tb = source.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await source.sync(addRecordATransform);
    await source.sync(addRecordBTransform);
    await source.sync(addRecordCTransform);

    assert.deepEqual(
      source.getAllTransforms(),
      [addRecordATransform, addRecordBTransform, addRecordCTransform],
      'tracks transforms in correct order'
    );
  });

  test('transformLog.truncate - clears transforms from log as well as tracked transforms before a specified transform', async function (assert) {
    const source = new MemorySource({ schema, keyMap });
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' }
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' }
    };
    const tb = source.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await source.sync(addRecordATransform);
    await source.sync(addRecordBTransform);
    await source.sync(addRecordCTransform);

    await source.transformLog.truncate(addRecordBTransform.id);

    assert.deepEqual(
      source.getAllTransforms(),
      [addRecordBTransform, addRecordCTransform],
      'remaining transforms are in correct order'
    );
  });

  test('transformLog.clear - clears all transforms from log as well as tracked transforms', async function (assert) {
    const source = new MemorySource({ schema, keyMap });
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' }
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' }
    };
    const tb = source.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await source.sync(addRecordATransform);
    await source.sync(addRecordBTransform);
    await source.sync(addRecordCTransform);

    await source.transformLog.clear();

    assert.deepEqual(
      source.getAllTransforms(),
      [],
      'no transforms remain in history'
    );

    assert.equal(
      source.cache.getRecordsSync().length,
      3,
      'records remain in cache'
    );
  });

  test('reset - clears transform log and resets cache', async function (assert) {
    const source = new MemorySource({ schema, keyMap });
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' }
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' }
    };
    const tb = source.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await source.sync(addRecordATransform);
    await source.sync(addRecordBTransform);
    await source.sync(addRecordCTransform);

    await source.reset();

    assert.deepEqual(
      source.getAllTransforms(),
      [],
      'no transforms remain in history'
    );

    assert.equal(
      source.cache.getRecordsSync().length,
      0,
      'cache has been cleared'
    );
  });

  test('#fork - creates a new source that starts with the same schema, keyMap, and cache contents as the base source', async function (assert) {
    const source = new MemorySource({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter-id',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    await source.update((t) => t.addRecord(jupiter));

    assert.deepEqual(
      source.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }),
      jupiter,
      'verify source data'
    );

    const fork = source.fork();

    assert.deepEqual(
      fork.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }),
      jupiter,
      'data in fork matches data in source'
    );
    assert.strictEqual(fork.schema, source.schema, 'schema matches');
    assert.strictEqual(fork.keyMap, source.keyMap, 'keyMap matches');
    assert.strictEqual(
      fork.transformBuilder,
      source.transformBuilder,
      'transformBuilder is shared'
    );
    assert.strictEqual(
      fork.queryBuilder,
      source.queryBuilder,
      'queryBuilder is shared'
    );
    assert.strictEqual(
      fork.validatorFor,
      source.validatorFor,
      'validatorFor is shared'
    );
    assert.strictEqual(
      fork.forkPoint,
      source.transformLog.head,
      'forkPoint is set on the forked source'
    );
    assert.strictEqual(
      fork.base,
      source,
      'base source is set on the forked source'
    );
  });

  test('#fork - skips creating validatorFor if none is set for the base source', async function (assert) {
    const source = new MemorySource({ schema, keyMap, autoValidate: false });

    assert.strictEqual(
      source.validatorFor,
      undefined,
      'source.validatorFor is undefined'
    );
    assert.strictEqual(
      source.cache.validatorFor,
      undefined,
      'source.cache.validatorFor is undefined'
    );

    const fork = source.fork();

    assert.strictEqual(
      fork.validatorFor,
      undefined,
      'fork.validatorFor is undefined'
    );
    assert.strictEqual(
      fork.cache.validatorFor,
      undefined,
      'fork.cache.validatorFor is undefined'
    );
  });

  test('#fork - can have different settings from the base source', async function (assert) {
    const source = new MemorySource({ schema, keyMap });

    assert.notStrictEqual(
      source.validatorFor,
      undefined,
      'source.validatorFor is defined'
    );
    assert.notStrictEqual(
      source.cache.validatorFor,
      undefined,
      'source.cache.validatorFor is defined'
    );

    const fork = source.fork({ autoValidate: false });

    assert.strictEqual(
      fork.validatorFor,
      undefined,
      'fork.validatorFor is undefined'
    );
    assert.strictEqual(
      fork.cache.validatorFor,
      undefined,
      'fork.cache.validatorFor is undefined'
    );
  });

  test('#merge - merges changes from a forked source back into a base source', async function (assert) {
    const source = new MemorySource({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter-id',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    let fork = source.fork();

    await fork.update((t) => t.addRecord(jupiter));

    assert.deepEqual(
      fork.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }),
      jupiter,
      'verify fork data'
    );

    await source.merge(fork);

    assert.deepEqual(
      source.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }),
      jupiter,
      'data in source matches data in fork'
    );
  });

  test("#merge - will apply all operations from a forked source's cache, if that cache is tracking update operations", async function (assert) {
    const source = new MemorySource({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    let fork = source.fork();

    assert.ok(
      fork.cache.isTrackingUpdateOperations,
      "forked source's cache is tracking update operations"
    );

    // apply change to fork.cache
    fork.cache.update((t) => t.addRecord(jupiter));

    // apply other change to fork directly
    await fork.update((t) => t.addRecord(earth));

    assert.deepEqual(
      fork.cache.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'jupiter is present in fork.cache'
    );
    assert.deepEqual(
      fork.cache.getRecordSync({ type: 'planet', id: 'earth' }),
      earth,
      'earth is present in fork.cache'
    );

    await source.merge(fork);

    assert.deepEqual(
      source.cache.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'jupiter is present in source.cache'
    );

    assert.deepEqual(
      source.cache.getRecordSync({ type: 'planet', id: 'earth' }),
      earth,
      'earth is present in source.cache'
    );
  });

  test('#merge - will apply only operations from a forked source, if its cache is NOT tracking update operations', async function (assert) {
    const source = new MemorySource({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    const earth: InitializedRecord = {
      type: 'planet',
      id: 'earth',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    let fork = source.fork({ cacheSettings: { trackUpdateOperations: false } });

    assert.notOk(
      fork.cache.isTrackingUpdateOperations,
      "forked source's cache is NOT tracking update operations"
    );

    // apply change to fork.cache
    fork.cache.update((t) => t.addRecord(jupiter));

    // apply other change to fork directly
    await fork.update((t) => t.addRecord(earth));

    assert.deepEqual(
      fork.cache.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'jupiter is present in fork.cache'
    );
    assert.deepEqual(
      fork.cache.getRecordSync({ type: 'planet', id: 'earth' }),
      earth,
      'earth is present in fork.cache'
    );

    await source.merge(fork);

    assert.strictEqual(
      source.cache.getRecordSync({ type: 'planet', id: 'jupiter' }),
      undefined,
      'jupiter is NOT present in source.cache'
    );

    assert.deepEqual(
      source.cache.getRecordSync({ type: 'planet', id: 'earth' }),
      earth,
      'earth is present in source.cache'
    );
  });

  test('#merge - can accept options in deprecated `transformOptions` object that will be assigned to the resulting transform', async function (assert) {
    assert.expect(3);

    const source = new MemorySource({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter-id',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    let fork = source.fork();

    source.on('update', (transform) => {
      assert.equal(transform.options.label, 'Create Jupiter');
    });

    await fork.update((t) => t.addRecord(jupiter));

    assert.deepEqual(
      fork.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }),
      jupiter,
      'verify fork data'
    );

    await source.merge(fork, { transformOptions: { label: 'Create Jupiter' } });

    assert.deepEqual(
      source.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }),
      jupiter,
      'data in source matches data in fork'
    );
  });

  test('#merge - can accept options that will be assigned to the resulting transform', async function (assert) {
    assert.expect(3);

    const source = new MemorySource({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter-id',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    let fork = source.fork();

    source.on('update', (transform) => {
      assert.equal(transform.options.label, 'Create Jupiter');
    });

    await fork.update((t) => t.addRecord(jupiter));

    assert.deepEqual(
      fork.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }),
      jupiter,
      'verify fork data'
    );

    await source.merge(fork, { label: 'Create Jupiter' });

    assert.deepEqual(
      source.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }),
      jupiter,
      'data in source matches data in fork'
    );
  });

  test('#rebase - works with empty sources', function (assert) {
    assert.expect(1);

    const source = new MemorySource({ schema, keyMap });

    let child = source.fork();
    child.rebase();

    assert.ok(true, 'no exception has been thrown');
  });

  test('#rebase - record ends up in child source', async function (assert) {
    assert.expect(3);

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter-id',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    const source = new MemorySource({ schema, keyMap });

    let child = source.fork();

    await source.update((t) => t.addRecord(jupiter));

    assert.deepEqual(
      source.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }),
      jupiter,
      'verify source data'
    );
    assert.equal(
      child.cache.getRecordsSync('planet').length,
      0,
      'child source is still empty'
    );

    child.rebase();

    assert.deepEqual(
      child.cache.getRecordSync({ type: 'planet', id: 'jupiter-id' }),
      jupiter,
      'verify child data'
    );
  });

  test('#rebase - maintains only unique transforms in fork', async function (assert) {
    const source = new MemorySource({ schema, keyMap });
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' }
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' }
    };
    const recordD = {
      id: 'neptune',
      type: 'planet',
      attributes: { name: 'Neptune' }
    };
    const recordE = {
      id: 'uranus',
      type: 'planet',
      attributes: { name: 'Uranus' }
    };

    const tb = source.transformBuilder;
    const addRecordA = buildTransform(tb.addRecord(recordA));
    const addRecordB = buildTransform(tb.addRecord(recordB));
    const addRecordC = buildTransform(tb.addRecord(recordC));
    const addRecordD = buildTransform(tb.addRecord(recordD));
    const addRecordE = buildTransform(tb.addRecord(recordE));

    let fork;

    await source.update(addRecordA);
    await source.update(addRecordB);

    fork = source.fork();

    await fork.update(addRecordD);
    await source.update(addRecordC);
    await fork.update(addRecordE);

    fork.rebase();

    assert.deepEqual(fork.getAllTransforms(), [addRecordD, addRecordE]);

    assert.deepEqual(fork.cache.getRecordSync(recordA), recordA);
    assert.deepEqual(fork.cache.getRecordSync(recordB), recordB);
    assert.deepEqual(fork.cache.getRecordSync(recordC), recordC);
    assert.deepEqual(fork.cache.getRecordSync(recordD), recordD);
    assert.deepEqual(fork.cache.getRecordSync(recordE), recordE);
    assert.deepEqual(fork.cache.getRecordsSync('planet').length, 5);
  });

  test('#rebase - rebase orders conflicting transforms in expected way', async function (assert) {
    assert.expect(6);

    const source = new MemorySource({ schema, keyMap });

    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter-id',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };
    const id = { type: 'planet', id: 'jupiter-id' };

    let child: MemorySource;

    // 1. fill source with some data
    await source.update((t) => t.addRecord(jupiter));

    // 2. create a child source
    assert.deepEqual(
      source.cache.getRecordSync(id),
      jupiter,
      'verify source data'
    );
    child = source.fork();
    assert.deepEqual(
      child.cache.getRecordSync(id),
      jupiter,
      'verify child data'
    );

    // 3. update the child and the parent source (in any order)
    await child.update((t) => t.replaceAttribute(id, 'name', 'The Gas Giant'));
    await source.update((t) => t.replaceAttribute(id, 'name', 'Gassy Giant'));

    // 4. make sure updates were successful
    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.name,
      'The Gas Giant'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.name,
      'Gassy Giant'
    );

    // 5. do the rebase
    child.rebase();

    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.name,
      'The Gas Giant'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.name,
      'Gassy Giant'
    );
  });

  test('#rebase - calling rebase multiple times', async function (assert) {
    assert.expect(22);

    const source = new MemorySource({ schema, keyMap });
    const jupiter: InitializedRecord = {
      type: 'planet',
      id: 'jupiter-id',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };
    const id = { type: 'planet', id: 'jupiter-id' };

    let child: MemorySource;

    // 1. fill source with some data
    await source.update((t) => t.addRecord(jupiter));
    // 2. create a child source
    assert.deepEqual(
      source.cache.getRecordSync(id),
      jupiter,
      'verify source data'
    );
    child = source.fork();
    assert.deepEqual(
      child.cache.getRecordSync(id),
      jupiter,
      'verify child data'
    );

    // 3. update the child and the parent source (in any order)
    await child.update((t) => t.replaceAttribute(id, 'name', 'The Gas Giant'));
    await source.update((t) => t.replaceAttribute(id, 'name', 'Gassy Giant'));
    // 4. make sure updates were successful
    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.name,
      'The Gas Giant'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.name,
      'Gassy Giant'
    );

    // 5. do the rebase
    child.rebase();
    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.name,
      'The Gas Giant'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.name,
      'Gassy Giant'
    );

    // 6. do a second update to the parent source
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.classification,
      'gas giant'
    );
    await source.update((t) =>
      t.updateRecord({
        ...id,
        attributes: {
          name: 'Gassy Giant II',
          classification: 'gas giant II'
        }
      })
    );
    // 7. make sure updates were successful
    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.name,
      'The Gas Giant'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.name,
      'Gassy Giant II'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.classification,
      'gas giant II'
    );

    // 8. do the second rebase
    // make sure that changes from the child are still winning
    child.rebase();
    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.name,
      'The Gas Giant'
    );
    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.classification,
      'gas giant II'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.name,
      'Gassy Giant II'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.classification,
      'gas giant II'
    );

    // 9. update the parent source a third time
    await source.update((t) =>
      t.replaceAttribute(id, 'classification', 'gas giant III')
    );
    // 10. make sure updates were successful
    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.name,
      'The Gas Giant'
    );
    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.classification,
      'gas giant II'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.name,
      'Gassy Giant II'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.classification,
      'gas giant III'
    );

    // 11. do the third rebase
    // make sure that transforms from the parent are applied in correct order
    child.rebase();
    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.name,
      'The Gas Giant'
    );
    assert.equal(
      child.cache.getRecordSync(id)?.attributes?.classification,
      'gas giant III',
      'classification has not been touched in child source => should be the same as in parent source'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.name,
      'Gassy Giant II'
    );
    assert.equal(
      source.cache.getRecordSync(id)?.attributes?.classification,
      'gas giant III'
    );
  });

  test('#rollback - rolls back transform log and replays transform inverses against the cache', async function (assert) {
    const source = new MemorySource({ schema, keyMap });
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' }
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' }
    };
    const recordD = {
      id: 'neptune',
      type: 'planet',
      attributes: { name: 'Neptune' }
    };
    const recordE = {
      id: 'uranus',
      type: 'planet',
      attributes: { name: 'Uranus' }
    };

    const tb = source.transformBuilder;
    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    const rollbackOperations: RecordOperation[] = [];

    await source.sync(addRecordATransform),
      await source.sync(addRecordBTransform),
      await source.sync(addRecordCTransform),
      await source.sync(
        buildTransform<RecordOperation, RecordTransformBuilder>([
          tb.addRecord(recordD),
          tb.addRecord(recordE)
        ])
      );

    source.cache.on('patch', (operation: RecordOperation) =>
      rollbackOperations.push(operation)
    );
    await source.rollback(addRecordATransform.id);

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

    assert.equal(
      source.transformLog.head,
      addRecordATransform.id,
      'rolls back transform log'
    );
  });

  test('#upgrade upgrades the cache to include new models introduced in a schema', async function (assert) {
    const source = new MemorySource({ schema, keyMap });
    const person = {
      type: 'person',
      id: '1',
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };
    const models = clone(schema.models);
    models.planet.relationships.inhabitants = {
      kind: 'hasMany',
      type: 'person',
      inverse: 'planet'
    };
    models.person = {
      relationships: {
        planet: { kind: 'hasOne', type: 'planet', inverse: 'inhabitants' }
      }
    };

    schema.upgrade({ models });

    await source.update((t) => t.addRecord(person));

    assert.deepEqual(
      source.cache.getRecordSync({ type: 'person', id: '1' }),
      person,
      'records match'
    );
  });
});
