import { Query } from '../../src/query';
import { Source } from '../../src/source';
import { RequestOptions } from '../../src/request';
import { ResponseHints } from '../../src/response';
import {
  queryable,
  isQueryable,
  Queryable
} from '../../src/source-interfaces/queryable';
import {
  Record,
  FindRecords,
  RecordData,
  RecordResponse,
  RecordOperation,
  RecordQueryExpression,
  RecordQueryBuilder
} from '../support/record-data';

const { module, test } = QUnit;

module('@queryable', function (hooks) {
  interface MySource
    extends Source,
      Queryable<
        RecordData,
        RecordResponse,
        RecordOperation,
        RecordQueryExpression,
        RecordQueryBuilder,
        RequestOptions
      > {}

  @queryable
  class MySource extends Source {}

  let source: MySource;

  hooks.beforeEach(function () {
    source = new MySource({ name: 'src1' });
  });

  test('isQueryable - tests for the application of the @queryable decorator', function (assert) {
    assert.ok(isQueryable(source));
  });

  test('should be applied to a Source', function (assert) {
    assert.throws(
      function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Test of bad typing
        @queryable
        class Vanilla {}
      },
      Error(
        'Assertion failed: Queryable interface can only be applied to a Source'
      ),
      'assertion raised'
    );
  });

  test('#query should resolve as a failure when _query fails', async function (assert) {
    assert.expect(2);

    source._query = function () {
      return Promise.reject(':(');
    };

    try {
      await source.query({ op: 'findRecords', type: 'planet' });
    } catch (error) {
      assert.ok(true, 'query promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#query should trigger `query` event after a successful action in which `_query` resolves successfully', async function (assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;
    const fullResponse = {
      data: [
        {
          type: 'planet',
          id: 'p1'
        }
      ]
    };

    source._query = async function (query) {
      assert.equal(++order, 1, 'action performed after beforeQuery');
      assert.strictEqual(query.expressions, qe, 'query object matches');
      return fullResponse;
    };

    source.on('query', (query, result) => {
      assert.equal(
        ++order,
        2,
        'query triggered after action performed successfully'
      );
      assert.strictEqual(query.expressions, qe, 'query matches');
      assert.strictEqual(result, fullResponse, 'result matches');
    });

    let result = await source.query<Record[]>(qe);

    assert.equal(++order, 3, 'promise resolved last');
    assert.deepEqual(result, fullResponse.data, 'success!');
  });

  test('#query should trigger `query` event after a successful action in which `_query` just returns (not a promise)', async function (assert) {
    assert.expect(7);

    const qe = { op: 'findRecords', type: 'planet' } as FindRecords;
    const fullResponse = {
      data: undefined
    };
    let order = 0;

    source._query = async function (query) {
      assert.equal(++order, 1, 'action performed after beforeQuery');
      assert.strictEqual(query.expressions, qe, 'query object matches');
      return fullResponse;
    };

    source.on('query', (query, result) => {
      assert.equal(
        ++order,
        2,
        'query triggered after action performed successfully'
      );
      assert.strictEqual(query.expressions, qe, 'query matches');
      assert.equal(result, fullResponse, 'result matches');
    });

    let result = await source.query<Record[]>(qe);

    assert.equal(++order, 3, 'promise resolved last');
    assert.equal(result, fullResponse.data, 'undefined result');
  });

  test('`query` event should receive results as the last argument, even if they are an array', async function (assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;
    const fullResponse = {
      data: [
        {
          type: 'planet',
          id: 'p1'
        }
      ]
    };

    source._query = async function (query) {
      assert.equal(++order, 1, 'action performed after beforeQuery');
      assert.strictEqual(query.expressions, qe, 'query object matches');
      return fullResponse;
    };

    source.on('query', (query, result) => {
      assert.equal(
        ++order,
        2,
        'query triggered after action performed successfully'
      );
      assert.strictEqual(query.expressions, qe, 'query matches');
      assert.deepEqual(result, fullResponse, 'result matches');
    });

    let result = await source.query(qe);

    assert.equal(++order, 3, 'promise resolved last');
    assert.deepEqual(result, fullResponse.data, 'success!');
  });

  test('#query should trigger `queryFail` event after an unsuccessful query', async function (assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;

    source._query = function (query) {
      assert.equal(++order, 1, 'action performed after beforeQuery');
      assert.strictEqual(query.expressions, qe, 'query object matches');
      return Promise.reject(':(');
    };

    source.on('query', () => {
      assert.ok(false, 'query should not be triggered');
    });

    source.on('queryFail', (query, error) => {
      assert.equal(
        ++order,
        2,
        'queryFail triggered after an unsuccessful query'
      );
      assert.strictEqual(query.expressions, qe, 'query matches');
      assert.equal(error, ':(', 'error matches');
    });

    try {
      await source.query(qe);
    } catch (error) {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#query should resolve all promises returned from `beforeQuery` before calling `_query`', async function (assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;

    source.on('beforeQuery', () => {
      assert.equal(++order, 1, 'beforeQuery triggered first');
      return Promise.resolve();
    });

    source.on('beforeQuery', () => {
      assert.equal(++order, 2, 'beforeQuery triggered second');
      return undefined;
    });

    source.on('beforeQuery', () => {
      assert.equal(++order, 3, 'beforeQuery triggered third');
      return Promise.resolve();
    });

    const result1 = [
      {
        type: 'planet',
        id: 'p1'
      }
    ];

    source._query = async function (query) {
      assert.equal(
        ++order,
        4,
        '_query invoked after all `beforeQuery` handlers'
      );
      return { data: result1 };
    };

    source.on('query', () => {
      assert.equal(
        ++order,
        5,
        'query triggered after action performed successfully'
      );
    });

    let result = await source.query(qe);

    assert.equal(++order, 6, 'promise resolved last');
    assert.deepEqual(result, result1, 'success!');
  });

  test('#query should resolve all promises returned from `beforeQuery` and fail if any fail', async function (assert) {
    assert.expect(5);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;

    source.on('beforeQuery', () => {
      assert.equal(++order, 1, 'beforeQuery triggered first');
      return Promise.resolve();
    });

    source.on('beforeQuery', () => {
      assert.equal(++order, 2, 'beforeQuery triggered again');
      return Promise.reject(':(');
    });

    source._query = async function () {
      assert.ok(false, '_query should not be invoked');
      return { data: undefined };
    };

    source.on('query', () => {
      assert.ok(false, 'query should not be triggered');
    });

    source.on('queryFail', () => {
      assert.equal(++order, 3, 'queryFail triggered after action failed');
    });

    try {
      await source.query(qe);
    } catch (error) {
      assert.equal(++order, 4, 'promise failed because no actions succeeded');
      assert.equal(error, ':(', 'failure');
    }
  });

  test('#query should pass a common `hints` object to all `beforeQuery` events and forward it to `_query`', async function (assert) {
    assert.expect(11);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;
    let h: ResponseHints<RecordData, RecordResponse>;

    source.on(
      'beforeQuery',
      async function (
        query: Query<RecordQueryExpression>,
        hints: ResponseHints<RecordData, RecordResponse>
      ) {
        assert.equal(++order, 1, 'beforeQuery triggered first');
        assert.deepEqual(
          hints,
          {},
          'beforeQuery is passed empty `hints` object'
        );
        h = hints;
        hints.data = [
          { type: 'planet', id: 'venus' },
          { type: 'planet', id: 'mars' }
        ];
      }
    );

    source.on(
      'beforeQuery',
      async function (
        query: Query<RecordQueryExpression>,
        hints: ResponseHints<RecordData, RecordResponse>
      ) {
        assert.equal(++order, 2, 'beforeQuery triggered second');
        assert.strictEqual(
          hints,
          h,
          'beforeQuery is passed same hints instance'
        );
      }
    );

    source.on(
      'beforeQuery',
      async function (
        query: Query<RecordQueryExpression>,
        hints: ResponseHints<RecordData, RecordResponse>
      ) {
        assert.equal(++order, 3, 'beforeQuery triggered third');
        assert.strictEqual(
          hints,
          h,
          'beforeQuery is passed same hints instance'
        );
      }
    );

    source._query = async function (
      query: Query<RecordQueryExpression>,
      hints?: ResponseHints<RecordData, RecordResponse>
    ) {
      assert.equal(
        ++order,
        4,
        '_query invoked after all `beforeQuery` handlers'
      );
      assert.strictEqual(hints, h, '_query is passed same hints instance');
      return { data: hints?.data };
    };

    source.on('query', async function () {
      assert.equal(
        ++order,
        5,
        'query triggered after action performed successfully'
      );
    });

    let result = await source.query(qe);

    assert.equal(++order, 6, 'promise resolved last');
    assert.deepEqual(
      result,
      [
        { type: 'planet', id: 'venus' },
        { type: 'planet', id: 'mars' }
      ],
      'success!'
    );
  });

  test('#query can return a full response, with `data` nested in a response object', async function (assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;
    const result1 = [
      {
        type: 'planet',
        id: 'p1'
      }
    ];
    source._query = async function (query) {
      assert.equal(++order, 1, 'action performed after beforeQuery');
      assert.strictEqual(query.expressions, qe, 'query object matches');
      return { data: result1 };
    };

    source.on('query', (query, result) => {
      assert.equal(
        ++order,
        2,
        'query triggered after action performed successfully'
      );
      assert.strictEqual(query.expressions, qe, 'query matches');
      assert.deepEqual(result, { data: result1 }, 'result matches');
    });

    let result = await source.query(qe, { fullResponse: true });

    assert.equal(++order, 3, 'promise resolved last');
    assert.deepEqual(result, { data: result1 }, 'success!');
  });

  test('#query can return a full response, with `data`, `details`, and `sources` nested in a response object', async function (assert) {
    assert.expect(9);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' } as FindRecords;
    const data1 = [
      {
        type: 'planet',
        id: 'p1'
      }
    ];
    const details1 = {
      data: data1,
      links: {
        self: 'https://example.com/api/planets'
      }
    };
    const expectedResult = {
      data: data1,
      details: details1,

      // source-specific responses are based on beforeQuery responses
      sources: {
        remote: { details: details1 }
      }
    };

    source.on('beforeQuery', async (query) => {
      assert.equal(++order, 1, 'beforeQuery triggered first');
      assert.strictEqual(query.expressions, qe, 'beforeQuery: query matches');

      return ['remote', { details: details1 }];
    });

    source._query = async function (query) {
      assert.equal(++order, 2, 'action performed after beforeQuery');
      assert.strictEqual(query.expressions, qe, '_query: query matches');
      return { data: data1, details: details1 };
    };

    source.on('query', (query, result) => {
      assert.equal(
        ++order,
        3,
        'query triggered after action performed successfully'
      );
      assert.strictEqual(query.expressions, qe, 'query: query matches');
      assert.deepEqual(result, expectedResult, 'result matches');
    });

    const result = await source.query(qe, {
      fullResponse: true
    });

    assert.equal(++order, 4, 'request resolved last');
    assert.deepEqual(result, expectedResult, 'success!');
  });
});
