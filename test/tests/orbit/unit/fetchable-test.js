import { successfulOperation, failedOperation } from 'tests/test-helper';
import Fetchable from 'orbit/fetchable';
import Transform from 'orbit/transform';
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

test('it should mixin Tranformable', function(assert) {
  assert.ok(source._transformable, 'should have `_transformable` flag');
});

test('it should resolve as a failure when _fetch fails', function(assert) {
  assert.expect(2);

  source._fetch = function(query) {
    return failedOperation();
  };

  return source.fetch({ fetch: '' })
    .catch((error) => {
      assert.ok(true, 'fetch promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    });
});

test('it should trigger `fetch` event after a successful action in which `_fetch` returns an array of transforms', function(assert) {
  assert.expect(9);

  let order = 0;

  const resultingTransforms = [
    Transform.from({ op: 'addRecord' }, { op: 'addRecord' }),
    Transform.from({ op: 'replaceRecordAttribute' })
  ];

  source._fetch = function(query) {
    assert.equal(++order, 1, 'action performed after willFetch');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query object matches');
    return Promise.resolve(resultingTransforms);
  };

  let transformCount = 0;
  source.on('transform', (transform) => {
    assert.strictEqual(transform, resultingTransforms[transformCount++], 'transform matches');
    return Promise.resolve();
  });

  source.on('fetch', (query, result) => {
    assert.equal(++order, 2, 'fetch triggered after action performed successfully');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query matches');
    assert.strictEqual(result, resultingTransforms, 'result matches');
  });

  return source.fetch({ fetch: ['abc', 'def'] })
    .then((result) => {
      assert.equal(++order, 3, 'promise resolved last');
      assert.strictEqual(result, resultingTransforms, 'success!');
    });
});

test('it should trigger `fetchFail` event after an unsuccessful fetch', function(assert) {
  assert.expect(7);

  let order = 0;

  source._fetch = function(query) {
    assert.equal(++order, 1, 'action performed after willFetch');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query object matches');
    return failedOperation();
  };

  source.on('fetch', () => {
    assert.ok(false, 'fetch should not be triggered');
  });

  source.on('fetchFail', (query, error) => {
    assert.equal(++order, 2, 'fetchFail triggered after an unsuccessful fetch');
    assert.deepEqual(query.expression, { fetch: ['abc', 'def'] }, 'query matches');
    assert.equal(error, ':(', 'error matches');
  });

  return source.fetch({ fetch: ['abc', 'def'] })
    .catch((error) => {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    });
});

test('it should resolve all promises returned from `beforeFetch` before calling `_fetch`', function(assert) {
  assert.expect(7);

  let order = 0;

  const resultingTransforms = [];

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
    return Promise.resolve(resultingTransforms);
  };

  source.on('fetch', () => {
    assert.equal(++order, 5, 'fetch triggered after action performed successfully');
  });

  return source.fetch({ fetch: '' })
    .then((result) => {
      assert.equal(++order, 6, 'promise resolved last');
      assert.strictEqual(result, resultingTransforms, 'success!');
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

  return source.fetch({ fetch: '' })
    .catch((error) => {
      assert.equal(++order, 4, 'promise failed because no actions succeeded');
      assert.equal(error, ':(', 'failure');
    });
});
