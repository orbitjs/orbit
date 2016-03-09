import { successfulOperation, failedOperation } from 'tests/test-helper';
import Updatable from 'orbit/updatable';
import Transform from 'orbit/transform';
import { Promise } from 'rsvp';

var Source, source;

module('Orbit - Updatable', {
  setup: function() {
    source = {};
    Updatable.extend(source);
  },

  teardown: function() {
    Source = source = null;
  }
});

test('it exists', function(assert) {
  assert.ok(source);
});

test('it should mixin Updatable', function(assert) {
  assert.ok(source._updatable, 'should have `_updatable` flag');
});

test('it should resolve as a failure when _update fails', function(assert) {
  assert.expect(2);

  source._update = function(query) {
    return failedOperation();
  };

  stop();
  source.update({ addRecord: {} })
    .then(
      () => {
        start();
        assert.ok(false, 'update should not be resolved successfully');
      },
      (result) => {
        start();
        assert.ok(true, 'update promise resolved as a failure');
        assert.equal(result, ':(', 'failure');
      }
    );
});

test('it should trigger `update` event after a successful action in which `_update` returns an array of transforms', function(assert) {
  assert.expect(9);

  let order = 0;

  const addRecordTransform = Transform.from({ op: 'addRecord' });
  const replaceAttributeTransform = Transform.from({ op: 'replaceRecordAttribute' });

  const resultingTransforms = [
    addRecordTransform,
    replaceAttributeTransform
  ];

  source._update = function(transform) {
    assert.equal(++order, 1, 'action performed after willUpdate');
    assert.strictEqual(transform, addRecordTransform, 'transform object matches');
    return Promise.resolve(resultingTransforms);
  };

  let transformCount = 0;
  source.on('transform', (transform) => {
    assert.strictEqual(transform, resultingTransforms[transformCount++], 'transform matches');
    return Promise.resolve();
  });

  source.on('update', (transform, result) => {
    assert.equal(++order, 2, 'update triggered after action performed successfully');
    assert.strictEqual(transform, addRecordTransform, 'transform matches');
    assert.strictEqual(result, resultingTransforms, 'result matches');
  });

  stop();
  source.update(addRecordTransform)
    .then((result) => {
      start();
      assert.equal(++order, 3, 'promise resolved last');
      assert.strictEqual(result, resultingTransforms, 'success!');
    });
});

test('it should trigger `updateFail` event after an unsuccessful update', function(assert) {
  assert.expect(7);

  const addRecordTransform = Transform.from({ op: 'addRecord' });
  const replaceAttributeTransform = Transform.from({ op: 'replaceRecordAttribute' });

  const resultingTransforms = [
    addRecordTransform,
    replaceAttributeTransform
  ];

  let order = 0;

  source._update = function(transform) {
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

  stop();
  source.update(addRecordTransform)
    .then(undefined, (error) => {
      start();
      assert.equal(++order, 3, 'promise resolved last');
      assert.equal(error, ':(', 'failure');
    });
});

test('it should resolve all promises returned from `beforeUpdate` before calling `_update`', function(assert) {
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

  source._update = function(transform) {
    assert.equal(++order, 4, '_update invoked after all `beforeUpdate` handlers');
    return Promise.resolve(resultingTransforms);
  };

  source.on('update', () => {
    assert.equal(++order, 5, 'update triggered after action performed successfully');
  });

  stop();
  source.update(addRecordTransform)
    .then((result) => {
      start();
      assert.equal(++order, 6, 'promise resolved last');
      assert.strictEqual(result, resultingTransforms, 'success!');
    });
});

test('it should resolve all promises returned from `beforeUpdate` and fail if any fail', function(assert) {
  assert.expect(5);

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
    assert.equal(++order, 2, 'beforeUpdate triggered again');
    return failedOperation();
  });

  source._update = function(transform) {
    assert.ok(false, '_update should not be invoked');
  };

  source.on('update', () => {
    assert.ok(false, 'update should not be triggered');
  });

  source.on('updateFail', () => {
    assert.equal(++order, 3, 'updateFail triggered after action failed');
  });

  stop();
  source.update(addRecordTransform)
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
