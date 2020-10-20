import {
  cloneRecordIdentity as identity,
  KeyMap,
  Query,
  Record,
  Schema,
  SchemaSettings,
  Source,
  buildTransform,
  RecordOperation,
  Transform,
  RecordTransformResult,
  ResponseHints
} from '@orbit/data';
import { clone } from '@orbit/utils';
import {
  SyncCacheIntegrityProcessor,
  SyncSchemaConsistencyProcessor
} from '@orbit/record-cache';
import { MemorySource } from '../src/memory-source';

const { module, test } = QUnit;

module('MemorySource', function (hooks) {
  const schemaDefinition: SchemaSettings = {
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

  const schema = new Schema(schemaDefinition);

  let source: MemorySource;
  let keyMap: KeyMap;

  hooks.beforeEach(function () {
    keyMap = new KeyMap();
    source = new MemorySource({ schema, keyMap });
  });

  test('its prototype chain is correct', function (assert) {
    assert.ok(source instanceof Source, 'instanceof Source');
    assert.ok(source instanceof MemorySource, 'instanceof MemorySource');
    assert.equal(source.name, 'memory', 'should have default name');
  });

  test("internal cache's settings can be specified with `cacheSettings`", function (assert) {
    let source = new MemorySource({
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
    let cache = source.cache as any;

    assert.ok(cache, 'cache exists');
    assert.equal(cache._processors.length, 2, 'cache has 2 processors');
  });

  test('automatically shares its `transformBuilder` and `queryBuilder` with its cache', function (assert) {
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

  test("#update - transforms the source's cache", async function (assert) {
    assert.expect(4);

    const jupiter: Record = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      0,
      'cache should start empty'
    );

    let record = await source.update((t) => t.addRecord(jupiter));

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      1,
      'cache should contain one planet'
    );
    assert.deepEqual(
      source.cache.getRecordSync({ type: 'planet', id: 'jupiter' }),
      jupiter,
      'planet should be jupiter'
    );
    assert.strictEqual(record, jupiter, 'result should be returned');
  });

  test('#update - can perform multiple operations and return the results', async function (assert) {
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
    };

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      0,
      'cache should start empty'
    );

    let records = await source.update((t) => [
      t.addRecord(jupiter),
      t.addRecord(earth)
    ]);

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      2,
      'cache should contain two planets'
    );
    assert.deepEqual(
      records,
      [jupiter, earth],
      'results array should be returned'
    );
  });

  test('#update - replaceRelatedRecord can be followed up by removing the replaced record', async function (assert) {
    assert.expect(2);

    const star1 = {
      id: 'star1',
      type: 'star',
      attributes: { name: 'sun' }
    };

    const star2 = {
      id: 'star2',
      type: 'star',
      attributes: { name: 'sun2' }
    };

    const home = {
      id: 'home',
      type: 'planetarySystem',
      attributes: { name: 'Home' },
      relationships: {
        star: {
          data: { id: 'star1', type: 'star' }
        }
      }
    };

    await source.update((t) => [
      t.addRecord(star1),
      t.addRecord(star2),
      t.addRecord(home)
    ]);

    let latestHome = source.cache.getRecordSync({
      id: 'home',
      type: 'planetarySystem'
    });
    assert.deepEqual(
      (latestHome?.relationships?.star.data as Record).id,
      star1.id,
      'The original related record is in place.'
    );

    await source.update((t) => [
      t.replaceRelatedRecord(home, 'star', star2),
      t.removeRecord(star1)
    ]);

    latestHome = source.cache.getRecordSync({
      id: 'home',
      type: 'planetarySystem'
    });
    assert.deepEqual(
      (latestHome?.relationships?.star.data as Record).id,
      star2.id,
      'The related record was replaced.'
    );
  });

  test('#update - accepts hints that can return a single record', async function (assert) {
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

    source.cache.patch((t) => t.addRecord(earth));

    source.on('beforeUpdate', (transform: Transform, hints: any) => {
      if (transform?.options?.customizeResults) {
        hints.data = earth;
      }
    });

    let planet = await source.update((t) => t.addRecord(jupiter), {
      customizeResults: true
    });

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      2,
      'cache should contain two planets'
    );

    assert.deepEqual(planet, earth, 'added planet matches hinted record');
  });

  test('#update - accepts hints that can return a collection of records', async function (assert) {
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
    };

    source.on(
      'beforeUpdate',
      (transform: Transform, hints: ResponseHints<RecordTransformResult>) => {
        if (transform?.options?.customizeResults) {
          hints.data = [
            { type: 'planet', id: 'uranus' },
            { type: 'planet', id: 'jupiter' }
          ];
        }
      }
    );

    let planets = await source.update(
      (t) => [t.addRecord(jupiter), t.addRecord(earth), t.addRecord(uranus)],
      {
        customizeResults: true
      }
    );

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      3,
      'cache should contain three planets'
    );

    assert.deepEqual(
      planets,
      [uranus, jupiter],
      'planets match hinted records'
    );
  });

  test('#update - accepts hints that can return an array of varied results', async function (assert) {
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
    };

    source.on(
      'beforeUpdate',
      (transform: Transform, hints: ResponseHints<RecordTransformResult>) => {
        if (transform?.options?.customizeResults) {
          hints.data = [
            { type: 'planet', id: 'uranus' },
            { type: 'planet', id: 'earth' },
            undefined
          ];
        }
      }
    );

    let planets = await source.update(
      (t) => [t.addRecord(jupiter), t.addRecord(earth), t.addRecord(uranus)],
      {
        customizeResults: true
      }
    );

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      3,
      'cache should contain three planets'
    );

    assert.deepEqual(
      planets,
      [uranus, earth, undefined],
      'planets match hinted records'
    );
  });

  test("#query - queries the source's cache", async function (assert) {
    assert.expect(2);

    let jupiter = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

    source.cache.patch((t) => t.addRecord(jupiter));

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

    let jupiter2 = {
      id: 'jupiter2',
      type: 'planet',
      attributes: { name: 'Jupiter2', classification: 'gas giant' }
    };

    source.on('beforeQuery', (query: Query, hints: any) => {
      if (query.expressions[0].op === 'findRecord') {
        hints.data = jupiter2;
      }
    });

    source.cache.patch((t) => t.addRecord(jupiter2));

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

    source.on('beforeQuery', (query: Query, hints: any) => {
      if (
        query.expressions[0].op === 'findRecords' &&
        query.options?.sources?.remote.customFilter === 'distantPlanets'
      ) {
        hints.data = [
          { type: 'planet', id: 'uranus' },
          { type: 'planet', id: 'jupiter' }
        ];
      }
    });

    source.cache.patch((t) => [
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

    source.cache.reset();

    assert.equal(
      source.cache.getRecordsSync('planet').length,
      0,
      'cache should contain no planets'
    );

    try {
      await source.query((q) =>
        q.findRecord({ type: 'planet', id: 'jupiter' })
      );
    } catch (e) {
      assert.equal(e.message, 'Record not found: planet:jupiter');
    }
  });

  test('#query - can query with multiple expressions', async function (assert) {
    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter'
      }
    };
    const earth: Record = {
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
        q.findRecord({ type: 'planet', id: 'earth' })
      ]),
      [jupiter, earth]
    );
  });

  test('#sync - appends transform to log', async function (assert) {
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

  test('#transformsSince - returns all transforms since a specified transformId', async function (assert) {
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
      source.transformsSince(addRecordATransform.id),
      [addRecordBTransform, addRecordCTransform],
      'returns transforms since the specified transform'
    );
  });

  test('#allTransforms - returns all tracked transforms', async function (assert) {
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
      source.allTransforms(),
      [addRecordATransform, addRecordBTransform, addRecordCTransform],
      'tracks transforms in correct order'
    );
  });

  test('transformLog.truncate - clears transforms from log as well as tracked transforms before a specified transform', async function (assert) {
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
      source.allTransforms(),
      [addRecordBTransform, addRecordCTransform],
      'remaining transforms are in correct order'
    );
  });

  test('transformLog.clear - clears all transforms from log as well as tracked transforms', async function (assert) {
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
      source.allTransforms(),
      [],
      'no transforms remain in history'
    );
  });

  test('#fork - creates a new source that starts with the same schema, keyMap, and cache contents as the base source', async function (assert) {
    const jupiter: Record = {
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
    assert.strictEqual(source.schema, fork.schema, 'schema matches');
    assert.strictEqual(source.keyMap, fork.keyMap, 'keyMap matches');
    assert.strictEqual(
      source.transformBuilder,
      fork.transformBuilder,
      'transformBuilder is shared'
    );
    assert.strictEqual(
      source.queryBuilder,
      fork.queryBuilder,
      'queryBuilder is shared'
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

  test('#merge - merges transforms from a forked source back into a base source', async function (assert) {
    const jupiter: Record = {
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

  test('#merge - can accept options that will be assigned to the resulting transform', async function (assert) {
    assert.expect(3);

    const jupiter: Record = {
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

  test('#rebase - works with empty sources', function (assert) {
    assert.expect(1);

    let child = source.fork();
    child.rebase();

    assert.ok(true, 'no exception has been thrown');
  });

  test('#rebase - record ends up in child source', async function (assert) {
    assert.expect(3);

    const jupiter: Record = {
      type: 'planet',
      id: 'jupiter-id',
      attributes: { name: 'Jupiter', classification: 'gas giant' }
    };

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

    assert.deepEqual(fork.allTransforms(), [addRecordD, addRecordE]);

    assert.deepEqual(fork.cache.getRecordSync(recordA), recordA);
    assert.deepEqual(fork.cache.getRecordSync(recordB), recordB);
    assert.deepEqual(fork.cache.getRecordSync(recordC), recordC);
    assert.deepEqual(fork.cache.getRecordSync(recordD), recordD);
    assert.deepEqual(fork.cache.getRecordSync(recordE), recordE);
    assert.deepEqual(fork.cache.getRecordsSync('planet').length, 5);
  });

  test('#rebase - rebase orders conflicting transforms in expected way', async function (assert) {
    assert.expect(6);

    const jupiter: Record = {
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

    const jupiter: Record = {
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
        buildTransform([tb.addRecord(recordD), tb.addRecord(recordE)])
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
    let person = {
      type: 'person',
      id: '1',
      relationships: { planet: { data: { type: 'planet', id: 'earth' } } }
    };

    let models = clone(schema.models);
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
