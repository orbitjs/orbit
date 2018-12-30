import {
  Source,
  queryable, isQueryable
} from '../../src/index';
import '../test-helper';

const { module, test } = QUnit;

module('@queryable', function(hooks) {
  let source;

  hooks.beforeEach(function() {
    @queryable
    class MySource extends Source {}

    source = new MySource({ name: 'src1' });
  });

  hooks.afterEach(function() {
    source = null;
  });

  test('isQueryable - tests for the application of the @queryable decorator', function(assert) {
    assert.ok(isQueryable(source));
  });

  // TODO
  // test('it should be applied to a Source', function(assert) {
  //   assert.throws(function() {
  //     @queryable
  //     class Vanilla {}
  //   },
  //   Error('Assertion failed: Queryable interface can only be applied to a Source'),
  //   'assertion raised');
  // });

  test('#query should resolve as a failure when _query fails', function(assert) {
    assert.expect(2);

    let qe = { op: 'findRecords', type: 'planet' };

    source._query = function() {
      return Promise.reject(':(');
    };

    return source.query(q => q.findRecords('planet'))
      .catch((error) => {
        assert.ok(true, 'query promise resolved as a failure');
        assert.equal(error, ':(', 'failure');
      });
  });

  test('#query should trigger `query` event after a successful action in which `_query` resolves successfully', function(assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };

    source._query = function(query) {
      assert.equal(++order, 1, 'action performed after willQuery');
      assert.strictEqual(query.expression, qe, 'query object matches');
      return Promise.resolve(':)');
    };

    source.on('query', (query, result) => {
      assert.equal(++order, 2, 'query triggered after action performed successfully');
      assert.strictEqual(query.expression, qe, 'query matches');
      assert.equal(result, ':)', 'result matches');
    });

    return source.query(qe)
      .then((result) => {
        assert.equal(++order, 3, 'promise resolved last');
        assert.equal(result, ':)', 'success!');
      });
  });

  test('#query should trigger `query` event after a successful action in which `_query` just returns (not a promise)', function(assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };

    source._query = function(query) {
      assert.equal(++order, 1, 'action performed after willQuery');
      assert.strictEqual(query.expression, qe, 'query object matches');
      return;
    };

    source.on('query', (query, result) => {
      assert.equal(++order, 2, 'query triggered after action performed successfully');
      assert.strictEqual(query.expression, qe, 'query matches');
      assert.equal(result, undefined, 'result matches');
    });

    return source.query(qe)
      .then((result) => {
        assert.equal(++order, 3, 'promise resolved last');
        assert.equal(result, undefined, 'undefined result');
      });
  });

  test('`query` event should receive results as the last argument, even if they are an array', function(assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };

    source._query = function(query) {
      assert.equal(++order, 1, 'action performed after willQuery');
      assert.strictEqual(query.expression, qe, 'query object matches');
      return new Promise(function(resolve) {
        resolve(['a', 'b', 'c']);
      });
    };

    source.on('query', (query, result) => {
      assert.equal(++order, 2, 'query triggered after action performed successfully');
      assert.strictEqual(query.expression, qe, 'query matches');
      assert.deepEqual(result, ['a', 'b', 'c'], 'result matches');
    });

    return source.query(qe)
      .then((result) => {
        assert.equal(++order, 3, 'promise resolved last');
        assert.deepEqual(result, ['a', 'b', 'c'], 'success!');
      });
  });

  test('#query should trigger `queryFail` event after an unsuccessful query', function(assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };

    source._query = function(query) {
      assert.equal(++order, 1, 'action performed after willQuery');
      assert.strictEqual(query.expression, qe, 'query object matches');
      return Promise.reject(':(');
    };

    source.on('query', () => {
      assert.ok(false, 'query should not be triggered');
    });

    source.on('queryFail', (query, error) => {
      assert.equal(++order, 2, 'queryFail triggered after an unsuccessful query');
      assert.strictEqual(query.expression, qe, 'query matches');
      assert.equal(error, ':(', 'error matches');
    });

    return source.query(qe)
      .catch((error) => {
        assert.equal(++order, 3, 'promise resolved last');
        assert.equal(error, ':(', 'failure');
      });
  });

  test('#query should resolve all promises returned from `beforeQuery` before calling `_query`', function(assert) {
    assert.expect(7);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };

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

    source._query = function() {
      assert.equal(++order, 4, '_query invoked after all `beforeQuery` handlers');
      return Promise.resolve(':)');
    };

    source.on('query', () => {
      assert.equal(++order, 5, 'query triggered after action performed successfully');
    });

    return source.query(qe)
      .then((result) => {
        assert.equal(++order, 6, 'promise resolved last');
        assert.equal(result, ':)', 'success!');
      });
  });

  test('#query should resolve all promises returned from `beforeQuery` and fail if any fail', function(assert) {
    assert.expect(5);

    let order = 0;
    let qe = { op: 'findRecords', type: 'planet' };

    source.on('beforeQuery', () => {
      assert.equal(++order, 1, 'beforeQuery triggered first');
      return Promise.resolve();
    });

    source.on('beforeQuery', () => {
      assert.equal(++order, 2, 'beforeQuery triggered again');
      return Promise.reject(':(');
    });

    source._query = function() {
      assert.ok(false, '_query should not be invoked');
    };

    source.on('query', () => {
      assert.ok(false, 'query should not be triggered');
    });

    source.on('queryFail', () => {
      assert.equal(++order, 3, 'queryFail triggered after action failed');
    });

    return source.query(qe)
      .catch(error => {
        assert.equal(++order, 4, 'promise failed because no actions succeeded');
        assert.equal(error, ':(', 'failure');
      });
  });
});
