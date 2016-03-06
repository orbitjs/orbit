import { successfulOperation, failedOperation } from 'tests/test-helper';
import Queryable from 'orbit/queryable';
import { Promise } from 'rsvp';

var Source, source;

module('Orbit - Queryable', {
  setup: function() {
    source = {};
    Queryable.extend(source);
  },

  teardown: function() {
    Source = source = null;
  }
});

test('it exists', function(assert) {
  assert.ok(source);
});

test('it should mixin Evented', function(assert) {
  ['on', 'off', 'emit', 'poll'].forEach((prop) => {
    assert.ok(source[prop], 'should have Evented properties');
  });
});

test('it should resolve as a failure when _query fails', function(assert) {
  assert.expect(2);

  source._query = function(query) {
    return failedOperation();
  };

  stop();
  source.query({ fetch: '' })
    .then(
      () => {
        start();
        assert.ok(false, 'query should not be resolved successfully');
      },
      (result) => {
        start();
        assert.ok(true, 'query promise resolved as a failure');
        assert.equal(result, ':(', 'failure');
      }
    );
});

test('it should trigger `query` event after a successful action in which `_query` resolves successfully', function(assert) {
  assert.expect(7);

  let order = 0;

  source._query = function(query) {
    assert.equal(++order, 1, 'action performed after willQuery');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return successfulOperation();
  };

  source.on('query', (query, result) => {
    assert.equal(++order, 2, 'query triggered after action performed successfully');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query matches');
    assert.equal(result, ':)', 'result matches');
  });

  stop();
  source.query({ fetch: ['abc', 'def'] })
    .then((result) => {
      start();
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(result, ':)', 'success!');
    });
});

test('it should trigger `query` event after a successful action in which `_query` just returns (not a promise)', function(assert) {
  assert.expect(7);

  let order = 0;

  source._query = function(query) {
    assert.equal(++order, 1, 'action performed after willQuery');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return;
  };

  source.on('query', (query, result) => {
    equal(++order, 2, 'query triggered after action performed successfully');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query matches');
    assert.equal(result, undefined, 'result matches');
  });

  stop();
  source.query({ fetch: ['abc', 'def'] })
    .then((result) => {
      start();
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(result, undefined, 'undefined result');
    });
});

test('`query` event should receive results as the last argument, even if they are an array', function(assert) {
  assert.expect(7);

  let order = 0;

  source._query = function(query) {
    assert.equal(++order, 1, 'action performed after willQuery');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return new Promise(function(resolve, reject) {
      resolve(['a', 'b', 'c']);
    });
  };

  source.on('query', (query, result) => {
    equal(++order, 2, 'query triggered after action performed successfully');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query matches');
    assert.deepEqual(result, ['a', 'b', 'c'], 'result matches');
  });

  stop();
  source.query({ fetch: ['abc', 'def'] })
    .then((result) => {
      start();
      assert.equal(++order, 3, 'promise resolved last');
      assert.deepEqual(result, ['a', 'b', 'c'], 'success!');
    });
});

test('it should trigger `queryFail` event after an unsuccessful query', function(assert) {
  assert.expect(7);

  let order = 0;

  source._query = function(query) {
    assert.equal(++order, 1, 'action performed after willQuery');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return failedOperation();
  };

  source.on('query', () => {
    assert.ok(false, 'query should not be triggered');
  });

  source.on('queryFail', (query, error) => {
    assert.equal(++order, 2, 'queryFail triggered after an unsuccessful query');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query matches');
    assert.equal(error, ':(', 'error matches');
  });

  stop();
  source.query({ fetch: ['abc', 'def'] })
    .then(undefined, (error) => {
      start();
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

  source._query = function(query) {
    assert.equal(++order, 4, '_query invoked after all `beforeQuery` handlers');
    return successfulOperation();
  };

  source.on('query', () => {
    assert.equal(++order, 5, 'query triggered after action performed successfully');
  });

  stop();
  source.query({ fetch: '' })
    .then((result) => {
      start();
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

  source._query = function(query) {
    assert.ok(false, '_query should not be invoked');
  };

  source.on('query', () => {
    assert.ok(false, 'query should not be triggered');
  });

  source.on('queryFail', () => {
    assert.equal(++order, 3, 'queryFail triggered after action failed');
  });

  stop();
  source.query({ fetch: '' })
    .then(
      () => {
        start();
        assert.ok(false, 'promise should not succeed');
      },
      function(result) {
        start();
        assert.equal(++order, 4, 'promise failed because no actions succeeded');
        assert.equal(result, ':(', 'failure');
      }
    );
});
