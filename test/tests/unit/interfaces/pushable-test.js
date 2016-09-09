import Source from 'orbit/source';
import Pushable from 'orbit/interfaces/pushable';
import Transform from 'orbit/transform';
import { Promise } from 'rsvp';
import { successfulOperation, failedOperation } from 'tests/test-helper';

let source;

module('Orbit - Pushable', {
  setup: function() {
    source = new Source({ name: 'src1' });
    Pushable.extend(source);
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
    Pushable.extend(pojo);
  },
  Error('Assertion failed: Pushable interface can only be applied to a Source'),
  'assertion raised');
});

test('it should mixin Pushable', function(assert) {
  assert.ok(source._pushable, 'should have `_pushable` flag');
});

test('it should resolve as a failure when `transform` fails', function(assert) {
  assert.expect(2);

  source._push = function() {
    return failedOperation();
  };

  return source.push({ addRecord: {} })
    .catch((error) => {
      assert.ok(true, 'push promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    });
});

test('it should trigger `push` event after a successful action in which `transform` returns an array of transforms', function(assert) {
  assert.expect(12);

  let order = 0;

  const addRecordTransform = Transform.from({ op: 'addRecord' });
  const replaceAttributeTransform = Transform.from({ op: 'replaceRecordAttribute' });

  const resultingTransforms = [
    addRecordTransform,
    replaceAttributeTransform
  ];

  source.on('beforePush', (transform) => {
    assert.equal(++order, 1, 'beforePush triggered first');
    assert.strictEqual(transform, addRecordTransform, 'transform matches');
  });

  source._push = function(transform) {
    assert.equal(++order, 2, 'action performed after beforePush');
    assert.strictEqual(transform, addRecordTransform, 'transform object matches');
    return Promise.resolve(resultingTransforms);
  };

  let transformCount = 0;
  source.on('transform', (transform) => {
    assert.equal(++order, 3 + transformCount, 'transform triggered after action performed successfully');
    assert.strictEqual(transform, resultingTransforms[transformCount++], 'transform matches');
    return Promise.resolve();
  });

  source.on('push', (transform) => {
    assert.equal(++order, 5, 'push triggered after action performed successfully');
    assert.strictEqual(transform, addRecordTransform, 'transform matches');
  });

  return source.push(addRecordTransform)
    .then((result) => {
      assert.equal(++order, 6, 'promise resolved last');
      assert.deepEqual(result, resultingTransforms, 'applied transforms are returned on success');
    });
});

test('it should trigger `pushFail` event after an unsuccessful push', function(assert) {
  assert.expect(7);

  const addRecordTransform = Transform.from({ op: 'addRecord' });

  let order = 0;

  source._push = function(transform) {
    assert.equal(++order, 1, 'action performed after willPush');
    assert.strictEqual(transform, addRecordTransform, 'transform matches');
    return failedOperation();
  };

  source.on('push', () => {
    assert.ok(false, 'push should not be triggered');
  });

  source.on('pushFail', (transform, error) => {
    assert.equal(++order, 2, 'pushFail triggered after an unsuccessful push');
    assert.strictEqual(transform, addRecordTransform, 'transform matches');
    assert.equal(error, ':(', 'error matches');
  });

  return source.push(addRecordTransform)
    .catch((error) => {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    });
});

test('it should resolve all promises returned from `beforePush` before calling `_push`', function(assert) {
  assert.expect(7);

  let order = 0;

  const addRecordTransform = Transform.from({ op: 'addRecord' });
  const replaceAttributeTransform = Transform.from({ op: 'replaceRecordAttribute' });

  const resultingTransforms = [
    addRecordTransform,
    replaceAttributeTransform
  ];

  source.on('beforePush', () => {
    assert.equal(++order, 1, 'beforePush triggered first');
    return successfulOperation();
  });

  source.on('beforePush', () => {
    assert.equal(++order, 2, 'beforePush triggered second');
    return undefined;
  });

  source.on('beforePush', () => {
    assert.equal(++order, 3, 'beforePush triggered third');
    return successfulOperation();
  });

  source._push = function() {
    assert.equal(++order, 4, '_push invoked after all `beforePush` handlers');
    return Promise.resolve(resultingTransforms);
  };

  source.on('push', () => {
    assert.equal(++order, 5, 'push triggered after action performed successfully');
  });

  return source.push(addRecordTransform)
    .then((result) => {
      assert.equal(++order, 6, 'promise resolved last');
      assert.deepEqual(result, resultingTransforms, 'applied transforms are returned on success');
    });
});

test('it should resolve all promises returned from `beforePush` and fail if any fail', function(assert) {
  assert.expect(5);

  let order = 0;

  const addRecordTransform = Transform.from({ op: 'addRecord' });

  source.on('beforePush', () => {
    assert.equal(++order, 1, 'beforePush triggered first');
    return successfulOperation();
  });

  source.on('beforePush', () => {
    assert.equal(++order, 2, 'beforePush triggered again');
    return failedOperation();
  });

  source._push = function() {
    assert.ok(false, '_push should not be invoked');
  };

  source.on('push', () => {
    assert.ok(false, 'push should not be triggered');
  });

  source.on('pushFail', () => {
    assert.equal(++order, 3, 'pushFail triggered after action failed');
  });

  return source.push(addRecordTransform)
    .catch((error) => {
      assert.equal(++order, 4, 'promise failed because no actions succeeded');
      assert.equal(error, ':(', 'failure');
    });
});
