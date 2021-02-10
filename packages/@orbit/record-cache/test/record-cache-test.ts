import { buildQuery, buildTransform } from '@orbit/data';
import {
  RecordKeyMap,
  RecordOperation,
  RecordQuery,
  RecordQueryBuilder,
  RecordQueryExpression,
  RecordSchema,
  RecordTransform,
  RecordTransformBuilder
} from '@orbit/records';
import { RecordCache } from '../src/record-cache';
import { createSchemaWithRemoteKey } from './support/setup';

const { module, test } = QUnit;

module('RecordCache', function (hooks) {
  let schema: RecordSchema, keyMap: RecordKeyMap;

  class MyRecordCache extends RecordCache {}

  hooks.beforeEach(function () {
    schema = createSchemaWithRemoteKey();
    keyMap = new RecordKeyMap();
  });

  test('it exists', function (assert) {
    const cache = new MyRecordCache({ schema });

    assert.ok(cache);
  });

  test('it requires a schema', function (assert) {
    assert.expect(1);
    let schema = (undefined as unknown) as RecordSchema;
    assert.throws(() => new MyRecordCache({ schema }));
  });

  test('it can be instantiated with a `queryBuilder` and/or `transformBuilder`', function (assert) {
    const queryBuilder = new RecordQueryBuilder();
    const transformBuilder = new RecordTransformBuilder();
    let cache = new MyRecordCache({ schema, queryBuilder, transformBuilder });
    assert.strictEqual(
      queryBuilder,
      cache.queryBuilder,
      'queryBuilder remains the same'
    );
    assert.strictEqual(
      transformBuilder,
      cache.transformBuilder,
      'transformBuilder remains the same'
    );
  });

  test('it can be instantiated with `defaultQueryOptions` and/or `defaultTransformOptions`', function (assert) {
    const defaultQueryOptions = {
      foo: 'bar'
    };

    const defaultTransformOptions = {
      foo: 'bar'
    };

    let cache = new MyRecordCache({
      schema,
      defaultQueryOptions,
      defaultTransformOptions
    });

    assert.strictEqual(
      cache.defaultQueryOptions,
      defaultQueryOptions,
      'defaultQueryOptions remains the same'
    );

    assert.strictEqual(
      cache.defaultTransformOptions,
      defaultTransformOptions,
      'defaultTransformOptions remains the same'
    );
  });

  test('`defaultQueryOptions` and `defaultTransformOptions` can be modified', function (assert) {
    const defaultQueryOptions = {
      maxRequests: 3
    };

    const defaultTransformOptions = {
      maxRequests: 1
    };

    let cache = new MyRecordCache({
      schema,
      defaultQueryOptions,
      defaultTransformOptions
    });

    cache.defaultQueryOptions = {
      ...cache.defaultQueryOptions,
      type: 'query'
    };

    assert.deepEqual(cache.defaultQueryOptions, {
      maxRequests: 3,
      type: 'query'
    });

    cache.defaultTransformOptions = {
      ...cache.defaultTransformOptions,
      type: 'transform'
    };

    assert.deepEqual(cache.defaultTransformOptions, {
      maxRequests: 1,
      type: 'transform'
    });
  });

  test('it can get query options that merge default, query, and expression options', function (assert) {
    const defaultQueryOptions = {
      foo: 'bar',
      a: '1',
      b: '1',
      c: '1'
    };

    let cache = new MyRecordCache({
      schema,
      defaultQueryOptions,
      name: 'mySource'
    });

    const queryExpression = {
      op: 'findRecords',
      options: { sources: { mySource: { c: '3' } } }
    } as RecordQueryExpression;
    const query = buildQuery(queryExpression, {
      page: 2,
      b: '2',
      c: '2'
    }) as RecordQuery;

    assert.deepEqual(
      cache.getQueryOptions(query, queryExpression),
      {
        foo: 'bar',
        page: 2,
        a: '1',
        b: '2',
        c: '3'
      },
      'query options are merged with defaults'
    );
  });

  test('it can get transform options that merge default, transform, and operation options', function (assert) {
    const defaultTransformOptions = {
      foo: 'bar',
      a: '1',
      b: '1',
      c: '1'
    };

    let cache = new MyRecordCache({
      schema,
      defaultTransformOptions,
      name: 'mySource'
    });

    const operation = {
      op: 'addRecord',
      record: { type: 'planet', id: '1' },
      options: { sources: { mySource: { c: '3' } } }
    } as RecordOperation;

    const transform = buildTransform(operation, {
      auth: 'abc123',
      b: '2',
      c: '2'
    }) as RecordTransform;

    assert.deepEqual(
      cache.getTransformOptions(transform, operation),
      {
        foo: 'bar',
        auth: 'abc123',
        a: '1',
        b: '2',
        c: '3'
      },
      'transform options are merged with defaults'
    );
  });
});
