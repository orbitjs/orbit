import Source from 'orbit/source';
import Updatable from 'orbit/updatable';
import Transform from 'orbit/transform';
import { Promise } from 'rsvp';
import { successfulOperation, failedOperation } from 'tests/test-helper';

let source;

module('Orbit - Updatable', {
  setup: function() {
    source = new Source();
    Updatable.extend(source);
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
    Updatable.extend(pojo);
  },
  Error('Assertion failed: Updatable interface can only be applied to a Source'),
  'assertion raised');
});

test('it should mixin Updatable', function(assert) {
  assert.ok(source._updatable, 'should have `_updatable` flag');
});

test('it should resolve as a failure when `transform` fails', function(assert) {
  assert.expect(2);

  source._transform = function() {
    return failedOperation();
  };

  return source.update({ addRecord: {} })
    .catch((error) => {
      assert.ok(true, 'update promise resolved as a failure');
      assert.equal(error, ':(', 'failure');
    });
});

test('it should trigger `update` event after a successful action in which `transform` returns an array of transforms', function(assert) {
  assert.expect(12);

  let order = 0;

  const addRecordTransform = Transform.from({ op: 'addRecord' });
  const replaceAttributeTransform = Transform.from({ op: 'replaceRecordAttribute' });

  const resultingTransforms = [
    addRecordTransform,
    replaceAttributeTransform
  ];

  source.on('beforeUpdate', (transform) => {
    assert.equal(++order, 1, 'beforeUpdate triggered first');
    assert.strictEqual(transform, addRecordTransform, 'transform matches');
  });

  source._transform = function(transform) {
    assert.equal(++order, 2, 'action performed after beforeUpdate');
    assert.strictEqual(transform, addRecordTransform, 'transform object matches');
    return Promise.resolve(resultingTransforms);
  };

  let transformCount = 0;
  source.on('transform', (transform) => {
    assert.equal(++order, 3 + transformCount, 'transform triggered after action performed successfully');
    assert.strictEqual(transform, resultingTransforms[transformCount++], 'transform matches');
    return Promise.resolve();
  });

  source.on('update', (transform) => {
    assert.equal(++order, 5, 'update triggered after action performed successfully');
    assert.strictEqual(transform, addRecordTransform, 'transform matches');
  });

  return source.update(addRecordTransform)
    .then((result) => {
      assert.equal(++order, 6, 'promise resolved last');
      assert.deepEqual(result, resultingTransforms, 'applied transforms are returned on success');
    });
});

test('it should trigger `updateFail` event after an unsuccessful update', function(assert) {
  assert.expect(7);

  const addRecordTransform = Transform.from({ op: 'addRecord' });

  let order = 0;

  source._transform = function(transform) {
    assert.equal(++order, 1, 'action performed after willUpdate');
    assert.strictEqual(transform, addRecordTransform, 'transform matches');
    return failedOperation();
  };

  source.on('update', () => {
    assert.ok(false, 'update should not be triggered');
  });

  source.on('updateFail', (transform, error) => {
    assert.equal(++order, 2, 'updateFail triggered after an unsuccessful update');
    assert.strictEqual(transform, addRecordTransform, 'transform matches');
    assert.equal(error, ':(', 'error matches');
  });

  return source.update(addRecordTransform)
    .catch((error) => {
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    });
});

test('it should resolve all promises returned from `beforeUpdate` before calling `_transform`', function(assert) {
  assert.expect(7);

  let order = 0;

  const addRecordTransform = Transform.from({ op: 'addRecord' });
  const replaceAttributeTransform = Transform.from({ op: 'replaceRecordAttribute' });

  const resultingTransforms = [
    addRecordTransform,
    replaceAttributeTransform
  ];

  source.on('beforeUpdate', () => {
    assert.equal(++order, 1, 'beforeUpdate triggered first');
    return successfulOperation();
  });

  source.on('beforeUpdate', () => {
    assert.equal(++order, 2, 'beforeUpdate triggered second');
    return undefined;
  });

  source.on('beforeUpdate', () => {
    assert.equal(++order, 3, 'beforeUpdate triggered third');
    return successfulOperation();
  });

  source._transform = function() {
    assert.equal(++order, 4, '_transform invoked after all `beforeUpdate` handlers');
    return Promise.resolve(resultingTransforms);
  };

  source.on('update', () => {
    assert.equal(++order, 5, 'update triggered after action performed successfully');
  });

  return source.update(addRecordTransform)
    .then((result) => {
      assert.equal(++order, 6, 'promise resolved last');
      assert.deepEqual(result, resultingTransforms, 'applied transforms are returned on success');
    });
});

test('it should resolve all promises returned from `beforeUpdate` and fail if any fail', function(assert) {
  assert.expect(5);

  let order = 0;

  const addRecordTransform = Transform.from({ op: 'addRecord' });

  source.on('beforeUpdate', () => {
    assert.equal(++order, 1, 'beforeUpdate triggered first');
    return successfulOperation();
  });

  source.on('beforeUpdate', () => {
    assert.equal(++order, 2, 'beforeUpdate triggered again');
    return failedOperation();
  });

  source._transform = function() {
    assert.ok(false, '_transform should not be invoked');
  };

  source.on('update', () => {
    assert.ok(false, 'update should not be triggered');
  });

  source.on('updateFail', () => {
    assert.equal(++order, 3, 'updateFail triggered after action failed');
  });

  return source.update(addRecordTransform)
    .catch((error) => {
      assert.equal(++order, 4, 'promise failed because no actions succeeded');
      assert.equal(error, ':(', 'failure');
    });
});
