import Queryable from 'orbit/queryable';
import Source from 'orbit/source';
import { Promise } from 'rsvp';
import { successfulOperation, failedOperation } from 'tests/test-helper';

let source;

module('Orbit - Queryable', {
  setup: function() {
    source = new Source();
    Queryable.extend(source);
  },

  teardown: function() {
    source = null;
  }
});

test('it exists', function(assert) {
  assert.ok(source);
});

test('it should be applied to a Source', function(assert) {
  assert.throws(function() {
    let pojo = {};
    Queryable.extend(pojo);
  },
  Error('Assertion failed: Queryable interface can only be applied to a Source'),
  'assertion raised');
});

test('it should resolve as a failure when _query fails', function(assert) {
  assert.expect(2);

  source._query = function() {
    return failedOperation();
  };

  return source.query({ fetch: '' })
    .catch((error) => {
      assert.ok(true, 'query promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    });
});

test('it should trigger `query` event after a successful action in which `_query` resolves successfully', function(assert) {
  assert.expect(7);

  let order = 0;

  source._query = function(query) {
    assert.equal(++order, 1, 'action performed after willQuery');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query object matches');
    return successfulOperation();
  };

  source.on('query', (query, result) => {
    assert.equal(++order, 2, 'query triggered after action performed successfully');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query matches');
    assert.equal(result, ':)', 'result matches');
  });

  return source.query({ fetch: ['abc', 'def'] })
    .then((result) => {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(result, ':)', 'success!');
    });
});

test('it should trigger `query` event after a successful action in which `_query` just returns (not a promise)', function(assert) {
  assert.expect(7);

  let order = 0;

  source._query = function(query) {
    assert.equal(++order, 1, 'action performed after willQuery');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query object matches');
    return;
  };

  source.on('query', (query, result) => {
    equal(++order, 2, 'query triggered after action performed successfully');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query matches');
    assert.equal(result, undefined, 'result matches');
  });

  return source.query({ fetch: ['abc', 'def'] })
    .then((result) => {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(result, undefined, 'undefined result');
    });
});

test('`query` event should receive results as the last argument, even if they are an array', function(assert) {
  assert.expect(7);

  let order = 0;

  source._query = function(query) {
    assert.equal(++order, 1, 'action performed after willQuery');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query object matches');
    return new Promise(function(resolve) {
      resolve(['a', 'b', 'c']);
    });
  };

  source.on('query', (query, result) => {
    equal(++order, 2, 'query triggered after action performed successfully');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query matches');
    assert.deepEqual(result, ['a', 'b', 'c'], 'result matches');
  });

  return source.query({ fetch: ['abc', 'def'] })
    .then((result) => {
      assert.equal(++order, 3, 'promise resolved last');
      assert.deepEqual(result, ['a', 'b', 'c'], 'success!');
    });
});

test('it should trigger `queryFail` event after an unsuccessful query', function(assert) {
  assert.expect(7);

  let order = 0;

  source._query = function(query) {
    assert.equal(++order, 1, 'action performed after willQuery');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query object matches');
    return failedOperation();
  };

  source.on('query', () => {
    assert.ok(false, 'query should not be triggered');
  });

  source.on('queryFail', (query, error) => {
    assert.equal(++order, 2, 'queryFail triggered after an unsuccessful query');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query matches');
    assert.equal(error, ':(', 'error matches');
  });

  return source.query({ fetch: ['abc', 'def'] })
    .catch((error) => {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    });
});

test('it should resolve all promises returned from `beforeQuery` before calling `_query`', function(assert) {
  assert.expect(7);

  let order = 0;

  source.on('beforeQuery', () => {
    assert.equal(++order, 1, 'beforeQuery triggered first');
    return successfulOperation();
  });

  source.on('beforeQuery', () => {
    assert.equal(++order, 2, 'beforeQuery triggered second');
    return undefined;
  });

  source.on('beforeQuery', () => {
    assert.equal(++order, 3, 'beforeQuery triggered third');
    return successfulOperation();
  });

  source._query = function() {
    assert.equal(++order, 4, '_query invoked after all `beforeQuery` handlers');
    return successfulOperation();
  };

  source.on('query', () => {
    assert.equal(++order, 5, 'query triggered after action performed successfully');
  });

  return source.query({ fetch: '' })
    .then((result) => {
      assert.equal(++order, 6, 'promise resolved last');
      assert.equal(result, ':)', 'success!');
    });
});

test('it should resolve all promises returned from `beforeQuery` and fail if any fail', function(assert) {
  assert.expect(5);

  let order = 0;

  source.on('beforeQuery', () => {
    assert.equal(++order, 1, 'beforeQuery triggered first');
    return successfulOperation();
  });

  source.on('beforeQuery', () => {
    assert.equal(++order, 2, 'beforeQuery triggered again');
    return failedOperation();
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

  return source.query({ fetch: '' })
    .catch(error => {
      assert.equal(++order, 4, 'promise failed because no actions succeeded');
      assert.equal(error, ':(', 'failure');
    });
});
