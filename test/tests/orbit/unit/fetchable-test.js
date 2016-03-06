import { successfulOperation, failedOperation } from 'tests/test-helper';
import Fetchable from 'orbit/fetchable';
import { Promise } from 'rsvp';

var Source, source;

module('Orbit - Fetchable', {
  setup: function() {
    source = {};
    Fetchable.extend(source);
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

test('it should resolve as a failure when _fetch fails', function(assert) {
  assert.expect(2);

  source._fetch = function(query) {
    return failedOperation();
  };

  stop();
  source.fetch({ fetch: '' })
    .then(
      () => {
        start();
        assert.ok(false, 'fetch should not be resolved successfully');
      },
      (result) => {
        start();
        assert.ok(true, 'fetch promise resolved as a failure');
        assert.equal(result, ':(', 'failure');
      }
    );
});

test('it should trigger `fetch` event after a successful action in which `_fetch` resolves successfully', function(assert) {
  assert.expect(7);

  let order = 0;

  source._fetch = function(query) {
    assert.equal(++order, 1, 'action performed after willFetch');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return successfulOperation();
  };

  source.on('fetch', (query, result) => {
    assert.equal(++order, 2, 'fetch triggered after action performed successfully');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query matches');
    assert.equal(result, ':)', 'result matches');
  });

  stop();
  source.fetch({ fetch: ['abc', 'def'] })
    .then((result) => {
      start();
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(result, ':)', 'success!');
    });
});

test('it should trigger `fetch` event after a successful action in which `_fetch` just returns (not a promise)', function(assert) {
  assert.expect(7);

  let order = 0;

  source._fetch = function(query) {
    assert.equal(++order, 1, 'action performed after willFetch');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return;
  };

  source.on('fetch', (query, result) => {
    equal(++order, 2, 'fetch triggered after action performed successfully');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query matches');
    assert.equal(result, undefined, 'result matches');
  });

  stop();
  source.fetch({ fetch: ['abc', 'def'] })
    .then((result) => {
      start();
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(result, undefined, 'undefined result');
    });
});

test('`fetch` event should receive results as the last argument, even if they are an array', function(assert) {
  assert.expect(7);

  let order = 0;

  source._fetch = function(query) {
    assert.equal(++order, 1, 'action performed after willFetch');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return new Promise(function(resolve, reject) {
      resolve(['a', 'b', 'c']);
    });
  };

  source.on('fetch', (query, result) => {
    equal(++order, 2, 'fetch triggered after action performed successfully');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query matches');
    assert.deepEqual(result, ['a', 'b', 'c'], 'result matches');
  });

  stop();
  source.fetch({ fetch: ['abc', 'def'] })
    .then((result) => {
      start();
      assert.equal(++order, 3, 'promise resolved last');
      assert.deepEqual(result, ['a', 'b', 'c'], 'success!');
    });
});

test('it should trigger `fetchFail` event after an unsuccessful fetch', function(assert) {
  assert.expect(7);

  let order = 0;

  source._fetch = function(query) {
    assert.equal(++order, 1, 'action performed after willFetch');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query object matches');
    return failedOperation();
  };

  source.on('fetch', () => {
    assert.ok(false, 'fetch should not be triggered');
  });

  source.on('fetchFail', (query, error) => {
    assert.equal(++order, 2, 'fetchFail triggered after an unsuccessful fetch');
    assert.deepEqual(query, { fetch: ['abc', 'def'] }, 'query matches');
    assert.equal(error, ':(', 'error matches');
  });

  stop();
  source.fetch({ fetch: ['abc', 'def'] })
    .then(undefined, (error) => {
      start();
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    });
});

test('it should resolve all promises returned from `beforeFetch` before calling `_fetch`', function(assert) {
  assert.expect(7);

  let order = 0;

  source.on('beforeFetch', () => {
    assert.equal(++order, 1, 'beforeFetch triggered first');
    return successfulOperation();
  });

  source.on('beforeFetch', () => {
    assert.equal(++order, 2, 'beforeFetch triggered second');
    return undefined;
  });

  source.on('beforeFetch', () => {
    assert.equal(++order, 3, 'beforeFetch triggered third');
    return successfulOperation();
  });

  source._fetch = function(query) {
    assert.equal(++order, 4, '_fetch invoked after all `beforeFetch` handlers');
    return successfulOperation();
  };

  source.on('fetch', () => {
    assert.equal(++order, 5, 'fetch triggered after action performed successfully');
  });

  stop();
  source.fetch({ fetch: '' })
    .then((result) => {
      start();
      assert.equal(++order, 6, 'promise resolved last');
      assert.equal(result, ':)', 'success!');
    });
});

test('it should resolve all promises returned from `beforeFetch` and fail if any fail', function(assert) {
  assert.expect(5);

  let order = 0;

  source.on('beforeFetch', () => {
    assert.equal(++order, 1, 'beforeFetch triggered first');
    return successfulOperation();
  });

  source.on('beforeFetch', () => {
    assert.equal(++order, 2, 'beforeFetch triggered again');
    return failedOperation();
  });

  source._fetch = function(query) {
    assert.ok(false, '_fetch should not be invoked');
  };

  source.on('fetch', () => {
    assert.ok(false, 'fetch should not be triggered');
  });

  source.on('fetchFail', () => {
    assert.equal(++order, 3, 'fetchFail triggered after action failed');
  });

  stop();
  source.fetch({ fetch: '' })
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
